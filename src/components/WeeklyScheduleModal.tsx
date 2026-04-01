import { useState } from 'react';
import Modal from './Modal';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyScheduleModal({ isOpen, onClose }: Props) {
  const { state, dispatch } = useAppContext();
  const [subId, setSubId] = useState('');
  const [type, setType] = useState('school-class');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [numberOfWeeks, setNumberOfWeeks] = useState(12);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const toggleDay = (d: string) => {
    if (selectedDays.includes(d)) setSelectedDays(selectedDays.filter(day => day !== d));
    else setSelectedDays([...selectedDays, d]);
  };

  const handleSave = () => {
    if (!subId || selectedDays.length === 0) return;

    const newEvents: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    const sub = state.subjects.find(s => s.id === subId);

    for (let week = 0; week < numberOfWeeks; week++) {
      for (const dayStr of selectedDays) {
        const targetDay = dayMap[dayStr];
        const date = new Date(today);
        const currentDay = date.getDay();
        const offset = (targetDay + 7 - currentDay) % 7;
        date.setDate(date.getDate() + offset + (week * 7));

        newEvents.push({
          id: `ws-${Date.now()}-${Math.random()}`,
          title: sub ? `${sub.name} Class` : 'Class',
          type: type as any,
          subjectId: subId,
          date: new Date(date),
          startTime,
          endTime
        });
      }
    }

    dispatch({ type: 'ADD_EVENTS', payload: newEvents });
    setSuccessCount(newEvents.length);
  };

  const handleClose = () => {
    setSuccessCount(null);
    setSelectedDays([]);
    setSubId('');
    onClose();
  };

  // Event types from config (map them to readable labels)
  const eventTypeOptions = [
    { value: 'school-class', label: 'School Class' },
    { value: 'online-tuition', label: 'Online Tuition' },
    { value: 'self-study', label: 'Self-Study' },
    { value: 'project-deadline', label: 'Project/Activity' },
    { value: 'personal-note', label: 'Personal Block' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Setup Weekly Schedule">
      {successCount !== null ? (
        // Success State
        <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
          <div className="w-20 h-20 rounded-full bg-green/10 border-2 border-green flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white mb-2">Schedule Created!</h3>
            <p className="text-text-muted text-sm">
              Successfully generated <span className="text-white font-bold">{successCount} events</span> for the next <span className="text-white font-bold">{numberOfWeeks} weeks</span>.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="bg-green text-black font-bold px-8 py-3 rounded-xl hover:bg-green/80 transition-colors shadow-lg shadow-green/20"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Subject</label>
            <select value={subId} onChange={e => setSubId(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent">
              <option value="" disabled>Select a subject...</option>
              {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Class Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent">
              {eventTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Start Time</label>
              <input type="time" value={startTime} onChange={e => {
                const val = e.target.value;
                setStartTime(val);
                if (val) {
                  const [h, m] = val.split(':').map(Number);
                  const total = h * 60 + m + 60;
                  const eh = Math.floor(total / 60) % 24;
                  const em = total % 60;
                  setEndTime(`${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`);
                }
              }} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Days of Week</label>
            <div className="flex gap-1.5 justify-between">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${selectedDays.includes(day) ? 'bg-accent text-white hover:scale-105 shadow-md' : 'bg-bg border border-border text-text-muted hover:text-white hover:border-text-muted'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">
              Repeat for (weeks)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={52}
                value={numberOfWeeks}
                onChange={e => setNumberOfWeeks(Math.max(1, Math.min(52, Number(e.target.value))))}
                className="w-24 bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent font-mono"
              />
              <span className="text-sm text-text-muted font-bold">weeks ({Math.round(numberOfWeeks / 4)} months)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={!subId || selectedDays.length === 0}
              className="w-full bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-bold shadow-xl shadow-accent/20 transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
            >
              Generate {numberOfWeeks}-Week Schedule ({selectedDays.length > 0 ? selectedDays.length * numberOfWeeks : '?'} events)
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
