#!/usr/bin/env python3
"""
Tests for scripts/serve.py and the document CSP metas.

    python3 scripts/test_serve.py

The app publishes to GitHub Pages. Document CSP lives in each HTML `<meta>` tag.
The local server sends framing and hardening headers only — no Content-Security-Policy
response header — so meta policy is what the browser sees, matching production.
"""

import base64
import hashlib
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import serve  # noqa: E402

ROOT = serve.ROOT
GAMES = list(serve.GAMES)

failures = []
checks = 0


def check(condition, description):
    global checks
    checks += 1
    if not condition:
        failures.append(description)


def read(path):
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def parse_policy(text):
    out = {}
    for directive in text.split(";"):
        parts = directive.split()
        if parts:
            out[parts[0]] = " ".join(parts[1:])
    return out


def read_meta_csp(document):
    match = re.search(
        r'<meta\s+http-equiv="Content-Security-Policy"\s*\n?\s*content="([^"]+)"',
        document,
    )
    return None if not match else parse_policy(match.group(1))


# --- framing --------------------------------------------------------------------

LAUNCHER_PATHS = [
    "/",
    "/index.html",
    "/theme.css",
    "/sw.js",
    "/manifest.json",
    "/offline.html",
    "/games/",
    "/robots.txt",
]

for path in LAUNCHER_PATHS:
    headers = serve.POLICY.for_path(path)
    check(
        headers.get("X-Frame-Options") == "DENY",
        f"{path}: launcher must be DENY, got {headers.get('X-Frame-Options')!r}",
    )
    check(
        "Content-Security-Policy" not in headers,
        f"{path}: must not send a CSP header (meta is the source of truth)",
    )

for game in GAMES:
    for path in [f"/games/{game}/", f"/games/{game}/index.html", f"/games/{game}/sw.js"]:
        headers = serve.POLICY.for_path(path)
        # sw.js only exists for blockfall and word-puzzle; the path rule still applies.
        check(
            headers.get("X-Frame-Options") == "SAMEORIGIN",
            f"{path}: game must be SAMEORIGIN, got {headers.get('X-Frame-Options')!r}",
        )
        check(
            "Content-Security-Policy" not in headers,
            f"{path}: must not send a CSP header",
        )
    check(
        serve.POLICY.for_path(f"/games/{game}/index.html").get("X-Robots-Tag")
        == "noindex, nofollow",
        f"{game}: X-Robots-Tag must be present",
    )

# cards/test is not a shipped game — must stay DENY like the launcher, and still
# send no CSP so tests.html's own connect-src 'self' meta can fetch fixtures.
test_headers = serve.POLICY.for_path("/games/cards/test/tests.html")
check(
    test_headers.get("X-Frame-Options") == "DENY",
    "cards/test must not inherit a game SAMEORIGIN rule",
)
check(
    "Content-Security-Policy" not in test_headers,
    "cards/test must not get a CSP header that would kill connect-src 'self'",
)

# --- cache / hardening ----------------------------------------------------------

for path in LAUNCHER_PATHS + [f"/games/{game}/index.html" for game in GAMES]:
    headers = serve.POLICY.for_path(path)
    check(
        "no-store" in headers.get("Cache-Control", ""),
        f"{path}: response must be no-store, got {headers.get('Cache-Control')!r}",
    )
    check(
        "Strict-Transport-Security" not in headers,
        f"{path}: must not send HSTS over plain HTTP",
    )
    check("Pragma" in headers and "Expires" in headers, f"{path}: missing Pragma/Expires")
    check(headers.get("X-Content-Type-Options") == "nosniff", f"{path}: missing nosniff")
    check(headers.get("Referrer-Policy") == "no-referrer", f"{path}: missing referrer policy")

# --- document meta CSP ----------------------------------------------------------

DOCUMENTS = [
    "index.html",
    "offline.html",
    "games/blockfall/index.html",
    "games/blockfall/offline.html",
    "games/klondike/index.html",
    "games/pyramid/index.html",
    "games/pacman/index.html",
    "games/word-puzzle/index.html",
    "games/word-puzzle/offline.html",
]

index_csp = read_meta_csp(read(os.path.join(ROOT, "index.html")))
check(index_csp is not None, "index.html: no CSP meta found")
if index_csp:
    check(index_csp.get("frame-src") == "'self'", "index.html: needs frame-src 'self'")
    check(index_csp.get("child-src") == "'self'", "index.html: needs child-src 'self'")
    check(index_csp.get("connect-src") == "'none'", "index.html: connect-src 'none'")
    check(
        index_csp.get("upgrade-insecure-requests") == "",
        "index.html: upgrade-insecure-requests must be present",
    )
    check(
        "frame-ancestors" not in index_csp,
        "index.html: frame-ancestors is ignored in a <meta> and must not be declared",
    )

blockfall_csp = read_meta_csp(read(os.path.join(ROOT, "games/blockfall/index.html")))
check(
    blockfall_csp is not None and blockfall_csp.get("media-src") == "'none'",
    "blockfall must keep media-src 'none'",
)

for relative in DOCUMENTS:
    meta = read_meta_csp(read(os.path.join(ROOT, relative)))
    check(meta is not None, f"{relative}: no CSP meta found")
    if meta is None:
        continue
    check(
        "frame-ancestors" not in meta,
        f"{relative}: frame-ancestors must not be declared in a <meta>",
    )
    check(
        meta.get("connect-src") == "'none'",
        f"{relative}: the privacy promise rests on connect-src 'none'",
    )
    check(
        meta.get("upgrade-insecure-requests") == "",
        f"{relative}: upgrade-insecure-requests must be present",
    )
    check(
        "unsafe-inline" not in meta.get("style-src", ""),
        f"{relative}: 'unsafe-inline' — offline.html's style is allowed by hash instead",
    )

# offline.html style hash must match the inline <style>
offline_html = read(os.path.join(ROOT, "offline.html"))
offline_csp = read_meta_csp(offline_html)
style_match = re.search(r"<style>([^<]*)</style>", offline_html)
check(style_match is not None, "offline.html: no inline <style> found to hash")
if style_match and offline_csp:
    digest = (
        base64.b64encode(hashlib.sha256(style_match.group(1).encode("utf-8")).digest())
        .decode()
    )
    quoted = "'sha256-%s'" % digest
    check(
        quoted in offline_csp.get("style-src", ""),
        f"offline.html: the <meta> does not allow the hash of its own <style> ({quoted})",
    )

for doc in ["index.html", "offline.html"]:
    text = read(os.path.join(ROOT, doc))
    check("no-referrer" in text, f"{doc}: must set a no-referrer referrer policy")
    check(
        re.search(r"http://(?!localhost|127\.0\.0\.1)", text) is None,
        f"{doc}: an http:// URL — every external reference must be https",
    )

# --- report --------------------------------------------------------------------

for failure in failures:
    print(f"  FAIL  {failure}")

print(f"\n{checks - len(failures)}/{checks} checks passed")
sys.exit(1 if failures else 0)
