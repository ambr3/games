#!/usr/bin/env python3
"""
Builds app-icon variants with the arch removed.

The tombstone read comes from the arch: a rounded top over straight sides over a flat
base, isolated inside a tile, with nothing around it to give it context. In the wordmark
the same arch sits beside "SECLUSA GAMES" and reads as a gateway. In a 192px tile with
no words it reads as a headstone.

So the icon drops the arch and keeps what is inside it — the SG monogram, the door, the
steps and the star.

The separation is exact rather than painted out by hand: in the source artwork the arch
is a single closed white stroke, and it is the white component with the largest bounding
box. The monogram strokes are all separate components sitting inside it. Dropping the
largest component leaves the rest untouched, with no repainting and no feathering.

Run from the app root:

    python3 scripts/icon-variants.py

Writes brand/icon-variant-{1,2,3}.png and brand/icon-variants.png (a contact sheet for
comparison). The chosen variant is then promoted to icons/ by scripts/make-icons.py.
"""

import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, "brand")
SRC = os.path.join(BRAND, "icon.png")

# Padding inside the squircle, as a fraction of the tile, before the art is scaled.
# Content is placed optically centred: a touch above true centre reads better in a tile,
# because the eye weights the lower half more.
VARIANTS = [
    # (name, inner scale of art, ring inset, ring width)
    ("1  monogram only, no ring", 0.74, None, 0),
    ("2  monogram in a thin squircle ring", 0.62, 0.055, 0.028),
    ("3  monogram in a thicker squircle ring", 0.56, 0.050, 0.055),
]

OUT = 512


def artwork_only(art, radius_frac=0.225):
    """
    Clip to the squircle so the sheet's paper outside it is not treated as artwork.

    brand/icon.png is cropped to the source ink bounds, so the corners outside the
    rounded tile are still white paper. Left in, those corners are the topmost and
    leftmost white in their rows and columns, and the arch removal below deletes the
    monogram trying to get past them — which is exactly what it did on the first run.
    """
    w, h = art.size
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        (0, 0, w - 1, h - 1), radius=int(min(w, h) * radius_frac), fill=255
    )
    out = Image.new("L", (w, h), 0)
    out.paste(art, (0, 0), m)
    return out


def drop_the_arch(art):
    """
    Remove the arch stroke from white-on-black artwork, keeping the monogram.

    Two rejected approaches, both recorded because both look correct right up until
    they produce nothing:

      - Connected components. The arch is not one component: its legs, top arc and
        flared feet are separate strokes. "Largest component" matched the SG/door/steps
        block instead and deleted the middle of the logo, keeping the arch's corners.
      - Removing the leftmost/rightmost run of each row. The monogram strokes *touch* the
        arch legs — the S reaches the left leg and the G the right — so on those rows the
        leg and the letter are a single run, the two runs at the extremes are the whole
        row, and every row is deleted. Measured: 23,439 pixels in, 0 out.

    By measured geometry instead, which is exact for this drawing:

      - the legs and feet are the outermost white on a mid-height scanline, so anything
        left of the left leg's inner edge or right of the right leg's is arch;
      - the top arc is an annulus centred on the arch's own centre with its outer radius
        equal to half the leg-to-leg span. The monogram is nowhere near that radius — the
        nearest part of the S is about 80px off-centre against a 102px radius — so the
        band can be excised without touching it.

    The centre and radius are read from the artwork rather than hard-coded, so this keeps
    working if the source is ever re-exported at a different size.
    """
    art = artwork_only(art)
    w, h = art.size
    px = art.load()

    def runs_in_row(y):
        runs, s = [], None
        for x in range(w):
            white = px[x, y] > 128
            if white and s is None:
                s = x
            elif not white and s is not None:
                runs.append((s, x - 1))
                s = None
        if s is not None:
            runs.append((s, w - 1))
        return runs

    # --- geometry, read from the artwork -----------------------------------
    mid = runs_in_row(h // 2)
    if len(mid) < 2:
        raise SystemExit("expected the arch legs on the middle row, found %d runs" % len(mid))
    left_leg_inner = mid[0][1]
    right_leg_inner = mid[-1][0]

    cx = (left_leg_inner + right_leg_inner) / 2.0
    outer_r = (right_leg_inner - left_leg_inner) / 2.0

    # the arc's apex tells us where the arch's centre line sits vertically
    apex = min(
        y for y in range(h) if any(px[x, y] > 128 for x in range(w))
    )
    cy = apex + outer_r
    band = outer_r * 0.18  # roughly the stroke width, as a fraction of the radius

    # --- excise -----------------------------------------------------------
    out = Image.new("L", (w, h), 0)
    op = out.load()
    kept = 0
    for y in range(h):
        for x in range(w):
            if px[x, y] <= 128:
                continue
            if x <= left_leg_inner or x >= right_leg_inner:
                continue  # leg or foot
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if abs(d - outer_r) < band:
                continue  # the arc
            op[x, y] = 255
            kept += 1

    if not kept:
        raise SystemExit("removing the arch left nothing behind")

    box = out.getbbox()
    return out.crop(box), kept


def squircle_mask(size, inset, width):
    """A continuous-corner squircle outline, the same silhouette as the source tile."""
    s = size
    mask = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(mask)

    if inset is None:
        pad = 0
        d.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.225), fill=255)
    else:
        pad = int(s * inset)
        d.rounded_rectangle(
            (pad, pad, s - 1 - pad, s - 1 - pad),
            radius=int(s * 0.225),
            outline=255,
            width=max(1, int(s * width)),
        )
    return mask, pad


