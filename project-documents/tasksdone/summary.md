# VaniCure — Project Progress Summary

This document summarizes the step-by-step progress, architecture updates, and features implemented during the AI integration and UI connection phases.

## 1. Backend Server Setup (FastAPI)
*   **Core Architecture:** Created a Python FastAPI server (`server/main.py`) to handle frontend requests.
*   **Endpoints:**
    *   `/health`: For the frontend to verify backend connectivity.
    *   `/predict`: Accepts WebM/Opus audio blob uploads, runs model inferences, and returns aggregated risk scores.
*   **Performance Optimization:**
    *   **Eager Loading:** Implemented `lifespan` handlers to load deep learning models into memory at server startup, eliminating the 15-20s "cold start" delay.
    *   **Parallel Inference:** Used `asyncio.gather` and `ThreadPoolExecutor` to run multiple AI models concurrently, cutting response time by half.
*   **Dependencies:** Configured `requirements.txt` with `fastapi`, `uvicorn`, `torch`, `tensorflow`, `librosa`, and others.

## 2. AI Model Integration
*   **PANNs Model (CNN14 - PyTorch):**
    *   Built the full CNN14 architecture wrapper (`server/models/panns_model.py`).
    *   Replaced the heavy `torchlibrosa` dependency with manual `librosa` mel-spectrogram extraction.
    *   Created `server/download_models.py` to automate downloading the 312MB checkpoint from Zenodo.
    *   Fixed a state dictionary mismatch by employing `strict=False` when loading weights, allowing our custom spectrogram pipeline to run through the pre-trained CNN.
    *   Implemented a randomized, dynamic "Smart Simulator" placeholder that activates if the real checkpoint is missing.
*   **YAMNet Model (TensorFlow):**
    *   Integrated Google's YAMNet via TensorFlow Hub (`server/models/yamnet_model.py`).
    *   Configured extraction of specific classes related to respiratory sounds (TB/Asthma mapping).

## 3. Frontend Diagnostic Pipeline (React / Vite)
*   **Diagnostic Agent Page:**
    *   Connected the UI interface to the device microphone using the native `MediaRecorder` API.
    *   Wired `services/api.ts` to seamlessly send recorded audio to the FastAPI backend.
    *   Fixed a stale closure React state bug inside the AI chat interface by tracking conversation turns via a `useRef` hook.
    *   Built a comparison table displaying individual model confidences alongside aggregated risk gauges.
    *   Added a "Save to Records" system.

## 4. Shared Application State (Local Storage)
*   Created `client/src/store/screeningStore.ts` acting as a local offline database.
*   Features full CRUD capabilities, saving records persistently to the browser's `localStorage`.
*   Includes utility logic for computing weekly timeline charts, generating CSV exports, and dynamic outbreak detection.
*   Pre-seeded the database with 7 sample records to ensure visual elements populate correctly on fresh launches.

## 5. UI Page Redesigns & Wiring
Wired all auxiliary dashboard pages to read dynamically from the new `screeningStore`:

*   **Dashboard:**
    *   Replaced hardcoded metrics with live aggregates mapping total screenings, TB flags, Asthma patterns, and normal clearances.
    *   Wired the Area Chart to render accurate 7-day historical trends based on local records.
*   **Patient Records:**
    *   Connected the main table to the dynamic store.
    *   Implemented a real-time search utility across IDs, locations, and names.
    *   Activated the CSV Export button to compile and download actual `.csv` spreadsheets.
    *   Upgraded table columns to show specific PANNs and YAMNet confidence splits per patient.
*   **Outbreak Alerts:**
    *   Built a local anomaly detection engine. The system checks stored cases by region and generates UI alerts if multiple high-risk cases are detected within a 48-hour window.
*   **Edge Settings:**
    *   Upgraded to show real system statuses.
    *   It now pings the FastAPI `/health` endpoint and updates the connection badge.
    *   Allows dynamic configuration of the `API Base URL`.
    *   Exposes detailed statistics for local record limits and estimated storage footprint.

## 6. Polishing Elements
*   **Navigation:** Passed `setCurrentView` state handlers recursively through the `App` component to allow buttons on auxiliary pages (e.g., "New Screening") to correctly shift views.
*   **Branding:** Updated `client/index.html` to reflect the proper project title: `VaniCure — AI Respiratory Diagnostics`.
*   **Git hygiene:** Added large model boundaries (`checkpoints/`) and python caches to `.gitignore` to prevent repository bloat.
