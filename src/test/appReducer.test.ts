import { describe, it, expect } from 'vitest';
import { appReducer, initialState, initialTimerState } from '../context/AppContext';
import type {
  AppState, Subject, Chapter, HomeworkItem, Doubt, Note, SubChapter,
  Flashcard, Formula, Exam, CalendarEvent, StudySession, AttendanceLog,
  TestMark, MockExamResult,
} from '../context/AppContext';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: 's1',
    name: 'Maths',
    colour: '#FF0000',
    icon: 'BookOpen',
    chapters: [],
    ...overrides,
  };
}

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 'c1',
    subjectId: 's1',
    name: 'Algebra',
    schoolStatus: 'not-covered',
    onlineStatus: 'not-covered',
    examStatus: 'not-started',
    flaggedForRevision: false,
    source: 'school',
    notes: [],
    flashcards: [],
    formulas: [],
    subChapters: [],
    ...overrides,
  };
}

function makeHomework(overrides: Partial<HomeworkItem> = {}): HomeworkItem {
  return {
    id: 'hw1',
    title: 'Exercise 1',
    subjectId: 's1',
    dueDate: new Date('2025-01-01'),
    done: false,
    urgent: false,
    ...overrides,
  };
}

function makeDoubt(overrides: Partial<Doubt> = {}): Doubt {
  return {
    id: 'd1',
    subjectId: 's1',
    topic: 'Calculus',
    section: '',
    question: 'What is a derivative?',
    resolved: false,
    savedAnswer: '',
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    chapterId: 'c1',
    type: 'text',
    content: 'Some note',
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function makeFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: 'f1',
    chapterId: 'c1',
    question: 'Q?',
    answer: 'A',
    difficulty: 'medium',
    timesCorrect: 0,
    timesWrong: 0,
    ...overrides,
  };
}

function makeFormula(overrides: Partial<Formula> = {}): Formula {
  return {
    id: 'fm1',
    chapterId: 'c1',
    title: 'Energy',
    content: 'E=mc^2',
    isFavourite: false,
    ...overrides,
  };
}

function makeAttendanceLog(overrides: Partial<AttendanceLog> = {}): AttendanceLog {
  return {
    id: 'att1',
    subjectId: 's1',
    date: new Date('2025-01-06'),
    status: 'attended',
    loggedAt: new Date('2025-01-06'),
    ...overrides,
  };
}

function stateWithSubjectAndChapter(): AppState {
  const sub = makeSubject({ chapters: [makeChapter()] });
  return { ...initialState, subjects: [sub] };
}

// ─── initialState ──────────────────────────────────────────────────────────

describe('initialState', () => {
  it('has empty arrays for all list fields', () => {
    expect(initialState.subjects).toEqual([]);
    expect(initialState.homework).toEqual([]);
    expect(initialState.exams).toEqual([]);
    expect(initialState.calendarEvents).toEqual([]);
    expect(initialState.studySessions).toEqual([]);
    expect(initialState.doubts).toEqual([]);
    expect(initialState.moodLog).toEqual([]);
    expect(initialState.testMarks).toEqual([]);
    expect(initialState.quizHistory).toEqual([]);
    expect(initialState.mockExamResults).toEqual([]);
    expect(initialState.attendanceLogs).toEqual([]);
  });

  it('has correct default profile', () => {
    expect(initialState.profile.name).toBe('');
    expect(initialState.profile.targetCurriculum).toBe('IGCSE');
  });

  it('has streak 0 and null lastActivityDate', () => {
    expect(initialState.streak).toBe(0);
    expect(initialState.lastActivityDate).toBeNull();
  });
});

describe('initialTimerState', () => {
  it('starts not running, mode=focus, 25/5 lengths', () => {
    expect(initialTimerState.running).toBe(false);
    expect(initialTimerState.endTime).toBeNull();
    expect(initialTimerState.mode).toBe('focus');
    expect(initialTimerState.focusLength).toBe(25);
    expect(initialTimerState.breakLength).toBe(5);
  });
});

