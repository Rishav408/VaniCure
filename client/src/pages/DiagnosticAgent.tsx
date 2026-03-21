import { useState, useEffect, useRef } from "react";
import { Mic, Square, Activity, Cpu, Stethoscope, FileText, CheckCircle2, AlertTriangle, Send, Volume2, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { predictAudio, checkHealth, type PredictResponse } from "../services/api";

type Stage = "idle" | "recording" | "processing" | "triage" | "result";

interface ModelDisplayResult {
  model: string;
  tb_risk: number;
  asthma_risk: number;
  normal: number;
  placeholder?: boolean;
  available: boolean;
}

export function DiagnosticAgent() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "नमस्ते। मैं VaniCure हूँ। क्या आप मुझे अपनी खांसी और लक्षणों के बारे में बता सकते हैं? (Hello. I am VaniCure. Can you tell me about your cough and symptoms?)" }
  ]);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [modelResults, setModelResults] = useState<ModelDisplayResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check backend health on mount
  useEffect(() => {
    checkHealth().then(setBackendOnline);
  }, []);

  // Progress animation during processing
  useEffect(() => {
    if (stage === "processing") {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 1;
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(interval);
        }
      }, 80);
      return () => clearInterval(interval);
    }
  }, [stage]);

  // Recording timer
  useEffect(() => {
    if (stage === "recording") {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(250); // Collect data every 250ms
      setStage("recording");
    } catch (err: any) {
      setErrorMessage(
        err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone permission and try again."
          : `Failed to access microphone: ${err.message}`
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setStage("processing");
      setProgress(0);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const response: PredictResponse = await predictAudio(audioBlob);

      const results: ModelDisplayResult[] = [
        {
          model: response.panns.model || "PANNs-CNN14",
          tb_risk: response.panns.tb_risk,
          asthma_risk: response.panns.asthma_risk,
          normal: response.panns.normal,
          placeholder: response.panns.placeholder,
          available: true,
        },
        {
          model: response.yamnet.model || "YAMNet",
          tb_risk: response.yamnet.tb_risk,
          asthma_risk: response.yamnet.asthma_risk,
          normal: response.yamnet.normal,
          placeholder: response.yamnet.placeholder,
          available: true,
        },
        {
          model: "CNN-BiLSTM (Your Model)",
          tb_risk: 0,
          asthma_risk: 0,
          normal: 0,
          placeholder: true,
          available: false,
        },
      ];

      setModelResults(results);
      setProgress(100);
      setTimeout(() => setStage("triage"), 600);
    } catch (err: any) {
      setErrorMessage(
        err.message.includes("Failed to fetch") || err.message.includes("NetworkError")
          ? "Backend unreachable. Please start the server: cd server && uvicorn main:app --port 8000"
          : `Analysis failed: ${err.message}`
      );
      setStage("idle");
    }
  };

  const handleRecordToggle = () => {
    if (stage === "idle") startRecording();
    else if (stage === "recording") stopRecording();
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { role: "user", text: chatInput }]);
    setChatInput("");

    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: "धन्यवाद। क्या आपको रात में पसीना आता है या वजन कम हुआ है? (Thank you. Do you experience night sweats or weight loss?)" }]);

      if (messages.length > 2) {
        setTimeout(() => setStage("result"), 2000);
      }
    }, 1000);
  };

  const getHighestRisk = (): { label: string; level: string; color: string } => {
    if (modelResults.length === 0) return { label: "Unknown", level: "low", color: "zinc" };
    const available = modelResults.filter(r => r.available);
    const avgTb = available.reduce((s, r) => s + r.tb_risk, 0) / available.length;
    const avgAsthma = available.reduce((s, r) => s + r.asthma_risk, 0) / available.length;

    if (avgTb > 0.6) return { label: "High Risk", level: "critical", color: "red" };
    if (avgTb > 0.3) return { label: "Moderate Risk", level: "warning", color: "amber" };
    return { label: "Low Risk", level: "safe", color: "medical" };
  };

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;
  const formatTime = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Diagnostic Agent</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Offline Cough Analysis &amp; Multilingual Triage</p>
        </div>
        {/* Backend status indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          backendOnline === true
            ? "bg-medical-50 dark:bg-medical-500/10 text-medical-700 dark:text-medical-400 border-medical-200 dark:border-medical-500/30"
            : backendOnline === false
            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-white/10"
        }`}>
          {backendOnline === true ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {backendOnline === true ? "AI Server Online" : backendOnline === false ? "AI Server Offline" : "Checking..."}
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-700 dark:text-red-300 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="mt-1 font-mono text-xs">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-200 text-lg leading-none">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        
        {/* Left Column: Audio & DLM Pipeline */}
        <div className="flex flex-col gap-6">
          
          {/* Audio Capture Card */}
          <div className="glass-card p-6 border border-zinc-200 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden h-64">
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
                  
                  {/* Live Waveform */}
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
                  <p className="text-sm text-medical-600 dark:text-medical-400 mt-4 font-mono animate-pulse">
                    Recording... {formatTime(recordingDuration)}
                  </p>
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
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-mono">Duration: {formatTime(recordingDuration)} | Format: WebM/Opus</p>
                  
                  {/* Static Spectrogram */}
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
              Multi-Model Pipeline (PANNs + YAMNet)
            </h3>
            
            <div className="flex-1 flex flex-col justify-center gap-6 relative">
              <div className="absolute left-6 top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-800" />
              
              {[
                { id: 1, title: "Audio Preprocessing", desc: "Resampling to 32kHz/16kHz, mono conversion", active: progress > 0, done: progress > 25 },
                { id: 2, title: "PANNs CNN14 Inference", desc: "AudioSet-pretrained large-scale audio tagging", active: progress > 25, done: progress > 50 },
                { id: 3, title: "YAMNet Inference", desc: "MobileNet-based audio event classification", active: progress > 50, done: progress > 75 },
                { id: 4, title: "Risk Aggregation", desc: "Combining scores from both models", active: progress > 75, done: progress >= 100 },
              ].map((step) => (
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
                        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${(progress % 25) / 25 * 100}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {stage === "processing" && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-medical-500/5 to-transparent h-1/2 animate-scanline pointer-events-none" />
            )}
          </div>
        </div>

        {/* Right Column: SLM Triage & Results */}
        <div className="flex flex-col gap-6">
          
          {/* SLM Triage Chat */}
          <div className={`glass-card border border-zinc-200 dark:border-white/5 flex flex-col transition-all duration-500 ${stage === "result" ? "h-48" : "flex-1"}`}>
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

          {/* Model Comparison + Final Result Card */}
          <AnimatePresence>
            {stage === "result" && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: 20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                className="flex flex-col gap-6"
              >
                {/* Model Comparison Table */}
                <div className="glass-card p-6 border border-zinc-200 dark:border-white/5 relative overflow-hidden">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-medical-600 dark:text-medical-400" />
                    Model Comparison
                  </h3>
                  
                  <div className="space-y-4">
                    {modelResults.map((result, i) => (
                      <div 
                        key={i} 
                        className={`p-4 rounded-xl border transition-colors ${
                          !result.available 
                            ? "bg-zinc-50 dark:bg-zinc-900/30 border-dashed border-zinc-300 dark:border-zinc-700 opacity-50"
                            : "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              !result.available ? "bg-zinc-400" :
                              result.placeholder ? "bg-amber-500 animate-pulse" : "bg-medical-500"
                            }`} />
                            <span className="text-sm font-medium text-zinc-900 dark:text-white">{result.model}</span>
                          </div>
                          {!result.available ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 font-medium">Coming Soon</span>
                          ) : result.placeholder ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium">Placeholder</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-medical-100 dark:bg-medical-500/20 text-medical-600 dark:text-medical-400 font-medium">Live</span>
                          )}
                        </div>

                        {result.available ? (
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-500">TB Risk</span>
                                <span className="font-mono font-bold text-red-500">{formatPercent(result.tb_risk)}</span>
                              </div>
                              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-1000" style={{ width: formatPercent(result.tb_risk) }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-500">Asthma/COPD</span>
                                <span className="font-mono font-bold text-amber-500">{formatPercent(result.asthma_risk)}</span>
                              </div>
                              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: formatPercent(result.asthma_risk) }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-500">Normal</span>
                                <span className="font-mono font-bold text-medical-500">{formatPercent(result.normal)}</span>
                              </div>
                              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-medical-500 rounded-full transition-all duration-1000" style={{ width: formatPercent(result.normal) }} />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Build your own CNN-BiLSTM model and plug it in here.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aggregated Risk Summary */}
                <div className={`glass-card p-6 border relative overflow-hidden ${
                  getHighestRisk().level === "critical" 
                    ? "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5" 
                    : getHighestRisk().level === "warning"
                    ? "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5"
                    : "border-medical-200 dark:border-medical-500/30 bg-medical-50 dark:bg-medical-500/5"
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 dark:bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${
                          getHighestRisk().level === "critical" ? "text-red-600 dark:text-red-500" : 
                          getHighestRisk().level === "warning" ? "text-amber-600 dark:text-amber-500" : 
                          "text-medical-600 dark:text-medical-500"
                        }`} />
                        Aggregated Risk Summary
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Average across {modelResults.filter(r => r.available).length} active models</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
                      getHighestRisk().level === "critical"
                        ? "bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400"
                        : getHighestRisk().level === "warning"
                        ? "bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                        : "bg-medical-100 dark:bg-medical-500/20 border-medical-200 dark:border-medical-500/30 text-medical-600 dark:text-medical-400"
                    }`}>
                      {getHighestRisk().label}
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5 relative z-10">
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
                      onClick={() => { setStage("idle"); setModelResults([]); setProgress(0); setRecordingDuration(0); }}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium transition-colors border border-zinc-200 dark:border-white/5"
                    >
                      New Screening
                    </button>
                    <button className="flex-1 py-2.5 rounded-xl bg-medical-500 hover:bg-medical-600 dark:hover:bg-medical-400 text-white dark:text-zinc-950 text-sm font-semibold transition-colors shadow-lg shadow-medical-500/20">
                      Save to Records
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
