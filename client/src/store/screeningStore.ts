/**
 * Screening Store — localStorage-backed data store for VaniCure.
 * All pages read from this store; DiagnosticAgent writes to it.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ModelResult {
  model: string;
  tb_risk: number;
  asthma_risk: number;
  normal: number;
  placeholder?: boolean;
}

export interface ScreeningRecord {
  id: string;
  patientName: string;
  age: number;
  gender: "M" | "F" | "O";
  location: string;
  complaint?: string;           // Added: chief complaint from patient form
  date: string;                 // ISO date string
  time: string;                 // display time e.g. "10:15 AM"
  overallResult: string;        // "High Risk — TB" | "Asthma / COPD Pattern" | "Low Risk — Normal"
  riskLevel: "critical" | "warning" | "safe";
  confidence: number;           // 0-100
  models: ModelResult[];
  audioDurationSec: number;
  synced: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "vanicure_screenings";

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_DATA: ScreeningRecord[] = [
  {
    id: "VC-892", patientName: "Ramesh Kumar", age: 45, gender: "M",
    location: "Village A, Rajkot", complaint: "Persistent Cough (2+ weeks)",
    date: "2026-03-24", time: "10:15 AM",
    overallResult: "High Risk — TB", riskLevel: "critical", confidence: 87.4,
    models: [
      { model: "PANNs-CNN14", tb_risk: 0.89, asthma_risk: 0.06, normal: 0.05, placeholder: false },
      { model: "YAMNet",      tb_risk: 0.86, asthma_risk: 0.08, normal: 0.06, placeholder: false },
      { model: "CNN-BiLSTM",  tb_risk: 0.82, asthma_risk: 0.10, normal: 0.08, placeholder: false },
    ],
    audioDurationSec: 4.2, synced: false,
  },
  {
    id: "VC-891", patientName: "Sunita Devi", age: 32, gender: "F",
    location: "Village B, Surat", complaint: "Wheezing / Whistling Sound",
    date: "2026-03-24", time: "09:30 AM",
    overallResult: "Asthma / COPD Pattern", riskLevel: "warning", confidence: 92.1,
    models: [
      { model: "PANNs-CNN14", tb_risk: 0.08, asthma_risk: 0.82, normal: 0.10, placeholder: false },
      { model: "YAMNet",      tb_risk: 0.05, asthma_risk: 0.78, normal: 0.17, placeholder: false },
      { model: "CNN-BiLSTM",  tb_risk: 0.06, asthma_risk: 0.80, normal: 0.14, placeholder: false },
    ],
    audioDurationSec: 3.8, synced: true,
  },
  {
    id: "VC-890", patientName: "Anil Patel", age: 58, gender: "M",
    location: "Village A, Rajkot", complaint: "General Respiratory Illness",
    date: "2026-03-23", time: "08:45 AM",
    overallResult: "Low Risk — Normal", riskLevel: "safe", confidence: 99.2,
    models: [
      { model: "PANNs-CNN14", tb_risk: 0.01, asthma_risk: 0.02, normal: 0.97, placeholder: false },
      { model: "YAMNet",      tb_risk: 0.02, asthma_risk: 0.01, normal: 0.97, placeholder: false },
      { model: "CNN-BiLSTM",  tb_risk: 0.01, asthma_risk: 0.01, normal: 0.98, placeholder: false },
    ],
    audioDurationSec: 5.1, synced: true,
  },
  {
    id: "VC-889", patientName: "Meena Sharma", age: 24, gender: "F",
    location: "Village C, Vadodara", complaint: "Breathlessness / Shortness of Breath",
    date: "2026-03-23", time: "07:20 AM",
    overallResult: "Low Risk — Normal", riskLevel: "safe", confidence: 98.5,
    models: [
      { model: "PANNs-CNN14", tb_risk: 0.02, asthma_risk: 0.03, normal: 0.95, placeholder: false },
      { model: "YAMNet",      tb_risk: 0.01, asthma_risk: 0.02, normal: 0.97, placeholder: false },
    ],
    audioDurationSec: 3.5, synced: true,
  },
  {
    id: "VC-888", patientName: "Kishan Lal", age: 61, gender: "M",
    location: "Village B, Surat", complaint: "Chest Pain while Breathing",
    date: "2026-03-22", time: "04:40 PM",
    overallResult: "Asthma / COPD Pattern", riskLevel: "warning", confidence: 76.8,
    models: [
      { model: "PANNs-CNN14", tb_risk: 0.15, asthma_risk: 0.62, normal: 0.23, placeholder: false },
      { model: "YAMNet",      tb_risk: 0.12, asthma_risk: 0.58, normal: 0.30, placeholder: false },
    ],
    audioDurationSec: 6.0, synced: true,
  },
  {
    id: "VC-887", patientName: "Pooja Singh", age: 19, gender: "F",
    location: "Village A, Rajkot", complaint: "General Respiratory Illness",
    date: "2026-03-22", time: "02:10 PM",
    overallResult: "Low Risk — Normal", riskLevel: "safe", confidence: 99.9,
    models: [
      { model: "PANNs-CNN14", tb_risk: 0.00, asthma_risk: 0.01, normal: 0.99, placeholder: false },
      { model: "YAMNet",      tb_risk: 0.01, asthma_risk: 0.00, normal: 0.99, placeholder: false },
    ],
    audioDurationSec: 4.0, synced: true,
  },
  {
    id: "VC-886", patientName: "Raju Bhai", age: 52, gender: "M",
    location: "Village B, Surat", complaint: "Night Sweats & Weight Loss",
    date: "2026-03-21", time: "11:05 AM",
    overallResult: "High Risk — TB", riskLevel: "critical", confidence: 89.1,
    models: [
      { model: "PANNs-CNN14", tb_risk: 0.91, asthma_risk: 0.04, normal: 0.05, placeholder: false },
      { model: "YAMNet",      tb_risk: 0.87, asthma_risk: 0.06, normal: 0.07, placeholder: false },
    ],
    audioDurationSec: 5.5, synced: true,
  },
];

// ─── Store Functions ─────────────────────────────────────────────────────────

function initStore(): ScreeningRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  try {
    return JSON.parse(raw) as ScreeningRecord[];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
}

/** Get all screenings, newest first. */
export function getScreenings(): ScreeningRecord[] {
  return initStore().sort((a, b) => {
    const da = new Date(`${a.date} ${a.time}`).getTime();
    const db = new Date(`${b.date} ${b.time}`).getTime();
    return db - da;
  });
}

