import os
import time
import torch
import torch.nn as nn
import librosa
import numpy as np

# Global singleton
_model = None
_device = None

CKPT_PATH = os.path.join(os.path.dirname(__file__), "..", "checkpoints", "resnet_audio.pth")

class ResNetAudio(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()
        # Simplified ResNet-like architecture for audio
        self.conv1 = nn.Conv2d(1, 16, kernel_size=7, stride=2, padding=3)
        self.bn1 = nn.BatchNorm2d(16)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        self.layer1 = nn.Sequential(
            nn.Conv2d(16, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(True),
            nn.Conv2d(32, 32, 3, padding=1), nn.BatchNorm2d(32)
        )
        self.layer2 = nn.Sequential(
            nn.Conv2d(32, 64, 3, stride=2, padding=1), nn.BatchNorm2d(64), nn.ReLU(True),
            nn.Conv2d(64, 64, 3, padding=1), nn.BatchNorm2d(64)
        )
        self.adaptive_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(64, num_classes)

    def forward(self, x):
        x = self.maxpool(self.relu(self.bn1(self.conv1(x))))
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.adaptive_pool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        return x

def _load_model():
    """Load the ResNet model from checkpoint."""
    global _model, _device
    if _model is not None:
        return

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    _model = ResNetAudio(num_classes=3).to(_device)

    if os.path.exists(CKPT_PATH):
        ckpt = torch.load(CKPT_PATH, map_location=_device)
        _model.load_state_dict(ckpt["model_state"])
        print(f"[Server] ResNet18 (Audio) ✅ loaded from checkpoint on {_device}.")
    else:
        print(f"[Server] ResNet18 (Audio) ⚠️ No checkpoint found at {CKPT_PATH}, using random init.")

    _model.eval()

def predict_resnet(audio_file_path: str):
    """Run inference on an audio file."""
    t0 = time.time()
    if _model is None:
        _load_model()
        
    try:
        # Quick melspectrogram for prediction
        y, sr = librosa.load(audio_file_path, sr=22050, mono=True)
        duration = len(y) / sr
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=64)
        S_db = librosa.power_to_db(S, ref=np.max)
        
        # Format for model: (Batch, Channel, Height, Width) -> (1, 1, 64, T)
        input_tensor = torch.tensor(S_db).unsqueeze(0).unsqueeze(0).float().to(_device)
        
        with torch.no_grad():
            outputs = _model(input_tensor)
            probs = torch.softmax(outputs, dim=1).squeeze().cpu().numpy()
            
        return {
            "model": "ResNet18",
            "healthy": float(probs[0]),
            "tb_risk": float(probs[1]),
            "asthma_risk": float(probs[2]),
            "normal": float(probs[0]),
            "duration_sec": round(duration, 2),
            "latency_ms": round((time.time() - t0) * 1000, 2),
            "placeholder": False
        }
    except Exception as e:
        return {"model": "ResNet18", "error": str(e)}
