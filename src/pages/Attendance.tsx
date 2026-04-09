import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { AttendanceLog } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Plus, Check, X, RefreshCw, Trash2 } from 'lucide-react';
import SubjectIcon from '../components/SubjectIcon';


// ── Calendar Grid ─────────────────────────────────────────────────────────────
function CalendarGrid({
  year, month, logs, subjects, selectedSubjectId,
}: {
  year: number; month: number;
  logs: AttendanceLog[];
  subjects: ReturnType<typeof useAppContext>['state']['subjects'];
  selectedSubjectId: string | null;
}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // 0 = Sun, pad so grid starts on Mon
  const startPad = (firstDay.getDay() + 6) % 7; // Mon=0
  const today = new Date();

  const filteredLogs = selectedSubjectId ? logs.filter(l => l.subjectId === selectedSubjectId) : logs;

  // Build a map: dateStr -> logs[]
  const logsByDay: Record<string, AttendanceLog[]> = {};
  for (const log of filteredLogs) {
    const key = new Date(log.date).toISOString().split('T')[0];
    if (!logsByDay[key]) logsByDay[key] = [];
    logsByDay[key].push(log);
  }

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const cells = Array.from({ length: startPad + daysInMonth }, (_, i) => i < startPad ? null : i - startPad + 1);

  const statusDot = (status: AttendanceLog['status']) =>
    status === 'attended' ? '#3DED7A' : status === 'cancelled' ? '#FF6B6B' : '#FBBF24';

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-text-muted py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayLogs = logsByDay[dateStr] || [];
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const isFuture = new Date(dateStr) > today;

          return (
            <div
              key={day}
              className={`rounded-lg p-1 min-h-[44px] flex flex-col items-center transition-all ${isToday ? 'ring-1 ring-accent' : ''}`}
              style={{ background: dayLogs.length > 0 ? 'rgba(255,255,255,0.04)' : 'transparent' }}
            >
              <span className={`text-[10px] font-bold mb-1 ${isToday ? 'text-accent' : isFuture ? 'text-text-muted/40' : 'text-text-muted'}`}>{day}</span>
              <div className="flex flex-wrap gap-0.5 justify-center">
                {dayLogs.map(log => (
                  <div
                    key={log.id}
                    className="w-2 h-2 rounded-full"
                    style={{ background: statusDot(log.status) }}
                    title={`${subjects.find(s => s.id === log.subjectId)?.name} — ${log.status}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 px-1">
        {[
          { color: '#3DED7A', label: 'Attended' },
          { color: '#FF6B6B', label: 'Cancelled' },
          { color: '#FBBF24', label: 'Rescheduled' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            <span className="text-[10px] text-text-muted font-bold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  attended:    { label: 'Attended',    color: 'text-green',   bg: 'bg-green/10 border-green/30',   icon: Check },
  cancelled:   { label: 'Cancelled',   color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', icon: X },
  rescheduled: { label: 'Rescheduled', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', icon: RefreshCw },
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isSameMonth(d: Date, year: number, month: number) {
  const date = new Date(d);
  return date.getFullYear() === year && date.getMonth() === month;
}

export default function Attendance() {
  const { state, dispatch } = useAppContext();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSubjectId, setAddSubjectId] = useState('');
  const [addDate, setAddDate] = useState(now.toISOString().split('T')[0]);
  const [addStatus, setAddStatus] = useState<AttendanceLog['status']>('attended');
  const [addRescheduledTo, setAddRescheduledTo] = useState('');

  const onlineSubjects = state.subjects.filter(s => s.onlineClass);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Logs for current month view
  const monthLogs = useMemo(() =>
    (state.attendanceLogs || []).filter(l => isSameMonth(l.date, viewYear, viewMonth)),
    [state.attendanceLogs, viewYear, viewMonth]
  );

  // Filtered by selected subject
  const displayLogs = useMemo(() => {
    const logs = selectedSubjectId ? monthLogs.filter(l => l.subjectId === selectedSubjectId) : monthLogs;
    return [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthLogs, selectedSubjectId]);

  // Monthly summary per subject
  const summary = useMemo(() => {
    return onlineSubjects.map(sub => {
      const logs = monthLogs.filter(l => l.subjectId === sub.id);
      return {
        sub,
        attended: logs.filter(l => l.status === 'attended').length,
        cancelled: logs.filter(l => l.status === 'cancelled').length,
        rescheduled: logs.filter(l => l.status === 'rescheduled').length,
        total: logs.length,
      };
    });
  }, [onlineSubjects, monthLogs]);

  const handleAdd = () => {
    if (!addSubjectId || !addDate) return;
    const log: AttendanceLog = {
      id: `att-${Date.now()}`,
      subjectId: addSubjectId,
      date: new Date(addDate),
      status: addStatus,
      rescheduledTo: addStatus === 'rescheduled' && addRescheduledTo ? new Date(addRescheduledTo) : undefined,
      loggedAt: new Date(),
    };
    dispatch({ type: 'LOG_ATTENDANCE', payload: log });
    setShowAddModal(false);
    setAddRescheduledTo('');
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_ATTENDANCE', payload: id });
  };

  if (onlineSubjects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center space-y-4">
        <div className="text-5xl">📋</div>
        <h2 className="text-2xl font-bold text-white">No Online Classes Set Up</h2>
        <p className="text-text-muted text-sm">Go to <strong>Subjects</strong>, edit a subject, and toggle <strong>Online Class</strong> to start tracking attendance.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Attendance</h1>
        <button
          onClick={() => { setAddSubjectId(onlineSubjects[0]?.id || ''); setShowAddModal(true); }}
          className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-accent/20 transition-all hover:scale-105"
        >
          <Plus size={18} /> Log Class
        </button>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center gap-4">
        <button onClick={prevMonth} className="p-2 rounded-lg bg-bg-card border border-border hover:bg-bg-raised transition-colors">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <span className="text-white font-bold text-lg flex-1 text-center">{monthName}</span>
        <button onClick={nextMonth} className="p-2 rounded-lg bg-bg-card border border-border hover:bg-bg-raised transition-colors">
          <ChevronRight size={18} className="text-white" />
        </button>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {summary.map(({ sub, attended, cancelled, rescheduled, total }) => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubjectId(selectedSubjectId === sub.id ? null : sub.id)}
            className={`p-4 rounded-xl border text-left transition-all ${selectedSubjectId === sub.id ? 'border-accent bg-accent/10' : 'border-border bg-bg-card hover:bg-bg-raised'}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${sub.colour}20` }}>
                <SubjectIcon name={sub.icon} size={16} color={sub.colour} />
              </div>
              <span className="text-sm font-bold text-white truncate">{sub.name}</span>
            </div>
            <div className="text-2xl font-black text-white">{attended}<span className="text-sm font-bold text-text-muted">/{total}</span></div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">Attended</div>
            {(cancelled + rescheduled) > 0 && (
              <div className="flex gap-2 mt-2">
                {cancelled > 0 && <span className="text-[10px] font-bold text-red-400">{cancelled} cancelled</span>}
                {rescheduled > 0 && <span className="text-[10px] font-bold text-yellow-400">{rescheduled} rescheduled</span>}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <CalendarGrid
        year={viewYear}
        month={viewMonth}
        logs={monthLogs}
        subjects={state.subjects}
        selectedSubjectId={selectedSubjectId}
      />

      {/* Log List */}
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-white">
            {selectedSubjectId
              ? state.subjects.find(s => s.id === selectedSubjectId)?.name + ' — '
              : ''}
            {monthName} Log
          </h3>
          <span className="text-xs text-text-muted">{displayLogs.length} entries</span>
        </div>

        {displayLogs.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">No classes logged for this month.</div>
        ) : (
          <div className="divide-y divide-border">
            {displayLogs.map(log => {
              const sub = state.subjects.find(s => s.id === log.subjectId);
              const cfg = STATUS_CONFIG[log.status];
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-raised transition-colors group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: sub ? `${sub.colour}20` : '#ffffff10' }}>
                    <SubjectIcon name={sub?.icon || 'GraduationCap'} size={16} color={sub?.colour} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{sub?.name || '—'}</div>
                    <div className="text-xs text-text-muted">{formatDate(log.date)}</div>
                    {log.rescheduledTo && (
                      <div className="text-xs text-yellow-400">→ Rescheduled to {formatDate(log.rescheduledTo)}</div>
                    )}
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-coral transition-all rounded-lg hover:bg-coral/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-5">
            <h2 className="text-xl font-bold text-white">Log a Class</h2>

            <div>
              <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-2 block">Subject</label>
              <select
                value={addSubjectId}
                onChange={e => setAddSubjectId(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-accent"
              >
                {onlineSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-2 block">Date</label>
              <input
                type="date"
                value={addDate}
                onChange={e => setAddDate(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-2 block">Status</label>
              <div className="flex gap-2">
                {(['attended', 'cancelled', 'rescheduled'] as const).map(s => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setAddStatus(s)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${addStatus === s ? `${cfg.bg} ${cfg.color}` : 'bg-bg-raised border-border text-text-muted hover:text-white'}`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {addStatus === 'rescheduled' && (
              <div>
                <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-2 block">Rescheduled To</label>
                <input
                  type="date"
                  value={addRescheduledTo}
                  onChange={e => setAddRescheduledTo(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-accent"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl border border-border text-text-muted hover:text-white font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!addSubjectId || !addDate}
                className="flex-[2] py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold transition-all disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
