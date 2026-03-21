import { useState, useEffect, useMemo } from "react";
import { Search, Download, FileAudio, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { getScreenings, getStats, exportCSV, type ScreeningRecord } from "../store/screeningStore";

export function PatientRecords() {
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    setRecords(getScreenings());
    setStats(getStats());
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.patientName.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.overallResult.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Patient Records</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Local database of offline screenings. Syncs automatically when online.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium rounded-xl transition-colors border border-zinc-200 dark:border-white/5 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Records</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.total}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pending Sync</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.pendingSync}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Critical Cases</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.tbHighRisk}</h3>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Name, or Location..." 
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-medical-500/50 transition-colors"
            />
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {filtered.length} of {records.length} records
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
                <th className="p-4">PANNs Score</th>
                <th className="p-4">YAMNet Score</th>
                <th className="p-4">Audio</th>
                <th className="p-4">Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {filtered.map((record) => {
                const panns = record.models.find(m => m.model.includes("PANNs"));
                const yamnet = record.models.find(m => m.model.includes("YAMNet"));
                return (
                  <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4 text-sm font-mono text-medical-600 dark:text-medical-400">{record.id}</td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">{record.patientName}</div>
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
                          record.riskLevel === 'critical' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' :
                          record.riskLevel === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                          'bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 border-medical-200 dark:border-medical-500/20'
                        }`}>
                          {record.overallResult}
                        </div>
                        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{record.confidence.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {panns ? (
                        <div className="text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-red-500 font-mono font-bold">{(panns.tb_risk * 100).toFixed(0)}%</span>
                            <span className="text-zinc-400">TB</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500 font-mono font-bold">{(panns.asthma_risk * 100).toFixed(0)}%</span>
                            <span className="text-zinc-400">Asthma</span>
                          </div>
                          {panns.placeholder && <span className="text-[10px] text-amber-500 italic">placeholder</span>}
                        </div>
                      ) : <span className="text-xs text-zinc-400">—</span>}
                    </td>
                    <td className="p-4">
                      {yamnet ? (
                        <div className="text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-red-500 font-mono font-bold">{(yamnet.tb_risk * 100).toFixed(0)}%</span>
                            <span className="text-zinc-400">TB</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500 font-mono font-bold">{(yamnet.asthma_risk * 100).toFixed(0)}%</span>
                            <span className="text-zinc-400">Asthma</span>
                          </div>
                          {yamnet.placeholder && <span className="text-[10px] text-amber-500 italic">placeholder</span>}
                        </div>
                      ) : <span className="text-xs text-zinc-400">—</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <FileAudio className="w-3.5 h-3.5" />
                        {record.audioDurationSec.toFixed(1)}s
                      </div>
                    </td>
                    <td className="p-4">
                      {record.synced ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-[#FAFAFA] dark:bg-zinc-900/50 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <div>Showing {filtered.length} of {records.length} entries</div>
        </div>
      </div>
    </div>
  );
}
