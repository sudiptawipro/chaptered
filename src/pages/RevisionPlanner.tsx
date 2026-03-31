import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  CalendarDays, Sparkles, CheckCircle2,
  AlertTriangle, Plus, Wand2, Clock, RefreshCw
} from 'lucide-react';
import {
  format, addDays, differenceInDays, startOfDay
} from 'date-fns';
import { playSound } from '../hooks/useSound';
import { useToast } from '../components/Toast';
import type { CalendarEvent } from '../context/AppContext';

// One generated revision session
interface RevisionBlock {
  date: string; // yyyy-MM-dd
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  chapterName: string;
  examName: string;
  durationMins: number;
}

export default function RevisionPlanner() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const { subjects, exams } = state;

  const [generated, setGenerated] = useState<RevisionBlock[]>([]);
  const [pushed, setPushed] = useState(false);
  const [daysPerSession, setDaysPerSession] = useState(45);
  const [loading, setLoading] = useState(false);

  // Sort upcoming exams
  const upcomingExams = useMemo(() =>
    (exams || [])
      .filter(e => new Date(e.date) >= startOfDay(new Date()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [exams]
  );


  function generatePlan() {
    if (upcomingExams.length === 0) {
      toast('Add some upcoming exams first!', 'error');
      return;
    }
    setLoading(true);
    setPushed(false);

    setTimeout(() => {
      const blocks: RevisionBlock[] = [];
      const today = startOfDay(new Date());

      upcomingExams.forEach(exam => {
        const examDate = startOfDay(new Date(exam.date));
        const daysLeft = differenceInDays(examDate, today);
        if (daysLeft <= 0) return;

        const sub = subjects.find(s => s.id === exam.subjectId);
        if (!sub) return;

        // Chapters linked to this exam, or all subject chapters if none linked
        const linkedChapters = exam.linkedChapterIds?.length
          ? sub.chapters.filter(ch => exam.linkedChapterIds.includes(ch.id))
          : sub.chapters;

        if (linkedChapters.length === 0) return;

        // Distribute chapters across days before exam, one chapter per day
        // Cap to daysLeft - 1 (don't revise on exam day itself)
        const revisionDays = Math.min(linkedChapters.length, daysLeft - 1);
        if (revisionDays <= 0) return;

        // Space them evenly
        const interval = Math.max(1, Math.floor((daysLeft - 1) / revisionDays));

        for (let i = 0; i < revisionDays; i++) {
          const dayOffset = i * interval + 1;
          const blockDate = addDays(today, dayOffset);
          if (blockDate >= examDate) break;

          const chapter = linkedChapters[i % linkedChapters.length];
          const dateStr = format(blockDate, 'yyyy-MM-dd');

          blocks.push({
            date: dateStr,
            subjectId: sub.id,
            subjectName: sub.name,
            subjectColor: sub.colour || '#FF6B9D',
            chapterName: chapter.name,
            examName: exam.name,
            durationMins: daysPerSession,
          });
        }
      });

      // Sort by date
      blocks.sort((a, b) => a.date.localeCompare(b.date));
      setGenerated(blocks);
      setLoading(false);
      playSound('success');
      toast(`Generated ${blocks.length} revision sessions!`, 'success');
    }, 800);
  }

  function pushToCalendar() {
    if (generated.length === 0) return;
    const events: CalendarEvent[] = generated.map(block => ({
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: `Revise: ${block.chapterName}`,
      type: 'Revision',
      subjectId: block.subjectId,
      color: block.subjectColor,
      date: new Date(block.date),
      startTime: '17:00',
      endTime: `${17 + Math.floor(block.durationMins / 60)}:${String(block.durationMins % 60).padStart(2, '0')}`,
      notes: `Revision for ${block.examName}`,
      repeat: 'one-time',
    }));
    dispatch({ type: 'ADD_EVENTS', payload: events });
    setPushed(true);
    playSound('save');
    toast(`${events.length} revision sessions added to your Calendar!`, 'success');
  }

  // Group by week for display
  const groupedByWeek = useMemo(() => {
    const groups: Record<string, RevisionBlock[]> = {};
    generated.forEach(block => {
      const d = new Date(block.date);
      const weekStart = format(addDays(d, -d.getDay()), 'MMM d');
      if (!groups[weekStart]) groups[weekStart] = [];
      groups[weekStart].push(block);
    });
    return groups;
  }, [generated]);

  // Stats
  const totalHours = +(generated.reduce((a, b) => a + b.durationMins, 0) / 60).toFixed(1);
  const subjectCoverage = [...new Set(generated.map(b => b.subjectId))].length;

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.35)' }}>
          <Wand2 size={22} className="text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Revision Planner</h1>
          <p className="text-text-muted text-sm mt-0.5">Smart day-by-day plan based on your exams & chapters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config + Upcoming exams */}
        <div className="flex flex-col gap-5">

          {/* Session settings */}
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="font-black text-white mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-gold" />
              Generate Plan
            </h2>

            <div className="mb-4">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
                Session Length
              </label>
              <div className="flex gap-2">
                {[30, 45, 60, 90].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setDaysPerSession(mins)}
                    className={`flex-1 rounded-xl py-2 text-sm font-black transition-all ${
                      daysPerSession === mins ? 'text-white' : 'text-text-muted hover:text-white hover:bg-white/5'
                    }`}
                    style={daysPerSession === mins ? {
                      background: 'rgba(251,191,36,0.2)',
                      border: '1px solid rgba(251,191,36,0.4)',
                    } : { border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generatePlan}
              disabled={loading || upcomingExams.length === 0}
              className="w-full py-3 rounded-xl font-black text-sm transition-all hover-lift flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.8), rgba(251,146,60,0.8))',
                color: '#000',
                boxShadow: '0 4px 16px rgba(251,191,36,0.25)',
              }}
            >
              {loading ? (
                <><RefreshCw size={15} className="animate-spin" /> Generating...</>
              ) : (
                <><Wand2 size={15} /> Generate Revision Plan</>
              )}
            </button>

            {upcomingExams.length === 0 && (
              <p className="text-xs text-text-muted mt-3 text-center">
                Add upcoming exams from the Exams page first
              </p>
            )}
          </div>

          {/* Upcoming Exams List */}
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="font-black text-white mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-accent" />
              Upcoming Exams
            </h2>
            {upcomingExams.length === 0 ? (
              <div className="text-center text-text-muted text-sm py-6">
                <AlertTriangle size={24} className="mx-auto mb-2 opacity-40" />
                No upcoming exams found
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingExams.map(exam => {
                  const sub = subjects.find(s => s.id === exam.subjectId);
                  const daysLeft = differenceInDays(new Date(exam.date), new Date());
                  const linkedCount = exam.linkedChapterIds?.length || 0;
                  const totalChapters = sub?.chapters?.length || 0;
                  return (
                    <div key={exam.id} className="rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-white text-sm">{exam.name}</span>
                        <span className={`text-xs font-black ${
                          daysLeft <= 7 ? 'text-coral' : daysLeft <= 14 ? 'text-orange-400' : 'text-gold'
                        }`}>{daysLeft}d</span>
                      </div>
                      <div className="text-xs text-text-muted">{sub?.name || 'Unknown'}</div>
                      {sub && (
                        <div className="text-xs text-text-muted mt-1">
                          {linkedCount > 0 ? `${linkedCount} linked chapters` : `${totalChapters} chapters in subject`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Generated Plan */}
        <div className="lg:col-span-2">
          {generated.length === 0 ? (
            <div className="rounded-2xl p-12 flex flex-col items-center justify-center text-center h-64"
              style={{ background: 'var(--bg-card)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Wand2 size={36} className="text-text-muted mb-4 opacity-40" />
              <div className="font-black text-white text-lg mb-2">No plan yet</div>
              <p className="text-text-muted text-sm max-w-xs">
                Hit "Generate Revision Plan" to create a personalised day-by-day schedule based on your exams and chapters
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Summary bar */}
              <div className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="flex gap-6">
                  <div>
                    <div className="text-2xl font-black text-gold">{generated.length}</div>
                    <div className="text-xs text-text-muted font-bold">Sessions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-sky-400">{totalHours}h</div>
                    <div className="text-xs text-text-muted font-bold">Total Time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-accent">{subjectCoverage}</div>
                    <div className="text-xs text-text-muted font-bold">Subjects</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={generatePlan}
                    className="px-3 py-2 rounded-xl text-sm font-bold transition-all text-text-muted hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <RefreshCw size={13} /> Regenerate
                  </button>
                  <button
                    onClick={pushToCalendar}
                    disabled={pushed}
                    className="px-4 py-2 rounded-xl text-sm font-black transition-all hover-lift flex items-center gap-1.5 disabled:opacity-60"
                    style={{
                      background: pushed ? 'rgba(61,237,122,0.2)' : 'rgba(61,237,122,0.85)',
                      color: pushed ? 'var(--text-muted)' : '#000',
                      border: `1px solid ${pushed ? 'rgba(61,237,122,0.3)' : 'transparent'}`,
                    }}
                  >
                    {pushed ? <><CheckCircle2 size={14} /> Added!</> : <><Plus size={14} /> Add to Calendar</>}
                  </button>
                </div>
              </div>

              {/* Grouped blocks */}
              {Object.entries(groupedByWeek).map(([week, blocks]) => (
                <div key={week}>
                  <div className="text-xs font-black uppercase tracking-widest text-text-muted mb-2 px-1">
                    Week of {week}
                  </div>
                  <div className="flex flex-col gap-2">
                    {blocks.map((block, i) => {
                      const dateObj = new Date(block.date);
                      const isToday = format(dateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      return (
                        <div key={i}
                          className="rounded-xl p-4 flex items-center gap-4 hover-lift"
                          style={{
                            background: isToday ? 'rgba(255,107,157,0.08)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isToday ? 'rgba(255,107,157,0.25)' : 'rgba(255,255,255,0.07)'}`,
                          }}>
                          {/* Date box */}
                          <div className="rounded-xl p-2 flex flex-col items-center justify-center min-w-[48px]"
                            style={{
                              background: `${block.subjectColor}20`,
                              border: `1px solid ${block.subjectColor}40`,
                            }}>
                            <div className="text-[10px] font-black text-text-muted uppercase">{format(dateObj, 'EEE')}</div>
                            <div className="text-lg font-black" style={{ color: block.subjectColor }}>{format(dateObj, 'd')}</div>
                            <div className="text-[10px] font-bold text-text-muted">{format(dateObj, 'MMM')}</div>
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-white text-sm truncate">{block.chapterName}</div>
                            <div className="text-xs text-text-muted mt-0.5">
                              <span className="font-bold" style={{ color: block.subjectColor }}>{block.subjectName}</span>
                              <span className="mx-1.5 opacity-40">·</span>
                              {block.examName}
                            </div>
                          </div>
                          {/* Duration */}
                          <div className="flex items-center gap-1 text-xs font-bold text-text-muted flex-shrink-0">
                            <Clock size={12} />
                            {block.durationMins}m
                          </div>
                          {isToday && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,107,157,0.2)', color: '#FF6B9D', border: '1px solid rgba(255,107,157,0.3)' }}>
                              TODAY
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
