"""
CNN-BiLSTM model wrapper — drop-in for existing server.
Mirrors the interface of panns_model.py and yamnet_model.py.
"""
import os
import numpy as np
import librosa
import torch
import sys

# Import the architecture from training folder
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "model_training"))
from model import CNNBiLSTM

CKPT_PATH = os.path.join(os.path.dirname(__file__), "..", "checkpoints", "cnn_bilstm.pth")
CLASSES   = ["healthy", "tb", "asthma"]

_model  = None
_device = None


def _load_model():
    global _model, _device
    if _model is not None:
        return _model

    if not os.path.exists(CKPT_PATH):
        print("[CNN-BiLSTM] ⚠️  Checkpoint not found. Train first: cd model_training && python train.py")
        return None

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[CNN-BiLSTM] Loading from {CKPT_PATH} on {_device}")

    ckpt = torch.load(CKPT_PATH, map_location=_device)
    m = CNNBiLSTM(n_classes=3).to(_device)
    m.load_state_dict(ckpt["model_state"])
    m.eval()
    _model = m
    print("[CNN-BiLSTM] ✅ Model loaded.")
    return _model


def predict_cnn_bilstm(audio_path: str) -> dict:
    try:
        waveform, sr = librosa.load(audio_path, sr=22050, mono=True, duration=3.0)
        target_len = 22050 * 3
        if len(waveform) < target_len:
            waveform = np.pad(waveform, (0, target_len - len(waveform)))
        waveform = waveform[:target_len]
    except Exception as e:
        return {"model": "CNN-BiLSTM", "error": str(e), "tb_risk": 0.0,
                "asthma_risk": 0.0, "normal": 1.0, "placeholder": True}

    duration = len(waveform) / 22050

    model = _load_model()
    if model is not None:
        try:
            # Feature extraction (matches training pipeline)
            mel = librosa.feature.melspectrogram(y=waveform, sr=22050, n_mels=128, n_fft=1024, hop_length=256)
            mel_db = librosa.power_to_db(mel, ref=np.max)
            mel_norm = (mel_db - mel_db.mean()) / (mel_db.std() + 1e-8)

            mfcc = librosa.feature.mfcc(y=waveform, sr=22050, n_mfcc=40, n_fft=1024, hop_length=256)
            mfcc_norm = (mfcc - mfcc.mean()) / (mfcc.std() + 1e-8)

            features = np.vstack([mel_norm, mfcc_norm])   # (168, time)
            x = torch.FloatTensor(features).unsqueeze(0).unsqueeze(0).to(_device)  # (1, 1, 168, T)

            with torch.no_grad():
                logits = model(x)[0]
                probs = torch.softmax(logits, dim=0).cpu().numpy()

            return {
                "model":       "CNN-BiLSTM",
                "normal":      round(float(probs[0]), 3),
                "tb_risk":     round(float(probs[1]), 3),
                "asthma_risk": round(float(probs[2]), 3),
                "duration_sec": round(duration, 2),
                "placeholder": False,
            }
        except Exception as e:
            print(f"[CNN-BiLSTM] Inference error: {e}")

    # Placeholder Fallback using dynamic acoustic math
    rms = float(np.sqrt(np.mean(waveform ** 2)))
    base = min(0.98, rms * 3.8)
    tb_risk = round(float(np.clip(base + np.random.uniform(-0.1, 0.1), 0.05, 0.88)), 3)
    asthma_risk = round(float(np.clip((1 - base) * 0.4 + np.random.uniform(-0.05, 0.05), 0.02, 0.35)), 3)
    normal = round(max(0.0, 1.0 - tb_risk - asthma_risk), 3)

    return {"model": "CNN-BiLSTM", "tb_risk": tb_risk, "asthma_risk": asthma_risk,
            "normal": normal, "duration_sec": round(duration, 2), "placeholder": True}


try:
    _load_model()
except Exception:
    pass
