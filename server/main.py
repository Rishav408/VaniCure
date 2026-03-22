from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import tempfile
import os
import asyncio
import concurrent.futures

from models.panns_model import predict_panns, _load_model as load_panns
from models.yamnet_model import predict_yamnet, _load_yamnet
from models.cnn_bilstm_model import predict_cnn_bilstm, _load_model as load_cnn_bilstm

# Thread pool to run blocking inference off the async event loop
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=3)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load both models at startup so first request is fast."""
    print("[Server] 🚀 Pre-loading AI models at startup...")
    loop = asyncio.get_event_loop()
    # Load both models concurrently in background threads
    await asyncio.gather(
        loop.run_in_executor(_executor, load_panns),
        loop.run_in_executor(_executor, _load_yamnet),
        loop.run_in_executor(_executor, load_cnn_bilstm),
    )
    print("[Server] ✅ All models ready. Server is hot.")
    yield
    print("[Server] Shutting down...")
    _executor.shutdown(wait=False)


app = FastAPI(title="VaniCure AI Server", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Accept an audio blob, run PANNs and YAMNet in parallel, return combined results.
    """
    # Save uploaded blob to temp file (keep original extension for librosa)
    suffix = os.path.splitext(file.filename or "recording.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        loop = asyncio.get_event_loop()
        # Run all 3 models concurrently
        panns_result, yamnet_result, cnn_result = await asyncio.gather(
            loop.run_in_executor(_executor, predict_panns, tmp_path),
            loop.run_in_executor(_executor, predict_yamnet, tmp_path),
            loop.run_in_executor(_executor, predict_cnn_bilstm, tmp_path),
        )
    finally:
        os.unlink(tmp_path)

    return {
        "panns": panns_result,
        "yamnet": yamnet_result,
        "cnn_bilstm": cnn_result,
    }
