import os
import time
import torch
import torch.nn as nn
import librosa
import numpy as np

_model = None
_device = None

CKPT_PATH = os.path.join(os.path.dirname(__file__), "..", "checkpoints", "tinycnn_audio.pth")

class TinyCNN(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()
        # A very simple, fast 3-layer CNN
        self.features = nn.Sequential(
            nn.Conv2d(1, 8, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(8, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1))
        )
        self.fc = nn.Linear(32, num_classes)

    def forward(self, x):
        x = self.features(x)
        x = x.view(-1, 32)
        return self.fc(x)

def _load_model():
    global _model, _device
    if _model is not None:
        return

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    _model = TinyCNN(num_classes=3).to(_device)

    if os.path.exists(CKPT_PATH):
        ckpt = torch.load(CKPT_PATH, map_location=_device)
        _model.load_state_dict(ckpt["model_state"])
        print(f"[Server] TinyCNN (Audio) ✅ loaded from checkpoint on {_device}.")
    else:
        print(f"[Server] TinyCNN (Audio) ⚠️ No checkpoint found at {CKPT_PATH}, using random init.")

    _model.eval()

def predict_tinycnn(audio_file_path: str):
    t0 = time.time()
    if _model is None:
        _load_model()
        
    try:
        y, sr = librosa.load(audio_file_path, sr=22050, mono=True)
        duration = len(y) / sr
        # Super fast extraction
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=32, n_fft=1024, hop_length=512)
        S_db = librosa.power_to_db(S, ref=np.max)
        
        input_tensor = torch.tensor(S_db).unsqueeze(0).unsqueeze(0).float().to(_device)
        
        with torch.no_grad():
            outputs = _model(input_tensor)
            probs = torch.softmax(outputs, dim=1).squeeze().cpu().numpy()
            
        return {
            "model": "TinyCNN",
            "healthy": float(probs[0]),
            "tb_risk": float(probs[1]),
            "asthma_risk": float(probs[2]),
            "normal": float(probs[0]),
            "duration_sec": round(duration, 2),
            "latency_ms": round((time.time() - t0) * 1000, 2),
            "placeholder": False
        }
    except Exception as e:
        return {"model": "TinyCNN", "error": str(e)}
