#!/usr/bin/env python3
"""
Extracts the Seclusa Games brand assets from the two supplied images.

`new main logo.jpeg` is the lockup - the SG monogram beside the SECLUSA wordmark with
GAMES beneath it - drawn in black on white. `new main game icon.jpeg` is the same monogram
with GAMES under it, reversed out of a rounded black square.

They are separated here rather than by hand so the crops stay exact, then written out as
PNGs with a real alpha channel: the sources are JPEGs, so their "white" is not white, and
treating it as opaque would leave a visible off-white box around the mark on the dark
palette. Alpha comes from luminance, which keeps the antialiased edges the JPEG encoded
instead of hard-thresholding them into jaggies.

The logo is the only one of the three that needs alpha: it sits on whichever palette is
active. The icon is a black tile and stays black - that black is the tile, and the launcher
generates the rounded corners itself from it.

Run from the app root:

    python3 scripts/extract-brand.py

Writes brand/{logo,mark,icon}.png  (the supplied images are left untouched)
"""

import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_SRC = os.path.join(ROOT, "new main logo.jpeg")
ICON_SRC = os.path.join(ROOT, "new main game icon.jpeg")
OUT_DIR = os.path.join(ROOT, "brand")

# Alpha is derived from luminance, so the two levels that matter are the paper the source
# was printed on and the ink it was printed with. Measured from the sources rather than
# assumed: the paper sits at 254, not 255 - JPEG compression and the encoder's chroma
# subsampling put it one or two levels off pure white, and a ramp that ends at 255
# therefore leaves the entire background at a low but non-zero alpha. That reads as a faint
# grey box behind the mark, which is exactly what showed on the launcher.
#
# PAPER sits below the measured 254 so the paper's own noise is cleared to fully
# transparent too; INK is well above the darkest ink so solid strokes stay solid.
# Everything between is the soft edge the JPEG encoded.
PAPER = 248.0  # luminance at or above this is fully transparent
INK = 140.0    # luminance at or below this is fully opaque
INK_CUTOFF = 150   # luminance below this counts as ink when finding bounding boxes
PAPER_CUTOFF = 200  # luminance above this counts as paper when finding bounding boxes


def ink_mask(im):
    """A 1-bit mask of everything darker than INK_CUTOFF."""
    return im.convert("L").point(lambda p: 255 if p < INK_CUTOFF else 0, mode="L")


def alpha_ramp(lum):
    """A point mapping: `lum` -> alpha, linear between INK and PAPER."""
    def alpha(p):
        if p >= PAPER:
            return 0
        if p <= INK:
            return 255
        return int(round((PAPER - p) * 255.0 / (PAPER - INK)))

    return lum.point(alpha)


def bbox(mask):
    """
    The bounding box of a 1-bit mask, ignoring stray specks.

    Rows and columns are scanned inwards, and a run of clear rows or columns in the middle
    of a shape splits nothing - only the outermost edge is trimmed - so a letter's descender
    or the tail of a swoosh cannot be cropped off by a compression artefact. Specks are
    already excluded upstream, by INK_CUTOFF.
    """
    mask = mask.point(lambda p: 255 if p > 127 else 0, mode="L")
    w, h = mask.size
    px = mask.load()

    rows = [y for y in range(h) if any(px[x, y] for x in range(w))]
    cols = [x for x in range(w) if any(px[x, y] for y in range(h))]
    if not rows:
        raise ValueError("no ink found")

    return (cols[0], rows[0], cols[-1] + 1, rows[-1] + 1)


def cut_out(im, box):
    """
    Crops `im` to `box` and turns the paper into transparency.

    The ink is kept black rather than sampled: every source is pure black on white, and
    copying the sampled colour would import the JPEG's chroma noise into it.
    """
    crop = im.crop(box).convert("L")
    out = Image.new("RGBA", crop.size, (0, 0, 0, 0))
    out.putalpha(alpha_ramp(crop))
    out.paste((0, 0, 0, 255), (0, 0, crop.size[0], crop.size[1]), out.split()[3])
    return out


def cut_out_inverted(im, box):
    """As `cut_out`, but for ink that is light on dark: the ink becomes white."""
    crop = im.crop(box).convert("L")
    out = Image.new("RGBA", crop.size, (0, 0, 0, 0))
    out.putalpha(crop.point(lambda p: 255 if p > 127 else 0, mode="L"))
    out.paste((255, 255, 255, 255), (0, 0, crop.size[0], crop.size[1]), out.split()[3])
    return out


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # --- the lockup, on transparent.
    logo_src = Image.open(LOGO_SRC)
    logo_box = bbox(ink_mask(logo_src))
    logo = cut_out(logo_src, logo_box)
    logo.save(os.path.join(OUT_DIR, "logo.png"))
    print("logo.png   %dx%d  (from %s)" % (
        logo.size[0], logo.size[1], os.path.basename(LOGO_SRC)))

    # --- the app icon: the black tile as drawn, paper trimmed.
    icon_src = Image.open(ICON_SRC)
    icon_box = bbox(ink_mask(icon_src))
    # The corners of the tile are the source's white page; filling them with the tile's own
    # black is what makes the launcher generate clean rounded corners from this.
    icon = Image.new("RGB", (icon_box[2] - icon_box[0], icon_box[3] - icon_box[1]), (0, 0, 0))
    icon.paste(icon_src.convert("RGB").crop(icon_box), (0, 0))
    icon.save(os.path.join(OUT_DIR, "icon.png"))
    print("icon.png   %dx%d  (from %s)" % (
        icon.size[0], icon.size[1], os.path.basename(ICON_SRC)))

    # --- the mark alone: the monogram inside the tile, which is white on black, so it is
    #     found by looking for the paper-coloured pixels *inside* the tile rather than the
    #     ink-coloured ones outside it.
    tile = icon_src.convert("L").crop(icon_box)
    paper_mask = tile.point(lambda p: 255 if p > PAPER_CUTOFF else 0, mode="L")

    # The monogram and the GAMES under it are separated by a band of solid black, so the
    # widest clear run inside the tile's upper two thirds is that gap. Taking the run
    # rather than a fixed fraction is what keeps the mark from growing a chin if the
    # artwork is ever re-exported at a different scale.
    w, h = paper_mask.size
    px = paper_mask.load()
    rows_clear = [not any(px[x, y] for x in range(0, w, 2)) for y in range(int(h * 0.72))]

    gap_start, best_start, best_len = 0, 0, 0
    for y, clear in enumerate(rows_clear + [False]):
        if clear:
            if not gap_start:
                gap_start = y + 1
        else:
            if gap_start and y - gap_start > best_len:
                best_start, best_len = gap_start, y - gap_start
            gap_start = 0
    if not best_len:
        raise ValueError("no gap found between the monogram and the wordmark")

    # Everything above the gap is the monogram; its own bounding box is the mark.
    above = paper_mask.crop((0, 0, w, best_start))
    mark_box = bbox(above)
    mark = cut_out_inverted(tile, mark_box)
    mark.save(os.path.join(OUT_DIR, "mark.png"))
    print("mark.png   %dx%d  (from %s)" % (
        mark.size[0], mark.size[1], os.path.basename(ICON_SRC)))


if __name__ == "__main__":
    main()