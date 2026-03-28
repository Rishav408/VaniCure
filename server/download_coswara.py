"""
Download Coswara Dataset from GitHub.
=========================================
This script fetches cough audio files from the Coswara-Data GitHub repository
(https://github.com/iiscleap/Coswara-Data) and organizes them into:

    server/data/coswara_raw/
        healthy/    *.wav
        tb/         *.wav   (from positive_mild + positive_severe)
        asthma/     *.wav   (from resp-illness)

Usage:
    cd server/
    python download_coswara.py

Note: The full Coswara dataset is large (thousands of participants). By default,
this script downloads a representative sample (100 per class) to allow training
without requiring institutional access. For the full dataset see:
    https://github.com/iiscleap/Coswara-Data
"""

import os
import json
import time
import requests
from pathlib import Path
from tqdm import tqdm

# ─── Config ───────────────────────────────────────────────────────────────────
GITHUB_API     = "https://api.github.com"
REPO           = "iiscleap/Coswara-Data"
BRANCH         = "master"
RAW_BASE       = f"https://raw.githubusercontent.com/{REPO}/{BRANCH}"
OUTPUT_DIR     = Path(__file__).parent / "data" / "coswara_raw"
SAMPLES_PER_CLASS = 120   # how many files to download per label class
MAX_RETRIES    = 3
RETRY_DELAY    = 2

# Coswara label categories → our 3 classes
LABEL_TO_CLASS = {
    "healthy":         "healthy",
    "positive_mild":   "tb",
    "positive_severe": "tb",
    "resp-illness":    "asthma",
    "resp_illness":    "asthma",
}

# Audio file names to look for (Coswara uses these filenames per participant folder)
COUGH_FILES = ["cough-heavy.wav", "cough-shallow.wav", "breathing-deep.wav", "breathing-shallow.wav"]


def github_get(url: str, params: dict = None) -> dict | list | None:
    """Make a GitHub API call with retry logic."""
    headers = {"Accept": "application/vnd.github.v3+json"}
    # If GITHUB_TOKEN env var is set, use it to avoid rate limiting
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"

    for attempt in range(MAX_RETRIES):
        try:
            r = requests.get(url, headers=headers, params=params, timeout=30)
            if r.status_code == 403:
                print(f"\n⚠️  GitHub rate limit hit. Set GITHUB_TOKEN env var to increase limits.")
                print(f"   Sleeping 60s... (attempt {attempt+1}/{MAX_RETRIES})")
                time.sleep(60)
                continue
            r.raise_for_status()
            return r.json()
        except requests.exceptions.RequestException as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            else:
                print(f"❌ Request failed after {MAX_RETRIES} attempts: {e}")
                return None
    return None


