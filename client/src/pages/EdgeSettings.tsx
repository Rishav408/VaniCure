import { useState, useEffect } from "react";
import { Cpu, HardDrive, Wifi, Shield, RefreshCw, Database, CheckCircle2, AlertTriangle, XCircle, Loader2, Download } from "lucide-react";
import { checkHealth, getModelStatus, type ModelStatusResponse } from "../services/api";
import { getStats } from "../store/screeningStore";

export function EdgeSettings() {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [modelStatus,   setModelStatus]   = useState<ModelStatusResponse | null>(null);
  const [stats,         setStats]         = useState(getStats());
  const [apiUrl,        setApiUrl]        = useState(() => localStorage.getItem("vanicure_api_url") || "http://localhost:8000");
  const [refreshing,    setRefreshing]    = useState(false);

  useEffect(() => {
    setStats(getStats());
    checkBackend();
    loadModelStatus();
  }, []);

  const checkBackend = async () => {
    setBackendStatus("checking");
    const ok = await checkHealth();
    setBackendStatus(ok ? "online" : "offline");
  };

  const loadModelStatus = async () => {
    const status = await getModelStatus();
    setModelStatus(status);
  };

  const handleSaveApiUrl = () => {
    localStorage.setItem("vanicure_api_url", apiUrl);
    checkBackend();
    loadModelStatus();
  };

  const handleClearCache = () => {
    if (confirm("This will delete ALL saved screening records. Continue?")) {
      localStorage.removeItem("vanicure_screenings");
      setStats(getStats());
    }
  };

  const estimatedStorageKB = stats.total * 0.5;

  const MODEL_DEFS = [
    { key: "panns" as const,
      name: "PANNs CNN14",
      desc: "Large-scale AudioSet pretrained audio tagging",
      instruction: "Run python download_models.py in server/ to get the 312 MB checkpoint.",
      color: "blue" },
    { key: "yamnet" as const,
      name: "YAMNet",
      desc: "MobileNet-based audio event classifier via TF Hub",
      instruction: "Auto-downloads from TensorFlow Hub on first server boot.",
      color: "emerald" },
    { key: "cnn_bilstm" as const,
      name: "CNN-BiLSTM (Custom)",
      desc: "Coswara-trained respiratory 3-class classifier",
      instruction: "Train it: cd model_training && python preprocess.py && python train.py",
      color: "indigo" },
  ];

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Edge Node Settings</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Configure AI models, backend connection, and local storage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto custom-scrollbar pr-2">

        {/* AI Model Status */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">AI Model Status</h3>
            </div>
            <button
              onClick={async () => { setRefreshing(true); await loadModelStatus(); setRefreshing(false); }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {MODEL_DEFS.map(({ key, name, desc, instruction, color }) => {
              const info = modelStatus?.[key];
              const isLive = info && !info.is_placeholder;
              return (
                <div key={key} className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{name}</h4>
                    {!modelStatus ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking
                      </span>
                    ) : isLive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-medical-100 dark:bg-medical-500/20 text-medical-600 dark:text-medical-400">
                        ● Live
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        Placeholder
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{desc}</p>
                  {info && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-zinc-400">Architecture: </span><span className="text-zinc-700 dark:text-zinc-300">{info.architecture}</span></div>
                      <div><span className="text-zinc-400">Classes: </span><span className="text-zinc-700 dark:text-zinc-300">{info.classes}</span></div>
                      <div><span className="text-zinc-400">Input SR: </span><span className="text-zinc-700 dark:text-zinc-300">{info.sample_rate.toLocaleString()} Hz</span></div>
                      <div><span className="text-zinc-400">Checkpoint: </span><span className="text-zinc-700 dark:text-zinc-300">{info.checkpoint_size_mb > 0 ? `${info.checkpoint_size_mb} MB` : "—"}</span></div>
                    </div>
                  )}
                  {!isLive && (
                    <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-200 dark:border-amber-500/20 font-mono">
                      {instruction}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Backend Connection */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Backend Connection</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Server Status</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">FastAPI inference server</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                backendStatus === "online"   ? "bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 border-medical-200 dark:border-medical-500/30"
                : backendStatus === "offline" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-white/10"
              }`}>
                {backendStatus === "online"   && <CheckCircle2 className="w-3.5 h-3.5" />}
                {backendStatus === "offline"  && <XCircle className="w-3.5 h-3.5" />}
                {backendStatus === "checking" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {backendStatus === "online" ? "Online" : backendStatus === "offline" ? "Offline" : "Checking..."}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">API Base URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                  className="flex-1 bg-[#FAFAFA] dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-medical-500/50 transition-colors"
                />
                <button
                  onClick={handleSaveApiUrl}
                  className="px-4 py-3 bg-medical-500 hover:bg-medical-600 dark:hover:bg-medical-400 text-white dark:text-zinc-950 rounded-xl text-sm font-semibold transition-colors"
                >Save</button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Default: <code className="font-mono">http://localhost:8000</code></p>
            </div>

            <button
              onClick={async () => { setRefreshing(true); await checkBackend(); await loadModelStatus(); setRefreshing(false); }}
              className="w-full py-3 bg-[#FAFAFA] dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Re-Check Connection
            </button>

            {/* Quick Setup */}
            {backendStatus === "offline" && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 text-xs font-mono text-zinc-600 dark:text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm mb-2">Quick Start:</p>
                <p className="text-medical-600 dark:text-medical-400"># Terminal 1 — Backend</p>
                <p>cd server</p>
                <p>pip install -r requirements.txt</p>
                <p>uvicorn main:app --reload --port 8000</p>
                <p className="text-medical-600 dark:text-medical-400 mt-2"># Terminal 2 — Frontend</p>
                <p>cd client && npm run dev</p>
              </div>
            )}
          </div>
        </div>

        {/* Local Storage */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Local Storage</h3>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Records",      value: String(stats.total) },
                { label: "Pending Sync", value: String(stats.pendingSync) },
                { label: "Est. Size",    value: `${estimatedStorageKB.toFixed(1)} KB` },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
            <button
              onClick={handleClearCache}
              className="w-full py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4" /> Clear All Records
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Security &amp; Privacy</h3>
          </div>
          <div className="space-y-5">
            {[
              { title: "On-Device Processing",    desc: "All inference runs locally. No audio sent externally.", ok: true },
              { title: "Patient Data Encryption", desc: "Records stored in localStorage (encrypted in future release).", ok: false },
              { title: "Zero External API Calls", desc: "No cloud dependencies. Works fully offline.", ok: true },
            ].map(({ title, desc, ok }) => (
              <div key={title} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${ok ? "bg-medical-50 dark:bg-medical-500/10" : "bg-amber-50 dark:bg-amber-500/10"}`}>
                  {ok ? <CheckCircle2 className="w-4 h-4 text-medical-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-white">{title}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-medical-600 dark:text-medical-400 bg-medical-50 dark:bg-medical-500/10 p-3 rounded-lg border border-medical-200 dark:border-medical-500/20 flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              Patient audio never leaves this device. Inference runs on your local machine.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
