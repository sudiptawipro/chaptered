import { useState, useRef } from 'react';
import { User, Database, Sliders, X, Plus, Lock, TrendingUp, ShieldAlert, Zap, BarChart2, Palette, Sun, Moon, Volume2, VolumeX, Key, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { state, dispatch } = useAppContext();
  const { theme, setTheme, soundEnabled, setSoundEnabled } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLocked, setIsLocked] = useState(true);
  const [claudeApiKey, setClaudeApiKey] = useState(localStorage.getItem('chaptered-gemini-api-key') || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(localStorage.getItem('chaptered-openai-api-key') || '');
  const [anthropicApiKey, setAnthropicApiKey] = useState(localStorage.getItem('chaptered-anthropic-api-key') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const CORRECT_PIN = '0000';

  // Toasts
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Profile forms
  const [formName, setFormName] = useState(state.profile?.name || '');
  const [formCurr, setFormCurr] = useState(state.profile?.targetCurriculum || '');
  const [formGrade, setFormGrade] = useState(state.profile?.targetGrade || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      dispatch({ type: 'UPDATE_PROFILE', payload: { avatarUrl: base64 } });
      showToast('Avatar updated!');
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    dispatch({ type: 'UPDATE_PROFILE', payload: { name: formName } });
    showToast('Name saved!');
  };

  const saveAcademic = () => {
    dispatch({ type: 'UPDATE_PROFILE', payload: { targetCurriculum: formCurr, targetGrade: formGrade } });
    showToast('Academic profile saved!');
  };

  // Configuration state — tag-based
  const [examTypes, setExamTypes] = useState<string[]>(state.examTypes || []);
  const [eventTypes, setEventTypes] = useState<string[]>(state.eventTypes || []);
  const [doubtCats, setDoubtCats] = useState<string[]>(state.doubtCategories || []);
  const [blockTypes, setBlockTypes] = useState<string[]>(state.blockTypes || []);
  const [newExamType, setNewExamType] = useState('');
  const [newEventType, setNewEventType] = useState('');
  const [newDoubtCat, setNewDoubtCat] = useState('');
  const [newBlockType, setNewBlockType] = useState('');

  const addTag = (list: string[], setList: (v: string[]) => void, val: string, setVal: (v: string) => void) => {
    const trimmed = val.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setVal('');
  };
  const removeTag = (list: string[], setList: (v: string[]) => void, idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const saveConfigs = () => {
    dispatch({ type: 'UPDATE_CONFIG', payload: { type: 'examTypes', data: examTypes } });
    dispatch({ type: 'UPDATE_CONFIG', payload: { type: 'eventTypes', data: eventTypes } });
    dispatch({ type: 'UPDATE_CONFIG', payload: { type: 'doubtCategories', data: doubtCats } });
    dispatch({ type: 'UPDATE_CONFIG', payload: { type: 'blockTypes', data: blockTypes } });
    showToast('Configurations saved!');
  };

  // Data Sync Form
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "chaptered_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully.');
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        dispatch({ type: 'SET_INITIAL_STATE', payload: json });
        showToast('Data imported successfully!');
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const resetData = () => {
    if (window.confirm("Are you sure you want to completely erase all data? This cannot be undone.")) {
      dispatch({ type: 'RESET_DATA' });
      showToast('Data reset to default state.');
    }
  };

  const resetStreak = () => {
    if (window.confirm("Are you sure you want to reset the current streak to 0?")) {
      dispatch({ type: 'SET_INITIAL_STATE', payload: { ...state, streak: 0 } });
      showToast('Streak reset successfully.');
    }
  };

  if (isLocked) {
    return (
      <div className="max-w-md mx-auto pt-20 pb-12 text-center">
        <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-accent/20">
          <Lock size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Parent / Admin Area</h1>
        <p className="text-text-muted mb-8 text-sm">Please enter the master PIN to access settings and analytics.</p>
        
        <form onSubmit={e => {
          e.preventDefault();
          if (pinInput === CORRECT_PIN) setIsLocked(false);
          else { alert('Incorrect PIN'); setPinInput(''); }
        }}>
           <input 
             type="password" 
             value={pinInput} 
             onChange={e => setPinInput(e.target.value)} 
             placeholder="Enter PIN (Hint: 0000)" 
             className="w-full bg-bg-card border-2 border-border rounded-xl px-4 py-4 text-center text-white text-xl tracking-[0.5em] font-mono outline-none focus:border-accent shadow-inner transition-colors mb-4"
             autoFocus
           />
           <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-bold transition-transform hover:scale-[1.02] shadow-lg shadow-accent/20">Unlock Settings</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 relative">
      <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>

      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-accent text-white px-6 py-3 rounded-xl shadow-lg font-bold animate-in fade-in slide-in-from-top-4">
          {toastMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Settings Navigation */}
        <div className="col-span-1 space-y-2">
           {[
             { id: 'overview', icon: <BarChart2 size={18} />, label: 'Overview' },
             { id: 'appearance', icon: <Palette size={18} />, label: 'Appearance' },
             { id: 'profile', icon: <User size={18} />, label: 'Profile' },
             { id: 'ai', icon: <Key size={18} />, label: 'AI Settings' },
             { id: 'configs', icon: <Sliders size={18} />, label: 'Configurations' },
             { id: 'data', icon: <Database size={18} />, label: 'Data & Sync' },
           ].map((tab) => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === tab.id ? 'bg-bg-raised text-white border border-border' : 'text-text-muted hover:text-white hover:bg-bg-raised'}`}
             >
               {tab.icon} {tab.label}
             </button>
           ))}
           <div className="pt-4 mt-4 border-t border-border opacity-50">
             <div className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">
               Personal Offline Mode
             </div>
           </div>
        </div>

        {/* Content */}
        <div className="col-span-1 md:col-span-2 space-y-6">

          {activeTab === 'overview' && (
            <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
               <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><TrendingUp size={20} className="text-accent" /> High-Level Overview</h2>
               <p className="text-sm text-text-muted mb-8">Quick insights into Aaryana's overall academic standing.</p>

               <div className="space-y-6">
                 {/* Exam Readiness */}
                 <div className="bg-bg border border-border rounded-xl p-5">
                   <h3 className="font-bold text-white text-sm uppercase tracking-widest mb-4">Exam Readiness</h3>
                   {state.exams.length === 0 ? (
                     <div className="text-text-muted text-sm text-center py-4">No upcoming exams tracked.</div>
                   ) : (
                     <div className="space-y-3">
                       {state.exams.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(ex => {
                          const sub = state.subjects.find(s => s.id === ex.subjectId);
                          const syllabusChapters = sub?.chapters.filter(c => ex.linkedChapterIds.includes(c.id)) || [];
                          const compChapters = syllabusChapters.filter(c => c.status === 'done').length;
                          const progress = syllabusChapters.length > 0 ? Math.round((compChapters / syllabusChapters.length) * 100) : 0;
                          return (
                            <div key={ex.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                               <div>
                                 <div className="text-white font-bold">{ex.name} <span className="text-text-muted text-xs font-normal">({new Date(ex.date).toLocaleDateString()})</span></div>
                                 <div className="text-xs font-bold mt-1" style={{ color: sub?.colour || '#8A8070' }}>{sub?.name || 'Unknown'}</div>
                               </div>
                               <div className="flex items-center gap-3">
                                 <div className="w-24 h-2 bg-black/20 rounded-full overflow-hidden">
                                   <div className={`h-full ${progress >= 80 ? 'bg-green' : progress >= 40 ? 'bg-gold' : 'bg-coral'}`} style={{ width: `${progress}%` }} />
                                 </div>
                                 <div className="text-xs font-mono font-bold w-10 text-right text-white">{progress}%</div>
                               </div>
                            </div>
                          );
                       })}
                     </div>
                   )}
                 </div>

                 {/* Focus Insights (Mini placeholder) */}
                 <div className="bg-bg border border-border rounded-xl p-5 flex items-center gap-4">
                   <div className="w-12 h-12 bg-sky/10 text-sky rounded-lg flex items-center justify-center text-xl shadow-inner"><Zap size={24} /></div>
                   <div className="flex-1">
                     <h3 className="font-bold text-white text-sm uppercase tracking-widest mb-1">Focus Time Tracked</h3>
                     <p className="text-sm text-text-muted">Total recorded deep work: <strong className="text-white">{Math.round((state.studySessions || []).reduce((acc, s) => acc + s.duration, 0) / 60)} hours</strong></p>
                   </div>
                 </div>
               </div>
            </div>
          )}
          
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Palette size={20} className="text-accent" /> Appearance</h2>
                <p className="text-sm text-text-muted mb-6">Choose how Chaptered looks and feels.</p>

                {/* Theme selector */}
                <div className="mb-8">
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'dark', label: 'Dark Mode', desc: 'Deep night — easier on the eyes', icon: <Moon size={22} />, color: '#8B5CF6' },
                      { id: 'light', label: 'Day Mode', desc: 'Bright & fresh for daytime study', icon: <Sun size={22} />, color: '#FBBF24' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setTheme(opt.id as 'dark' | 'light')}
                        className={`p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${theme === opt.id ? 'border-accent shadow-lg' : 'border-border hover:border-text-muted/40'}`}
                        style={theme === opt.id ? { background: `${opt.color}10`, borderColor: opt.color, boxShadow: `0 0 20px ${opt.color}20` } : { background: 'rgba(255,255,255,0.03)' }}
                      >
                        <div className="mb-3" style={{ color: opt.color }}>{opt.icon}</div>
                        <div className="font-bold text-white text-sm mb-1">{opt.label}</div>
                        <div className="text-[11px] text-text-muted">{opt.desc}</div>
                        {theme === opt.id && <div className="mt-2 text-[10px] font-black uppercase tracking-widest" style={{ color: opt.color }}>● Active</div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound toggle */}
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3">Sound Effects</label>
                  <div className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      {soundEnabled ? <Volume2 size={20} className="text-green" /> : <VolumeX size={20} className="text-text-muted" />}
                      <div>
                        <div className="text-white font-bold text-sm">UI Sounds</div>
                        <div className="text-[11px] text-text-muted">Chimes, pops, and completion sounds</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-200 ${soundEnabled ? 'bg-green' : 'bg-border'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${soundEnabled ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-black text-text-muted uppercase tracking-widest mb-4">Colour Palette Preview</h3>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { name: 'Accent', color: 'var(--accent)' },
                    { name: 'Gold', color: 'var(--gold)' },
                    { name: 'Green', color: 'var(--green)' },
                    { name: 'Coral', color: 'var(--coral)' },
                    { name: 'Sky', color: 'var(--sky)' },
                    { name: 'Purple', color: 'var(--purple)' },
                  ].map(c => (
                    <div key={c.name} className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl shadow-md" style={{ backgroundColor: c.color }} />
                      <span className="text-[10px] font-bold text-text-muted">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <>
              <div className="bg-bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Profile Details</h2>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full bg-accent text-white flex items-center justify-center text-4xl font-bold shadow-lg shadow-accent/20 overflow-hidden bg-cover bg-center" style={{ backgroundImage: state.profile?.avatarUrl ? `url(${state.profile.avatarUrl})` : 'none' }}>
                    {!state.profile?.avatarUrl && (state.profile?.name?.charAt(0) || 'A')}
                  </div>
                  <div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    <button onClick={() => fileInputRef.current?.click()} className="bg-bg-raised hover:bg-border text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors mb-2">
                       Change Avatar
                    </button>
                    <p className="text-xs text-text-muted">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">Display Name</label>
                      <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white focus:border-accent outline-none font-medium" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button onClick={saveProfile} className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-accent/20">Save Profile</button>
                  </div>
                </div>
              </div>
              
              <div className="bg-bg-card border border-border rounded-2xl p-6">
                 <h2 className="text-xl font-bold text-white mb-2">Academic Profile</h2>
                 <p className="text-sm text-text-muted mb-6">Set your curriculum and target grade level.</p>
                 
                 <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-text-muted mb-2">Curriculum</label>
                      <select value={formCurr} onChange={e => setFormCurr(e.target.value)} className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-accent font-medium">
                        <option>IGCSE</option>
                        <option>IB MYP</option>
                        <option>CBSE</option>
                        <option>Other</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-text-muted mb-2">Grade Level</label>
                       <select value={formGrade} onChange={e => setFormGrade(e.target.value)} className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-accent font-medium">
                        <option>Year 8</option>
                        <option>Year 9</option>
                        <option>Year 10</option>
                        <option>Year 11</option>
                        <option>Year 12</option>
                      </select>
                   </div>
                   <div className="pt-4">
                     <button onClick={saveAcademic} className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-accent/20">Update Academic Profile</button>
                   </div>
                 </div>
              </div>
            </>
          )}

          {activeTab === 'ai' && (
            <div className="bg-bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Key size={20} className="text-gold" /> AI Settings
              </h2>
              <p className="text-sm text-text-muted mb-6">
                Configure your Claude API key for AI-powered features like Mock Exam generation.
              </p>

              <div className="bg-bg border border-border rounded-2xl p-5 mb-5">
                <h3 className="font-bold text-white text-sm mb-1">Google Gemini API Key</h3>
                <p className="text-xs text-text-muted mb-4">
                  Your key is stored locally on your device only — never uploaded anywhere except Google's API.
                  Get your key from <span className="text-sky font-bold">aistudio.google.com/apikey</span>.
                </p>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={claudeApiKey}
                      onChange={e => setClaudeApiKey(e.target.value)}
                      placeholder="sk-ant-api03-..."
                      className="w-full bg-bg-raised border border-border rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-gold transition-colors pr-10"
                    />
                    <button
                      onClick={() => setShowApiKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (claudeApiKey.trim()) {
                        localStorage.setItem('chaptered-gemini-api-key', claudeApiKey.trim());
                      } else {
                        localStorage.removeItem('chaptered-gemini-api-key');
                      }
                      showToast(claudeApiKey.trim() ? 'API key saved!' : 'API key removed.');
                    }}
                    className="px-5 py-3 rounded-xl font-black text-sm transition-all hover:scale-105"
                    style={{ background: 'rgba(251,191,36,0.85)', color: '#000' }}
                  >
                    Save
                  </button>
                </div>
                {claudeApiKey && (
                  <div className="flex items-center gap-2 text-xs font-bold text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    API key configured
                  </div>
                )}
                {!claudeApiKey && (
                  <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                    <div className="w-2 h-2 rounded-full bg-text-muted/40" />
                    No API key set — Mock Exam feature will not work
                  </div>
                )}
              </div>

              {/* OpenAI key */}
              <div className="bg-bg border border-border rounded-2xl p-5">
                <h3 className="font-bold text-white text-sm mb-1">OpenAI API Key</h3>
                <p className="text-xs text-text-muted mb-4">
                  For future GPT-powered features. Get your key from <span className="text-sky font-bold">platform.openai.com/api-keys</span>.
                </p>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type={showOpenaiKey ? 'text' : 'password'}
                      value={openaiApiKey}
                      onChange={e => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-bg-raised border border-border rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-sky transition-colors pr-10"
                    />
                    <button onClick={() => setShowOpenaiKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
                      {showOpenaiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (openaiApiKey.trim()) {
                        localStorage.setItem('chaptered-openai-api-key', openaiApiKey.trim());
                        showToast('OpenAI key saved!');
                      } else {
                        localStorage.removeItem('chaptered-openai-api-key');
                        showToast('OpenAI key removed.');
                      }
                    }}
                    className="px-5 py-3 rounded-xl font-black text-sm transition-all hover:scale-105"
                    style={{ background: 'rgba(103,232,249,0.85)', color: '#000' }}
                  >
                    Save
                  </button>
                </div>
                {openaiApiKey && <div className="flex items-center gap-2 text-xs font-bold text-green-400"><div className="w-2 h-2 rounded-full bg-green-400" />OpenAI key configured</div>}
              </div>

              {/* Anthropic / Claude key */}
              <div className="bg-bg border border-border rounded-2xl p-5">
                <h3 className="font-bold text-white text-sm mb-1">Claude (Anthropic) API Key</h3>
                <p className="text-xs text-text-muted mb-4">
                  For future Claude-powered features. Get your key from <span className="text-sky font-bold">console.anthropic.com</span>.
                </p>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type={showAnthropicKey ? 'text' : 'password'}
                      value={anthropicApiKey}
                      onChange={e => setAnthropicApiKey(e.target.value)}
                      placeholder="sk-ant-api03-..."
                      className="w-full bg-bg-raised border border-border rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-accent transition-colors pr-10"
                    />
                    <button onClick={() => setShowAnthropicKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
                      {showAnthropicKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (anthropicApiKey.trim()) {
                        localStorage.setItem('chaptered-anthropic-api-key', anthropicApiKey.trim());
                        showToast('Claude key saved!');
                      } else {
                        localStorage.removeItem('chaptered-anthropic-api-key');
                        showToast('Claude key removed.');
                      }
                    }}
                    className="px-5 py-3 rounded-xl font-black text-sm transition-all hover:scale-105"
                    style={{ background: 'rgba(255,107,157,0.85)', color: '#fff' }}
                  >
                    Save
                  </button>
                </div>
                {anthropicApiKey && <div className="flex items-center gap-2 text-xs font-bold text-green-400"><div className="w-2 h-2 rounded-full bg-green-400" />Claude key configured</div>}
              </div>

              <div className="bg-bg border border-border rounded-xl p-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-widest mb-3">AI Features Status</h3>
                <div className="space-y-2">
                  {[
                    { name: 'AI Mock Exam Generator', desc: 'Uses Gemini Pro to generate questions from PDFs', active: !!claudeApiKey, provider: 'Gemini' },
                    { name: 'GPT-powered features', desc: 'Coming soon — will use OpenAI', active: !!openaiApiKey, provider: 'OpenAI' },
                    { name: 'Claude-powered features', desc: 'Coming soon — will use Anthropic Claude', active: !!anthropicApiKey, provider: 'Claude' },
                  ].map(f => (
                    <div key={f.name} className="flex items-center justify-between py-1">
                      <div>
                        <div className="text-white text-sm font-bold">{f.name}</div>
                        <div className="text-xs text-text-muted">{f.desc}</div>
                      </div>
                      <div className={`text-xs font-black px-2 py-0.5 rounded-full ${f.active ? 'text-green-400 bg-green-400/10' : 'text-text-muted bg-white/5'}`}>
                        {f.active ? 'Ready' : 'Needs Key'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'configs' && (
            <div className="bg-bg-card border border-border rounded-2xl p-6">
               <h2 className="text-xl font-bold text-white mb-2">Configurations</h2>
               <p className="text-sm text-text-muted mb-6">Manage dynamic dropdown options across the app. Click a tag to remove it, or type and press Enter to add one.</p>
               
               <div className="space-y-6">
                 {(
                   [
                     { label: 'Exam Types', list: examTypes, setList: setExamTypes, newVal: newExamType, setNewVal: setNewExamType },
                     { label: 'Event Types', list: eventTypes, setList: setEventTypes, newVal: newEventType, setNewVal: setNewEventType },
                     { label: 'Doubt Categories', list: doubtCats, setList: setDoubtCats, newVal: newDoubtCat, setNewVal: setNewDoubtCat },
                     { label: 'Block Types', list: blockTypes, setList: setBlockTypes, newVal: newBlockType, setNewVal: setNewBlockType },
                   ] as const
                 ).map(({ label, list, setList, newVal, setNewVal }) => (
                   <div key={label}>
                     <label className="block text-sm font-bold text-white mb-3">{label}</label>
                     <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
                       {list.map((tag, i) => (
                         <span key={tag} className="flex items-center gap-1.5 bg-bg-raised border border-border text-white text-xs font-bold px-3 py-1.5 rounded-full">
                           {tag}
                           <button onClick={() => removeTag(list, setList as any, i)} className="text-text-muted hover:text-coral transition-colors"><X size={12} /></button>
                         </span>
                       ))}
                     </div>
                     <div className="flex gap-2">
                       <input
                         value={newVal}
                         onChange={e => setNewVal(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && addTag(list, setList as any, newVal, setNewVal as any)}
                         className="flex-1 bg-bg border border-border rounded-xl px-4 py-2.5 text-white font-medium outline-none focus:border-accent transition-colors text-sm"
                         placeholder={`Add new ${label.toLowerCase().slice(0, -1)}...`}
                       />
                       <button
                         onClick={() => addTag(list, setList as any, newVal, setNewVal as any)}
                         className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold transition-colors"
                       ><Plus size={16} /></button>
                     </div>
                   </div>
                 ))}
                 
                 <div className="pt-4">
                   <button onClick={saveConfigs} className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg shadow-accent/20">Save Configurations</button>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="bg-bg-card border border-border rounded-2xl p-6">
               <h2 className="text-xl font-bold text-white mb-2">Data & Sync</h2>
               <p className="text-sm text-text-muted mb-6">Chaptered uses local offline storage on your computer.</p>
               
               <div className="space-y-6">
                 
                 {/* Storage Status */}
                 <div className="bg-bg p-5 rounded-xl border border-border space-y-3">
                   <h3 className="font-bold text-white flex items-center gap-2">
                     <Database size={16} className="text-sky" /> Storage Status
                   </h3>
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-text-muted">Database State:</span>
                     <span className="text-green font-bold">Connected & Active</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-text-muted">Estimated Size:</span>
                     <span className="text-white font-mono">~{(JSON.stringify(state).length / 1024).toFixed(1)} KB</span>
                   </div>
                   <button 
                    onClick={() => { (window as any).forceChapteredSave?.(); showToast('Full Sync Complete!'); }} 
                    className="w-full mt-2 py-2.5 bg-sky/10 hover:bg-sky/20 border border-sky/30 text-sky text-xs font-bold rounded-lg transition-colors"
                   >
                     Direct Sync to Disk
                   </button>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-bg p-5 rounded-xl border border-border space-y-2">
                      <h3 className="font-bold text-white">Export App Data</h3>
                      <p className="text-xs text-text-muted mb-4 text-balance">Download a backup of all your notes, images, and grades.</p>
                      <button onClick={exportData} className="w-full bg-bg-raised hover:bg-border text-white px-5 py-2.5 rounded-lg text-sm font-bold border border-border transition-colors">
                        Download JSON
                      </button>
                    </div>

                    <div className="bg-bg p-5 rounded-xl border border-border space-y-2">
                      <h3 className="font-bold text-white">Import App Data</h3>
                      <p className="text-xs text-text-muted mb-4 text-balance">Load a backup file to restore your entire school library.</p>
                      <input type="file" accept=".json" id="importFile" className="hidden" onChange={importData} />
                      <label htmlFor="importFile" className="inline-block w-full text-center bg-bg-raised hover:bg-border cursor-pointer text-white px-5 py-2.5 rounded-lg text-sm font-bold border border-border transition-colors">
                        Upload JSON
                      </label>
                    </div>
                 </div>

                 <div className="bg-bg-raised p-5 rounded-xl border border-border space-y-2 mt-8 flex justify-between items-center">
                   <div>
                     <h3 className="font-bold text-white">Reset Current Streak</h3>
                     <p className="text-sm text-text-muted mb-0">Reset the login streak to 0 if it gets out of sync.</p>
                   </div>
                   <button onClick={resetStreak} className="bg-bg hover:bg-border text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm border border-border">
                     Reset Streak
                   </button>
                 </div>

                 <div className="bg-coral/10 p-5 rounded-xl border border-coral/30 space-y-2 mt-4">
                   <h3 className="font-bold text-coral flex items-center gap-2"><ShieldAlert size={16} /> Danger Zone: Reset App</h3>
                   <p className="text-sm text-text-muted mb-4">This will clear all data instantly. This cannot be undone.</p>
                   <button onClick={resetData} className="bg-coral hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-coral/20">
                     Erase All Data
                   </button>
                 </div>

               </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
