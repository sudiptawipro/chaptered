import { useAppContext } from '../context/AppContext';
import type { WeekDay } from '../context/AppContext';
import { format, differenceInDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Play, CheckCircle2, Circle, ArrowRight, Loader2, Save, Sparkles,
  BookOpen, Plus, Clock, Flame, Timer, Coffee, CalendarX2, PartyPopper,
  CheckSquare, Target, Smile, Meh, Frown, Minus,
  Hand, Sun, Moon, Star, MessageCircleQuestion, ClipboardCheck, Check, X, RefreshCw
} from 'lucide-react';
import SubjectBadge from '../components/SubjectBadge';
import ProgressBar from '../components/ProgressBar';
import CountdownChip from '../components/CountdownChip';
import SubjectIcon from '../components/SubjectIcon';
import ChapteredLogo from '../components/ChapteredLogo';
import { playSound } from '../hooks/useSound';

const BLOCK_TYPE_COLORS: Record<string, string> = {
  Study: '#FF6B9D',
  Homework: '#FBBF24',
  Revision: '#8B5CF6',
  Break: '#3DED7A',
  Exercise: '#67E8F9',
  Other: '#8A8070',
};

// Mood icon component — Lucide icons with semantic colours
function MoodIcon({ mood, size = 22 }: { mood: string | null; size?: number }) {
  if (mood === 'happy')   return <Smile   size={size} className="text-green  drop-shadow-[0_0_8px_rgba(61,237,122,0.8)]" />;
  if (mood === 'neutral') return <Meh     size={size} className="text-gold   drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />;
  if (mood === 'stressed')return <Frown   size={size} className="text-coral  drop-shadow-[0_0_8px_rgba(255,107,107,0.8)]" />;
  return <Minus size={size} className="text-text-muted opacity-30" />;
}

