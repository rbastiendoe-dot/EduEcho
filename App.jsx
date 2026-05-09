import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  BookOpen, 
  Languages, 
  LogOut, 
  Send, 
  Users, 
  MessageSquare,
  Sparkles,
  AlertCircle,
  Volume2,
  History,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Download,
  ListRestart,
  ChevronDown,
  ChevronUp,
  Globe,
  Loader2,
  Play,
  ExternalLink,
  Minimize2,
  Maximize2,
  Move,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  updateDoc, 
  serverTimestamp,
  addDoc,
  getDocs
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'edu-echo-v2';
const apiKey = ""; 

// --- Helper Functions ---
const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const LANGUAGES = [
  { code: 'en', name: 'English', voice: 'Zubenelgenubi' },
  { code: 'es', name: 'Spanish', voice: 'Kore' },
  { code: 'fr', name: 'French', voice: 'Puck' },
  { code: 'zh', name: 'Mandarin', voice: 'Aoede' },
  { code: 'ar', name: 'Arabic', voice: 'Zephyr' },
  { code: 'de', name: 'German', voice: 'Charon' },
  { code: 'hi', name: 'Hindi', voice: 'Fenrir' },
  { code: 'bn', name: 'Bangla', voice: 'Leda' },
  { code: 'ht', name: 'Haitian Creole', voice: 'Callirrhoe' },
];

function pcmToWav(pcmDataB64, sampleRate = 24000) {
  const byteCharacters = atob(pcmDataB64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const buffer = byteArray.buffer;
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 32 + buffer.byteLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, buffer.byteLength, true);
  const blob = new Blob([wavHeader, buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

const SingleTalkBubbleLogo = ({ className = "h-16 w-16" }) => (
  <div className={`relative ${className}`}>
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative flex items-center justify-center w-full h-full"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full animate-pulse" />
      
      {/* Echo Waves */}
      {[1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 border-2 border-indigo-500/30 rounded-2xl"
          animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.8 }}
        />
      ))}

      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full drop-shadow-xl">
        <defs>
          <linearGradient id="bubbleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <motion.path
          d="M20 25C20 19.4772 24.4772 15 30 15H70C75.5228 15 80 19.4772 80 25V60C80 65.5228 75.5228 70 70 70H45L25 85V70H30C24.4772 70 20 65.5228 20 60V25Z"
          fill="url(#bubbleGradient)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        {/* Abstract "Echo" Lines */}
        <motion.path 
          d="M40 35H60M35 45H65M45 55H55" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.8 }}
        />
      </svg>
    </motion.div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, disabled, variant = "primary", className = "", size = "md" }) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400",
    outline: "border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
    accent: "bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-emerald-300",
    ghost: "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-6 py-3", lg: "px-8 py-4 text-lg font-bold" };
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); 
  const [currentSession, setCurrentSession] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error", err); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  const createSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const code = generateRoomCode();
      const sessionRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'sessions'));
      const sessionData = {
        id: sessionRef.id,
        room_code: code,
        is_active: true,
        teacher_id: user.uid,
        last_transcript: "",
        created_at: serverTimestamp(),
      };
      await setDoc(sessionRef, sessionData);
      setCurrentSession(sessionData);
      setView('teacher');
    } catch (err) { setError("Failed to create session."); }
    setLoading(false);
  };

  const validateRoom = async () => {
    if (!user || !roomCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const sessionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'sessions');
      const snapshot = await getDocs(sessionsRef);
      const found = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .find(data => data.is_active === true && data.room_code === roomCode.toUpperCase());
      
      if (found) {
        setCurrentSession(found);
        setView('student-lang-select');
      } else {
        setError("Room not found or inactive.");
      }
    } catch (err) { 
      setError("Connection error. Please try again."); 
      console.error(err);
    }
    setLoading(false);
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <SingleTalkBubbleLogo className="h-28 w-28" />
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">EduEcho</h1>
              <p className="text-slate-500 font-medium italic text-lg">Speak once, translate everywhere</p>
            </motion.div>
          </div>
          <div className="space-y-4">
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><Mic className="text-indigo-600" /> I'm a Teacher</h2>
              <Button onClick={createSession} disabled={loading || !user} className="w-full">Create Room</Button>
            </Card>
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><BookOpen className="text-emerald-600" /> I'm a Student</h2>
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="CODE" value={roomCode} 
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 uppercase font-mono dark:text-white outline-none"
                />
                <Button onClick={validateRoom} variant="accent" disabled={roomCode.length < 4 || loading}>Join</Button>
              </div>
            </Card>
          </div>
          {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30">{error}</div>}
        </div>
      </div>
    );
  }

  if (view === 'student-lang-select') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <Globe className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Choose Your Language</h1>
            <p className="text-slate-500">Select the language for live translation</p>
          </div>
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedLang === lang.code 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="font-bold">{lang.name}</span>
                  {selectedLang === lang.code && <Check className="h-5 w-5" />}
                </button>
              ))}
            </div>
            <div className="pt-4 space-y-2">
              <Button onClick={() => setView('student')} variant="accent" className="w-full">Enter Lesson</Button>
              <Button onClick={() => setView('landing')} variant="ghost" className="w-full text-sm">Cancel</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return view === 'teacher' ? 
    <TeacherView user={user} session={currentSession} onExit={() => setView('landing')} /> : 
    <StudentView user={user} session={currentSession} initialLang={selectedLang} onExit={() => setView('landing')} />;
}

