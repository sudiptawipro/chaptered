import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Home, BookOpen, Calendar as CalendarIcon,
  CalendarDays, CheckSquare, MessageCircleQuestion,
  Timer, GraduationCap, Settings,
  Search, Flame, Smile, Meh, Frown, Library, ExternalLink, Eye,
  BarChart2, Wand2, Sparkles, ClipboardCheck
} from 'lucide-react';
import ChapteredLogo from './ChapteredLogo';
import { useAppContext, initialState } from '../context/AppContext';
import { differenceInDays } from 'date-fns';
import { playSound } from '../hooks/useSound';
import { useToast } from './Toast';

export default function Sidebar() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const { streak = 0, exams = [], profile = initialState.profile } = state || {};
  const [moodPulsed, setMoodPulsed] = useState<string | null>(null);

  const today = new Date();

  // Overdue homework count
  const overdueCount = (state.homework || []).filter(h => {
    if (h.done) return false;
    const due = new Date(h.dueDate);
    return due < new Date(today.setHours(0, 0, 0, 0));
  }).length;

  const upcomingExams = (exams || [])
    .filter(e => e && e.date && new Date(e.date) >= new Date(today.setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nearestExam = upcomingExams[0];
  const daysToExam = nearestExam ? Math.ceil(differenceInDays(new Date(nearestExam.date), new Date())) : null;

  const handleMood = (mood: 'happy' | 'neutral' | 'stressed') => {
    dispatch({ type: 'LOG_MOOD', payload: { date: new Date(), mood } });
    playSound('mood');
    setMoodPulsed(mood);
    const msg = mood === 'happy' ? '😊 Great vibes! Keep it up!' : mood === 'neutral' ? '😐 Hang in there!' : '💪 You got this — take a breath!';
    toast(msg, mood === 'stressed' ? 'info' : 'success');
    setTimeout(() => setMoodPulsed(null), 600);
  };

  const getMoodColor = (mood: 'happy' | 'neutral' | 'stressed') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const loggedToday = (state.moodLog || []).find(m => {
       try { return new Date(m.date).toISOString().split('T')[0] === todayStr; } catch { return false; }
    });

    if (loggedToday?.mood === mood) {
      return mood === 'happy' ? 'text-green drop-shadow-[0_0_8px_rgba(61,237,122,0.8)]'
           : mood === 'neutral' ? 'text-gold drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
           : 'text-coral drop-shadow-[0_0_8px_rgba(255,107,107,0.8)]';
    }
    return 'text-text-muted hover:scale-110';
  };

  return (
    <aside className="w-[240px] bg-bg-sidebar h-screen fixed left-0 top-0 flex flex-col z-40"
      style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>

      {/* App Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <ChapteredLogo size={34} className="shadow-lg drop-shadow-[0_0_10px_rgba(255,107,157,0.5)] animate-pulse-glow" />
          <h1 className="font-bold text-xl tracking-tight text-white mb-0">Chaptered</h1>
        </div>

        {/* Global Search */}
        <button
          onClick={() => window.dispatchEvent(new Event('open-search'))}
          className="w-full flex items-center transition-all rounded-lg px-3 py-2 text-sm hover:scale-[1.02]"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: 'var(--text-muted)',
          }}
        >
          <Search size={16} className="mr-2" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* User Profile */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Link to="/settings" className="flex items-center gap-3 mb-3 hover:bg-white/5 p-2 -ml-2 rounded-xl transition-colors cursor-pointer group">
          {profile?.avatarUrl ? (
             <img src={profile.avatarUrl} alt={profile.name} className="w-10 h-10 rounded-full border object-cover group-hover:border-accent transition-colors" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
          ) : (
             <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform shadow-md shadow-accent/30">{profile?.name?.charAt(0) || 'A'}</div>
          )}
          <div className="overflow-hidden">
            <div className="font-semibold text-white text-sm truncate">{profile?.name || 'Aaryana'}</div>
            <div className="text-xs text-text-muted truncate">{profile?.targetGrade} • {profile?.targetCurriculum}</div>
          </div>
        </Link>

        {/* Dynamic Chips */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <Flame size={14} className="text-gold animate-fire" fill="currentColor" />
            <span className="text-xs font-bold text-gold">{streak} Day Streak</span>
          </div>

          {nearestExam && daysToExam !== null && (
            <div className={`flex items-center gap-2 w-fit px-3 py-1.5 rounded-full ${
              daysToExam <= 7 ? 'text-coral' : daysToExam <= 14 ? 'text-orange-400' : 'text-text-muted'
            }`}
            style={{
              background: daysToExam <= 7 ? 'rgba(255,107,107,0.1)' : daysToExam <= 14 ? 'rgba(251,146,60,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${daysToExam <= 7 ? 'rgba(255,107,107,0.3)' : daysToExam <= 14 ? 'rgba(251,146,60,0.25)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              <Timer size={14} />
              <span className="text-xs font-bold truncate max-w-[140px]">
                {daysToExam <= 0 ? 'Exam Today!' : `${daysToExam} days left`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5 no-scrollbar">
        <div className="text-[10px] font-bold text-text-muted mb-2 px-3 tracking-widest uppercase opacity-60">Menu</div>
        {[
          { name: 'Dashboard', path: '/', icon: Home },
          { name: 'Subjects', path: '/subjects', icon: BookOpen },
          { name: 'Planner', path: '/planner', icon: CalendarDays },
          { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
          { name: 'Homework', path: '/homework', icon: CheckSquare, badge: overdueCount },
          { name: 'Attendance', path: '/attendance', icon: ClipboardCheck },
          { name: 'Doubt Bank', path: '/doubts', icon: MessageCircleQuestion },
          { name: 'Focus Timer', path: '/timer', icon: Timer },
          { name: 'Exams', path: '/exams', icon: GraduationCap },
          { name: 'Analytics', path: '/analytics', icon: BarChart2 },
          { name: 'Revision Plan', path: '/revision', icon: Wand2 },
          { name: 'Mock Exam', path: '/mock-exam', icon: Sparkles },
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive ? 'text-accent animate-tab-slide' : 'text-text-muted hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'rgba(255,107,157,0.12)',
              border: '1px solid rgba(255,107,157,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            } : {}}
          >
            <item.icon size={18} />
            <span className="flex-1">{item.name}</span>
            {item.badge && item.badge > 0 ? (
              <span className="ml-auto bg-coral text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight animate-pulse-glow">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}

        {/* External */}
        <a
          href="https://notebooklm.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-text-muted hover:text-white hover:bg-white/5"
        >
          <Library size={18} />
          Notebook LM
          <ExternalLink size={13} className="ml-auto opacity-40" />
        </a>

        {/* Parent View — separate section */}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] font-bold text-text-muted mb-2 px-3 tracking-widest uppercase opacity-60">For Parents</div>
          <NavLink
            to="/parent"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive ? 'text-sky' : 'text-text-muted hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'rgba(103,232,249,0.10)',
              border: '1px solid rgba(103,232,249,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            } : {}}
          >
            <Eye size={18} />
            Parent View
          </NavLink>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Mood Check-in */}
        <div className="rounded-xl p-3 mb-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 text-center opacity-70">How are you feeling?</div>
          <div className="flex justify-between px-2">
            {(['happy', 'neutral', 'stressed'] as const).map(mood => {
              const Icon = mood === 'happy' ? Smile : mood === 'neutral' ? Meh : Frown;
              const isPulsing = moodPulsed === mood;
              return (
                <button
                  key={mood}
                  onClick={() => handleMood(mood)}
                  className={`transition-all text-lg hover:animate-wiggle ${getMoodColor(mood)} ${isPulsing ? 'animate-bounce-in' : ''}`}
                >
                  <Icon size={22} />
                </button>
              );
            })}
          </div>
        </div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isActive ? 'text-accent' : 'text-text-muted hover:text-white hover:bg-white/5'
            }`
          }
          style={({ isActive }) => isActive ? {
            background: 'rgba(255,107,157,0.12)',
            border: '1px solid rgba(255,107,157,0.18)',
          } : {}}
        >
          <Settings size={18} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
