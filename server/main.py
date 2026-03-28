from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import tempfile
import os
import asyncio
import concurrent.futures
import warnings

# Suppress expected librosa fallback warnings
warnings.filterwarnings("ignore", message="PySoundFile failed. Trying audioread instead.")

from models.panns_model import predict_panns, _load_model as load_panns, _model as panns_model_ref
from models.yamnet_model import predict_yamnet, _load_yamnet
from models.cnn_bilstm_model import predict_cnn_bilstm, _load_model as load_cnn_bilstm, _model as cnn_model_ref

# Thread pool to run blocking inference off the async event loop
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=3)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load all models at startup so first request is fast."""
    from download_models import download_panns
    
    print("[Server] 🚀 Ensuring core model checkpoints are present...")
    loop = asyncio.get_event_loop()
    # Auto-download PANNs checkpoint if missing
    await loop.run_in_executor(_executor, download_panns)

    print("[Server] 🚀 Pre-loading AI models at startup...")
    # Load all models concurrently in background threads
    await asyncio.gather(
        loop.run_in_executor(_executor, load_panns),
        loop.run_in_executor(_executor, _load_yamnet),
        loop.run_in_executor(_executor, load_cnn_bilstm),
    )
    print("[Server] ✅ All models ready. Server is hot.")
    yield
    print("[Server] Shutting down...")
    _executor.shutdown(wait=False)


app = FastAPI(title="VaniCure AI Server", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/model_status")
async def model_status():
    """
    Return real-time status of all three AI models.
    The frontend uses this to display Live vs Placeholder badges.
    """
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "models"))

    # Import current model singletons
    import models.panns_model as pm
    import models.yamnet_model as ym
    import models.cnn_bilstm_model as cm

    panns_loaded   = pm._model is not None
    yamnet_loaded  = ym._yamnet_model is not None
    cnn_loaded     = cm._model is not None

    panns_ckpt     = os.path.exists(os.path.join(os.path.dirname(__file__), "checkpoints", "Cnn14_mAP=0.431.pth"))
    cnn_ckpt       = os.path.exists(os.path.join(os.path.dirname(__file__), "checkpoints", "cnn_bilstm.pth"))

    return {
        "panns": {
            "loaded": panns_loaded,
            "checkpoint_exists": panns_ckpt,
            "is_placeholder": not panns_loaded or not panns_ckpt,
            "architecture": "CNN14 (6 conv blocks)",
            "classes": 527,
            "sample_rate": 32000,
            "checkpoint_size_mb": 312,
        },
        "yamnet": {
            "loaded": yamnet_loaded,
            "checkpoint_exists": True,   # YAMNet auto-downloads from TF Hub
            "is_placeholder": not yamnet_loaded,
            "architecture": "MobileNet v1",
            "classes": 521,
            "sample_rate": 16000,
            "checkpoint_size_mb": 3.7,
        },
        "cnn_bilstm": {
            "loaded": cnn_loaded,
            "checkpoint_exists": cnn_ckpt,
            "is_placeholder": not cnn_loaded or not cnn_ckpt,
            "architecture": "3×CNN + 2-layer BiLSTM",
            "classes": 3,
            "sample_rate": 22050,
            "checkpoint_size_mb": round(
                os.path.getsize(os.path.join(os.path.dirname(__file__), "checkpoints", "cnn_bilstm.pth")) / (1024 * 1024), 1
            ) if cnn_ckpt else 0,
        },
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Accept an audio blob, run PANNs, YAMNet and CNN-BiLSTM in parallel,
    return combined results for the frontend to display.
    """
    # Save uploaded blob to temp file (keep original extension for librosa)
    suffix = os.path.splitext(file.filename or "recording.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        loop = asyncio.get_event_loop()
        # Run sequentially to prevent audioread file-lock thread collisions
        panns_result = await loop.run_in_executor(_executor, predict_panns, tmp_path)
        yamnet_result = await loop.run_in_executor(_executor, predict_yamnet, tmp_path)
        cnn_result = await loop.run_in_executor(_executor, predict_cnn_bilstm, tmp_path)
    finally:
        os.unlink(tmp_path)

    return {
        "panns":      panns_result,
        "yamnet":     yamnet_result,
        "cnn_bilstm": cnn_result,
    }
