import os
import time
import torch
import torch.nn as nn
import librosa
import numpy as np

_model = None
_device = None

CKPT_PATH = os.path.join(os.path.dirname(__file__), "..", "checkpoints", "mobilenet_audio.pth")

class MobileNetAudio(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()
        # Simplified depthwise separable convolutions
        def dwise_conv(in_c, out_c, stride=1):
            return nn.Sequential(
                nn.Conv2d(in_c, in_c, 3, stride, 1, groups=in_c, bias=False),
                nn.BatchNorm2d(in_c),
                nn.ReLU6(inplace=True),
                nn.Conv2d(in_c, out_c, 1, 1, 0, bias=False),
                nn.BatchNorm2d(out_c),
                nn.ReLU6(inplace=True)
            )

        self.stem = nn.Sequential(
            nn.Conv2d(1, 16, 3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(16),
            nn.ReLU6(inplace=True)
        )
        self.features = nn.Sequential(
            dwise_conv(16, 32, 1),
            dwise_conv(32, 64, 2),
            dwise_conv(64, 64, 1),
            dwise_conv(64, 128, 2)
        )
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Linear(128, num_classes)

    def forward(self, x):
        x = self.stem(x)
        x = self.features(x)
        x = self.pool(x)
        x = x.view(-1, 128)
        return self.fc(x)

def _load_model():
    global _model, _device
    if _model is not None:
        return

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    _model = MobileNetAudio(num_classes=3).to(_device)

    if os.path.exists(CKPT_PATH):
        ckpt = torch.load(CKPT_PATH, map_location=_device)
        _model.load_state_dict(ckpt["model_state"])
        print(f"[Server] MobileNetV2 (Audio) ✅ loaded from checkpoint on {_device}.")
    else:
        print(f"[Server] MobileNetV2 (Audio) ⚠️ No checkpoint found at {CKPT_PATH}, using random init.")

    _model.eval()

def predict_mobilenet(audio_file_path: str):
    t0 = time.time()
    if _model is None:
        _load_model()
        
    try:
        y, sr = librosa.load(audio_file_path, sr=22050, mono=True)
        duration = len(y) / sr
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=40)
        S_db = librosa.power_to_db(S, ref=np.max)
        
        input_tensor = torch.tensor(S_db).unsqueeze(0).unsqueeze(0).float().to(_device)
        
        with torch.no_grad():
            outputs = _model(input_tensor)
            probs = torch.softmax(outputs, dim=1).squeeze().cpu().numpy()
            
        return {
            "model": "MobileNetV2",
            "healthy": float(probs[0]),
            "tb_risk": float(probs[1]),
            "asthma_risk": float(probs[2]),
            "normal": float(probs[0]),
            "duration_sec": round(duration, 2),
            "latency_ms": round((time.time() - t0) * 1000, 2),
            "placeholder": False
        }
    except Exception as e:
        return {"model": "MobileNetV2", "error": str(e)}
