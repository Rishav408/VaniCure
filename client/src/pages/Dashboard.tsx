import { Activity, Users, MapPin, AlertTriangle, Stethoscope } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Mon", tb: 4, asthma: 12, normal: 45 },
  { name: "Tue", tb: 3, asthma: 15, normal: 52 },
  { name: "Wed", tb: 7, asthma: 10, normal: 48 },
  { name: "Thu", tb: 2, asthma: 18, normal: 60 },
  { name: "Fri", tb: 5, asthma: 14, normal: 55 },
  { name: "Sat", tb: 8, asthma: 9, normal: 40 },
  { name: "Sun", tb: 4, asthma: 11, normal: 38 },
];

const recentScans = [
  { id: "VC-892", patient: "Ramesh K.", age: 45, location: "Village A", result: "High Risk TB", time: "10 mins ago", status: "critical" },
  { id: "VC-891", patient: "Sunita D.", age: 32, location: "Village B", result: "Asthma Pattern", time: "1 hr ago", status: "warning" },
  { id: "VC-890", patient: "Anil P.", age: 58, location: "Village A", result: "Normal", time: "2 hrs ago", status: "safe" },
  { id: "VC-889", patient: "Meena S.", age: 24, location: "Village C", result: "Normal", time: "3 hrs ago", status: "safe" },
];

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

export function Dashboard() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">District Overview</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Real-time respiratory diagnostics from offline edge nodes.</p>
        </div>
        <button className="px-4 py-2 bg-medical-500 hover:bg-medical-600 dark:hover:bg-medical-400 text-white dark:text-zinc-950 font-semibold rounded-xl shadow-lg shadow-medical-500/20 transition-all flex items-center gap-2">
          <Stethoscope className="w-4 h-4" />
          New Screening
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Screenings", value: "1,284", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "TB High Risk", value: "33", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10" },
          { label: "Asthma Detected", value: "89", icon: Activity, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Active Nodes", value: "12", icon: MapPin, color: "text-medical-400", bg: "bg-medical-400/10" },
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
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Cases detected across all rural nodes</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAsthma" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tb" name="TB Risk" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorTb)" />
                <Area type="monotone" dataKey="asthma" name="Asthma" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorAsthma)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="glass-card p-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Recent Screenings</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Live feed from edge devices</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-medical-500 animate-pulse" />
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {recentScans.map((scan) => (
              <div key={scan.id} className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500">{scan.id}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-400">{scan.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">{scan.patient} <span className="text-zinc-500 font-normal">({scan.age}y)</span></h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {scan.location}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                    scan.status === 'critical' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' :
                    scan.status === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                    'bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 border-medical-200 dark:border-medical-500/20'
                  }`}>
                    {scan.result}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
