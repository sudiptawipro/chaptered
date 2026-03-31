import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import type { HomeworkItem } from '../context/AppContext';
import { format, differenceInDays, isSameDay, addDays, startOfWeek, endOfWeek, isWithinInterval, addWeeks, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { CheckCircle2, Circle, Plus, BookOpen, Clock, Trash2, Edit2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import ConfettiBurst from '../components/ConfettiBurst';
import { playSound } from '../hooks/useSound';
import { useToast } from '../components/Toast';

interface Burst { id: number; x: number; y: number; }

export default function Homework() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'tomorrow' | 'week' | 'next-week' | 'next-month' | 'subject'>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwSub, setHwSub] = useState(state.subjects[0]?.id || '');
  const [hwDate, setHwDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hwPriority, setHwPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Edit modal
  const [editingHw, setEditingHw] = useState<HomeworkItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSub, setEditSub] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Confirm modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const today = new Date();

  const handleToggle = useCallback((hw: HomeworkItem, e: React.MouseEvent) => {
    dispatch({ type: 'TOGGLE_HOMEWORK', payload: hw.id });
    if (!hw.done) {
      // Going from pending → done
      playSound('complete');
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const burst: Burst = { id: Date.now(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      setBursts(prev => [...prev, burst]);
      // Check if all tasks done
      const pendingAfter = state.homework.filter(h => !h.done && h.id !== hw.id).length;
      if (pendingAfter === 0) {
        setTimeout(() => { playSound('success'); toast('🎉 All tasks done!', 'success'); }, 300);
      }
    }
  }, [dispatch, state.homework, toast]);

  const safeDate = (d: any): Date => {
    if (d instanceof Date && !isNaN(d.getTime())) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? today : parsed;
  };

  let filteredHw = state.homework;

  if (filter === 'today') {
    filteredHw = filteredHw.filter(h => isSameDay(safeDate(h.dueDate), today));
  } else if (filter === 'tomorrow') {
    const tmrw = addDays(today, 1);
    filteredHw = filteredHw.filter(h => isSameDay(safeDate(h.dueDate), tmrw));
  } else if (filter === 'week') {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    filteredHw = filteredHw.filter(h => isWithinInterval(safeDate(h.dueDate), { start, end }));
  } else if (filter === 'next-week') {
    const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    filteredHw = filteredHw.filter(h => isWithinInterval(safeDate(h.dueDate), { start: nextWeekStart, end: nextWeekEnd }));
  } else if (filter === 'next-month') {
    const nextMonthStart = startOfMonth(addMonths(today, 1));
    const nextMonthEnd = endOfMonth(addMonths(today, 1));
    filteredHw = filteredHw.filter(h => isWithinInterval(safeDate(h.dueDate), { start: nextMonthStart, end: nextMonthEnd }));
  } else if (filter === 'subject' && selectedSubjectId) {
    filteredHw = filteredHw.filter(h => h.subjectId === selectedSubjectId);
  }

  const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
  filteredHw = [...filteredHw].sort((a, b) => {
    const pA = a.priority ? priorityWeight[a.priority as keyof typeof priorityWeight] : 0;
    const pB = b.priority ? priorityWeight[b.priority as keyof typeof priorityWeight] : 0;
    if (pA !== pB) return pB - pA;
    return safeDate(a.dueDate).getTime() - safeDate(b.dueDate).getTime();
  });

  const pendingHw = filteredHw.filter(h => !h.done);
  const completedHw = filteredHw.filter(h => h.done);

  const handleAddHw = () => {
    if (!hwTitle.trim() || !hwSub || !hwDate) return;
    dispatch({
      type: 'ADD_HOMEWORK',
      payload: {
        id: `hw-${Date.now()}`,
        subjectId: hwSub,
        title: hwTitle,
        dueDate: new Date(hwDate),
        done: false,
        urgent: false,
        priority: hwPriority,
      }
    });
    playSound('save');
    toast('Task added!', 'success');
    setHwTitle(''); setIsAddOpen(false);
  };

  const openEdit = (hw: HomeworkItem) => {
    setEditingHw(hw);
    setEditTitle(hw.title);
    setEditSub(hw.subjectId);
    setEditDate(format(safeDate(hw.dueDate), 'yyyy-MM-dd'));
    setEditPriority(hw.priority || 'Medium');
  };

  const handleSaveEdit = () => {
    if (!editingHw || !editTitle.trim()) return;
    dispatch({
      type: 'EDIT_HOMEWORK',
      payload: { ...editingHw, title: editTitle, subjectId: editSub, dueDate: new Date(editDate), priority: editPriority }
    });
    setEditingHw(null);
  };

  const handleQuickDate = (daysCount: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysCount);
    setHwDate(format(target, 'yyyy-MM-dd'));
  };

  const getUrgencyChip = (rawDueDate: any, isDone: boolean, priority?: string) => {
    if (isDone) return null;
    const dueDate = safeDate(rawDueDate);
    const days = differenceInDays(dueDate, today);
    const prioColor = priority === 'High' ? 'text-coral border-coral/30' : priority === 'Medium' ? 'text-gold border-gold/30' : 'text-blue-400 border-blue-400/30';
    let dayText = '';
    let dayBg = '';
    if (days < 0) { dayText = 'OVERDUE'; dayBg = 'bg-coral/20 text-coral'; }
    else if (days === 0) { dayText = 'TODAY'; dayBg = 'bg-coral/20 text-coral'; }
    else if (days === 1) { dayText = 'TOMORROW'; dayBg = 'bg-gold/20 text-gold'; }
    else { dayText = `${days} DAYS`; dayBg = 'bg-bg border border-border text-text-muted'; }

    return (
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-4 hidden sm:flex">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${dayBg}`}>{dayText}</span>
        {priority && (
          <span className={`text-[9px] font-black uppercase tracking-widest border px-1.5 py-0.5 rounded w-fit ${prioColor} bg-bg`}>{priority}</span>
        )}
      </div>
    );
  };

  const FILTERS = [
    { id: 'all', label: 'All Tasks' },
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'week', label: 'This Week' },
    { id: 'next-week', label: 'Next Week' },
    { id: 'next-month', label: 'Next Month' },
    { id: 'subject', label: 'By Subject' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <BookOpen className="text-accent" size={28} />
          Homework
        </h1>
        <button
          onClick={() => { setHwTitle(''); setHwDate(format(today, 'yyyy-MM-dd')); setHwPriority('Medium'); setIsAddOpen(true); }}
          className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl font-bold transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-xl shadow-accent/20"
        >
          <Plus size={18} /> Add Homework
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-bg-card p-2 rounded-xl border border-border mt-4 shadow-sm">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => {
              setFilter(f.id as any);
              if (f.id === 'subject' && !selectedSubjectId) setSelectedSubjectId(state.subjects[0]?.id || null);
            }}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filter === f.id ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-white hover:bg-bg-raised'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'subject' && (
        <div className="flex flex-wrap gap-2 p-4 bg-bg-card border border-border rounded-xl">
          {state.subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSubjectId(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-2 ${selectedSubjectId === s.id ? 'shadow-md scale-105' : 'bg-bg text-text-muted border-transparent hover:border-border'}`}
              style={selectedSubjectId === s.id ? { backgroundColor: `${s.colour}20`, borderColor: s.colour, color: 'white' } : {}}
            >
              <span className="text-base">{s.icon}</span> {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Pending List */}
      <div>
        <h2 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
          Pending Tasks
          <span className="bg-bg-card text-white px-2 py-0.5 rounded border border-border">{pendingHw.length}</span>
        </h2>
        <div className="space-y-3">
          {pendingHw.length === 0 && (
            <div className="p-10 border border-dashed border-border rounded-2xl text-center text-text-muted bg-bg-card flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">🎉</span>
              <p className="font-bold text-white">You're all caught up!</p>
              <p className="text-sm">Enjoy your free time.</p>
            </div>
          )}
          {pendingHw.map(hw => {
            const sub = state.subjects.find(s => s.id === hw.subjectId);
            return (
              <div
                key={hw.id}
                className="bg-bg-card border border-border hover:border-text-muted/30 rounded-xl p-4 transition-all flex items-center gap-4 group shadow-sm hover:shadow-md"
                style={{ borderLeftWidth: '5px', borderLeftColor: sub?.colour || '#8A8070' }}
              >
                <button
                  onClick={(e) => handleToggle(hw, e)}
                  className="text-text-muted hover:text-green transition-transform hover:scale-110 flex-shrink-0"
                >
                  <Circle size={28} strokeWidth={2.5} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate text-lg leading-tight mb-1 pr-4">{hw.title}</div>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {sub && (
                      <span className="bg-bg px-2 py-1 rounded text-text-muted border border-border flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.colour }} />
                        {sub.name}
                      </span>
                    )}
                    <span className="bg-bg px-2 py-1 rounded text-text-muted border border-border flex items-center gap-1.5 sm:hidden">
                      <Clock size={12} /> {format(safeDate(hw.dueDate), 'MMM d')}
                    </span>
                  </div>
                </div>
                {getUrgencyChip(hw.dueDate, hw.done, hw.priority)}
                <button
                  onClick={() => openEdit(hw)}
                  className="p-2 ml-1 text-text-muted hover:text-white hover:bg-bg-raised rounded-lg transition-colors border border-transparent hover:border-border opacity-0 group-hover:opacity-100"
                  title="Edit Task"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(hw.id)}
                  className="p-2 ml-1 text-text-muted hover:text-coral hover:bg-coral/20 rounded-lg transition-colors border border-transparent hover:border-coral/30 opacity-0 group-hover:opacity-100"
                  title="Delete Task"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed List */}
      {completedHw.length > 0 && (
        <div className="mt-12">
          <h2 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            Completed Tasks
            <span className="bg-bg-card text-white px-2 py-0.5 rounded border border-border">{completedHw.length}</span>
          </h2>
          <div className="space-y-2 opacity-50 hover:opacity-100 transition-opacity">
            {completedHw.map(hw => {
              const sub = state.subjects.find(s => s.id === hw.subjectId);
              return (
                <div key={hw.id} className="bg-bg border border-border rounded-xl p-3 flex items-center gap-4 transition-colors hover:bg-bg-raised cursor-pointer"
                  style={{ borderLeftWidth: '4px', borderLeftColor: sub?.colour || '#8A8070' }}
                >
                  <button
                    onClick={(e) => handleToggle(hw, e)}
                    className="text-green hover:scale-110 transition-transform flex-shrink-0"
                  >
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-text-muted font-bold line-through text-base truncate">{hw.title}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 mt-1">{sub?.name} • COMPLETED</div>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteId(hw.id)}
                    className="p-2 ml-1 text-text-muted hover:text-coral hover:bg-coral/20 rounded-lg transition-colors border border-transparent hover:border-coral/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Homework Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Homework">
        <div className="space-y-6 pt-2">
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Subject</label>
            <select value={hwSub} onChange={e => setHwSub(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors">
              <option value="" disabled>Select Subject</option>
              {state.subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Task Description</label>
            <input value={hwTitle} onChange={e => setHwTitle(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors" placeholder="e.g. Complete Exercise 5" />
          </div>
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Due Date</label>
            <div className="flex gap-2 mb-3">
              <button onClick={() => handleQuickDate(0)} className="flex-1 bg-bg hover:bg-bg-raised border border-border text-white text-xs font-bold py-2 rounded-lg transition-colors">Today</button>
              <button onClick={() => handleQuickDate(1)} className="flex-1 bg-bg hover:bg-bg-raised border border-border text-white text-xs font-bold py-2 rounded-lg transition-colors">Tomorrow</button>
              <button onClick={() => handleQuickDate(7)} className="flex-1 bg-bg hover:bg-bg-raised border border-border text-white text-xs font-bold py-2 rounded-lg transition-colors">Next Week</button>
              <button onClick={() => handleQuickDate(30)} className="flex-1 bg-bg hover:bg-bg-raised border border-border text-white text-xs font-bold py-2 rounded-lg transition-colors">Next Month</button>
            </div>
            <input type="date" value={hwDate} onChange={e => setHwDate(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold font-mono outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Priority</label>
            <div className="flex bg-bg p-1 border border-border rounded-xl">
              {['Low', 'Medium', 'High'].map(prio => (
                <button
                  key={prio}
                  onClick={() => setHwPriority(prio as any)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${hwPriority === prio
                    ? (prio === 'High' ? 'bg-coral/20 text-coral border-coral/30 shadow-sm border'
                       : prio === 'Medium' ? 'bg-gold/20 text-gold border-gold/30 shadow-sm border'
                       : 'bg-blue-400/20 text-blue-400 border-blue-400/30 shadow-sm border')
                    : 'border border-transparent text-text-muted hover:text-white'
                  }`}
                >
                  {prio}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <button onClick={handleAddHw} className="w-full bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-bold shadow-xl shadow-accent/20 transition-transform hover:scale-[1.02] text-lg">Add Task</button>
          </div>
        </div>
      </Modal>

      {/* Edit Homework Modal */}
      <Modal isOpen={!!editingHw} onClose={() => setEditingHw(null)} title="Edit Homework">
        <div className="space-y-5 pt-2">
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Subject</label>
            <select value={editSub} onChange={e => setEditSub(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors">
              {state.subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Task</label>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Due Date</label>
            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold font-mono outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Priority</label>
            <div className="flex bg-bg p-1 border border-border rounded-xl">
              {['Low', 'Medium', 'High'].map(prio => (
                <button
                  key={prio}
                  onClick={() => setEditPriority(prio as any)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${editPriority === prio
                    ? (prio === 'High' ? 'bg-coral/20 text-coral border-coral/30 shadow-sm border'
                       : prio === 'Medium' ? 'bg-gold/20 text-gold border-gold/30 shadow-sm border'
                       : 'bg-blue-400/20 text-blue-400 border-blue-400/30 shadow-sm border')
                    : 'border border-transparent text-text-muted hover:text-white'
                  }`}
                >
                  {prio}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <button onClick={handleSaveEdit} className="w-full bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-bold shadow-xl shadow-accent/20 transition-transform hover:scale-[1.02] text-lg">Save Changes</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Task"
        description="Are you sure you want to delete this homework task?"
        onConfirm={() => { if (confirmDeleteId) { dispatch({ type: 'DELETE_HOMEWORK', payload: confirmDeleteId }); playSound('delete'); } setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Confetti bursts */}
      {bursts.map(b => (
        <ConfettiBurst key={b.id} x={b.x} y={b.y} onDone={() => setBursts(prev => prev.filter(p => p.id !== b.id))} />
      ))}
    </div>
  );
}
