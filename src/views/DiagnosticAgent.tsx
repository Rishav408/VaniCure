import { useState, useEffect } from "react";
import { Mic, Square, Activity, Cpu, Stethoscope, FileText, CheckCircle2, AlertTriangle, Send, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Stage = "idle" | "recording" | "processing" | "triage" | "result";

export function DiagnosticAgent() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "नमस्ते। मैं VaniCure हूँ। क्या आप मुझे अपनी खांसी और लक्षणों के बारे में बता सकते हैं? (Hello. I am VaniCure. Can you tell me about your cough and symptoms?)" }
  ]);

  // Simulated processing pipeline
  useEffect(() => {
    if (stage === "processing") {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 2;
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => setStage("triage"), 500);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [stage]);

  const handleRecordToggle = () => {
    if (stage === "idle") setStage("recording");
    else if (stage === "recording") setStage("processing");
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { role: "user", text: chatInput }]);
    setChatInput("");
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: "धन्यवाद। क्या आपको रात में पसीना आता है या वजन कम हुआ है? (Thank you. Do you experience night sweats or weight loss?)" }]);
      
      // After second message, move to results
      if (messages.length > 2) {
        setTimeout(() => setStage("result"), 2000);
      }
    }, 1000);
  };

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Diagnostic Agent</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Offline Cough Analysis & Multilingual Triage</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        
        {/* Left Column: Audio & DLM Pipeline */}
        <div className="flex flex-col gap-6">
          
          {/* Audio Capture Card */}
          <div className="glass-card p-6 border border-zinc-200 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden h-64">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-medical-500/5 to-transparent pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {stage === "idle" && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center text-center"
                >
                  <button 
                    onClick={handleRecordToggle}
                    className="w-20 h-20 rounded-full bg-medical-50 dark:bg-medical-500/20 border border-medical-200 dark:border-medical-500/50 flex items-center justify-center text-medical-600 dark:text-medical-400 hover:bg-medical-500 hover:text-white dark:hover:text-zinc-950 transition-all shadow-[0_0_30px_rgba(20,184,166,0.1)] dark:shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_50px_rgba(20,184,166,0.3)] dark:hover:shadow-[0_0_50px_rgba(20,184,166,0.6)]"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                  <h3 className="mt-6 text-lg font-medium text-zinc-900 dark:text-white">Capture Cough Audio</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs">Hold device 15cm from patient. Ask them to cough 3-4 times deeply.</p>
                </motion.div>
              )}

              {stage === "recording" && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="relative flex items-center justify-center mb-8">
                    <div className="absolute inset-0 rounded-full animate-pulse-ring" />
                    <button 
                      onClick={handleRecordToggle}
                      className="w-16 h-16 relative z-10 rounded-full bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_30px_rgba(239,68,68,0.1)] dark:shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                    >
                      <Square className="w-6 h-6 fill-current" />
                    </button>
                  </div>
                  
                  {/* Simulated Waveform */}
                  <div className="flex items-end justify-center gap-1 h-16 w-full px-12">
                    {[...Array(40)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-medical-500 dark:bg-medical-400 rounded-t-sm animate-wave"
                        style={{ 
                          height: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 0.5}s`,
                          opacity: 0.5 + Math.random() * 0.5
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-medical-600 dark:text-medical-400 mt-4 font-mono animate-pulse">Recording... 00:04</p>
                </motion.div>
              )}

              {(stage === "processing" || stage === "triage" || stage === "result") && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-4">
                    <Volume2 className="w-6 h-6 text-medical-600 dark:text-medical-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Audio Captured</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-mono">Duration: 4.2s | Format: WAV 16kHz</p>
                  
                  {/* Static Spectrogram representation */}
                  <div className="w-full h-12 mt-6 rounded-lg overflow-hidden flex">
                    {[...Array(50)].map((_, i) => (
                      <div key={i} className="flex-1 flex flex-col gap-px">
                        {[...Array(8)].map((_, j) => {
                          const intensity = Math.random();
                          return (
                            <div 
                              key={j} 
                              className="flex-1" 
                              style={{ 
                                backgroundColor: `rgba(20, 184, 166, ${intensity * 0.8})`,
                                opacity: intensity > 0.5 ? 1 : 0.3
                              }} 
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DLM Pipeline Visualization */}
          <div className="glass-card p-6 border border-zinc-200 dark:border-white/5 flex-1 flex flex-col relative overflow-hidden">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-medical-600 dark:text-medical-400" />
              CNN-BiLSTM Pipeline (Offline)
            </h3>
            
            <div className="flex-1 flex flex-col justify-center gap-6 relative">
              {/* Connecting Line */}
              <div className="absolute left-6 top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-800" />
              
              {[
                { id: 1, title: "Spectro-Temporal Analysis", desc: "Mel-Spectrogram generation (500ms segments)", active: progress > 0, done: progress > 30 },
                { id: 2, title: "Spatial Feature Extraction", desc: "CNN identifying wheezes/crackles", active: progress > 30, done: progress > 60 },
                { id: 3, title: "Temporal Modeling", desc: "BiLSTM capturing respiratory cycles", active: progress > 60, done: progress > 90 },
                { id: 4, title: "INT8 Edge Inference", desc: "TFLite sub-millisecond classification", active: progress > 90, done: progress >= 100 },
              ].map((step, i) => (
                <div key={step.id} className="relative flex items-start gap-4 z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-500 ${
                    step.done ? "bg-medical-50 dark:bg-medical-500/20 border border-medical-200 dark:border-medical-500/50 text-medical-600 dark:text-medical-400" :
                    step.active ? "bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)] dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]" :
                    "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-400 dark:text-zinc-600"
                  }`}>
                    {step.done ? <CheckCircle2 className="w-5 h-5" /> : <Activity className={`w-5 h-5 ${step.active ? "animate-pulse" : ""}`} />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium transition-colors ${step.active || step.done ? "text-zinc-900 dark:text-white" : "text-zinc-500"}`}>{step.title}</h4>
                    <p className={`text-xs mt-1 transition-colors ${step.active || step.done ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-600"}`}>{step.desc}</p>
                    
                    {step.active && !step.done && (
                      <div className="h-1 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${(progress % 30) / 30 * 100}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Scanline effect when processing */}
            {stage === "processing" && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-medical-500/5 to-transparent h-1/2 animate-scanline pointer-events-none" />
            )}
          </div>
        </div>

        {/* Right Column: SLM Triage & Results */}
        <div className="flex flex-col gap-6">
          
          {/* SLM Triage Chat */}
          <div className={`glass-card border border-zinc-200 dark:border-white/5 flex flex-col transition-all duration-500 ${stage === "result" ? "h-64" : "flex-1"}`}>
            <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-[#FAFAFA] dark:bg-zinc-900/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Multilingual Triage Agent</h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">Powered by Gemma-2B (Local)</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/5">
                Hindi (HI)
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
              {stage === "idle" || stage === "recording" || stage === "processing" ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <Stethoscope className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[200px]">Awaiting acoustic analysis completion before initiating triage interview.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === "user" 
                          ? "bg-medical-500 text-white rounded-tr-sm" 
                          : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-200 rounded-tl-sm"
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-[#FAFAFA] dark:bg-zinc-900/30 rounded-b-2xl">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={stage !== "triage"}
                  placeholder={stage === "triage" ? "Type patient response..." : "Waiting for acoustic analysis..."}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-medical-500/50 focus:ring-1 focus:ring-medical-500/50 disabled:opacity-50 transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={stage !== "triage" || !chatInput.trim()}
                  className="absolute right-2 p-2 text-zinc-400 hover:text-medical-600 dark:hover:text-medical-400 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Final Result Card */}
          <AnimatePresence>
            {stage === "result" && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: 20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                className="glass-card p-6 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 dark:bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
                      Diagnostic Risk Summary
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Synthesized from acoustic & verbal data</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold tracking-wide uppercase">
                    High Risk
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-700 dark:text-zinc-300">Tuberculosis (TB) Probability</span>
                      <span className="text-red-600 dark:text-red-400 font-mono font-bold">87.4%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-red-400 w-[87.4%]" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-700 dark:text-zinc-300">Asthma / COPD Probability</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">12.1%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[12.1%]" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5 relative z-10">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-medical-600 dark:text-medical-400" />
                    Actionable Next Steps
                  </h4>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-300 space-y-2 list-disc pl-4 marker:text-medical-500">
                    <li>Immediate referral to District Hospital for Sputum Smear Microscopy.</li>
                    <li>Isolate patient and provide N95 mask.</li>
                    <li>Log case in National Health Mission portal (Auto-sync pending connection).</li>
                  </ul>
                </div>

                <div className="mt-6 flex gap-3 relative z-10">
                  <button 
                    onClick={() => setStage("idle")}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium transition-colors border border-zinc-200 dark:border-white/5"
                  >
                    New Screening
                  </button>
                  <button className="flex-1 py-2.5 rounded-xl bg-medical-500 hover:bg-medical-600 dark:hover:bg-medical-400 text-white dark:text-zinc-950 text-sm font-semibold transition-colors shadow-lg shadow-medical-500/20">
                    Save to Records
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