function ClassroomChat({ user, sessionId, height = "h-[450px]", collapsible = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!user || !sessionId) return;
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'messages');
    const unsubscribe = onSnapshot(query(chatRef), (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setMessages(msgs);
      if (!isInitialLoad.current) {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        isInitialLoad.current = false;
      }
    }, (err) => console.error("Chat error:", err));
    return () => unsubscribe();
  }, [user, sessionId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'messages');
    await addDoc(chatRef, {
      text: input,
      senderId: user.uid,
      senderName: user.uid.substring(0, 5),
      timestamp: serverTimestamp()
    });
    setInput("");
  };

  return (
    <Card className={`flex flex-col transition-all duration-300 ${isMinimized ? 'h-[50px]' : height}`}>
      <div 
        onClick={() => collapsible && setIsMinimized(!isMinimized)}
        className={`p-3 border-b dark:border-slate-800 flex items-center justify-between dark:text-white bg-slate-50 dark:bg-slate-800/30 ${collapsible ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : ''}`}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-500" /> 
          <span className="text-xs font-black uppercase tracking-widest">Classroom Chat</span>
          {collapsible && (
            <div className="text-slate-400">
              {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </div>
          )}
        </div>
      </div>
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">
                <p>No messages yet.</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-slate-500 mb-1 font-mono">{m.senderName}</span>
                <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${m.senderId === user.uid ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-200 shadow-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
          <form onSubmit={sendMessage} className="p-2 border-t dark:border-slate-800 flex gap-2">
            <input 
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm dark:text-white outline-none border border-transparent focus:border-indigo-500/50"
            />
            <button type="submit" className="p-2 text-indigo-600 hover:scale-110 transition-transform"><Send className="h-5 w-5" /></button>
          </form>
        </>
      )}
    </Card>
  );
}

