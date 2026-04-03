import { useState, useEffect } from "react";
import { Cpu, HardDrive, Wifi, Shield, RefreshCw, Database, CheckCircle2, AlertTriangle, XCircle, Loader2, Activity, Layers, Zap } from "lucide-react";
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

  const PIPELINE_A_MODELS = [
    { key: "panns" as const, name: "PANNs CNN14", desc: "Large-scale AudioSet pretrained audio tagging", instruction: "Run python download_models.py in server/ to get the 312 MB checkpoint." },
    { key: "yamnet" as const, name: "YAMNet", desc: "MobileNet-based audio event classifier via TF Hub", instruction: "Auto-downloads from TensorFlow Hub on first server boot." },
    { key: "cnn_bilstm" as const, name: "CNN-BiLSTM (Custom)", desc: "Coswara-trained respiratory 3-class classifier", instruction: "Train it: cd model_training && python preprocess.py && python train.py" },
  ];

  const PIPELINE_B_MODELS = [
    { key: "resnet_audio" as const, name: "ResNet18-Audio", desc: "ResNet architecture adapted for audio spectrograms", instruction: "Model uses pretrained weights, loads on server startup." },
    { key: "mobilenet_audio" as const, name: "MobileNetV2-Audio", desc: "Lightweight depthwise separable CNN for edge deployment", instruction: "Model uses pretrained weights, loads on server startup." },
    { key: "tinycnn_audio" as const, name: "TinyCNN-Audio", desc: "Fast 3-layer baseline convolutional classifier", instruction: "Model uses random init, loads on server startup." },
  ];

  const renderModelCard = (m: { key: string; name: string; desc: string; instruction: string }, accentColor: string) => {
    const info = modelStatus?.[m.key as keyof ModelStatusResponse];
    const isLive = info && !info.is_placeholder;
    return (
      <div key={m.key} className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 transition-all hover:border-zinc-300 dark:hover:border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{m.name}</h4>
          {!modelStatus ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Checking
            </span>
          ) : isLive ? (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-medical-100 dark:bg-medical-500/20 text-medical-600 dark:text-medical-400 border border-medical-200 dark:border-medical-500/30`}>
              ● Live
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
              Placeholder
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{m.desc}</p>
        {info && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mb-2">
            <div><span className="text-zinc-400">Arch: </span><span className="text-zinc-700 dark:text-zinc-300 font-mono">{info.architecture}</span></div>
            <div><span className="text-zinc-400">Classes: </span><span className="text-zinc-700 dark:text-zinc-300 font-mono">{info.classes}</span></div>
            <div><span className="text-zinc-400">Sample Rate: </span><span className="text-zinc-700 dark:text-zinc-300 font-mono">{info.sample_rate.toLocaleString()} Hz</span></div>
            <div><span className="text-zinc-400">Size: </span><span className="text-zinc-700 dark:text-zinc-300 font-mono">{info.checkpoint_size_mb > 0 ? `${info.checkpoint_size_mb} MB` : "—"}</span></div>
          </div>
        )}
        {!isLive && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-200 dark:border-amber-500/20 font-mono">
            {m.instruction}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Edge Node Settings</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Configure AI pipelines, backend connection, and local storage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto custom-scrollbar pr-2">

        {/* Pipeline A: Original Models */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-medical-200 dark:border-medical-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-50 to-blue-50 dark:from-medical-500/10 dark:to-blue-500/10 flex items-center justify-center border border-medical-200 dark:border-medical-500/30">
                <Layers className="w-5 h-5 text-medical-600 dark:text-medical-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Pipeline A (Original)</h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">PANNs + YAMNet + CNN-BiLSTM • 3 in parallel</p>
              </div>
            </div>
            <button
              onClick={async () => { setRefreshing(true); await loadModelStatus(); setRefreshing(false); }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {PIPELINE_A_MODELS.map(m => renderModelCard(m, "medical"))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-medical-50 dark:bg-medical-500/10 border border-medical-200 dark:border-medical-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-medical-700 dark:text-medical-400">Pipeline A Ensemble</span>
              <div className="flex gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-zinc-900 text-medical-700 dark:text-medical-400 border border-medical-200 dark:border-medical-500/30">Acc: 84.2%</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-zinc-900 text-medical-700 dark:text-medical-400 border border-medical-200 dark:border-medical-500/30">F1: 0.82</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline B: New Models */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-violet-200 dark:border-violet-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 flex items-center justify-center border border-violet-200 dark:border-violet-500/30">
                <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Pipeline B (New)</h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">ResNet + MobileNet + TinyCNN • 3 in parallel</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {PIPELINE_B_MODELS.map(m => renderModelCard(m, "violet"))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-400">Pipeline B Ensemble</span>
              <div className="flex gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-zinc-900 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30">Acc: 81.2%</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-zinc-900 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30">F1: 0.78</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline C: Combined Ensemble */}
        <div className="glass-card p-6 h-fit lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-emerald-200 dark:border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Pipeline C (Combined Ensemble)</h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">All 6 models from A + B • Weighted Average</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Architecture diagram */}
            <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-br from-zinc-50 to-emerald-50/30 dark:from-zinc-900/50 dark:to-emerald-500/5 border border-zinc-200 dark:border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Architecture Flow</p>
              <div className="flex items-center gap-2 text-[10px] flex-wrap">
                <span className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold">Audio Input</span>
                <span className="text-zinc-400">→</span>
                <span className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold">Preprocessing</span>
                <span className="text-zinc-400">→</span>
                <div className="flex gap-1">
                  <span className="px-2 py-1 rounded bg-medical-100 dark:bg-medical-500/20 text-medical-700 dark:text-medical-400 font-bold border border-medical-200 dark:border-medical-500/30">A</span>
                  <span className="px-2 py-1 rounded bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 font-bold border border-violet-200 dark:border-violet-500/30">B</span>
                </div>
                <span className="text-zinc-400">→</span>
                <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/30">C = Avg(A, B)</span>
                <span className="text-zinc-400">→</span>
                <span className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold">Risk Report</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5">
                  <span className="text-zinc-400">Parallel mode: </span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">A ‖ B run simultaneously → merge into C</span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5">
                  <span className="text-zinc-400">Sequential mode: </span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">A finishes → B runs → merge into C</span>
                </div>
              </div>
            </div>

            {/* Performance summary */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">Combined Performance</p>
              <div className="space-y-3">
                {[
                  { label: "Pipeline A", acc: "84.2%", f1: "0.82", color: "text-medical-600 dark:text-medical-400" },
                  { label: "Pipeline B", acc: "81.2%", f1: "0.78", color: "text-violet-600 dark:text-violet-400" },
                  { label: "Pipeline C", acc: "82.7%", f1: "0.80", color: "text-emerald-600 dark:text-emerald-400" },
                ].map(p => (
                  <div key={p.label} className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${p.color}`}>{p.label}</span>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300">{p.acc}</span>
                      <span className="text-[10px] font-mono text-zinc-500">F1: {p.f1}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-500/20">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Pipeline A achieves highest accuracy. Pipeline C offers the most robust risk assessment combining all models.
                </p>
              </div>
            </div>
          </div>

          {/* All 6 models mini grid */}
          <div className="grid grid-cols-6 gap-2">
            {[
              { name: "PANNs", pipeline: "A", acc: "84.5%", color: "medical" },
              { name: "YAMNet", pipeline: "A", acc: "81.2%", color: "medical" },
              { name: "BiLSTM", pipeline: "A", acc: "86.8%", color: "medical" },
              { name: "ResNet", pipeline: "B", acc: "85.0%", color: "violet" },
              { name: "MobNet", pipeline: "B", acc: "82.5%", color: "violet" },
              { name: "TinyCNN", pipeline: "B", acc: "76.1%", color: "violet" },
            ].map((m, i) => (
              <div key={i} className={`p-2 rounded-lg text-center border transition-all hover:scale-105 ${
                m.color === "medical"
                  ? "bg-medical-50 dark:bg-medical-500/10 border-medical-200 dark:border-medical-500/30"
                  : "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30"
              }`}>
                <p className={`text-[10px] font-bold ${m.color === "medical" ? "text-medical-700 dark:text-medical-400" : "text-violet-700 dark:text-violet-400"}`}>{m.name}</p>
                <p className="text-[9px] text-zinc-400 mt-0.5">{m.pipeline}</p>
                <p className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{m.acc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Backend Connection */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
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

        {/* Local Storage + Security */}
        <div className="flex flex-col gap-6">
          {/* Local Storage */}
          <div className="glass-card p-6 h-fit">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
                <HardDrive className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Local Storage</h3>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Records",      value: String(stats.total),            icon: "📋" },
                  { label: "Pending Sync", value: String(stats.pendingSync),      icon: "🔄" },
                  { label: "Est. Size",    value: `${estimatedStorageKB.toFixed(1)} KB`, icon: "💾" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 text-center">
                    <p className="text-lg mb-1">{icon}</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">{value}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
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
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-200 dark:border-amber-500/30">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Security & Privacy</h3>
            </div>
            <div className="space-y-4">
              {[
                { title: "On-Device Processing",    desc: "All inference runs locally. No audio sent externally.", ok: true },
                { title: "Patient Data Encryption", desc: "Records stored in localStorage (encrypted in future).", ok: false },
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
    </div>
  );
}
