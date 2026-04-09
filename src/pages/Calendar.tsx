import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import SubjectBadge from '../components/SubjectBadge';
import Modal from '../components/Modal';
import ColorPicker from '../components/ColorPicker';
import ConfirmModal from '../components/ConfirmModal';

export default function Calendar() {
  const { state, dispatch } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [evName, setEvName] = useState('');
  const [evType, setEvType] = useState<string>('School Class');
  const [evSub, setEvSub] = useState('');
  const [evDate, setEvDate] = useState(format(selectedDate, 'yyyy-MM-dd'));
  const [evStartTime, setEvStartTime] = useState('');
  const [evEndTime, setEvEndTime] = useState('');
  const [evColor, setEvColor] = useState('#8A8070');

  // Helper to convert 24h to 12h AM/PM
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    if (!h || !m) return timeStr;
    const hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const num12 = hours % 12 || 12;
    return `${num12}:${m} ${ampm}`;
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); 
  
  const endDate = new Date(monthEnd);
  if (endDate.getDay() !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); 
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayEvents = (day: Date) => state.calendarEvents.filter(e => isSameDay(new Date(e.date), day));
  const getDayExams = (day: Date) => state.exams.filter(e => isSameDay(new Date(e.date), day));

  const selectedDayEvents = getDayEvents(selectedDate);
  const selectedDayExams = getDayExams(selectedDate);

  // Homework due on selected day
  const selectedDayHw = (state.homework || []).filter(h =>
    h.dueDate && isSameDay(new Date(h.dueDate), selectedDate)
  );

  // Online classes scheduled for selected day
  const WEEKDAY_JS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const selectedDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][selectedDate.getDay()];
  const selectedDayOnlineClasses = (state.subjects || [])
    .filter(s => s.onlineClass && Array.isArray(s.classSchedule) && s.classSchedule.some(e => e.day === selectedDayName))
    .map(s => ({ subject: s, entry: s.classSchedule!.find(e => e.day === selectedDayName)! }));

  const handleAddEvent = () => {
    if (!evName.trim()) return;
    dispatch({
      type: 'ADD_EVENT',
      payload: {
        id: `evt-${Date.now()}`,
        title: evName,
        type: evType,
        date: new Date(evDate),
        subjectId: evType !== 'personal-note' ? (evSub || undefined) : undefined,
        color: evType === 'personal-note' ? evColor : undefined,
        startTime: evStartTime || undefined,
        endTime: evEndTime || undefined,
      }
    });
    setEvName('');
    setEvStartTime('');
    setEvEndTime('');
    setIsAddEventOpen(false);
  };

  const handleDeleteEvent = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmDeleteId(id);
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col xl:flex-row gap-8">
      
      {/* Calendar Grid (70%) */}
      <div className="flex-[7] bg-bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col min-h-0 shadow-sm relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="text-accent" size={28} />
            {format(currentDate, 'MMMM yyyy')}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-bg p-1.5 rounded-xl border border-border">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-bg-raised rounded-lg hover:text-white transition-colors"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-bg-raised rounded-lg hover:text-white transition-colors"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-[1px] bg-border xl:flex-1 rounded-xl overflow-hidden shadow-inner auto-rows-fr h-[500px] xl:h-auto">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-bg-raised p-2 sm:p-3 text-center text-[10px] sm:text-xs font-black text-text-muted uppercase tracking-widest border-b border-border">
              {day}
            </div>
          ))}

          {/* Cells */}
          {days.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            const evs = getDayEvents(day);
            const exs = getDayExams(day);

            return (
              <div 
                key={i} 
                onClick={() => { setSelectedDate(day); setEvDate(format(day, 'yyyy-MM-dd')) }}
                className={`bg-bg-card p-2 sm:p-3 cursor-pointer transition-colors relative hover:bg-bg overflow-hidden flex flex-col gap-1 ${
                  !isCurrentMonth ? 'opacity-30 pointer-events-none' : ''
                } ${isSelected ? 'ring-2 ring-accent ring-inset z-10' : ''} ${isToday ? 'bg-accent/5' : ''}`}
              >
                <div className={`text-sm font-bold mb-1 ${isToday ? 'text-accent bg-accent/20 w-7 h-7 flex items-center justify-center rounded-full -mt-1 -ml-1' : 'text-text-muted'}`}>
                  {format(day, 'd')}
                </div>
                
                {/* Event Indicators */}
                <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                  {exs.map(ex => (
                    <div key={ex.id} className="text-[10px] sm:text-xs font-bold bg-gold/10 text-gold px-1.5 py-0.5 rounded truncate" title="Exam">⭐ {ex.name}</div>
                  ))}
                  {evs.map(ev => {
                    const sub = state.subjects.find(s => s.id === ev.subjectId);
                    const col = ev.color || sub?.colour || '#8A8070';
                    // Unified pill style for all event types
                    return (
                      <div
                        key={ev.id}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate leading-tight"
                        style={{ backgroundColor: `${col}25`, color: col, borderLeft: `2px solid ${col}` }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Panel (30%) */}
      <div className="flex-[3] bg-bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col h-full overflow-hidden shadow-sm relative">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 tracking-tight flex items-center justify-between border-b border-border pb-4">
          {format(selectedDate, 'EEEE, d MMM')}
          {isSameDay(selectedDate, new Date()) && <span className="text-[10px] font-black uppercase tracking-widest bg-accent text-white px-2 py-1 rounded-md">Today</span>}
        </h2>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
          {selectedDayExams.length === 0 && selectedDayEvents.length === 0 && selectedDayHw.length === 0 && selectedDayOnlineClasses.length === 0 && (
            <div className="text-text-muted text-sm text-center py-16 border border-dashed border-border rounded-xl">Nothing scheduled.</div>
          )}

          {/* Online Classes */}
          {selectedDayOnlineClasses.map(({ subject, entry }) => (
            <div key={subject.id} className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: `${subject.colour}12`, border: `1px solid ${subject.colour}30` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${subject.colour}20` }}>
                <span className="text-xs font-black" style={{ color: subject.colour }}>🎓</span>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest mb-0.5 text-text-muted">Online Class</div>
                <div className="font-bold text-white text-sm">{subject.name}</div>
                <div className="text-xs text-text-muted">{entry.time}</div>
              </div>
            </div>
          ))}

          {/* Homework */}
          {selectedDayHw.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Homework due</div>
              {selectedDayHw.map(hw => {
                const sub = state.subjects.find(s => s.id === hw.subjectId);
                return (
                  <div key={hw.id} className={`flex items-center gap-2.5 p-3 rounded-xl ${hw.done ? 'opacity-50' : ''}`}
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center border-2 ${hw.done ? 'bg-green border-green' : 'border-gold'}`}>
                      {hw.done && <span className="text-white text-[8px]">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold ${hw.done ? 'line-through text-text-muted' : 'text-white'}`}>{hw.title}</div>
                      {sub && <div className="text-[10px] text-text-muted">{sub.name}</div>}
                    </div>
                    {hw.urgent && !hw.done && <span className="text-[9px] font-black text-coral px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,107,107,0.12)' }}>URGENT</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Render Exams */}
          {selectedDayExams.map(ex => {
            const sub = state.subjects.find(s => s.id === ex.subjectId);
            return (
               <div key={ex.id} className="bg-gold/10 border border-gold/30 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:scale-[1.02] transition-transform">
                 <div className="text-3xl pt-1">⭐</div>
                 <div className="flex-1 min-w-0">
                   <div className="font-black text-gold text-[10px] uppercase tracking-widest mb-1">{ex.type.replace('-', ' ')}</div>
                   <div className="text-white font-bold text-lg leading-tight truncate">{ex.name}</div>
                   {sub && <SubjectBadge color={sub.colour} name={sub.name} className="mt-2.5 text-[10px]" />}
                 </div>
               </div>
            )
          })}

          {/* Render Events */}
          {selectedDayEvents.map(ev => {
            const sub = state.subjects.find(s => s.id === ev.subjectId);
            const col = ev.color || sub?.colour || '#8A8070';


            return (
              <div key={ev.id} className={`bg-bg-raised border border-border rounded-xl p-4 border-l-4 group relative shadow-sm hover:bg-bg`} style={{ borderLeftColor: col }}>
                 <button onClick={(e) => handleDeleteEvent(ev.id, e)} className="absolute top-3 right-3 opacity-100 transition-opacity text-text-muted hover:text-coral bg-bg-card p-1.5 rounded-md border border-border shadow-sm">
                   <X size={14} />
                 </button>

                 <div className="text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: col }}>
                   {ev.type === 'school-class' ? '● Class' : ev.type === 'online-tuition' ? '○ Online' : ev.type === 'project-deadline' ? '📌 Project' : '✏️ Note'}
                 </div>
                 <div className="text-white font-bold text-base pr-6">{ev.title}</div>
                 {ev.startTime && <div className="text-xs font-medium text-text-muted mt-2 bg-bg px-2 py-1 rounded w-fit border border-border">{formatTime(ev.startTime)} - {formatTime(ev.endTime)}</div>}
              </div>
            )
          })}
        </div>

        <button 
          onClick={() => {
             setEvType('school-class');
             setEvDate(format(selectedDate, 'yyyy-MM-dd'));
             setIsAddEventOpen(true);
          }}
          className="w-full mt-6 bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-bold shadow-xl shadow-accent/20 transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Event
        </button>
      </div>

      {/* Add Event Modal */}
      <Modal isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)} title="Add Event">
        <div className="space-y-5 pt-2">
          <div>
            <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Event Name</label>
            <input value={evName} onChange={e => setEvName(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent font-bold transition-colors" placeholder="e.g. Science Fair Presentation" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Type</label>
              <select value={evType} onChange={e => setEvType(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white capitalize outline-none focus:border-accent font-bold transition-colors">
                {(state.eventTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Subject</label>
              <select value={evSub} disabled={evType === 'personal-note'} onChange={e => setEvSub(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white outline-none focus:border-accent font-bold disabled:opacity-30 transition-colors">
                <option value="">None</option>
                {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Date</label>
            <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent font-mono font-bold transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Start Time</label>
              <input type="time" value={evStartTime} onChange={e => {
                const val = e.target.value;
                setEvStartTime(val);
                if (val) {
                  const [h, m] = val.split(':').map(Number);
                  const total = h * 60 + m + 60;
                  const eh = Math.floor(total / 60) % 24;
                  const em = total % 60;
                  setEvEndTime(`${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`);
                }
              }} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent font-mono font-bold transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">End Time</label>
              <input type="time" value={evEndTime} onChange={e => setEvEndTime(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent font-mono font-bold transition-colors" />
            </div>
          </div>
          
          {evType === 'personal-note' && (
            <div>
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Color Override</label>
              <div className="flex items-center gap-4 bg-bg border border-border p-2 rounded-xl">
                 <button onClick={() => setIsColorPickerOpen(true)} className="w-10 h-10 rounded-lg border-2 border-bg-card shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: evColor }} />
                 <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">{evColor}</span>
                 <div className="flex-1 text-right text-[10px] text-text-muted uppercase font-bold pr-2">Click to edit</div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <button onClick={handleAddEvent} className="w-full bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-bold shadow-xl shadow-accent/20 transition-transform hover:scale-[1.02] text-lg">Save Event</button>
          </div>
        </div>
      </Modal>

      {/* Auxiliary Modals */}
      {isColorPickerOpen && <ColorPicker color={evColor} onChange={setEvColor} onClose={() => setIsColorPickerOpen(false)} />}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Event"
        description="Remove this event from your calendar?"
        onConfirm={() => { if (confirmDeleteId) dispatch({ type: 'DELETE_EVENT', payload: confirmDeleteId }); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
