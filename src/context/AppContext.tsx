import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import localforage from 'localforage';
import { getHouseholdCodeSync, pushToCloud } from '../utils/cloudSync';

// ==========================================
// TYPES
// ==========================================

export interface Note {
  id: string;
  chapterId: string;
  type: 'text' | 'image' | 'link' | 'pdf';
  content: string;      // text content, base64 image/pdf, or URL
  urlTitle?: string;    // display title for link/pdf notes (filename)
  label?: string;       // folder/label
  createdAt: Date;
}

export interface Flashcard {
  id: string;
  chapterId: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timesCorrect: number;
  timesWrong: number;
}

export interface Formula {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  isFavourite: boolean;
}

export interface Doubt {
  id: string;
  subjectId: string;
  topic: string;
  section?: string;
  question: string;
  resolved: boolean;
  savedAnswer?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface SubChapter {
  id: string;
  chapterId: string;
  name: string;
  status: 'not-started' | 'in-progress' | 'done';
  notes: Note[];
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  status: 'not-started' | 'in-progress' | 'done';
  source: 'school' | 'online' | 'both';
  notes: Note[];
  flashcards: Flashcard[];
  formulas: Formula[];
  subChapters?: SubChapter[];
}

export interface Subject {
  id: string;
  name: string;
  colour: string;
  icon: string;
  chapters: Chapter[];
}

export interface HomeworkItem {
  id: string;
  subjectId: string;
  title: string;
  dueDate: Date;
  done: boolean;
  urgent: boolean;
  priority?: 'Low' | 'Medium' | 'High';
  notes?: string;
}

export interface Exam {
  id: string;
  subjectId: string;
  name: string;
  type: string;
  date: Date;
  color?: string;
  linkedChapterIds: string[];
  linkedSubChapterIds?: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  subjectId?: string;
  color?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  notes?: string;
  repeat?: 'one-time' | 'daily' | 'weekdays' | 'weekly';
}

export interface StudySession {
  id: string;
  subjectId: string;
  duration: number; // minutes
  date: Date;
}

export interface UserProfile {
  name: string;
  targetCurriculum: string;
  targetGrade: string;
  avatarUrl?: string;
}

export interface TestMark {
  id: string;
  subjectId: string;
  chapterId?: string;
  type: string;
  marksObtained: number;
  totalMarks: number;
  date: Date;
}

export interface QuizResult {
  id: string;
  chapterId: string;
  score: number;
  total: number;
  date: Date;
}

export interface MockQuestion {
  id: string;
  question: string;
  marks: number;
  type: 'mcq' | 'short' | 'long';
  options?: string[];          // for MCQ
  correctAnswer: string;
  explanation?: string;
  userAnswer?: string;
  marksAwarded?: number;
}

export interface MockExamResult {
  id: string;
  subjectId: string;
  title: string;
  totalMarks: number;
  marksAwarded: number;
  questions: MockQuestion[];
  createdAt: Date;
  completedAt?: Date;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TimerState {
  running: boolean;
  endTime: string | null;   // ISO string — absolute time the timer ends
  mode: 'focus' | 'break';
  focusLength: number;      // minutes
  breakLength: number;      // minutes
  sessionSubject: string;
  sessionName: string;
}

export interface AppState {
  profile: UserProfile;
  subjects: Subject[];
  homework: HomeworkItem[];
  exams: Exam[];
  calendarEvents: CalendarEvent[];
  studySessions: StudySession[];
  doubts: Doubt[];
  streak: number;
  moodLog: { date: Date; mood: 'happy' | 'neutral' | 'stressed' }[];
  lastActivityDate: Date | null;
  testMarks: TestMark[];
  quizHistory: QuizResult[];
  mockExamResults: MockExamResult[];
  timerState: TimerState;