// ─── SET_INITIAL_STATE ─────────────────────────────────────────────────────

describe('SET_INITIAL_STATE', () => {
  it('merges payload over initialState', () => {
    const payload = { ...initialState, subjects: [makeSubject()], streak: 5 };
    const next = appReducer(initialState, { type: 'SET_INITIAL_STATE', payload });
    expect(next.subjects).toHaveLength(1);
    expect(next.streak).toBe(5);
  });

  it('falls back to initialState arrays when payload arrays are missing', () => {
    const payload = { ...initialState, subjects: undefined as any, attendanceLogs: undefined as any };
    const next = appReducer(initialState, { type: 'SET_INITIAL_STATE', payload });
    expect(next.subjects).toEqual([]);
    expect(next.attendanceLogs).toEqual([]);
  });

  it('falls back to default config when payload config is empty', () => {
    const payload = { ...initialState, examTypes: [] };
    const next = appReducer(initialState, { type: 'SET_INITIAL_STATE', payload });
    expect(next.examTypes).toEqual(initialState.examTypes);
  });

  it('keeps payload config when not empty', () => {
    const payload = { ...initialState, examTypes: ['Custom'] };
    const next = appReducer(initialState, { type: 'SET_INITIAL_STATE', payload });
    expect(next.examTypes).toEqual(['Custom']);
  });
});

// ─── RESET_DATA ────────────────────────────────────────────────────────────

describe('RESET_DATA', () => {
  it('clears subjects and homework but preserves config', () => {
    const state: AppState = {
      ...initialState,
      subjects: [makeSubject()],
      homework: [makeHomework()],
      examTypes: ['Custom Exam'],
    };
    const next = appReducer(state, { type: 'RESET_DATA' });
    expect(next.subjects).toEqual([]);
    expect(next.homework).toEqual([]);
    expect(next.examTypes).toEqual(['Custom Exam']);
  });
});

// ─── Subjects ─────────────────────────────────────────────────────────────

describe('ADD_SUBJECT', () => {
  it('appends subject', () => {
    const sub = makeSubject();
    const next = appReducer(initialState, { type: 'ADD_SUBJECT', payload: sub });
    expect(next.subjects).toHaveLength(1);
    expect(next.subjects[0]).toBe(sub);
  });
});

describe('EDIT_SUBJECT', () => {
  it('replaces subject by id', () => {
    const state = { ...initialState, subjects: [makeSubject()] };
    const updated = makeSubject({ name: 'Physics' });
    const next = appReducer(state, { type: 'EDIT_SUBJECT', payload: updated });
    expect(next.subjects[0].name).toBe('Physics');
  });

  it('does not change subjects when id not found', () => {
    const state = { ...initialState, subjects: [makeSubject()] };
    const updated = makeSubject({ id: 'not-found', name: 'Unknown' });
    const next = appReducer(state, { type: 'EDIT_SUBJECT', payload: updated });
    expect(next.subjects[0].name).toBe('Maths');
  });
});

describe('DELETE_SUBJECT', () => {
  it('removes subject by id', () => {
    const state = { ...initialState, subjects: [makeSubject({ id: 's1' }), makeSubject({ id: 's2' })] };
    const next = appReducer(state, { type: 'DELETE_SUBJECT', payload: 's1' });
    expect(next.subjects).toHaveLength(1);
    expect(next.subjects[0].id).toBe('s2');
  });
});

// ─── Chapters ─────────────────────────────────────────────────────────────

describe('ADD_CHAPTER', () => {
  it('adds chapter to matching subject', () => {
    const state = { ...initialState, subjects: [makeSubject()] };
    const chap = makeChapter();
    const next = appReducer(state, { type: 'ADD_CHAPTER', payload: chap });
    expect(next.subjects[0].chapters).toHaveLength(1);
  });

  it('defaults subChapters to [] if missing', () => {
    const state = { ...initialState, subjects: [makeSubject()] };
    const chap = { ...makeChapter(), subChapters: undefined as any };
    const next = appReducer(state, { type: 'ADD_CHAPTER', payload: chap });
    expect(next.subjects[0].chapters[0].subChapters).toEqual([]);
  });
});

