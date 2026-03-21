"""
Download PANNs CNN14 pretrained checkpoint from Zenodo.
Run this script once from the server/ directory:

    python download_models.py
"""

import os
import urllib.request
import hashlib

# Model download URL (Zenodo)
CHECKPOINT_URL = "https://zenodo.org/record/3987831/files/Cnn14_mAP%3D0.431.pth?download=1"
CHECKPOINT_DIR = os.path.join(os.path.dirname(__file__), "checkpoints")
CHECKPOINT_PATH = os.path.join(CHECKPOINT_DIR, "Cnn14_mAP=0.431.pth")
EXPECTED_SIZE_MB = 312


def show_progress(block_num, block_size, total_size):
    downloaded = block_num * block_size
    if total_size > 0:
        percent = min(100, downloaded * 100 / total_size)
        downloaded_mb = downloaded / (1024 * 1024)
        total_mb = total_size / (1024 * 1024)
        bar = "█" * int(percent // 2) + "░" * (50 - int(percent // 2))
        print(f"\r  [{bar}] {percent:.1f}%  {downloaded_mb:.1f}/{total_mb:.1f} MB", end="", flush=True)


def download_panns():
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)

    if os.path.exists(CHECKPOINT_PATH):
        size_mb = os.path.getsize(CHECKPOINT_PATH) / (1024 * 1024)
        print(f"✅ PANNs checkpoint already exists at:\n   {CHECKPOINT_PATH}")
        print(f"   Size: {size_mb:.1f} MB")
        return

    print("=" * 60)
    print("  Downloading PANNs CNN14 checkpoint from Zenodo")
    print(f"  Destination: {CHECKPOINT_PATH}")
    print(f"  Expected size: ~{EXPECTED_SIZE_MB} MB")
    print("=" * 60)

    try:
        urllib.request.urlretrieve(CHECKPOINT_URL, CHECKPOINT_PATH, reporthook=show_progress)
        print()  # newline after progress bar

        size_mb = os.path.getsize(CHECKPOINT_PATH) / (1024 * 1024)
        print(f"\n✅ Download complete! File size: {size_mb:.1f} MB")
        print(f"   Saved to: {CHECKPOINT_PATH}")
        print("\n🚀 PANNs CNN14 is now ready. Restart the server to use real inference.")

    except Exception as e:
        # Clean up partial download on failure
        if os.path.exists(CHECKPOINT_PATH):
            os.remove(CHECKPOINT_PATH)
        print(f"\n❌ Download failed: {e}")
        print("\nManual download instructions:")
        print("  1. Go to: https://zenodo.org/record/3987831")
        print("  2. Download: Cnn14_mAP=0.431.pth")
        print(f"  3. Place in: {CHECKPOINT_DIR}\\")


if __name__ == "__main__":
    download_panns()
