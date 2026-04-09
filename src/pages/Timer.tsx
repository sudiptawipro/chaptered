import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Play, Pause, RotateCcw, Save, Music, Volume2, VolumeX, CheckCircle2, Smile, Meh, Frown } from 'lucide-react';
import { playSound } from '../hooks/useSound';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';

type Mode = 'focus' | 'break';
type MusicType = 'none' | 'lofi' | 'rain' | 'cafe' | 'piano' | 'fireplace';
type PeriodType = 'week' | 'month' | '3months';

const AUDIO_MAP: Record<MusicType, string> = {
  'none': '',
  'lofi': 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
  'rain': 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8f87c78bc1.mp3',
  'cafe': 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b32b29ec.mp3',
  'piano': 'https://cdn.pixabay.com/download/audio/2024/07/31/audio_1e887da3a0.mp3',
  'fireplace': 'https://cdn.pixabay.com/download/audio/2021/09/29/audio_5c49e0a831.mp3',
};

const MUSIC_OPTIONS: { id: MusicType; label: string; emoji: string }[] = [
  { id: 'none', label: 'Off', emoji: '🔇' },
  { id: 'lofi', label: 'Lo-Fi', emoji: '🎵' },
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'piano', label: 'Piano', emoji: '🎹' },
  { id: 'fireplace', label: 'Fire', emoji: '🔥' },
];

