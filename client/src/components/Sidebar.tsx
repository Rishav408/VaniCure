import { Activity, LayoutDashboard, Settings, Users, Stethoscope, ShieldAlert } from "lucide-react";
import { cn } from "../utils/utils";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "diagnostic", label: "Diagnostic Agent", icon: Stethoscope },
    { id: "records", label: "Patient Records", icon: Users },
    { id: "alerts", label: "Outbreak Alerts", icon: ShieldAlert },
    { id: "settings", label: "Edge Settings", icon: Settings },
  ];

  return (
    <div className="w-64 h-screen border-r border-zinc-200 dark:border-white/5 bg-[#F3F4F6] dark:bg-zinc-900/50 flex flex-col p-4 transition-colors">
      <div className="flex items-center gap-3 mb-10 px-2 mt-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-medical-500 to-cyan-500 dark:from-medical-400 dark:to-cyan-500 flex items-center justify-center shadow-lg shadow-medical-500/20">
          <Activity className="w-5 h-5 text-white dark:text-zinc-950" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">VaniCure</h1>
          <p className="text-[10px] text-medical-600 dark:text-medical-400 font-mono uppercase tracking-wider">Offline DLM Agent</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-medical-50 dark:bg-medical-500/10 text-medical-700 dark:text-medical-400 shadow-[inset_0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-medical-600 dark:text-medical-400" : "text-zinc-400 dark:text-zinc-500")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-medical-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Local Edge Node</span>
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">
          Model: CNN-BiLSTM-INT8<br />
          Triage: Gemma-2B-Q4<br />
          Latency: 42ms
        </p>
      </div>
    </div>
  );
}
