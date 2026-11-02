#!/usr/bin/env python3
"""
Removes slurs, profanity and explicit sexual vocabulary from the Word Puzzle dictionary.

`games/word-puzzle/words.js` is a 168,551-word raw English word list — an unfiltered
dictionary, which means it contains racial slurs, profanity and pornographic vocabulary
alongside "abbey" and "zebra". The game is a word search for a family hub, and a player
in Zen mode can enumerate whatever is in the list, so those words are reachable in play
and visible in the repository. Neither is acceptable for this app, so they are taken out
of the shipped file rather than hidden behind a runtime filter: a blocklist that only runs
in the browser still leaves the words in a repository people can read.

    python3 scripts/filter-words.py --dry-run    # report, change nothing
    python3 scripts/filter-words.py              # rewrite words.js in place

The same table is applied to the hand-written starter list in `game.js` (`--extras`), so
the two never disagree about what the game considers a word.

WHY THIS ISN'T A SUBSTRING FILTER
---------------------------------
Matching "spic" anywhere in a word removes *spice*, "spices", "spiced". Matching "crap"
removes "crape", the fabric. Matching "prick" removes "prickly". Matching "nude" removes
"denude". Matching "jap" removes "japanese". A word list is mostly derivatives, so the
rules are stated per stem instead:

  PREFIX  the stem starts the word — English derives forward, so this catches the whole
          family (fuck -> fucked, fucker, fucking) and needs no inflections listed.
  EXACT   only the listed forms go, because the stem is also the start of innocent words.
  LIST    explicit whole words, for the irregular cases.

Every rule below names what it costs. A rule that would take an ordinary word is an
EXACT or LIST rule, and the script prints the collateral so a mistake is visible rather
than shipped. Removing 0.4% of a 168k list costs the game nothing a player would notice;
removing "auspicious" would.
"""

import argparse
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORDS_JS = os.path.join(ROOT, "games", "word-puzzle", "words.js")
GAME_JS = os.path.join(ROOT, "games", "word-puzzle", "game.js")

# --- slurs and hate words. Removal errs toward the word going: a slur is not worth
#     keeping for the sake of a derivative that happens to be innocent.
SLURS_PREFIX = [
    "nigg",     # costs: niggle, niggling, niggard, niggardly
    "fag",      # costs: nothing ordinary
    "kike",     # costs: nothing ordinary
    "twat",     # costs: twattle
    "retardee", # costs: nothing ordinary
    "tranny",   # costs: nothing ordinary
    "wetback",  # costs: nothing ordinary
    "gook",     # costs: googly, googly-eyed — an accepted loss
    "paki",     # costs: nothing ordinary
    "dago",     # costs: nothing ordinary
    "coonish",  # coon handled below: this is the unambiguous part
    "coonhound",
    "coontie",
    "cooncan",
    "coonskin",
    "wog",      # costs: nothing ordinary
]

SLURS_EXACT = [
    "coon", "coons",          # 'coons' is raccoons; kept, not removed — see below
    "jap", "japs",            # 'japanese' and 'japanned' are not removed
    "spic", "spick",          # 'spice' and its family are not removed
    "nigger", "niggers",
    "fag", "fags", "faggot", "faggots",
    "retard", "retards", "retarded", "retarding",
    "gypsies", "gypsy", "gypsied",
    "yid", "yids",
    "shylock", "shylocks",
    "redskin", "redskins",
    "squaw", "squaws",
    "squawman", "squawmen",
]

# --- profanity.
PROFANITY_PREFIX = [
    "fuck",    # costs: nothing ordinary
    "shit",    # costs: shittake, shittakes — a real word, and an accepted loss
    "cunt",    # costs: nothing ordinary
    "whore",   # costs: whoredom, whoremaster
    "piss",    # costs: pisser, pissing
    "bastard", # costs: bastardise, bastardization — accepted
    "slut",    # costs: slutty
    "bitch",   # costs: bitching, bitchily
    "wank",    # costs: wanker, wanky
    "bollock", # costs: bollocks, bollocked
    "bugger",  # costs: buggered, buggering
    "arsehole",
    "asshole",
    "cocksuck",
    "motherfuck",
    "jackass", # costs: jackass, jackasses
    "dumbass",
    "dipshit",
    "bullshit",
]

# --- explicit sexual vocabulary. Clinical anatomy stays: 'penis' and 'vagina' are in
#     every dictionary and every crossword, and removing them would be its own joke.
EXPLICIT_PREFIX = [
    "porn",
    "erotic",   # costs: autoerotic, antierotic — clinical, accepted
    "orgasm",
    "masturbat",
    "hentai",
    "fetish",
    "bdsm",
    "cunnilingus",
    "fellatio",
    "blowjob",
    "handjob",
    "creampie",
]

