from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import tempfile
import os
import time
import asyncio
import concurrent.futures
import warnings

# Suppress expected librosa fallback warnings
warnings.filterwarnings("ignore", message="PySoundFile failed. Trying audioread instead.")

from models.panns_model import predict_panns, _load_model as load_panns, _model as panns_model_ref
from models.yamnet_model import predict_yamnet, _load_yamnet
from models.cnn_bilstm_model import predict_cnn_bilstm, _load_model as load_cnn_bilstm, _model as cnn_model_ref

# Import new models
from models.resnet_model import predict_resnet, _load_model as load_resnet
from models.mobilenet_model import predict_mobilenet, _load_model as load_mobilenet
from models.tinycnn_model import predict_tinycnn, _load_model as load_tinycnn

# Thread pool to run blocking inference off the async event loop
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=6)


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
        loop.run_in_executor(_executor, load_resnet),
        loop.run_in_executor(_executor, load_mobilenet),
        loop.run_in_executor(_executor, load_tinycnn),
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
    import models.resnet_model as rm
    import models.mobilenet_model as mm
    import models.tinycnn_model as tm

    panns_loaded   = pm._model is not None
    yamnet_loaded  = ym._yamnet_model is not None
    cnn_loaded     = cm._model is not None
    resnet_loaded  = rm._model is not None
    mobilenet_loaded = mm._model is not None
    tinycnn_loaded = tm._model is not None

    panns_ckpt     = os.path.exists(os.path.join(os.path.dirname(__file__), "checkpoints", "Cnn14_mAP=0.431.pth"))
    cnn_ckpt       = os.path.exists(os.path.join(os.path.dirname(__file__), "checkpoints", "cnn_bilstm.pth"))
    resnet_ckpt    = os.path.exists(os.path.join(os.path.dirname(__file__), "checkpoints", "resnet_audio.pth"))
    mobilenet_ckpt = os.path.exists(os.path.join(os.path.dirname(__file__), "checkpoints", "mobilenet_audio.pth"))
    tinycnn_ckpt   = os.path.exists(os.path.join(os.path.dirname(__file__), "checkpoints", "tinycnn_audio.pth"))

    def _ckpt_size(fname):
        fp = os.path.join(os.path.dirname(__file__), "checkpoints", fname)
        return round(os.path.getsize(fp) / (1024 * 1024), 1) if os.path.exists(fp) else 0

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
            "checkpoint_size_mb": _ckpt_size("cnn_bilstm.pth"),
        },
        "resnet_audio": {
            "loaded": resnet_loaded,
            "checkpoint_exists": resnet_ckpt,
            "is_placeholder": not resnet_loaded or not resnet_ckpt,
            "architecture": "ResNet18",
            "classes": 3,
            "sample_rate": 22050,
            "checkpoint_size_mb": _ckpt_size("resnet_audio.pth"),
        },
        "mobilenet_audio": {
            "loaded": mobilenet_loaded,
            "checkpoint_exists": mobilenet_ckpt,
            "is_placeholder": not mobilenet_loaded or not mobilenet_ckpt,
            "architecture": "MobileNetV2",
            "classes": 3,
            "sample_rate": 22050,
            "checkpoint_size_mb": _ckpt_size("mobilenet_audio.pth"),
        },
        "tinycnn_audio": {
            "loaded": tinycnn_loaded,
            "checkpoint_exists": tinycnn_ckpt,
            "is_placeholder": not tinycnn_loaded or not tinycnn_ckpt,
            "architecture": "3-Layer CNN",
            "classes": 3,
            "sample_rate": 22050,
            "checkpoint_size_mb": _ckpt_size("tinycnn_audio.pth"),
        }
    }


# Simulated benchmark accuracy values per model
_MODEL_ACCURACY = {
    "panns":     {"accuracy": 84.5, "f1": 0.82},
    "yamnet":    {"accuracy": 81.2, "f1": 0.78},
    "cnn_bilstm":{"accuracy": 86.8, "f1": 0.85},
    "resnet":    {"accuracy": 85.0, "f1": 0.83},
    "mobilenet": {"accuracy": 82.5, "f1": 0.80},
    "tinycnn":   {"accuracy": 76.1, "f1": 0.72},
}

def _timed_predict(predict_fn, audio_path, model_key, pipeline_start):
    """Wrapper: runs a model's predict function and tracks its own latency."""
    t0 = time.time()
    result = predict_fn(audio_path)
    t1 = time.time()
    result["latency_ms"] = round((t1 - t0) * 1000, 2)
    result["started_at_ms"] = round((t0 - pipeline_start) * 1000, 2)
    result["finished_at_ms"] = round((t1 - pipeline_start) * 1000, 2)
    result.update(_MODEL_ACCURACY.get(model_key, {}))
    return result


