import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { Timer, Smile, Meh, Frown, ChevronDown, Settings, Shield, Save, Loader2 } from 'lucide-react';
import { useAppContext, initialState } from '../context/AppContext';
import { playSound } from '../hooks/useSound';
import { useToast } from './Toast';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Burning midnight oil';
}

export default function TopBar({ isSaving, lastSaveTime }: { isSaving?: boolean; lastSaveTime?: Date | null }) {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { exams = [], profile = initialState.profile } = state || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Nearest upcoming exam
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const upcoming = (exams || [])
    .filter(e => e?.date && new Date(e.date) >= todayStart)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextExam = upcoming[0];
  const daysLeft = nextExam ? Math.ceil(differenceInDays(new Date(nextExam.date), new Date())) : null;

  // Today's mood
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMood = (state.moodLog || []).find(m => {
    try { return new Date(m.date).toISOString().split('T')[0] === todayStr; } catch { return false; }
  })?.mood ?? null;

  const cycleMood = () => {
    const order = ['happy', 'neutral', 'stressed'] as const;
    const next = todayMood === null ? 'happy' : order[(order.indexOf(todayMood as typeof order[number]) + 1) % 3];
    dispatch({ type: 'LOG_MOOD', payload: { date: new Date(), mood: next } });
    playSound('mood');
    const msgs = { happy: '😊 Good vibes locked in!', neutral: '😐 Hang in there!', stressed: '💪 You got this!' };
    toast(msgs[next], next === 'stressed' ? 'info' : 'success');
  };

  const MoodDot = () => {
    const Icon = todayMood === 'happy' ? Smile : todayMood === 'neutral' ? Meh : todayMood === 'stressed' ? Frown : Smile;
    const colorClass = todayMood === 'happy' ? 'text-green' : todayMood === 'neutral' ? 'text-gold' : todayMood === 'stressed' ? 'text-coral' : 'text-text-muted opacity-40';
    return (
      <button
        onClick={cycleMood}
        title="Log mood"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all hover:scale-110 ${colorClass}`}
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Icon size={15} />
        <span className="text-[11px] font-bold capitalize">{todayMood ?? 'Mood'}</span>
      </button>
    );
  };

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-2.5"
      style={{
        background: 'rgba(15,14,23,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        marginLeft: '-32px',
        marginRight: '-32px',
        marginTop: '-32px',
        marginBottom: '24px',
        paddingLeft: '32px',
        paddingRight: '32px',
      }}
    >
      {/* Left: greeting + save indicator */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-white">
          {greeting()}, <span className="text-accent">{profile?.name?.split(' ')[0] || 'Aaryana'}</span>
        </span>
        {isSaving ? (
          <span className="flex items-center gap-1 text-[10px] text-text-muted">
            <Loader2 size={11} className="animate-spin" /> Saving…
          </span>
        ) : lastSaveTime ? (
          <span className="flex items-center gap-1 text-[10px] text-text-muted">
            <Save size={11} /> Saved
          </span>
        ) : null}
      </div>

      {/* Right: exam chip + mood + avatar dropdown */}
      <div className="flex items-center gap-2">
        {/* Exam countdown chip */}
        {nextExam && daysLeft !== null && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer hover:scale-105 transition-transform ${
              daysLeft <= 3 ? 'text-coral' : daysLeft <= 7 ? 'text-orange-400' : daysLeft <= 14 ? 'text-gold' : 'text-text-muted'
            }`}
            style={{
              background: daysLeft <= 3 ? 'rgba(255,107,107,0.12)' : daysLeft <= 7 ? 'rgba(251,146,60,0.1)' : daysLeft <= 14 ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${daysLeft <= 3 ? 'rgba(255,107,107,0.35)' : daysLeft <= 7 ? 'rgba(251,146,60,0.25)' : daysLeft <= 14 ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.08)'}`,
            }}
            onClick={() => navigate('/subjects')}
          >
            <Timer size={12} />
            {daysLeft <= 0 ? 'Exam today!' : `${daysLeft}d — ${nextExam.name}`}
          </div>
        )}

        {/* Mood dot */}
        <MoodDot />

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/5 transition-colors"
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-7 h-7 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold shadow-md shadow-accent/30">
                {profile?.name?.charAt(0) || 'A'}
              </div>
            )}
            <ChevronDown size={13} className={`text-text-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden shadow-2xl z-50"
              style={{ background: 'rgba(22,20,35,0.97)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="text-sm font-bold text-white">{profile?.name || 'Aaryana'}</div>
                <div className="text-[11px] text-text-muted">{profile?.targetGrade} · {profile?.targetCurriculum}</div>
              </div>
              {[
                { label: 'Profile & Settings', icon: <Settings size={14} />, path: '/settings' },
                { label: 'Parent View', icon: <Shield size={14} />, path: '/parent' },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
