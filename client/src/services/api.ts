const API_BASE = "http://localhost:8000";

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
  panns: ModelResult;
  yamnet: ModelResult;
}

/**
 * Send an audio blob to the backend for PANNs + YAMNet inference.
 */
export async function predictAudio(audioBlob: Blob): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.wav");

  const response = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if the backend server is reachable.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