describe('UPDATE_CHAPTER_STATUS', () => {
  it('updates legacy chapter status', () => {
    const state = stateWithSubjectAndChapter();
    const next = appReducer(state, {
      type: 'UPDATE_CHAPTER_STATUS',
      payload: { subjectId: 's1', chapterId: 'c1', status: 'done' },
    });
    expect(next.subjects[0].chapters[0].status).toBe('done');
  });
});

describe('UPDATE_CHAPTER_TRACK', () => {
  it('updates examStatus', () => {
    const state = stateWithSubjectAndChapter();
    const next = appReducer(state, {
      type: 'UPDATE_CHAPTER_TRACK',
      payload: { subjectId: 's1', chapterId: 'c1', field: 'examStatus', value: 'confident' },
    });
    expect(next.subjects[0].chapters[0].examStatus).toBe('confident');
  });

  it('updates schoolStatus', () => {
    const state = stateWithSubjectAndChapter();
    const next = appReducer(state, {
      type: 'UPDATE_CHAPTER_TRACK',
      payload: { subjectId: 's1', chapterId: 'c1', field: 'schoolStatus', value: 'covered' },
    });
    expect(next.subjects[0].chapters[0].schoolStatus).toBe('covered');
  });

  it('updates onlineStatus', () => {
    const state = stateWithSubjectAndChapter();
    const next = appReducer(state, {
      type: 'UPDATE_CHAPTER_TRACK',
      payload: { subjectId: 's1', chapterId: 'c1', field: 'onlineStatus', value: 'covered' },
    });
    expect(next.subjects[0].chapters[0].onlineStatus).toBe('covered');
  });

  it('updates flaggedForRevision', () => {
    const state = stateWithSubjectAndChapter();
    const next = appReducer(state, {
      type: 'UPDATE_CHAPTER_TRACK',
      payload: { subjectId: 's1', chapterId: 'c1', field: 'flaggedForRevision', value: true },
    });
    expect(next.subjects[0].chapters[0].flaggedForRevision).toBe(true);
  });
});

describe('DELETE_CHAPTER', () => {
  it('removes chapter from subject', () => {
    const state = stateWithSubjectAndChapter();
    const next = appReducer(state, { type: 'DELETE_CHAPTER', payload: { subjectId: 's1', chapterId: 'c1' } });
    expect(next.subjects[0].chapters).toHaveLength(0);
  });
});

// ─── Homework ─────────────────────────────────────────────────────────────

describe('ADD_HOMEWORK', () => {
  it('appends homework item', () => {
    const hw = makeHomework();
    const next = appReducer(initialState, { type: 'ADD_HOMEWORK', payload: hw });
    expect(next.homework).toHaveLength(1);
  });
});

describe('EDIT_HOMEWORK', () => {
  it('replaces homework item by id', () => {
    const state = { ...initialState, homework: [makeHomework()] };
    const updated = makeHomework({ title: 'Updated' });
    const next = appReducer(state, { type: 'EDIT_HOMEWORK', payload: updated });
    expect(next.homework[0].title).toBe('Updated');
  });
});

describe('TOGGLE_HOMEWORK', () => {
  it('toggles done from false to true', () => {
    const state = { ...initialState, homework: [makeHomework({ done: false })] };
    const next = appReducer(state, { type: 'TOGGLE_HOMEWORK', payload: 'hw1' });
    expect(next.homework[0].done).toBe(true);
  });

  it('toggles done from true to false', () => {
    const state = { ...initialState, homework: [makeHomework({ done: true })] };
    const next = appReducer(state, { type: 'TOGGLE_HOMEWORK', payload: 'hw1' });
    expect(next.homework[0].done).toBe(false);
  });
});

