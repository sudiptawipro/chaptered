import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { WeekDay } from '../context/AppContext';
import { format, differenceInDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Play, CheckCircle2, Circle, ArrowRight, Loader2, Save,
  Plus, Clock, Flame, Timer, Coffee, CalendarX2, PartyPopper,
  CheckSquare, Smile, Meh, Frown, Minus,
  ClipboardCheck, Check, X, RefreshCw, AlertTriangle
} from 'lucide-react';
import CountdownChip from '../components/CountdownChip';
import ChapteredLogo from '../components/ChapteredLogo';
import SubjectIcon from '../components/SubjectIcon';
import { BookOpen as BookOpenIcon } from 'lucide-react';
import { playSound } from '../hooks/useSound';

const BLOCK_TYPE_COLORS: Record<string, string> = {
  Study: '#FF6B9D', Homework: '#FBBF24', Revision: '#8B5CF6',
  Break: '#3DED7A', Exercise: '#67E8F9', Other: '#8A8070',
};

function MoodIcon({ mood, size = 22 }: { mood: string | null; size?: number }) {
  if (mood === 'happy')    return <Smile  size={size} className="text-green  drop-shadow-[0_0_8px_rgba(61,237,122,0.8)]" />;
  if (mood === 'neutral')  return <Meh    size={size} className="text-gold   drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />;
  if (mood === 'stressed') return <Frown  size={size} className="text-coral  drop-shadow-[0_0_8px_rgba(255,107,107,0.8)]" />;
  return <Minus size={size} className="text-text-muted opacity-30" />;
}

