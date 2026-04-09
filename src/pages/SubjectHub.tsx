import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import {
  ArrowLeft, Edit, Plus, Timer, BookOpen, GraduationCap,
  CheckSquare, MessageCircleQuestion, ClipboardCheck, Trash2,
  ChevronRight, School, Wifi, Brain, Flag, Check, RotateCcw, TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { Chapter, ChapterExamStatus } from '../context/AppContext';
import SubjectIcon from '../components/SubjectIcon';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

type Tab = 'chapters' | 'exams' | 'homework' | 'doubts' | 'attendance';

// ── Chapter row with dual-track status ──────────────────────────────────────
function ChapterRow({
  chapter,
  subjectId,
  onOpen,
  onDelete,
}: {
  chapter: Chapter;
  subjectId: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { dispatch } = useAppContext();

  const setField = (field: 'schoolStatus' | 'onlineStatus' | 'examStatus' | 'flaggedForRevision', value: string | boolean) => {
    dispatch({ type: 'UPDATE_CHAPTER_TRACK', payload: { subjectId, chapterId: chapter.id, field, value } });
  };

  const cycleExamStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const order: ChapterExamStatus[] = ['not-started', 'learning', 'revised', 'confident'];
    const next = order[(order.indexOf(chapter.examStatus) + 1) % 4];
    setField('examStatus', next);
  };

  const examColors: Record<ChapterExamStatus, { bg: string; text: string; label: string }> = {
    'not-started': { bg: 'rgba(255,255,255,0.06)', text: 'var(--text-muted)', label: 'Not started' },
    'learning':    { bg: 'rgba(103,232,249,0.12)', text: 'var(--sky)',       label: 'Learning' },
    'revised':     { bg: 'rgba(251,191,36,0.12)',  text: 'var(--gold)',      label: 'Revised' },
    'confident':   { bg: 'rgba(61,237,122,0.12)',  text: 'var(--green)',     label: 'Confident' },
  };
  const ec = examColors[chapter.examStatus];

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-all group"
      onClick={onOpen}
    >
      {/* Chapter name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm truncate">{chapter.name}</span>
          {chapter.flaggedForRevision && <Flag size={12} className="text-coral shrink-0" fill="currentColor" />}
        </div>
      </div>

      {/* Track pills */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* School status */}
        <button
          onClick={e => { e.stopPropagation(); setField('schoolStatus', chapter.schoolStatus === 'covered' ? 'not-covered' : 'covered'); }}
          title="School coverage"
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 ${chapter.schoolStatus === 'covered' ? 'text-purple-300' : 'text-text-muted'}`}
          style={{
            background: chapter.schoolStatus === 'covered' ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${chapter.schoolStatus === 'covered' ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <School size={9} />
          <span>{chapter.schoolStatus === 'covered' ? 'Done' : 'School'}</span>
        </button>

        {/* Online status */}
        <button
          onClick={e => { e.stopPropagation(); setField('onlineStatus', chapter.onlineStatus === 'covered' ? 'not-covered' : 'covered'); }}
          title="Online tuition coverage"
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 ${chapter.onlineStatus === 'covered' ? 'text-sky' : 'text-text-muted'}`}
          style={{
            background: chapter.onlineStatus === 'covered' ? 'rgba(103,232,249,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${chapter.onlineStatus === 'covered' ? 'rgba(103,232,249,0.35)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <Wifi size={9} />
          <span>{chapter.onlineStatus === 'covered' ? 'Done' : 'Online'}</span>
        </button>

        {/* Exam status */}
        <button
          onClick={cycleExamStatus}
          title="Exam readiness — click to cycle"
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: ec.bg, border: `1px solid ${ec.text}40`, color: ec.text }}
        >
          <Brain size={9} />
          <span>{ec.label}</span>
        </button>

        {/* Flag toggle */}
        <button
          onClick={e => { e.stopPropagation(); setField('flaggedForRevision', !chapter.flaggedForRevision); }}
          title="Flag for revision"
          className={`p-1 rounded-lg transition-all hover:scale-110 ${chapter.flaggedForRevision ? 'text-coral' : 'text-text-muted opacity-30 hover:opacity-60'}`}
        >
          <Flag size={12} />
        </button>

        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded-lg text-text-muted opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-coral transition-all"
        >
          <Trash2 size={12} />
        </button>

        <ChevronRight size={14} className="text-text-muted opacity-30 group-hover:opacity-70 transition-opacity" />
      </div>
    </div>
  );
}

