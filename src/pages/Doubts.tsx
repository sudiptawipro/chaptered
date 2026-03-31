import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, CheckCircle2, MessageCircleQuestion, Trash2, Tag, BookOpen, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import SubjectIcon from '../components/SubjectIcon';

export default function Doubts() {
  const { state, dispatch } = useAppContext();
  const [filter, setFilter] = useState<'unresolved' | 'resolved' | 'all'>('unresolved');

  // Safe date helper — prevents crashes from null/string dates in stored data
  const safeDate = (d: any): Date => {
    if (d instanceof Date && !isNaN(d.getTime())) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [dbSub, setDbSub] = useState(state.subjects[0]?.id || '');
  const [dbChap, setDbChap] = useState('');
  const [dbSection, setDbSection] = useState(state.doubtCategories?.[0] || '');
  const [dbQ, setDbQ] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter Doubts directly from state.doubts
  const allDoubts = [...state.doubts].sort((a,b) => safeDate(b.createdAt).getTime() - safeDate(a.createdAt).getTime());

  let filtered = allDoubts;
  if (filter === 'unresolved') filtered = allDoubts.filter(d => !d.resolved);
  if (filter === 'resolved') filtered = allDoubts.filter(d => d.resolved);

  const handleAddDoubt = () => {
    if (!dbSub || !dbQ.trim()) return;
    dispatch({
      type: 'ADD_DOUBT',
      payload: {
        id: `doubt-${Date.now()}`,
        subjectId: dbSub,
        topic: dbChap.trim() || 'General',
        section: dbSection.trim() || undefined,
        question: dbQ.trim(),
        resolved: false,
        createdAt: new Date()
      }
    });
    setDbQ(''); 
    setDbChap('');
    setDbSection(state.doubtCategories?.[0] || '');
    setIsAddOpen(false);
  };

  const handleResolve = (doubtId: string) => {
    dispatch({ type: 'RESOLVE_DOUBT', payload: { doubtId } });
  };

  const handleDelete = (doubtId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(doubtId);
  };

  // Get dynamic chapters based on the selected subject
  const selectedSubjectData = state.subjects.find(s => s.id === dbSub);
  const subjectChapters = selectedSubjectData?.chapters || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <AlertCircle className="text-white" size={24} />
             </div>
             Doubt Tracker
           </h1>
           <p className="text-text-muted mt-3 font-medium">Log your questions so you don't forget to ask them.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-xl shadow-accent/20"
        >
          <Plus size={20} /> Log Question
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 bg-bg-card p-2 rounded-xl border border-border mt-6 w-fit shadow-sm">
        {[
          { id: 'unresolved', label: 'Unresolved' },
          { id: 'resolved', label: 'Resolved' },
          { id: 'all', label: 'All Doubts' }
        ].map(f => (
          <button 
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-6 py-2.5 text-sm font-bold capitalize transition-colors rounded-lg ${filter === f.id ? 'bg-indigo-500 text-white shadow-md' : 'text-text-muted hover:text-white hover:bg-bg-raised'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Doubts List */}
      <div className="space-y-6">
        {filtered.length === 0 && (
          <div className="p-12 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-text-muted gap-4 bg-bg-card shadow-sm">
            <MessageCircleQuestion size={56} className="opacity-30 text-indigo-500" />
            <p className="font-bold text-lg text-white">No doubts found.</p>
            <p className="text-sm">You're completely caught up! Got a burning question?</p>
            <button onClick={() => setIsAddOpen(true)} className="text-accent font-bold hover:underline mt-2">Log it now!</button>
          </div>
        )}
        
        {filtered.map(doubt => {
          const sub = state.subjects.find(s => s.id === doubt.subjectId);
          const subColor = sub?.colour || '#8A8070';

          return (
            <div key={doubt.id} className={`bg-bg-card border border-border rounded-2xl p-6 shadow-sm transition-all group hover:border-text-muted/30 ${doubt.resolved ? 'opacity-90' : ''}`} style={{ borderLeftWidth: '6px', borderLeftColor: subColor }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                 
                 <div className="flex-1 min-w-0">
                   <div className="flex flex-wrap items-center gap-3 mb-3">
                     {sub && (
                       <div className="bg-bg px-2.5 py-1 rounded-lg text-xs font-bold border border-border flex items-center gap-2" style={{ color: subColor }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subColor }} /> <SubjectIcon name={sub.icon} size={14} /> {sub.name}
                       </div>
                     )}
                     <div className="bg-bg px-2.5 py-1 rounded-lg text-xs font-bold border border-border text-text-muted flex items-center gap-1.5">
                        <BookOpen size={12} /> {doubt.topic}
                     </div>
                     {doubt.section && (
                       <div className="bg-bg px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-border text-text-muted flex items-center gap-1.5">
                          <Tag size={12} /> {doubt.section}
                       </div>
                     )}
                   </div>
                   <div className="text-xs font-bold text-text-muted opacity-60 uppercase tracking-widest">{safeDate(doubt.createdAt).toLocaleDateString()}</div>
                 </div>
                 
                 <div className="flex items-center gap-3 shrink-0">
                   <button 
                     onClick={(e) => handleDelete(doubt.id, e)} 
                     className="flex items-center gap-2 px-3 py-2 bg-bg hover:bg-coral/20 text-coral rounded-xl border border-coral/30 hover:border-coral transition-colors"
                     title="Delete Doubt"
                   >
                     <Trash2 size={16} /> <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Delete</span>
                   </button>
                   
                   {doubt.resolved ? (
                     <div className="flex items-center gap-2 px-4 py-2 bg-green/10 text-green rounded-xl text-xs font-black uppercase tracking-widest border border-green/30">
                       <CheckCircle2 size={16} /> Resolved
                     </div>
                   ) : (
                     <button 
                       onClick={() => handleResolve(doubt.id)}
                       className="bg-bg hover:bg-green/20 text-text-muted hover:text-green px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 border border-border hover:border-green/30"
                     >
                       <CheckCircle2 size={16} /> Mark Done
                     </button>
                   )}
                 </div>
              </div>
              
              <p className="text-xl font-bold text-white leading-relaxed bg-bg/50 p-4 rounded-xl border border-border/50">{doubt.question}</p>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log a Doubt">
        <div className="space-y-5 pt-2">
           <div>
             <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Subject</label>
             <select value={dbSub} onChange={e => {
               setDbSub(e.target.value);
               setDbChap('');
             }} className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors">
               <option value="" disabled>Select Subject</option>
               {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Topic / Chapter</label>
               {subjectChapters.length > 0 ? (
                 <select 
                   value={dbChap} 
                   onChange={e => setDbChap(e.target.value)} 
                   className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors"
                 >
                   <option value="">Select Chapter</option>
                   {subjectChapters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                   <option value="General">General / Other</option>
                 </select>
               ) : (
                 <input 
                   type="text"
                   value={dbChap} 
                   onChange={e => setDbChap(e.target.value)} 
                   placeholder="e.g. Force and Motion"
                   className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors"
                 />
               )}
             </div>
             <div>
               <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Section</label>
               <select 
                 value={dbSection} 
                 onChange={e => setDbSection(e.target.value)} 
                 className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors capitalize"
               >
                 {(state.doubtCategories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
             </div>
           </div>

           <div>
             <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Question</label>
             <textarea 
               value={dbQ} 
               onChange={e => setDbQ(e.target.value)} 
               className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white h-32 resize-none font-bold outline-none focus:border-accent transition-colors shadow-inner" 
               placeholder="What are you stuck on? Be specific!"
             />
           </div>
           
           <div className="pt-4 border-t border-border">
             <button onClick={handleAddDoubt} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3.5 rounded-xl font-bold transition-transform hover:scale-[1.02] mt-2 shadow-xl shadow-indigo-500/20 text-lg flex items-center justify-center gap-2">
                <AlertCircle size={20} /> Save Query
             </button>
           </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Doubt"
        description="Are you sure you want to delete this doubt from your tracker?"
        onConfirm={() => { if (confirmDeleteId) dispatch({ type: 'DELETE_DOUBT', payload: confirmDeleteId }); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