  examTypes: string[];
  eventTypes: string[];
  doubtCategories: string[];
  blockTypes: string[];
}

// ==========================================
// ACTIONS
// ==========================================

export type Action =
  | { type: 'SET_INITIAL_STATE'; payload: AppState }
  | { type: 'ADD_SUBJECT'; payload: Subject }
  | { type: 'EDIT_SUBJECT'; payload: Subject }
  | { type: 'DELETE_SUBJECT'; payload: string }
  | { type: 'ADD_CHAPTER'; payload: Chapter }
  | { type: 'DELETE_CHAPTER'; payload: { subjectId: string, chapterId: string } }
  | { type: 'UPDATE_CHAPTER_STATUS'; payload: { chapterId: string, subjectId: string, status: Chapter['status'] } }
  | { type: 'ADD_HOMEWORK'; payload: HomeworkItem }
  | { type: 'EDIT_HOMEWORK'; payload: HomeworkItem }
  | { type: 'DELETE_HOMEWORK'; payload: string }
  | { type: 'TOGGLE_HOMEWORK'; payload: string }
  | { type: 'ADD_DOUBT'; payload: Doubt }
  | { type: 'RESOLVE_DOUBT'; payload: { doubtId: string, answer?: string } }
  | { type: 'DELETE_DOUBT'; payload: string }
  | { type: 'ADD_NOTE'; payload: { note: Note, subjectId: string, chapterId: string } }
  | { type: 'DELETE_NOTE'; payload: { subjectId: string, chapterId: string, noteId: string } }
  | { type: 'ADD_SUBCHAPTER'; payload: { subjectId: string, chapterId: string, subChapter: SubChapter } }
  | { type: 'DELETE_SUBCHAPTER'; payload: { subjectId: string, chapterId: string, subChapterId: string } }
  | { type: 'UPDATE_SUBCHAPTER_STATUS'; payload: { subjectId: string, chapterId: string, subChapterId: string, status: SubChapter['status'] } }
  | { type: 'ADD_SUBCHAPTER_NOTE'; payload: { subjectId: string, chapterId: string, subChapterId: string, note: Note } }
  | { type: 'DELETE_SUBCHAPTER_NOTE'; payload: { subjectId: string, chapterId: string, subChapterId: string, noteId: string } }
  | { type: 'ADD_FLASHCARD'; payload: { flashcard: Flashcard, subjectId: string, chapterId: string } }
  | { type: 'DELETE_FLASHCARD'; payload: { subjectId: string, chapterId: string, flashcardId: string } }
  | { type: 'ADD_FLASHCARDS'; payload: { flashcards: Flashcard[], subjectId: string, chapterId: string } }
  | { type: 'ADD_FORMULA'; payload: { formula: Formula, subjectId: string, chapterId: string } }
  | { type: 'DELETE_FORMULA'; payload: { subjectId: string, chapterId: string, formulaId: string } }
  | { type: 'TOGGLE_FORMULA_FAVOURITE'; payload: { formulaId: string, subjectId: string, chapterId: string } }
  | { type: 'ADD_EXAM'; payload: Exam }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'ADD_EVENTS'; payload: CalendarEvent[] }
  | { type: 'EDIT_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'DELETE_EXAM'; payload: string }
  | { type: 'DELETE_TEST_MARK'; payload: string }
  | { type: 'LOG_STUDY_SESSION'; payload: StudySession }
  | { type: 'LOG_MOOD'; payload: { date: Date, mood: 'happy' | 'neutral' | 'stressed' } }
  | { type: 'INCREMENT_STREAK' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_TEST_MARK'; payload: TestMark }
  | { type: 'ADD_QUIZ_RESULT'; payload: QuizResult }
  | { type: 'UPDATE_CONFIG'; payload: { type: 'examTypes' | 'eventTypes' | 'doubtCategories' | 'blockTypes', data: string[] } }
  | { type: 'UPDATE_TIMER_STATE'; payload: Partial<TimerState> }
  | { type: 'SAVE_MOCK_EXAM'; payload: MockExamResult }
  | { type: 'DELETE_MOCK_EXAM'; payload: string }
  | { type: 'RESET_DATA' };

// ==========================================
// REDUCER
// ==========================================

export const initialTimerState: TimerState = {
  running: false,
  endTime: null,
  mode: 'focus',
  focusLength: 25,
  breakLength: 5,
  sessionSubject: '',
  sessionName: 'Deep Focus',
};

export const initialState: AppState = {
  profile: {
    name: '',
    targetCurriculum: 'IGCSE',
    targetGrade: 'Year 8',
  },
  subjects: [],
  homework: [],
  exams: [],
  calendarEvents: [],
  studySessions: [],
  doubts: [],
  streak: 0,
  moodLog: [],
  lastActivityDate: null,
  testMarks: [],
  quizHistory: [],
  mockExamResults: [],
  timerState: initialTimerState,
  examTypes: ['Unit Test', 'Mid-Term', 'Final', 'Class Test', 'Project'],
  eventTypes: ['School Class', 'Online Tuition', 'Self-Study', 'Exam', 'Project Deadline', 'Personal Note'],
  doubtCategories: ['Concept', 'Formula', 'Problem-Solving', 'General', 'Other'],
  blockTypes: ['Study', 'Homework', 'Reading', 'Project', 'Revision', 'Break', 'Sleep', 'Coffee', 'Play', 'TV', 'Music', 'Class']
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_INITIAL_STATE': {
      const parsed = action.payload;
      return {
        ...initialState,
        ...parsed,
        profile: { ...initialState.profile, ...(parsed.profile || {}) },
        subjects: parsed.subjects || [],
        homework: parsed.homework || [],
        exams: parsed.exams || [],
        calendarEvents: parsed.calendarEvents || [],
        studySessions: parsed.studySessions || [],
        doubts: parsed.doubts || [],
        moodLog: parsed.moodLog || [],
        testMarks: parsed.testMarks || [],
        quizHistory: parsed.quizHistory || [],
        mockExamResults: parsed.mockExamResults || [],
        examTypes: parsed.examTypes?.length ? parsed.examTypes : initialState.examTypes,
        eventTypes: parsed.eventTypes?.length ? parsed.eventTypes : initialState.eventTypes,
        doubtCategories: parsed.doubtCategories?.length ? parsed.doubtCategories : initialState.doubtCategories,
        blockTypes: parsed.blockTypes?.length ? parsed.blockTypes : initialState.blockTypes,
      };
    }
    case 'RESET_DATA':
      return { ...initialState, blockTypes: state.blockTypes, eventTypes: state.eventTypes, examTypes: state.examTypes, doubtCategories: state.doubtCategories };

    case 'ADD_SUBJECT':
      return { ...state, subjects: [...state.subjects, action.payload] };

    case 'ADD_CHAPTER':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? { ...sub, chapters: [...sub.chapters, { ...action.payload, subChapters: action.payload.subChapters || [] }] }
            : sub
        )
      };