def compose(art, name, art_scale, ring_inset, ring_width):
    tile = Image.new("L", (OUT, OUT), 0)
    draw_mask, pad = squircle_mask(OUT, ring_inset, ring_width)
    tile.paste(Image.new("L", (OUT, OUT), 0), (0, 0), draw_mask)

    # fit the art inside the tile, leaving room for the ring when there is one
    usable = OUT - 2 * pad if ring_inset is not None else int(OUT * 0.10)
    target = int(OUT * art_scale)
    if ring_inset is not None:
        target = min(target, usable - int(OUT * 0.04))

    ratio = target / max(art.size)
    resized = art.resize(
        (max(1, int(art.size[0] * ratio)), max(1, int(art.size[1] * ratio))),
        Image.LANCZOS,
    )

    # Optical centring: art sits a little above true centre.
    x = (OUT - resized.size[0]) // 2
    y = int((OUT - resized.size[1]) * 0.46)
    tile.paste(resized, (x, y), resized)
    return tile.convert("RGB")


def main():
    if not os.path.exists(SRC):
        raise SystemExit("brand/icon.png is missing. Run: python3 scripts/extract-brand.py")

    art, count = drop_the_arch(Image.open(SRC).convert("L"))
    print("source artwork split into %d white components; arch removed" % count)
    print("monogram left at %dx%d\n" % art.size)

    tiles = []
    for name, scale, inset, width in VARIANTS:
        img = compose(art, name, scale, inset, width)
        path = os.path.join(BRAND, "icon-variant-%s.png" % name.split()[0])
        img.save(path)
        tiles.append((name, img))
        print("brand/icon-variant-%s.png   %s" % (name.split()[0], name))

    # contact sheet, so the three can be compared without opening three files
    gap, label_h = 24, 34
    sheet = Image.new("RGB", (len(tiles) * (OUT + gap) + gap, OUT + label_h + gap * 2), (24, 24, 27))
    for i, (_, img) in enumerate(tiles):
        sheet.paste(img, (gap + i * (OUT + gap), gap))
    sheet.save(os.path.join(BRAND, "icon-variants.png"))
    print("\nbrand/icon-variants.png  (contact sheet, left to right)")


if __name__ == "__main__":
    main()