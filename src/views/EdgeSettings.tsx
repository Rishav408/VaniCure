import { Cpu, HardDrive, Wifi, Shield, Save, RefreshCw, Database } from "lucide-react";

export function EdgeSettings() {
  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Edge Node Settings</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Configure local AI models and offline storage.</p>
        </div>
        <button className="px-4 py-2 bg-medical-500 hover:bg-medical-600 dark:hover:bg-medical-400 text-white dark:text-zinc-950 font-semibold rounded-xl shadow-lg shadow-medical-500/20 transition-all flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {/* Model Configuration */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">AI Model Configuration</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Acoustic Diagnostic Model (DLM)</label>
              <select className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-medical-500/50 transition-colors">
                <option>CNN-BiLSTM (INT8 Quantized) - Fast</option>
                <option>CNN-BiLSTM (FP16) - High Accuracy</option>
                <option>MobileNetV3-Audio - Ultra Low Power</option>
              </select>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">INT8 is recommended for devices with &lt;4GB RAM.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Triage Language Model (SLM)</label>
              <select className="w-full bg-[#FAFAFA] dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-medical-500/50 transition-colors">
                <option>Gemma-2B (Q4_K_M) - Multilingual</option>
                <option>Phi-3-Mini (Q4) - English Optimized</option>
                <option>Llama-3-8B (Q2) - High Resource</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data & Sync */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Data Synchronization</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Auto-Sync when Online</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Automatically push records to central server.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Sync Audio Files</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Upload raw WAV files (consumes high bandwidth).</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-500"></div>
              </label>
            </div>

            <button className="w-full py-3 bg-[#FAFAFA] dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Force Manual Sync Now
            </button>
          </div>
        </div>

        {/* Local Storage */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Local Storage Management</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-zinc-700 dark:text-zinc-300">Device Storage (12.4 GB / 32 GB)</span>
                <span className="text-medical-600 dark:text-medical-400">38%</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-medical-500 w-[38%]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Models</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">2.8 GB</p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Audio Cache</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">1.2 GB</p>
              </div>
            </div>

            <button className="w-full py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
              <Database className="w-4 h-4" /> Clear Audio Cache
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
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white">On-Device Encryption</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">AES-256 encryption for local patient records.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-500 opacity-50 cursor-not-allowed"></div>
              </label>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20">
              Encryption is enforced by policy and cannot be disabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
