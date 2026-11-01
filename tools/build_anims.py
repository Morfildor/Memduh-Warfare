"""Downloads finished Pixellab animation jobs and packs each into a clean 16-frame sheet.

Usage: python -I tools/build_anims.py <jobs.json> <out_dir> <preview_png>
jobs.json: {"name": {"job": "<id>", "pal": "<character group>", "cell": [96, 96], "ref": "median|first",
                     "base": 90, "colors": 32}, ...}

Cleaning pipeline (the generator output carries colour drift and dither noise):
  1. hard alpha (no half-transparent fringes),
  2. one shared palette per character group, quantised from every frame of that character with the
     original base pose weighted heavily, then every pixel is snapped to it,
  3. isolated stray pixels are replaced by their neighbours' colour, tiny floating islands removed,
  4. the whole animation is shifted by ONE offset so natural bounce/sway is preserved.
Each output sheet is 8 columns x 2 rows of cell-sized frames; frame 0 of a job is the input pose.
"""
import io
import json
import os
import sys
import urllib.request
from collections import Counter

import importlib.util

import numpy as np
from PIL import Image

_spec = importlib.util.spec_from_file_location('pixel_clean', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pixel_clean.py'))
pc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pc)

jobs = json.load(open(sys.argv[1], encoding="utf-8"))
out_dir = sys.argv[2]
preview = sys.argv[3]
os.makedirs(out_dir, exist_ok=True)


def fetch(job, idx):
    url = f"https://api.pixellab.ai/mcp/images/{job}/download?index={idx}"
    with urllib.request.urlopen(url, timeout=90) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGBA")


def hard_alpha(im):
    return pc.hard_alpha(np.array(im))


build_palette, snap, despeckle = pc.build_palette, pc.snap, pc.despeckle


def extents(a):
    ys, xs = np.nonzero(a[:, :, 3] > 0)
    return (xs.min(), xs.max(), ys.min(), ys.max()) if len(xs) else None


# ---- fetch -----------------------------------------------------------------------------------
data = {}
for name, spec in jobs.items():
    try:
        data[name] = [hard_alpha(fetch(spec["job"], i)) for i in range(0, 17)]
    except Exception as e:  # noqa: BLE001
        print("skip", name, e)

# ---- palettes per character group ------------------------------------------------------------
groups = {}
for name in data:
    groups.setdefault(jobs[name].get("pal", name), []).append(name)
palettes = {}
for g, names in groups.items():
    arrs, wts = [], []
    for n in names:
        arrs.append(data[n][0])
        wts.append(6)
        arrs.extend(data[n][1:])
        wts.extend([1] * 16)
    ncol = max(jobs[n].get("colors", 32) for n in names)
    palettes[g] = build_palette(arrs, wts, ncol)
    print("palette", g, len(palettes[g]), "colours from", len(names), "anims")

# ---- clean + align + pack --------------------------------------------------------------------
rows = []
for name, frames in data.items():
    spec = jobs[name]
    cw, ch = spec.get("cell", [96, 96])
    base = spec.get("base", ch - 6)
    pal = palettes[spec.get("pal", name)]
    cleaned = [despeckle(snap(f, pal)) for f in frames[1:17]]
    ext = [extents(f) for f in cleaned]
    ok = [e for e in ext if e]
    if not ok:
        print("empty", name)
        continue
    if spec.get("ref", "median") == "first":
        bottom, cx = ok[0][3], (ok[0][0] + ok[0][1]) / 2
    else:
        bottom = float(np.median([e[3] for e in ok]))
        cx = float(np.median([(e[0] + e[1]) / 2 for e in ok]))
    dx, dy = int(round(cw / 2 - cx)), int(round(base - bottom))
    if spec.get("noshift"):
        dx = dy = 0
    sheet = Image.new("RGBA", (cw * 8, ch * 2), (0, 0, 0, 0))
    placed = []
    for n, f in enumerate(cleaned):
        fi = Image.fromarray(f)
        cell = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        cell.paste(fi, (dx + (cw - fi.width) // 2, dy + (ch - fi.height) // 2), fi)
        sheet.paste(cell, (cw * (n % 8), ch * (n // 8)))
        placed.append(cell)
    sheet.save(os.path.join(out_dir, name + ".png"))
    rows.append((name, placed, cw, ch))
    print("ok", name, "shift", (dx, dy))

if rows:
    cw = max(r[2] for r in rows)
    ch = max(r[3] for r in rows)
    pv = Image.new("RGBA", (cw * 8, ch * len(rows)), (86, 128, 170, 255))
    for r, (name, fr, w, h) in enumerate(rows):
        for c in range(8):
            pv.alpha_composite(fr[c * 2], (c * cw, r * ch))
    pv.convert("RGB").save(preview)
