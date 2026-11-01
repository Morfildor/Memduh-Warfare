"""Shared pixel-art cleaning helpers: hard alpha, palette lock, despeckle."""
from collections import Counter

import numpy as np
from PIL import Image
from scipy import ndimage


def hard_alpha(a, cut=128):
    a = a.copy()
    a[:, :, 3] = np.where(a[:, :, 3] >= cut, 255, 0)
    a[a[:, :, 3] == 0] = 0
    return a


def build_palette(arrs, weights, n):
    px = []
    for a, w in zip(arrs, weights):
        rgb = a[a[:, :, 3] > 0][:, :3]
        px.append(np.repeat(rgb, w, axis=0) if w > 1 else rgb)
    pool = np.concatenate(px)
    if len(pool) > 120000:
        pool = pool[np.random.default_rng(1).choice(len(pool), 120000, replace=False)]
    img = Image.fromarray(pool.reshape(1, -1, 3).astype(np.uint8), "RGB")
    q = img.quantize(colors=n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(q.getpalette()[: n * 3], dtype=np.int32).reshape(-1, 3)
    used = sorted(set(np.array(q).ravel().tolist()))
    return pal[used]


def snap(a, pal):
    out = a.copy()
    m = a[:, :, 3] > 0
    px = a[m][:, :3].astype(np.int32)
    w = np.array([0.30, 0.59, 0.11])
    d = (((px[:, None, :] - pal[None, :, :]) ** 2) * w).sum(axis=2)
    out[m, :3] = pal[d.argmin(axis=1)]
    return out


def despeckle(a, island=12):
    """Replace pixels that match none of their 8 neighbours; drop tiny floating islands."""
    h, w = a.shape[:2]
    out = a.copy()
    key = (a[:, :, 0].astype(np.int64) << 16) | (a[:, :, 1].astype(np.int64) << 8) | a[:, :, 2]
    op = a[:, :, 3] > 0
    for y in range(h):
        for x in range(w):
            if not op[y, x]:
                continue
            same = 0
            cols = []
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if (dy or dx) and 0 <= y + dy < h and 0 <= x + dx < w and op[y + dy, x + dx]:
                        cols.append(key[y + dy, x + dx])
                        same += key[y + dy, x + dx] == key[y, x]
            if same == 0 and len(cols) >= 4:
                k = Counter(cols).most_common(1)[0][0]
                out[y, x, :3] = [(k >> 16) & 255, (k >> 8) & 255, k & 255]
    lab, n = ndimage.label(ndimage.binary_dilation(op, iterations=1))
    for k in range(1, n + 1):
        if (op & (lab == k)).sum() < island:
            out[(lab == k) & op] = 0
    return out


def clean_file(path, colors=24, opaque=False):
    """Palette-lock a single image in place. `opaque` keeps full-frame cards (portraits, icons) solid."""
    a = np.array(Image.open(path).convert("RGBA"))
    if opaque:
        a[:, :, 3] = 255
    else:
        a = hard_alpha(a)
    pal = build_palette([a], [1], colors)
    a = despeckle(snap(a, pal), island=6)
    Image.fromarray(a).save(path)
