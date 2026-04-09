import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronRight, School, Wifi, Brain } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import ColorPicker from '../components/ColorPicker';
import EmojiPicker from '../components/EmojiPicker';
import SubjectIcon from '../components/SubjectIcon';
import type { Subject, WeekDay, ClassScheduleEntry } from '../context/AppContext';

export default function Subjects() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Pickers State
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: '', description: '', onConfirm: () => {}
  });
  const showConfirm = (title: string, description: string, onConfirm: () => void) =>
    setConfirmState({ open: true, title, description, onConfirm });
  const closeConfirm = () => setConfirmState(s => ({ ...s, open: false }));

  // Subject Modal States
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subName, setSubName] = useState('');
  const [subColor, setSubColor] = useState('#3B82F6');
  const [subIcon, setSubIcon] = useState('GraduationCap');
  const [subOnlineClass, setSubOnlineClass] = useState(false);
  const [subSchedule, setSubSchedule] = useState<ClassScheduleEntry[]>([]);
  const [subScheduleStartDate, setSubScheduleStartDate] = useState('');

  const ALL_DAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // If SubjectHub passed editId via navigation state, open that subject for editing
  useEffect(() => {
    const state_nav = location.state as { editId?: string } | null;
    if (state_nav?.editId) {
      const sub = (state.subjects || []).find(s => s.id === state_nav.editId);
      if (sub) openEditSubject(sub);
      // clear navigation state to avoid re-triggering on back navigation
      window.history.replaceState({}, '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDay = (day: WeekDay) => {
    setSubSchedule(prev => {
      const exists = prev.find(e => e.day === day);
      if (exists) return prev.filter(e => e.day !== day);
      const next = [...prev, { day, time: '16:00' }];
      return next.sort((a, b) => ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day));
    });
  };

  const setDayTime = (day: WeekDay, time: string) =>
    setSubSchedule(prev => prev.map(e => e.day === day ? { ...e, time } : e));

  const openAddSubject = () => {
    setEditingSubject(null);
    setSubName('');
    setSubColor('#3B82F6');
    setSubIcon('GraduationCap');
    setSubOnlineClass(false);
    setSubSchedule([]);
    setSubScheduleStartDate('');
    setIsSubjectModalOpen(true);
  };

  const openEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubName(sub.name);
    setSubColor(sub.colour);
    setSubIcon(sub.icon);
    setSubOnlineClass(sub.onlineClass || false);
    setSubSchedule(Array.isArray(sub.classSchedule) ? sub.classSchedule : []);
    setSubScheduleStartDate(
      sub.scheduleStartDate ? new Date(sub.scheduleStartDate).toISOString().split('T')[0] : ''
    );
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = () => {
    if (!subName.trim()) return;
    const scheduleData = subOnlineClass && subSchedule.length > 0
      ? {
          onlineClass: true,
          classSchedule: subSchedule,
          scheduleStartDate: subScheduleStartDate ? new Date(subScheduleStartDate) : undefined,
        }
      : { onlineClass: false, classSchedule: undefined, scheduleStartDate: undefined };

    if (editingSubject) {
      dispatch({
        type: 'EDIT_SUBJECT',
        payload: { ...editingSubject, name: subName, colour: subColor, icon: subIcon, ...scheduleData }
      });
    } else {
      dispatch({
        type: 'ADD_SUBJECT',
        payload: {
          id: `sub-${Date.now()}`,
          name: subName,
          colour: subColor,
          icon: subIcon,
          chapters: [],
          ...scheduleData
        }
      });
    }
    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = (id: string, name: string) => {
    showConfirm(
      'Delete Subject',
      `Are you sure you want to delete "${name}"? All its chapters and data will be permanently lost.`,
      () => dispatch({ type: 'DELETE_SUBJECT', payload: id })
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Subjects</h1>
        <button
          onClick={openAddSubject}
          className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-accent/20"
        >
          <Plus size={18} />
          Add Subject
        </button>
      </div>

      {(state.subjects || []).length === 0 ? (
        <div className="text-center py-24 text-text-muted">
          <div className="text-6xl mb-4 opacity-20">📚</div>
          <p className="font-bold text-lg">No subjects yet</p>
          <p className="text-sm mt-1">Add your first subject to start tracking progress</p>
          <button onClick={openAddSubject} className="mt-6 px-6 py-3 rounded-xl bg-accent text-white font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-transform">
            Add Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(state.subjects || []).map(sub => {
            const chapters = sub.chapters || [];
            const total = chapters.length;
            const schoolPct = total > 0 ? Math.round((chapters.filter(c => c.schoolStatus === 'covered').length / total) * 100) : 0;
            const onlinePct = total > 0 ? Math.round((chapters.filter(c => c.onlineStatus === 'covered').length / total) * 100) : 0;
            const examPct  = total > 0 ? Math.round((chapters.filter(c => c.examStatus === 'confident' || c.examStatus === 'revised').length / total) * 100) : 0;
            // Overall progress = average of exam readiness (primary metric)
            const overallPct = examPct;

            return (
              <div
                key={sub.id}
                className="group border border-border rounded-2xl bg-bg-card overflow-hidden shadow-sm hover:border-text-muted/30 hover:shadow-lg transition-all cursor-pointer flex flex-col"
                onClick={() => navigate(`/subjects/${sub.id}`)}
              >
                {/* Colour strip */}
                <div className="h-1.5 w-full" style={{ backgroundColor: sub.colour }} />

                <div className="p-5 flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: `${sub.colour}20`, border: `1px solid ${sub.colour}40` }}
                      >
                        <SubjectIcon name={sub.icon} size={22} color={sub.colour} />
                      </div>
                      <div>
                        <div className="font-bold text-white text-base">{sub.name}</div>
                        <div className="text-xs text-text-muted mt-0.5">{total} chapter{total !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); openEditSubject(sub); }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteSubject(sub.id, sub.name); }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-coral hover:bg-coral/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {total > 0 ? (
                    <>
                      <ProgressBar progress={overallPct} color={sub.colour} height={6} />

                      {/* Track stats */}
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                        <div className="flex items-center gap-1 text-text-muted">
                          <School size={10} className="text-purple-300 shrink-0" />
                          <span className="font-bold text-white">{schoolPct}%</span>
                          <span>school</span>
                        </div>
                        <div className="flex items-center gap-1 text-text-muted">
                          <Wifi size={10} className="text-sky shrink-0" />
                          <span className="font-bold text-white">{onlinePct}%</span>
                          <span>online</span>
                        </div>
                        <div className="flex items-center gap-1 text-text-muted">
                          <Brain size={10} className="text-green shrink-0" />
                          <span className="font-bold text-white">{examPct}%</span>
                          <span>exam</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-text-muted text-center py-2 opacity-50">No chapters yet — click to add</div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2">
                    {sub.onlineClass && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded text-sky" style={{ background: 'rgba(103,232,249,0.1)', border: '1px solid rgba(103,232,249,0.2)' }}>
                        Online
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-text-muted group-hover:text-white transition-colors">
                    Open Hub <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title={editingSubject ? "Edit Subject" : "Add New Subject"}>
        <div className="space-y-6 pt-2">
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Subject Name</label>
            <input
              type="text"
              value={subName}
              onChange={e => setSubName(e.target.value)}
              className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-accent transition-colors shadow-inner"
              placeholder="e.g. Biology"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-bg rounded-xl p-4 border border-border">
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3 text-center">Colour</label>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => setIsColorPickerOpen(true)}
                  className="w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center font-bold text-white text-xs border-4 border-bg-card"
                  style={{ backgroundColor: subColor, boxShadow: `0 4px 20px ${subColor}60` }}
                />
                <div className="text-xs font-mono font-bold text-text-muted uppercase bg-bg-raised px-2 py-1 rounded">{subColor}</div>
              </div>
            </div>

            <div className="bg-bg rounded-xl p-4 border border-border">
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3 text-center">Icon</label>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => setIsEmojiPickerOpen(true)}
                  className="w-14 h-14 rounded-2xl bg-bg-card border-2 border-border shadow-lg flex items-center justify-center text-3xl hover:border-accent hover:scale-110 transition-all text-white"
                >
                  <SubjectIcon name={subIcon || 'GraduationCap'} size={28} />
                </button>
                <div className="text-[10px] font-bold text-text-muted uppercase text-center mt-1">Tap to change</div>
              </div>
            </div>
          </div>

          {/* Online Class Toggle */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Online Class</div>
                <div className="text-xs text-text-muted">Enable attendance tracking for this subject</div>
              </div>
              <button
                onClick={() => setSubOnlineClass(v => !v)}
                className={`w-12 h-6 rounded-full transition-colors relative ${subOnlineClass ? 'bg-accent' : 'bg-bg-raised border border-border'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${subOnlineClass ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {subOnlineClass && (
              <div className="space-y-4 bg-bg rounded-xl p-4 border border-border">
                {/* Day pills */}
                <div>
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-2 block">Class Days</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {ALL_DAYS.map(day => {
                      const selected = subSchedule.some(e => e.day === day);
                      return (
                        <button
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selected ? 'bg-accent text-white' : 'bg-bg-raised border border-border text-text-muted hover:text-white'}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Per-day time inputs */}
                {subSchedule.length > 0 && (
                  <div>
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-2 block">Class Times</label>
                    <div className="space-y-2">
                      {subSchedule.map(entry => (
                        <div key={entry.day} className="flex items-center gap-3">
                          <span className="text-xs font-black text-white w-8">{entry.day}</span>
                          <input
                            type="time"
                            value={entry.time}
                            onChange={e => setDayTime(entry.day, e.target.value)}
                            className="bg-bg-raised border border-border rounded-lg px-3 py-1.5 text-white text-sm font-mono outline-none focus:border-accent transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedule start date */}
                <div>
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-2 block">Schedule Start Date</label>
                  <input
                    type="date"
                    value={subScheduleStartDate}
                    onChange={e => setSubScheduleStartDate(e.target.value)}
                    className="bg-bg-raised border border-border rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent transition-colors"
                  />
                  <p className="text-[10px] text-text-muted mt-1">Used to calculate pending classes accurately</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveSubject}
              className="w-full bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] shadow-xl shadow-accent/20"
            >
              {editingSubject ? "Save Changes" : "Create Subject"}
            </button>
          </div>
        </div>
      </Modal>

      {isColorPickerOpen && (
        <ColorPicker color={subColor} onChange={setSubColor} onClose={() => setIsColorPickerOpen(false)} />
      )}

      {isEmojiPickerOpen && (
        <EmojiPicker onSelect={setSubIcon} onClose={() => setIsEmojiPickerOpen(false)} />
      )}

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
