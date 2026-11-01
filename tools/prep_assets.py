"""Copies the supplied pack's props, pickups, projectiles and portraits into public/assets and
palette-locks them so they match the clean look of the generated characters.
(Characters, enemies and bosses come from tools/build_anims.py.) The pack itself is never modified.

Usage: python -I tools/prep_assets.py <sprite_pack_dir> <public_assets_dir>
"""
import importlib.util
import os
import shutil
import sys

PACK, OUT = sys.argv[1], sys.argv[2]
_spec = importlib.util.spec_from_file_location("pixel_clean", os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_clean.py"))
pc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pc)

# (source folder inside the pack, colours in the palette, keep as an opaque card)
GROUPS = [
    ("projectiles", 14, False),
    ("powerups", 18, True),
    ("portraits/memduh", 22, True),
    ("portraits/npcs", 22, True),
    ("scenery/props", 20, False),
    ("scenery/tiles", 16, False),
]
for sub, colors, opaque in GROUPS:
    dst = os.path.join(OUT, *sub.split("/"))
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(os.path.join(PACK, *sub.split("/")))):
        if not f.endswith(".png"):
            continue
        target = os.path.join(dst, f)
        shutil.copy(os.path.join(PACK, *sub.split("/"), f), target)
        pc.clean_file(target, colors=colors, opaque=opaque)
        print("clean", sub, f)

os.makedirs(os.path.join(OUT, "effects"), exist_ok=True)
for f in ["patlama", "toz"]:
    shutil.copy(os.path.join(PACK, "effects", "strips", f + ".png"), os.path.join(OUT, "effects", f + ".png"))