describe('DELETE_HOMEWORK', () => {
  it('removes homework by id', () => {
    const state = { ...initialState, homework: [makeHomework(), makeHomework({ id: 'hw2' })] };
    const next = appReducer(state, { type: 'DELETE_HOMEWORK', payload: 'hw1' });
    expect(next.homework).toHaveLength(1);
    expect(next.homework[0].id).toBe('hw2');
  });
});

// ─── Doubts ───────────────────────────────────────────────────────────────

describe('ADD_DOUBT', () => {
  it('prepends doubt', () => {
    const existing = makeDoubt({ id: 'd-old' });
    const state = { ...initialState, doubts: [existing] };
    const newDoubt = makeDoubt({ id: 'd-new' });
    const next = appReducer(state, { type: 'ADD_DOUBT', payload: newDoubt });
    expect(next.doubts[0].id).toBe('d-new');
    expect(next.doubts).toHaveLength(2);
  });
});

describe('RESOLVE_DOUBT', () => {
  it('marks doubt resolved and sets answer', () => {
    const state = { ...initialState, doubts: [makeDoubt()] };
    const next = appReducer(state, { type: 'RESOLVE_DOUBT', payload: { doubtId: 'd1', answer: 'It is the slope' } });
    expect(next.doubts[0].resolved).toBe(true);
    expect(next.doubts[0].savedAnswer).toBe('It is the slope');
  });

  it('keeps existing savedAnswer if no answer provided', () => {
    const state = { ...initialState, doubts: [makeDoubt({ savedAnswer: 'existing' })] };
    const next = appReducer(state, { type: 'RESOLVE_DOUBT', payload: { doubtId: 'd1' } });
    expect(next.doubts[0].savedAnswer).toBe('existing');
  });
});

describe('DELETE_DOUBT', () => {
  it('removes doubt by id', () => {
    const state = { ...initialState, doubts: [makeDoubt()] };
    const next = appReducer(state, { type: 'DELETE_DOUBT', payload: 'd1' });
    expect(next.doubts).toHaveLength(0);
  });
});

// ─── Notes ────────────────────────────────────────────────────────────────

describe('ADD_NOTE', () => {
  it('adds note to correct chapter', () => {
    const state = stateWithSubjectAndChapter();
    const note = makeNote();
    const next = appReducer(state, { type: 'ADD_NOTE', payload: { note, subjectId: 's1', chapterId: 'c1' } });
    expect(next.subjects[0].chapters[0].notes).toHaveLength(1);
  });
});

describe('DELETE_NOTE', () => {
  it('removes note from chapter', () => {
    const chap = makeChapter({ notes: [makeNote()] });
    const sub = makeSubject({ chapters: [chap] });
    const state = { ...initialState, subjects: [sub] };
    const next = appReducer(state, { type: 'DELETE_NOTE', payload: { subjectId: 's1', chapterId: 'c1', noteId: 'n1' } });
    expect(next.subjects[0].chapters[0].notes).toHaveLength(0);
  });
});

// ─── SubChapters ──────────────────────────────────────────────────────────

describe('ADD_SUBCHAPTER', () => {
  it('appends sub-chapter to chapter', () => {
    const state = stateWithSubjectAndChapter();
    const sc: SubChapter = { id: 'sc1', chapterId: 'c1', name: 'Limits', status: 'not-started', notes: [] };
    const next = appReducer(state, { type: 'ADD_SUBCHAPTER', payload: { subjectId: 's1', chapterId: 'c1', subChapter: sc } });
    expect(next.subjects[0].chapters[0].subChapters).toHaveLength(1);
  });
});

