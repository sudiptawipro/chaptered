import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import type { MockQuestion, MockExamResult } from '../context/AppContext';
import {
  FileText, Upload, Sparkles, CheckCircle2,
  XCircle, AlertTriangle, Award, RotateCcw, Save,
  BookOpen, Loader2, Key, Settings as SettingsIcon, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { playSound } from '../hooks/useSound';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

// ── PDF text extraction via pdfjs-dist ────────────────────────────────────────
async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let text = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it: any) => it.str).join(' ') + '\n';
    }
    return text.slice(0, 12000); // Claude context limit
  } catch (err) {
    console.error('PDF extraction error:', err);
    return '';
  }
}

// ── Gemini API call ────────────────────────────────────────────────────────────
async function generateQuestionsFromGemini(
  apiKey: string,
  pdfText: string,
  subjectName: string,
  numQuestions: number,
  totalMarks: number,
  difficulty: string,
  qTypes: string[]
): Promise<MockQuestion[]> {
  const prompt = `You are an expert ${subjectName} teacher creating a ${difficulty} difficulty exam.

${pdfText ? `STUDY MATERIAL:\n${pdfText}\n\n` : ''}

Generate EXACTLY ${numQuestions} exam questions for a ${totalMarks}-mark test.
Question types to include: ${qTypes.join(', ')}.
Distribute marks so the total sums to exactly ${totalMarks}.

Return ONLY a valid JSON array — no markdown fences, no explanation, no extra text. Just the raw JSON array:
[
  {
    "id": "q1",
    "question": "Question text here",
    "marks": 2,
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation"
  },
  {
    "id": "q2",
    "question": "Short answer question",
    "marks": 3,
    "type": "short",
    "correctAnswer": "Model answer here",
    "explanation": "Brief explanation"
  }
]

Rules:
- MCQ must have exactly 4 options; correctAnswer must match one option exactly
- Short answer (type "short"): 1–4 marks, include a model answer in correctAnswer
- Long answer (type "long"): 5+ marks, include a detailed model answer
- Base questions on the study material if provided, otherwise use general ${subjectName} IGCSE knowledge
- Difficulty ${difficulty}: ${difficulty === 'easy' ? 'straightforward recall and recognition' : difficulty === 'medium' ? 'application and understanding' : 'analysis, synthesis and evaluation'}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  // Strip markdown code fences if present, then parse the JSON array
  const stripped = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Could not parse questions from Gemini response');
  return JSON.parse(match[0]) as MockQuestion[];
}

// ── Claude API call ────────────────────────────────────────────────────────────
async function generateQuestionsFromClaude(
  apiKey: string,
  pdfText: string,
  subjectName: string,
  numQuestions: number,
  totalMarks: number,
  difficulty: string,
  qTypes: string[]
): Promise<MockQuestion[]> {
  const prompt = `You are an expert ${subjectName} teacher creating a ${difficulty} difficulty exam.

${pdfText ? `STUDY MATERIAL:\n${pdfText}\n\n` : ''}

Generate EXACTLY ${numQuestions} exam questions for a ${totalMarks}-mark test.
Question types to include: ${qTypes.join(', ')}.
Distribute marks so the total sums to exactly ${totalMarks}.

Return ONLY a valid JSON array — no markdown fences, no explanation, no extra text. Just the raw JSON array:
[
  {
    "id": "q1",
    "question": "Question text here",
    "marks": 2,
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation"
  },
  {
    "id": "q2",
    "question": "Short answer question",
    "marks": 3,
    "type": "short",
    "correctAnswer": "Model answer here",
    "explanation": "Brief explanation"
  }
]

Rules:
- MCQ must have exactly 4 options; correctAnswer must match one option exactly
- Short answer (type "short"): 1–4 marks, include a model answer in correctAnswer
- Long answer (type "long"): 5+ marks, include a detailed model answer
- Base questions on the study material if provided, otherwise use general ${subjectName} IGCSE knowledge
- Difficulty ${difficulty}: ${difficulty === 'easy' ? 'straightforward recall and recognition' : difficulty === 'medium' ? 'application and understanding' : 'analysis, synthesis and evaluation'}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text || '[]';

  const stripped = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Could not parse questions from Claude response');
  return JSON.parse(match[0]) as MockQuestion[];
}