function TeacherView({ user, session, onExit }) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasStartedRecording, setHasStartedRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [historyItems, setHistoryItems] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isLogMinimized, setIsLogMinimized] = useState(false);
  
  const recognitionRef = useRef(null);
  const recordingStateRef = useRef(false);
  const lastBroadcastRef = useRef("");
  const broadcastTimeoutRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; 
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          setTranscript(currentText);
          
          if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
          broadcastTimeoutRef.current = setTimeout(() => {
            broadcastTranscript(currentText, finalTranscript !== "");
          }, 150); 
        }
      };

      recognition.onend = () => {
        if (recordingStateRef.current) {
          try { recognition.start(); } catch (e) { console.warn("Auto-restart failed", e); }
        }
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      recordingStateRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
      if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!session?.id) return;
    const historyRef = collection(db, 'artifacts', appId, 'public', 'data', 'sessions', session.id, 'transcripts');
    return onSnapshot(query(historyRef), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setHistoryItems(items);
    }, (err) => console.error("Log fetch error:", err));
  }, [session.id]);

  const broadcastTranscript = async (text, isFinal) => {
    if (!text.trim() || !session?.id || !user) return;
    
    const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', session.id);
    
    await updateDoc(sessionRef, { 
      last_transcript: text, 
      updated_at: serverTimestamp() 
    });
    
    if (isFinal && text !== lastBroadcastRef.current) {
      const historyRef = collection(db, 'artifacts', appId, 'public', 'data', 'sessions', session.id, 'transcripts');
      await addDoc(historyRef, { 
        text: text, 
        timestamp: serverTimestamp(),
        sender_id: user.uid
      });
      lastBroadcastRef.current = text;
      
      setTimeout(async () => {
        await updateDoc(sessionRef, { last_transcript: "" });
        setTranscript("");
      }, 2000);
    }
  };

  const toggleMic = () => {
    const newState = !isRecording;
    setIsRecording(newState);
    recordingStateRef.current = newState;
    if (recognitionRef.current) {
      if (newState) {
        setHasStartedRecording(true);
        recognitionRef.current.start();
      } else {
        recognitionRef.current.stop();
      }
    }
  };

  const copyToClipboard = () => {
    const tempInput = document.createElement("input");
    tempInput.value = session.room_code;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTranscript = () => {
    const header = `EduEcho Session Transcript\nRoom: ${session.room_code}\nDate: ${new Date().toLocaleDateString()}\n\n`;
    const body = historyItems.map(item => {
      const time = item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString() : "--";
      return `[${time}] ${item.text}`;
    }).join('\n');
    const element = document.createElement("a");
    const file = new Blob([header + body], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcript-${session.room_code}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold dark:text-white tracking-tight">Teaching Dashboard</h1>
              <div onClick={copyToClipboard} className="group flex items-center gap-2 cursor-pointer transition-all active:scale-95 mt-1">
                <p className="text-indigo-500 font-mono font-black text-lg">ROOM: {session.room_code}</p>
                <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadTranscript} disabled={historyItems.length === 0}><Download className="h-4 w-4" /> Export</Button>
              <Button variant="ghost" onClick={onExit}><LogOut className="h-4 w-4" /></Button>
            </div>
          </header>
          <Card className="p-8 text-center space-y-6 bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-900/30">
            <button onClick={toggleMic} className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90 shadow-lg ${isRecording ? 'bg-red-500 ring-8 ring-red-50' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {isRecording ? <MicOff className="text-white h-10 w-10" /> : <Mic className="text-white h-10 w-10" />}
            </button>
            <div className="space-y-1">
              <h2 className={`text-xl font-bold dark:text-white ${isRecording ? 'text-red-600' : ''}`}>{isRecording ? "Listening..." : hasStartedRecording ? "Lesson Paused - Click to Resume" : "Click to Start Recording"}</h2>
              {isRecording && <p className="text-xs text-red-400 font-bold uppercase tracking-widest animate-pulse">Live Transcription Active</p>}
            </div>
            <div className="min-h-[80px] flex items-center justify-center px-4">
              <AnimatePresence mode='wait'>
                {transcript ? (
                  <motion.p key={transcript} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-medium dark:text-slate-200 italic">"{transcript}"</motion.p>
                ) : (
                  <p className="text-slate-400 italic text-sm">Waiting for speech input...</p>
                )}
              </AnimatePresence>
            </div>
          </Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <button onClick={() => setIsLogMinimized(!isLogMinimized)} className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase text-xs tracking-widest hover:text-indigo-600 transition-colors">
                <History className="h-4 w-4 text-indigo-500" /> Lesson Transcript Log {isLogMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
              {!isLogMinimized && <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">{historyItems.length} Entries</span>}
            </div>
            {!isLogMinimized && (
              <Card className="h-[400px] flex flex-col bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all duration-300">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {historyItems.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ListRestart className="h-8 w-8 opacity-20" /><p className="text-sm italic">Log will appear here as you complete sentences.</p>
                    </div>
                  )}
                  {[...historyItems].reverse().map((item) => (
                    <div key={item.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3">
                      <span className="text-[10px] font-mono text-indigo-400 pt-1 shrink-0">{item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <ClassroomChat user={user} sessionId={session.id} height="h-[600px]" collapsible={true} />
        </div>
      </div>
    </div>
  );
}

function FloatingOverlay({ lang, original, translated, historyItems, onClose, isMini, setIsMini }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div 
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed bottom-8 right-8 z-[9999] shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-900 transition-all duration-300 ${isMini ? 'w-[320px]' : 'w-[400px] h-[500px]'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header / Drag Handle */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 flex items-center justify-between cursor-move">
        <div className="flex items-center gap-2">
          <Move className="h-3 w-3 text-slate-400" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Feedback</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMini(!isMini)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
            title={isMini ? "Show History" : "Minimize to Current"}
          >
            {isMini ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors text-slate-500"
          >
            <Maximize2 className="h-4 w-4 rotate-45" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Current Highlight View */}
        <div className={`p-4 bg-gradient-to-br from-indigo-50/30 to-white dark:from-slate-900 dark:to-slate-950 ${isMini ? '' : 'border-b dark:border-slate-800'}`}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={translated || 'empty'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className={`font-bold leading-tight dark:text-white ${isMini ? 'text-lg' : 'text-xl'}`}>
                {translated || "Awaiting audio..."}
              </p>
              {!isMini && lang !== 'en' && original && (
                <p className="text-xs text-slate-400 italic">"{original}"</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* History Log View (Visible if not minimized) */}
        {!isMini && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
            {historyItems.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <History className="h-8 w-8 mb-2" />
                <p className="text-[10px] uppercase font-bold tracking-tighter">Transcript Empty</p>
              </div>
            )}
            {[...historyItems].reverse().map((item) => (
              <div key={item.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                 <p className="text-[10px] text-slate-400 mb-1">
                   {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                 </p>
                 <p className="text-xs font-medium dark:text-slate-200 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {isHovered && (
        <div className="p-1.5 bg-indigo-600 text-[9px] text-white font-black uppercase text-center tracking-[0.2em]">
          Mode: {isMini ? 'Compact Translation' : 'Full Transcript Feed'}
        </div>
      )}
    </motion.div>
  );
}

function StudentView({ user, session, initialLang, onExit }) {
  const [original, setOriginal] = useState("");
  const [translated, setTranslated] = useState("");
  const [lang, setLang] = useState(initialLang || "es");
  const [isTranslating, setIsTranslating] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [isOverlayMini, setIsOverlayMini] = useState(false);
  const lastTranslatedTextRef = useRef("");

  useEffect(() => {
    if (original && original !== lastTranslatedTextRef.current) {
      translateLive(original, lang);
    }
    if (!original) {
      setTranslated("");
      lastTranslatedTextRef.current = "";
    }
  }, [original, lang]);

  useEffect(() => {
    if (!session?.id) return;
    const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', session.id);
    return onSnapshot(sessionRef, (snap) => {
      const data = snap.data();
      if (data && data.last_transcript !== original) {
        setOriginal(data.last_transcript || "");
      }
    });
  }, [session.id, original]);

  useEffect(() => {
    if (!session?.id) return;
    const historyRef = collection(db, 'artifacts', appId, 'public', 'data', 'sessions', session.id, 'transcripts');
    return onSnapshot(query(historyRef), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setHistoryItems(items);
    }, (err) => console.error("Student log error:", err));
  }, [session.id]);

  const translateLive = async (text, target) => {
    if (!text || target === 'en') { setTranslated(text); return; }
    lastTranslatedTextRef.current = text;
    setIsTranslating(true);
    try {
      const targetName = LANGUAGES.find(l => l.code === target)?.name || target;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Translate to ${targetName}. ONLY translation: "${text}"` }] }]
        })
      });
      const data = await res.json();
      setTranslated(data.candidates?.[0]?.content?.parts?.[0]?.text || "...");
    } catch (e) { console.error(e); }
    setIsTranslating(false);
  };

  const handleDownloadTranscript = async () => {
    if (historyItems.length === 0) return;
    const targetName = LANGUAGES.find(l => l.code === lang)?.name || lang;
    const header = `EduEcho Student Lesson Summary\nRoom: ${session.room_code}\nLanguage: ${targetName}\nDate: ${new Date().toLocaleDateString()}\n${"=".repeat(40)}\n\n`;
    let body = "";
    for (const item of historyItems) {
      const time = item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString() : "--";
      body += `[${time}] ORIGINAL (EN): ${item.text}\n`;
      if (lang !== 'en') {
        const cacheKey = `${item.id}_${lang}`;
        const cached = localStorage.getItem(cacheKey);
        body += `[${time}] TRANSLATED (${lang.toUpperCase()}): ${cached || '... (Live translation unavailable in summary)'}\n`;
      }
      body += `\n`;
    }
    const element = document.createElement("a");
    const file = new Blob([header + body], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `my-lesson-notes-${session.room_code}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col p-4 md:p-8">
      <AnimatePresence>
        {isOverlayActive && (
          <FloatingOverlay 
            lang={lang}
            original={original}
            translated={translated}
            historyItems={historyItems}
            isMini={isOverlayMini}
            setIsMini={setIsOverlayMini}
            onClose={() => setIsOverlayActive(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <header className="flex flex-wrap gap-4 justify-between items-center">
            <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" /> 
              Live Lesson
            </h1>
            <div className="flex gap-2 items-center">
              <Button 
                variant={isOverlayActive ? "primary" : "outline"} 
                size="sm" 
                onClick={() => setIsOverlayActive(!isOverlayActive)}
                className={isOverlayActive ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950' : ''}
              >
                <ExternalLink className="h-4 w-4" /> 
                {isOverlayActive ? 'Overlay Active' : 'Pop-out Overlay'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadTranscript} disabled={historyItems.length === 0}><Download className="h-4 w-4" /> Save Notes</Button>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1 shadow-sm">
                <Languages className="h-4 w-4 text-slate-400" />
                <select value={lang} onChange={e => setLang(e.target.value)} className="bg-transparent text-sm font-bold dark:text-white outline-none cursor-pointer">
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
              </div>
              <Button variant="ghost" size="sm" onClick={onExit}><LogOut className="h-4 w-4" /></Button>
            </div>
          </header>

          <Card className="p-10 min-h-[220px] flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-950 border-2 border-indigo-100/50 dark:border-indigo-900/20 shadow-xl shadow-indigo-500/5">
            <div className="flex items-center gap-2 text-indigo-500 font-black uppercase text-[10px] tracking-widest bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
              <Volume2 className={`h-4 w-4 ${isTranslating ? 'animate-pulse' : ''}`} /> Live Feed
            </div>
            <div className="space-y-4">
              <p className="text-3xl font-black dark:text-white leading-tight min-h-[1.5em]">{translated || "Waiting for teacher to speak..."}</p>
              {lang !== 'en' && original && <p className="text-slate-400 text-sm italic font-medium">"{original}"</p>}
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase text-xs tracking-widest"><History className="h-4 w-4 text-indigo-500" /> Lesson History</h3>
            <div className="hidden md:grid grid-cols-2 gap-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-400" /> Original (English)</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Translation ({LANGUAGES.find(l => l.code === lang)?.name})</div>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 pb-10">
              {historyItems.length === 0 && (
                <div className="p-10 text-center text-slate-400 italic text-sm">The lesson log will build as the teacher speaks.</div>
              )}
              {[...historyItems].reverse().map((item) => (
                <TranscriptItemSplitWithAudio key={item.id} id={item.id} text={item.text} lang={lang} timestamp={item.timestamp} />
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1"><ClassroomChat user={user} sessionId={session.id} height="h-[600px]" /></div>
      </div>
    </div>
  );
}

function TranscriptItemSplitWithAudio({ id, text, lang, timestamp }) {
  const [localTranslated, setLocalTranslated] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const translate = async () => {
      if (lang === 'en') { setLocalTranslated(text); return; }
      const cacheKey = `${id}_${lang}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setLocalTranslated(cached); return; }
      setLoading(true);
      try {
        const targetName = LANGUAGES.find(l => l.code === lang)?.name || lang;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: `Translate to ${targetName}. ONLY translation: "${text}"` }] }] })
        });
        const data = await res.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
        setLocalTranslated(result);
        localStorage.setItem(cacheKey, result);
      } catch (e) { setLocalTranslated(text); }
      setLoading(false);
    };
    translate();
  }, [text, lang, id]);

  const handleSpeak = async () => {
    if (isSpeaking || !localTranslated) return;
    setIsSpeaking(true);
    try {
      const voiceName = LANGUAGES.find(l => l.code === lang)?.voice || 'Zubenelgenubi';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: localTranslated }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
          model: "gemini-2.5-flash-preview-tts"
        })
      });
      const result = await res.json();
      const pcmData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (pcmData) {
        const audioUrl = pcmToWav(pcmData);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      } else { setIsSpeaking(false); }
    } catch (e) { setIsSpeaking(false); }
  };

  const timeString = timestamp ? new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

  return (
    <div className="group relative">
      <div className="absolute -top-2 left-4 z-10 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-mono text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-2">{timeString}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-4 pt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/30">
        <div className="space-y-1">
          <div className="md:hidden text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">English</div>
          <p className="text-sm text-slate-500 italic leading-relaxed">"{text}"</p>
        </div>
        <div className="space-y-1 md:border-l md:border-slate-50 md:dark:border-slate-800 md:pl-4 relative flex flex-col justify-between">
          <div className="">
            <div className="md:hidden text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">{LANGUAGES.find(l => l.code === lang)?.name}</div>
            <p className={`text-sm font-bold dark:text-white leading-relaxed ${loading ? 'animate-pulse text-slate-300' : ''}`}>{localTranslated || "..."}</p>
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={handleSpeak} disabled={loading || isSpeaking || !localTranslated} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isSpeaking ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-slate-300'}`}>
              {isSpeaking ? <><Loader2 className="h-3 w-3 animate-spin" />Playing...</> : <><Volume2 className="h-3 w-3" />Listen</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}