import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Search, BookOpen, FileText, CheckSquare, MessageCircleQuestion, CalendarDays } from 'lucide-react';

export default function OmniSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { state } = useAppContext();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    const handleOpenEvent = () => setIsOpen(true);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search', handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase();
  
  const results = {
    subjects: (state.subjects || []).filter(s => s && s.name && s.name.toLowerCase().includes(q)),
    chapters: (state.subjects || []).flatMap(s => (s.chapters || []).map(c => ({...c, subjectName: s.name}))).filter(c => c && c.name && c.name.toLowerCase().includes(q)),
    homework: (state.homework || []).filter(h => h && h.title && h.title.toLowerCase().includes(q)),
    doubts: (state.doubts || []).filter(d => d && (d.question?.toLowerCase().includes(q) || d.topic?.toLowerCase().includes(q))),
    exams: (state.exams || []).filter(e => e && e.name && e.name.toLowerCase().includes(q)),
  };

  const hasResults = query.length > 0 && Object.values(results).some(arr => arr.length > 0);

  const goTo = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-black/60" onClick={() => setIsOpen(false)}>
      <div className="w-full max-w-2xl bg-bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center px-5 py-4 border-b border-border gap-3">
          <Search size={22} className="text-text-muted" />
          <input 
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-white text-lg outline-none placeholder:text-text-muted"
            placeholder="Search subjects, chapters, homework... ⌘K"
          />
          <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-white px-2 py-1 bg-bg-raised rounded-md text-xs font-bold font-mono">
            ESC
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {query.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p>Type to search across all your study content</p>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-16 text-text-muted">
              <p>No results for <span className="text-white font-bold">"{query}"</span> — try a different word</p>
            </div>
          ) : (
            <div className="p-3 space-y-4">
              
              {results.subjects.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 mb-2 flex items-center gap-2"><BookOpen size={12}/> Subjects</h3>
                  {results.subjects.map(s => (
                    <div key={s.id} onClick={() => goTo('/subjects')} className="px-4 py-3 cursor-pointer hover:bg-bg-raised rounded-xl text-white flex items-center gap-4 transition-colors">
                      <span className="text-2xl">{s.icon}</span> <span className="font-bold text-lg">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.chapters.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 mb-2 flex items-center gap-2"><FileText size={12}/> Chapters</h3>
                  {results.chapters.map(c => (
                    <div key={c.id} onClick={() => goTo(`/subjects/${c.subjectId}/${c.id}`)} className="px-4 py-3 cursor-pointer hover:bg-bg-raised rounded-xl text-white group transition-colors flex items-center justify-between">
                      <div className="font-bold">{c.name}</div>
                      <div className="text-xs text-text-muted font-medium bg-bg px-2 py-1 rounded-md">{c.subjectName}</div>
                    </div>
                  ))}
                </div>
              )}

              {results.homework.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 mb-2 flex items-center gap-2"><CheckSquare size={12}/> Homework</h3>
                  {results.homework.map(h => (
                    <div key={h.id} onClick={() => goTo('/homework')} className="px-4 py-3 cursor-pointer hover:bg-bg-raised rounded-xl text-white transition-colors">
                      <span className="font-medium">{h.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.doubts.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 mb-2 flex items-center gap-2"><MessageCircleQuestion size={12}/> Doubts</h3>
                  {results.doubts.map(d => (
                    <div key={d.id} onClick={() => goTo('/doubts')} className="px-4 py-3 cursor-pointer hover:bg-bg-raised rounded-xl text-white transition-colors">
                      <div className="font-medium truncate">{d.question}</div>
                      <div className="text-xs text-text-muted mt-1">{d.topic}</div>
                    </div>
                  ))}
                </div>
              )}

              {results.exams.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 mb-2 flex items-center gap-2"><CalendarDays size={12}/> Exams</h3>
                  {results.exams.map(e => (
                    <div key={e.id} onClick={() => goTo('/exams')} className="px-4 py-3 cursor-pointer hover:bg-bg-raised rounded-xl text-white transition-colors font-medium">
                      {e.name}
                </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
