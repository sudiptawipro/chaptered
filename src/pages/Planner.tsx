import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { differenceInDays, eachDayOfInterval, format } from 'date-fns';
import { CheckCircle2, Circle, Smile, Meh, Frown } from 'lucide-react';
import SubjectBadge from '../components/SubjectBadge';
import CountdownChip from '../components/CountdownChip';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import ColorPicker from '../components/ColorPicker';

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 5 AM to 11 PM
const ROW_HEIGHT = 70;

// Specific color per block category — shown on buttons and in event blocks
const BLOCK_TYPE_COLORS: Record<string, string> = {
  'Study':    '#FF6B9D',
  'Homework': '#FBBF24',
  'Revision': '#8B5CF6',
  'Break':    '#3DED7A',
  'Exercise': '#67E8F9',
  'Other':    '#8A8070',
};


export default function Planner() {
  const { state, dispatch } = useAppContext();
  const today = new Date();

  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [blockTitle, setBlockTitle] = useState('');
  const [blockSubject, setBlockSubject] = useState('');
  const [blockStart, setBlockStart] = useState('16:00');
  const [blockEnd, setBlockEnd] = useState('17:00');
  const [blockStartDate, setBlockStartDate] = useState(format(today, 'yyyy-MM-dd'));
  const [blockEndDate, setBlockEndDate] = useState(format(today, 'yyyy-MM-dd'));
  const [blockType, setBlockType] = useState(state.blockTypes?.[0] || 'Study');
  const [blockColor, setBlockColor] = useState('#FF6B9D');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Confirm modal for deleting events
  const [confirmState, setConfirmState] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

  // Drag Drop state
  const [draggedEvent, setDraggedEvent] = useState<any>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0); // px from block top where user grabbed

  // Live current time line
  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const mins = now.getMinutes();
      // 5 AM = 0, 11 PM = 18 (18 hour blocks)
      const ratio = (hours - 5 + mins / 60) / HOURS.length;
      setCurrentTimeRatio(Math.max(0, Math.min(1, ratio)));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayEvents = state.calendarEvents.filter(e => new Date(e.date).toDateString() === today.toDateString() && e.startTime && e.endTime);
  const todayHw = state.homework.filter(h => new Date(h.dueDate).toDateString() === today.toDateString());
  const upcomingExams = state.exams.filter(e => new Date(e.date) >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const overlappingEvents = useMemo(() => {
    const sorted = [...todayEvents].sort((a, b) => a.startTime!.localeCompare(b.startTime!));
    const columns: typeof sorted[] = [];
    const positionedEvents = sorted.map(ev => {
      let colIndex = 0;
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const overlaps = columns[i].some(existingEv =>
          (ev.startTime! < existingEv.endTime! && ev.endTime! > existingEv.startTime!)
        );
        if (!overlaps) { columns[i].push(ev); colIndex = i; placed = true; break; }
      }
      if (!placed) { columns.push([ev]); colIndex = columns.length - 1; }
      return { ...ev, colIndex, totalCols: 0 };
    });
    return positionedEvents.map(e => ({ ...e, totalCols: columns.length }));
  }, [todayEvents]);

  const getPositionStyles = (startTime: string, endTime: string, colIndex: number, totalCols: number) => {
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    if (sH < 5 || eH > 23) return { display: 'none' };
    const top = ((sH - 5) + sM / 60) * ROW_HEIGHT;
    const durationHours = (eH - sH) + (eM - sM) / 60;
    const height = Math.max(durationHours * ROW_HEIGHT, 30);
    const widthPercent = totalCols > 0 ? 100 / totalCols : 100;
    const leftPercent = totalCols > 0 ? colIndex * (100 / totalCols) : 0;
    return {
      top: `${top}px`,
      height: `${height}px`,
      width: `calc(${widthPercent}% - 6px)`,
      left: `calc(${leftPercent}% + 2px)`
    };
  };

  const handleAddBlock = () => {
    if (!blockTitle || !blockStart || !blockEnd || !blockStartDate || !blockEndDate) return;
    const startD = new Date(blockStartDate);
    const endD = new Date(blockEndDate);
    if (endD < startD) return;

    const days = eachDayOfInterval({ start: startD, end: endD });
    const newEvents = days.map(d => ({
      id: `ev-${Date.now()}-${Math.random()}`,
      title: blockTitle,
      type: blockType,
      date: d,
      startTime: blockStart,
      endTime: blockEnd,
      subjectId: blockSubject || undefined,
      color: blockColor || '#6B7280',
    }));

    dispatch({ type: 'ADD_EVENTS', payload: newEvents });
    setIsAddBlockOpen(false);
    setBlockTitle('');
    setBlockStartDate(format(today, 'yyyy-MM-dd'));
    setBlockEndDate(format(today, 'yyyy-MM-dd'));
  };

  const handleDeleteEvent = (id: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });
    setConfirmState({ open: false, id: '' });
  };

  const handleMood = (mood: 'happy' | 'neutral' | 'stressed') => {
    dispatch({ type: 'LOG_MOOD', payload: { date: today, mood } });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-hidden pb-8">

      {/* Left Timeline (60%) */}
      <div className="lg:flex-[6] bg-bg-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm relative">
        <div className="p-5 flex justify-between items-center z-10 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Daily Planner</div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {today.toLocaleDateString('en-US', { weekday: 'long' })}
              <span className="text-text-muted font-medium ml-2 text-base">
                {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
            </h1>
          </div>
          <button
            onClick={() => setIsAddBlockOpen(true)}
            className="bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl font-bold transition-transform hover:scale-105 text-sm shadow-lg shadow-accent/25 flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Add Block
          </button>
        </div>

        <div className="flex-1 overflow-y-auto relative no-scrollbar pb-[100px]">
          <div className="relative mt-4" style={{ height: `${HOURS.length * ROW_HEIGHT}px` }}>
            {/* Grid Lines */}
            {HOURS.map((hour, idx) => (
              <div
                key={hour}
                className="absolute w-full border-b border-border flex items-start"
                style={{ top: `${idx * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
              >
                <div className="w-16 flex-shrink-0 text-right pr-4 text-[10px] uppercase font-black tracking-widest text-text-muted pt-2 shrink-0 opacity-70">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </div>
                <div
                  className="flex-1 h-full border-l border-border hover:bg-bg-raised transition-colors cursor-pointer group relative"
                  onClick={() => {
                    setBlockStart(`${hour.toString().padStart(2, '0')}:00`);
                    setBlockEnd(`${(hour + 1).toString().padStart(2, '0')}:00`);
                    setIsAddBlockOpen(true);
                  }}
                >
                  <span className="hidden group-hover:block absolute top-1/2 left-4 -translate-y-1/2 text-xs font-bold text-accent/50 bg-accent/10 px-2 py-1 rounded">Click to add</span>
                </div>
              </div>
            ))}

            {/* Event Blocks Container */}
            <div 
              className="absolute top-0 left-[65px] right-4 bottom-0"
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={e => {
                e.preventDefault();
                if (!draggedEvent) return;
                
                const rect = e.currentTarget.getBoundingClientRect();
                // Subtract dragOffsetY so the block's top aligns under cursor, not block's centre
                const y = e.clientY - rect.top - dragOffsetY;

                // Snap to nearest 15 mins (0.25 hours)
                const hoursFrom5AM = Math.max(0, y / ROW_HEIGHT);
                const snappedHours = Math.round(hoursFrom5AM * 4) / 4;
                const totalMinsStart = (5 + snappedHours) * 60;
                
                const origStartMins = parseInt(draggedEvent.startTime.split(':')[0])*60 + parseInt(draggedEvent.startTime.split(':')[1]);
                const origEndMins = parseInt(draggedEvent.endTime.split(':')[0])*60 + parseInt(draggedEvent.endTime.split(':')[1]);
                const duration = origEndMins - origStartMins;
                
                const newStartMins = totalMinsStart;
                const newEndMins = newStartMins + duration;
                
                // Ensure it doesn't cross midnight
                if (newEndMins > 24 * 60) return;
                
                const formatTime = (totalM: number) => {
                   const h = Math.floor(totalM / 60);
                   const m = Math.round(totalM % 60);
                   return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                };
                
                dispatch({
                   type: 'EDIT_EVENT',
                   payload: { ...draggedEvent, startTime: formatTime(newStartMins), endTime: formatTime(newEndMins) }
                });
                setDraggedEvent(null);
              }}
            >
              {overlappingEvents.map(event => {
                const sub = event.subjectId ? state.subjects.find(s => s.id === event.subjectId) : null;
                const pos = getPositionStyles(event.startTime!, event.endTime!, event.colIndex, event.totalCols);
                let borderColor = event.color || sub?.colour || '#6B7280';
                let bgColor = `${borderColor}20`;

                return (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      const blockRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setDragOffsetY(e.clientY - blockRect.top);
                      setDraggedEvent(event);
                    }}
                    onDragEnd={() => setDraggedEvent(null)}
                    className={`absolute rounded-xl p-2.5 sm:p-3 pointer-events-auto backdrop-blur-md overflow-hidden hover:opacity-95 hover:z-50 cursor-move shadow-sm group border ${draggedEvent?.id === event.id ? 'opacity-50 blur-sm scale-95' : 'transition-transform'}`}
                    style={{ ...pos, backgroundColor: bgColor, borderColor: borderColor, borderLeftWidth: '5px' }}
                    title={event.title}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmState({ open: true, id: event.id }); }}
                      className="absolute top-1.5 right-1.5 text-coral hover:bg-coral/20 p-1 rounded transition-all bg-bg/80 border border-border/50 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                    <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate mb-0.5" style={{ color: borderColor }}>
                      {sub?.name || event.type}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate leading-tight pr-6">{event.title}</div>
                    <div className="text-[10px] text-text font-medium mt-1 truncate opacity-70 bg-black/20 w-fit px-1.5 py-0.5 rounded">{event.startTime} - {event.endTime}</div>
                  </div>
                );
              })}
            </div>

            {/* Live Current Time Line */}
            <div
              className="absolute left-[65px] right-0 border-t-2 border-accent z-20 pointer-events-none flex items-center"
              style={{ top: `${currentTimeRatio * HOURS.length * ROW_HEIGHT}px` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_rgba(255,107,157,1)] absolute -left-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel (40%) */}
      <div className="lg:flex-[4] flex flex-col gap-6 overflow-y-auto no-scrollbar">

        {/* Today's Homework */}
        <div className="bg-bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-white mb-5 tracking-tight flex items-center justify-between">
            Today's Homework
            <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-md font-black">{todayHw.filter(h => !h.done).length} LEFT</span>
          </h2>
          <div className="space-y-4">
            {todayHw.length === 0 && (
              <div className="text-sm text-text-muted text-center py-6 border border-dashed border-border rounded-xl">No homework due today! 🎉</div>
            )}
            {todayHw.map(hw => {
              const sub = state.subjects.find(s => s.id === hw.subjectId);
              return (
                <div key={hw.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${hw.done ? 'bg-bg/50 border-border/50 opacity-60' : 'bg-bg-raised border-border hover:border-text-muted/30 shadow-sm'}`}
                  style={{ borderLeftWidth: '4px', borderLeftColor: sub?.colour || '#8A8070' }}
                >
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_HOMEWORK', payload: hw.id })}
                    className={`mt-0.5 transition-transform hover:scale-110 ${hw.done ? 'text-green' : 'text-text-muted hover:text-accent'}`}
                  >
                    {hw.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className={`text-[15px] font-bold truncate transition-colors ${hw.done ? 'line-through text-text-muted' : 'text-white'}`}>{hw.title}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <SubjectBadge color={sub?.colour || '#8A8070'} name={sub?.name} className="text-[10px]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">Upcoming Exams</h2>
          <div className="space-y-3">
            {upcomingExams.length === 0 && <p className="text-sm text-text-muted text-center py-4 border border-dashed border-border rounded-xl">No upcoming exams.</p>}
            {upcomingExams.slice(0, 3).map(exam => {
              const sub = state.subjects.find(s => s.id === exam.subjectId);
              const days = Math.ceil(differenceInDays(new Date(exam.date), today));
              return (
                <div key={exam.id} className="p-4 bg-bg-raised rounded-xl border border-border flex items-center justify-between shadow-sm group hover:border-text-muted/30 transition-colors"
                  style={{ borderLeftWidth: '4px', borderLeftColor: sub?.colour || '#8A8070' }}
                >
                  <div className="min-w-0 pr-4">
                    <div className="text-base font-bold text-white truncate group-hover:text-accent transition-colors">{exam.name}</div>
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1.5 flex items-center gap-2">
                      <span>{exam.type.replace('-', ' ')}</span>
                      {sub && <><span className="w-1 h-1 rounded-full bg-border" /><span style={{ color: sub.colour }}>{sub.name}</span></>}
                    </div>
                  </div>
                  <CountdownChip days={days} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Mood Check-in */}
        <div className="bg-bg-card rounded-2xl border border-border p-6 text-center mt-auto shadow-sm">
          <h2 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-5">How are you feeling today?</h2>
          <div className="flex justify-center gap-8">
            <button onClick={() => handleMood('happy')} className="hover:scale-125 transition-transform"><Smile className="text-green" size={38} /></button>
            <button onClick={() => handleMood('neutral')} className="hover:scale-125 transition-transform"><Meh className="text-gold" size={38} /></button>
            <button onClick={() => handleMood('stressed')} className="hover:scale-125 transition-transform"><Frown className="text-coral" size={38} /></button>
          </div>
        </div>
      </div>

      {/* Add Time Block Modal */}
      <Modal isOpen={isAddBlockOpen} onClose={() => setIsAddBlockOpen(false)} title="Add Time Block">
        <div className="space-y-5 pt-2">
          <div>
            <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Title</label>
            <input value={blockTitle} onChange={e => setBlockTitle(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors" placeholder="e.g. Physics Revision, Afternoon Nap..." />
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Block Type <span className="text-text-muted/50 normal-case font-normal tracking-normal">(clicking auto-fills title)</span></label>
            <div className="grid grid-cols-3 gap-2">
              {(state.blockTypes || []).map(type => {
                const typeColor = BLOCK_TYPE_COLORS[type] || '#8A8070';
                const isActive = blockType === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setBlockType(type);
                      // Auto-fill color for the block
                      setBlockColor(typeColor);
                      // Prepopulate title if empty or was previously the old type name
                      if (!blockTitle || blockTitle === blockType) setBlockTitle(type);
                    }}
                    className="py-2.5 px-3 rounded-xl text-sm font-bold transition-all text-left flex items-center gap-2"
                    style={isActive
                      ? { background: `${typeColor}18`, border: `2px solid ${typeColor}`, color: typeColor, boxShadow: `0 0 12px ${typeColor}30` }
                      : { background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }
                    }
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: typeColor }} />
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Subject (Optional)</label>
            <select value={blockSubject} onChange={e => setBlockSubject(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors">
              <option value="">None / Custom</option>
              {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Start Date</label>
              <input type="date" value={blockStartDate} onChange={e => setBlockStartDate(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent font-mono" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">End Date</label>
              <input type="date" value={blockEndDate} onChange={e => setBlockEndDate(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent font-mono" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Start Time</label>
              <input type="time" value={blockStart} onChange={e => setBlockStart(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent font-mono" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">End Time</label>
              <input type="time" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent font-mono" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Block Color</label>
            <div className="flex items-center gap-3 bg-bg border border-border p-2.5 rounded-xl">
              <button
                onClick={() => setIsColorPickerOpen(true)}
                className="w-10 h-10 rounded-xl border-2 border-bg-card hover:scale-110 transition-transform shadow-sm"
                style={{ backgroundColor: blockColor }}
              />
              <span className="text-xs font-mono font-bold text-text-muted uppercase">{blockColor}</span>
              <span className="text-[10px] text-text-muted ml-auto">Click to customize</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <button onClick={handleAddBlock} className="w-full bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-bold shadow-xl shadow-accent/20 transition-transform hover:scale-[1.02] text-lg">Add Time Block</button>
          </div>
        </div>
      </Modal>

      {/* Color Picker */}
      {isColorPickerOpen && <ColorPicker color={blockColor} onChange={setBlockColor} onClose={() => setIsColorPickerOpen(false)} />}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.open}
        title="Remove Time Block"
        description="Are you sure you want to remove this block from your planner?"
        onConfirm={() => handleDeleteEvent(confirmState.id)}
        onCancel={() => setConfirmState({ open: false, id: '' })}
      />
    </div>
  );
}
