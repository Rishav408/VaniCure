import { useState, useEffect } from "react";
import { AlertTriangle, MapPin, ShieldAlert, Activity, Users, ArrowRight, Stethoscope, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getOutbreakAlerts, getStats, getScreenings } from "../store/screeningStore";

export function OutbreakAlerts({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [alerts, setAlerts] = useState(getOutbreakAlerts());
  const [stats, setStats] = useState(getStats());
  const [regionsAffected, setRegionsAffected] = useState(0);
  const [acknowledged, setAcknowledged] = useState<Set<number>>(new Set());

  useEffect(() => {
    const a = getOutbreakAlerts();
    setAlerts(a);
    setStats(getStats());
    const uniqueRegions = new Set(a.map(al => al.region));
    setRegionsAffected(uniqueRegions.size);
  }, []);

  const criticalCount = alerts.filter(a => a.status === "Critical").length;
  const warningCount = alerts.filter(a => a.status === "Warning").length;

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Outbreak Alerts</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Anomaly detection from screening records — auto-flags clusters.</p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">{criticalCount} Critical Alert{criticalCount > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Active Anomalies</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{alerts.length}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            {criticalCount} critical, {warningCount} warning
          </p>
        </div>
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Regions Affected</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{regionsAffected}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Across all screening locations</p>
        </div>
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-medical-50 dark:bg-medical-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-medical-600 dark:text-medical-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Total Screened</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">{stats.tbHighRisk} high risk flagged</p>
        </div>
      </div>

      <div className="glass-card flex-1 p-6 flex flex-col overflow-hidden">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Anomaly Detections</h3>
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
          {alerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12">
              <ShieldAlert className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No anomalies detected. All regions are within normal baselines.</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Alerts will appear when ≥2 high-risk cases are found in the same location.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="p-5 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.status === 'Critical' ? 'bg-red-500 animate-pulse' : alert.status === 'Warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div>
                    <h4 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                      {alert.type}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        alert.status === 'Critical' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 
                        alert.status === 'Warning' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 
                        'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}>
                        {alert.status}
                      </span>
                    </h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" /> {alert.region} • Last at {alert.latestTime}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2">
                      Detected <strong className="text-zinc-900 dark:text-white">{alert.cases} case{alert.cases > 1 ? "s" : ""}</strong> of {alert.totalScreenings} total screenings in this area.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => onNavigate?.("records")}
                    className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                  >
                    View Records
                  </button>
                  <button
                    onClick={() => onNavigate?.("diagnostic")}
                    className="px-4 py-2 bg-medical-500 hover:bg-medical-600 dark:hover:bg-medical-400 text-white dark:text-zinc-950 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    <Stethoscope className="w-4 h-4" /> New Screening <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
