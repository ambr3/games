#!/usr/bin/env python3
"""
Generates the Seclusa Munch game icons from the supplied character artwork.

`pacdude.jpeg` is Munch as drawn - gold body, red cap with a forward visor, red and
white sneakers - on the dark navy field he was drawn against. That drawing *is* the
game's icon now, so this crops it and resamples it rather than redrawing it in code.
An icon drawn separately is a second thing to keep in step with the character; one
derived from the artwork cannot drift from it.

Run from the app root:

    python3 scripts/make-munch-icons.py

Reads  pacdude.jpeg
Writes games/pacman/icon/{icon-192,icon-512,ios_icon,favicon}.png

The crop is measured from the artwork, not assumed. The background is taken from the
image's own corners and the character is whatever differs from it by more than a
threshold, so re-exporting the drawing at another size or on another field still finds
the same subject. The threshold sits in the middle of a plateau rather than on its
edge: measured on this export, the bounds barely move between a distance of 12 and 45
(144,192,1073,1047 against 152,200,1071,1043), so 30 has room on both sides and
cannot clip a red cap that happens to sit a shade closer to the field.
"""

import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "pacdude.jpeg")
OUT_DIR = os.path.join(ROOT, "games", "pacman", "icon")

# Empty field added around the character, as a fraction of the subject's larger side.
# The export already carries roughly 12% of margin; this trims it back so the character
# reads at tile size without the subject touching an edge, where a resample would smear
# it into the rounded corner the launcher clips.
MARGIN = 0.08

# Per-channel distance from the background that counts as subject. See the module
# docstring for the measurement behind it.
INK_DISTANCE = 30

# Read from the corners rather than declared, and from a single pixel rather than a
# whole edge: the corners are the one place the field is guaranteed to be field.
CORNER_INSET = 2

# The favicon is 32px. The full figure at 32px is a gold disc with a red smudge on top
# - the arms, legs and mouth are each a pixel. So it is cropped to the head instead,
# which is the part that survives being that small: the cap, the eyes and the mouth.
FAVICON_CROP = 0.66   # of the icon's square, measured from its top edge
FAVICON = 32


def background(im):
    """The colour of the field the character was drawn on, from the four corners."""
    w, h = im.size
    samples = [
        im.getpixel((x, y))
        for x, y in (
            (CORNER_INSET, CORNER_INSET),
            (w - 1 - CORNER_INSET, CORNER_INSET),
            (CORNER_INSET, h - 1 - CORNER_INSET),
            (w - 1 - CORNER_INSET, h - 1 - CORNER_INSET),
        )
    ]
    # The median per channel, so one corner that picked up JPEG noise cannot shift it.
    return tuple(sorted(c[i] for c in samples)[len(samples) // 2] for i in range(3))


def subject_box(im, bg):
    """The bounding box of everything drawn on the field."""
    w, h = im.size
    px = im.load()
    xs, ys = [], []

    # Stepped rather than exhaustive: the subject is hundreds of pixels across, so a
    # 2px grid cannot miss it, and at 1254x1254 the exhaustive scan is slow for no gain.
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            p = px[x, y]
            if sum(abs(p[i] - bg[i]) for i in range(3)) > INK_DISTANCE:
                xs.append(x)
                ys.append(y)

    if not xs:
        raise SystemExit("no subject found in %s" % os.path.basename(SRC))

    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def square_crop(im, box, pad):
    """A square crop containing `box` with `pad` of margin, centred on the subject."""
    left, top, right, bottom = box
    side = int(round(max(right - left, bottom - top) + pad * 2))

    cx = (left + right) // 2
    cy = (top + bottom) // 2
    out = Image.new("RGB", (side, side), background(im))
    out.paste(im.crop((cx - side // 2, cy - side // 2, cx - side // 2 + side,
                       cy - side // 2 + side)), (0, 0))
    return out


def main():
    if not os.path.exists(SRC):
        raise SystemExit("pacdude.jpeg is missing. It is the character artwork.")

    os.makedirs(OUT_DIR, exist_ok=True)
    im = Image.open(SRC).convert("RGB")

    box = subject_box(im, background(im))
    side = max(box[2] - box[0], box[3] - box[1])
    tile = square_crop(im, box, int(side * MARGIN))

    # The head: the top slice of the tile, horizontally centred, taken at the same scale
    # so the cap keeps its proportions rather than being redrawn to fit.
    head_side = int(round(tile.width * FAVICON_CROP))
    head = tile.crop((
        (tile.width - head_side) // 2, 0,
        (tile.width + head_side) // 2, head_side,
    ))

    for name, size in (
        ("icon-192", 192),
        ("icon-512", 512),
        ("ios_icon", 180),
    ):
        # iOS masks the corners itself, so this stays a plain square like every other
        # game's icons; the launcher applies its own border-radius to the tile image.
        tile.resize((size, size), Image.LANCZOS).save(os.path.join(OUT_DIR, name + ".png"))
        print("icon/%s.png  %dx%d" % (name, size, size))

    head.resize((FAVICON, FAVICON), Image.LANCZOS).save(
        os.path.join(OUT_DIR, "favicon.png")
    )
    print("icon/favicon.png  %dx%d  (head crop)" % (FAVICON, FAVICON))


if __name__ == "__main__":
    main()