export default function Dashboard() {
  const { state, dispatch, isSaving, lastSaveTime, forceSave } = useAppContext();
  const navigate = useNavigate();
  const [attendanceConfirm, setAttendanceConfirm] = useState<{
    subjectId: string; subjectName: string; date: Date;
  } | null>(null);

  const today = new Date();
  const hasSubjects = (state.subjects || []).length > 0;

  // Study time today
  const todayStudyMs = (state.studySessions || [])
    .filter(s => s?.date && new Date(s.date).toDateString() === today.toDateString())
    .reduce((acc, s) => acc + s.duration, 0);
  const hours = Math.floor(todayStudyMs / 60);
  const mins = todayStudyMs % 60;

  // Weekly study bar — last 7 days
  const weekStudy = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toDateString();
    const mins = (state.studySessions || [])
      .filter(s => s?.date && new Date(s.date).toDateString() === dStr)
      .reduce((a, s) => a + s.duration, 0);
    return { label: format(d, 'EEE'), mins, isToday: i === 6 };
  });
  const maxStudyMins = Math.max(...weekStudy.map(d => d.mins), 60); // min 60 so bars aren't too tall at 0

  // Homework
  const todayMidnight = new Date(today); todayMidnight.setHours(0, 0, 0, 0);
  const todayHw = (state.homework || []).filter(h => h.dueDate && new Date(h.dueDate).toDateString() === today.toDateString());
  const overdueHw = (state.homework || []).filter(h => !h.done && h.dueDate && new Date(h.dueDate) < todayMidnight);
  const todayHwDone = todayHw.filter(h => h.done).length;
  const progressPercent = todayHw.length > 0 ? (todayHwDone / todayHw.length) * 100 : 100;

  // Today's calendar events
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

  // Nearest upcoming exam (global)
  const upcomingExams = (state.exams || [])
    .filter(e => e?.date && new Date(e.date) >= todayMidnight)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextExam = upcomingExams[0];
  const daysToExam = nextExam ? Math.ceil(differenceInDays(new Date(nextExam.date), today)) : null;

  // Pending attendance
  const WEEKDAY_JS: Record<WeekDay, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const pendingClasses: { subjectId: string; subjectName: string; colour: string; date: Date }[] = [];
  const onlineSubjects = (state.subjects || []).filter(s => s.onlineClass && Array.isArray(s.classSchedule) && s.classSchedule.length > 0);

  for (const sub of onlineSubjects) {
    const entries = sub.classSchedule!;
    const scheduledDays = new Set(entries.map(e => e.day));
    let startDate: Date;
    if (sub.scheduleStartDate) {
      startDate = new Date(sub.scheduleStartDate);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(todayMidnight);
      startDate.setDate(startDate.getDate() - 60);
    }
    const msPerDay = 86400000;
    const dayCount = Math.floor((todayMidnight.getTime() - startDate.getTime()) / msPerDay);
    for (let i = 0; i <= dayCount; i++) {
      const d = new Date(startDate.getTime() + i * msPerDay);
      const jsDay = d.getDay();
      const dayName = (Object.keys(WEEKDAY_JS) as WeekDay[]).find(k => WEEKDAY_JS[k] === jsDay);
      if (!dayName || !scheduledDays.has(dayName)) continue;
      const dStr = d.toISOString().split('T')[0];
      const alreadyLogged = (state.attendanceLogs || []).some(
        l => l.subjectId === sub.id && new Date(l.date).toISOString().split('T')[0] === dStr
      );
      if (!alreadyLogged) pendingClasses.push({ subjectId: sub.id, subjectName: sub.name, colour: sub.colour, date: new Date(d) });
    }
  }
  pendingClasses.sort((a, b) => a.date.getTime() - b.date.getTime());

  const handleAttendanceTag = (subjectId: string, date: Date, status: 'attended' | 'cancelled' | 'rescheduled') => {
    dispatch({
      type: 'LOG_ATTENDANCE',
      payload: { id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`, subjectId, date, status, loggedAt: new Date() },
    });
    setAttendanceConfirm(null);
  };

  // ── Onboarding ───────────────────────────────────────────────────────────
  if (!hasSubjects) {
    return (
      <div className="max-w-2xl mx-auto pt-12 pb-16 text-center">
        <div className="flex justify-center mb-8 animate-float drop-shadow-[0_0_24px_rgba(255,107,157,0.5)]">
          <ChapteredLogo size={88} />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Welcome to <span className="gradient-text">Chaptered</span>
        </h1>
        <p className="text-text-muted text-lg mb-10 leading-relaxed">
          Your personal study companion. Add subjects to start tracking chapters, exams, and homework.
        </p>
        <button
          onClick={() => { playSound('pop'); navigate('/subjects'); }}
          className="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-105 flex items-center gap-3 mx-auto shadow-xl shadow-accent/30 glow-accent"
        >
          <Plus size={22} /> Add Your First Subject
        </button>
      </div>
    );
  }

  // ── Main Dashboard ───────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">

      {/* Save / Focus toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-gold font-bold"><Loader2 size={12} className="animate-spin" /> Syncing…</span>
          ) : lastSaveTime ? (
            <span className="flex items-center gap-1.5 text-green font-bold"><CheckCircle2 size={12} /> Saved {format(lastSaveTime, 'HH:mm')}</span>
          ) : null}
          <button onClick={() => forceSave()} className="p-1.5 text-text-muted hover:text-white transition-colors" title="Force save">
            <Save size={14} />
          </button>
        </div>
        <button
          onClick={() => { playSound('pop'); navigate('/timer'); }}
          className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-accent/20"
        >
          <Play fill="currentColor" size={15} />
          Start Focus
        </button>
      </div>

      {/* Smart Exam Alert Banner */}
      {nextExam && daysToExam !== null && daysToExam <= 14 && (
        <div
          className={`flex items-center gap-4 p-4 rounded-2xl ${daysToExam <= 3 ? 'text-coral' : daysToExam <= 7 ? 'text-orange-400' : 'text-gold'}`}
          style={{
            background: daysToExam <= 3 ? 'rgba(255,107,107,0.1)' : daysToExam <= 7 ? 'rgba(251,146,60,0.08)' : 'rgba(251,191,36,0.08)',
            border: `1px solid ${daysToExam <= 3 ? 'rgba(255,107,107,0.3)' : daysToExam <= 7 ? 'rgba(251,146,60,0.25)' : 'rgba(251,191,36,0.25)'}`,
          }}
        >
          <AlertTriangle size={20} className="shrink-0" />
          <div className="flex-1">
            <span className="font-black text-sm">{nextExam.name}</span>
            <span className="text-text-muted text-sm"> · {daysToExam <= 0 ? 'Today!' : `${daysToExam} day${daysToExam !== 1 ? 's' : ''} left`}</span>
          </div>
          <button
            onClick={() => navigate(`/subjects/${nextExam.subjectId}`)}
            className="text-xs font-bold underline opacity-70 hover:opacity-100 transition-opacity shrink-0"
          >
            Review now →
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Streak */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.15)' }}>
            <Flame size={20} className="text-gold animate-fire" fill="currentColor" />
          </div>
          <div>
            <div className="text-2xl font-black text-gold leading-none">{state.streak ?? 0}</div>
            <div className="text-[10px] text-gold/60 font-bold uppercase tracking-widest">day streak</div>
          </div>
        </div>

        {/* Study time */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(103,232,249,0.07)', border: '1px solid rgba(103,232,249,0.18)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(103,232,249,0.12)' }}>
            {todayStudyMs > 0 ? <Timer size={20} className="text-sky" /> : <Coffee size={20} className="text-sky opacity-50" />}
          </div>
          <div>
            {todayStudyMs > 0 ? (
              <>
                <div className="text-2xl font-black text-white leading-none">{hours}h {mins}m</div>
                <div className="text-[10px] text-sky/60 font-bold uppercase tracking-widest">focus today</div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-text-muted">No sessions yet</div>
                <button onClick={() => navigate('/timer')} className="text-[11px] text-sky font-bold hover:underline">Start now →</button>
              </>
            )}
          </div>
        </div>

        {/* Daily tasks */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(61,237,122,0.07)', border: '1px solid rgba(61,237,122,0.18)' }}>
          <div className="relative w-10 h-10 shrink-0">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle cx="20" cy="20" r="17" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="transparent" />
              <circle cx="20" cy="20" r="17" stroke="var(--green)" strokeWidth="4" fill="transparent"
                strokeDasharray={`${2 * Math.PI * 17}`}
                strokeDashoffset={`${2 * Math.PI * 17 * (1 - progressPercent / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            {progressPercent >= 100 && todayHw.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 size={14} className="text-green" />
              </div>
            )}
          </div>
          <div>
            {todayHw.length === 0 ? (
              <>
                <div className="text-sm font-bold text-green">All clear!</div>
                <div className="text-[10px] text-text-muted font-bold">No tasks today</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-black text-white leading-none">{todayHwDone}<span className="text-lg text-text-muted font-medium">/{todayHw.length}</span></div>
                <div className="text-[10px] text-green/60 font-bold uppercase tracking-widest">tasks done</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">

          {/* Today's Schedule */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={15} className="text-sky" />
                Today's Schedule
              </h2>
              <button onClick={() => navigate('/calendar')} className="text-xs font-medium text-accent hover:text-white transition-colors flex items-center gap-1">
                Calendar <ArrowRight size={13} />
              </button>
            </div>
            {todaySchedule.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-2 text-text-muted">
                <CalendarX2 size={22} className="opacity-30" />
                <p className="text-sm">Nothing scheduled — <button onClick={() => navigate('/calendar')} className="text-accent hover:underline">add an event</button></p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySchedule.map(ev => {
                  const sub = state.subjects.find(s => s.id === ev.subjectId);
                  const col = ev.color || sub?.colour || BLOCK_TYPE_COLORS[ev.type] || '#8A8070';
                  return (
                    <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                      style={{ background: `${col}08`, borderLeft: `3px solid ${col}`, border: `1px solid ${col}20`, borderLeftWidth: '3px', borderLeftColor: col }}>
                      <div className="text-[10px] font-black uppercase tracking-widest w-16 shrink-0 text-right font-mono" style={{ color: col }}>
                        {formatTime(ev.startTime)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-sm truncate">{ev.title}</div>
                        {sub && <div className="text-[10px] text-text-muted mt-0.5">{sub.name}</div>}
                      </div>
                      {ev.endTime && <div className="text-[10px] font-bold text-text-muted shrink-0">{formatTime(ev.endTime)}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Study Bar */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Timer size={15} className="text-accent" />
                This Week's Focus
              </h2>
              <div className="text-xs text-text-muted font-bold">
                {Math.round(weekStudy.reduce((a, d) => a + d.mins, 0) / 60 * 10) / 10}h total
              </div>
            </div>
            <div className="flex items-end justify-between gap-1.5 h-20">
              {weekStudy.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${day.isToday ? 'opacity-100' : 'opacity-60'}`}
                      style={{
                        height: `${Math.max(4, Math.round((day.mins / maxStudyMins) * 100))}%`,
                        background: day.isToday ? 'var(--accent)' : 'rgba(255,107,157,0.35)',
                        minHeight: '4px',
                      }}
                      title={`${day.mins}m`}
                    />
                  </div>
                  <div className={`text-[9px] font-black uppercase tracking-widest ${day.isToday ? 'text-accent' : 'text-text-muted'}`}>{day.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects quick-nav */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpenIcon size={15} className="text-accent" />
                Subjects
              </h2>
              <button onClick={() => navigate('/subjects')} className="text-xs font-medium text-accent hover:text-white transition-colors flex items-center gap-1">
                All subjects <ArrowRight size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(state.subjects || []).slice(0, 6).map(sub => {
                const chapters = sub.chapters || [];
                const examReady = chapters.filter(c => c.examStatus === 'confident' || c.examStatus === 'revised').length;
                const pct = chapters.length > 0 ? Math.round((examReady / chapters.length) * 100) : 0;
                return (
                  <button
                    key={sub.id}
                    onClick={() => navigate(`/subjects/${sub.id}`)}
                    className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all hover:scale-[1.02] hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `${sub.colour}20` }}>
                      <SubjectIcon name={sub.icon} size={16} color={sub.colour} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{sub.name}</div>
                      <div className="text-[10px] text-text-muted">{pct}% ready</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">

          {/* Homework */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare size={15} className="text-accent" />
                Homework
                {(todayHw.length + overdueHw.length) > 0 && (
                  <span className="bg-accent/15 text-accent text-[10px] px-1.5 py-0.5 rounded-full font-bold">{todayHw.length}</span>
                )}
                {overdueHw.length > 0 && (
                  <span className="bg-coral/15 text-coral text-[10px] px-1.5 py-0.5 rounded-full font-bold">{overdueHw.length} overdue</span>
                )}
              </h2>
              <button onClick={() => navigate('/homework')} className="text-xs font-medium text-text-muted hover:text-white transition-colors">All →</button>
            </div>
            <div className="space-y-2">
              {[...overdueHw.slice(0, 2), ...todayHw].slice(0, 5).length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-text-muted py-2">
                  <PartyPopper size={15} className="text-gold shrink-0" />
                  Nothing due today!
                </div>
              ) : [...overdueHw.slice(0, 2), ...todayHw].slice(0, 5).map(hw => {
                const sub = state.subjects.find(s => s.id === hw.subjectId);
                const isOverdue = !hw.done && new Date(hw.dueDate) < todayMidnight;
                return (
                  <div key={hw.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${hw.done ? 'opacity-50' : ''}`}
                    style={{ background: isOverdue ? 'rgba(255,107,107,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isOverdue ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                    <button
                      onClick={() => handleToggleHw(hw.id, hw.done)}
                      className={`shrink-0 transition-transform hover:scale-110 ${hw.done ? 'text-green' : isOverdue ? 'text-coral/60 hover:text-coral' : 'text-text-muted hover:text-accent'}`}
                    >
                      {hw.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${hw.done ? 'line-through text-text-muted' : 'text-white'}`}>{hw.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {sub && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sub.colour }} />}
                        <span className={`text-[10px] font-bold ${isOverdue ? 'text-coral' : 'text-text-muted'}`}>
                          {isOverdue ? `Overdue ${format(new Date(hw.dueDate), 'd MMM')}` : `Due ${format(new Date(hw.dueDate), 'd MMM')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mood This Week */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4">Mood This Week</h2>
            <div className="flex justify-between items-end px-1">
              {last7DaysMoods.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <MoodIcon mood={m.mood} size={18} />
                  <div className="text-[9px] text-text-muted font-black">{m.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Attendance */}
          {pendingClasses.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ClipboardCheck size={15} className="text-yellow-400" />
                  Attendance
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-yellow-400" style={{ background: 'rgba(251,191,36,0.15)' }}>{pendingClasses.length}</span>
                </h2>
                <button onClick={() => navigate('/attendance')} className="text-xs font-medium text-text-muted hover:text-white transition-colors">All →</button>
              </div>
              <div className="space-y-2">
                {pendingClasses.slice(0, 4).map((cls, idx) => (
                  <div key={`${cls.subjectId}-${cls.date.toISOString()}-${idx}`} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cls.colour }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{cls.subjectName}</div>
                      <div className="text-[10px] text-text-muted">{format(cls.date, 'd MMM')}</div>
                    </div>
                    <button
                      onClick={() => setAttendanceConfirm({ subjectId: cls.subjectId, subjectName: cls.subjectName, date: cls.date })}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-yellow-400 hover:bg-yellow-400/20 transition-colors shrink-0"
                      style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
                    >
                      Tag
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming exams (if no alert banner) */}
          {upcomingExams.length > 0 && !(daysToExam !== null && daysToExam <= 14) && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-xs font-black text-text-muted uppercase tracking-widest mb-3">Upcoming Exams</h2>
              <div className="space-y-2">
                {upcomingExams.slice(0, 3).map(ex => {
                  const days = Math.ceil(differenceInDays(new Date(ex.date), today));
                  const sub = state.subjects.find(s => s.id === ex.subjectId);
                  return (
                    <div key={ex.id} className="flex items-center gap-2.5">
                      {sub && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sub.colour }} />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{ex.name}</div>
                        <div className="text-[10px] text-text-muted">{format(new Date(ex.date), 'd MMM')}</div>
                      </div>
                      <CountdownChip days={days} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendance confirmation popup */}
      {attendanceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAttendanceConfirm(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}
            style={{ background: 'rgba(22,20,35,0.97)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
            <div className="text-base font-bold text-white mb-1">{attendanceConfirm.subjectName}</div>
            <div className="text-sm text-text-muted mb-5">{format(attendanceConfirm.date, 'd MMMM yyyy')}</div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleAttendanceTag(attendanceConfirm.subjectId, attendanceConfirm.date, 'attended')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors hover:scale-105"
                style={{ background: 'rgba(61,237,122,0.1)', border: '1px solid rgba(61,237,122,0.25)', color: 'var(--green)' }}>
                <Check size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Attended</span>
              </button>
              <button onClick={() => handleAttendanceTag(attendanceConfirm.subjectId, attendanceConfirm.date, 'cancelled')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors hover:scale-105"
                style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: 'var(--coral)' }}>
                <X size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Cancelled</span>
              </button>
              <button onClick={() => handleAttendanceTag(attendanceConfirm.subjectId, attendanceConfirm.date, 'rescheduled')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors hover:scale-105"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: 'var(--gold)' }}>
                <RefreshCw size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Rescheduled</span>
              </button>
            </div>
            <button onClick={() => setAttendanceConfirm(null)} className="w-full mt-3 text-xs text-text-muted hover:text-white transition-colors py-1">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
