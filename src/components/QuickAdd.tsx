/**
 * QuickAdd — floating action button accessible from every page.
 * Opens a mini panel to add Homework, Doubt, or Exam quickly.
 * Wired into Layout.tsx.
 */
import { useState } from 'react';
import { Plus, X, BookOpen, MessageCircleQuestion, GraduationCap, ClipboardCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { AttendanceLog } from '../context/AppContext';
import { format } from 'date-fns';
import { playSound } from '../hooks/useSound';
import { useToast } from './Toast';

export default function QuickAdd() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'menu' | 'hw' | 'doubt' | 'exam' | 'attendance'>('menu');

  // Homework fields
  const [hwTitle, setHwTitle] = useState('');
  const [hwSub, setHwSub] = useState(state.subjects[0]?.id || '');
  const [hwDate, setHwDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Doubt fields
  const [doubtQ, setDoubtQ] = useState('');
  const [doubtSub, setDoubtSub] = useState(state.subjects[0]?.id || '');

  // Exam fields
  const [exName, setExName] = useState('');
  const [exSub, setExSub] = useState(state.subjects[0]?.id || '');
  const [exDate, setExDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Attendance fields
  const onlineSubjects = state.subjects.filter(s => s.onlineClass);
  const [attSub, setAttSub] = useState(onlineSubjects[0]?.id || '');
  const [attDate, setAttDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attStatus, setAttStatus] = useState<AttendanceLog['status']>('attended');

  const openMode = (m: typeof mode) => {
    playSound('pop');
    setMode(m);
  };

  const toggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setMode('menu');
    } else {
      playSound('pop');
      setIsOpen(true);
    }
  };

  const submitHw = () => {
    if (!hwTitle.trim() || !hwSub) return;
    dispatch({
      type: 'ADD_HOMEWORK',
      payload: {
        id: `hw-${Date.now()}`,
        subjectId: hwSub,
        title: hwTitle,
        dueDate: new Date(hwDate),
        done: false,
        urgent: false,
        priority: 'Medium',
      }
    });
    toast('Homework added!', 'success');
    playSound('save');
    setHwTitle(''); setIsOpen(false); setMode('menu');
  };

  const submitDoubt = () => {
    if (!doubtQ.trim() || !doubtSub) return;
    const sub = state.subjects.find(s => s.id === doubtSub);
    dispatch({
      type: 'ADD_DOUBT',
      payload: {
        id: `doubt-${Date.now()}`,
        subjectId: doubtSub,
        topic: sub?.name || 'General',
        question: doubtQ,
        resolved: false,
        createdAt: new Date(),
      }
    });
    toast('Doubt logged!', 'info');
    playSound('save');
    setDoubtQ(''); setIsOpen(false); setMode('menu');
  };

  const submitExam = () => {
    if (!exName.trim() || !exSub) return;
    dispatch({
      type: 'ADD_EXAM',
      payload: {
        id: `exam-${Date.now()}`,
        subjectId: exSub,
        name: exName,
        date: new Date(exDate),
        type: state.examTypes?.[0] || 'Unit Test',
        linkedChapterIds: [],
      }
    });
    toast('Exam added!', 'success');
    playSound('success');
    setExName(''); setIsOpen(false); setMode('menu');
  };

  const submitAttendance = () => {
    if (!attSub || !attDate) return;
    dispatch({
      type: 'LOG_ATTENDANCE',
      payload: {
        id: `att-${Date.now()}`,
        subjectId: attSub,
        date: new Date(attDate),
        status: attStatus,
        loggedAt: new Date(),
      },
    });
    toast(`Attendance logged — ${attStatus}!`, 'success');
    playSound('save');
    setIsOpen(false); setMode('menu');
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(14,14,24,0.94)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
    borderRadius: 20,
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[998]" onClick={toggle} />
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-[999] w-80"
          style={panelStyle}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="font-bold text-white text-base">
              {mode === 'menu' ? '⚡ Quick Add' : mode === 'hw' ? '📚 Add Homework' : mode === 'doubt' ? '💬 Log Doubt' : mode === 'exam' ? '🎯 Add Exam' : '📋 Log Attendance'}
            </h3>
            {mode !== 'menu' ? (
              <button onClick={() => setMode('menu')} className="text-text-muted hover:text-white transition-colors text-xs font-bold">← Back</button>
            ) : (
              <button onClick={toggle} className="text-text-muted hover:text-white transition-colors"><X size={18} /></button>
            )}
          </div>

          <div className="p-5">
            {/* Menu */}
            {mode === 'menu' && (
              <div className="space-y-2">
                {[
                  { m: 'hw' as const, icon: <BookOpen size={18} />, label: 'Homework', color: '#FF6B9D', desc: 'Add a task with due date' },
                  { m: 'doubt' as const, icon: <MessageCircleQuestion size={18} />, label: 'Doubt', color: '#67E8F9', desc: 'Log something you\'re unsure about' },
                  { m: 'exam' as const, icon: <GraduationCap size={18} />, label: 'Exam', color: '#FBBF24', desc: 'Add an upcoming exam' },
                  ...(onlineSubjects.length > 0 ? [{ m: 'attendance' as const, icon: <ClipboardCheck size={18} />, label: 'Attendance', color: '#3DED7A', desc: 'Log a class session' }] : []),
                ].map(item => (
                  <button
                    key={item.m}
                    onClick={() => openMode(item.m)}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all hover:scale-[1.02] text-left"
                    style={{ background: `${item.color}0D`, borderColor: `${item.color}25`, color: item.color }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}20` }}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{item.label}</div>
                      <div className="text-[11px] text-text-muted font-medium mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Homework form */}
            {mode === 'hw' && (
              <div className="space-y-4">
                <select value={hwSub} onChange={e => setHwSub(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-accent">
                  {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input autoFocus value={hwTitle} onChange={e => setHwTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitHw()} placeholder="Task description..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-accent placeholder:text-text-muted" />
                <input type="date" value={hwDate} onChange={e => setHwDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-accent font-mono" />
                <button onClick={submitHw} className="w-full bg-accent hover:bg-accent-hover text-white py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02]">Add Homework</button>
              </div>
            )}

            {/* Doubt form */}
            {mode === 'doubt' && (
              <div className="space-y-4">
                <select value={doubtSub} onChange={e => setDoubtSub(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-accent">
                  {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <textarea autoFocus value={doubtQ} onChange={e => setDoubtQ(e.target.value)} placeholder="What are you unsure about?" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-accent placeholder:text-text-muted resize-none" />
                <button onClick={submitDoubt} className="w-full py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02] text-sky" style={{ background: 'rgba(103,232,249,0.15)', border: '1px solid rgba(103,232,249,0.3)' }}>Log Doubt</button>
              </div>
            )}

            {/* Exam form */}
            {mode === 'exam' && (
              <div className="space-y-4">
                <select value={exSub} onChange={e => setExSub(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-accent">
                  {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input autoFocus value={exName} onChange={e => setExName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitExam()} placeholder="Exam name..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-accent placeholder:text-text-muted" />
                <input type="date" value={exDate} onChange={e => setExDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-accent font-mono" />
                <button onClick={submitExam} className="w-full py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02] text-gold" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>Add Exam</button>
              </div>
            )}

            {/* Attendance form */}
            {mode === 'attendance' && (
              <div className="space-y-4">
                <select value={attSub} onChange={e => setAttSub(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-accent">
                  {onlineSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-accent font-mono" />
                <div className="grid grid-cols-3 gap-1.5">
                  {(['attended', 'cancelled', 'rescheduled'] as const).map(s => (
                    <button key={s} onClick={() => setAttStatus(s)}
                      className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${attStatus === s ? (s === 'attended' ? 'bg-green/20 border-green/40 text-green' : s === 'cancelled' ? 'bg-coral/20 border-coral/40 text-coral' : 'bg-gold/20 border-gold/40 text-gold') : 'border-white/10 text-text-muted hover:text-white'}`}
                    >
                      {s === 'attended' ? '✓ Done' : s === 'cancelled' ? '✕ Skip' : '↻ Moved'}
                    </button>
                  ))}
                </div>
                <button onClick={submitAttendance} className="w-full py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02] text-green" style={{ background: 'rgba(61,237,122,0.15)', border: '1px solid rgba(61,237,122,0.3)' }}>Log Attendance</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-[999] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
        style={{
          background: isOpen
            ? 'rgba(255,255,255,0.15)'
            : 'linear-gradient(135deg, #FF6B9D 0%, #8B5CF6 100%)',
          boxShadow: isOpen
            ? '0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(255,107,157,0.5), 0 0 0 4px rgba(255,107,157,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
        title="Quick Add"
      >
        <Plus
          size={26}
          className={`text-white transition-transform duration-200 ${isOpen ? 'rotate-45' : 'rotate-0'}`}
          strokeWidth={2.5}
        />
      </button>
    </>
  );
}
