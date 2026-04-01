import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { format, differenceInDays } from 'date-fns';
import { Plus, Bell, BookOpen, Target, CheckSquare, GraduationCap, Trash2, BarChart2, Award } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import SubjectBadge from '../components/SubjectBadge';
import ProgressBar from '../components/ProgressBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Exams() {
  const { state, dispatch } = useAppContext();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [exName, setExName] = useState('');
  const [exDate, setExDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exSub, setExSub] = useState(state.subjects[0]?.id || '');
  const [exType, setExType] = useState<string>(state.examTypes?.[0] || 'Unit Test');
  const [exColor] = useState('#FF6B9D');
  const [linkedChapters, setLinkedChapters] = useState<string[]>([]);
  const [linkedSubChapters, setLinkedSubChapters] = useState<string[]>([]);

  // Mark logging state
  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [markSub, setMarkSub] = useState(state.subjects[0]?.id || '');
  const [markType, setMarkType] = useState(state.examTypes?.[0] || 'Unit Test');
  const [markObt, setMarkObt] = useState('');
  const [markTot, setMarkTot] = useState('');
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartSubjectFilter, setChartSubjectFilter] = useState<string>('');

  // Confirm modal
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>(
    { open: false, title: '', description: '', onConfirm: () => { } }
  );
  const showConfirm = (title: string, description: string, onConfirm: () => void) =>
    setConfirmState({ open: true, title, description, onConfirm });
  const closeConfirm = () => setConfirmState(s => ({ ...s, open: false }));

  const today = new Date();

  const sortedExams = [...state.exams]
    .filter(e => new Date(e.date) >= new Date(today.setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const selectedSubject = state.subjects.find(s => s.id === exSub);

  // Reset chapters + sub-chapters when subject changes
  useEffect(() => {
    setLinkedChapters([]);
    setLinkedSubChapters([]);
  }, [exSub]);

  const toggleChapter = (id: string) => {
    if (linkedChapters.includes(id)) {
      setLinkedChapters(linkedChapters.filter(c => c !== id));
      // Also deselect all sub-chapters of this chapter
      const chap = selectedSubject?.chapters.find(c => c.id === id);
      if (chap?.subChapters) {
        const scIds = chap.subChapters.map(sc => sc.id);
        setLinkedSubChapters(prev => prev.filter(id => !scIds.includes(id)));
      }
    } else {
      setLinkedChapters([...linkedChapters, id]);
    }
  };

  const toggleSubChapter = (id: string) => {
    setLinkedSubChapters(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAllChapters = () => {
    if (selectedSubject) {
      setLinkedChapters(selectedSubject.chapters.map(c => c.id));
    }
  };

  const handleAddExam = () => {
    if (!exName.trim() || !exDate || !exSub) return;
    dispatch({
      type: 'ADD_EXAM',
      payload: {
        id: `exam-${Date.now()}`,
        subjectId: exSub,
        name: exName,
        date: new Date(exDate),
        type: exType,
        color: exColor,
        linkedChapterIds: linkedChapters,
        linkedSubChapterIds: linkedSubChapters,
      }
    });
    setExName('');
    setLinkedChapters([]);
    setLinkedSubChapters([]);
    setIsAddOpen(false);
  };

  const handleDeleteExam = (id: string, name: string) => {
    showConfirm(
      'Delete Exam',
      `Remove "${name}" from your exam countdown? This cannot be undone.`,
      () => dispatch({ type: 'DELETE_EXAM', payload: id })
    );
  };

  const openLogMark = (exam?: { subjectId: string; type: string; date: Date }) => {
    if (exam) {
      setMarkSub(exam.subjectId);
      setMarkType(exam.type);
      setMarkDate(format(new Date(exam.date), 'yyyy-MM-dd'));
    } else {
      setMarkSub(state.subjects[0]?.id || '');
      setMarkType(state.examTypes?.[0] || 'Unit Test');
      setMarkDate(new Date().toISOString().split('T')[0]);
    }
    setMarkObt('');
    setMarkTot('');
    setIsMarkOpen(true);
  };

  const handleAddMark = () => {
    if (!markSub || !markObt || !markTot) return;
    dispatch({
      type: 'ADD_TEST_MARK',
      payload: {
        id: `tm-${Date.now()}`,
        subjectId: markSub,
        type: markType,
        marksObtained: Number(markObt),
        totalMarks: Number(markTot),
        date: new Date(markDate)
      }
    });
    setIsMarkOpen(false);
    setMarkObt(''); setMarkTot('');
  };

  const handleDeleteTestMark = (id: string) => {
    showConfirm(
      'Delete Test Result',
      'Remove this test result from your academic performance history?',
      () => dispatch({ type: 'DELETE_TEST_MARK', payload: id })
    );
  };

  const safeDate = (d: any): Date => {
    if (d instanceof Date && !isNaN(d.getTime())) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const filteredMarks = chartSubjectFilter
    ? state.testMarks.filter(m => m.subjectId === chartSubjectFilter)
    : state.testMarks;

  const sortedMarks = [...filteredMarks].sort(
    (a, b) => safeDate(a.date).getTime() - safeDate(b.date).getTime()
  );

  const chartSubjectIds = chartSubjectFilter
    ? [chartSubjectFilter]
    : Array.from(new Set(state.testMarks.map(m => m.subjectId)));

  const marksData = sortedMarks.map(m => {
    const dateObj = safeDate(m.date);
    return {
      name: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      [m.subjectId]: Math.round((m.marksObtained / m.totalMarks) * 100),
    };
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-coral/20 rounded-2xl flex items-center justify-center text-coral shadow-inner shadow-coral/10">
              <GraduationCap size={28} />
            </div>
            Exams Countdown
          </h1>
          <p className="text-text-muted mt-2 font-medium">Track your upcoming tests and measure syllabus progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openLogMark()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all hover:scale-105 border"
            style={{
              background: 'rgba(251,191,36,0.1)',
              borderColor: 'rgba(251,191,36,0.3)',
              color: '#FBBF24',
              boxShadow: '0 0 16px rgba(251,191,36,0.08)',
            }}
          >
            <Award size={18} /> Log Mark
          </button>
          <button
            onClick={() => {
              setExName('');
              setExDate(format(new Date(), 'yyyy-MM-dd'));
              setLinkedChapters([]);
              setIsAddOpen(true);
            }}
            className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-xl shadow-accent/20"
          >
            <Plus size={20} /> Add Exam
          </button>
        </div>
      </div>

      <div className="space-y-8 pt-4">
        {sortedExams.length === 0 && (
          <div className="p-12 border border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-text-muted gap-4 bg-bg-card shadow-sm">
            <BookOpen size={64} className="opacity-20 text-accent" />
            <p className="font-bold text-xl text-white">No upcoming exams.</p>
            <p className="text-sm">You can relax for now! 🏖️</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedExams.map((exam, idx) => {
            const sub = state.subjects.find(s => s.id === exam.subjectId);
            const dateObj = new Date(exam.date);
            const daysLeft = Math.ceil(differenceInDays(dateObj, new Date()));

            const isUrgent = daysLeft <= 14;
            const cardColor = (exam as any).color || sub?.colour || '#FF6B9D';
            const bgColour = isUrgent && idx === 0 ? `bg-bg-card shadow-lg` : 'bg-bg-card border-border border shadow-sm';
            const textColour = 'text-white';
            const subtextCol = 'text-text-muted';

            const syllabusChapters = sub?.chapters.filter(c => exam.linkedChapterIds.includes(c.id)) || [];
            const compChapters = syllabusChapters.filter(c => c.status === 'done').length;
            const totalChapters = syllabusChapters.length;
            const progressPercent = totalChapters > 0 ? Math.round((compChapters / totalChapters) * 100) : 0;

            return (
              <div key={exam.id} className={`${bgColour} rounded-3xl p-7 relative overflow-hidden transition-all hover:-translate-y-2 group border`} style={{ borderColor: `${cardColor}40`, boxShadow: idx === 0 ? `0 8px 32px ${cardColor}30` : undefined }}>
                {idx === 0 && (
                  <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 translate-x-4 -translate-y-4">
                    <Bell size={120} fill="currentColor" style={{ color: cardColor }} />
                  </div>
                )}
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex flex-wrap items-center justify-between mb-5 gap-2 pr-8">
                    <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg ${isUrgent && idx === 0 ? 'bg-black/20 text-white' : 'bg-bg text-text-muted border border-border'}`}>
                      {exam.type}
                    </span>
                    {totalChapters > 0 && (
                      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${isUrgent && idx === 0 ? 'bg-black/20 text-white' : 'bg-bg border border-border text-text-muted'}`}>
                        <Target size={12} /> {progressPercent}% READY
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteExam(exam.id, exam.name)}
                    className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 rounded-xl transition-all border border-transparent hover:border-black/20"
                    title="Delete Exam"
                  >
                    <Trash2 size={16} />
                  </button>

                  <SubjectBadge color={sub?.colour || '#8A8070'} name={sub?.name} className={`mb-3 w-fit`} />

                  <h3 className={`text-2xl font-black mb-6 line-clamp-2 leading-tight ${textColour}`}>{exam.name}</h3>

                  <div className="mt-auto">
                    {totalChapters > 0 ? (
                      <div className="mb-6 space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={subtextCol}>Syllabus Covered</span>
                          <span className={textColour}>{compChapters} / {totalChapters}</span>
                        </div>
                        <ProgressBar progress={progressPercent} color={cardColor} height={6} />
                      </div>
                    ) : (
                      <div className={`text-xs font-bold mb-6 italic opacity-70 ${subtextCol}`}>No syllabus linked.</div>
                    )}

                    <div className="text-[11px] font-black uppercase tracking-widest mb-1.5 text-text-muted">{format(dateObj, 'EEEE, d MMM yyyy')}</div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-6xl font-black tracking-tighter" style={{ color: cardColor }}>{daysLeft < 0 ? 0 : daysLeft}</span>
                      <span className="font-black uppercase tracking-widest text-text-muted">
                        {daysLeft === 1 ? 'Day Left' : 'Days Left'}
                      </span>
                    </div>

                    <button
                      onClick={() => openLogMark({ subjectId: exam.subjectId, type: exam.type, date: exam.date })}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all hover:scale-[1.02]"
                      style={{
                        background: `${cardColor}10`,
                        borderColor: `${cardColor}30`,
                        color: cardColor,
                      }}
                    >
                      <Award size={14} /> Log Mark
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Academic Performance Section */}
      <div className="bg-bg-card border border-border rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <BarChart2 className="text-accent" size={24} />
              Academic Performance
            </h2>
            <p className="text-sm text-text-muted mt-1 font-medium">Track your test percentages over time across all subjects.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={chartSubjectFilter}
              onChange={e => setChartSubjectFilter(e.target.value)}
              className="bg-bg border border-border text-white text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-accent transition-colors"
            >
              <option value="">All Subjects</option>
              {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              onClick={() => openLogMark()}
              className="bg-bg-raised hover:bg-border border border-border text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={16} /> Log Mark
            </button>
          </div>
        </div>

        {state.testMarks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <Award size={48} className="mx-auto mb-3 opacity-20 text-gold" />
            <p className="text-text-muted font-bold">No test marks logged yet.</p>
            <button onClick={() => openLogMark()} className="text-accent hover:underline text-sm font-bold mt-2 block mx-auto">Log your first score!</button>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marksData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                <XAxis dataKey="name" stroke="#8A8070" tick={{ fill: '#8A8070', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#8A8070" tick={{ fill: '#8A8070', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} dx={-10} tickFormatter={(val) => `${val}%`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #1E1E1E', borderRadius: '12px', color: 'white', fontWeight: 'bold' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  labelStyle={{ color: '#8A8070', marginBottom: '4px' }}
                  formatter={(value: any, name: any) => {
                    const sub = state.subjects.find(s => s.id === name);
                    return [`${value}%`, sub?.name || name];
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const sub = state.subjects.find(s => s.id === value);
                    return <span style={{ color: sub?.colour || '#fff', fontSize: 12, fontWeight: 'bold' }}>{sub?.name || value}</span>;
                  }}
                />
                {chartSubjectIds.map(subId => {
                  const sub = state.subjects.find(s => s.id === subId);
                  return (
                    <Line
                      key={subId}
                      type="monotone"
                      dataKey={subId}
                      stroke={sub?.colour || '#FF6B9D'}
                      strokeWidth={3}
                      dot={{ fill: sub?.colour || '#FF6B9D', strokeWidth: 2, r: 5, stroke: '#111' }}
                      activeDot={{ r: 7 }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {state.testMarks.length > 0 && (
          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Recent Results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...state.testMarks].reverse().slice(0, 6).map(mark => {
                const sub = state.subjects.find(s => s.id === mark.subjectId);
                const pct = Math.round((mark.marksObtained / mark.totalMarks) * 100);
                return (
                  <div key={mark.id} className="bg-bg border border-border rounded-xl p-3.5 flex items-center justify-between group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: sub?.colour }}>{sub?.name || 'Subject'}</span>
                        <span className="text-[10px] font-bold text-text-muted">{new Date(mark.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm font-bold text-white truncate">{mark.type}: {mark.marksObtained}/{mark.totalMarks}
                        <span className="ml-2 text-text-muted font-bold">({pct}%)</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTestMark(mark.id)}
                      className="p-2 text-text-muted hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Exam Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Upcoming Exam">
        <div className="space-y-6 pt-2">

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Subject</label>
              <select value={exSub} onChange={e => setExSub(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3.5 text-white font-bold outline-none focus:border-accent transition-colors shadow-inner">
                <option value="" disabled>Select Subject</option>
                {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Exam Type</label>
              <select value={exType} onChange={e => setExType(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3.5 text-white capitalize font-bold outline-none focus:border-accent transition-colors shadow-inner">
                {(state.examTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Exam Name / Topic</label>
            <input value={exName} onChange={e => setExName(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3.5 text-white font-bold outline-none focus:border-accent transition-colors shadow-inner" placeholder="e.g. History Paper 1" />
          </div>

          <div>
            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Date</label>
            <input type="date" value={exDate} onChange={e => setExDate(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3.5 text-white font-bold font-mono outline-none focus:border-accent transition-colors shadow-inner" />
          </div>

          {selectedSubject && selectedSubject.chapters.length > 0 && (
            <div className="bg-bg-raised border border-border p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-black text-text-muted uppercase tracking-widest">Syllabus Coverage</label>
                <button onClick={selectAllChapters} className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent-hover transition-colors bg-accent/10 px-2 py-1 rounded">Select All</button>
              </div>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                {selectedSubject.chapters.map(chap => (
                  <div key={chap.id}>
                    {/* Chapter row */}
                    <button
                      onClick={() => toggleChapter(chap.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all w-full ${linkedChapters.includes(chap.id) ? 'border-accent bg-accent/10' : 'border-border bg-bg hover:border-text-muted/30'}`}
                    >
                      <div className={`w-5 h-5 rounded-md flex justify-center items-center flex-shrink-0 transition-colors ${linkedChapters.includes(chap.id) ? 'bg-accent text-white' : 'border-2 border-text-muted/50'}`}>
                        {linkedChapters.includes(chap.id) && <CheckSquare size={14} />}
                      </div>
                      <span className={`text-sm font-bold truncate ${linkedChapters.includes(chap.id) ? 'text-white' : 'text-text-muted'}`}>{chap.name}</span>
                      {(chap.subChapters || []).length > 0 && (
                        <span className="ml-auto text-[10px] font-bold text-text-muted flex-shrink-0">
                          {(chap.subChapters || []).length} sub
                        </span>
                      )}
                    </button>
                    {/* Sub-chapter rows — shown when chapter is selected */}
                    {linkedChapters.includes(chap.id) && (chap.subChapters || []).length > 0 && (
                      <div className="ml-6 mt-1 flex flex-col gap-1">
                        {(chap.subChapters || []).map(sc => (
                          <button
                            key={sc.id}
                            onClick={() => toggleSubChapter(sc.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all w-full ${linkedSubChapters.includes(sc.id) ? 'border-accent/60 bg-accent/10 text-white' : 'border-border/50 text-text-muted hover:text-white hover:border-text-muted/30'}`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${linkedSubChapters.includes(sc.id) ? 'bg-accent' : 'border border-text-muted/40'}`}>
                              {linkedSubChapters.includes(sc.id) && <CheckSquare size={10} className="text-white" />}
                            </div>
                            <span className="text-xs font-bold truncate">{sc.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <button onClick={handleAddExam} className="w-full bg-accent hover:bg-accent-hover text-white py-4 rounded-xl font-bold transition-transform hover:scale-[1.02] mt-2 shadow-xl shadow-accent/20 text-lg flex justify-center items-center gap-2">
              <Target size={20} /> Save Exam Countdown
            </button>
          </div>
        </div>
      </Modal>

      {/* Log Mark Modal */}
      <Modal isOpen={isMarkOpen} onClose={() => setIsMarkOpen(false)} title="Log Test Mark">
        <div className="space-y-5 pt-2">
          <div>
            <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Subject</label>
            <select value={markSub} onChange={e => setMarkSub(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white outline-none focus:border-accent font-bold transition-colors">
              <option value="" disabled>Select Subject</option>
              {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Exam Type</label>
            <select value={markType} onChange={e => setMarkType(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white outline-none focus:border-accent font-bold transition-colors capitalize">
              {(state.examTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Marks Obtained</label>
              <input type="number" value={markObt} onChange={e => setMarkObt(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent font-mono" placeholder="e.g. 85" />
            </div>
            <div>
              <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Total Marks</label>
              <input type="number" value={markTot} onChange={e => setMarkTot(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent font-mono" placeholder="e.g. 100" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-text-muted mb-2 uppercase tracking-widest">Date</label>
            <input type="date" value={markDate} onChange={e => setMarkDate(e.target.value)} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent font-mono" />
          </div>
          <div className="pt-4 border-t border-border">
            <button onClick={handleAddMark} className="w-full bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-bold shadow-xl shadow-accent/20 transition-transform hover:scale-[1.02] text-lg">Save Result</button>
          </div>
        </div>
      </Modal>

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
