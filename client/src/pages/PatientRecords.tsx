import { useState, useEffect, useMemo } from "react";
import { Search, Download, FileAudio, CheckCircle2, AlertTriangle, Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getScreenings, getStats, exportCSV, deleteScreening, type ScreeningRecord } from "../store/screeningStore";

type RiskFilter = "all" | "critical" | "warning" | "safe";

export function PatientRecords() {
  const [records,     setRecords]     = useState<ScreeningRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter,  setRiskFilter]  = useState<RiskFilter>("all");
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [stats,       setStats]       = useState(getStats());

  const refresh = () => { setRecords(getScreenings()); setStats(getStats()); };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    let r = records;
    if (riskFilter !== "all") r = r.filter(rec => rec.riskLevel === riskFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(rec =>
        rec.id.toLowerCase().includes(q) || rec.patientName.toLowerCase().includes(q) ||
        rec.location.toLowerCase().includes(q) || (rec.complaint || "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [records, searchQuery, riskFilter]);

  const handleDelete = (id: string) => {
    if (!confirm(`Delete record ${id}? This cannot be undone.`)) return;
    deleteScreening(id);
    refresh();
    if (expandedId === id) setExpandedId(null);
  };

  const FILTERS: { key: RiskFilter; label: string; count: number }[] = [
    { key: "all",      label: "All",      count: stats.total },
    { key: "critical", label: "Critical", count: stats.tbHighRisk },
    { key: "warning",  label: "Warning",  count: stats.asthmaDetected },
    { key: "safe",     label: "Normal",   count: stats.normal },
  ];

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
            <Download className="w-4 h-4" />Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 flex items-center justify-between">
          <div><p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Records</p><h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.total}</h3></div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-blue-500" /></div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <div><p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pending Sync</p><h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.pendingSync}</h3></div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-500" /></div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <div><p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Critical Cases</p><h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.tbHighRisk}</h3></div>
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
        </div>
      </div>

      <div className="glass-card border border-zinc-200 dark:border-white/5 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 bg-white/50 dark:bg-zinc-900/50">
          {/* Search */}
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, location, complaint..."
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-medical-500/50 transition-colors"
            />
          </div>
          {/* Risk filter pills */}
          <div className="flex items-center gap-2">
            {FILTERS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setRiskFilter(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  riskFilter === key
                    ? key === "all"      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent"
                    : key === "critical" ? "bg-red-500 text-white border-transparent"
                    : key === "warning"  ? "bg-amber-500 text-white border-transparent"
                    : "bg-medical-500 text-white border-transparent"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                }`}
              >
                {label} <span className="opacity-70">({count})</span>
              </button>
            ))}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{filtered.length} of {records.length}</div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-100/50 dark:bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold sticky top-0 z-10 backdrop-blur-md">
                <th className="p-4 font-mono">Scan ID</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Date &amp; Time</th>
                <th className="p-4">Location</th>
                <th className="p-4">Result</th>
                <th className="p-4">Audio</th>
                <th className="p-4">Sync</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {filtered.map((record) => (
                <>
                  <tr
                    key={record.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  >
                    <td className="p-4 text-sm font-mono text-medical-600 dark:text-medical-400">{record.id}</td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">{record.patientName}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{record.age}y • {record.gender}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-zinc-700 dark:text-zinc-300">{record.date}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{record.time}</div>
                    </td>
                    <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400 max-w-[140px] truncate">{record.location}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                          record.riskLevel === "critical" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"
                          : record.riskLevel === "warning"  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                          : "bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 border-medical-200 dark:border-medical-500/20"
                        }`}>
                          {record.overallResult}
                        </div>
                        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{record.confidence.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <FileAudio className="w-3.5 h-3.5" />{record.audioDurationSec.toFixed(1)}s
                      </div>
                    </td>
                    <td className="p-4">
                      {record.synced
                        ? <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />Synced</div>
                        : <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400"><Clock className="w-3.5 h-3.5" />Pending</div>
                      }
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {expandedId === record.id ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded detail row */}
                  <AnimatePresence>
                    {expandedId === record.id && (
                      <motion.tr
                        key={`${record.id}-detail`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={8} className="px-6 pb-4 bg-zinc-50 dark:bg-zinc-900/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* Complaint */}
                            {record.complaint && (
                              <div>
                                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Chief Complaint</p>
                                <p className="text-sm text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-200 dark:border-white/5">{record.complaint}</p>
                              </div>
                            )}
                            {/* Model Scores */}
                            <div>
                              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Model Scores</p>
                              <div className="space-y-2">
                                {record.models.map(m => (
                                  <div key={m.model} className="bg-white dark:bg-zinc-900 rounded-xl px-4 py-2.5 border border-zinc-200 dark:border-white/5 flex items-center justify-between text-xs">
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{m.model}</span>
                                    <div className="flex gap-4 font-mono">
                                      <span className="text-red-500">TB: {(m.tb_risk * 100).toFixed(0)}%</span>
                                      <span className="text-amber-500">Asthma: {(m.asthma_risk * 100).toFixed(0)}%</span>
                                      <span className="text-medical-500">Normal: {(m.normal * 100).toFixed(0)}%</span>
                                      {m.placeholder && <span className="text-zinc-400 italic">placeholder</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
              <Search className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No records match your filters.</p>
              <button onClick={() => { setSearchQuery(""); setRiskFilter("all"); }} className="mt-3 text-xs text-medical-600 dark:text-medical-400 underline">Clear filters</button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-[#FAFAFA] dark:bg-zinc-900/50 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <div>Showing {filtered.length} of {records.length} entries</div>
          {stats.pendingSync > 0 && (
            <div className="text-xs text-amber-600 dark:text-amber-400">{stats.pendingSync} record{stats.pendingSync > 1 ? "s" : ""} pending sync</div>
          )}
        </div>
      </div>
    </div>
  );
}
