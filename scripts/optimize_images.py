import os
from PIL import Image

UPLOADS_DIR = os.path.join("public", "uploads", "properties")
MAX_WIDTH = 1280
WEBP_QUALITY = 65

# Map high-resolution 800x533 Godigamuwa source photos to their canonical WebP filenames
GODIGAMUWA_HD_MAP = {
    "lp_1794897927987_defb52ee7958.webp": "godigamuwa-dunagaha-1-hero.webp",
    "lp_1794897927982_11cf5c53a1a9.webp": "godigamuwa-dunagaha-2-verandah.webp",
    "lp_1794897927871_6534bd851f22.webp": "godigamuwa-dunagaha-3-living.webp",
    "lp_1794897927869_1d35ddc9ad7d.webp": "godigamuwa-dunagaha-4-bed1.webp",
    "lp_1794897927867_5543d86b7067.webp": "godigamuwa-dunagaha-5-bed2.webp",
    "lp_1794897927865_4ddecbd91bdc.webp": "godigamuwa-dunagaha-6-bath.webp",
    "lp_1794897927856_14f913e54e8c.webp": "godigamuwa-dunagaha-7-bath2.webp",
    "lp_1794897927838_de40cf5d3a89.webp": "godigamuwa-dunagaha-8-garden.webp",
}

OTHER_JPG_MAP = {
    "asgiriya-gampaha-hero.jpg": "asgiriya-gampaha-hero.webp",
    "maharagama-janatha-mawatha-1-hero.jpg": "maharagama-janatha-mawatha-1-hero.webp",
    "maharagama-janatha-mawatha-2-aerial.jpg": "maharagama-janatha-mawatha-2-aerial.webp",
    "maharagama-janatha-mawatha-3-interior.jpg": "maharagama-janatha-mawatha-3-interior.webp",
}

def compress_to_webp(src_name: str, dst_name: str):
    src_path = os.path.join(UPLOADS_DIR, src_name)
    dst_path = os.path.join(UPLOADS_DIR, dst_name)
    if not os.path.exists(src_path):
        print(f"SKIP (missing): {src_name}")
        return 0, 0

    orig_size = os.path.getsize(src_path)
    with Image.open(src_path) as img:
        img = img.convert("RGB")
        w, h = img.size
        if w > MAX_WIDTH:
            new_h = int(h * (MAX_WIDTH / w))
            img = img.resize((MAX_WIDTH, new_h), Image.Resampling.LANCZOS)
        img.save(dst_path, "WEBP", quality=WEBP_QUALITY, method=6)

    new_size = os.path.getsize(dst_path)
    saved_pct = ((orig_size - new_size) / orig_size * 100) if orig_size > 0 else 0
    print(f"OK {dst_name} ({img.size[0]}x{img.size[1]}): {orig_size/1024:.1f} KB -> {new_size/1024:.1f} KB ({saved_pct:.1f}% saved)")
    return orig_size, new_size

def main():
    total_orig = 0
    total_new = 0
    for src, dst in {**GODIGAMUWA_HD_MAP, **OTHER_JPG_MAP}.items():
        o, n = compress_to_webp(src, dst)
        total_orig += o
        total_new += n

    print(f"\nTotal: {total_orig/1024:.1f} KB -> {total_new/1024:.1f} KB ({((total_orig-total_new)/total_orig*100) if total_orig else 0:.1f}% reduction)")

if __name__ == "__main__":
    main()
