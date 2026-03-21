import { AlertTriangle, MapPin, ShieldAlert, Activity, Users, ArrowRight } from "lucide-react";

export function OutbreakAlerts() {
  const alerts = [
    { id: 1, region: "Village B (North Sector)", type: "Asthma Spike", cases: 15, baseline: 4, status: "Critical", time: "2 hours ago" },
    { id: 2, region: "Village A (Central)", type: "TB Cluster", cases: 3, baseline: 0, status: "Warning", time: "5 hours ago" },
    { id: 3, region: "Village D (East)", type: "COPD Anomaly", cases: 8, baseline: 2, status: "Investigating", time: "1 day ago" },
  ];

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Outbreak Alerts</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">AI-driven anomaly detection across rural nodes.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">1 Critical Alert</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Active Anomalies</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">3</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">+2 since last week</p>
        </div>
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Regions Affected</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">4</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Across 2 districts</p>
        </div>
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-medical-50 dark:bg-medical-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-medical-600 dark:text-medical-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Population at Risk</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">~4,200</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Based on census data</p>
        </div>
      </div>

      <div className="glass-card flex-1 p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Recent Anomaly Detections</h3>
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-5 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`mt-1 w-2 h-2 rounded-full ${alert.status === 'Critical' ? 'bg-red-500 animate-pulse' : alert.status === 'Warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
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
                    <MapPin className="w-3.5 h-3.5" /> {alert.region} • {alert.time}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2">
                    Detected <strong className="text-zinc-900 dark:text-white">{alert.cases} cases</strong> in the last 48 hours (Baseline: {alert.baseline}).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                  View Details
                </button>
                <button className="px-4 py-2 bg-medical-500 hover:bg-medical-600 dark:hover:bg-medical-400 text-white dark:text-zinc-950 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                  Take Action <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