// ── Main SubjectHub ──────────────────────────────────────────────────────────
export default function SubjectHub() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('chapters');
  const [newChapName, setNewChapName] = useState('');
  const [addChapOpen, setAddChapOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: '', description: '', onConfirm: () => {},
  });

  // Homework add state
  const [addHwOpen, setAddHwOpen] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDue, setHwDue] = useState('');
  const [hwUrgent, setHwUrgent] = useState(false);

  // Doubt add state
  const [addDoubtOpen, setAddDoubtOpen] = useState(false);
  const [doubtTopic, setDoubtTopic] = useState('');
  const [doubtQ, setDoubtQ] = useState('');

  const subject = (state.subjects || []).find(s => s.id === subjectId);
  if (!subject) return (
    <div className="flex flex-col items-center justify-center h-64 text-text-muted">
      <AlertCircle size={40} className="mb-4 opacity-40" />
      <p className="font-bold">Subject not found</p>
      <button onClick={() => navigate('/subjects')} className="mt-4 text-accent underline text-sm">Back to Subjects</button>
    </div>
  );

  const chapters = subject.chapters || [];
  const subjectExams = (state.exams || []).filter(e => e.subjectId === subjectId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const subjectHw = (state.homework || []).filter(h => h.subjectId === subjectId).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const subjectDoubts = (state.doubts || []).filter(d => d.subjectId === subjectId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const subjectAttendance = (state.attendanceLogs || []).filter(l => l.subjectId === subjectId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Progress stats
  const totalChapters = chapters.length;
  const schoolCovered = chapters.filter(c => c.schoolStatus === 'covered').length;
  const onlineCovered = chapters.filter(c => c.onlineStatus === 'covered').length;
  const examReady = chapters.filter(c => c.examStatus === 'confident' || c.examStatus === 'revised').length;
  const schoolPct = totalChapters ? Math.round((schoolCovered / totalChapters) * 100) : 0;
  const onlinePct = totalChapters ? Math.round((onlineCovered / totalChapters) * 100) : 0;
  const examPct  = totalChapters ? Math.round((examReady / totalChapters) * 100) : 0;

  // Nearest upcoming exam for this subject
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const nextExam = subjectExams.find(e => new Date(e.date) >= todayStart);
  const daysToExam = nextExam ? Math.ceil(differenceInDays(new Date(nextExam.date), new Date())) : null;

  // Attendance summary
  const attended  = subjectAttendance.filter(l => l.status === 'attended').length;
  const cancelled = subjectAttendance.filter(l => l.status === 'cancelled').length;
  const totalLogged = subjectAttendance.length;

  const showConfirm = (title: string, description: string, onConfirm: () => void) =>
    setConfirmState({ open: true, title, description, onConfirm });

  const handleAddChapter = () => {
    if (!newChapName.trim()) return;
    dispatch({
      type: 'ADD_CHAPTER',
      payload: {
        id: `chap-${Date.now()}`,
        subjectId: subject.id,
        name: newChapName,
        source: 'both',
        schoolStatus: 'not-covered',
        onlineStatus: 'not-covered',
        examStatus: 'not-started',
        flaggedForRevision: false,
        notes: [], flashcards: [], formulas: [],
      },
    });
    setNewChapName('');
    setAddChapOpen(false);
  };

  const handleAddHw = () => {
    if (!hwTitle.trim() || !hwDue) return;
    dispatch({
      type: 'ADD_HOMEWORK',
      payload: {
        id: `hw-${Date.now()}`,
        subjectId: subject.id,
        title: hwTitle,
        dueDate: new Date(hwDue),
        done: false,
        urgent: hwUrgent,
        priority: hwUrgent ? 'High' : 'Medium',
      },
    });
    setHwTitle(''); setHwDue(''); setHwUrgent(false);
    setAddHwOpen(false);
  };

  const handleAddDoubt = () => {
    if (!doubtTopic.trim() || !doubtQ.trim()) return;
    dispatch({
      type: 'ADD_DOUBT',
      payload: {
        id: `doubt-${Date.now()}`,
        subjectId: subject.id,
        topic: doubtTopic,
        question: doubtQ,
        resolved: false,
        createdAt: new Date(),
      },
    });
    setDoubtTopic(''); setDoubtQ('');
    setAddDoubtOpen(false);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'chapters',    label: 'Chapters',    icon: <BookOpen size={15} />,              count: totalChapters },
    { id: 'exams',       label: 'Exams',       icon: <GraduationCap size={15} />,         count: subjectExams.length },
    { id: 'homework',    label: 'Homework',    icon: <CheckSquare size={15} />,           count: subjectHw.filter(h => !h.done).length },
    { id: 'doubts',      label: 'Doubts',      icon: <MessageCircleQuestion size={15} />, count: subjectDoubts.filter(d => !d.resolved).length },
    { id: 'attendance',  label: 'Attendance',  icon: <ClipboardCheck size={15} />,        count: undefined },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/subjects')}
          className="mt-1 p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
          style={{ background: subject.colour, boxShadow: `0 4px 20px ${subject.colour}40` }}
        >
          <SubjectIcon name={subject.icon} size={22} />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">{subject.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {subject.onlineClass && (
              <span className="text-[11px] font-bold text-sky px-2 py-0.5 rounded-full" style={{ background: 'rgba(103,232,249,0.12)', border: '1px solid rgba(103,232,249,0.25)' }}>
                Online class enabled
              </span>
            )}
            {nextExam && daysToExam !== null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${daysToExam <= 7 ? 'text-coral' : 'text-gold'}`}
                style={{ background: daysToExam <= 7 ? 'rgba(255,107,107,0.12)' : 'rgba(251,191,36,0.12)', border: `1px solid ${daysToExam <= 7 ? 'rgba(255,107,107,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
                <Timer size={10} />
                {daysToExam <= 0 ? `${nextExam.name} — Today!` : `${nextExam.name} in ${daysToExam}d`}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/subjects', { state: { editId: subjectId } })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-all hover:bg-white/5"
        >
          <Edit size={15} />
          Edit
        </button>
      </div>

      {/* ── Progress cards ── */}
      {totalChapters > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'School', pct: schoolPct, count: schoolCovered, color: '#8B5CF6', icon: <School size={16} /> },
            { label: 'Online Tuition', pct: onlinePct, count: onlineCovered, color: 'var(--sky)', icon: <Wifi size={16} /> },
            { label: 'Exam Ready', pct: examPct, count: examReady, color: 'var(--green)', icon: <Brain size={16} /> },
          ].map(card => (
            <div key={card.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-3" style={{ color: card.color }}>
                {card.icon}
                <span className="text-xs font-black uppercase tracking-widest">{card.label}</span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-2xl font-black text-white">{card.pct}%</span>
                <span className="text-xs text-text-muted mb-1">{card.count}/{totalChapters} chapters</span>
              </div>
              <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${card.pct}%`, background: card.color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all flex-1 justify-center ${
              activeTab === tab.id ? 'text-white' : 'text-text-muted hover:text-white'
            }`}
            style={activeTab === tab.id ? { background: subject.colour + '20', boxShadow: `0 0 0 1px ${subject.colour}40` } : {}}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ background: subject.colour + '30', color: subject.colour }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {/* CHAPTERS */}
      {activeTab === 'chapters' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-text-muted uppercase tracking-widest">
              {totalChapters} chapter{totalChapters !== 1 ? 's' : ''}
            </div>
            <button
              onClick={() => setAddChapOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: `${subject.colour}20`, border: `1px solid ${subject.colour}40`, color: subject.colour }}
            >
              <Plus size={14} /> Add Chapter
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] text-text-muted font-bold px-1 flex-wrap">
            <span className="flex items-center gap-1"><School size={10} className="text-purple-300" /> School covered</span>
            <span className="flex items-center gap-1"><Wifi size={10} className="text-sky" /> Online covered</span>
            <span className="flex items-center gap-1"><Brain size={10} className="text-green" /> Exam readiness (tap to cycle)</span>
            <span className="flex items-center gap-1"><Flag size={10} className="text-coral" /> Flagged for revision</span>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold">No chapters yet</p>
              <p className="text-sm mt-1">Add chapters to start tracking progress</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {chapters.map((ch, idx) => (
                <div key={ch.id} className={idx > 0 ? 'border-t border-white/5' : ''}>
                  <ChapterRow
                    chapter={ch}
                    subjectId={subject.id}
                    onOpen={() => navigate(`/subjects/${subject.id}/chapter/${ch.id}`)}
                    onDelete={() => showConfirm('Delete Chapter', `Delete "${ch.name}"?`, () =>
                      dispatch({ type: 'DELETE_CHAPTER', payload: { subjectId: subject.id, chapterId: ch.id } })
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXAMS */}
      {activeTab === 'exams' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-text-muted uppercase tracking-widest">{subjectExams.length} exam{subjectExams.length !== 1 ? 's' : ''}</div>
            <button
              onClick={() => navigate('/subjects', { state: { addExam: true, subjectId } })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: `${subject.colour}20`, border: `1px solid ${subject.colour}40`, color: subject.colour }}
            >
              <Plus size={14} /> Add Exam
            </button>
          </div>

          {subjectExams.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <GraduationCap size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold">No exams scheduled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subjectExams.map(exam => {
                const days = Math.ceil(differenceInDays(new Date(exam.date), new Date()));
                const linked = subject.chapters.filter(c => exam.linkedChapterIds.includes(c.id));
                const ready  = linked.filter(c => c.examStatus === 'confident' || c.examStatus === 'revised').length;
                const examPct = linked.length > 0 ? Math.round((ready / linked.length) * 100) : 0;
                return (
                  <div key={exam.id} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-bold text-white">{exam.name}</div>
                        <div className="text-xs text-text-muted">{exam.type} · {format(new Date(exam.date), 'd MMM yyyy')}</div>
                      </div>
                      <div className={`text-sm font-black px-3 py-1 rounded-full ${days <= 0 ? 'text-coral' : days <= 7 ? 'text-orange-400' : 'text-gold'}`}
                        style={{ background: days <= 0 ? 'rgba(255,107,107,0.12)' : 'rgba(251,191,36,0.1)' }}>
                        {days <= 0 ? 'Today!' : `${days}d left`}
                      </div>
                    </div>
                    {linked.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-text-muted">{ready}/{linked.length} chapters exam-ready</span>
                          <span className="font-bold" style={{ color: examPct >= 80 ? 'var(--green)' : examPct >= 40 ? 'var(--gold)' : 'var(--coral)' }}>{examPct}%</span>
                        </div>
                        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${examPct}%`, background: examPct >= 80 ? 'var(--green)' : examPct >= 40 ? 'var(--gold)' : 'var(--coral)' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* HOMEWORK */}
      {activeTab === 'homework' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-text-muted uppercase tracking-widest">{subjectHw.filter(h => !h.done).length} pending</div>
            <button
              onClick={() => setAddHwOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: `${subject.colour}20`, border: `1px solid ${subject.colour}40`, color: subject.colour }}
            >
              <Plus size={14} /> Add Homework
            </button>
          </div>

          {subjectHw.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <CheckSquare size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold">No homework assigned</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subjectHw.map(hw => {
                const overdue = !hw.done && new Date(hw.dueDate) < new Date(new Date().setHours(0,0,0,0));
                return (
                  <div key={hw.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${hw.done ? 'opacity-50' : ''}`}
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${overdue ? 'rgba(255,107,107,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_HOMEWORK', payload: hw.id })}
                      className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${hw.done ? 'bg-green border-green' : 'border-border hover:border-green'}`}
                    >
                      {hw.done && <Check size={11} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm ${hw.done ? 'line-through text-text-muted' : 'text-white'}`}>{hw.title}</div>
                      <div className={`text-xs ${overdue ? 'text-coral font-bold' : 'text-text-muted'}`}>
                        {overdue ? 'Overdue — ' : ''}Due {format(new Date(hw.dueDate), 'd MMM')}
                      </div>
                    </div>
                    {hw.urgent && !hw.done && (
                      <span className="text-[10px] font-black text-coral px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,107,0.12)' }}>URGENT</span>
                    )}
                    <button
                      onClick={() => showConfirm('Delete Homework', `Delete "${hw.title}"?`, () => dispatch({ type: 'DELETE_HOMEWORK', payload: hw.id }))}
                      className="p-1 text-text-muted hover:text-coral opacity-30 hover:opacity-100 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DOUBTS */}
      {activeTab === 'doubts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-text-muted uppercase tracking-widest">{subjectDoubts.filter(d => !d.resolved).length} unresolved</div>
            <button
              onClick={() => setAddDoubtOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: `${subject.colour}20`, border: `1px solid ${subject.colour}40`, color: subject.colour }}
            >
              <Plus size={14} /> Log Doubt
            </button>
          </div>

          {subjectDoubts.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <MessageCircleQuestion size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold">No doubts logged</p>
              <p className="text-sm mt-1">Great — you're on top of things!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subjectDoubts.map(d => (
                <div key={d.id} className={`p-4 rounded-xl transition-all ${d.resolved ? 'opacity-50' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black text-text-muted uppercase tracking-widest mb-1">{d.topic}</div>
                      <div className="font-bold text-white text-sm">{d.question}</div>
                      {d.savedAnswer && <div className="text-xs text-green mt-2 font-medium">{d.savedAnswer}</div>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => dispatch({ type: 'RESOLVE_DOUBT', payload: d.id })}
                        className={`p-1.5 rounded-lg transition-all hover:scale-110 ${d.resolved ? 'text-green' : 'text-text-muted hover:text-green'}`}
                        title={d.resolved ? 'Resolved' : 'Mark resolved'}
                      >
                        {d.resolved ? <Check size={14} /> : <RotateCcw size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {subject.onlineClass ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Attended', count: attended, color: 'var(--green)', bg: 'rgba(61,237,122,0.1)' },
                  { label: 'Cancelled', count: cancelled, color: 'var(--coral)', bg: 'rgba(255,107,107,0.1)' },
                  { label: 'Total Logged', count: totalLogged, color: 'var(--sky)', bg: 'rgba(103,232,249,0.1)' },
                ].map(stat => (
                  <div key={stat.label} className="rounded-2xl p-4 text-center" style={{ background: stat.bg, border: `1px solid ${stat.color}30` }}>
                    <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.count}</div>
                    <div className="text-[11px] font-bold text-text-muted mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent logs */}
              {subjectAttendance.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <ClipboardCheck size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold">No attendance logged yet</p>
                  <p className="text-sm mt-1">Tag classes from the Dashboard</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-black text-text-muted uppercase tracking-widest">Recent</div>
                  {subjectAttendance.slice(0, 20).map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="text-sm text-white font-bold">{format(new Date(log.date), 'EEE, d MMM yyyy')}</div>
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                        log.status === 'attended' ? 'text-green' : log.status === 'cancelled' ? 'text-coral' : 'text-gold'
                      }`} style={{
                        background: log.status === 'attended' ? 'rgba(61,237,122,0.12)' : log.status === 'cancelled' ? 'rgba(255,107,107,0.12)' : 'rgba(251,191,36,0.12)',
                      }}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-text-muted">
              <TrendingUp size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold">No online class configured</p>
              <p className="text-sm mt-1">Enable online class in subject settings to track attendance</p>
              <button
                onClick={() => navigate('/subjects', { state: { editId: subjectId } })}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-accent hover:bg-accent/10 transition-colors border border-accent/30"
              >
                Configure online class
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}

      {/* Add Chapter */}
      <Modal isOpen={addChapOpen} onClose={() => setAddChapOpen(false)} title="Add Chapter">
        <div className="space-y-4 p-1">
          <input
            autoFocus
            type="text"
            value={newChapName}
            onChange={e => setNewChapName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
            placeholder="Chapter name"
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-accent font-medium"
          />
          <div className="flex gap-3">
            <button onClick={() => setAddChapOpen(false)} className="flex-1 py-3 rounded-xl border border-border text-text-muted font-bold hover:bg-bg-raised transition-colors">Cancel</button>
            <button onClick={handleAddChapter} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20">Add</button>
          </div>
        </div>
      </Modal>

      {/* Add Homework */}
      <Modal isOpen={addHwOpen} onClose={() => setAddHwOpen(false)} title="Add Homework">
        <div className="space-y-4 p-1">
          <input
            autoFocus type="text" value={hwTitle} onChange={e => setHwTitle(e.target.value)}
            placeholder="Homework title"
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-accent font-medium"
          />
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1">Due Date</label>
            <input type="date" value={hwDue} onChange={e => setHwDue(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-accent" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hwUrgent} onChange={e => setHwUrgent(e.target.checked)} className="accent-coral" />
            <span className="text-sm font-bold text-text-muted">Mark as urgent</span>
          </label>
          <div className="flex gap-3">
            <button onClick={() => setAddHwOpen(false)} className="flex-1 py-3 rounded-xl border border-border text-text-muted font-bold hover:bg-bg-raised transition-colors">Cancel</button>
            <button onClick={handleAddHw} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover transition-colors">Add</button>
          </div>
        </div>
      </Modal>

      {/* Add Doubt */}
      <Modal isOpen={addDoubtOpen} onClose={() => setAddDoubtOpen(false)} title="Log a Doubt">
        <div className="space-y-4 p-1">
          <input
            autoFocus type="text" value={doubtTopic} onChange={e => setDoubtTopic(e.target.value)}
            placeholder="Topic (e.g. Quadratic equations)"
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-accent font-medium"
          />
          <textarea value={doubtQ} onChange={e => setDoubtQ(e.target.value)}
            placeholder="What's your question or doubt?"
            rows={3}
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-accent font-medium resize-none"
          />
          <div className="flex gap-3">
            <button onClick={() => setAddDoubtOpen(false)} className="flex-1 py-3 rounded-xl border border-border text-text-muted font-bold hover:bg-bg-raised transition-colors">Cancel</button>
            <button onClick={handleAddDoubt} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover transition-colors">Log Doubt</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(s => ({ ...s, open: false })); }}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />
    </div>
  );
}
