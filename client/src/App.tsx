import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./pages/Dashboard";
import { DiagnosticAgent } from "./pages/DiagnosticAgent";
import { PatientRecords } from "./pages/PatientRecords";
import { OutbreakAlerts } from "./pages/OutbreakAlerts";
import { EdgeSettings } from "./pages/EdgeSettings";

export default function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentView} />;
      case "diagnostic":
        return <DiagnosticAgent onNavigate={setCurrentView} />;
      case "records":
        return <PatientRecords />;
      case "alerts":
        return <OutbreakAlerts onNavigate={setCurrentView} />;
      case "settings":
        return <EdgeSettings />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 opacity-50">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Module Not Found</h2>
            <p className="text-zinc-500 dark:text-zinc-400">This module is currently offline or under construction.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 overflow-hidden font-sans transition-colors duration-300">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-medical-500/5 dark:bg-medical-500/10 rounded-full blur-[120px] pointer-events-none opacity-50 transition-colors duration-300" />
        
        <TopBar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