export default function Dashboard() {
  const { state, dispatch, isSaving, lastSaveTime, forceSave } = useAppContext();
  const navigate = useNavigate();

  const today = new Date();
  const dateStr = format(today, "EEEE, d MMMM yyyy");

  const streak = state.streak;
  const hasSubjects = (state.subjects || []).length > 0;

  // Study time
  const todayStudyMs = (state.studySessions || [])
    .filter(s => s && s.date && new Date(s.date).toDateString() === today.toDateString())
    .reduce((acc, s) => acc + s.duration, 0);
  const hours = Math.floor(todayStudyMs / 60);
  const mins = todayStudyMs % 60;
  const hasStudyTime = todayStudyMs > 0;

  // Homework
  const todayHw = (state.homework || []).filter(h => {
    if (!h.dueDate) return false;
    return new Date(h.dueDate).toDateString() === today.toDateString();
  });
  const todayHwDone = todayHw.filter(h => h.done).length;
  const progressPercent = todayHw.length > 0 ? (todayHwDone / todayHw.length) * 100 : 100;

  // Today's scheduled events
  const todaySchedule = (state.calendarEvents || [])
    .filter(e => isSameDay(new Date(e.date), today) && e.startTime)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const formatTime = (t?: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    if (!h || !m) return t;
    const num = parseInt(h, 10);
    return `${num % 12 || 12}:${m} ${num >= 12 ? 'PM' : 'AM'}`;
  };

  // Mood trends — last 7 days
  const last7DaysMoods = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dtStr = d.toISOString().split('T')[0];
    const lg = (state.moodLog || []).find(m => {
      try { return new Date(m.date).toISOString().split('T')[0] === dtStr; } catch { return false; }
    });
    return { date: format(d, 'eee'), mood: lg?.mood || null };
  });

  const handleToggleHw = (id: string, currentDone: boolean) => {
    dispatch({ type: 'TOGGLE_HOMEWORK', payload: id });
    if (!currentDone) playSound('complete');
  };

  // ── Pending attendance classes ────────────────────────────────────────
  // Generate all scheduled class dates from each online subject's start up to today,
  // then subtract ones that already have an attendance log.
  const WEEKDAY_JS: Record<WeekDay, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  const pendingClasses: { subjectId: string; subjectName: string; colour: string; date: Date }[] = [];
  const onlineSubjects = (state.subjects || []).filter(s => s.onlineClass && s.classSchedule?.days?.length);
  const todayMidnight = new Date(today); todayMidnight.setHours(0, 0, 0, 0);
  const LOOKBACK_DAYS = 60; // only look back 60 days to keep list manageable

  for (const sub of onlineSubjects) {
    const days = sub.classSchedule!.days;
    for (let i = LOOKBACK_DAYS; i >= 0; i--) {
      const d = new Date(todayMidnight);
      d.setDate(d.getDate() - i);
      const jsDay = d.getDay();
      const dayName = (Object.keys(WEEKDAY_JS) as WeekDay[]).find(k => WEEKDAY_JS[k] === jsDay);
      if (!dayName || !days.includes(dayName)) continue;
      const dStr = d.toISOString().split('T')[0];
      const alreadyLogged = (state.attendanceLogs || []).some(
        l => l.subjectId === sub.id && new Date(l.date).toISOString().split('T')[0] === dStr
      );
      if (!alreadyLogged) {
        pendingClasses.push({ subjectId: sub.id, subjectName: sub.name, colour: sub.colour, date: new Date(d) });
      }
    }
  }
  // Sort oldest first
  pendingClasses.sort((a, b) => a.date.getTime() - b.date.getTime());

  const handleAttendanceTag = (subjectId: string, date: Date, status: 'attended' | 'cancelled' | 'rescheduled') => {
    const log = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      subjectId,
      date,
      status,
      loggedAt: new Date(),
    };
    dispatch({ type: 'LOG_ATTENDANCE', payload: log });
  };

  // ── Greeting icon ─────────────────────────────────────────────────────
  const greetingIcon = () => {
    const h = today.getHours();
    if (h >= 5  && h < 12) return <Hand  size={28} className="text-gold"  />;
    if (h >= 12 && h < 17) return <Sun   size={28} className="text-gold animate-fire" />;
    if (h >= 17 && h < 21) return <Star  size={28} className="text-sky"   />;
    return <Moon size={28} className="text-purple" />;
  };
  const greetingText = () => {
    const h = today.getHours();
    const name = state.profile?.name || 'Aaryana';
    if (h >= 5  && h < 12) return `Good morning, ${name}`;
    if (h >= 12 && h < 17) return `Good afternoon, ${name}`;
    if (h >= 17 && h < 21) return `Good evening, ${name}`;
    return `Good night, ${name}`;
  };

  // ── Onboarding ────────────────────────────────────────────────────────
  if (!hasSubjects) {
    const cards = [
      {
        icon: <BookOpen size={28} />,
        color: '#FF6B9D',
        title: 'Add Subjects',
        desc: 'Create subjects with chapters and track what you\'ve covered.',
      },
      {
        icon: <Target size={28} />,
        color: '#FBBF24',
        title: 'Track Exams',
        desc: 'Add upcoming exams and see exactly how many days you have left.',
      },
      {
        icon: <CheckSquare size={28} />,
        color: '#3DED7A',
        title: 'Manage Homework',
        desc: 'Stay on top of tasks with priority labels and due dates.',
      },
    ];

    return (
      <div className="max-w-2xl mx-auto pt-12 pb-16 text-center">
        {/* Hero logo */}
        <div className="flex justify-center mb-8 animate-float drop-shadow-[0_0_24px_rgba(255,107,157,0.5)]">
          <ChapteredLogo size={88} />
        </div>

        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Welcome to <span className="gradient-text">Chaptered</span>
        </h1>
        <p className="text-text-muted text-lg mb-10 leading-relaxed">
          Your personal study planner. Start by adding your subjects so we can track your progress, exams, and homework.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
          {cards.map(card => (
            <div key={card.title} className="bg-bg-card border border-border rounded-2xl p-5 hover-lift">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${card.color}18`, color: card.color, border: `1px solid ${card.color}30` }}
              >
                {card.icon}
              </div>
              <div className="font-bold text-white mb-1">{card.title}</div>
              <div className="text-sm text-text-muted leading-relaxed">{card.desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => { playSound('pop'); navigate('/subjects'); }}
          className="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-105 flex items-center gap-3 mx-auto shadow-xl shadow-accent/30 glow-accent"
        >
          <Plus size={22} /> Add Your First Subject
        </button>
      </div>
    );
  }

  // ── Main Dashboard ────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center flex-shrink-0">
            {greetingIcon()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{greetingText()}</h1>
            <p className="text-text-muted">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isSaving ? 'text-gold animate-pulse' : 'text-green'}`}>
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {isSaving ? 'Syncing...' : 'Synced'}
          </div>
          {lastSaveTime && !isSaving && (
            <div className="text-[10px] text-text-muted">{format(lastSaveTime, 'HH:mm:ss')}</div>
          )}
          <button
            onClick={() => forceSave()}
            className="p-2.5 bg-bg-card border border-border rounded-xl text-text-muted hover:text-white hover:border-text-muted transition-all active:scale-95"
            title="Force Save"
          >
            <Save size={18} />
          </button>
          <button
            onClick={() => { playSound('pop'); navigate('/timer'); }}
            className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-accent/20"
          >
            <Play fill="currentColor" size={16} />
            Start Focus
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Streak */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col justify-center items-center gap-2 shadow-sm hover-lift">
          <div className="text-text-muted text-xs font-black uppercase tracking-widest">Current Streak</div>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <Flame size={24} className="text-gold animate-fire" fill="currentColor" />
            </div>
            <div>
              <div className="text-3xl font-black text-gold leading-none">{streak}</div>
              <div className="text-xs text-text-muted font-bold">{streak === 1 ? 'day' : 'days'}</div>
            </div>
          </div>
          {streak >= 3 && <div className="text-[10px] font-black text-gold/60 uppercase tracking-widest">Keep it going!</div>}
        </div>

        {/* Study Time */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col justify-center items-center gap-2 shadow-sm hover-lift">
          <div className="text-text-muted text-xs font-black uppercase tracking-widest">Study Time Today</div>
          {hasStudyTime ? (
            <div className="flex items-center gap-3 mt-1">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(103,232,249,0.12)', border: '1px solid rgba(103,232,249,0.2)' }}>
                <Timer size={24} className="text-sky" />
              </div>
              <div className="text-3xl font-black text-white leading-none">
                {hours}<span className="text-lg text-text-muted font-medium">h </span>
                {mins}<span className="text-lg text-text-muted font-medium">m</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 mt-1">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Coffee size={24} className="text-purple" />
              </div>
              <p className="text-text-muted text-sm font-medium">No sessions yet</p>
              <button
                onClick={() => { playSound('pop'); navigate('/timer'); }}
                className="text-accent text-xs font-bold hover:underline"
              >
                Start a session →
              </button>
            </div>
          )}
        </div>

        {/* Daily Progress */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col justify-center items-center gap-3 shadow-sm hover-lift">
          <div className="text-text-muted text-xs font-black uppercase tracking-widest">Daily Progress</div>
          <div className="flex items-center gap-4 w-full px-2">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-border" />
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="6" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - progressPercent / 100)}`}
                  className="text-green transition-all duration-1000"
                />
              </svg>
              {progressPercent >= 100 && todayHw.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-green" />
                </div>
              )}
            </div>
            <div>
              {todayHw.length === 0 ? (
                <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
                  <PartyPopper size={16} className="text-gold" />
                  No tasks due today
                </div>
              ) : (
                <>
                  <div className="text-2xl font-black text-white leading-none">
                    <span className="text-green">{todayHwDone}</span>
                    <span className="text-text-muted text-lg font-medium"> / {todayHw.length}</span>
                  </div>
                  <div className="text-xs text-text-muted font-medium mt-0.5">tasks complete</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left col */}
        <div className="lg:col-span-2 space-y-6">

          {/* Today's Schedule */}
          <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(103,232,249,0.15)' }}>
                  <Clock size={15} className="text-sky" />
                </div>
                Today's Schedule
              </h2>
              <button onClick={() => navigate('/calendar')} className="text-xs font-medium text-accent hover:text-white transition-colors flex items-center gap-1">
                Calendar <ArrowRight size={13} />
              </button>
            </div>

            {todaySchedule.length === 0 ? (
              <div className="py-8 border border-dashed border-border rounded-xl flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <CalendarX2 size={22} className="text-text-muted animate-float" />
                </div>
                <p className="text-text-muted text-sm font-medium">Nothing scheduled yet</p>
                <button onClick={() => navigate('/calendar')} className="text-accent text-xs font-bold hover:underline">
                  + Add to calendar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySchedule.map(ev => {
                  const sub = state.subjects.find(s => s.id === ev.subjectId);
                  const col = ev.color || sub?.colour || BLOCK_TYPE_COLORS[ev.type] || '#8A8070';
                  return (
                    <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]"
                      style={{ background: `${col}08`, borderColor: `${col}25`, borderLeftWidth: '3px', borderLeftColor: col }}>
                      <div className="text-[10px] font-black uppercase tracking-widest w-20 flex-shrink-0 text-right font-mono" style={{ color: col }}>
                        {formatTime(ev.startTime)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-sm truncate">{ev.title}</div>
                        {sub && <div className="text-[10px] text-text-muted font-medium mt-0.5">{sub.name}</div>}
                      </div>
                      {ev.endTime && (
                        <div className="text-[10px] font-bold text-text-muted flex-shrink-0">{formatTime(ev.endTime)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subject Cards */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-accent" /> Subjects
            </h2>
            <button onClick={() => navigate('/subjects')} className="text-sm font-medium text-accent hover:text-white transition-colors flex items-center gap-1">
              View all <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(state.subjects || []).slice(0, 6).map(sub => {
              const doneChaps = (sub.chapters || []).filter(c => c.status === 'done').length;
              const subProgress = sub.chapters.length > 0 ? (doneChaps / sub.chapters.length) * 100 : 0;
              const examsForSub = (state.exams || []).filter(e => e.subjectId === sub.id && new Date(e.date) >= today);
              const nextExam = examsForSub.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

              return (
                <div
                  key={sub.id}
                  onClick={() => { playSound('whoosh'); navigate('/subjects'); }}
                  className="bg-bg-card border border-border rounded-xl p-5 cursor-pointer transition-all border-l-4 hover-lift"
                  style={{ borderLeftColor: sub.colour }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${sub.colour}20`, color: sub.colour }}>
                      <SubjectIcon name={sub.icon} size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-white">{sub.name}</div>
                      <div className="text-xs text-text-muted mt-0.5">{doneChaps} of {sub.chapters.length} chapters done</div>
                    </div>
                  </div>

                  <ProgressBar progress={subProgress} color={sub.colour} />

                  {nextExam && (
                    <div className="mt-4 flex items-center gap-2">
                      <CountdownChip days={Math.ceil(differenceInDays(new Date(nextExam.date), today))} />
                      <span className="text-xs text-text-muted truncate">Next: {nextExam.name}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">

          {/* At a glance */}
          <div className="bg-bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <Sparkles size={18} className="text-gold" />
            </div>
            <div>
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Today at a glance</div>
              <div className="text-sm font-bold text-white">
                {todayHw.length > 0
                  ? `${todayHw.length - todayHwDone} task${(todayHw.length - todayHwDone) !== 1 ? 's' : ''} left · ${todaySchedule.length} event${todaySchedule.length !== 1 ? 's' : ''}`
                  : `${todaySchedule.length} event${todaySchedule.length !== 1 ? 's' : ''} scheduled`}
              </div>
            </div>
          </div>

          {/* Mood This Week */}
          <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4">Mood This Week</h2>
            <div className="flex justify-between items-center px-1">
              {last7DaysMoods.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 group">
                  <div className="group-hover:scale-125 transition-all">
                    <MoodIcon mood={m.mood} size={20} />
                  </div>
                  <div className="text-[9px] text-text-muted font-black tracking-widest">{m.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Homework */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare size={16} className="text-accent" />
                Homework
                {todayHw.length > 0 && (
                  <span className="bg-accent text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{todayHw.length} DUE</span>
                )}
              </h2>
              <button onClick={() => navigate('/homework')} className="text-xs font-medium text-accent hover:text-white transition-colors">
                View all →
              </button>
            </div>

            <div className="space-y-3">
              {todayHw.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-text-muted py-2">
                  <PartyPopper size={16} className="text-gold flex-shrink-0" />
                  No homework due today!
                </div>
              )}
              {todayHw.map(hw => {
                const sub = state.subjects.find(s => s.id === hw.subjectId);
                return (
                  <div key={hw.id} className={`flex items-start gap-3 p-3 rounded-lg border ${hw.done ? 'bg-bg-raised/50 border-border/50 opacity-60' : 'bg-bg-raised border-border'}`}>
                    <button
                      onClick={() => handleToggleHw(hw.id, hw.done)}
                      className={`mt-0.5 transition-transform hover:scale-110 ${hw.done ? 'text-green' : 'text-text-muted hover:text-accent'}`}
                    >
                      {hw.done ? <CheckCircle2 size={18} className="animate-bounce-in" /> : <Circle size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${hw.done ? 'line-through text-text-muted' : 'text-white'}`}>{hw.title}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <SubjectBadge color={sub?.colour || '#8A8070'} name={sub?.name} className="text-[10px] py-0.5 px-2" />
                        {hw.priority && !hw.done && (
                          <span className={`text-[10px] font-black uppercase px-1.5 rounded ${
                            hw.priority === 'High' ? 'bg-coral/10 text-coral'
                            : hw.priority === 'Medium' ? 'bg-gold/10 text-gold'
                            : 'bg-blue-400/10 text-blue-400'
                          }`}>{hw.priority}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Attendance */}
          {pendingClasses.length > 0 && (
            <div className="bg-bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ClipboardCheck size={16} className="text-yellow-400" />
                  Pending Attendance
                  <span className="bg-yellow-400/15 text-yellow-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingClasses.length}</span>
                </h2>
                <button onClick={() => navigate('/attendance')} className="text-xs font-medium text-text-muted hover:text-white transition-colors">
                  View all →
                </button>
              </div>
              <div className="space-y-2">
                {pendingClasses.slice(0, 5).map((cls, idx) => (
                  <div key={`${cls.subjectId}-${cls.date.toISOString()}-${idx}`} className="flex items-center gap-3 p-3 bg-bg-raised rounded-xl border border-border">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cls.colour}20` }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cls.colour }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{cls.subjectName}</div>
                      <div className="text-[11px] text-text-muted">{format(cls.date, 'd MMM yyyy')}</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAttendanceTag(cls.subjectId, cls.date, 'attended')}
                        title="Attended"
                        className="p-1.5 rounded-lg bg-green/10 border border-green/20 text-green hover:bg-green/20 transition-colors"
                      ><Check size={12} /></button>
                      <button
                        onClick={() => handleAttendanceTag(cls.subjectId, cls.date, 'cancelled')}
                        title="Cancelled"
                        className="p-1.5 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 hover:bg-red-400/20 transition-colors"
                      ><X size={12} /></button>
                      <button
                        onClick={() => handleAttendanceTag(cls.subjectId, cls.date, 'rescheduled')}
                        title="Rescheduled"
                        className="p-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/20 transition-colors"
                      ><RefreshCw size={12} /></button>
                    </div>
                  </div>
                ))}
                {pendingClasses.length > 5 && (
                  <button onClick={() => navigate('/attendance')} className="w-full text-xs text-text-muted hover:text-white py-2 transition-colors">
                    +{pendingClasses.length - 5} more — view all →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent Doubts */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageCircleQuestion size={16} className="text-sky" />
                Recent Doubts
              </h2>
              <button onClick={() => navigate('/doubts')} className="text-xs font-medium text-text-muted hover:text-white transition-colors">
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {state.doubts.filter(d => !d.resolved).slice(0, 3).length === 0 && (
                <div className="flex items-center gap-2 text-sm text-text-muted py-2">
                  <PartyPopper size={16} className="text-gold flex-shrink-0" />
                  No open doubts!
                </div>
              )}
              {state.doubts.filter(d => !d.resolved).slice(0, 3).map(doubt => {
                const sub = state.subjects.find(s => s.id === doubt.subjectId);
                return (
                  <div key={doubt.id} className="p-3 bg-bg-raised rounded-lg border border-border hover-lift">
                    <SubjectBadge color={sub?.colour || '#8A8070'} name={sub?.name} className="text-[10px] py-0.5 px-2 mb-2" />
                    <p className="text-sm text-text line-clamp-2">{doubt.question}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
