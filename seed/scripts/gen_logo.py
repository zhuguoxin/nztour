#!/usr/bin/env python3
"""
Generate Libretour logo SVGs (transparent background) from a parametric
description of the layered-chevron map-pin mark.

Outputs:
  web/public/libretour-mark.svg   — icon only (the pin), square viewBox
  web/public/libretour-logo.svg   — full lockup: pin + LIBRETOUR + SINCE 2026
  web/public/favicon.svg          — same as mark, for the browser tab

The mark: a teardrop pin whose interior is built from downward-chevron bands,
split down the vertical centre into a darker-green left half and a lighter-
green right half, with transparent gaps between bands and a small tip diamond.
"""

from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUB = ROOT / "web" / "public"

# Palette (sampled from the supplied raster)
DARK = "#1B7A4F"   # left halves
LIGHT = "#46B175"  # right halves
TEXT = "#2C8C5A"   # LIBRETOUR
TEXT2 = "#5FA77E"  # SINCE 2026

# --- Pin geometry (icon coordinate space) ---
CX = 120.0          # centre x
CAP_CY = 116.0      # cap circle centre y
R = 92.0            # cap radius
TIP_Y = 300.0       # pin tip y

# Teardrop silhouette path (used as a clip for the chevron bands).
# Rounded cap on top, sides sweeping down to a point at (CX, TIP_Y).
PIN_PATH = (
    f"M {CX} {TIP_Y} "
    f"C {CX-78} {TIP_Y-92} {CX-R} {CAP_CY+58} {CX-R} {CAP_CY} "
    f"a {R} {R} 0 1 1 {2*R} 0 "
    f"C {CX+R} {CAP_CY+58} {CX+78} {TIP_Y-92} {CX} {TIP_Y} Z"
)


def chevron_half(y_top: float, thickness: float, dip: float, side: str) -> str:
    """One half (left or right of centre) of a downward-chevron band.

    The band's top and bottom edges are parallel V shapes dipping by `dip`
    at the centre. We draw a single half so each side can be a different
    colour; the teardrop clip trims the outer width.
    """
    span = 200.0  # generous; clip trims it
    yb = y_top + thickness
    if side == "left":
        x_out = CX - span
        # top edge: from outer-top up to centre-top (dips down at centre)
        return (
            f"M {x_out} {y_top} "
            f"L {CX} {y_top + dip} "
            f"L {CX} {yb + dip} "
            f"L {x_out} {yb} Z"
        )
    else:
        x_out = CX + span
        return (
            f"M {x_out} {y_top} "
            f"L {CX} {y_top + dip} "
            f"L {CX} {yb + dip} "
            f"L {x_out} {yb} Z"
        )


# Bands: (y_top, thickness, dip). Decreasing as we go down; gaps via the
# y_top steps being larger than thickness.
# Detailed band set — used for the large lockup only.
BANDS_DETAILED = [
    (8.0, 64.0, 28.0),    # dome: y_top above the circle so the clip yields a full rounded cap
    (104.0, 30.0, 24.0),
    (150.0, 26.0, 22.0),
    (190.0, 21.0, 19.0),
]
TIP_DETAILED = (228.0, 16.0, 17.0)

# Simple, bold band set — used for the small mark + favicon + header icon so
# it stays legible at ~24px (only 3 thick bands + a tip, fat gaps).
BANDS_SIMPLE = [
    (6.0, 78.0, 34.0),    # bold dome
    (132.0, 52.0, 34.0),  # middle band
]
TIP_SIMPLE = (222.0, 40.0, 40.0)  # chunky tip wedge

# Active set (overridden per-call in build_mark).
BANDS = BANDS_DETAILED
TIP = TIP_DETAILED


def build_mark(view=240, with_defs_id="pinclip", simple=False) -> str:
    bands = BANDS_SIMPLE if simple else BANDS_DETAILED
    tip = TIP_SIMPLE if simple else TIP_DETAILED
    bands_svg = []
    for (yt, th, dip) in bands:
        bands_svg.append(f'<path d="{chevron_half(yt, th, dip, "left")}" fill="{DARK}"/>')
        bands_svg.append(f'<path d="{chevron_half(yt, th, dip, "right")}" fill="{LIGHT}"/>')
    yt, th, dip = tip
    bands_svg.append(f'<path d="{chevron_half(yt, th, dip, "left")}" fill="{DARK}"/>')
    bands_svg.append(f'<path d="{chevron_half(yt, th, dip, "right")}" fill="{LIGHT}"/>')
    inner = "\n      ".join(bands_svg)
    return f'''<defs>
    <clipPath id="{with_defs_id}">
      <path d="{PIN_PATH}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#{with_defs_id})">
      {inner}
  </g>'''


def write_mark():
    # Detailed mark (large use)
    detailed = build_mark(with_defs_id="pinclip", simple=False)
    (PUB / "libretour-mark.svg").write_text(
        f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" width="240" height="320" role="img" aria-label="Libretour">
  {detailed}
</svg>
'''
    )
    # Simple bold mark (favicon + header)
    simple = build_mark(with_defs_id="pinclip", simple=True)
    simple_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" width="240" height="320" role="img" aria-label="Libretour">
  {simple}
</svg>
'''
    (PUB / "libretour-mark-simple.svg").write_text(simple_svg)
    (PUB / "favicon.svg").write_text(simple_svg)


def write_logo():
    body = build_mark(with_defs_id="pinclipL")
    # Full lockup: pin centred up top, wordmark + tagline below.
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480" width="600" height="480" role="img" aria-label="Libretour — since 2026">
  <g transform="translate(180, 30)">
    {body}
  </g>
  <text x="300" y="410" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="800"
        font-size="64" letter-spacing="4" fill="{TEXT}">LIBRETOUR</text>
  <text x="300" y="452" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="400"
        font-size="24" letter-spacing="10" fill="{TEXT2}">SINCE 2026</text>
</svg>
'''
    (PUB / "libretour-logo.svg").write_text(svg)


if __name__ == "__main__":
    PUB.mkdir(parents=True, exist_ok=True)
    write_mark()
    write_logo()
    print("wrote:")
    for f in ("libretour-mark.svg", "libretour-logo.svg", "favicon.svg"):
        print(f"  web/public/{f}")
