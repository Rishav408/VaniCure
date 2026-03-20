import { WifiOff, Globe, Bell, UserCircle, Sun, Moon, Settings, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export function TopBar({ isDarkMode, setIsDarkMode }: TopBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-white/5 bg-[#FAFAFA]/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-300 transition-colors">
          <WifiOff className="w-3.5 h-3.5 text-medical-500 dark:text-medical-400" />
          Offline Mode Active
        </div>
        <div className="h-4 w-px bg-zinc-200 dark:bg-white/10 transition-colors" />
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Globe className="w-3.5 h-3.5" />
          Language: <span className="text-zinc-900 dark:text-white">Hindi (HI)</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <button className="relative p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-zinc-900 transition-colors" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-white/10"
          >
            <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
              <img src="https://picsum.photos/seed/doctor/100/100" alt="Dr. Sharma" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-zinc-900 dark:text-white leading-none">Dr. Sharma</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Primary Care</p>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-zinc-100 dark:border-white/5 mb-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Dr. A. Sharma</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">ID: MED-8924</p>
              </div>
              <button className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors">
                <UserCircle className="w-4 h-4" /> My Profile
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors">
                <Settings className="w-4 h-4" /> Account Settings
              </button>
              <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />
              <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
