import { useState, useEffect } from "react";
import { Cpu, HardDrive, Wifi, Shield, RefreshCw, Database, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { checkHealth } from "../services/api";
import { getStats } from "../store/screeningStore";

export function EdgeSettings() {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [stats, setStats] = useState(getStats());
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("vanicure_api_url") || "http://localhost:8000");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setStats(getStats());
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setBackendStatus("checking");
    const ok = await checkHealth();
    setBackendStatus(ok ? "online" : "offline");
  };

  const handleSaveApiUrl = () => {
    localStorage.setItem("vanicure_api_url", apiUrl);
    checkBackend();
  };

  const handleClearCache = () => {
    if (confirm("This will delete all saved screening records. Are you sure?")) {
      localStorage.removeItem("vanicure_screenings");
      setStats(getStats());
    }
  };

  const estimatedStorageKB = stats.total * 0.5; // ~0.5 KB per record estimate

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Edge Node Settings</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Configure AI models, backend connection, and local storage.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
        
        {/* AI Model Status */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">AI Model Status</h3>
          </div>
          
          <div className="space-y-4">
            {/* PANNs */}
            <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">PANNs CNN14</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">Placeholder</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Large-scale audio tagging model (AudioSet pretrained)</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400">Architecture:</span>
                  <span className="ml-1 text-zinc-700 dark:text-zinc-300">CNN14 (6 conv blocks)</span>
                </div>
                <div>
                  <span className="text-zinc-400">Classes:</span>
                  <span className="ml-1 text-zinc-700 dark:text-zinc-300">527 AudioSet</span>
                </div>
                <div>
                  <span className="text-zinc-400">Checkpoint:</span>
                  <span className="ml-1 text-zinc-700 dark:text-zinc-300">~312 MB</span>
                </div>
                <div>
                  <span className="text-zinc-400">Input SR:</span>
                  <span className="ml-1 text-zinc-700 dark:text-zinc-300">32kHz</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-200 dark:border-amber-500/20">
                Run <code className="font-mono bg-amber-100 dark:bg-amber-500/20 px-1">python download_models.py</code> in server/ to enable real inference.
              </p>
            </div>

            {/* YAMNet */}
            <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">YAMNet</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-medical-100 dark:bg-medical-500/20 text-medical-600 dark:text-medical-400">Live</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">MobileNet-based audio event classifier via TensorFlow Hub</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400">Architecture:</span>
                  <span className="ml-1 text-zinc-700 dark:text-zinc-300">MobileNet v1</span>
                </div>
                <div>
                  <span className="text-zinc-400">Classes:</span>
                  <span className="ml-1 text-zinc-700 dark:text-zinc-300">521 AudioSet</span>
                </div>
                <div>
                  <span className="text-zinc-400">Size:</span>
                  <span className="ml-1 text-zinc-700 dark:text-zinc-300">~3.7 MB</span>
                </div>
                <div>
                  <span className="text-zinc-400">Input SR:</span>
                  <span className="ml-1 text-zinc-700 dark:text-zinc-300">16kHz</span>
                </div>
              </div>
            </div>

            {/* Model 3 Placeholder */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-300 dark:border-zinc-700 opacity-60">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">CNN-BiLSTM (Your Model)</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-500">Coming Soon</span>
              </div>
              <p className="text-xs text-zinc-400">Build your own respiratory sound classifier and plug it in here.</p>
            </div>
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
            {/* Status */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Server Status</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">FastAPI backend for model inference</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                backendStatus === "online"
                  ? "bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 border-medical-200 dark:border-medical-500/30"
                  : backendStatus === "offline"
                  ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-white/10"
              }`}>
                {backendStatus === "online" && <CheckCircle2 className="w-3.5 h-3.5" />}
                {backendStatus === "offline" && <XCircle className="w-3.5 h-3.5" />}
                {backendStatus === "checking" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {backendStatus === "online" ? "Online" : backendStatus === "offline" ? "Offline" : "Checking..."}
              </div>
            </div>

            {/* API URL Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">API Base URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="flex-1 bg-[#FAFAFA] dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-medical-500/50 transition-colors"
                />
                <button
                  onClick={handleSaveApiUrl}
                  className="px-4 py-3 bg-medical-500 hover:bg-medical-600 dark:hover:bg-medical-400 text-white dark:text-zinc-950 rounded-xl text-sm font-semibold transition-colors"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Default: <code className="font-mono">http://localhost:8000</code></p>
            </div>

            {/* Re-check */}
            <button
              onClick={async () => { setRefreshing(true); await checkBackend(); setRefreshing(false); }}
              className="w-full py-3 bg-[#FAFAFA] dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Re-Check Connection
            </button>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Records Stored</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Est. Data Size</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">{estimatedStorageKB.toFixed(1)} KB</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-zinc-700 dark:text-zinc-300">Pending Sync</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{stats.pendingSync} records</span>
              </div>
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
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Security & Privacy</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white">On-Device Processing</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">All inference runs locally. No audio is sent to external servers.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-500 opacity-50 cursor-not-allowed"></div>
              </label>
            </div>
            <p className="text-xs text-medical-600 dark:text-medical-400 bg-medical-50 dark:bg-medical-500/10 p-3 rounded-lg border border-medical-200 dark:border-medical-500/20 flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              Patient audio never leaves this device. Models run on your local machine via FastAPI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