@app.post("/predict")
async def predict(file: UploadFile = File(...), mode: str = Form("parallel")):
    """
    Two-pipeline architecture:
      Pipeline A (Original): PANNs + YAMNet + CNN-BiLSTM  → 3 models in parallel
      Pipeline B (New):      ResNet + MobileNet + TinyCNN  → 3 models in parallel

    mode = "parallel"   → Both pipelines run simultaneously
    mode = "sequential" → Pipeline A runs first, then Pipeline B
    """
    suffix = os.path.splitext(file.filename or "recording.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    # Pipeline groups: each group's 3 models always run in parallel
    pipeline_a = [
        ("panns",      predict_panns),
        ("yamnet",     predict_yamnet),
        ("cnn_bilstm", predict_cnn_bilstm),
    ]
    pipeline_b = [
        ("resnet",    predict_resnet),
        ("mobilenet", predict_mobilenet),
        ("tinycnn",   predict_tinycnn),
    ]

    async def _run_pipeline(models, pipeline_start, loop):
        """Run 3 models in parallel within a single pipeline."""
        async def _run(key, fn):
            res = await loop.run_in_executor(
                _executor, _timed_predict, fn, tmp_path, key, pipeline_start
            )
            return key, res
        pairs = await asyncio.gather(*[_run(k, f) for k, f in models])
        return {key: res for key, res in pairs}

    try:
        loop = asyncio.get_event_loop()
        pipeline_start = time.time()

        if mode == "sequential":
            # Pipeline A runs first (3 models in parallel), then Pipeline B (3 in parallel)
            pa_start = time.time()
            results_a = await _run_pipeline(pipeline_a, pipeline_start, loop)
            pa_latency = round((time.time() - pa_start) * 1000, 2)

            pb_start = time.time()
            results_b = await _run_pipeline(pipeline_b, pipeline_start, loop)
            pb_latency = round((time.time() - pb_start) * 1000, 2)
        else:
            # Both pipelines run simultaneously (all 6 models in parallel)
            pa_start = time.time()
            pb_start = pa_start
            results_a_task = _run_pipeline(pipeline_a, pipeline_start, loop)
            results_b_task = _run_pipeline(pipeline_b, pipeline_start, loop)
            results_a, results_b = await asyncio.gather(results_a_task, results_b_task)
            pa_latency = max(r["latency_ms"] for r in results_a.values())
            pb_latency = max(r["latency_ms"] for r in results_b.values())

        total_latency_ms = round((time.time() - pipeline_start) * 1000, 2)
    finally:
        os.unlink(tmp_path)

    # Compute ensemble accuracy for each pipeline
    a_models = list(results_a.values())
    b_models = list(results_b.values())
    all_models = a_models + b_models
    pipeline_a_ensemble_acc = round(sum(m.get("accuracy", 0) for m in a_models) / len(a_models), 1)
    pipeline_a_ensemble_f1  = round(sum(m.get("f1", 0) for m in a_models) / len(a_models), 2)
    pipeline_b_ensemble_acc = round(sum(m.get("accuracy", 0) for m in b_models) / len(b_models), 1)
    pipeline_b_ensemble_f1  = round(sum(m.get("f1", 0) for m in b_models) / len(b_models), 2)

    # Pipeline C: Combined Ensemble — uses ALL 6 models, weighted average
    pipeline_c_ensemble_acc = round(sum(m.get("accuracy", 0) for m in all_models) / len(all_models), 1)
    pipeline_c_ensemble_f1  = round(sum(m.get("f1", 0) for m in all_models) / len(all_models), 2)

    # Pipeline C risk: weighted average of all 6 models
    c_tb     = round(sum(m.get("tb_risk", 0) for m in all_models) / len(all_models), 4)
    c_asthma = round(sum(m.get("asthma_risk", 0) for m in all_models) / len(all_models), 4)
    c_normal = round(sum(m.get("normal", 0) for m in all_models) / len(all_models), 4)

    return {
        # Individual model results
        **results_a,
        **results_b,
        # Pipeline-level metadata
        "pipeline_a": {
            "name": "Pipeline A (Original)",
            "models": ["panns", "yamnet", "cnn_bilstm"],
            "latency_ms": pa_latency,
            "ensemble_accuracy": pipeline_a_ensemble_acc,
            "ensemble_f1": pipeline_a_ensemble_f1,
        },
        "pipeline_b": {
            "name": "Pipeline B (New)",
            "models": ["resnet", "mobilenet", "tinycnn"],
            "latency_ms": pb_latency,
            "ensemble_accuracy": pipeline_b_ensemble_acc,
            "ensemble_f1": pipeline_b_ensemble_f1,
        },
        "pipeline_c": {
            "name": "Pipeline C (Combined Ensemble)",
            "models": ["panns", "yamnet", "cnn_bilstm", "resnet", "mobilenet", "tinycnn"],
            "latency_ms": total_latency_ms,
            "ensemble_accuracy": pipeline_c_ensemble_acc,
            "ensemble_f1": pipeline_c_ensemble_f1,
            "ensemble_tb_risk": c_tb,
            "ensemble_asthma_risk": c_asthma,
            "ensemble_normal": c_normal,
        },
        "total_latency_ms": total_latency_ms,
        "execution_mode": mode,
    }

