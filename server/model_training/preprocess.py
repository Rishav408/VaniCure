"""
Download Coswara dataset and prepare it for training.
Usage: python preprocess.py
"""
import os, json, shutil
import librosa
import numpy as np
from pathlib import Path

DATA_DIR = Path("../data/coswara_processed")
RAW_DIR  = Path("../data/coswara_raw")

LABEL_MAP = {
    "healthy": 0,
    "positive_mild": 1,    # TB proxy — mild COVID
    "positive_severe": 1,  # TB proxy — severe
    "resp-illness": 2,     # Asthma/respiratory
}

def process_audio(path: str, sr: int = 22050, duration: float = 3.0) -> np.ndarray:
    """Load and pad/trim audio to fixed duration."""
    waveform, _ = librosa.load(path, sr=sr, mono=True, duration=duration)
    target_len = int(sr * duration)
    if len(waveform) < target_len:
        waveform = np.pad(waveform, (0, target_len - len(waveform)))
    return waveform[:target_len]

def extract_features(waveform: np.ndarray, sr: int = 22050) -> np.ndarray:
    """Extract combined Mel-Spectrogram + MFCC features."""
    # Mel Spectrogram — (128, time)
    mel = librosa.feature.melspectrogram(y=waveform, sr=sr, n_mels=128, n_fft=1024, hop_length=256)
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_norm = (mel_db - mel_db.mean()) / (mel_db.std() + 1e-8)

    # MFCC — (40, time)
    mfcc = librosa.feature.mfcc(y=waveform, sr=sr, n_mfcc=40, n_fft=1024, hop_length=256)
    mfcc_norm = (mfcc - mfcc.mean()) / (mfcc.std() + 1e-8)

    # Stack: (168, time)
    return np.vstack([mel_norm, mfcc_norm])

def build_dataset():
    """
    Since Coswara requires institutional access, this creates a
    properly structured dataset from whatever WAV files you have.
    
    Expected raw structure:
    data/coswara_raw/
      healthy/    *.wav
      tb/         *.wav  (use positive_mild as proxy)
      asthma/     *.wav  (use resp-illness as proxy)
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    records = []
    for label_name, label_idx in [("healthy", 0), ("tb", 1), ("asthma", 2)]:
        src = RAW_DIR / label_name
        if not src.exists():
            print(f"[Preprocess] Skipping {label_name} — folder not found at {src}")
            continue
        
        files = list(src.glob("*.wav")) + list(src.glob("*.flac"))
        print(f"[Preprocess] {label_name}: {len(files)} files")
        
        for f in files:
            try:
                waveform = process_audio(str(f))
                features = extract_features(waveform)
                
                out_path = DATA_DIR / f"{label_name}_{f.stem}.npy"
                np.save(out_path, features.astype(np.float32))
                records.append({"path": str(out_path), "label": label_idx, "class": label_name})
            except Exception as e:
                print(f"[Preprocess] Error on {f.name}: {e}")
    
    # Save manifest
    manifest_path = DATA_DIR / "manifest.json"
    with open(manifest_path, "w") as fp:
        json.dump(records, fp, indent=2)
    
    print(f"\n[Preprocess] Done. {len(records)} samples saved.")
    print(f"  Manifest: {manifest_path}")
    
    # Class distribution
    for cls in ["healthy", "tb", "asthma"]:
        count = sum(1 for r in records if r["class"] == cls)
        print(f"  {cls}: {count}")

if __name__ == "__main__":
    build_dataset()
