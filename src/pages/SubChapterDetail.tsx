import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Check, Upload, Trash2, Paperclip, BookOpen, Link2, Tag, X, Folder, FileText, Image as ImageIcon, Layers } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';


function RenderTextWithLinks({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <p className="text-text whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
             className="text-accent underline break-all hover:text-accent-hover transition-colors">{part}</a>
        ) : <span key={i}>{part}</span>
      )}
    </p>
  );
}

export default function SubChapterDetail() {
  const { subjectId, chapterId, subChapterId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();

  const [noteText, setNoteText] = useState('');
  const [noteLabel, setNoteLabel] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [noteMode, setNoteMode] = useState<'text' | 'image' | 'link' | 'pdf'>('text');
  const [labelFilter, setLabelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'image' | 'link' | 'pdf'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: '', description: '', onConfirm: () => {}
  });
  const showConfirm = (title: string, description: string, onConfirm: () => void) =>
    setConfirmState({ open: true, title, description, onConfirm });
  const closeConfirm = () => setConfirmState(s => ({ ...s, open: false }));

  const subject = state.subjects.find(s => s.id === subjectId);
  const chapter = subject?.chapters.find(c => c.id === chapterId);
  const subChapter = chapter?.subChapters?.find(sc => sc.id === subChapterId);

  if (!subject || !chapter || !subChapter) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Sub-chapter not found</h2>
        <button onClick={() => navigate(-1)} className="text-accent hover:underline">Go back</button>
      </div>
    );
  }

  const cycleStatus = () => {
    const order = ['not-started', 'in-progress', 'done'] as const;
    const next = order[(order.indexOf(subChapter.status) + 1) % 3];
    dispatch({ type: 'UPDATE_SUBCHAPTER_STATUS', payload: { subjectId: subject.id, chapterId: chapter.id, subChapterId: subChapter.id, status: next } });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      dispatch({ type: 'ADD_SUBCHAPTER_NOTE', payload: { subjectId: subject.id, chapterId: chapter.id, subChapterId: subChapter.id,
        note: { id: `scn-img-${Date.now()}`, chapterId: subChapter.id, type: 'image', content: event.target?.result as string, label: noteLabel || undefined, createdAt: new Date() }
      }});
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      dispatch({ type: 'ADD_SUBCHAPTER_NOTE', payload: { subjectId: subject.id, chapterId: chapter.id, subChapterId: subChapter.id,
        note: { id: `scn-pdf-${Date.now()}`, chapterId: subChapter.id, type: 'pdf', content: event.target?.result as string, urlTitle: file.name, label: noteLabel || undefined, createdAt: new Date() }
      }});
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNote = () => {
    if (noteMode === 'text' && !noteText.trim()) return;
    if (noteMode === 'image' && !photoUrl) return;
    if (noteMode === 'link' && !linkUrl.trim()) return;
    if (noteMode === 'pdf') return;

    const base = { chapterId: subChapter.id, label: noteLabel.trim() || undefined, createdAt: new Date() };
    let note;
    if (noteMode === 'text') note = { ...base, id: `scn-${Date.now()}`, type: 'text' as const, content: noteText.trim() };
    else if (noteMode === 'image') note = { ...base, id: `scn-img-url-${Date.now()}`, type: 'image' as const, content: photoUrl };
    else note = { ...base, id: `scn-lnk-${Date.now()}`, type: 'link' as const, content: linkUrl.trim(), urlTitle: linkTitle.trim() || linkUrl.trim() };

    dispatch({ type: 'ADD_SUBCHAPTER_NOTE', payload: { subjectId: subject.id, chapterId: chapter.id, subChapterId: subChapter.id, note } });
    setNoteText(''); setPhotoUrl(''); setLinkUrl(''); setLinkTitle(''); setNoteLabel('');
  };

  const handleDeleteNote = (noteId: string) => {
    showConfirm('Delete Note', 'Delete this note?', () => {
      dispatch({ type: 'DELETE_SUBCHAPTER_NOTE', payload: { subjectId: subject.id, chapterId: chapter.id, subChapterId: subChapter.id, noteId } });
    });
  };

  const notes = subChapter.notes || [];
  const allLabels = Array.from(new Set(notes.map(n => n.label).filter(Boolean))) as string[];
  let filteredNotes = notes;
  if (labelFilter) filteredNotes = filteredNotes.filter(n => n.label === labelFilter);
  if (typeFilter !== 'all') filteredNotes = filteredNotes.filter(n => n.type === typeFilter);
  const subjectColor = subject.colour;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate(`/subjects/${subject.id}/chapter/${chapter.id}`)}
        className="glass-card flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-all hover:scale-[1.02] mb-6"
      >
        <ArrowLeft size={15} />
        <span style={{ color: subjectColor }}>{subject.name}</span>
        <span className="opacity-40 mx-1">/</span>
        <span className="text-white">{chapter.name}</span>
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: `${subjectColor}22`, border: `1px solid ${subjectColor}40` }}>
            <Layers size={20} style={{ color: subjectColor }} />
          </div>
          <div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <span style={{ color: subjectColor }}>{subject.name}</span>
              <span className="opacity-30">·</span>
              <span className="text-white">{chapter.name}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">{subChapter.name}</h1>
          </div>
        </div>
        <button
          onClick={cycleStatus}
          className={`px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2 shrink-0 ${
            subChapter.status === 'done' ? 'bg-green/10 border border-green text-green shadow-[0_0_20px_rgba(61,237,122,0.15)]' :
            subChapter.status === 'in-progress' ? 'bg-gold/10 border border-gold text-gold' :
            'glass-card text-text-muted'
          }`}
        >
          {subChapter.status === 'done' && <Check size={18} />}
          {subChapter.status === 'done' ? 'Completed' : subChapter.status === 'in-progress' ? '⏳ In Progress' : '○ Not Started'}
        </button>
      </div>

      {/* Notes Section */}
      <div className="space-y-6">
        {/* Note Input Card */}
        <div className="bg-bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-border">
            {[
              { id: 'text', label: 'Text Note', icon: <FileText size={16} /> },
              { id: 'image', label: 'Image', icon: <ImageIcon size={16} /> },
              { id: 'link', label: 'Link', icon: <Link2 size={16} /> },
              { id: 'pdf', label: 'PDF', icon: <Paperclip size={16} /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setNoteMode(tab.id as any)}
                className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${noteMode === tab.id ? 'text-white border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-white'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="p-4 space-y-3">
            {noteMode === 'text' && (
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Type your notes here..."
                className="w-full bg-transparent text-white placeholder-text-muted resize-none focus:outline-none min-h-[100px] text-sm leading-relaxed" />
            )}
            {noteMode === 'image' && (
              <div className="space-y-3">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm font-bold text-sky hover:text-white bg-sky/10 px-4 py-3 rounded-xl border border-sky/20 hover:border-sky/50 w-full justify-center">
                  <Upload size={16} /> Upload Image
                </button>
                <input type="text" placeholder="Or paste image URL..." value={photoUrl} onChange={e => setPhotoUrl(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
              </div>
            )}
            {noteMode === 'link' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border border-border rounded-xl p-3 bg-bg">
                  <Link2 size={14} className="text-accent" />
                  <input type="text" placeholder="Paste URL..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                    className="bg-transparent text-sm text-white focus:outline-none flex-1" />
                </div>
                <input type="text" placeholder="Link title (optional)" value={linkTitle} onChange={e => setLinkTitle(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
              </div>
            )}
            {noteMode === 'pdf' && (
              <div className="space-y-3">
                <input type="file" ref={pdfInputRef} className="hidden" accept=".pdf,application/pdf" onChange={handlePdfUpload} />
                <button onClick={() => pdfInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm font-bold text-accent hover:text-white bg-accent/10 px-4 py-4 rounded-xl border border-accent/20 hover:border-accent/50 w-full justify-center">
                  <Upload size={16} /> Upload PDF
                </button>
                <p className="text-xs text-text-muted text-center">PDF will be embedded and viewable in this sub-chapter</p>
              </div>
            )}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2 flex-1">
                <Folder size={14} className="text-text-muted" />
                <input type="text" placeholder="Label (optional)" value={noteLabel} onChange={e => setNoteLabel(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none flex-1 placeholder-text-muted" list="sc-note-labels" />
                <datalist id="sc-note-labels">{allLabels.map(l => <option key={l} value={l} />)}</datalist>
              </div>
              <button onClick={handleSaveNote}
                className="bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors">
                Save Note
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 p-4 bg-bg-card border border-border rounded-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest min-w-[50px]">Type:</span>
            {[
              { id: 'all', label: 'All', icon: null },
              { id: 'text', label: 'Text', icon: <FileText size={12} /> },
              { id: 'image', label: 'Images', icon: <ImageIcon size={12} /> },
              { id: 'link', label: 'Links', icon: <Link2 size={12} /> },
              { id: 'pdf', label: 'PDFs', icon: <Paperclip size={12} /> },
            ].map(tf => (
              <button key={tf.id} onClick={() => setTypeFilter(tf.id as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${typeFilter === tf.id ? 'bg-sky text-black border-sky' : 'border-border text-text-muted hover:text-white hover:bg-bg-raised'}`}>
                {tf.icon} {tf.label}
              </button>
            ))}
          </div>
          {allLabels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest min-w-[50px]">Folder:</span>
              <button onClick={() => setLabelFilter('')}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${!labelFilter ? 'bg-accent text-white border-accent' : 'border-border text-text-muted hover:text-white'}`}>
                All
              </button>
              {allLabels.map(label => (
                <button key={label} onClick={() => setLabelFilter(label === labelFilter ? '' : label)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${label === labelFilter ? 'bg-accent text-white border-accent' : 'border-border text-text-muted hover:text-white'}`}>
                  <Folder size={10} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map(note => (
            <div key={note.id} className="bg-bg-raised border border-border rounded-xl p-5 break-words relative group hover:border-text-muted/50 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  {note.label && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-border text-text-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Tag size={8} /> {note.label}
                    </span>
                  )}
                </div>
                <button onClick={() => handleDeleteNote(note.id)}
                  className="text-coral opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-coral/10 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
              {note.type === 'text' && <RenderTextWithLinks text={note.content} />}
              {note.type === 'image' && (
                <a href={note.content} target="_blank" rel="noopener noreferrer">
                  <img src={note.content} alt="Note" className="w-full rounded-lg border border-border/50 hover:opacity-90 transition-opacity" />
                </a>
              )}
              {note.type === 'link' && (
                <a href={note.content} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 bg-bg rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-all group/link">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Link2 size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate group-hover/link:text-accent transition-colors">{note.urlTitle || note.content}</div>
                    <div className="text-xs text-text-muted truncate mt-1">{note.content}</div>
                  </div>
                  <X size={14} className="text-text-muted opacity-0 group-hover/link:opacity-60 flex-shrink-0 mt-1" />
                </a>
              )}
              {note.type === 'pdf' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip size={14} className="text-accent flex-shrink-0" />
                      <span className="text-sm font-bold text-white truncate">{note.urlTitle || 'PDF Document'}</span>
                    </div>
                    <a href={note.content} download={note.urlTitle || 'document.pdf'}
                      className="text-xs font-bold text-sky hover:text-white px-2 py-1 rounded bg-sky/10 hover:bg-sky/20 flex-shrink-0">
                      Download
                    </a>
                  </div>
                  <iframe src={note.content} className="w-full h-64 rounded-xl border border-border" title={note.urlTitle || 'PDF'} />
                </div>
              )}
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="col-span-full py-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-text-muted">
              <BookOpen size={40} className="opacity-20 mb-3" />
              <p className="font-bold">No notes yet.</p>
              <p className="text-sm">Start adding notes for this sub-chapter above.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal isOpen={confirmState.open} title={confirmState.title} description={confirmState.description}
        onConfirm={confirmState.onConfirm} onCancel={closeConfirm} />
    </div>
  );
}
