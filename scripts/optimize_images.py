import os
from PIL import Image

BASE_DIR = r"C:\Users\META\.gemini\antigravity\scratch\lankaproperty-lk\public\uploads\properties"

files_to_optimize = [
    "asgiriya-gampaha-hero.jpg",
    "maharagama-janatha-mawatha-1-hero.jpg",
    "maharagama-janatha-mawatha-2-aerial.jpg",
    "maharagama-janatha-mawatha-3-interior.jpg",
    "godigamuwa-dunagaha-1-hero.jpg",
    "godigamuwa-dunagaha-2-verandah.jpg",
    "godigamuwa-dunagaha-3-living.jpg",
    "godigamuwa-dunagaha-4-bed1.jpg",
    "godigamuwa-dunagaha-5-bed2.jpg",
    "godigamuwa-dunagaha-6-bath.jpg",
    "godigamuwa-dunagaha-7-bath2.jpg",
    "godigamuwa-dunagaha-8-garden.jpg"
]

print("--- STARTING IMAGE OPTIMIZATION (65% QUALITY WEBP, MAX 1280px) ---")
total_orig = 0
total_new = 0

for filename in files_to_optimize:
    src_path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(src_path):
        print(f"Skipping missing file: {filename}")
        continue
    
    orig_size = os.path.getsize(src_path)
    total_orig += orig_size
    
    with Image.open(src_path) as im:
        if im.mode in ("RGBA", "P"):
            im = im.convert("RGB")
        
        w, h = im.size
        if w > 1280:
            new_h = int(h * (1280 / w))
            im = im.resize((1280, new_h), Image.Resampling.LANCZOS)
        
        webp_name = os.path.splitext(filename)[0] + ".webp"
        dest_path = os.path.join(BASE_DIR, webp_name)
        im.save(dest_path, "WEBP", quality=65, method=6)
        
        new_size = os.path.getsize(dest_path)
        total_new += new_size
        print(f"Optimized {filename} -> {webp_name}: {orig_size/1024:.1f} KB -> {new_size/1024:.1f} KB (saved {100 - (new_size/orig_size*100):.1f}%)")

print(f"\nTOTAL STORAGE RECLAIMED: {total_orig/1024:.1f} KB -> {total_new/1024:.1f} KB (Overall saving: {100 - (total_new/total_orig*100):.1f}%)")
