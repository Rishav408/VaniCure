"""
PANNs CNN14 model wrapper.

This module provides a placeholder inference function.
To use real inference, download the CNN14 checkpoint from:
https://zenodo.org/record/3987831 → Cnn14_mAP=0.431.pth
and place it in server/checkpoints/Cnn14_mAP=0.431.pth
"""

import numpy as np
import librosa
import os

# Path to the CNN14 checkpoint (download from Zenodo)
CHECKPOINT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "checkpoints", "Cnn14_mAP=0.431.pth"
)


def predict_panns(audio_path: str) -> dict:
    """
    Run PANNs CNN14 inference on an audio file.
    Returns TB risk, asthma risk, and normal probability.

    Currently returns placeholder scores based on audio features.
    Replace with real CNN14 inference once checkpoint is downloaded.
    """
    # Load audio at 32kHz (PANNs native sample rate)
    try:
        waveform, sr = librosa.load(audio_path, sr=32000, mono=True)
    except Exception as e:
        return {
            "model": "PANNs-CNN14",
            "error": f"Failed to load audio: {str(e)}",
            "tb_risk": 0.0,
            "asthma_risk": 0.0,
            "normal": 1.0,
        }

    # Extract basic audio features for placeholder scoring
    duration = len(waveform) / sr
    rms_energy = float(np.sqrt(np.mean(waveform ** 2)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y=waveform)))

    # Check if the real checkpoint is available
    if os.path.exists(CHECKPOINT_PATH):
        # TODO: Load real CNN14 model and run inference
        # import torch
        # model = torch.load(CHECKPOINT_PATH)
        # ... real inference code ...
        pass

    # Placeholder: generate semi-realistic scores from audio features
    # Higher energy + higher ZCR → more likely a cough → higher TB risk
    np.random.seed(int(rms_energy * 10000) % 2**31)
    base_risk = min(0.95, rms_energy * 3 + zcr * 0.5)

    tb_risk = round(float(np.clip(base_risk + np.random.uniform(-0.1, 0.1), 0.05, 0.95)), 3)
    asthma_risk = round(float(np.clip((1 - base_risk) * 0.6 + np.random.uniform(-0.05, 0.05), 0.02, 0.40)), 3)
    normal = round(1.0 - tb_risk - asthma_risk, 3)

    return {
        "model": "PANNs-CNN14",
        "tb_risk": tb_risk,
        "asthma_risk": asthma_risk,
        "normal": max(0.0, normal),
        "duration_sec": round(duration, 2),
        "placeholder": True,  # Remove once real model is loaded
    }
