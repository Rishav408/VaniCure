import { useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
import {
  Mic, Square, Activity, Cpu, Stethoscope, FileText, CheckCircle2,
  AlertTriangle, Send, Volume2, Wifi, WifiOff, Check, User, MapPin,
  ChevronRight, Languages, Heart, Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { predictAudio, checkHealth, type PredictResponse } from "../services/api";
import { saveScreening } from "../store/screeningStore";

type Stage = "form" | "idle" | "recording" | "processing" | "triage" | "result";
type Language = "hi" | "gu" | "mr" | "en";

interface PatientForm {
  name: string;
  age: string;
  gender: "M" | "F" | "O";
  location: string;
  complaint: string;
}

interface ModelDisplayResult {
  model: string;
  tb_risk: number;
  asthma_risk: number;
  normal: number;
  placeholder?: boolean;
  available: boolean;
}

const LANG_LABELS: Record<Language, string> = { hi: "Hindi", gu: "Gujarati", mr: "Marathi", en: "English" };

const COMPLAINTS = [
  "Persistent Cough (2+ weeks)",
  "Wheezing / Whistling Sound",
  "Breathlessness / Shortness of Breath",
  "Blood in Sputum",
  "Night Sweats & Weight Loss",
  "Chest Pain while Breathing",
  "General Respiratory Illness",
];

const TRIAGE_SCRIPTS: Record<Language, { greeting: string; tbQ1: string; tbQ2: string; asthmaQ1: string; normalQ: string; closing: string }> = {
  hi: {
    greeting: "नमस्ते। मैं VaniCure हूँ। क्या आप मुझे अपनी खांसी और लक्षणों के बारे में बता सकते हैं?",
    tbQ1:     "आपको कितने दिनों या हफ्तों से खांसी है? क्या बलगम में खून आया है?",
    tbQ2:     "क्या आपको रात में पसीना आता है? क्या वजन कम हुआ है?",
    asthmaQ1: "क्या आपको सांस लेने में तकलीफ़ होती है, खासकर रात को? क्या कोई एलर्जी है?",
    normalQ:  "आपकी बेसिक जाँच हो गई है। क्या आप थकान या और कोई लक्षण महसूस करते हैं?",
    closing:  "धन्यवाद। आपके सभी उत्तर रिकॉर्ड कर लिए गए हैं। परिणाम तैयार हो रहा है।",
  },
  gu: {
    greeting: "નમસ્તે। હું VaniCure છું। શું તમે મને તમારી ઉધરસ અને લક્ષણો વિશે જણાવી શકો?",
    tbQ1:     "કેટલા સમયથી ઉધરસ છે? શું ગળફામાં લોહી આવ્યું?",
    tbQ2:     "રાત્રે પરસેવો થાય છે? વજન ઘટ્યું છે?",
    asthmaQ1: "શ્વાસ લેવામાં તકલીફ - ખાસ રાત્રે? કઈ એલર્જી?",
    normalQ:  "પ્રાથમિક ચકાસણી પૂર્ણ. અન્ય કોઈ લક્ષણ?",
    closing:  "ધન્યવાદ. બધાં ઉત્તર નોંધ્યા. પરિણામ તૈયાર...",
  },
  mr: {
    greeting: "नमस्कार। मी VaniCure आहे। आपण आपल्या खोकला आणि लक्षणांबद्दल सांगू शकता का?",
    tbQ1:     "किती दिवसांपासून खोकला आहे? थुंकीत रक्त आले का?",
    tbQ2:     "रात्री घाम येतो का? वजन कमी झाले का?",
    asthmaQ1: "श्वास घेण्यास त्रास होतो, विशेषतः रात्री? कोणती ऍलर्जी?",
    normalQ:  "मूलभूत तपासणी झाली. इतर काही लक्षणे जाणवतात का?",
    closing:  "धन्यवाद. सर्व उत्तरे नोंदवली. निकाल तयार होत आहे.",
  },
  en: {
    greeting: "Hello. I'm VaniCure. Can you describe the cough and symptoms you are experiencing?",
    tbQ1:     "How many days or weeks have you had this cough? Have you noticed blood in sputum?",
    tbQ2:     "Do you experience night sweats? Have you had unexplained weight loss?",
    asthmaQ1: "Do you experience breathlessness, especially at night? Do you have known allergies?",
    normalQ:  "Basic screening complete. Are you feeling any fatigue or other symptoms?",
    closing:  "Thank you. All responses recorded. Your result is being prepared now.",
  },
};

const NEXT_STEPS: Record<"critical" | "warning" | "safe", string[]> = {
  critical: [
    "Immediate referral to District Hospital for Sputum Smear Microscopy (CBNAAT).",
    "Isolate patient and provide N95 mask immediately.",
    "Begin contact tracing for household members.",
    "Log case in National Tuberculosis Elimination Programme (NTEP) portal.",
    "Avoid crowded public spaces until diagnosis confirmed.",
  ],
  warning: [
    "Schedule pulmonologist consultation within 48 hours.",
    "Prescribe short-acting bronchodilator (Salbutamol inhaler) if available.",
    "Spirometry test recommended at PHC or district hospital.",
    "Advise to avoid known allergens: dust, smoke, pollens.",
    "Monitor SpO2 (oxygen saturation) and recheck in 72 hours.",
  ],
  safe: [
    "No immediate respiratory concern detected.",
    "Maintain good respiratory hygiene: cover cough, ventilate rooms.",
    "Stay hydrated; steam inhalation may help if mild discomfort.",
    "Schedule routine health check in 3 months.",
  ],
};

export function DiagnosticAgent({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [stage, setStage]                 = useState<Stage>("form");
  const [lang, setLang]                   = useState<Language>("hi");
  const [patientForm, setPatientForm]     = useState<PatientForm>({ name: "", age: "", gender: "M", location: "", complaint: COMPLAINTS[0] });
  const [progress, setProgress]           = useState(0);
  const [chatInput, setChatInput]         = useState("");
  const [saved, setSaved]                 = useState(false);
  const [messages, setMessages]           = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const userMessageCountRef               = useRef(0);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [modelResults, setModelResults]   = useState<ModelDisplayResult[]>([]);
  const [errorMessage, setErrorMessage]   = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Real waveform via Web Audio API
  const waveformBarsRef = useRef<number[]>(Array(40).fill(5));
  const [waveformBars, setWaveformBars]   = useState<number[]>(Array(40).fill(5));
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const animFrameRef   = useRef<number | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef       = useRef<HTMLDivElement | null>(null);
  const fileInputRef     = useRef<HTMLInputElement>(null);

  // Check backend health on mount
  useEffect(() => {
    checkHealth().then(setBackendOnline);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Recording timer
  useEffect(() => {
    if (stage === "recording") {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  // Live waveform animation
  const startWaveformAnimation = useCallback((stream: MediaStream) => {
    const ctx    = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArr = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(dataArr);
      const bars = Array.from({ length: 40 }, (_, i) => {
        const idx = Math.floor((i / 40) * dataArr.length);
        return Math.max(4, Math.round((dataArr[idx] / 255) * 100));
      });
      setWaveformBars(bars);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopWaveformAnimation = useCallback(() => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    setWaveformBars(Array(40).fill(5));
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startWaveformAnimation(stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus" : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        stopWaveformAnimation();
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
      };
      mediaRecorder.start(250);
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
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setStage("processing");
      setProgress(0);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    let progressTimer: ReturnType<typeof setInterval> | undefined;
    let currentProgress = 0;
    try {
      progressTimer = setInterval(() => {
        currentProgress += 1;
        if (currentProgress > 85) currentProgress = 85;
        setProgress(currentProgress);
      }, 60);

      const response: PredictResponse = await predictAudio(audioBlob);
      const results: ModelDisplayResult[] = [
        {
          model: response.panns.model || "PANNs-CNN14",
          tb_risk: response.panns.tb_risk, asthma_risk: response.panns.asthma_risk,
          normal: response.panns.normal, placeholder: response.panns.placeholder, available: true,
        },
        {
          model: response.yamnet.model || "YAMNet",
          tb_risk: response.yamnet.tb_risk, asthma_risk: response.yamnet.asthma_risk,
          normal: response.yamnet.normal, placeholder: response.yamnet.placeholder, available: true,
        },
        {
          model: response.cnn_bilstm?.model || "CNN-BiLSTM",
          tb_risk: response.cnn_bilstm?.tb_risk ?? 0, asthma_risk: response.cnn_bilstm?.asthma_risk ?? 0,
          normal: response.cnn_bilstm?.normal ?? 0, placeholder: response.cnn_bilstm?.placeholder ?? true,
          available: !!response.cnn_bilstm,
        },
      ];
      
      if (progressTimer) clearInterval(progressTimer);
      for (let i = currentProgress; i <= 100; i += 2) {
        setProgress(i);
        await new Promise(r => setTimeout(r, 10));
      }
      setProgress(100);
      setModelResults(results);

      // Start triage with language-appropriate greeting
      const script = TRIAGE_SCRIPTS[lang];
      setMessages([{ role: "ai", text: script.greeting }]);
      userMessageCountRef.current = 0;
      setTimeout(() => setStage("triage"), 800);
    } catch (err: any) {
      if (progressTimer) clearInterval(progressTimer);
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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setStage("processing");
    setProgress(0);
    setRecordingDuration(0);
    try {
      await processAudio(file);
    } catch (err: any) {
      setErrorMessage(`Failed to process uploaded file: ${err.message}`);
      setStage("idle");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    userMessageCountRef.current += 1;
    const count = userMessageCountRef.current;

    const risk = getHighestRisk();
    const script = TRIAGE_SCRIPTS[lang];
    let reply = "";
    if (count === 1)      reply = risk.level === "critical" ? script.tbQ1 : risk.level === "warning" ? script.asthmaQ1 : script.normalQ;
    else if (count === 2) reply = risk.level === "critical" ? script.tbQ2 : script.closing;
    else                  reply = script.closing;

    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: reply }]);
      if (count >= 2) setTimeout(() => setStage("result"), 1200);
    }, 1000);
  };

  const getHighestRisk = (): { label: string; level: "critical" | "warning" | "safe"; color: string } => {
    if (modelResults.length === 0) return { label: "Unknown", level: "safe", color: "zinc" };
    const available = modelResults.filter(r => r.available);
    const avgTb     = available.reduce((s, r) => s + r.tb_risk, 0) / available.length;
    const avgAsthma = available.reduce((s, r) => s + r.asthma_risk, 0) / available.length;
    if (avgTb > 0.5)     return { label: "High Risk — TB", level: "critical", color: "red" };
    if (avgTb > 0.25)    return { label: "Moderate TB Risk", level: "critical", color: "red" };
    if (avgAsthma > 0.3) return { label: "Asthma / COPD Pattern", level: "warning", color: "amber" };
    return { label: "Low Risk — Normal", level: "safe", color: "medical" };
  };

  const handleSaveRecord = () => {
    if (saved) { onNavigate?.("records"); return; }
    const available = modelResults.filter(r => r.available);
    const avgTb     = available.reduce((s, r) => s + r.tb_risk, 0) / available.length;
    const avgAsthma = available.reduce((s, r) => s + r.asthma_risk, 0) / available.length;
    const avgNormal = available.reduce((s, r) => s + r.normal, 0) / available.length;
    const risk = getHighestRisk();
    let conf = avgNormal * 100;
    if (avgTb > 0.25)    conf = avgTb * 100;
    else if (avgAsthma > 0.3) conf = avgAsthma * 100;

    const now = new Date();
    saveScreening({
      patientName:    patientForm.name || `Patient-${now.getMinutes()}`,
      age:            parseInt(patientForm.age) || 0,
      gender:         patientForm.gender,
      location:       patientForm.location || "Local Device",
      complaint:      patientForm.complaint,
      date:           now.toISOString().split("T")[0],
      time:           now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      overallResult:  risk.label,
      riskLevel:      risk.level,
      confidence:     parseFloat(conf.toFixed(1)),
      models:         available.map(r => ({ model: r.model, tb_risk: r.tb_risk, asthma_risk: r.asthma_risk, normal: r.normal, placeholder: r.placeholder })),
      audioDurationSec: recordingDuration,
      synced:         false,
    });
    setSaved(true);
  };

  const resetAll = () => {
    setStage("form");
    setModelResults([]);
    setProgress(0);
    setRecordingDuration(0);
    setSaved(false);
    setChatInput("");
    setMessages([]);
    userMessageCountRef.current = 0;
    setPatientForm({ name: "", age: "", gender: "M", location: "", complaint: COMPLAINTS[0] });
  };

  const fmt  = (val: number) => `${(val * 100).toFixed(1)}%`;
  const fmtT = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const risk = getHighestRisk();

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Diagnostic Agent</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Offline Cough Analysis &amp; Multilingual Triage</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 border border-zinc-200 dark:border-white/5">
            <Languages className="w-4 h-4 text-zinc-500 ml-2" />
            {(Object.keys(LANG_LABELS) as Language[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  lang === l
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >{LANG_LABELS[l]}</button>
            ))}
          </div>
          {/* Backend status */}
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
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
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

      {/* ─── Stage: Patient Form ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {stage === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col gap-6"
          >
            <div className="glass-card p-8 border border-zinc-200 dark:border-white/5 max-w-2xl mx-auto w-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-medical-50 dark:bg-medical-500/20 border border-medical-200 dark:border-medical-500/40 flex items-center justify-center">
                  <User className="w-6 h-6 text-medical-600 dark:text-medical-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Patient Registration</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Fill in patient details before the audio screening</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Name + Age */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Patient Name *</label>
                    <input
                      type="text"
                      value={patientForm.name}
                      onChange={e => setPatientForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-medical-500/50 focus:ring-1 focus:ring-medical-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Age</label>
                    <input
                      type="number"
                      min="1" max="120"
                      value={patientForm.age}
                      onChange={e => setPatientForm(p => ({ ...p, age: e.target.value }))}
                      placeholder="45"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-medical-500/50 focus:ring-1 focus:ring-medical-500/30 transition-all"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Gender</label>
                  <div className="flex gap-3">
                    {(["M", "F", "O"] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => setPatientForm(p => ({ ...p, gender: g }))}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                          patientForm.gender === g
                            ? "bg-medical-500 border-medical-500 text-white dark:text-zinc-900 shadow-lg shadow-medical-500/20"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-medical-300"
                        }`}
                      >
                        {g === "M" ? "Male" : g === "F" ? "Female" : "Other"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                    <MapPin className="inline w-3.5 h-3.5 mr-1" />Village / PHC Location
                  </label>
                  <input
                    type="text"
                    value={patientForm.location}
                    onChange={e => setPatientForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Village A, Rajkot District"
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-medical-500/50 focus:ring-1 focus:ring-medical-500/30 transition-all"
                  />
                </div>

                {/* Chief Complaint */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                    <Heart className="inline w-3.5 h-3.5 mr-1" />Chief Complaint
                  </label>
                  <select
                    value={patientForm.complaint}
                    onChange={e => setPatientForm(p => ({ ...p, complaint: e.target.value }))}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-medical-500/50 focus:ring-1 focus:ring-medical-500/30 transition-all appearance-none"
                  >
                    {COMPLAINTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Submit */}
                <button
                  onClick={() => {
                    if (!patientForm.name.trim()) { setErrorMessage("Please enter patient name to continue."); return; }
                    setErrorMessage(null);
                    setStage("idle");
                  }}
                  className="w-full py-4 mt-2 bg-medical-500 hover:bg-medical-600 dark:hover:bg-medical-400 text-white dark:text-zinc-900 font-bold rounded-xl shadow-lg shadow-medical-500/25 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  Proceed to Audio Screening
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Stage: Idle → Recording → Processing → Triage → Result ────────── */}
        {stage !== "form" && (
          <motion.div
            key="diagnosis"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0"
          >
            {/* LEFT: Audio Capture + Pipeline */}
            <div className="flex flex-col gap-6">
              {/* Patient Info Bar */}
              <div className="glass-card px-5 py-3 border border-zinc-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-medical-50 dark:bg-medical-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-medical-600 dark:text-medical-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{patientForm.name || "Patient"}</p>
                    <p className="text-xs text-zinc-500">{patientForm.age ? `${patientForm.age}y` : "Age unknown"} • {patientForm.gender} • {patientForm.location || "Location unknown"}</p>
                  </div>
                </div>
                <button onClick={resetAll} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  ← Back
                </button>
              </div>

              {/* Audio Capture Card */}
              <div className="glass-card p-6 border border-zinc-200 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden h-56">
                <div className="absolute inset-0 bg-gradient-to-b from-medical-500/5 to-transparent pointer-events-none" />
                <AnimatePresence mode="wait">
                  {stage === "idle" && (
                    <motion.div key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center text-center w-full">
                      <div className="flex gap-8 items-center justify-center">
                        <div className="flex flex-col items-center">
                          <button
                            onClick={handleRecordToggle}
                            className="w-20 h-20 rounded-full bg-medical-50 dark:bg-medical-500/20 border border-medical-200 dark:border-medical-500/50 flex items-center justify-center text-medical-600 dark:text-medical-400 hover:bg-medical-500 hover:text-white dark:hover:text-zinc-950 transition-all shadow-[0_0_30px_rgba(20,184,166,0.1)] dark:shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_50px_rgba(20,184,166,0.4)]"
                          >
                            <Mic className="w-8 h-8" />
                          </button>
                          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-3">Record Mic</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <input 
                            type="file" 
                            accept="audio/*" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_30px_rgba(99,102,241,0.1)] dark:shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.4)]"
                          >
                            <Upload className="w-8 h-8" />
                          </button>
                          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-3">Upload Audio</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-5 max-w-xs">Record live or upload an existing .wav / .mp3 / .m4a file.</p>
                      <p className="text-xs text-medical-600 dark:text-medical-400 mt-1 font-medium">Patient: {patientForm.complaint}</p>
                    </motion.div>
                  )}
                  {stage === "recording" && (
                    <motion.div key="recording" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center w-full">
                      <div className="relative flex items-center justify-center mb-4">
                        <div className="absolute inset-0 rounded-full animate-pulse-ring" />
                        <button onClick={stopRecording} className="w-14 h-14 relative z-10 rounded-full bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                          <Square className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                      {/* REAL waveform bars from Web Audio API */}
                      <div className="flex items-end justify-center gap-0.5 h-14 w-full px-8">
                        {waveformBars.map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-medical-500 to-medical-400 dark:from-medical-400 dark:to-medical-300 rounded-t-sm transition-[height] duration-75"
                            style={{ height: `${h}%`, opacity: 0.5 + h / 200 }}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-medical-600 dark:text-medical-400 mt-3 font-mono animate-pulse">
                        ● REC {fmtT(recordingDuration)}
                      </p>
                    </motion.div>
                  )}
                  {(stage === "processing" || stage === "triage" || stage === "result") && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center w-full">
                      <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-3">
                        <Volume2 className="w-6 h-6 text-medical-600 dark:text-medical-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Audio Captured</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">Duration: {fmtT(recordingDuration)} | Format: WebM/Opus</p>
                      <div className="w-full h-10 mt-4 rounded-lg overflow-hidden flex">
                        {Array.from({ length: 50 }, (_, i) => {
                          const intensity = Math.abs(Math.sin(i * 0.4)) * 0.7 + 0.1;
                          return (
                            <div key={i} className="flex-1 flex flex-col gap-px">
                              {Array.from({ length: 6 }, (_, j) => (
                                <div key={j} className="flex-1 rounded-sm" style={{ backgroundColor: `rgba(20,184,166,${intensity * (1 - j * 0.1)})` }} />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pipeline Visualization */}
              <div className="glass-card p-6 border border-zinc-200 dark:border-white/5 flex-1 flex flex-col relative overflow-hidden">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-5 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-medical-600 dark:text-medical-400" />
                  Multi-Model Inference Pipeline
                </h3>
                <div className="flex-1 flex flex-col justify-center gap-4 relative">
                  <div className="absolute left-6 top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                  {[
                    { title: "Audio Preprocessing",    desc: "Resampling 32kHz / 16kHz / 22kHz, mono",    active: progress > 0,  done: progress > 20 },
                    { title: "PANNs CNN14 Inference",  desc: "AudioSet pretrained — 527-class tagging",   active: progress > 20, done: progress > 45 },
                    { title: "YAMNet Inference",       desc: "MobileNet audio event classification",      active: progress > 45, done: progress > 70 },
                    { title: "CNN-BiLSTM Inference",   desc: "Custom Coswara-trained respiratory model",  active: progress > 70, done: progress > 90 },
                    { title: "Risk Score Aggregation", desc: "Ensemble of 3 models → risk summary",       active: progress > 90, done: progress >= 100 },
                  ].map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-4 z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-500 ${
                        step.done
                          ? "bg-medical-50 dark:bg-medical-500/20 border border-medical-200 dark:border-medical-500/50 text-medical-600 dark:text-medical-400"
                          : step.active
                          ? "bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                          : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-400 dark:text-zinc-600"
                      }`}>
                        {step.done ? <CheckCircle2 className="w-4 h-4" /> : <Activity className={`w-4 h-4 ${step.active ? "animate-pulse" : ""}`} />}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className={`text-xs font-semibold transition-colors ${step.active || step.done ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>{step.title}</h4>
                        <p className={`text-xs mt-0.5 transition-colors ${step.active || step.done ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-600"}`}>{step.desc}</p>
                        {step.active && !step.done && (
                          <div className="h-1 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/5" />
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

            {/* RIGHT: Triage Chat + Results */}
            <div className="flex flex-col gap-6">
              {/* Triage Chat */}
              <div className={`glass-card border border-zinc-200 dark:border-white/5 flex flex-col transition-all duration-500 ${stage === "result" ? "h-52" : "flex-1"}`}>
                <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-[#FAFAFA] dark:bg-zinc-900/50 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Multilingual Triage Agent</h3>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">Powered by rule-based SLM (Local)</p>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/5">
                    {LANG_LABELS[lang]}
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                  {(stage === "idle" || stage === "recording" || stage === "processing") ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <Stethoscope className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mb-3" />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px]">Awaiting acoustic analysis before starting triage interview.</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-medical-500 text-white rounded-tr-sm"
                              : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-200 rounded-tl-sm"
                          }`}>
                            {msg.text}
                          </div>
                        </motion.div>
                      ))}
                      <div ref={chatEndRef} />
                    </AnimatePresence>
                  )}
                </div>
                <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-[#FAFAFA] dark:bg-zinc-900/30 rounded-b-2xl">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                      disabled={stage !== "triage"}
                      placeholder={stage === "triage" ? "Type patient response..." : stage === "result" ? "Triage complete. View results below." : "Waiting for acoustic analysis..."}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-medical-500/50 focus:ring-1 focus:ring-medical-500/50 disabled:opacity-50 transition-all"
                    />
                    <button onClick={handleSendMessage} disabled={stage !== "triage" || !chatInput.trim()} className="absolute right-2 p-2 text-zinc-400 hover:text-medical-600 dark:hover:text-medical-400 disabled:opacity-50 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Model Results + Risk Summary */}
              <AnimatePresence>
                {stage === "result" && (
                  <motion.div initial={{ opacity: 0, height: 0, y: 20 }} animate={{ opacity: 1, height: "auto", y: 0 }} className="flex flex-col gap-5">
                    {/* Model Comparison */}
                    <div className="glass-card p-5 border border-zinc-200 dark:border-white/5">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-medical-600 dark:text-medical-400" />Model Comparison
                      </h3>
                      <div className="space-y-3">
                        {modelResults.map((result, i) => (
                          <div key={i} className={`p-3.5 rounded-xl border ${!result.available ? "opacity-50 border-dashed border-zinc-300 dark:border-zinc-700" : "border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50"}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${!result.available ? "bg-zinc-400" : result.placeholder ? "bg-amber-500 animate-pulse" : "bg-medical-500"}`} />
                                <span className="text-xs font-semibold text-zinc-900 dark:text-white">{result.model}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${result.placeholder ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-medical-100 dark:bg-medical-500/20 text-medical-600 dark:text-medical-400"}`}>
                                {result.placeholder ? "Placeholder" : "Live"}
                              </span>
                            </div>
                            {result.available && (
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { label: "TB Risk", val: result.tb_risk, color: "bg-red-500" },
                                  { label: "Asthma", val: result.asthma_risk, color: "bg-amber-500" },
                                  { label: "Normal", val: result.normal, color: "bg-medical-500" },
                                ].map(({ label, val, color }) => (
                                  <div key={label}>
                                    <div className="flex justify-between text-[10px] mb-1">
                                      <span className="text-zinc-500">{label}</span>
                                      <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{fmt(val)}</span>
                                    </div>
                                    <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: fmt(val) }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk Summary */}
                    <div className={`glass-card p-5 border relative overflow-hidden ${
                      risk.level === "critical" ? "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5"
                      : risk.level === "warning"  ? "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5"
                      : "border-medical-200 dark:border-medical-500/30 bg-medical-50 dark:bg-medical-500/5"
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className={`w-4 h-4 ${risk.level === "critical" ? "text-red-500" : risk.level === "warning" ? "text-amber-500" : "text-medical-500"}`} />
                            Risk Assessment
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Ensemble average across {modelResults.filter(r => r.available).length} models</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          risk.level === "critical" ? "bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400"
                          : risk.level === "warning"  ? "bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                          : "bg-medical-100 dark:bg-medical-500/20 border-medical-200 dark:border-medical-500/30 text-medical-600 dark:text-medical-400"
                        }`}>
                          {risk.label}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white mb-2.5 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-medical-600 dark:text-medical-400" />
                          Actionable Next Steps
                        </h4>
                        <ul className="space-y-1.5 list-disc pl-4 marker:text-medical-500">
                          {NEXT_STEPS[risk.level].map((step, i) => (
                            <li key={i} className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{step}</li>
                          ))}
                        </ul>
                        {patientForm.complaint && (
                          <p className="text-[10px] mt-2 text-zinc-400 dark:text-zinc-500 italic">
                            Chief complaint: {patientForm.complaint}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button onClick={resetAll} className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium transition-colors border border-zinc-200 dark:border-white/5">
                          New Screening
                        </button>
                        <button
                          onClick={handleSaveRecord}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg flex items-center justify-center gap-2 ${
                            saved ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-medical-500 hover:bg-medical-600 text-white shadow-medical-500/20"
                          }`}
                        >
                          {saved ? <><Check className="w-4 h-4" /> Saved — View Records</> : "Save to Records"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