export default function Timer() {
  const { state, dispatch } = useAppContext();

  // Read timer state from context (persists across navigation)
  const timerCtx = state.timerState;

  const [mode, setMode] = useState<Mode>(timerCtx.mode);
  const [focusLength, setFocusLength] = useState(timerCtx.focusLength);
  const [breakLength, setBreakLength] = useState(timerCtx.breakLength);
  const [sessionSubject, setSessionSubject] = useState(timerCtx.sessionSubject || state.subjects[0]?.id || '');
  const [sessionName, setSessionName] = useState(timerCtx.sessionName);
  const [music, setMusic] = useState<MusicType>('none');
  const [isMuted, setIsMuted] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [sessionSaved, setSessionSaved] = useState(false);
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);

  // Compute initial timeLeft from persisted context
  const computeTimeLeft = () => {
    if (timerCtx.running && timerCtx.endTime) {
      const remaining = Math.round((new Date(timerCtx.endTime).getTime() - Date.now()) / 1000);
      return Math.max(0, remaining);
    }
    return (timerCtx.mode === 'focus' ? timerCtx.focusLength : timerCtx.breakLength) * 60;
  };

  const [timeLeft, setTimeLeft] = useState(computeTimeLeft);
  const [isActive, setIsActive] = useState(timerCtx.running && !!timerCtx.endTime && new Date(timerCtx.endTime!).getTime() > Date.now());

  // How much time the focused session has consumed
  const focusedSeconds = useRef(0);

  // Sync timer running state to context
  const syncToContext = (running: boolean, tLeft: number, currentMode: Mode) => {
    const endTime = running ? new Date(Date.now() + tLeft * 1000).toISOString() : null;
    dispatch({
      type: 'UPDATE_TIMER_STATE',
      payload: { running, endTime, mode: currentMode, focusLength, breakLength, sessionSubject, sessionName }
    });
  };

  // Countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (mode === 'focus') focusedSeconds.current += 1;
          return t - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      syncToContext(false, 0, mode);
      const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      beep.play().catch(() => {});
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  // Audio control
  useEffect(() => {
    const audio = document.getElementById('bg-audio') as HTMLAudioElement;
    if (!audio) return;
    if (isActive && music !== 'none') {
      audio.volume = isMuted ? 0 : 0.4;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isActive, music, isMuted]);

  // Sync context when active state changes
  useEffect(() => {
    syncToContext(isActive, timeLeft, mode);
  }, [isActive]);

  const toggleTimer = () => {
    const next = !isActive;
    setIsActive(next);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setIsActive(false);
    const newTime = (newMode === 'focus' ? focusLength : breakLength) * 60;
    setTimeLeft(newTime);
    syncToContext(false, newTime, newMode);
  };

  const updateLengths = (f: number, b: number) => {
    setFocusLength(f);
    setBreakLength(b);
    if (!isActive) {
      const newTime = mode === 'focus' ? f * 60 : b * 60;
      setTimeLeft(newTime);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    const newTime = (mode === 'focus' ? focusLength : breakLength) * 60;
    setTimeLeft(newTime);
    focusedSeconds.current = 0;
    syncToContext(false, newTime, mode);
  };

  const handleLogSession = () => {
    const durationMins = Math.round(focusedSeconds.current / 60);
    if (durationMins < 1) return;

    dispatch({
      type: 'LOG_STUDY_SESSION',
      payload: {
        id: `sess-${Date.now()}`,
        date: new Date(),
        duration: durationMins,
        subjectId: sessionSubject || '',
      }
    });

    setSessionSaved(true);
    setTimeout(() => setSessionSaved(false), 3000);
    resetTimer();
    setShowMoodPrompt(true);
  };

  // Analytics: build chart data from real studySessions
  const getChartData = () => {
    const sessions = state.studySessions || [];
    const now = new Date();

    if (period === 'week') {
      const days = eachDayOfInterval({ start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
      return days.map(day => {
        const dayMins = sessions
          .filter(s => new Date(s.date).toDateString() === day.toDateString())
          .reduce((acc, s) => acc + s.duration, 0);
        return { name: format(day, 'EEE'), mins: dayMins, date: day };
      });
    } else if (period === 'month') {
      // Current month grouped by week
      const weeks = [];
      let start = startOfMonth(now);
      while (start <= endOfMonth(now)) {
        const end = new Date(Math.min(endOfWeek(start, { weekStartsOn: 1 }).getTime(), endOfMonth(now).getTime()));
        const weekMins = sessions
          .filter(s => {
            const d = new Date(s.date);
            return isWithinInterval(d, { start, end });
          })
          .reduce((acc, s) => acc + s.duration, 0);
        weeks.push({ name: `W${format(start, 'w')}`, mins: weekMins, date: start });
        start = new Date(end.getTime() + 86400000);
      }
      return weeks;
    } else {
      // Last 3 months
      return [0, 1, 2].map(i => {
        const monthDate = subMonths(now, 2 - i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);
        const monthMins = sessions
          .filter(s => {
            const d = new Date(s.date);
            return isWithinInterval(d, { start: mStart, end: mEnd });
          })
          .reduce((acc, s) => acc + s.duration, 0);
        return { name: format(monthDate, 'MMM'), mins: monthMins, date: monthDate };
      });
    }
  };

  const chartData = getChartData();
  const totalMins = (state.studySessions || []).reduce((acc, s) => acc + s.duration, 0);
  const todayMins = (state.studySessions || [])
    .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((acc, s) => acc + s.duration, 0);

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const ss = (timeLeft % 60).toString().padStart(2, '0');
  const totalTime = (mode === 'focus' ? focusLength : breakLength) * 60;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-8 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-10 pb-12 items-start">

      <audio id="bg-audio" src={music !== 'none' ? AUDIO_MAP[music] : ''} loop preload="auto" />

      {/* Timer Side */}
      <div className="bg-bg-card border border-border rounded-[2.5rem] p-10 flex flex-col items-center shadow-lg relative overflow-hidden group">
        <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ${isActive ? 'opacity-30 scale-150' : 'opacity-10 scale-100'} ${mode === 'focus' ? 'bg-accent' : 'bg-green'}`} />

        <div className="flex bg-bg rounded-xl p-1.5 mb-12 border border-border z-10 shadow-sm w-full max-w-xs">
          <button onClick={() => switchMode('focus')} className={`flex-1 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${mode === 'focus' ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-white'}`}>Focus</button>
          <button onClick={() => switchMode('break')} className={`flex-1 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${mode === 'break' ? 'bg-green text-white shadow-md' : 'text-text-muted hover:text-white'}`}>Break</button>
        </div>

        {/* Circular Timer */}
        <div className="relative w-80 h-80 flex items-center justify-center mb-12 z-10">
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle cx="160" cy="160" r="145" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-bg-raised" />
            <circle
              cx="160" cy="160" r="145" stroke="currentColor" strokeWidth="12" fill="transparent" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 145}`}
              strokeDashoffset={`${2 * Math.PI * 145 * (1 - progressPercent / 100)}`}
              className={`transition-all duration-1000 ${mode === 'focus' ? 'text-accent drop-shadow-[0_0_15px_rgba(255,107,157,0.5)]' : 'text-green drop-shadow-[0_0_15px_rgba(61,237,122,0.5)]'}`}
            />
          </svg>
          <div className="text-center font-mono flex flex-col items-center justify-center pt-4">
            <span className="text-[5.5rem] font-black leading-none text-white tracking-tighter drop-shadow-md">{mm}:{ss}</span>
            <span className="text-sm font-black uppercase tracking-widest text-text-muted mt-2">{mode} Mode</span>
            {mode === 'focus' && focusedSeconds.current > 60 && (
              <span className="text-xs font-bold text-accent mt-1">{Math.floor(focusedSeconds.current / 60)}m focused</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 z-10 mb-10 bg-bg p-3 rounded-full border border-border shadow-inner">
          <button onClick={resetTimer} className="w-14 h-14 rounded-full flex items-center justify-center bg-transparent hover:bg-bg-raised text-text-muted hover:text-white transition-all hover:rotate-180" title="Reset">
            <RotateCcw size={24} />
          </button>
          <button
            onClick={toggleTimer}
            className={`w-20 h-20 flex items-center justify-center rounded-full text-white shadow-xl transition-all hover:scale-110 active:scale-95 ${mode === 'focus' ? 'bg-accent shadow-accent/40' : 'bg-green shadow-green/40'}`}
          >
            {isActive ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={36} className="ml-2" />}
          </button>
          <button
            onClick={handleLogSession}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-transparent hover:bg-bg-raised text-text-muted hover:text-white transition-colors"
            title="Save Session"
          >
            {sessionSaved ? <CheckCircle2 size={24} className="text-green" /> : <Save size={24} />}
          </button>
        </div>

        {/* Session saved feedback */}
        {sessionSaved && (
          <div className="z-10 mb-6 flex items-center gap-2 text-green text-sm font-bold animate-pulse">
            <CheckCircle2 size={16} /> Session logged!
          </div>
        )}

        {/* Settings */}
        <div className="w-full space-y-4 pt-6 text-sm z-10 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-text-muted font-bold uppercase tracking-widest text-xs">Focus Duration</span>
            <select value={focusLength} onChange={e => updateLengths(Number(e.target.value), breakLength)} className="bg-bg border border-border text-white px-4 py-2 rounded-lg outline-none font-bold">
              {[15, 25, 30, 45, 60, 90].map(v => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted font-bold uppercase tracking-widest text-xs">Break Duration</span>
            <select value={breakLength} onChange={e => updateLengths(focusLength, Number(e.target.value))} className="bg-bg border border-border text-white px-4 py-2 rounded-lg outline-none font-bold">
              {[5, 10, 15, 20].map(v => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Info & Analytics Side */}
      <div className="space-y-6">

        {/* Session Context */}
        <div className="bg-bg-card border border-border rounded-3xl p-8 shadow-sm">
          <h3 className="text-xs font-black text-text-muted uppercase tracking-widest mb-6">Current Session</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Study Subject</label>
              <select value={sessionSubject} onChange={e => setSessionSubject(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3.5 text-white outline-none font-bold transition-colors focus:border-accent">
                <option value="">General Study</option>
                {state.subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Focus Goal</label>
              <input value={sessionName} onChange={e => setSessionName(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3.5 text-white outline-none font-bold transition-colors focus:border-accent" placeholder="What are you working on?" />
            </div>

            {/* Ambient Sounds */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5"><Music size={12} /> Ambient Sounds</label>
                {music !== 'none' && (
                  <button onClick={() => setIsMuted(!isMuted)} className="text-text-muted hover:text-white transition-colors">
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MUSIC_OPTIONS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMusic(m.id); setIsMuted(false); }}
                    className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${music === m.id ? 'bg-accent/20 border-accent text-accent shadow-sm' : 'border-border text-text-muted hover:text-white hover:border-text-muted/30'}`}
                  >
                    <span className="text-lg">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-bg-card border border-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">Study Time History</h3>
            <div className="flex bg-bg p-1 rounded-lg border border-border gap-1">
              {[
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: '3months', label: '3M' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id as PeriodType)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${period === p.id ? 'bg-accent text-white' : 'text-text-muted hover:text-white'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8A8070', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,107,157,0.05)' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #1E1E1E', borderRadius: '12px', color: 'white', fontWeight: 'bold' }}
                  formatter={(value: any) => [`${value} min`, 'Study Time']}
                />
                <Bar dataKey="mins" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={chartData[i].mins > 0 ? '#FF6B9D' : '#1E1E1E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Today</div>
              <div className="text-lg text-white font-black">{todayMins}m</div>
            </div>
            <div>
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total</div>
              <div className="text-lg text-white font-black">{Math.floor(totalMins / 60)}h {totalMins % 60}m</div>
            </div>
            <div>
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Streak</div>
              <div className="text-lg text-gold font-black">🔥 {state.streak}d</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mood prompt overlay — shown after saving a session */}
      {showMoodPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowMoodPrompt(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center"
            style={{ background: 'rgba(22,20,35,0.97)', border: '1px solid rgba(255,255,255,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-xl font-black text-white mb-1">Session logged!</h2>
            <p className="text-text-muted text-sm mb-6">How are you feeling after that session?</p>
            <div className="flex justify-center gap-6">
              {([
                { mood: 'happy'   as const, icon: <Smile  size={32} />, color: 'var(--green)', bg: 'rgba(61,237,122,0.12)',  border: 'rgba(61,237,122,0.3)',  label: 'Great!' },
                { mood: 'neutral' as const, icon: <Meh    size={32} />, color: 'var(--gold)',  bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)',  label: 'Okay'   },
                { mood: 'stressed'as const, icon: <Frown  size={32} />, color: 'var(--coral)', bg: 'rgba(255,107,107,0.12)',border: 'rgba(255,107,107,0.3)', label: 'Tired'  },
              ]).map(({ mood, icon, color, bg, border, label }) => (
                <button
                  key={mood}
                  onClick={() => {
                    dispatch({ type: 'LOG_MOOD', payload: { date: new Date(), mood } });
                    playSound('mood');
                    setShowMoodPrompt(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:scale-110"
                  style={{ color, background: bg, border: `1px solid ${border}` }}
                >
                  {icon}
                  <span className="text-xs font-black uppercase tracking-widest">{label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowMoodPrompt(false)} className="mt-4 text-xs text-text-muted hover:text-white transition-colors">Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}
