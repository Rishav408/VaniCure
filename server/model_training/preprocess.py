"""
Improved preprocess.py — Coswara Feature Extraction Pipeline.

Reads WAV/FLAC/OGG files from data/coswara_raw/{healthy,tb,asthma}/
Extracts combined Mel-Spectrogram + MFCC features (168 bins × T frames)
Saves compressed .npy files and a manifest.json

Includes on-the-fly data augmentation to triple the dataset size:
  1. Original
  2. Time-stretched (rate 0.85)
  3. Gaussian noise (SNR ~20 dB)

Usage:
    cd server/model_training
    python preprocess.py
"""

import os
import json
import librosa
import numpy as np
from pathlib import Path

DATA_DIR = Path("../data/coswara_processed")
RAW_DIR  = Path("../data/coswara_raw")

SR       = 22050
DURATION = 3.0        # seconds
TARGET_LEN = int(SR * DURATION)
N_MELS   = 128
N_MFCC   = 40
N_FFT    = 1024
HOP_LEN  = 256


# ─── Audio Processing ─────────────────────────────────────────────────────────

def load_audio(path: str) -> np.ndarray:
    """Load and pad/trim audio to fixed 3s duration."""
    waveform, _ = librosa.load(path, sr=SR, mono=True, duration=DURATION + 0.1)
    if len(waveform) < TARGET_LEN:
        waveform = np.pad(waveform, (0, TARGET_LEN - len(waveform)))
    return waveform[:TARGET_LEN].astype(np.float32)


def extract_features(waveform: np.ndarray) -> np.ndarray:
    """
    Extract combined Mel-Spectrogram (128) + MFCC (40) = 168 bins.
    Returns shape: (168, time_frames).
    """
    mel = librosa.feature.melspectrogram(
        y=waveform, sr=SR, n_mels=N_MELS, n_fft=N_FFT, hop_length=HOP_LEN
    )
    mel_db   = librosa.power_to_db(mel, ref=np.max)
    mel_norm = (mel_db - mel_db.mean()) / (mel_db.std() + 1e-8)

    mfcc      = librosa.feature.mfcc(
        y=waveform, sr=SR, n_mfcc=N_MFCC, n_fft=N_FFT, hop_length=HOP_LEN
    )
    mfcc_norm = (mfcc - mfcc.mean()) / (mfcc.std() + 1e-8)

    return np.vstack([mel_norm, mfcc_norm]).astype(np.float32)


# ─── Augmentations ────────────────────────────────────────────────────────────

def augment_time_stretch(waveform: np.ndarray, rate: float = 0.85) -> np.ndarray:
    """Time-stretch without pitch change."""
    stretched = librosa.effects.time_stretch(waveform, rate=rate)
    if len(stretched) < TARGET_LEN:
        stretched = np.pad(stretched, (0, TARGET_LEN - len(stretched)))
    return stretched[:TARGET_LEN].astype(np.float32)


def augment_noise(waveform: np.ndarray, snr_db: float = 20.0) -> np.ndarray:
    """Add Gaussian white noise at given SNR."""
    rms = np.sqrt(np.mean(waveform ** 2)) + 1e-10
    noise_rms = rms / (10 ** (snr_db / 20.0))
    noise = np.random.randn(len(waveform)).astype(np.float32) * noise_rms
    return np.clip(waveform + noise, -1.0, 1.0)


# ─── Dataset Builder ──────────────────────────────────────────────────────────

def build_dataset():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    records = []

    print("\n🔢 VaniCure Feature Extraction Pipeline")
    print("="*50)

    for label_name, label_idx in [("healthy", 0), ("tb", 1), ("asthma", 2)]:
        src = RAW_DIR / label_name
        if not src.exists():
            print(f"\n⚠️  Skipping '{label_name}' — folder not found: {src}")
            print(f"    Run: python download_coswara.py")
            continue

        audio_exts = ("*.wav", "*.flac", "*.ogg", "*.mp3")
        files = []
        for ext in audio_exts:
            files.extend(src.glob(ext))

        print(f"\n📂 {label_name}: {len(files)} files")

        success, failed = 0, 0
        for f in files:
            try:
                waveform = load_audio(str(f))

                # 1. Original
                feat_orig = extract_features(waveform)
                out = DATA_DIR / f"{label_name}_{f.stem}_orig.npy"
                np.save(out, feat_orig)
                records.append({"path": str(out), "label": label_idx, "class": label_name, "augment": "orig"})

                # 2. Time-stretch augmentation
                feat_ts = extract_features(augment_time_stretch(waveform, rate=0.85))
                out_ts = DATA_DIR / f"{label_name}_{f.stem}_ts.npy"
                np.save(out_ts, feat_ts)
                records.append({"path": str(out_ts), "label": label_idx, "class": label_name, "augment": "time_stretch"})

                # 3. Noise augmentation
                feat_noise = extract_features(augment_noise(waveform, snr_db=20.0))
                out_noise = DATA_DIR / f"{label_name}_{f.stem}_noise.npy"
                np.save(out_noise, feat_noise)
                records.append({"path": str(out_noise), "label": label_idx, "class": label_name, "augment": "noise"})

                success += 1
            except Exception as e:
                print(f"  ❌ Error on {f.name}: {e}")
                failed += 1

        print(f"  ✅ Saved: {success * 3} features ({success} × 3 augmentations), {failed} failed")

    # Save manifest
    manifest_path = DATA_DIR / "manifest.json"
    with open(manifest_path, "w") as fp:
        json.dump(records, fp, indent=2)

    print(f"\n{'='*50}")
    print(f"  📋 Manifest: {manifest_path}")
    print(f"  Total samples: {len(records)}")
    print(f"\n  Class distribution:")
    for cls in ["healthy", "tb", "asthma"]:
        count = sum(1 for r in records if r["class"] == cls)
        print(f"    {cls:10s}: {count:4d} samples")

    print(f"\n  ▶  Next: python train.py")


if __name__ == "__main__":
    np.random.seed(42)
    build_dataset()