    case 'UPDATE_CHAPTER_STATUS':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? { ...chap, status: action.payload.status }
                  : chap
              )
            }
            : sub
        )
      };

    case 'ADD_HOMEWORK':
      return { ...state, homework: [...state.homework, action.payload] };

    case 'EDIT_HOMEWORK':
      return { ...state, homework: state.homework.map(hw => hw.id === action.payload.id ? action.payload : hw) };

    case 'TOGGLE_HOMEWORK':
      return {
        ...state,
        homework: state.homework.map(hw =>
          hw.id === action.payload ? { ...hw, done: !hw.done } : hw
        )
      };

    case 'ADD_DOUBT':
      return { ...state, doubts: [action.payload, ...state.doubts] };

    case 'RESOLVE_DOUBT':
      return {
        ...state,
        doubts: state.doubts.map(d =>
          d.id === action.payload.doubtId
            ? { ...d, resolved: true, resolvedAt: new Date(), savedAnswer: action.payload.answer || d.savedAnswer }
            : d
        )
      };

    case 'DELETE_DOUBT':
      return { ...state, doubts: state.doubts.filter(d => d.id !== action.payload) };

    case 'EDIT_SUBJECT':
      return { ...state, subjects: state.subjects.map(s => s.id === action.payload.id ? action.payload : s) };

    case 'DELETE_SUBJECT':
      return { ...state, subjects: state.subjects.filter(s => s.id !== action.payload) };

    case 'DELETE_CHAPTER':
      return {
        ...state,
        subjects: state.subjects.map(s =>
          s.id === action.payload.subjectId
            ? { ...s, chapters: s.chapters.filter(c => c.id !== action.payload.chapterId) }
            : s
        )
      };

    case 'DELETE_HOMEWORK':
      return { ...state, homework: state.homework.filter(h => h.id !== action.payload) };

    case 'ADD_EVENTS':
      return { ...state, calendarEvents: [...state.calendarEvents, ...action.payload] };

    case 'EDIT_EVENT':
      return { ...state, calendarEvents: state.calendarEvents.map(e => e.id === action.payload.id ? action.payload : e) };

    case 'DELETE_EVENT':
      return { ...state, calendarEvents: state.calendarEvents.filter(e => e.id !== action.payload) };

    case 'DELETE_EXAM':
      return { ...state, exams: state.exams.filter(e => e.id !== action.payload) };

    case 'DELETE_TEST_MARK':
      return { ...state, testMarks: state.testMarks.filter(m => m.id !== action.payload) };

    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'ADD_NOTE':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? { ...chap, notes: [...chap.notes, action.payload.note] }
                  : chap
              )
            }
            : sub
        )
      };

    case 'DELETE_NOTE':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? { ...chap, notes: chap.notes.filter(n => n.id !== action.payload.noteId) }
                  : chap
              )
            }
            : sub
        )
      };

    case 'ADD_SUBCHAPTER':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? { ...chap, subChapters: [...(chap.subChapters || []), action.payload.subChapter] }
                  : chap
              )
            }
            : sub
        )
      };

    case 'DELETE_SUBCHAPTER':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? { ...chap, subChapters: (chap.subChapters || []).filter(sc => sc.id !== action.payload.subChapterId) }
                  : chap
              )
            }
            : sub
        )
      };

    case 'UPDATE_SUBCHAPTER_STATUS':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? {
                    ...chap,
                    subChapters: (chap.subChapters || []).map(sc =>
                      sc.id === action.payload.subChapterId ? { ...sc, status: action.payload.status } : sc
                    )
                  }
                  : chap
              )
            }
            : sub
        )
      };

    case 'ADD_SUBCHAPTER_NOTE':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? {
                    ...chap,
                    subChapters: (chap.subChapters || []).map(sc =>
                      sc.id === action.payload.subChapterId
                        ? { ...sc, notes: [...(sc.notes || []), action.payload.note] }
                        : sc
                    )
                  }
                  : chap
              )
            }
            : sub
        )
      };

    case 'DELETE_SUBCHAPTER_NOTE':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? {
                    ...chap,
                    subChapters: (chap.subChapters || []).map(sc =>
                      sc.id === action.payload.subChapterId
                        ? { ...sc, notes: (sc.notes || []).filter(n => n.id !== action.payload.noteId) }
                        : sc
                    )
                  }
                  : chap
              )
            }
            : sub
        )
      };

    case 'ADD_FLASHCARD':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? { ...chap, flashcards: [...chap.flashcards, action.payload.flashcard] }
                  : chap
              )
            }
            : sub
        )
      };

    case 'DELETE_FLASHCARD':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? { ...chap, flashcards: chap.flashcards.filter(f => f.id !== action.payload.flashcardId) }
                  : chap
              )
            }
            : sub
        )
      };

    case 'ADD_FLASHCARDS':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? { ...chap, flashcards: [...chap.flashcards, ...action.payload.flashcards] }
                  : chap
              )
            }
            : sub
        )
      };

    case 'ADD_FORMULA':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? { ...chap, formulas: [...chap.formulas, action.payload.formula] }
                  : chap
              )
            }
            : sub
        )
      };

    case 'DELETE_FORMULA':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? { ...chap, formulas: chap.formulas.filter(f => f.id !== action.payload.formulaId) }
                  : chap
              )
            }
            : sub
        )
      };

    case 'TOGGLE_FORMULA_FAVOURITE':
      return {
        ...state,
        subjects: state.subjects.map(sub =>
          sub.id === action.payload.subjectId
            ? {
              ...sub,
              chapters: sub.chapters.map(chap =>
                chap.id === action.payload.chapterId
                  ? {
                    ...chap,
                    formulas: chap.formulas.map(f =>
                      f.id === action.payload.formulaId ? { ...f, isFavourite: !f.isFavourite } : f
                    )
                  }
                  : chap
              )
            }
            : sub
        )
      };

    case 'ADD_EXAM':
      return { ...state, exams: [...state.exams, action.payload] };

    case 'ADD_EVENT':
      return { ...state, calendarEvents: [...state.calendarEvents, action.payload] };

    case 'LOG_STUDY_SESSION':
      return { ...state, studySessions: [...state.studySessions, action.payload] };

    case 'LOG_MOOD': {
      const todayString = action.payload.date.toISOString().split('T')[0];
      const existingFilter = state.moodLog.filter(m => {
        if (!m.date) return false;
        try { return new Date(m.date).toISOString().split('T')[0] !== todayString; } catch { return true; }
      });
      return { ...state, moodLog: [...existingFilter, action.payload] };
    }

    case 'INCREMENT_STREAK': {
      const today = new Date();
      let newStreak = state.streak;
      if (state.lastActivityDate) {
        const lastActivity = new Date(state.lastActivityDate);
        const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1 || state.streak === 0) newStreak += 1;
        else if (diffDays > 1) newStreak = 1;
      } else {
        newStreak = 1;
      }
      return { ...state, streak: newStreak, lastActivityDate: today };
    }

    case 'ADD_TEST_MARK':
      return { ...state, testMarks: [...(state.testMarks || []), action.payload] };

    case 'ADD_QUIZ_RESULT':
      return { ...state, quizHistory: [action.payload, ...(state.quizHistory || [])] };

    case 'UPDATE_CONFIG':
      return { ...state, [action.payload.type]: action.payload.data };

    case 'UPDATE_TIMER_STATE':
      return { ...state, timerState: { ...state.timerState, ...action.payload } };

    case 'SAVE_MOCK_EXAM':
      return { ...state, mockExamResults: [action.payload, ...(state.mockExamResults || [])] };

    case 'DELETE_MOCK_EXAM':
      return { ...state, mockExamResults: (state.mockExamResults || []).filter(m => m.id !== action.payload) };

    default:
      return state;
  }
}

