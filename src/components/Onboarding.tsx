import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ChapteredLogo from './ChapteredLogo';
import localforage from 'localforage';
import { saveHouseholdCode, isValidCode, codeHasData, pushToCloud, pullFromCloud } from '../utils/cloudSync';

const CURRICULUMS = ['IGCSE', 'IB (MYP)', 'IB (DP)', 'A-Levels', 'CBSE', 'ICSE', 'AP (US)', 'Other'];
const YEARS = ['Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export default function Onboarding() {
  const { state, dispatch } = useAppContext();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [curriculum, setCurriculum] = useState('');

  // Household code step state
  const [codeInput, setCodeInput] = useState('');
  const [codeMode, setCodeMode] = useState<'create' | 'join'>('create');
  const [codeError, setCodeError] = useState('');
  const [codeChecking, setCodeChecking] = useState(false);

  const TOTAL_STEPS = 4;


  const handleCodeStep = async () => {
    const code = codeInput.toUpperCase().trim();
    setCodeError('');

    if (!isValidCode(code)) {
      setCodeError('Use 4–12 letters/numbers (e.g. AARY-HOME)');
      return;
    }

    setCodeChecking(true);
    try {
      const hasCloud = await codeHasData(code);

      if (codeMode === 'join') {
        if (!hasCloud) {
          setCodeError('No data found for this code. Check the code or create a new one.');
          return;
        }
        // Pull cloud data, write to localforage, then reload
        const cloudData = await pullFromCloud(code);
        if (cloudData) {
          await saveHouseholdCode(code);
          await localforage.setItem('chaptered_state', cloudData);
          setTimeout(() => window.location.reload(), 500);
        }
        return;
      } else {
        // Create mode: save code, upload current local data (migration)
        await saveHouseholdCode(code);
        // Push after profile is saved (finish() handles that)
        setStep(step + 1);
      }
    } catch {
      setCodeError('Network error — please try again.');
    } finally {
      setCodeChecking(false);
    }
  };

  const handleFinish = async () => {
    if (!curriculum) return;
    const updatedProfile = { name: name.trim(), targetCurriculum: curriculum, targetGrade: year };
    dispatch({ type: 'UPDATE_PROFILE', payload: updatedProfile });
    // Migration: push existing local data (with new profile) to cloud
    const { getHouseholdCode } = await import('../utils/cloudSync');
    const code = await getHouseholdCode();
    if (code) {
      const merged = { ...state, profile: { ...state.profile, ...updatedProfile } };
      await pushToCloud(code, merged);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0f0f13 0%, #1a0a2e 50%, #0f0f13 100%)' }}>

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FF6B9D, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #863bff, transparent)' }} />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <ChapteredLogo size={64} />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i + 1 === step ? '32px' : '8px', background: i + 1 <= step ? '#FF6B9D' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>

          {/* Step 1 — Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white mb-1">Welcome to Chaptered 👋</h1>
                <p className="text-text-muted text-sm">Your personal study planner. Let's set up your profile.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">Your first name</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
                  placeholder="e.g. Aaryana"
                  className="w-full rounded-xl px-4 py-3 text-white text-lg font-bold outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                />
              </div>
              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="w-full py-3.5 rounded-xl font-black text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #FF6B9D, #863bff)' }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Year */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white mb-1">Hi {name}! 🎓</h1>
                <p className="text-text-muted text-sm">What year or grade are you in?</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className="py-2.5 px-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                    style={{
                      background: year === y ? 'rgba(255,107,157,0.25)' : 'rgba(255,255,255,0.06)',
                      border: year === y ? '1px solid rgba(255,107,157,0.6)' : '1px solid rgba(255,255,255,0.1)',
                      color: year === y ? '#FF6B9D' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-text-muted hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Back</button>
                <button
                  onClick={() => year && setStep(3)}
                  disabled={!year}
                  className="flex-[2] py-3 rounded-xl font-black text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #FF6B9D, #863bff)' }}
                >Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Curriculum */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white mb-1">Almost there! 📚</h1>
                <p className="text-text-muted text-sm">Which curriculum are you following?</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CURRICULUMS.map(c => (
                  <button
                    key={c}
                    onClick={() => setCurriculum(c)}
                    className="py-3 px-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] text-left"
                    style={{
                      background: curriculum === c ? 'rgba(134,59,255,0.25)' : 'rgba(255,255,255,0.06)',
                      border: curriculum === c ? '1px solid rgba(134,59,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
                      color: curriculum === c ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold text-text-muted hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Back</button>
                <button
                  onClick={() => curriculum && setStep(4)}
                  disabled={!curriculum}
                  className="flex-[2] py-3 rounded-xl font-black text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #FF6B9D, #863bff)' }}
                >Continue →</button>
              </div>
            </div>
          )}

          {/* Step 4 — Household Code */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-black text-white mb-1">Sync across devices 🔗</h1>
                <p className="text-text-muted text-sm">Set a household code so parents and students stay in sync. You can also skip and use the app offline only.</p>
              </div>

              {/* Mode toggle */}
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                <button
                  onClick={() => { setCodeMode('create'); setCodeError(''); }}
                  className="flex-1 py-2.5 text-sm font-bold transition-colors"
                  style={{ background: codeMode === 'create' ? 'rgba(255,107,157,0.2)' : 'transparent', color: codeMode === 'create' ? '#FF6B9D' : 'rgba(255,255,255,0.5)' }}
                >
                  Create new code
                </button>
                <button
                  onClick={() => { setCodeMode('join'); setCodeError(''); }}
                  className="flex-1 py-2.5 text-sm font-bold transition-colors"
                  style={{ background: codeMode === 'join' ? 'rgba(134,59,255,0.2)' : 'transparent', color: codeMode === 'join' ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}
                >
                  Join existing code
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">
                  {codeMode === 'create' ? 'Choose your household code' : 'Enter your household code'}
                </label>
                <input
                  autoFocus
                  type="text"
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); }}
                  onKeyDown={e => e.key === 'Enter' && codeInput.trim() && handleCodeStep()}
                  placeholder={codeMode === 'create' ? 'e.g. AARY-HOME' : 'Enter existing code'}
                  maxLength={12}
                  className="w-full rounded-xl px-4 py-3 text-white text-lg font-mono font-bold outline-none tracking-widest uppercase"
                  style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${codeError ? 'rgba(255,100,100,0.5)' : 'rgba(255,255,255,0.15)'}` }}
                />
                {codeMode === 'create' && (
                  <p className="text-[11px] text-text-muted mt-1.5">Share this code with your parent/guardian so they can view your progress.</p>
                )}
                {codeError && <p className="text-[11px] text-red-400 mt-1.5 font-bold">{codeError}</p>}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl font-bold text-text-muted hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Back</button>
                <button
                  onClick={handleCodeStep}
                  disabled={!codeInput.trim() || codeChecking}
                  className="flex-[2] py-3 rounded-xl font-black text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #FF6B9D, #863bff)' }}
                >
                  {codeChecking ? 'Checking…' : codeMode === 'join' ? 'Join & Sync →' : 'Continue →'}
                </button>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-2.5 text-sm text-text-muted hover:text-white transition-colors rounded-xl"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                Skip — use offline only
              </button>
            </div>
          )}

          {/* Step 5 — Confirm (only reached if create mode after code step) */}
          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="text-5xl">🚀</div>
              <div>
                <h1 className="text-2xl font-black text-white mb-2">All set, {name}!</h1>
                <p className="text-text-muted text-sm">Your household code is saved. Share it with your parents so they can follow your progress from their device.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Your Household Code</div>
                <div className="text-2xl font-mono font-black text-white tracking-[0.3em]">{codeInput}</div>
              </div>
              <button
                onClick={handleFinish}
                className="w-full py-3.5 rounded-xl font-black text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #FF6B9D, #863bff)' }}
              >
                Let's go! 🚀
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
