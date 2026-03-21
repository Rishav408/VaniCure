from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os

from models.panns_model import predict_panns
from models.yamnet_model import predict_yamnet

app = FastAPI(title="VaniCure AI Server", version="0.1.0")

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
    Accept an audio file (WAV), run PANNs and YAMNet inference,
    and return combined results.
    """
    # Save the uploaded file to a temp location
    suffix = os.path.splitext(file.filename or ".wav")[1]
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        panns_result = predict_panns(tmp_path)
        yamnet_result = predict_yamnet(tmp_path)
    finally:
        os.unlink(tmp_path)

    return {
        "panns": panns_result,
        "yamnet": yamnet_result,
    }
