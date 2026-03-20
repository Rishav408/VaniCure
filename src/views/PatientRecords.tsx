import { Search, Filter, Download, MoreVertical, FileAudio, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const records = [
  { id: "VC-892", name: "Ramesh Kumar", age: 45, gender: "M", date: "2026-03-20", time: "10:15 AM", location: "Village A", result: "High Risk TB", confidence: "87.4%", status: "critical", sync: "pending" },
  { id: "VC-891", name: "Sunita Devi", age: 32, gender: "F", date: "2026-03-20", time: "09:30 AM", location: "Village B", result: "Asthma Pattern", confidence: "92.1%", status: "warning", sync: "synced" },
  { id: "VC-890", name: "Anil Patel", age: 58, gender: "M", date: "2026-03-20", time: "08:45 AM", location: "Village A", result: "Normal", confidence: "99.2%", status: "safe", sync: "synced" },
  { id: "VC-889", name: "Meena Sharma", age: 24, gender: "F", date: "2026-03-20", time: "07:20 AM", location: "Village C", result: "Normal", confidence: "98.5%", status: "safe", sync: "synced" },
  { id: "VC-888", name: "Kishan Lal", age: 61, gender: "M", date: "2026-03-19", time: "16:40 PM", location: "Village B", result: "COPD Risk", confidence: "76.8%", status: "warning", sync: "synced" },
  { id: "VC-887", name: "Pooja Singh", age: 19, gender: "F", date: "2026-03-19", time: "14:10 PM", location: "Village A", result: "Normal", confidence: "99.9%", status: "safe", sync: "synced" },
  { id: "VC-886", name: "Raju Bhai", age: 52, gender: "M", date: "2026-03-19", time: "11:05 AM", location: "Village D", result: "High Risk TB", confidence: "89.1%", status: "critical", sync: "synced" },
];

export function PatientRecords() {
  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Patient Records</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Local database of offline screenings. Syncs automatically when online.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium rounded-xl transition-colors border border-zinc-200 dark:border-white/5 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Records</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">1,284</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pending Sync</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">12</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Critical Cases</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">33</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>

      <div className="glass-card border border-zinc-200 dark:border-white/5 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by ID, Name, or Location..." 
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-medical-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-100/50 dark:bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold sticky top-0 z-10 backdrop-blur-md">
                <th className="p-4 font-mono">Scan ID</th>
                <th className="p-4">Patient Info</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Location</th>
                <th className="p-4">Diagnostic Result</th>
                <th className="p-4">Audio</th>
                <th className="p-4">Sync Status</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                  <td className="p-4 text-sm font-mono text-medical-600 dark:text-medical-400">{record.id}</td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">{record.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{record.age}y • {record.gender}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-zinc-700 dark:text-zinc-300">{record.date}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{record.time}</div>
                  </td>
                  <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">{record.location}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        record.status === 'critical' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' :
                        record.status === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                        'bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 border-medical-200 dark:border-medical-500/20'
                      }`}>
                        {record.result}
                      </div>
                      <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{record.confidence}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <button className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-medical-600 dark:hover:text-medical-400 hover:bg-medical-50 dark:hover:bg-medical-500/10 transition-colors">
                      <FileAudio className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="p-4">
                    {record.sync === 'synced' ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <button className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-[#FAFAFA] dark:bg-zinc-900/50 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <div>Showing 1 to 7 of 1,284 entries</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