// ── Difficulty badge ─────────────────────────────────────────────────────────
function DiffBadge({ diff }: { diff: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    easy: { bg: 'rgba(61,237,122,0.15)', text: '#3DED7A' },
    medium: { bg: 'rgba(251,191,36,0.15)', text: '#FBBF24' },
    hard: { bg: 'rgba(255,107,107,0.15)', text: '#FF6B6B' },
  };
  const s = map[diff] || map.medium;
  return (
    <span className="text-xs font-black px-2 py-0.5 rounded-full capitalize"
      style={{ background: s.bg, color: s.text }}>
      {diff}
    </span>
  );
}

type Phase = 'setup' | 'taking' | 'review' | 'history';

export default function MockExam() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subjects, mockExamResults } = state;

  // ── Setup state ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('setup');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [totalMarks, setTotalMarks] = useState(30);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qTypes, setQTypes] = useState<string[]>(['mcq', 'short']);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfTexts, setPdfTexts] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Active exam state ────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [manualMarks, setManualMarks] = useState<Record<string, number>>({});
  const [examTitle, setExamTitle] = useState('');
  const [examSubjectId, setExamSubjectId] = useState('');
  const [examDifficulty, setExamDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [examTotalMarks, setExamTotalMarks] = useState(0);
  const [startedAt] = useState<Date>(new Date());

  const geminiKey = localStorage.getItem('chaptered-gemini-api-key') || '';
  const anthropicKey = localStorage.getItem('chaptered-anthropic-api-key') || '';
  const hasApiKey = !!(geminiKey || anthropicKey);
  const provider: 'claude' | 'gemini' = anthropicKey ? 'claude' : 'gemini';

  // ── PDF upload ────────────────────────────────────────────────────────────
  async function handlePdfDrop(files: File[]) {
    const newFiles = [...pdfFiles, ...files].slice(0, 3);
    setPdfFiles(newFiles);
    const texts = await Promise.all(newFiles.map(extractPdfText));
    setPdfTexts(texts);
    toast(`${files.length} PDF${files.length > 1 ? 's' : ''} loaded`, 'success');
  }

  function toggleQType(type: string) {
    setQTypes(prev =>
      prev.includes(type)
        ? prev.length > 1 ? prev.filter(t => t !== type) : prev
        : [...prev, type]
    );
  }

  // ── Generate ──────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!hasApiKey) {
      toast('Add a Gemini or Claude API key in Settings → AI Settings', 'error');
      return;
    }
    if (!subjectId) { toast('Select a subject', 'error'); return; }

    setGenerating(true);
    setGenError('');
    const combinedPdfText = pdfTexts.join('\n\n');
    const sub = subjects.find(s => s.id === subjectId);

    try {
      const qs = provider === 'claude'
        ? await generateQuestionsFromClaude(
            anthropicKey,
            combinedPdfText,
            sub?.name || 'General',
            numQuestions,
            totalMarks,
            difficulty,
            qTypes
          )
        : await generateQuestionsFromGemini(
            geminiKey,
            combinedPdfText,
            sub?.name || 'General',
            numQuestions,
            totalMarks,
            difficulty,
            qTypes
          );

      if (!qs || qs.length === 0) throw new Error('No questions generated');

      setQuestions(qs);
      setCurrentQ(0);
      setAnswers({});
      setManualMarks({});
      setExamTitle(title || `${sub?.name} Mock — ${format(new Date(), 'dd MMM')}`);
      setExamSubjectId(subjectId);
      setExamDifficulty(difficulty);
      setExamTotalMarks(totalMarks);
      setPhase('taking');
      playSound('success');
      toast('Exam ready! Good luck!', 'success');
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate questions');
      toast('Generation failed — ' + (err.message || 'check API key'), 'error');
    } finally {
      setGenerating(false);
    }
  }

  // ── Submit exam ──────────────────────────────────────────────────────────
  function handleSubmit() {
    setPhase('review');
    playSound('complete');
    toast('Exam submitted! Check your results.', 'success');
  }

  // ── Score calculation ────────────────────────────────────────────────────
  const score = questions.reduce((total, q) => {
    if (q.type === 'mcq') {
      return total + (answers[q.id] === q.correctAnswer ? q.marks : 0);
    } else {
      return total + (manualMarks[q.id] ?? 0);
    }
  }, 0);

  // ── Save result ──────────────────────────────────────────────────────────
  function handleSaveResult() {
    const result: MockExamResult = {
      id: `mock-${Date.now()}`,
      subjectId: examSubjectId,
      title: examTitle,
      totalMarks: examTotalMarks,
      marksAwarded: score,
      difficulty: examDifficulty,
      questions: questions.map(q => ({
        ...q,
        userAnswer: answers[q.id],
        marksAwarded: q.type === 'mcq'
          ? (answers[q.id] === q.correctAnswer ? q.marks : 0)
          : (manualMarks[q.id] ?? 0),
      })),
      createdAt: startedAt,
      completedAt: new Date(),
    };
    dispatch({ type: 'SAVE_MOCK_EXAM', payload: result });
    playSound('save');
    toast('Result saved!', 'success');
    setPhase('history');
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  const pct = examTotalMarks > 0 ? Math.round((score / examTotalMarks) * 100) : 0;
  const grade = pct >= 90 ? 'A*' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'U';
  const gradeColor = pct >= 80 ? '#3DED7A' : pct >= 60 ? '#FBBF24' : '#FF6B6B';

  if (!hasApiKey && phase === 'setup') {
    return (
      <div className="min-h-screen p-6 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full rounded-2xl p-8 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <Key size={28} className="text-gold" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">AI API Key Required</h2>
          <p className="text-text-muted text-sm mb-6">
            Mock Exam uses AI to generate questions from your PDFs.
            Add your <strong className="text-white">Claude</strong> or <strong className="text-white">Gemini</strong> API key
            in Settings → AI Settings to get started.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-3 rounded-xl font-black text-sm transition-all hover-lift flex items-center gap-2 mx-auto"
            style={{ background: 'rgba(255,107,157,0.8)', color: '#fff' }}
          >
            <SettingsIcon size={15} /> Go to Settings
          </button>
        </div>
      </div>
    );
  }

  // ── SETUP PHASE ──────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'rgba(255,107,157,0.2)', border: '1px solid rgba(255,107,157,0.35)' }}>
            <Sparkles size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">AI Mock Exam</h1>
            <p className="text-text-muted text-sm mt-0.5">Upload study material, set parameters, get a custom exam</p>
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full mt-1 self-start"
              style={{ background: provider === 'claude' ? 'rgba(255,107,157,0.15)' : 'rgba(66,184,131,0.15)', color: provider === 'claude' ? '#FF6B9D' : '#42B883' }}
            >
              {provider === 'claude' ? 'Claude AI' : 'Gemini AI'}
            </span>
          </div>
          <button
            onClick={() => setPhase('history')}
            className="ml-auto px-3 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-all flex items-center gap-1.5"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Award size={14} /> Past Results
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          {/* Left: Config */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-black text-white mb-4">Exam Settings</h2>

              {/* Subject */}
              <div className="mb-4">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Subject</label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <option value="">Select a subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Exam Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 5 Mock"
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none placeholder:text-text-muted/50"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              {/* Num Questions + Total Marks */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Questions</label>
                  <input
                    type="number" min={3} max={30} value={numQuestions}
                    onChange={e => setNumQuestions(Math.min(30, Math.max(3, +e.target.value)))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm font-black text-white outline-none text-center"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Total Marks</label>
                  <input
                    type="number" min={5} max={200} value={totalMarks}
                    onChange={e => setTotalMarks(Math.min(200, Math.max(5, +e.target.value)))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm font-black text-white outline-none text-center"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Difficulty</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-black transition-all capitalize ${
                        difficulty === d ? 'text-white' : 'text-text-muted hover:text-white hover:bg-white/5'
                      }`}
                      style={difficulty === d ? {
                        background: d === 'easy' ? 'rgba(61,237,122,0.2)' : d === 'medium' ? 'rgba(251,191,36,0.2)' : 'rgba(255,107,107,0.2)',
                        border: `1px solid ${d === 'easy' ? 'rgba(61,237,122,0.4)' : d === 'medium' ? 'rgba(251,191,36,0.4)' : 'rgba(255,107,107,0.4)'}`,
                        color: d === 'easy' ? '#3DED7A' : d === 'medium' ? '#FBBF24' : '#FF6B6B',
                      } : { border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Types */}
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Question Types</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'mcq', label: 'MCQ' },
                    { id: 'short', label: 'Short Answer' },
                    { id: 'long', label: 'Long Answer' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => toggleQType(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        qTypes.includes(t.id) ? 'text-white' : 'text-text-muted hover:text-white'
                      }`}
                      style={qTypes.includes(t.id) ? {
                        background: 'rgba(255,107,157,0.2)',
                        border: '1px solid rgba(255,107,157,0.4)',
                      } : { border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: PDF Upload + Generate */}
          <div className="flex flex-col gap-5">
            {/* PDF Drop Zone */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-black text-white mb-1">Study Material</h2>
              <p className="text-xs text-text-muted mb-4">Upload chapter PDFs or past papers (up to 3 files)</p>

              <div
                className="rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all hover:border-accent/50"
                style={{
                  border: '2px dashed rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.03)',
                }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  handlePdfDrop(Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf'));
                }}
              >
                <Upload size={28} className="text-text-muted opacity-60" />
                <div className="text-sm font-bold text-text-muted">
                  {pdfFiles.length === 0 ? 'Drop PDF files here or click to browse' : `${pdfFiles.length} file(s) loaded — click to add more`}
                </div>
                <div className="text-xs text-text-muted opacity-60">PDF only · max 3 files · first 20 pages each</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={e => handlePdfDrop(Array.from(e.target.files || []))}
                />
              </div>

              {pdfFiles.length > 0 && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {pdfFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <FileText size={14} className="text-sky-400 flex-shrink-0" />
                      <span className="text-xs font-bold text-white flex-1 truncate">{f.name}</span>
                      <button onClick={() => {
                        setPdfFiles(prev => prev.filter((_, j) => j !== i));
                        setPdfTexts(prev => prev.filter((_, j) => j !== i));
                      }} className="text-text-muted hover:text-coral transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-green-400 font-bold px-1">
                    ✓ {pdfTexts.filter(Boolean).length} PDF(s) processed
                  </p>
                </div>
              )}

              <p className="text-xs text-text-muted mt-3 opacity-70">
                No PDFs? Claude will generate questions from its knowledge of the subject.
              </p>
            </div>

            {/* Generate Button */}
            {genError && (
              <div className="rounded-xl px-4 py-3 text-sm font-bold text-coral flex items-center gap-2"
                style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)' }}>
                <AlertTriangle size={15} /> {genError}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || !subjectId}
              className="w-full py-4 rounded-2xl font-black text-base transition-all hover-lift flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, rgba(255,107,157,0.9), rgba(167,139,250,0.9))',
                color: '#fff',
                boxShadow: '0 4px 24px rgba(255,107,157,0.3)',
              }}
            >
              {generating ? (
                <><Loader2 size={18} className="animate-spin" /> Generating with Claude AI...</>
              ) : (
                <><Sparkles size={18} /> Generate Mock Exam</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── TAKING PHASE ─────────────────────────────────────────────────────────────
  if (phase === 'taking') {
    const q = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;
    const allAnswered = questions.every(q => answers[q.id] !== undefined && answers[q.id] !== '');

    return (
      <div className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-white">{examTitle}</h1>
            <p className="text-xs text-text-muted mt-0.5">
              Question {currentQ + 1} of {questions.length} · {examTotalMarks} marks total
            </p>
          </div>
          <DiffBadge diff={examDifficulty} />
        </div>

        {/* Progress */}
        <div className="rounded-full h-2 mb-6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #FF6B9D, #A78BFA)',
          }} />
        </div>

        {/* Question Card */}
        <div className="rounded-2xl p-6 mb-5"
          style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-text-muted">
              {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'short' ? 'Short Answer' : 'Long Answer'}
            </span>
            <span className="text-xs font-black px-2 py-1 rounded-lg"
              style={{ background: 'rgba(255,107,157,0.15)', color: '#FF6B9D', border: '1px solid rgba(255,107,157,0.25)' }}>
              {q.marks} mark{q.marks > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-white font-bold text-base leading-relaxed mb-5">{q.question}</p>

          {/* MCQ Options */}
          {q.type === 'mcq' && q.options && (
            <div className="flex flex-col gap-2">
              {q.options.map((opt, i) => {
                const letter = ['A', 'B', 'C', 'D'][i];
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover-lift"
                    style={{
                      background: selected ? 'rgba(255,107,157,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selected ? 'rgba(255,107,157,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{
                        background: selected ? 'rgba(255,107,157,0.3)' : 'rgba(255,255,255,0.06)',
                        color: selected ? '#FF6B9D' : 'var(--text-muted)',
                      }}>
                      {letter}
                    </div>
                    <span className={`text-sm font-bold ${selected ? 'text-white' : 'text-text-muted'}`}>{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Text answer */}
          {(q.type === 'short' || q.type === 'long') && (
            <textarea
              rows={q.type === 'long' ? 6 : 3}
              value={answers[q.id] || ''}
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              placeholder={q.type === 'short' ? 'Write your answer...' : 'Write a detailed answer...'}
              className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white resize-none outline-none placeholder:text-text-muted/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="px-4 py-2 rounded-xl text-sm font-bold text-text-muted transition-all hover:text-white disabled:opacity-30"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            ← Previous
          </button>

          {/* Question dots */}
          <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === currentQ ? '#FF6B9D'
                    : answers[questions[i].id] ? 'rgba(61,237,122,0.7)'
                    : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))}
              className="px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover-lift"
              style={{ background: 'rgba(255,107,157,0.2)', border: '1px solid rgba(255,107,157,0.35)' }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="px-5 py-2 rounded-xl text-sm font-black transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'rgba(61,237,122,0.85)', color: '#000' }}
            >
              Submit Exam
            </button>
          )}
        </div>

        {!allAnswered && currentQ === questions.length - 1 && (
          <p className="text-center text-xs text-text-muted mt-3">
            Answer all questions before submitting
          </p>
        )}
      </div>
    );
  }

  // ── REVIEW PHASE ─────────────────────────────────────────────────────────────
  if (phase === 'review') {
    const mcqCorrect = questions.filter(q => q.type === 'mcq' && answers[q.id] === q.correctAnswer).length;
    const mcqTotal = questions.filter(q => q.type === 'mcq').length;

    return (
      <div className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
        {/* Score Header */}
        <div className="rounded-2xl p-6 mb-6 text-center"
          style={{ background: 'rgba(255,107,157,0.06)', border: '1px solid rgba(255,107,157,0.2)' }}>
          <div className="text-6xl font-black mb-1" style={{ color: gradeColor }}>{grade}</div>
          <div className="text-2xl font-black text-white mb-1">
            {score} / {examTotalMarks} marks
          </div>
          <div className="text-text-muted text-sm">{pct}% · {examTitle}</div>
          {mcqTotal > 0 && (
            <div className="text-xs text-text-muted mt-2">
              MCQ: {mcqCorrect}/{mcqTotal} correct
              {questions.some(q => q.type !== 'mcq') && ' · Short/Long: mark below'}
            </div>
          )}
        </div>

        {/* Manual marking notice */}
        {questions.some(q => q.type !== 'mcq') && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm font-bold"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#FBBF24' }}>
            <AlertTriangle size={15} />
            Award marks for short/long answers below, then save your result
          </div>
        )}

        {/* Questions Review */}
        <div className="flex flex-col gap-4 mb-6">
          {questions.map((q, i) => {
            const userAns = answers[q.id] || '';
            const isMCQ = q.type === 'mcq';
            const isCorrect = isMCQ && userAns === q.correctAnswer;
            const isWrong = isMCQ && userAns !== q.correctAnswer;

            return (
              <div key={q.id} className="rounded-2xl p-5"
                style={{
                  background: isMCQ
                    ? (isCorrect ? 'rgba(61,237,122,0.06)' : 'rgba(255,107,107,0.06)')
                    : 'var(--bg-card)',
                  border: `1px solid ${isMCQ
                    ? (isCorrect ? 'rgba(61,237,122,0.2)' : 'rgba(255,107,107,0.2)')
                    : 'rgba(255,255,255,0.08)'}`,
                }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-black text-text-muted mt-0.5">Q{i + 1}.</span>
                    <p className="text-white font-bold text-sm leading-relaxed">{q.question}</p>
                  </div>
                  {isMCQ && (
                    isCorrect
                      ? <CheckCircle2 size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                      : <XCircle size={18} className="text-coral flex-shrink-0 mt-0.5" />
                  )}
                </div>

                {isMCQ && (
                  <div className="text-xs space-y-1">
                    <div className="text-text-muted">Your answer: <span className={isCorrect ? 'text-green-400 font-black' : 'text-coral font-black'}>{userAns}</span></div>
                    {isWrong && <div className="text-green-400 font-bold">Correct: {q.correctAnswer}</div>}
                    {q.explanation && <div className="text-text-muted mt-1 italic">{q.explanation}</div>}
                    <div className="font-black" style={{ color: isCorrect ? '#3DED7A' : 'var(--text-muted)' }}>
                      {isCorrect ? `+${q.marks}` : '0'} / {q.marks} marks
                    </div>
                  </div>
                )}

                {!isMCQ && (
                  <div className="space-y-2">
                    <div className="text-xs text-text-muted">Your answer:</div>
                    <div className="text-sm text-white font-bold bg-white/5 rounded-xl px-3 py-2">{userAns || '(no answer)'}</div>
                    <div className="text-xs text-green-400 font-bold">Model answer: {q.correctAnswer}</div>
                    {q.explanation && <div className="text-xs text-text-muted italic">{q.explanation}</div>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold text-text-muted">Award marks:</span>
                      {Array.from({ length: q.marks + 1 }, (_, m) => (
                        <button
                          key={m}
                          onClick={() => setManualMarks(prev => ({ ...prev, [q.id]: m }))}
                          className="w-8 h-8 rounded-lg text-xs font-black transition-all"
                          style={{
                            background: manualMarks[q.id] === m ? 'rgba(61,237,122,0.25)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${manualMarks[q.id] === m ? 'rgba(61,237,122,0.5)' : 'rgba(255,255,255,0.1)'}`,
                            color: manualMarks[q.id] === m ? '#3DED7A' : 'var(--text-muted)',
                          }}
                        >
                          {m}
                        </button>
                      ))}
                      <span className="text-xs text-text-muted">/ {q.marks}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => { setPhase('setup'); setQuestions([]); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <RotateCcw size={14} /> New Exam
          </button>
          <button
            onClick={handleSaveResult}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all hover-lift"
            style={{ background: 'rgba(61,237,122,0.85)', color: '#000' }}
          >
            <Save size={14} /> Save Result
          </button>
        </div>
      </div>
    );
  }

  // ── HISTORY PHASE ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'rgba(255,107,157,0.2)', border: '1px solid rgba(255,107,157,0.35)' }}>
          <Award size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Mock Exam Results</h1>
          <p className="text-text-muted text-sm mt-0.5">{mockExamResults.length} exams completed</p>
        </div>
        <button
          onClick={() => setPhase('setup')}
          className="ml-auto px-4 py-2 rounded-xl text-sm font-black transition-all hover-lift flex items-center gap-2"
          style={{ background: 'rgba(255,107,157,0.2)', color: '#FF6B9D', border: '1px solid rgba(255,107,157,0.3)' }}
        >
          <Sparkles size={14} /> New Exam
        </button>
      </div>

      {mockExamResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen size={40} className="text-text-muted mb-4 opacity-40" />
          <div className="font-black text-white text-lg mb-2">No mock exams yet</div>
          <p className="text-text-muted text-sm">Generate your first AI-powered mock exam to start practising!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockExamResults.map(result => {
            const sub = subjects.find(s => s.id === result.subjectId);
            const p = result.totalMarks > 0 ? Math.round((result.marksAwarded / result.totalMarks) * 100) : 0;
            const g = p >= 90 ? 'A*' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'U';
            const gc = p >= 80 ? '#3DED7A' : p >= 60 ? '#FBBF24' : '#FF6B6B';
            return (
              <div key={result.id} className="rounded-2xl p-5 hover-lift"
                style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="font-black text-white text-sm leading-tight pr-2">{result.title}</div>
                  <div className="text-2xl font-black flex-shrink-0" style={{ color: gc }}>{g}</div>
                </div>
                <div className="text-text-muted text-xs mb-3">{sub?.name || 'Unknown'}</div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-black text-white">{result.marksAwarded}/{result.totalMarks}</span>
                  <DiffBadge diff={result.difficulty} />
                </div>
                {/* Score bar */}
                <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${p}%`, background: gc }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted">
                    {(() => { try { return format(new Date(result.createdAt), 'dd MMM yyyy'); } catch { return ''; } })()}
                  </span>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_MOCK_EXAM', payload: result.id })}
                    className="text-text-muted hover:text-coral transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