// ==========================================
// DATE REVIVER HELPER (For JSON parsing fallback)
// ==========================================
function isDateString(val: string): boolean {
  // Accept any ISO 8601 date string (with or without ms, with or without Z/offset)
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val) && !isNaN(Date.parse(val));
}

function reviveDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (isDateString(obj)) return new Date(obj);
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(reviveDates);
  }
  if (typeof obj === 'object') {
    // Handle corrupted Date objects that became {} in storage
    if (obj instanceof Date) {
      return isNaN(obj.getTime()) ? null : obj;
    }
    // Empty object {} where a date should be — return null so callers can handle it
    if (Object.keys(obj).length === 0 && obj.constructor === Object) {
      return obj; // keep as-is — callers check for date fields specifically
    }
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = reviveDates(obj[key]);
    }
    return newObj;
  }
  return obj;
}

// Serialize state to JSON-safe format (Dates → ISO strings) before storage.
// This prevents the {} corruption that occurs when IndexedDB/structured-clone
// fails on Date objects in some environments.
function serializeForStorage(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (_key, value) => {
    // Date objects → ISO string
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value.toISOString();
    }
    return value;
  }));
}

// ==========================================
// CONTEXT PROVIDER
// ==========================================

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  isSaving: boolean;
  lastSaveTime: Date | null;
  forceSave: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'chaptered_state';

