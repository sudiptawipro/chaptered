import { useAppContext } from '../context/AppContext';
import { format, subDays, differenceInDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import ProgressBar from '../components/ProgressBar';
import CountdownChip from '../components/CountdownChip';
import { AlertTriangle, CheckCircle2, Clock, MessageCircleQuestion } from 'lucide-react';

// ─── Shared glass stat card ──────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, accentColor,
}: {
  label: string; value: string; sub: string; icon: React.ReactNode; accentColor: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      {/* Decorative icon watermark */}
      <div className="absolute -top-2 -right-2 opacity-10 scale-[2.2] pointer-events-none select-none">
        {icon}
      </div>
      <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">{label}</div>
      <div className="text-3xl font-black mb-1" style={{ color: accentColor }}>{value}</div>
      <div className="text-xs text-text-muted font-medium">{sub}</div>
    </div>
  );
}

// ─── Custom tooltip for charts ───────────────────────────────────────────────
const GlassTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(14,14,24,0.90)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12,
      padding: '8px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: '#8A8070', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#F5F0E8', fontSize: 13, fontWeight: 700 }}>
          {p.name}: {p.value}{p.unit || ''}
        </p>
      ))}
    </div>
  );
};

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ParentDashboard() {
  const { state } = useAppContext();
  const today = new Date();
  const studentName = state.profile?.name || 'Your child';

  // ── Weekly study data (7 days) ────────────────────────────────────────────
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const mins = (state.studySessions || [])
      .filter(s => new Date(s.date).toDateString() === d.toDateString())
      .reduce((acc, s) => acc + s.duration, 0);
    return {
      day: format(d, 'EEE'),
      mins,
      hours: parseFloat((mins / 60).toFixed(1)),
      isToday: d.toDateString() === today.toDateString(),
    };
  });

  const totalWeekMins = weekDays.reduce((acc, d) => acc + d.mins, 0);
  const totalWeekHours = Math.floor(totalWeekMins / 60);
  const totalWeekRem = totalWeekMins % 60;
  const daysStudied = weekDays.filter(d => d.mins > 0).length;

  // ── Homework stats ────────────────────────────────────────────────────────
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const thisWeekHw = (state.homework || []).filter(h => {
    if (!h.dueDate) return false;
    try { return isWithinInterval(new Date(h.dueDate), { start: weekStart, end: weekEnd }); }
    catch { return false; }
  });
  const hwDone = thisWeekHw.filter(h => h.done).length;
  const hwTotal = thisWeekHw.length;
  const hwPct = hwTotal > 0 ? Math.round((hwDone / hwTotal) * 100) : 100;

  const overdueHw = (state.homework || []).filter(h => {
    if (!h.dueDate || h.done) return false;
    try { return new Date(h.dueDate) < today; }
    catch { return false; }
  });

  // ── Upcoming exams ────────────────────────────────────────────────────────
  const upcomingExams = (state.exams || [])
    .filter(e => { try { return new Date(e.date) >= today; } catch { return false; } })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // ── Subject progress ──────────────────────────────────────────────────────
  const subjectStats = (state.subjects || []).map(sub => {
    const total = sub.chapters.length;
    const done = sub.chapters.filter(c => c.status === 'done').length;
    const inProg = sub.chapters.filter(c => c.status === 'in-progress').length;
    return {
      ...sub,
      total,
      done,
      inProg,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  // ── Mood ──────────────────────────────────────────────────────────────────
  const moodConfig = {
    happy:   { emoji: '😊', label: 'Happy',   color: '#3DED7A', bg: 'rgba(61,237,122,0.12)',   border: 'rgba(61,237,122,0.25)'  },
    neutral: { emoji: '😐', label: 'Neutral',  color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)'  },
    stressed:{ emoji: '😟', label: 'Stressed', color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.25)' },
  };
  const last7Moods = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const dtStr = d.toISOString().split('T')[0];
    const log = (state.moodLog || []).find(m => {
      try { return new Date(m.date).toISOString().split('T')[0] === dtStr; } catch { return false; }
    });
    return { date: format(d, 'EEE d'), mood: log?.mood ?? null };
  });
  const stressedDays = last7Moods.filter(m => m.mood === 'stressed').length;
  const happyDays = last7Moods.filter(m => m.mood === 'happy').length;

  // ── Test marks ────────────────────────────────────────────────────────────
  const recentMarks = (state.testMarks || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const marksChartData = recentMarks.slice().reverse().map(m => {
    const sub = state.subjects.find(s => s.id === m.subjectId);
    return {
      name: `${sub?.name ?? '?'} (${m.type})`,
      pct: Math.round((m.marksObtained / m.totalMarks) * 100),
      raw: `${m.marksObtained}/${m.totalMarks}`,
    };
  });

  // ── Doubts ────────────────────────────────────────────────────────────────
  const unresolvedDoubts = (state.doubts || []).filter(d => !d.resolved);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-14">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-black text-sky/70 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Eye size={13} className="text-sky" />
            Parent Overview
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            {studentName}'s Study Report
          </h1>
          <p className="text-text-muted mt-1 text-sm">{format(today, "EEEE, d MMMM yyyy")}</p>
        </div>

        {/* Streak pill */}
        <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4">
          <div className="text-3xl">🔥</div>
          <div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Current Streak</div>
            <div className="text-2xl font-black text-gold">{state.streak ?? 0} days</div>
          </div>
        </div>
      </div>

      {/* ── Top 4 Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Weekly Study Time"
          value={`${totalWeekHours}h ${totalWeekRem}m`}
          sub={`${daysStudied} of 7 days active`}
          icon={<Clock size={32} />}
          accentColor="#FF6B9D"
        />
        <StatCard
          label="Homework This Week"
          value={`${hwPct}%`}
          sub={`${hwDone} of ${hwTotal} tasks done`}
          icon={<CheckCircle2 size={32} />}
          accentColor={hwPct >= 80 ? '#3DED7A' : hwPct >= 50 ? '#FBBF24' : '#FF6B6B'}
        />
        <StatCard
          label="Overdue Tasks"
          value={String(overdueHw.length)}
          sub={overdueHw.length === 0 ? 'All caught up!' : 'Need attention'}
          icon={<AlertTriangle size={32} />}
          accentColor={overdueHw.length === 0 ? '#3DED7A' : '#FF6B6B'}
        />
        <StatCard
          label="Open Doubts"
          value={String(unresolvedDoubts.length)}
          sub={unresolvedDoubts.length === 0 ? 'Everything resolved' : 'Needs guidance'}
          icon={<MessageCircleQuestion size={32} />}
          accentColor={unresolvedDoubts.length === 0 ? '#3DED7A' : '#8B5CF6'}
        />
      </div>

      {/* ── Study Time + Mood ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Study time bar chart */}
        <div className="col-span-2 glass-card rounded-2xl p-6">
          <SectionHeading
            title="Study Hours — Last 7 Days"
            sub="Logged via Pomodoro focus timer sessions"
          />
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weekDays} barSize={34} barCategoryGap="30%">
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8A8070', fontSize: 12, fontWeight: 700 }}
              />
              <YAxis hide />
              <Tooltip content={<GlassTooltip />} cursor={false} />
              <Bar dataKey="hours" name="Hours" unit="h" radius={[8, 8, 0, 0]}>
                {weekDays.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isToday
                      ? '#FF6B9D'
                      : entry.hours > 0
                      ? 'rgba(255,107,157,0.55)'
                      : 'rgba(255,255,255,0.05)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-3 h-3 rounded-sm" style={{ background: '#FF6B9D' }} />
            <span className="text-xs text-text-muted">Today</span>
            <span className="w-3 h-3 rounded-sm ml-3" style={{ background: 'rgba(255,107,157,0.55)' }} />
            <span className="text-xs text-text-muted">Other days</span>
          </div>
        </div>

        {/* Mood tracker */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeading
            title="Mood This Week"
            sub="Daily self-reported check-ins"
          />

          {/* Mood summary */}
          {stressedDays >= 3 && (
            <div className="mb-4 px-3 py-2.5 rounded-xl text-xs font-bold text-coral flex items-center gap-2"
              style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)' }}>
              <AlertTriangle size={14} />
              {stressedDays} stressed days this week — check in!
            </div>
          )}
          {happyDays >= 4 && stressedDays < 2 && (
            <div className="mb-4 px-3 py-2.5 rounded-xl text-xs font-bold text-green flex items-center gap-2"
              style={{ background: 'rgba(61,237,122,0.08)', border: '1px solid rgba(61,237,122,0.18)' }}>
              <CheckCircle2 size={14} />
              Great mood week — keep it up!
            </div>
          )}

          <div className="space-y-2">
            {last7Moods.map((m, i) => {
              const cfg = m.mood ? moodConfig[m.mood] : null;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-text-muted w-10 shrink-0">{m.date}</span>
                  <div
                    className="flex-1 h-8 rounded-lg flex items-center px-3 gap-2 text-sm font-bold"
                    style={cfg
                      ? { background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }
                    }
                  >
                    {cfg ? (
                      <><span>{cfg.emoji}</span><span className="text-xs">{cfg.label}</span></>
                    ) : (
                      <span className="text-xs italic opacity-50">No check-in</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Subject Progress ─────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6">
        <SectionHeading
          title="Subject Progress"
          sub="Chapter completion across all subjects"
        />
        {subjectStats.length === 0 ? (
          <p className="text-sm text-text-muted">No subjects added yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-12 gap-y-5">
            {subjectStats.map(sub => (
              <div key={sub.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{sub.icon}</span>
                    <span className="font-bold text-white text-sm">{sub.name}</span>
                    {sub.inProg > 0 && (
                      <span className="text-[10px] font-bold text-gold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>
                        {sub.inProg} in progress
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold" style={{ color: sub.colour }}>
                    {sub.done}/{sub.total}
                  </span>
                </div>
                <ProgressBar progress={sub.pct} color={sub.colour} height={7} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Exams + Marks + Overdue ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Upcoming exams */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeading title="Upcoming Exams" />
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-text-muted">No upcoming exams scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map(exam => {
                const sub = state.subjects.find(s => s.id === exam.subjectId);
                const days = Math.max(0, Math.ceil(differenceInDays(new Date(exam.date), today)));
                return (
                  <div key={exam.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${sub?.colour || '#FF6B9D'}20` }}
                    >
                      {sub?.icon || '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{exam.name}</div>
                      <div className="text-[11px] text-text-muted">{sub?.name} · {exam.type}</div>
                    </div>
                    <CountdownChip days={days} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent test marks */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeading title="Recent Test Marks" sub="Last 6 recorded" />
          {recentMarks.length === 0 ? (
            <p className="text-sm text-text-muted">No marks recorded yet.</p>
          ) : marksChartData.length >= 3 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={marksChartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip content={<GlassTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="pct"
                    name="Score"
                    unit="%"
                    stroke="#FF6B9D"
                    strokeWidth={2.5}
                    dot={{ fill: '#FF6B9D', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {recentMarks.slice(0, 3).map(mark => {
                  const sub = state.subjects.find(s => s.id === mark.subjectId);
                  const pct = Math.round((mark.marksObtained / mark.totalMarks) * 100);
                  const col = pct >= 75 ? '#3DED7A' : pct >= 50 ? '#FBBF24' : '#FF6B6B';
                  return (
                    <div key={mark.id} className="flex items-center justify-between text-sm">
                      <span className="text-text-muted truncate max-w-[130px]">{sub?.name} · {mark.type}</span>
                      <span className="font-bold" style={{ color: col }}>{mark.marksObtained}/{mark.totalMarks}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {recentMarks.map(mark => {
                const sub = state.subjects.find(s => s.id === mark.subjectId);
                const pct = Math.round((mark.marksObtained / mark.totalMarks) * 100);
                const col = pct >= 75 ? '#3DED7A' : pct >= 50 ? '#FBBF24' : '#FF6B6B';
                return (
                  <div key={mark.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{sub?.name}</div>
                      <div className="text-[11px] text-text-muted">{mark.type} · {format(new Date(mark.date), 'dd MMM')}</div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: col }}>
                      {mark.marksObtained}/{mark.totalMarks}
                      <span className="text-[10px] ml-1 opacity-70">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overdue homework */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-white">Overdue Homework</h2>
            {overdueHw.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-coral"
                style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)' }}>
                {overdueHw.length}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mb-5">Past due, not yet submitted</p>

          {overdueHw.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <span className="text-4xl">🎉</span>
              <p className="text-sm font-bold text-green">All tasks on time!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueHw.map(hw => {
                const sub = state.subjects.find(s => s.id === hw.subjectId);
                const daysLate = Math.ceil(differenceInDays(today, new Date(hw.dueDate)));
                return (
                  <div key={hw.id} className="p-3 rounded-xl"
                    style={{ background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.18)' }}>
                    <div className="text-sm font-bold text-white">{hw.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-text-muted">{sub?.name}</span>
                      <span className="text-[10px] font-bold text-coral">{daysLate}d overdue</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Unresolved Doubts ────────────────────────────────────────────── */}
      {unresolvedDoubts.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <SectionHeading
            title={`Open Doubts (${unresolvedDoubts.length})`}
            sub="Topics where your child needs help — worth discussing"
          />
          <div className="grid grid-cols-2 gap-3">
            {unresolvedDoubts.slice(0, 6).map(doubt => {
              const sub = state.subjects.find(s => s.id === doubt.subjectId);
              return (
                <div key={doubt.id}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${sub?.colour || '#8B5CF6'}20`, color: sub?.colour || '#8B5CF6', border: `1px solid ${sub?.colour || '#8B5CF6'}30` }}>
                      {sub?.name || 'General'}
                    </span>
                    {doubt.topic && (
                      <span className="text-[10px] text-text-muted">{doubt.topic}</span>
                    )}
                  </div>
                  <p className="text-sm text-text line-clamp-2">{doubt.question}</p>
                </div>
              );
            })}
          </div>
          {unresolvedDoubts.length > 6 && (
            <p className="text-xs text-text-muted mt-3 text-center">
              +{unresolvedDoubts.length - 6} more doubts — open the Doubt Bank for the full list.
            </p>
          )}
        </div>
      )}

    </div>
  );
}

// Needed for the Eye icon inline usage in the header
function Eye({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
