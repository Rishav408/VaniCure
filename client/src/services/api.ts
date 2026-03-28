const API_BASE = (() => {
  const stored = localStorage.getItem("vanicure_api_url");
  return stored || "http://localhost:8000";
})();

export interface ModelResult {
  model: string;
  tb_risk: number;
  asthma_risk: number;
  normal: number;
  duration_sec?: number;
  placeholder?: boolean;
  cough_score?: number;
  breathing_score?: number;
  top_classes?: { class: string; score: number }[];
  error?: string;
}

export interface PredictResponse {
  panns:      ModelResult;
  yamnet:     ModelResult;
  cnn_bilstm: ModelResult;
}

export interface ModelStatus {
  loaded: boolean;
  checkpoint_exists: boolean;
  is_placeholder: boolean;
  architecture: string;
  classes: number;
  sample_rate: number;
  checkpoint_size_mb: number;
}

export interface ModelStatusResponse {
  panns:      ModelStatus;
  yamnet:     ModelStatus;
  cnn_bilstm: ModelStatus;
}

/**
 * Send an audio blob to the backend for full 3-model inference.
 */
export async function predictAudio(audioBlob: Blob): Promise<PredictResponse> {
  const formData = new FormData();
  const filename = (audioBlob as File).name || "recording.webm";
  formData.append("file", audioBlob, filename);

  const base = localStorage.getItem("vanicure_api_url") || "http://localhost:8000";
  const response = await fetch(`${base}/predict`, {
    method: "POST",
    body:   formData,
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get real-time model status from the backend.
 */
export async function getModelStatus(): Promise<ModelStatusResponse | null> {
  try {
    const base = localStorage.getItem("vanicure_api_url") || "http://localhost:8000";
    const res  = await fetch(`${base}/model_status`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Check if the backend server is reachable.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const base = localStorage.getItem("vanicure_api_url") || "http://localhost:8000";
    const res  = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