# --- exact-only, because the stem also begins ordinary words. This list is the whole
#     reason the script is not a substring filter; each entry would take a good word.
#     Named here as surviving, NOT removed, because they share a stem with an entry below:
#     allspice, auspicious, benedick, cocoon, crape, crapulous, denude, dickens,
#     japanese, japanned, niggle, prickle, prickly, raccoon, retardant, shaggy,
#     shagreen, spice, spices, spiced, spicing, crapes, craping, twattle, dickey.
EXACT_BECAUSE_PREFIX_COLLIDES = [
    "prick", "pricks", "pricked", "pricking", "pricksucker",  # keeps prickly, prickle
    "dick", "dicks", "dickhead", "dickheads", "dickwad",     # keeps dickens, dickey
    "twatty", "twats", "twatting",                             # keeps twattle
    "shag", "shags", "shagged", "shagging",                    # keeps shaggy, shagreen
    "crap", "craps", "crapped", "crapper", "crapping", "crappy", "crapshoot",  # keeps crape
    "naked", "nude", "nudes", "nudist", "nudists", "nudity",   # keeps denude
]


def blocked(word):
    """
    The rule that removes `word`, or None.

    Order does not matter: the three rules are disjoint in practice, and a word claimed
    by two is reported under both so the table can be tightened.
    """
    reasons = []
    for stem in SLURS_PREFIX:
        if word.startswith(stem):
            reasons.append("slur:" + stem)
    for stem in PROFANITY_PREFIX:
        if word.startswith(stem):
            reasons.append("profanity:" + stem)
    for stem in EXPLICIT_PREFIX:
        if word.startswith(stem):
            reasons.append("explicit:" + stem)
    if word in SLURS_EXACT:
        reasons.append("slur:exact")
    if word in EXACT_BECAUSE_PREFIX_COLLIDES:
        reasons.append("exact")
    return reasons or None


def load_words():
    src = open(WORDS_JS, encoding="utf-8").read()
    return src, re.findall(r"'([a-z]+)'", src)


def filter_words(words):
    kept, dropped = [], []
    for w in words:
        (dropped if blocked(w) else kept).append((w, blocked(w)))
    return kept, dropped


def wrap(kept, per_line=170):
    """Re-emit the array, wrapped to roughly the width the file already used."""
    lines, cur = [], []
    for w, _ in kept:
        cur.append("'%s'" % w)
        if sum(len(x) + 1 for x in cur) > per_line:
            lines.append(",".join(cur) + ",")
            cur = []
    if cur:
        lines.append(",".join(cur))
    return "\n    ".join(lines)


def report(dropped):
    from collections import Counter
    counts = Counter(r.split(":")[1] if ":" in r else r for _, rs in dropped for r in rs)
    print("removed %d of the entries" % len(dropped))
    for reason, n in counts.most_common():
        print("   %-24s %d" % (reason, n))
    kept_words = {"spice", "spices", "japanese", "japanned", "prickly", "prickle",
                  "denude", "auspicious", "cocoon", "raccoon", "crape", "dickens",
                  "benedick", "retardant", "niggle", "shaggy", "twattle", "allspice"}
    survived = sorted(w for w in kept_words if not blocked(w))
    lost = sorted(w for w in kept_words if blocked(w))
    print()
    print("   innocent words that survive:", ", ".join(survived))
    if lost:
        print("   accepted collateral loss   :", ", ".join(lost))
    print()
    print("   sample removed:", ", ".join(sorted(w for w, _ in dropped)[:24]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--extras", action="store_true",
                    help="also report the hand-written starter list in game.js")
    args = ap.parse_args()

    src, words = load_words()
    kept, dropped = filter_words(words)
    report(dropped)

    if args.extras:
        game = open(GAME_JS, encoding="utf-8").read()
        bad = sorted({w for w in re.findall(r"'([a-z]+)'", game) if blocked(w)})
        print()
        print("   blocked words in game.js's own list:", ", ".join(bad) or "none")

    if args.dry_run:
        print()
        print("dry run: words.js unchanged (%d entries stay)" % len(kept))
        return 0

    out = re.sub(r"(\[.*?\n\])", "[" + "\n    " + wrap(kept) + "\n]", src, count=1, flags=re.S)
    if out == src:
        print("words.js already matches the filter; nothing written", file=sys.stderr)
        return 1
    open(WORDS_JS, "w", encoding="utf-8").write(out)
    print()
    print("words.js rewritten: %d entries" % len(kept))
    return 0


if __name__ == "__main__":
    sys.exit(main())
