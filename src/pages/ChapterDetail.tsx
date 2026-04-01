import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { SubChapter } from '../context/AppContext';
import { ArrowLeft, Check, Upload, Trash2, Paperclip, BookOpen, Link2, Tag, X, Folder, FileText, Image as ImageIcon, Plus, ChevronRight, Layers } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import SubjectBadge from '../components/SubjectBadge';

// Renders text with auto-detected URLs as clickable links
function RenderTextWithLinks({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <p className="text-text whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
             className="text-accent underline break-all hover:text-accent-hover transition-colors">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

export default function ChapterDetail() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();

  const [noteText, setNoteText] = useState('');
  const [noteLabel, setNoteLabel] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [noteMode, setNoteMode] = useState<'text' | 'image' | 'link' | 'pdf'>('text');
  const [labelFilter, setLabelFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'image' | 'link' | 'pdf'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-chapter state
  const [newSubChapterName, setNewSubChapterName] = useState('');
  const [addingSubChapter, setAddingSubChapter] = useState(false);

  const handleAddSubChapter = () => {
    if (!newSubChapterName.trim() || !subject || !chapter) return;
    const sc: SubChapter = {
      id: `sc-${Date.now()}`,
      chapterId: chapter.id,
      name: newSubChapterName.trim(),
      status: 'not-started',
      notes: [],
    };
    dispatch({ type: 'ADD_SUBCHAPTER', payload: { subjectId: subject.id, chapterId: chapter.id, subChapter: sc } });
    setNewSubChapterName('');
    setAddingSubChapter(false);
  };

  const handleDeleteSubChapter = (scId: string) => {
    if (!subject || !chapter) return;
    showConfirm('Delete Sub-chapter', 'Delete this sub-chapter and all its notes?', () => {
      dispatch({ type: 'DELETE_SUBCHAPTER', payload: { subjectId: subject.id, chapterId: chapter.id, subChapterId: scId } });
    });
  };

  const cycleSubChapterStatus = (sc: SubChapter) => {
    if (!subject || !chapter) return;
    const order = ['not-started', 'in-progress', 'done'] as const;
    const next = order[(order.indexOf(sc.status) + 1) % 3];
    dispatch({ type: 'UPDATE_SUBCHAPTER_STATUS', payload: { subjectId: subject.id, chapterId: chapter.id, subChapterId: sc.id, status: next } });
  };

  // Confirm modal
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: '', description: '', onConfirm: () => {}
  });
  const showConfirm = (title: string, description: string, onConfirm: () => void) =>
    setConfirmState({ open: true, title, description, onConfirm });
  const closeConfirm = () => setConfirmState(s => ({ ...s, open: false }));

  const subject = state.subjects.find(s => s.id === subjectId);
  const chapter = subject?.chapters.find(c => c.id === chapterId);

  if (!subject || !chapter) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Chapter not found</h2>
        <button onClick={() => navigate('/subjects')} className="text-accent hover:underline">Back to Subjects</button>
      </div>
    );
  }

  const cycleStatus = () => {
    const order = ['not-started', 'in-progress', 'done'] as const;
    const next = order[(order.indexOf(chapter.status) + 1) % 3];
    dispatch({ type: 'UPDATE_CHAPTER_STATUS', payload: { subjectId: subject.id, chapterId: chapter.id, status: next }});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      dispatch({
        type: 'ADD_NOTE',
        payload: {
          subjectId: subject.id,
          chapterId: chapter.id,
          note: {
            id: `note-img-${Date.now()}`,
            chapterId: chapter.id,
            type: 'image',
            content: base64,
            label: noteLabel || undefined,
            createdAt: new Date()
          }
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      dispatch({
        type: 'ADD_NOTE',
        payload: {
          subjectId: subject.id,
          chapterId: chapter.id,
          note: {
            id: `note-pdf-${Date.now()}`,
            chapterId: chapter.id,
            type: 'pdf',
            content: base64,
            urlTitle: file.name,
            label: noteLabel || undefined,
            createdAt: new Date()
          }
        }
      });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteNote = (noteId: string) => {
    showConfirm('Delete Note', 'Are you sure you want to delete this note?', () => {
      dispatch({ type: 'DELETE_NOTE', payload: { subjectId: subject.id, chapterId: chapter.id, noteId } });
    });
  };

  const handleSaveNote = () => {
    if (noteMode === 'text' && !noteText.trim()) return;
    if (noteMode === 'image' && !photoUrl) return;
    if (noteMode === 'link' && !linkUrl.trim()) return;
    if (noteMode === 'pdf') return; // PDFs are saved immediately via handlePdfUpload

    const baseNote = {
      chapterId: chapter.id,
      label: noteLabel.trim() || undefined,
      createdAt: new Date()
    };

    let note;
    if (noteMode === 'text') {
      note = { ...baseNote, id: `note-${Date.now()}`, type: 'text' as const, content: noteText.trim() };
    } else if (noteMode === 'image') {
      note = { ...baseNote, id: `note-img-url-${Date.now()}`, type: 'image' as const, content: photoUrl };
    } else {
      note = { ...baseNote, id: `note-link-${Date.now()}`, type: 'link' as const, content: linkUrl.trim(), urlTitle: linkTitle.trim() || linkUrl.trim() };
    }

    dispatch({ type: 'ADD_NOTE', payload: { subjectId: subject.id, chapterId: chapter.id, note } });
    setNoteText('');
    setPhotoUrl('');
    setLinkUrl('');
    setLinkTitle('');
    setNoteLabel('');
  };

  const allLabels = Array.from(new Set(chapter.notes.map(n => n.label).filter(Boolean))) as string[];
  let filteredNotes = chapter.notes;
  if (labelFilter) filteredNotes = filteredNotes.filter(n => n.label === labelFilter);
  if (typeFilter !== 'all') filteredNotes = filteredNotes.filter(n => n.type === typeFilter);

  const subjectColor = subject.colour;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        {/* Back button — glass pill style */}
        <button
          onClick={() => navigate('/subjects')}
          className="glass-card flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-all hover:scale-[1.02] mb-6"
        >
          <ArrowLeft size={15} />
          <span>Subjects</span>
          <span className="opacity-40 mx-1">/</span>
          <span style={{ color: subjectColor }}>{subject.name}</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Subject colour icon */}
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
              style={{ background: `${subjectColor}22`, border: `1px solid ${subjectColor}40` }}>
              <SubjectBadge color={subject.colour} name="" icon={subject.icon} className="text-xl p-0 border-none bg-transparent" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span style={{ color: subjectColor }}>{subject.name}</span>
                <span className="opacity-30">·</span>
                <span className="capitalize">{chapter.source}</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">{chapter.name}</h1>
            </div>
          </div>

          {/* Status cycle button */}
          <button
            onClick={cycleStatus}
            className={`px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2 shrink-0 ${
              chapter.status === 'done' ? 'bg-green/10 border border-green text-green shadow-[0_0_20px_rgba(61,237,122,0.15)]' :
              chapter.status === 'in-progress' ? 'bg-gold/10 border border-gold text-gold' :
              'glass-card text-text-muted'
            }`}
          >
            {chapter.status === 'done' && <Check size={18} />}
            {chapter.status === 'done' ? 'Completed' : chapter.status === 'in-progress' ? '⏳ In Progress' : '○ Not Started'}
          </button>
        </div>
      </div>

      {/* Sub-chapters Section */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-accent" />
            <h2 className="font-black text-white text-sm">Sub-chapters</h2>
            <span className="text-xs font-bold text-text-muted bg-border px-2 py-0.5 rounded-full">
              {(chapter.subChapters || []).length}
            </span>
          </div>
          <button
            onClick={() => setAddingSubChapter(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-accent hover:text-white transition-colors bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-lg"
          >
            <Plus size={13} /> Add Sub-chapter
          </button>
        </div>

        {/* Add sub-chapter input */}
        {addingSubChapter && (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-accent/5">
            <input
              autoFocus
              type="text"
              value={newSubChapterName}
              onChange={e => setNewSubChapterName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddSubChapter(); if (e.key === 'Escape') setAddingSubChapter(false); }}
              placeholder="Sub-chapter name, e.g. Photosynthesis"
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-text-muted"
            />
            <button onClick={handleAddSubChapter} className="text-xs font-black text-white bg-accent px-3 py-1.5 rounded-lg hover:bg-accent-hover transition-colors">Save</button>
            <button onClick={() => { setAddingSubChapter(false); setNewSubChapterName(''); }} className="text-xs font-bold text-text-muted hover:text-white transition-colors px-2 py-1.5">Cancel</button>
          </div>
        )}

        {/* Sub-chapter list */}
        {(chapter.subChapters || []).length === 0 && !addingSubChapter ? (
          <div className="py-8 text-center text-text-muted text-sm">
            No sub-chapters yet — click "Add Sub-chapter" to break this chapter into topics
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(chapter.subChapters || []).map((sc, idx) => (
              <div key={sc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-raised transition-colors group">
                <span className="text-xs font-bold text-text-muted w-5 text-right flex-shrink-0">{idx + 1}</span>
                <button
                  onClick={() => cycleSubChapterStatus(sc)}
                  title="Click to cycle status"
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${
                    sc.status === 'done' ? 'bg-green/20 border-green' :
                    sc.status === 'in-progress' ? 'bg-gold/20 border-gold' :
                    'bg-transparent border-border hover:border-text-muted'
                  }`}
                >
                  {sc.status === 'done' && <Check size={12} className="text-green" />}
                  {sc.status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-gold" />}
                </button>
                <button
                  onClick={() => navigate(`/subjects/${subject.id}/chapter/${chapter.id}/subchapter/${sc.id}`)}
                  className="flex-1 text-left text-sm font-bold text-white hover:text-accent transition-colors truncate"
                >
                  {sc.name}
                </button>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${
                  sc.status === 'done' ? 'bg-green/10 text-green' :
                  sc.status === 'in-progress' ? 'bg-gold/10 text-gold' :
                  'bg-border text-text-muted'
                }`}>
                  {sc.status === 'not-started' ? 'Not Started' : sc.status === 'in-progress' ? 'In Progress' : 'Done'}
                </span>
                <span className="text-xs text-text-muted flex-shrink-0">{(sc.notes || []).length} notes</span>
                <button
                  onClick={() => navigate(`/subjects/${subject.id}/chapter/${chapter.id}/subchapter/${sc.id}`)}
                  className="text-text-muted hover:text-white transition-colors flex-shrink-0"
                >
                  <ChevronRight size={15} />
                </button>
                <button
                  onClick={() => handleDeleteSubChapter(sc.id)}
                  className="text-coral opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 hover:bg-coral/10 rounded"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="space-y-6">
        {/* Note Input Card */}
        <div className="bg-bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Mode Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: 'text', label: 'Text Note', icon: <FileText size={16} /> },
              { id: 'image', label: 'Image', icon: <ImageIcon size={16} /> },
              { id: 'link', label: 'Resource Link', icon: <Link2 size={16} /> },
              { id: 'pdf', label: 'PDF', icon: <Paperclip size={16} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setNoteMode(tab.id as any)}
                className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${noteMode === tab.id ? 'text-white border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-white'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3">
            {/* Text Mode */}
            {noteMode === 'text' && (
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Type your notes here... URLs will be clickable automatically."
                className="w-full bg-transparent text-white placeholder-text-muted resize-none focus:outline-none min-h-[100px] text-sm leading-relaxed"
              />
            )}

            {/* Image Mode */}
            {noteMode === 'image' && (
              <div className="space-y-3">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm font-bold text-sky hover:text-white transition-colors bg-sky/10 px-4 py-3 rounded-xl border border-sky/20 hover:border-sky/50 w-full justify-center"
                >
                  <Upload size={16} /> Upload Image from Computer
                </button>
                <div className="relative">
                  <div className="flex items-center gap-2 border border-border rounded-xl p-3 bg-bg">
                    <Paperclip size={14} className="text-text-muted flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Or paste image URL..."
                      className="bg-transparent text-sm text-white focus:outline-none flex-1"
                      value={photoUrl}
                      onChange={e => setPhotoUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Link Mode */}
            {noteMode === 'link' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border border-border rounded-xl p-3 bg-bg">
                  <Link2 size={14} className="text-accent flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Paste URL (e.g. https://...)"
                    className="bg-transparent text-sm text-white focus:outline-none flex-1"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Link title (optional, e.g. 'Khan Academy - Photosynthesis')"
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                />
              </div>
            )}

            {/* PDF Mode */}
            {noteMode === 'pdf' && (
              <div className="space-y-3">
                <input type="file" ref={pdfInputRef} className="hidden" accept=".pdf,application/pdf" onChange={handlePdfUpload} />
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm font-bold text-accent hover:text-white transition-colors bg-accent/10 px-4 py-4 rounded-xl border border-accent/20 hover:border-accent/50 w-full justify-center"
                >
                  <Upload size={16} /> Upload PDF from Computer
                </button>
                <p className="text-xs text-text-muted text-center">The PDF will be embedded and viewable directly in this chapter</p>
              </div>
            )}

            {/* Label + Save Row */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2 flex-1">
                <Folder size={14} className="text-text-muted flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Label / Folder (optional)"
                  className="bg-transparent text-xs text-white focus:outline-none flex-1 placeholder-text-muted"
                  value={noteLabel}
                  onChange={e => setNoteLabel(e.target.value)}
                  list="note-labels"
                />
                <datalist id="note-labels">
                  {allLabels.map(l => <option key={l} value={l} />)}
                </datalist>
              </div>
              <button
                onClick={handleSaveNote}
                className="bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm shadow-accent/20"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>

        {/* Filter Rows */}
        <div className="flex flex-col gap-3 p-4 bg-bg-card border border-border rounded-xl shadow-sm">
          
          {/* Type Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest min-w-[50px]">Type:</span>
            {[
              { id: 'all', label: 'All', icon: null },
              { id: 'text', label: 'Text', icon: <FileText size={12} /> },
              { id: 'image', label: 'Images', icon: <ImageIcon size={12} /> },
              { id: 'link', label: 'Links', icon: <Link2 size={12} /> },
              { id: 'pdf', label: 'PDFs', icon: <Paperclip size={12} /> },
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTypeFilter(tf.id as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${typeFilter === tf.id ? 'bg-sky text-black border-sky shadow-sm' : 'border-border text-text-muted hover:text-white hover:bg-bg-raised'}`}
              >
                {tf.icon} {tf.label}
              </button>
            ))}
          </div>

          {/* Label Filters */}
          {allLabels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest min-w-[50px]">Folder:</span>
              <button
                onClick={() => setLabelFilter('')}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${!labelFilter ? 'bg-accent text-white border-accent shadow-sm' : 'border-border text-text-muted hover:text-white hover:bg-bg-raised'}`}
              >
                All Folders
              </button>
              {allLabels.map(label => (
                <button
                  key={label}
                  onClick={() => setLabelFilter(label === labelFilter ? '' : label)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${label === labelFilter ? 'bg-accent text-white border-accent shadow-sm' : 'border-border text-text-muted hover:text-white hover:bg-bg-raised'}`}
                >
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
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-coral opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-coral/10 rounded-lg"
                  title="Delete Note"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {note.type === 'text' && <RenderTextWithLinks text={note.content} />}

              {note.type === 'image' && (
                <a href={note.content} target="_blank" rel="noopener noreferrer">
                  <img src={note.content} alt="Note" className="w-full rounded-lg shadow-sm border border-border/50 hover:opacity-90 transition-opacity cursor-pointer" />
                </a>
              )}

              {note.type === 'link' && (
                <a
                  href={note.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 bg-bg rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-all group/link"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover/link:bg-accent/20 transition-colors">
                    <Link2 size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate group-hover/link:text-accent transition-colors">
                      {note.urlTitle || note.content}
                    </div>
                    <div className="text-xs text-text-muted truncate mt-1">{note.content}</div>
                  </div>
                  <X size={14} className="text-text-muted opacity-0 group-hover/link:opacity-60 transition-opacity flex-shrink-0 mt-1" />
                </a>
              )}

              {note.type === 'pdf' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip size={14} className="text-accent flex-shrink-0" />
                      <span className="text-sm font-bold text-white truncate">{note.urlTitle || 'PDF Document'}</span>
                    </div>
                    <a
                      href={note.content}
                      download={note.urlTitle || 'document.pdf'}
                      className="text-xs font-bold text-sky hover:text-white transition-colors px-2 py-1 rounded bg-sky/10 hover:bg-sky/20 flex-shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      Download
                    </a>
                  </div>
                  <iframe
                    src={note.content}
                    className="w-full h-64 rounded-xl border border-border"
                    title={note.urlTitle || 'PDF Document'}
                  />
                </div>
              )}
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="col-span-full py-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-text-muted">
              <BookOpen size={40} className="opacity-20 mb-3" />
              <p className="font-bold">{labelFilter ? `No notes in "${labelFilter}"` : 'No notes yet.'}</p>
              <p className="text-sm">Start typing above to save your first study note.</p>
            </div>
          )}
        </div>
      </div>

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
