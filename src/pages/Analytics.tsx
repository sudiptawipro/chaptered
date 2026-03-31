import { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  TrendingUp, Clock, BookOpen, AlertTriangle, Award, Brain,
  CalendarDays, Flame, ChevronRight, BarChart2
} from 'lucide-react';
import { format, subDays, startOfDay, differenceInDays } from 'date-fns';

const COLORS = ['#FF6B9D', '#67E8F9', '#FBBF24', '#3DED7A', '#A78BFA', '#FB923C', '#34D399'];

function StatCard({ icon, label, value, sub, color = 'accent' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    accent: 'rgba(255,107,157,0.15)', sky: 'rgba(103,232,249,0.15)',
    gold: 'rgba(251,191,36,0.15)', green: 'rgba(61,237,122,0.15)',
    purple: 'rgba(167,139,250,0.15)', orange: 'rgba(251,146,60,0.15)',
  };
  const borderMap: Record<string, string> = {
    accent: 'rgba(255,107,157,0.3)', sky: 'rgba(103,232,249,0.3)',
    gold: 'rgba(251,191,36,0.3)', green: 'rgba(61,237,122,0.3)',
    purple: 'rgba(167,139,250,0.3)', orange: 'rgba(251,146,60,0.3)',
  };
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1 hover-lift"
      style={{ background: colorMap[color] || colorMap.accent, border: `1px solid ${borderMap[color] || borderMap.accent}` }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: colorMap[color] || colorMap.accent }}>
          {icon}
        </div>
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-sm font-bold shadow-xl"
        style={{ background: 'rgba(30,30,40,0.95)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}>
        <div className="text-text-muted text-xs mb-1">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { state } = useAppContext();
  const { subjects, studySessions, testMarks, homework, exams } = state;
  const [scoreSubjectFilter, setScoreSubjectFilter] = useState<string>('');

  // ── Study time per subject (all time) ──────────────────────────────────
  const studyBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    (studySessions || []).forEach(s => {
      const sub = subjects.find(x => x.id === s.subjectId);
      if (!sub) return;
      map[sub.name] = (map[sub.name] || 0) + (s.duration || 0);
    });
    return Object.entries(map)
      .map(([name, mins]) => ({ name, hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.hours - a.hours);
  }, [studySessions, subjects]);

  // ── Total study time ────────────────────────────────────────────────────
  const totalStudyMins = useMemo(() =>
    (studySessions || []).reduce((a, s) => a + (s.duration || 0), 0), [studySessions]);

  // ── Weekly heatmap (last 7 days) ────────────────────────────────────────
  const weekHeatmap = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, 'yyyy-MM-dd');
      const mins = (studySessions || [])
        .filter(s => {
          try { return format(new Date(s.date), 'yyyy-MM-dd') === key; } catch { return false; }
        })
        .reduce((a, s) => a + (s.duration || 0), 0);
      return { label: format(d, 'EEE'), date: key, mins, today: i === 6 };
    });
    return days;
  }, [studySessions]);

  const maxMins = Math.max(...weekHeatmap.map(d => d.mins), 1);

  // ── Test score trends ────────────────────────────────────────────────────
  const scoreTrend = useMemo(() => {
    const marks = [...(testMarks || [])]
      .filter(m => !scoreSubjectFilter || m.subjectId === scoreSubjectFilter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(m => ({
        date: (() => { try { return format(new Date(m.date), 'dd MMM'); } catch { return ''; } })(),
        pct: m.totalMarks > 0 ? Math.round((m.marksObtained / m.totalMarks) * 100) : 0,
        subject: subjects.find(s => s.id === m.subjectId)?.name || 'Unknown',
        raw: `${m.marksObtained}/${m.totalMarks}`,
      }));
    return marks;
  }, [testMarks, subjects, scoreSubjectFilter]);

  const avgScore = scoreTrend.length
    ? Math.round(scoreTrend.reduce((a, m) => a + m.pct, 0) / scoreTrend.length)
    : 0;

  // ── Neglected subjects (not studied in last 5+ days) ────────────────────
  const neglected = useMemo(() => {
    return subjects.map(sub => {
      const sessions = (studySessions || []).filter(s => s.subjectId === sub.id);
      if (!sessions.length) return { sub, daysSince: null as number | null };
      const last = sessions.reduce((a, s) => {
        const t = new Date(s.date).getTime();
        return t > a ? t : a;
      }, 0);
      const days = differenceInDays(new Date(), new Date(last));
      return { sub, daysSince: days };
    }).filter(x => x.daysSince === null || x.daysSince >= 5)
      .sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999));
  }, [subjects, studySessions]);

  // ── Avg daily study (last 7 days) ───────────────────────────────────────
  const avgDailyMins = Math.round(
    weekHeatmap.reduce((a, d) => a + d.mins, 0) / 7
  );

  // ── Completed homework rate ──────────────────────────────────────────────
  const hwTotal = (homework || []).length;
  const hwDone = (homework || []).filter(h => h.done).length;
  const hwRate = hwTotal > 0 ? Math.round((hwDone / hwTotal) * 100) : 0;

  // ── Upcoming exams pressure ──────────────────────────────────────────────
  const upcomingExams = (exams || [])
    .filter(e => new Date(e.date) >= startOfDay(new Date()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.35)' }}>
          <BarChart2 size={22} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Study Analytics</h1>
          <p className="text-text-muted text-sm mt-0.5">Track your progress, spot gaps, stay ahead</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Clock size={16} className="text-sky-400" />}
          label="Total Study"
          value={totalStudyMins >= 60 ? `${Math.floor(totalStudyMins / 60)}h ${totalStudyMins % 60}m` : `${totalStudyMins}m`}
          sub="all time"
          color="sky"
        />
        <StatCard
          icon={<Flame size={16} className="text-gold" />}
          label="Daily Average"
          value={avgDailyMins >= 60 ? `${Math.floor(avgDailyMins / 60)}h ${avgDailyMins % 60}m` : `${avgDailyMins}m`}
          sub="last 7 days"
          color="gold"
        />
        <StatCard
          icon={<Award size={16} className="text-accent" />}
          label="Avg Score"
          value={`${avgScore}%`}
          sub={`${scoreTrend.length} tests tracked`}
          color="accent"
        />
        <StatCard
          icon={<BookOpen size={16} className="text-green-400" />}
          label="Homework"
          value={`${hwRate}%`}
          sub={`${hwDone}/${hwTotal} completed`}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Weekly Heatmap */}
        <div className="rounded-2xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays size={17} className="text-sky-400" />
            <h2 className="font-black text-white text-lg">This Week</h2>
          </div>
          <div className="flex gap-2 items-end h-32">
            {weekHeatmap.map((day) => {
              const pct = day.mins / maxMins;
              const height = Math.max(pct * 100, day.mins > 0 ? 8 : 4);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative group cursor-default" style={{ height: 96 }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-xl transition-all"
                      style={{
                        height: `${height}%`,
                        background: day.today
                          ? 'linear-gradient(180deg, rgba(255,107,157,0.9), rgba(255,107,157,0.4))'
                          : day.mins > 0
                          ? 'linear-gradient(180deg, rgba(103,232,249,0.7), rgba(103,232,249,0.2))'
                          : 'rgba(255,255,255,0.05)',
                        border: day.today ? '1px solid rgba(255,107,157,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                    {day.mins > 0 && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block
                        text-[10px] font-bold text-white rounded-lg px-2 py-1 whitespace-nowrap z-10"
                        style={{ background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {day.mins >= 60 ? `${Math.floor(day.mins / 60)}h ${day.mins % 60}m` : `${day.mins}m`}
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold ${day.today ? 'text-accent' : 'text-text-muted'}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Study Distribution Pie */}
        <div className="rounded-2xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Brain size={17} className="text-purple-400" />
            <h2 className="font-black text-white text-lg">Subject Distribution</h2>
          </div>
          {studyBySubject.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted text-sm">
              <BookOpen size={28} className="mb-2 opacity-40" />
              Start using Focus Timer to see your study distribution
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={studyBySubject}
                  dataKey="hours"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={35}
                  strokeWidth={0}
                >
                  {studyBySubject.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Test Score Trend */}
      <div className="rounded-2xl p-6 mb-6"
        style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={17} className="text-accent" />
            <h2 className="font-black text-white text-lg">Test Score Trend</h2>
          </div>
          <select
            value={scoreSubjectFilter}
            onChange={e => setScoreSubjectFilter(e.target.value)}
            className="rounded-xl px-3 py-1.5 text-sm font-bold text-white outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {subjects.length === 0
              ? <option value="">No subjects yet</option>
              : subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
            }
          </select>
        </div>
        {scoreTrend.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted text-sm">
            <Award size={28} className="mb-2 opacity-40" />
            No test marks logged yet — add marks from the Exams page
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreTrend}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="pct"
                stroke="#FF6B9D"
                strokeWidth={2.5}
                dot={{ fill: '#FF6B9D', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#FF6B9D', stroke: 'rgba(255,107,157,0.4)', strokeWidth: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Subject Time Bar */}
        <div className="rounded-2xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Clock size={17} className="text-gold" />
            <h2 className="font-black text-white text-lg">Study Time by Subject</h2>
          </div>
          {studyBySubject.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-text-muted text-sm">
              <Clock size={28} className="mb-2 opacity-40" />
              No study sessions recorded yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, studyBySubject.length * 40)}>
              <BarChart data={studyBySubject} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" radius={[0, 8, 8, 0]}>
                  {studyBySubject.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Neglect Nudges */}
        <div className="rounded-2xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={17} className="text-orange-400" />
            <h2 className="font-black text-white text-lg">Attention Needed</h2>
          </div>
          {neglected.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-text-muted text-sm gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(61,237,122,0.15)', border: '1px solid rgba(61,237,122,0.3)' }}>
                <Award size={20} className="text-green-400" />
              </div>
              You're staying on top of all subjects!
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {neglected.slice(0, 6).map(({ sub, daysSince }) => {
                const isNever = daysSince === null;
                const isUrgent = daysSince !== null && daysSince >= 7;
                return (
                  <div key={sub.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover-lift cursor-default"
                    style={{
                      background: isUrgent ? 'rgba(255,107,107,0.07)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isUrgent ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sub.colour || '#FF6B9D' }} />
                    <span className="font-bold text-white text-sm flex-1">{sub.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isNever ? 'bg-gray-500/20 text-gray-400' :
                      isUrgent ? 'bg-red-500/15 text-coral' : 'bg-orange-500/15 text-orange-400'
                    }`}>
                      {isNever ? 'Never studied' : `${daysSince}d ago`}
                    </span>
                    <ChevronRight size={14} className="text-text-muted" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Exam Pressure */}
      {upcomingExams.length > 0 && (
        <div className="rounded-2xl p-6 mt-6"
          style={{ background: 'rgba(255,107,157,0.06)', border: '1px solid rgba(255,107,157,0.15)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Flame size={17} className="text-accent" />
            <h2 className="font-black text-white text-lg">Upcoming Exam Pressure</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {upcomingExams.slice(0, 5).map(exam => {
              const daysLeft = differenceInDays(new Date(exam.date), new Date());
              const sub = subjects.find(s => s.id === exam.subjectId);
              return (
                <div key={exam.id} className="rounded-xl px-4 py-3 flex flex-col gap-1"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${daysLeft <= 7 ? 'rgba(255,107,107,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  <div className="font-black text-white text-sm">{exam.name}</div>
                  <div className="text-xs text-text-muted">{sub?.name || 'Unknown'}</div>
                  <div className={`text-xs font-black mt-1 ${daysLeft <= 3 ? 'text-coral' : daysLeft <= 7 ? 'text-orange-400' : 'text-gold'}`}>
                    {daysLeft <= 0 ? 'Today!' : `${daysLeft} days left`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
