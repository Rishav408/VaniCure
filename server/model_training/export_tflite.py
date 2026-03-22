"""
Export trained PyTorch model → ONNX → TFLite (INT8 quantized).
Usage: python export_tflite.py
"""
import torch
import numpy as np
from pathlib import Path
from model import CNNBiLSTM

CKPT_PATH   = Path("../checkpoints/cnn_bilstm.pth")
ONNX_PATH   = Path("../checkpoints/cnn_bilstm.onnx")
TFLITE_PATH = Path("../checkpoints/cnn_bilstm.tflite")

def export():
    # Load model
    ckpt = torch.load(CKPT_PATH, map_location="cpu")
    model = CNNBiLSTM(n_classes=3)
    model.load_state_dict(ckpt["model_state"])
    model.eval()

    # Export to ONNX
    dummy = torch.randn(1, 1, 168, 128)
    torch.onnx.export(
        model, dummy, str(ONNX_PATH),
        input_names=["input"], output_names=["output"],
        dynamic_axes={"input": {3: "time"}, "output": {0: "batch"}},
        opset_version=13,
    )
    print(f"✅ ONNX exported: {ONNX_PATH}")

    # Convert ONNX → TFLite via onnx2tf
    try:
        import onnx2tf
        onnx2tf.convert(
            input_onnx_file_path=str(ONNX_PATH),
            output_folder_path=str(TFLITE_PATH.parent),
            output_integer_quant_tflite=True,
            quant_type="int8",
        )
        print(f"✅ TFLite (INT8) exported to: {TFLITE_PATH.parent}")
    except ImportError:
        print("⚠️  onnx2tf not installed. Install with: pip install onnx2tf")
        print("   OR use TensorFlow directly:")
        print("   tf.lite.TFLiteConverter.from_saved_model(...)")

if __name__ == "__main__":
    export()
