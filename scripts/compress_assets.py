#!/usr/bin/env python3
"""Compress oversized OnSun site image assets to web-logical sizes.

- Backs up each original as {stem}_original{ext} (only once; idempotent).
- Photos (.jpg): cap long edge at 2400px, re-encode progressive JPEG q82.
- Phone mockups (.png, RGBA): cap long edge at 1100px, keep PNG transparency.
- Leaves already-small chrome (favicon, logo, OG card) untouched.
"""
import os
import glob
from PIL import Image

ASSETS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")

# Files to leave alone (small chrome / already-ideal OG card).
SKIP = {"favcon.png", "image 367.png", "Frame 1000004539.png"}

PHOTO_MAX = 2400   # full-bleed hero / blog / OG photos
MOCKUP_MAX = 1100  # phone screenshots (displayed ~320px, plenty for retina)


def backup(path):
    stem, ext = os.path.splitext(path)
    bak = f"{stem}_original{ext}"
    if os.path.exists(bak):
        return bak, False  # already backed up -> already processed
    os.rename(path, bak)
    return bak, True


def fit(im, max_edge):
    w, h = im.size
    scale = max_edge / max(w, h)
    if scale >= 1:
        return im  # already within bounds; still re-encode to strip bloat
    return im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)


def process_photo(name):
    path = os.path.join(ASSETS, name)
    bak, fresh = backup(path)
    if not fresh:
        print(f"  skip (already done): {name}")
        return 0
    before = os.path.getsize(bak)
    im = Image.open(bak)
    if im.mode != "RGB":
        im = im.convert("RGB")
    im = fit(im, PHOTO_MAX)
    im.save(path, "JPEG", quality=82, optimize=True, progressive=True)
    after = os.path.getsize(path)
    print(f"  {name}: {before/1048576:.2f}MB -> {after/1048576:.2f}MB  ({im.size[0]}x{im.size[1]})")
    return before - after


def process_mockup(name):
    path = os.path.join(ASSETS, name)
    bak, fresh = backup(path)
    if not fresh:
        print(f"  skip (already done): {name}")
        return 0
    before = os.path.getsize(bak)
    im = Image.open(bak)
    if im.mode not in ("RGBA", "P"):
        im = im.convert("RGBA")
    im = fit(im, MOCKUP_MAX)
    im.save(path, "PNG", optimize=True)
    after = os.path.getsize(path)
    print(f"  {name}: {before/1048576:.2f}MB -> {after/1048576:.2f}MB  ({im.size[0]}x{im.size[1]})")
    return before - after


def main():
    os.chdir(ASSETS)
    saved = 0

    photos = sorted(glob.glob("*.jpg") + glob.glob("*.jpeg"))
    photos = [p for p in photos if "_original" not in p and p not in SKIP]
    print(f"Photos ({len(photos)}):")
    for p in photos:
        saved += process_photo(p)

    mockups = sorted(
        f for f in glob.glob("*.png")
        if "_original" not in f and f not in SKIP and (
            f.startswith("iMockup") or f.startswith("iPhone")
        )
    )
    print(f"\nMockups ({len(mockups)}):")
    for m in mockups:
        saved += process_mockup(m)

    print(f"\nTotal saved: {saved/1048576:.2f} MB")


if __name__ == "__main__":
    main()
