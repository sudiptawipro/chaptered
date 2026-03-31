import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Flashcard } from '../context/AppContext';
import { Check, X, Trophy, Play, ArrowLeft, Sparkles, BookOpen, Link as LinkIcon, Loader2 } from 'lucide-react';
import FlipCard from '../components/FlipCard';
import Modal from '../components/Modal';

export default function Quiz() {
  const { state, dispatch } = useAppContext();
  
  const [qzSub, setQzSub] = useState(state.subjects[0]?.id || '');
  const [qzChap, setQzChap] = useState('');
  const [phase, setPhase] = useState<'setup' | 'active' | 'results'>('setup');
  
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasFlipped, setHasFlipped] = useState(false);

  // Generate Flashcards state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genSource, setGenSource] = useState<'notes' | 'url'>('notes');
  const [genText, setGenText] = useState('');
  const [genNum, setGenNum] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedSubject = state.subjects.find(s => s.id === qzSub);

  const startQuiz = () => {
    let pool: Flashcard[] = [];
    if (qzChap) {
      const c = selectedSubject?.chapters.find(ch => ch.id === qzChap);
      if (c) pool = c.flashcards;
    } else if (selectedSubject) {
      pool = selectedSubject.chapters.flatMap(c => c.flashcards);
    }
    
    if (pool.length === 0) {
      alert("No flashcards found for this selection! Try generating some with AI.");
      return;
    }
    
    // Shuffle pool
    setCards([...pool].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setScore(0);
    setHasFlipped(false);
    setPhase('active');
  };

  const handleAnswer = (correct: boolean) => {
    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(i => i + 1);
      setHasFlipped(false);
    } else {
      if (cards.length > 0) {
        dispatch({
           type: 'ADD_QUIZ_RESULT',
           payload: {
             id: `qzres-${Date.now()}`,
             chapterId: qzChap || cards[0].chapterId,
             score: newScore,
             total: cards.length,
             date: new Date()
           }
        });
      }
      setPhase('results');
    }
  };

  const handleGenerate = async () => {
    if (!genText.trim()) return;
    setIsGenerating(true);
    
    const targetChapId = qzChap || selectedSubject?.chapters[0]?.id;
    if (!targetChapId || !selectedSubject) {
      alert("Please prepare at least one chapter in your Subjects tab first.");
      setIsGenerating(false);
      return;
    }

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("Please set VITE_GEMINI_API_KEY in your .env.local file to use AI.");
        setIsGenerating(false);
        return;
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are an expert tutor. Create exactly ${genNum} flashcards based on this content:\n\n${genText}\n\nReturn ONLY a JSON array of objects with keys "question" and "answer". No markdown tags, no \`\`\`json, just the raw JSON array.` }] }]
        })
      });
      
      const data = await response.json();
      console.log("Gemini Quiz API Response:", data);
      
      if (data.error) {
        const errMsg = data.error.message || "Unknown API Error";
        alert(`Gemini API Error: ${errMsg}`);
        setIsGenerating(false);
        return;
      }
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No response from AI candidates. Check for safety filters.");
      
      const parsed = JSON.parse(text.trim().replace(/^```json/, '').replace(/```$/, ''));
      
      const generated: Flashcard[] = parsed.map((item: any, i: number) => ({
        id: `card-ai-${Date.now()}-${i}`,
        chapterId: targetChapId,
        question: item.question || 'Missing question',
        answer: item.answer || 'Missing answer',
        difficulty: 'medium',
        timesCorrect: 0,
        timesWrong: 0
      }));

      // In case AppContext supports bulk addition
      generated.forEach(card => {
        dispatch({
          type: 'ADD_FLASHCARD',
          payload: { subjectId: selectedSubject.id, chapterId: targetChapId, flashcard: card }
        });
      });
      
      alert(`✨ Successfully generated ${generated.length} flashcards!`);
      setIsGenerateOpen(false);
      setGenText('');
    } catch (err) {
      console.error(err);
      alert("AI failed to generate flashcards. Please try again with shorter text or check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (phase === 'setup') {
    return (
      <div className="max-w-xl mx-auto space-y-8 pt-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-accent/20 text-accent rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner shadow-accent/10 border-4 border-bg-card">
            🎮
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Mocks & Quizzes</h1>
          <p className="text-text-muted font-medium">Test your knowledge or generate smart flashcards instantly.</p>
        </div>

        <div className="bg-bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none group-hover:bg-accent/10 transition-colors" />

           <div>
             <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3">Select Subject</label>
             <select 
               value={qzSub} 
               onChange={e => { setQzSub(e.target.value); setQzChap(''); }} 
               className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3.5 text-white font-bold outline-none focus:border-accent transition-colors shadow-inner"
             >
               {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
           </div>

           {selectedSubject && selectedSubject.chapters.length > 0 ? (
             <div>
               <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3">Target Chapter <span className="text-text-muted/50 font-medium lowercase tracking-normal">(Optional)</span></label>
               <select 
                 value={qzChap} 
                 onChange={e => setQzChap(e.target.value)} 
                 className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3.5 text-white font-bold outline-none focus:border-accent transition-colors shadow-inner"
               >
                 <option value="">All Chapters</option>
                 {selectedSubject.chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
             </div>
           ) : (
             <div className="bg-coral/10 border border-coral/30 text-coral p-4 rounded-xl text-sm font-bold flex items-center justify-center">
               This subject has no chapters to quiz on yet!
             </div>
           )}

           <div className="pt-2 grid grid-cols-1 gap-4">
             <button 
               onClick={startQuiz}
               disabled={!selectedSubject || selectedSubject.chapters.length === 0}
               className="w-full bg-white hover:bg-gray-200 text-black py-4 rounded-xl font-bold transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 text-xl shadow-xl shadow-white/10 disabled:opacity-50 disabled:scale-100"
             >
               <Play fill="currentColor" size={24} /> Play Now
             </button>
             
             <button 
               onClick={() => setIsGenerateOpen(true)}
               disabled={!selectedSubject || selectedSubject.chapters.length === 0}
               className="w-full bg-purple hover:bg-purple/80 text-white py-4 rounded-xl font-bold transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 text-lg shadow-xl shadow-purple/20 disabled:opacity-50 disabled:scale-100"
             >
               <Sparkles size={20} /> Autogenerate Flashcards
             </button>
           </div>
        </div>

        <Modal isOpen={isGenerateOpen} onClose={() => !isGenerating && setIsGenerateOpen(false)} title="Generate Smart Flashcards">
          <div className="space-y-6 pt-2">
            
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3">Source Material</label>
              <div className="flex bg-bg p-1 border border-border rounded-xl">
                 <button onClick={() => setGenSource('notes')} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${genSource === 'notes' ? 'bg-purple text-white shadow-md' : 'text-text-muted hover:text-white'}`}><BookOpen size={16}/> Notes</button>
                 <button onClick={() => setGenSource('url')} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${genSource === 'url' ? 'bg-purple text-white shadow-md' : 'text-text-muted hover:text-white'}`}><LinkIcon size={16}/> URL</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3">{genSource === 'notes' ? 'Paste Notes' : 'Paste URL'}</label>
              {genSource === 'notes' ? (
                <textarea 
                  value={genText} 
                  onChange={e => setGenText(e.target.value)} 
                  className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white h-32 resize-none font-bold outline-none focus:border-accent transition-colors shadow-inner" 
                  placeholder="Paste your chapter summary, article text, or study notes here..."
                />
              ) : (
                <input 
                  type="url"
                  value={genText} 
                  onChange={e => setGenText(e.target.value)} 
                  className="w-full bg-bg border-2 border-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent transition-colors shadow-inner" 
                  placeholder="https://en.wikipedia.org/wiki/..."
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3">Number of Cards</label>
              <div className="flex gap-2">
                 {[10, 20, 30].map(n => (
                   <button 
                     key={n}
                     onClick={() => setGenNum(n)}
                     className={`flex-1 py-3 rounded-xl border-2 font-bold transition-transform ${genNum === n ? 'border-purple bg-purple/20 text-purple shadow-sm hover:scale-105' : 'border-transparent bg-bg text-text-muted hover:text-white'}`}
                   >
                     {n} cards
                   </button>
                 ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <button 
                onClick={handleGenerate} 
                disabled={isGenerating || !genText.trim()}
                className="w-full bg-accent hover:bg-accent-hover disabled:bg-bg disabled:text-text-muted disabled:border disabled:border-border text-white py-4 rounded-xl font-bold transition-transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-3 text-lg shadow-xl shadow-accent/20 disabled:shadow-none"
              >
                {isGenerating ? <><Loader2 className="animate-spin" size={20} /> Generating via AI...</> : <><Sparkles size={20} /> Generate {genNum} Cards</>}
              </button>
            </div>
            
          </div>
        </Modal>
      </div>
    );
  }

  if (phase === 'active') {
    const card = cards[currentIndex];
    const progress = ((currentIndex) / cards.length) * 100;

    return (
      <div className="max-w-2xl mx-auto pt-6 space-y-8">
        <div className="flex items-center justify-between">
          <button onClick={() => setPhase('setup')} className="bg-bg hover:bg-bg-raised border border-border px-4 py-2 rounded-xl text-text-muted hover:text-white flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-colors shadow-sm">
            <ArrowLeft size={16} /> Exit
          </button>
          <div className="text-xs font-black uppercase tracking-widest text-text-muted bg-bg-card border border-border px-4 py-2 rounded-xl">
            Card <span className="text-white">{currentIndex + 1}</span> of {cards.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-bg-card border border-border h-3 rounded-full overflow-hidden shadow-inner p-0.5">
          <div className="bg-accent h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(255,107,157,0.8)]" style={{ width: `${progress}%` }} />
        </div>

        <FlipCard 
          key={card.id + currentIndex} 
          front={card.question} 
          back={card.answer} 
          className="h-80 sm:h-96"
          onFlip={(flipped) => setHasFlipped(flipped)}
        />

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-500 ${hasFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
           <button 
             onClick={() => handleAnswer(false)}
             className="w-full sm:w-auto bg-bg-card border-none text-coral hover:bg-coral hover:text-white px-10 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg"
           >
             <X size={24} strokeWidth={3} /> Incorrect
           </button>
           <button 
             onClick={() => handleAnswer(true)}
             className="w-full sm:w-auto bg-bg-card border-none text-green hover:bg-green hover:text-white px-10 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg"
           >
             <Check size={24} strokeWidth={3} /> Correct
           </button>
        </div>
        {!hasFlipped && <p className="text-center text-text-muted text-sm font-bold uppercase tracking-widest mt-8 animate-pulse bg-bg border border-border w-fit mx-auto px-4 py-2 rounded-xl">Tap the card to reveal the answer</p>}
      </div>
    );
  }

  // Results phase
  const accuracy = Math.round((score / cards.length) * 100);
  
  return (
    <div className="max-w-xl mx-auto space-y-8 pt-10 text-center">
      <div className="w-28 h-28 bg-gold/10 border-4 border-gold/20 text-gold rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-[0_0_50px_rgba(251,191,36,0.2)]">
        <Trophy fill="currentColor" size={48} />
      </div>
      <h1 className="text-5xl font-black text-white tracking-tight">Quiz Complete!</h1>
      
      <div className="bg-bg-card border border-border rounded-3xl p-10 shadow-sm my-10 relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent opacity-50 pointer-events-none" />
         
         <div className="relative z-10">
           <div className="text-7xl font-black text-accent mb-6 flex items-baseline justify-center gap-2">
             {score} <span className="text-3xl text-text-muted font-bold">/ {cards.length}</span>
           </div>
           
           <p className="text-xl text-white font-black mb-4 uppercase tracking-widest">Accuracy: <span className="text-gold">{accuracy}%</span></p>
           
           {accuracy >= 80 ? (
             <p className="text-sm text-green font-bold bg-green/10 px-6 py-3 rounded-xl inline-block border border-green/20">🔥 Outstanding! You've mastered this material.</p>
           ) : accuracy >= 50 ? (
             <p className="text-sm text-gold font-bold bg-gold/10 px-6 py-3 rounded-xl inline-block border border-gold/20">👍 Solid effort. Review your mistakes and you'll be perfect.</p>
           ) : (
             <p className="text-sm text-coral font-bold bg-coral/10 px-6 py-3 rounded-xl inline-block border border-coral/20">💪 Don't give up! Keep practicing to improve your score.</p>
           )}
         </div>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setPhase('setup')} className="flex-1 bg-white hover:bg-gray-200 text-black py-4 rounded-xl font-bold transition-transform hover:scale-[1.02] shadow-xl shadow-white/10 text-lg">Take Another</button>
      </div>

    </div>
  );
}