localforage.config({
  name: 'ChapteredApp',
  storeName: 'app_state'
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false);

  // ── HOOK 1: Load from localforage on mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        // ── Always load from local storage (fast, reliable) ──────────────
        // Cloud sync happens on save (push) and via explicit "Connect" in Settings (pull)
        const savedData = await localforage.getItem<AppState>(STORAGE_KEY);
        if (!cancelled && savedData) {
          const parsed = reviveDates(savedData) as AppState;
          const merged: AppState = {
            ...initialState,
            ...parsed,
            profile: { ...initialState.profile, ...(parsed.profile || {}) },
            subjects: parsed.subjects || [],
            homework: parsed.homework || [],
            exams: parsed.exams || [],
            calendarEvents: parsed.calendarEvents || [],
            studySessions: parsed.studySessions || [],
            doubts: parsed.doubts || [],
            moodLog: parsed.moodLog || [],
            testMarks: parsed.testMarks || [],
            quizHistory: parsed.quizHistory || [],
            mockExamResults: parsed.mockExamResults || [],
            timerState: parsed.timerState ? { ...initialTimerState, ...parsed.timerState, running: false } : initialTimerState,
            examTypes: parsed.examTypes?.length ? parsed.examTypes : initialState.examTypes,
            eventTypes: parsed.eventTypes?.length ? parsed.eventTypes : initialState.eventTypes,
            doubtCategories: parsed.doubtCategories?.length ? parsed.doubtCategories : initialState.doubtCategories,
            blockTypes: parsed.blockTypes?.length ? parsed.blockTypes : initialState.blockTypes,
          };
          dispatch({ type: 'SET_INITIAL_STATE', payload: merged });
        }
      } catch (err) {
        console.error('Chaptered: Load Phase Error:', err);
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
          // Small delay to let SET_INITIAL_STATE propagate before saves can trigger
          setTimeout(() => { if (!cancelled) setHasCompletedInitialLoad(true); }, 150);
        }
      }
    }

    loadData();

    // Safety net: if storage is corrupted/very slow, force the app to show after 4s
    const safety = setTimeout(() => {
      if (!cancelled) {
        setIsLoaded(true);
        setTimeout(() => { if (!cancelled) setHasCompletedInitialLoad(true); }, 150);
      }
    }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── HOOK 2: Auto-save on state change ──────────────────────────────────
  useEffect(() => {
    // CRITICAL: Never save before load is confirmed complete — this was
    // the "blank screen overwrite" bug.
    if (!isLoaded || !hasCompletedInitialLoad) return;

    setIsSaving(true);
    const timer = setTimeout(async () => {
      try {
        // Serialize dates to ISO strings BEFORE storing — prevents {} corruption
        const serialized = serializeForStorage(state);
        await localforage.setItem(STORAGE_KEY, serialized);
        // Also push to cloud if household code is set
        const code = getHouseholdCodeSync();
        if (code) await pushToCloud(code, serialized);
        setLastSaveTime(new Date());
      } catch (err) {
        console.error('Chaptered: Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [state, isLoaded, hasCompletedInitialLoad]);

  // ── HOOK 3: Warn before closing during save ─────────────────────────────
  useEffect(() => {
    const handle = (e: BeforeUnloadEvent) => {
      if (isSaving) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, [isSaving]);

  // forceSave — defined as a regular function (not a hook) using state from closure
  const forceSave = async () => {
    setIsSaving(true);
    try {
      const serialized = serializeForStorage(state);
      await localforage.setItem(STORAGE_KEY, serialized);
      setLastSaveTime(new Date());
      console.log('Chaptered: Forced save complete.');
    } catch (err) {
      console.error('Chaptered: Forced save failed:', err);
      alert('Failed to save! Your browser storage might be full.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── HOOK 4: Expose forceSave globally ──────────────────────────────────
  useEffect(() => {
    (window as any).forceChapteredSave = forceSave;
  }); // intentionally runs every render to keep closure fresh

  // ── ALL HOOKS COMPLETE. Conditional render is now safe. ────────────────
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#FF6B9D] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Loading Chaptered...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch, isSaving, lastSaveTime, forceSave }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