describe('UPDATE_SUBCHAPTER_STATUS', () => {
  it('updates sub-chapter status', () => {
    const sc: SubChapter = { id: 'sc1', chapterId: 'c1', name: 'Limits', status: 'not-started', notes: [] };
    const chap = makeChapter({ subChapters: [sc] });
    const sub = makeSubject({ chapters: [chap] });
    const state = { ...initialState, subjects: [sub] };
    const next = appReducer(state, {
      type: 'UPDATE_SUBCHAPTER_STATUS',
      payload: { subjectId: 's1', chapterId: 'c1', subChapterId: 'sc1', status: 'done' },
    });
    expect(next.subjects[0].chapters[0].subChapters![0].status).toBe('done');
  });
});

describe('DELETE_SUBCHAPTER', () => {
  it('removes sub-chapter', () => {
    const sc: SubChapter = { id: 'sc1', chapterId: 'c1', name: 'Limits', status: 'not-started', notes: [] };
    const chap = makeChapter({ subChapters: [sc] });
    const sub = makeSubject({ chapters: [chap] });
    const state = { ...initialState, subjects: [sub] };
    const next = appReducer(state, { type: 'DELETE_SUBCHAPTER', payload: { subjectId: 's1', chapterId: 'c1', subChapterId: 'sc1' } });
    expect(next.subjects[0].chapters[0].subChapters).toHaveLength(0);
  });
});

describe('ADD_SUBCHAPTER_NOTE', () => {
  it('adds note to sub-chapter', () => {
    const sc: SubChapter = { id: 'sc1', chapterId: 'c1', name: 'Limits', status: 'not-started', notes: [] };
    const chap = makeChapter({ subChapters: [sc] });
    const sub = makeSubject({ chapters: [chap] });
    const state = { ...initialState, subjects: [sub] };
    const note = makeNote();
    const next = appReducer(state, {
      type: 'ADD_SUBCHAPTER_NOTE',
      payload: { subjectId: 's1', chapterId: 'c1', subChapterId: 'sc1', note },
    });
    expect(next.subjects[0].chapters[0].subChapters![0].notes).toHaveLength(1);
  });
});

describe('DELETE_SUBCHAPTER_NOTE', () => {
  it('removes note from sub-chapter', () => {
    const sc: SubChapter = { id: 'sc1', chapterId: 'c1', name: 'Limits', status: 'not-started', notes: [makeNote()] };
    const chap = makeChapter({ subChapters: [sc] });
    const sub = makeSubject({ chapters: [chap] });
    const state = { ...initialState, subjects: [sub] };
    const next = appReducer(state, {
      type: 'DELETE_SUBCHAPTER_NOTE',
      payload: { subjectId: 's1', chapterId: 'c1', subChapterId: 'sc1', noteId: 'n1' },
    });
    expect(next.subjects[0].chapters[0].subChapters![0].notes).toHaveLength(0);
  });
});

// ─── Flashcards ───────────────────────────────────────────────────────────

describe('ADD_FLASHCARD', () => {
  it('adds flashcard to chapter', () => {
    const state = stateWithSubjectAndChapter();
    const next = appReducer(state, { type: 'ADD_FLASHCARD', payload: { flashcard: makeFlashcard(), subjectId: 's1', chapterId: 'c1' } });
    expect(next.subjects[0].chapters[0].flashcards).toHaveLength(1);
  });
});

describe('ADD_FLASHCARDS', () => {
  it('adds multiple flashcards', () => {
    const state = stateWithSubjectAndChapter();
    const next = appReducer(state, {
      type: 'ADD_FLASHCARDS',
      payload: { flashcards: [makeFlashcard(), makeFlashcard({ id: 'f2' })], subjectId: 's1', chapterId: 'c1' },
    });
    expect(next.subjects[0].chapters[0].flashcards).toHaveLength(2);
  });
});

describe('DELETE_FLASHCARD', () => {
  it('removes flashcard by id', () => {
    const chap = makeChapter({ flashcards: [makeFlashcard()] });
    const sub = makeSubject({ chapters: [chap] });
    const state = { ...initialState, subjects: [sub] };
    const next = appReducer(state, { type: 'DELETE_FLASHCARD', payload: { subjectId: 's1', chapterId: 'c1', flashcardId: 'f1' } });
    expect(next.subjects[0].chapters[0].flashcards).toHaveLength(0);
  });
});