/** Save a new screening record. */
export function saveScreening(record: Omit<ScreeningRecord, "id">): ScreeningRecord {
  const records = initStore();
  const maxNum = records.reduce((max, r) => {
    const n = parseInt(r.id.replace("VC-", ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const newRecord: ScreeningRecord = { ...record, id: `VC-${maxNum + 1}` };
  records.unshift(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return newRecord;
}

/** Delete a screening record by ID. */
export function deleteScreening(id: string): void {
  const records = initStore().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/** Get aggregate stats. */
export function getStats() {
  const records = getScreenings();
  return {
    total:          records.length,
    tbHighRisk:     records.filter(r => r.riskLevel === "critical").length,
    asthmaDetected: records.filter(r => r.riskLevel === "warning").length,
    normal:         records.filter(r => r.riskLevel === "safe").length,
    pendingSync:    records.filter(r => !r.synced).length,
  };
}

/** Get weekly chart data (last 7 days). */
export function getWeeklyData() {
  const records = getScreenings();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayRecords = records.filter(r => r.date === dateStr);
    return {
      name:   days[d.getDay()],
      tb:     dayRecords.filter(r => r.riskLevel === "critical").length,
      asthma: dayRecords.filter(r => r.riskLevel === "warning").length,
      normal: dayRecords.filter(r => r.riskLevel === "safe").length,
    };
  });
}

/** Detect outbreak anomalies — locations with ≥2 high-risk cases. */
export function getOutbreakAlerts() {
  const records = getScreenings();
  const locationMap: Record<string, ScreeningRecord[]> = {};
  for (const r of records) {
    if (!locationMap[r.location]) locationMap[r.location] = [];
    locationMap[r.location].push(r);
  }

  const alerts: {
    id: number; region: string; type: string; cases: number;
    totalScreenings: number; status: "Critical" | "Warning" | "Monitoring"; latestTime: string;
  }[] = [];

  let id = 1;
  for (const [location, recs] of Object.entries(locationMap)) {
    const critical = recs.filter(r => r.riskLevel === "critical");
    const warning  = recs.filter(r => r.riskLevel === "warning");
    if (critical.length >= 2) alerts.push({ id: id++, region: location, type: "TB Cluster", cases: critical.length, totalScreenings: recs.length, status: "Critical", latestTime: critical[0].time });
    if (warning.length  >= 2) alerts.push({ id: id++, region: location, type: "Respiratory Spike", cases: warning.length, totalScreenings: recs.length, status: "Warning", latestTime: warning[0].time });
    if (critical.length === 1) alerts.push({ id: id++, region: location, type: "TB Case Detected", cases: 1, totalScreenings: recs.length, status: "Monitoring", latestTime: critical[0].time });
  }
  return alerts.sort((a, b) => ({ Critical: 0, Warning: 1, Monitoring: 2 }[a.status] - ({ Critical: 0, Warning: 1, Monitoring: 2 }[b.status])));
}

/** Export all records as CSV and trigger browser download. */
export function exportCSV() {
  const records = getScreenings();
  const headers = [
    "Scan ID", "Patient Name", "Age", "Gender", "Location", "Chief Complaint",
    "Date", "Time", "Result", "Risk Level", "Confidence (%)",
    "PANNs TB Risk", "PANNs Asthma Risk", "YAMNet TB Risk", "YAMNet Asthma Risk",
    "CNN-BiLSTM TB Risk", "CNN-BiLSTM Asthma Risk",
    "Audio Duration (s)", "Synced"
  ];
  const rows = records.map(r => {
    const panns  = r.models.find(m => m.model.includes("PANNs"));
    const yamnet = r.models.find(m => m.model.includes("YAMNet"));
    const cnn    = r.models.find(m => m.model.includes("CNN") && m.model.includes("BiLSTM"));
    return [
      r.id, `"${r.patientName}"`, r.age, r.gender, `"${r.location}"`, `"${r.complaint || ""}"`,
      r.date, r.time, `"${r.overallResult}"`, r.riskLevel, r.confidence.toFixed(1),
      panns  ? (panns.tb_risk   * 100).toFixed(1) : "—",
      panns  ? (panns.asthma_risk * 100).toFixed(1) : "—",
      yamnet ? (yamnet.tb_risk  * 100).toFixed(1) : "—",
      yamnet ? (yamnet.asthma_risk * 100).toFixed(1) : "—",
      cnn    ? (cnn.tb_risk    * 100).toFixed(1) : "—",
      cnn    ? (cnn.asthma_risk * 100).toFixed(1) : "—",
      r.audioDurationSec.toFixed(1), r.synced ? "Yes" : "No",
    ].join(",");
  });
  const csv  = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `vanicure_screenings_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
