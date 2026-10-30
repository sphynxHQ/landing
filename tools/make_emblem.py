#!/usr/bin/env python3
"""Sphynx emblem: winged eye crest, generated geometrically."""
import math

CX = 160.0
EYE_Y = 76.0
VW, VH = 320, 150

def n(v):
    return ("%.2f" % v).rstrip("0").rstrip(".")

# ---------------------------------------------------------------- eye
eye = (
    f'<path class="ln" d="M {n(CX-30)} {n(EYE_Y)} '
    f'C {n(CX-18)} {n(EYE_Y-19)} {n(CX+18)} {n(EYE_Y-19)} {n(CX+30)} {n(EYE_Y)} '
    f'C {n(CX+18)} {n(EYE_Y+19)} {n(CX-18)} {n(EYE_Y+19)} {n(CX-30)} {n(EYE_Y)} Z"/>'
    f'<circle class="iris" cx="{n(CX)}" cy="{n(EYE_Y)}" r="9.5"/>'
    f'<circle class="pupil" cx="{n(CX)}" cy="{n(EYE_Y)}" r="3.6"/>'
)

# ---------------------------------------------------------------- wing (right)
# Four stacked feather blades, the upper ones longest, swept slightly upward.
FEATHERS = [
    # (y, half_h, length, rise)
    (78.0, 3.6, 118.0, 26.0),
    (85.5, 3.4, 104.0, 20.0),
    (93.0, 3.2, 88.0, 13.0),
    (100.5, 3.0, 68.0, 7.0),
]
ROOT = CX + 24.0

wing = []
for (fy, hh, ln, rise) in FEATHERS:
    x0 = ROOT
    x1 = ROOT + ln
    ym = fy - rise * 0.5
    yt = fy - rise
    wing.append(
        f'<path class="fw" d="M {n(x0)} {n(fy+hh)} '
        f'C {n(x0+ln*0.45)} {n(fy+hh*0.8)} {n(x1-14)} {n(ym+hh*1.1)} {n(x1-9)} {n(yt+hh*0.55)} '
        f'Q {n(x1)} {n(yt)} {n(x1-9)} {n(yt-hh*0.55)} '
        f'C {n(x1-16)} {n(ym-hh*1.2)} {n(x0+ln*0.45)} {n(fy-hh*0.9)} {n(x0)} {n(fy-hh)} Z"/>'
    )

# shoulder: a small curved shield where the feathers meet the eye
shoulder = (
    f'<path class="ln" d="M {n(CX+22)} {n(EYE_Y-12)} '
    f'C {n(CX+30)} {n(EYE_Y-6)} {n(CX+32)} {n(EYE_Y+6)} {n(CX+24)} {n(EYE_Y+14)}"/>'
)

# gate posts under the wing roots
posts = (
    f'<path class="fw" d="M {n(CX+22)} 104 L {n(CX+22)} 124"/>'
    f'<path class="fw" d="M {n(CX-22)} 104 L {n(CX-22)} 124"/>'
)

right = "".join(wing) + shoulder + posts
left = f'<g transform="translate({n(VW)},0) scale(-1,1)">{right}</g>'

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW} {VH}" width="{VW}" height="{VH}" fill="none">
  <style>
    .ln {{ stroke: #ff2f2f; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }}
    .fw {{ stroke: #ff2f2f; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }}
    .iris {{ stroke: #ff2f2f; stroke-width: 1.4; }}
    .pupil {{ fill: #ff2f2f; }}
  </style>
  {eye}
  {left}
  {right}
</svg>
'''
open("assets/sphinx.svg", "w", encoding="utf8").write(svg)
print("wrote assets/sphinx.svg")
