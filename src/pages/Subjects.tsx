import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, ChevronUp, FileText, Edit, Trash2 } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import ColorPicker from '../components/ColorPicker';
import EmojiPicker from '../components/EmojiPicker';
import SubjectIcon from '../components/SubjectIcon';
import type { Subject } from '../context/AppContext';

export default function Subjects() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  
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

  // Chapter Modal States
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [targetSubjectId, setTargetSubjectId] = useState<string>('');
  const [newChapName, setNewChapName] = useState('');
  
  const openAddSubject = () => {
    setEditingSubject(null);
    setSubName('');
    setSubColor('#3B82F6');
    setSubIcon('GraduationCap');
    setIsSubjectModalOpen(true);
  };

  const openEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubName(sub.name);
    setSubColor(sub.colour);
    setSubIcon(sub.icon);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = () => {
    if (!subName.trim()) return;
    if (editingSubject) {
      dispatch({
        type: 'EDIT_SUBJECT',
        payload: { ...editingSubject, name: subName, colour: subColor, icon: subIcon }
      });
    } else {
      dispatch({
        type: 'ADD_SUBJECT',
        payload: {
          id: `sub-${Date.now()}`,
          name: subName,
          colour: subColor,
          icon: subIcon,
          chapters: []
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

  const handleAddChapter = () => {
    if (!newChapName.trim() || !targetSubjectId) return;
    dispatch({
      type: 'ADD_CHAPTER',
      payload: {
        id: `chap-${Date.now()}`,
        subjectId: targetSubjectId,
        name: newChapName,
        source: 'school',
        status: 'not-started',
        notes: [],
        flashcards: [],
        formulas: []
      }
    });
    setNewChapName('');
    setIsAddChapterOpen(false);
  };

  const handleDeleteChapter = (subjectId: string, chapterId: string, name: string) => {
    showConfirm(
      'Delete Chapter',
      `Delete chapter "${name}"? All its notes, flashcards, and formulas will be lost.`,
      () => dispatch({ type: 'DELETE_CHAPTER', payload: { subjectId, chapterId } })
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.subjects.map(sub => {
          const isExpanded = expandedSubjectId === sub.id;
          const doneChaps = sub.chapters.filter(c => c.status === 'done').length;
          const subProgress = sub.chapters.length > 0 ? (doneChaps / sub.chapters.length) * 100 : 0;

          return (
            <div key={sub.id} className="col-span-1 border border-border rounded-2xl bg-bg-card overflow-hidden transition-all shadow-sm flex flex-col group/card hover:border-text-muted/30">
              {/* Card Header Strip */}
              <div className="h-2.5 w-full transition-colors" style={{ backgroundColor: sub.colour }} />
              
              <div className="p-6 cursor-pointer" onClick={() => setExpandedSubjectId(isExpanded ? null : sub.id)}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-transform group-hover/card:scale-110" style={{ backgroundColor: `${sub.colour}20`, border: `1px solid ${sub.colour}40` }}>
                      <SubjectIcon name={sub.icon} size={28} color={sub.colour} />
                    </div>
                    <div>
                      <div className="font-bold text-2xl text-white tracking-tight">{sub.name}</div>
                      <div className="text-sm font-medium text-text-muted mt-1">{doneChaps} of {sub.chapters.length} chapters done</div>
                    </div>
                  </div>
                </div>

                <ProgressBar progress={subProgress} color={sub.colour} height={8} />

                <div className="mt-6 flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditSubject(sub); }} 
                      className="text-text-muted hover:text-white p-2 bg-bg hover:bg-bg-raised border border-transparent hover:border-border rounded-lg transition-colors shadow-sm"
                      title="Edit Subject"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(sub.id, sub.name); }} 
                      className="text-text-muted hover:text-coral p-2 bg-bg hover:bg-coral/10 border border-transparent hover:border-coral/20 rounded-lg transition-colors shadow-sm"
                      title="Delete Subject"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <button className="text-sm font-bold flex items-center gap-1 transition-all hover:scale-105" style={{ color: sub.colour }}>
                    {isExpanded ? 'Hide Chapters' : 'View Chapters'} 
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="border-t border-border bg-bg-raised p-5 flex flex-col gap-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Chapters</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTargetSubjectId(sub.id); setIsAddChapterOpen(true); }}
                      className="text-xs font-bold text-white bg-accent/20 hover:bg-accent text-accent hover:text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 border border-accent/20 hover:border-accent"
                    >
                      <Plus size={14} /> Add New
                    </button>
                  </div>
                  
                  {sub.chapters.length === 0 ? (
                    <div className="text-sm text-text-muted text-center py-6 border border-dashed border-border rounded-xl">No chapters added yet.</div>
                  ) : (
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {sub.chapters.map(chap => (
                        <div 
                          key={chap.id} 
                          onClick={() => navigate(`/subjects/${sub.id}/chapter/${chap.id}`)}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-bg-card hover:bg-bg-raised cursor-pointer transition-all group"
                          style={{ borderLeftWidth: '3px', borderLeftColor: chap.status === 'done' ? '#3DED7A' : chap.status === 'in-progress' ? '#FBBF24' : '#1E1E1E' }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">{chap.name}</div>
                            {chap.source !== 'both' && (
                              <span className="text-[9px] uppercase font-black text-text-muted bg-border px-1.5 py-0.5 rounded flex-shrink-0 tracking-wider">
                                {chap.source}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <div className="flex items-center gap-3 text-text-muted bg-bg px-3 py-1.5 rounded-lg border border-border group-hover:bg-bg-card transition-colors">
                              <div className="flex items-center gap-1.5 text-xs font-bold" title="Notes"><FileText size={14} className={chap.notes.length > 0 ? 'text-blue-400' : 'opacity-40'} /> {chap.notes.length}</div>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteChapter(sub.id, chap.id, chap.name); }}
                              className="p-1.5 bg-bg hover:bg-coral/20 text-text-muted hover:text-coral rounded-lg border border-transparent hover:border-coral/20 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

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

          <div className="pt-4 border-t border-border">
            <button 
              onClick={handleSaveSubject}
              className="w-full bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] shadow-xl shadow-accent/20"
            >
              {editingSubject ? "Save Changes" : "Create Subject"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Chapter Modal */}
      <Modal isOpen={isAddChapterOpen} onClose={() => setIsAddChapterOpen(false)} title="Add New Chapter">
        <div className="space-y-5 pt-2">
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Chapter Name</label>
            <input
              type="text"
              value={newChapName}
              onChange={e => setNewChapName(e.target.value)}
              className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-accent transition-colors shadow-inner"
              placeholder="e.g. Thermodynamics"
            />
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={handleAddChapter}
              className="w-full bg-white hover:bg-gray-200 text-black py-3.5 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] shadow-xl shadow-white/10"
            >
              Add Chapter
            </button>
          </div>
        </div>
      </Modal>

      {/* Standalone Pickers Mounted on top */}
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