// ─── Formulas ─────────────────────────────────────────────────────────────

describe('ADD_FORMULA', () => {
  it('adds formula to chapter', () => {
    const state = stateWithSubjectAndChapter();
    const next = appReducer(state, { type: 'ADD_FORMULA', payload: { formula: makeFormula(), subjectId: 's1', chapterId: 'c1' } });
    expect(next.subjects[0].chapters[0].formulas).toHaveLength(1);
  });
});

describe('DELETE_FORMULA', () => {
  it('removes formula by id', () => {
    const chap = makeChapter({ formulas: [makeFormula()] });
    const sub = makeSubject({ chapters: [chap] });
    const state = { ...initialState, subjects: [sub] };
    const next = appReducer(state, { type: 'DELETE_FORMULA', payload: { subjectId: 's1', chapterId: 'c1', formulaId: 'fm1' } });
    expect(next.subjects[0].chapters[0].formulas).toHaveLength(0);
  });
});

describe('TOGGLE_FORMULA_FAVOURITE', () => {
  it('flips isFavourite from false to true', () => {
    const chap = makeChapter({ formulas: [makeFormula({ isFavourite: false })] });
    const sub = makeSubject({ chapters: [chap] });
    const state = { ...initialState, subjects: [sub] };
    const next = appReducer(state, { type: 'TOGGLE_FORMULA_FAVOURITE', payload: { subjectId: 's1', chapterId: 'c1', formulaId: 'fm1' } });
    expect(next.subjects[0].chapters[0].formulas[0].isFavourite).toBe(true);
  });

  it('flips isFavourite from true to false', () => {
    const chap = makeChapter({ formulas: [makeFormula({ isFavourite: true })] });
    const sub = makeSubject({ chapters: [chap] });
    const state = { ...initialState, subjects: [sub] };
    const next = appReducer(state, { type: 'TOGGLE_FORMULA_FAVOURITE', payload: { subjectId: 's1', chapterId: 'c1', formulaId: 'fm1' } });
    expect(next.subjects[0].chapters[0].formulas[0].isFavourite).toBe(false);
  });
});

// ─── Exams ────────────────────────────────────────────────────────────────

describe('ADD_EXAM / DELETE_EXAM', () => {
  const exam: Exam = { id: 'e1', name: 'Final', subjectId: 's1', date: new Date('2025-06-01'), type: 'Final', linkedChapterIds: [] };

  it('adds exam', () => {
    const next = appReducer(initialState, { type: 'ADD_EXAM', payload: exam });
    expect(next.exams).toHaveLength(1);
  });

  it('deletes exam', () => {
    const state = { ...initialState, exams: [exam] };
    const next = appReducer(state, { type: 'DELETE_EXAM', payload: 'e1' });
    expect(next.exams).toHaveLength(0);
  });
});

// ─── Calendar Events ──────────────────────────────────────────────────────

describe('ADD_EVENT / ADD_EVENTS / EDIT_EVENT / DELETE_EVENT', () => {
  const ev: CalendarEvent = { id: 'ev1', title: 'Class', date: new Date('2025-01-10'), type: 'School Class' };

  it('adds single event', () => {
    const next = appReducer(initialState, { type: 'ADD_EVENT', payload: ev });
    expect(next.calendarEvents).toHaveLength(1);
  });

  it('adds multiple events', () => {
    const ev2 = { ...ev, id: 'ev2' };
    const next = appReducer(initialState, { type: 'ADD_EVENTS', payload: [ev, ev2] });
    expect(next.calendarEvents).toHaveLength(2);
  });

  it('edits event', () => {
    const state = { ...initialState, calendarEvents: [ev] };
    const updated = { ...ev, title: 'Updated Class' };
    const next = appReducer(state, { type: 'EDIT_EVENT', payload: updated });
    expect(next.calendarEvents[0].title).toBe('Updated Class');
  });

  it('deletes event', () => {
    const state = { ...initialState, calendarEvents: [ev] };
    const next = appReducer(state, { type: 'DELETE_EVENT', payload: 'ev1' });
    expect(next.calendarEvents).toHaveLength(0);
  });
});

