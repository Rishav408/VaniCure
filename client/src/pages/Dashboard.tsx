import { useState, useEffect } from "react";
import { Activity, Users, AlertTriangle, Stethoscope, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getStats, getWeeklyData, getScreenings } from "../store/screeningStore";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-3 rounded-xl shadow-lg">
        <p className="text-sm font-medium text-zinc-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-zinc-600 dark:text-zinc-400">{entry.name}:</span>
            <span className="font-semibold text-zinc-900 dark:text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function Dashboard({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [stats, setStats] = useState(getStats());
  const [chartData, setChartData] = useState(getWeeklyData());
  const [recentScans, setRecentScans] = useState(getScreenings().slice(0, 5));

  // Refresh data when page is shown (in case user just saved a screening)
  useEffect(() => {
    setStats(getStats());
    setChartData(getWeeklyData());
    setRecentScans(getScreenings().slice(0, 5));
  }, []);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">District Overview</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Real-time respiratory diagnostics from offline edge nodes.</p>
        </div>
        <button
          onClick={() => onNavigate?.("diagnostic")}
          className="px-4 py-2 bg-medical-500 hover:bg-medical-600 dark:hover:bg-medical-400 text-white dark:text-zinc-950 font-semibold rounded-xl shadow-lg shadow-medical-500/20 transition-all flex items-center gap-2"
        >
          <Stethoscope className="w-4 h-4" />
          New Screening
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Screenings", value: stats.total.toLocaleString(), icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "TB High Risk", value: String(stats.tbHighRisk), icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10" },
          { label: "Asthma / COPD", value: String(stats.asthmaDetected), icon: Activity, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Normal Results", value: String(stats.normal), icon: TrendingUp, color: "text-medical-400", bg: "bg-medical-400/10" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Weekly Diagnostic Trends</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Cases detected from saved screenings (last 7 days)</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAsthma" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tb" name="TB Risk" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorTb)" />
                <Area type="monotone" dataKey="asthma" name="Asthma" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorAsthma)" />
                <Area type="monotone" dataKey="normal" name="Normal" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorNormal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="glass-card p-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Recent Screenings</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">From local device storage</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-medical-500 animate-pulse" />
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {recentScans.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center opacity-50">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No screenings yet. Run your first diagnosis!</p>
              </div>
            ) : (
              recentScans.map((scan) => (
                <div key={scan.id} className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => onNavigate?.("records")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500">{scan.id}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-400">{scan.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-900 dark:text-white">{scan.patientName} <span className="text-zinc-500 font-normal">({scan.age}y)</span></h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{scan.location}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                      scan.riskLevel === 'critical' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' :
                      scan.riskLevel === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                      'bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 border-medical-200 dark:border-medical-500/20'
                    }`}>
                      {scan.overallResult}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {stats.pendingSync > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 text-center">
              {stats.pendingSync} record{stats.pendingSync > 1 ? "s" : ""} pending sync
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