def download_file(url: str, dest: Path, retries: int = 3) -> bool:
    """Download a single file, return True on success."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        return True

    for attempt in range(retries):
        try:
            r = requests.get(url, timeout=30, stream=True)
            r.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(RETRY_DELAY)

    return False


def get_date_folders() -> list[str]:
    """Get list of date-based data folders in the Coswara repo."""
    url = f"{GITHUB_API}/repos/{REPO}/contents"
    contents = github_get(url)
    if not contents:
        return []

    # Date folders look like "2020-04-23", "2020-07-01", etc.
    folders = [
        item["name"] for item in contents
        if item["type"] == "dir" and item["name"][0].isdigit()
    ]
    return sorted(folders)


def get_participant_folders(date_folder: str) -> list[dict]:
    """Get participant subdirectories within a date folder."""
    url = f"{GITHUB_API}/repos/{REPO}/contents/{date_folder}"
    contents = github_get(url)
    if not contents:
        return []
    return [item for item in contents if item["type"] == "dir"]


def get_participant_metadata(date_folder: str, participant: str) -> dict | None:
    """Fetch the metadata JSON for a participant to determine their label."""
    meta_url = f"{RAW_BASE}/{date_folder}/{participant}/metadata.json"
    try:
        r = requests.get(meta_url, timeout=15)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None


def infer_class_from_metadata(meta: dict) -> str | None:
    """Map Coswara metadata health_status to our class label."""
    if not meta:
        return None

    status = meta.get("health_status", "").replace("-", "_").lower()
    for key, cls in LABEL_TO_CLASS.items():
        if key.replace("-", "_") == status.replace("-", "_"):
            return cls
    return None


def main():
    print("=" * 60)
    print("  VaniCure — Coswara Dataset Downloader")
    print("=" * 60)
    print(f"\n  Output directory: {OUTPUT_DIR}")
    print(f"  Target: {SAMPLES_PER_CLASS} files per class\n")

    # Create output folder structure
    for cls in ["healthy", "tb", "asthma"]:
        (OUTPUT_DIR / cls).mkdir(parents=True, exist_ok=True)

    class_counts = {"healthy": 0, "tb": 0, "asthma": 0}
    target = {cls: SAMPLES_PER_CLASS for cls in class_counts}

    # Get all date folders
    print("📡 Fetching repository structure from GitHub...")
    date_folders = get_date_folders()
    if not date_folders:
        print("❌ Could not fetch repository structure. Check your internet connection.")
        print("   You can also manually download files from:")
        print("   https://github.com/iiscleap/Coswara-Data")
        return

    print(f"   Found {len(date_folders)} date folders: {date_folders[:3]}...\n")

    downloaded_total = 0
    errors = 0

    for date_folder in date_folders:
        # Stop if we have enough of each class
        if all(class_counts[c] >= target[c] for c in class_counts):
            break

        participants = get_participant_folders(date_folder)
        if not participants:
            continue

        for p in participants:
            # Check if we still need files for any class
            if all(class_counts[c] >= target[c] for c in class_counts):
                break

            participant_id = p["name"]

            # Get metadata to determine health status
            meta = get_participant_metadata(date_folder, participant_id)
            cls = infer_class_from_metadata(meta)

            if cls is None or class_counts[cls] >= target[cls]:
                continue

            # Try to download each audio file type
            for audio_file in COUGH_FILES:
                raw_url = f"{RAW_BASE}/{date_folder}/{participant_id}/{audio_file}"
                fname = f"{participant_id}_{audio_file}"
                dest = OUTPUT_DIR / cls / fname

                if download_file(raw_url, dest):
                    class_counts[cls] += 1
                    downloaded_total += 1
                    break  # One file per participant is enough

            # Rate-limit friendly delay
            time.sleep(0.1)

        # Show progress
        print(f"  Progress -> healthy: {class_counts['healthy']}/{target['healthy']} | "
              f"tb: {class_counts['tb']}/{target['tb']} | "
              f"asthma: {class_counts['asthma']}/{target['asthma']}")

    print(f"\n{'='*60}")
    print(f"  Download Summary")
    print(f"{'='*60}")
    for cls, count in class_counts.items():
        print(f"  {cls:10s}: {count} files  →  {OUTPUT_DIR / cls}")

    print(f"\n  Total downloaded: {downloaded_total} files")

    if downloaded_total == 0:
        print("""
  ⚠️  No files were downloaded. This may be due to GitHub rate limits.

  To fix this:
  1. Create a GitHub personal access token at https://github.com/settings/tokens
  2. Run: export GITHUB_TOKEN=your_token_here
  3. Run this script again: python download_coswara.py

  OR manually download WAV files from:
  https://github.com/iiscleap/Coswara-Data

  Place them in:
    server/data/coswara_raw/healthy/*.wav
    server/data/coswara_raw/tb/*.wav
    server/data/coswara_raw/asthma/*.wav

  Then run: cd model_training && python preprocess.py
""")
    else:
        print("""
  ✅ Download complete!
  Next steps:
    cd model_training
    python preprocess.py   # Extract features → .npy files
    python train.py        # Train CNN-BiLSTM model
""")


if __name__ == "__main__":
    main()