// ─── Study Session ────────────────────────────────────────────────────────

describe('LOG_STUDY_SESSION', () => {
  it('appends study session', () => {
    const session: StudySession = { id: 'ss1', subjectId: 's1', date: new Date(), duration: 60 };
    const next = appReducer(initialState, { type: 'LOG_STUDY_SESSION', payload: session });
    expect(next.studySessions).toHaveLength(1);
  });
});

// ─── Mood ─────────────────────────────────────────────────────────────────

describe('LOG_MOOD', () => {
  it('adds first mood entry', () => {
    const next = appReducer(initialState, { type: 'LOG_MOOD', payload: { date: new Date('2025-01-01T10:00:00'), mood: 'happy' } });
    expect(next.moodLog).toHaveLength(1);
    expect(next.moodLog[0].mood).toBe('happy');
  });

  it('replaces existing mood for same day', () => {
    const state = {
      ...initialState,
      moodLog: [{ date: new Date('2025-01-01T08:00:00'), mood: 'neutral' as const }],
    };
    const next = appReducer(state, { type: 'LOG_MOOD', payload: { date: new Date('2025-01-01T18:00:00'), mood: 'happy' } });
    expect(next.moodLog).toHaveLength(1);
    expect(next.moodLog[0].mood).toBe('happy');
  });
});

// ─── Streak ───────────────────────────────────────────────────────────────

describe('INCREMENT_STREAK', () => {
  it('starts streak at 1 when no prior activity', () => {
    const next = appReducer(initialState, { type: 'INCREMENT_STREAK' });
    expect(next.streak).toBe(1);
  });

  it('increments streak when last activity was yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const state = { ...initialState, streak: 3, lastActivityDate: yesterday };
    const next = appReducer(state, { type: 'INCREMENT_STREAK' });
    expect(next.streak).toBe(4);
  });

  it('resets streak to 1 when last activity was more than 1 day ago', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const state = { ...initialState, streak: 10, lastActivityDate: threeDaysAgo };
    const next = appReducer(state, { type: 'INCREMENT_STREAK' });
    expect(next.streak).toBe(1);
  });

  it('increments when streak is 0 (first time today)', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const state = { ...initialState, streak: 0, lastActivityDate: yesterday };
    const next = appReducer(state, { type: 'INCREMENT_STREAK' });
    expect(next.streak).toBe(1);
  });
});

// ─── Profile ──────────────────────────────────────────────────────────────

describe('UPDATE_PROFILE', () => {
  it('merges partial profile', () => {
    const next = appReducer(initialState, { type: 'UPDATE_PROFILE', payload: { name: 'Aaryana' } });
    expect(next.profile.name).toBe('Aaryana');
    expect(next.profile.targetCurriculum).toBe('IGCSE');
  });
});

// ─── Test Marks ───────────────────────────────────────────────────────────

describe('ADD_TEST_MARK / DELETE_TEST_MARK', () => {
  const mark: TestMark = { id: 'tm1', subjectId: 's1', type: 'Unit Test', marksObtained: 85, totalMarks: 100, date: new Date() };

  it('adds test mark', () => {
    const next = appReducer(initialState, { type: 'ADD_TEST_MARK', payload: mark });
    expect(next.testMarks).toHaveLength(1);
  });

  it('deletes test mark', () => {
    const state = { ...initialState, testMarks: [mark] };
    const next = appReducer(state, { type: 'DELETE_TEST_MARK', payload: 'tm1' });
    expect(next.testMarks).toHaveLength(0);
  });
});

// ─── Quiz Result ──────────────────────────────────────────────────────────

