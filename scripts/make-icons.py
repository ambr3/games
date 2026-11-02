#!/usr/bin/env python3
"""
Generates the Seclusa Games app icons from the supplied brand sheet.

`brand/icon.png` is the mark reversed out of its rounded black square, as drawn. This
resamples it to the four sizes the manifest declares:

    icons/icon-{192,512}.png             purpose "any"
    icons/icon-maskable-{192,512}.png    purpose "maskable"

The maskable variant is not the same picture scaled down. Android may crop a launcher
icon to a circle, a squircle or a rounded square, and anything outside the central 80%
circle can be lost, so the mark is inset to 72% on a black field that bleeds to all four
edges. The inset black is invisible against the original's own black background, so the
maskable icon looks like the same tile with a little more breathing room rather than a
smaller logo.

Run from the app root:

    python3 scripts/make-icons.py

Reads  brand/icon.png  (written by scripts/extract-brand.py from the supplied artwork)
Writes icons/icon-{192,512}.png and icons/icon-maskable-{192,512}.png
"""

import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_SRC = os.path.join(ROOT, "brand", "icon.png")
OUT_DIR = os.path.join(ROOT, "icons")

# Android's mask can crop to the central 80% circle; 72% keeps the monogram inside it.
MASKABLE_SCALE = 0.72

# Corner radius of the tile, as a fraction of its side. Matches the squircle in the
# supplied sheet.
TILE_RADIUS = 0.225

SIZES = (192, 512)


def tile_mask(size):
    """
    The rounded-square shape of the tile, as a mask.

    Painted rather than assumed. brand/icon.png is a crop of the source sheet taken to
    the artwork's ink bounds, which leaves the sheet's white paper in the four corners
    outside the squircle's curve. Compositing that crop straight through put white corners
    on the shipped icons — a pale notch on a dark launcher, and wrong either way. Painting
    the shape here means the tile is black to its edge whatever the crop contained.
    """
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=int(size * TILE_RADIUS), fill=255
    )
    return m


def supersampled_resample(im, size):
    """LANCZOS rather than PIL's default resample, which is the difference between the
    mark's thin strokes surviving and the thinnest of them being dropped entirely: it is
    thin black line-work on black, and a cheap filter averages the stroke away."""
    return im.resize((size, size), Image.LANCZOS)


def make_tile(src, size):
    """The supplied artwork, clipped to the squircle, on a black field."""
    tile = Image.new("RGB", (size, size), (0, 0, 0))
    tile.paste(supersampled_resample(src, size), (0, 0), tile_mask(size))
    return tile


def make_maskable(src, size):
    out = Image.new("RGB", (size, size), (0, 0, 0))
    inner = int(size * MASKABLE_SCALE)
    mark = supersampled_resample(src, inner)
    off = (size - inner) // 2
    out.paste(mark, (off, off), tile_mask(inner))
    return out


def main():
    if not os.path.exists(ICON_SRC):
        raise SystemExit(
            "brand/icon.png is missing. Run: python3 scripts/extract-brand.py"
        )

    os.makedirs(OUT_DIR, exist_ok=True)
    src = Image.open(ICON_SRC).convert("RGB")

    for size in SIZES:
        make_tile(src, size).save(os.path.join(OUT_DIR, "icon-%d.png" % size))
        make_maskable(src, size).save(
            os.path.join(OUT_DIR, "icon-maskable-%d.png" % size)
        )

        print("icons/icon-%d.png  icons/icon-maskable-%d.png  (%dx%d)" % (size, size, size, size))


if __name__ == "__main__":
    main()