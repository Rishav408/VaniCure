"""
Download ESC-50 dataset and sort relevant classes for VaniCure training.

ESC-50 classes used:
  - "coughing" (class 24)     → tb/       (pathological cough proxy)
  - "sneezing" (class 23)     → tb/       (respiratory distress proxy)
  - "breathing" (class 34)    → asthma/   (labored breathing proxy)
  - "laughing" (class 21)     → healthy/  (healthy vocal sounds)
  - "clapping" (class 22)     → healthy/  (non-pathological control)
  - "drinking_sipping" (38)   → healthy/  (non-pathological control)

This gives ~120 samples per category (tb/asthma get augmented later).
"""
import os
import csv
import shutil
import zipfile
import urllib.request
from pathlib import Path

ESC50_URL = "https://github.com/karolpiczak/ESC-50/archive/refs/heads/master.zip"
DOWNLOAD_DIR = Path(__file__).parent / ".." / "data" / "esc50_download"
RAW_DIR = Path(__file__).parent / ".." / "data" / "coswara_raw"

# ESC-50 class name → our label folder
CLASS_MAP = {
    "coughing":          "tb",
    "sneezing":          "tb",
    "breathing":         "asthma",
    "crackling_fire":    None,  # skip
    "laughing":          "healthy",
    "clapping":          "healthy",
    "drinking_sipping":  "healthy",
}


def download_esc50():
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = DOWNLOAD_DIR / "esc50.zip"

    if zip_path.exists():
        print(f"[ESC-50] Zip already exists at {zip_path}, skipping download.")
    else:
        print(f"[ESC-50] Downloading from GitHub (~600 MB, please wait)...")
        urllib.request.urlretrieve(ESC50_URL, str(zip_path), _progress)
        print(f"\n[ESC-50] Download complete: {zip_path}")

    # Extract
    extract_dir = DOWNLOAD_DIR / "extracted"
    if not extract_dir.exists():
        print("[ESC-50] Extracting zip...")
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(str(extract_dir))
        print("[ESC-50] Extraction complete.")

    # Find the extracted root (usually ESC-50-master/)
    subdirs = list(extract_dir.iterdir())
    esc_root = subdirs[0] if len(subdirs) == 1 else extract_dir
    return esc_root


def _progress(block_num, block_size, total_size):
    downloaded = block_num * block_size
    pct = min(100, downloaded * 100 // total_size)
    mb = downloaded / (1024 * 1024)
    total_mb = total_size / (1024 * 1024)
    print(f"\r  [{pct:3d}%] {mb:.1f} / {total_mb:.1f} MB", end="", flush=True)


def sort_files(esc_root: Path):
    """Read ESC-50 metadata CSV and copy relevant WAVs into our structure."""
    meta_path = esc_root / "meta" / "esc50.csv"
    audio_dir = esc_root / "audio"

    if not meta_path.exists():
        print(f"[ESC-50] ERROR: metadata not found at {meta_path}")
        return

    # Create output folders
    for folder in ["healthy", "tb", "asthma"]:
        (RAW_DIR / folder).mkdir(parents=True, exist_ok=True)

    counts = {"healthy": 0, "tb": 0, "asthma": 0}

    with open(meta_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            class_name = row["category"]
            if class_name not in CLASS_MAP or CLASS_MAP[class_name] is None:
                continue

            target_label = CLASS_MAP[class_name]
            src = audio_dir / row["filename"]
            if not src.exists():
                continue

            dst = RAW_DIR / target_label / f"{class_name}_{row['filename']}"
            shutil.copy2(str(src), str(dst))
            counts[target_label] += 1

    print(f"\n[ESC-50] Files sorted into {RAW_DIR}:")
    for label, count in counts.items():
        print(f"  {label}/: {count} files")
    print(f"  Total: {sum(counts.values())} files")


if __name__ == "__main__":
    esc_root = download_esc50()
    sort_files(esc_root)
    print("\n[ESC-50] ✅ Done! Ready for preprocessing.")
    print(f"  Next step: cd model_training && python preprocess.py")