describe('ADD_QUIZ_RESULT', () => {
  it('prepends quiz result', () => {
    const result = { id: 'qr1', subjectId: 's1', chapterId: 'c1', score: 8, total: 10, date: new Date(), answers: [] };
    const next = appReducer(initialState, { type: 'ADD_QUIZ_RESULT', payload: result });
    expect(next.quizHistory[0]).toBe(result);
  });
});

// ─── Config ───────────────────────────────────────────────────────────────

describe('UPDATE_CONFIG', () => {
  it('updates examTypes', () => {
    const next = appReducer(initialState, { type: 'UPDATE_CONFIG', payload: { type: 'examTypes', data: ['A', 'B'] } });
    expect(next.examTypes).toEqual(['A', 'B']);
  });

  it('updates blockTypes', () => {
    const next = appReducer(initialState, { type: 'UPDATE_CONFIG', payload: { type: 'blockTypes', data: ['Study'] } });
    expect(next.blockTypes).toEqual(['Study']);
  });
});

// ─── Timer State ──────────────────────────────────────────────────────────

describe('UPDATE_TIMER_STATE', () => {
  it('merges partial timer state', () => {
    const next = appReducer(initialState, { type: 'UPDATE_TIMER_STATE', payload: { running: true, mode: 'break' } });
    expect(next.timerState.running).toBe(true);
    expect(next.timerState.mode).toBe('break');
    expect(next.timerState.focusLength).toBe(25); // unchanged
  });
});

// ─── Mock Exams ───────────────────────────────────────────────────────────

describe('SAVE_MOCK_EXAM / DELETE_MOCK_EXAM', () => {
  const mockExam: MockExamResult = {
    id: 'me1', subjectId: 's1', title: 'Mock 1',
    totalMarks: 100, marksAwarded: 70, questions: [],
    createdAt: new Date(), difficulty: 'medium',
  };

  it('prepends mock exam result', () => {
    const next = appReducer(initialState, { type: 'SAVE_MOCK_EXAM', payload: mockExam });
    expect(next.mockExamResults[0]).toBe(mockExam);
  });

  it('deletes mock exam by id', () => {
    const state = { ...initialState, mockExamResults: [mockExam] };
    const next = appReducer(state, { type: 'DELETE_MOCK_EXAM', payload: 'me1' });
    expect(next.mockExamResults).toHaveLength(0);
  });
});

// ─── Attendance ───────────────────────────────────────────────────────────

describe('LOG_ATTENDANCE', () => {
  it('appends attendance log', () => {
    const log = makeAttendanceLog();
    const next = appReducer(initialState, { type: 'LOG_ATTENDANCE', payload: log });
    expect(next.attendanceLogs).toHaveLength(1);
    expect(next.attendanceLogs[0]).toBe(log);
  });
});

describe('UPDATE_ATTENDANCE', () => {
  it('replaces attendance log by id', () => {
    const state = { ...initialState, attendanceLogs: [makeAttendanceLog()] };
    const updated = makeAttendanceLog({ status: 'cancelled' });
    const next = appReducer(state, { type: 'UPDATE_ATTENDANCE', payload: updated });
    expect(next.attendanceLogs[0].status).toBe('cancelled');
  });
});

describe('DELETE_ATTENDANCE', () => {
  it('removes log by id', () => {
    const state = { ...initialState, attendanceLogs: [makeAttendanceLog(), makeAttendanceLog({ id: 'att2' })] };
    const next = appReducer(state, { type: 'DELETE_ATTENDANCE', payload: 'att1' });
    expect(next.attendanceLogs).toHaveLength(1);
    expect(next.attendanceLogs[0].id).toBe('att2');
  });
});

// ─── Default case ─────────────────────────────────────────────────────────

describe('unknown action', () => {
  it('returns state unchanged', () => {
    const next = appReducer(initialState, { type: 'UNKNOWN_ACTION' } as any);
    expect(next).toBe(initialState);
  });
});
