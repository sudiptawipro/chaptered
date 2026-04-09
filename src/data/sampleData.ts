import type { AppState, Chapter } from '../context/AppContext';
import { addDays, subDays } from 'date-fns';

// Helper: convert old-style chapter object to new dual-track format
function ch(c: Omit<Chapter, 'schoolStatus' | 'onlineStatus' | 'examStatus'> & { status?: string }): Chapter {
  const s = c.status as string | undefined;
  return {
    ...c,
    schoolStatus: s === 'done' || s === 'in-progress' ? 'covered' : 'not-covered',
    onlineStatus: 'not-covered',
    examStatus: s === 'done' ? 'revised' : s === 'in-progress' ? 'learning' : 'not-started',
    flaggedForRevision: false,
  } as Chapter;
}

const today = new Date();
const tomorrow = addDays(today, 1);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockState: AppState = {
  profile: {
    name: '',
    targetCurriculum: 'IGCSE',
    targetGrade: 'Year 9',
  },
  doubts: [
    { id: 'd1', subjectId: 'sci-1', topic: 'Light and Optics', section: 'Concept', question: 'Why does light bend when it passes through glass?', resolved: false, savedAnswer: JSON.stringify({ simple: 'Light changes speed when it goes from air to glass.', explanation: 'This bending is called refraction. Because glass is denser than air, light waves slow down and change direction slightly as they enter.', example: 'Think of pushing a shopping cart from a smooth floor onto a thick carpet at an angle. The wheels hit the carpet first and slow down, causing the cart to turn.', remember: 'Refraction = Bending due to change in speed.' }), createdAt: today },
    { id: 'd2', subjectId: 'math-1', topic: 'Quadratic Equations', section: 'Formula', question: 'What is the difference between permutation and combination?', resolved: false, createdAt: subDays(today, 1) },
    { id: 'd3', subjectId: 'hist-1', topic: 'The French Revolution', section: 'General', question: 'What caused the French Revolution?', resolved: true, resolvedAt: today, createdAt: subDays(today, 2) }
  ],
  streak: 15,
  lastActivityDate: today,
  moodLog: [
    { date: today, mood: 'happy' }
  ],
  studySessions: [
    { id: 'ss1', subjectId: 'math-1', duration: 45, date: today },
    { id: 'ss2', subjectId: 'sci-1', duration: 30, date: today },
  ],
  calendarEvents: [
    { id: 'e1', title: 'Mathematics', type: 'school-class', date: today, startTime: '08:00', endTime: '08:45', subjectId: 'math-1' },
    { id: 'e2', title: 'Science', type: 'school-class', date: today, startTime: '08:45', endTime: '09:30', subjectId: 'sci-1' },
    { id: 'e3', title: 'English', type: 'school-class', date: today, startTime: '09:45', endTime: '10:30', subjectId: 'eng-1' },
    { id: 'e4', title: 'History', type: 'school-class', date: today, startTime: '10:30', endTime: '11:15', subjectId: 'hist-1' },
    { id: 'e5', title: 'Geography', type: 'school-class', date: today, startTime: '11:30', endTime: '12:15', subjectId: 'geo-1' },
    { id: 'e6', title: 'Hindi', type: 'school-class', date: today, startTime: '12:15', endTime: '13:00', subjectId: 'hin-1' },
    { id: 'e7', title: 'Mathematics Online Tuition', type: 'online-tuition', date: today, startTime: '14:00', endTime: '15:00', subjectId: 'math-1' },
    { id: 'e8', title: 'Science Online Tuition', type: 'online-tuition', date: today, startTime: '16:00', endTime: '17:00', subjectId: 'sci-1' },
  ],
  exams: [
    { id: 'ex1', subjectId: 'math-1', name: 'Math Unit Test', type: 'unit-test', date: addDays(today, 4), linkedChapterIds: ['m1', 'm2'] },
    { id: 'ex2', subjectId: 'sci-1', name: 'Science Mid-term', type: 'mid-term', date: addDays(today, 12), linkedChapterIds: ['s1', 's2'] }
  ],
  homework: [
    { id: 'hw1', subjectId: 'math-1', title: 'Complete Exercise 7B', dueDate: today, done: false, urgent: true, priority: 'High' },
    { id: 'hw2', subjectId: 'sci-1', title: 'Lab Report write-up', dueDate: today, done: false, urgent: true, priority: 'Medium' },
    { id: 'hw3', subjectId: 'eng-1', title: 'Read Chapter 4', dueDate: tomorrow, done: false, urgent: false, priority: 'Low' },
    { id: 'hw4', subjectId: 'hist-1', title: 'Essay outline', dueDate: addDays(today, 3), done: false, urgent: false, priority: 'Medium' },
    { id: 'hw5', subjectId: 'geo-1', title: 'Map activity', dueDate: addDays(today, 5), done: false, urgent: false, priority: 'Low' },
  ],
  subjects: [
    {
      id: 'math-1',
      name: 'Mathematics',
      colour: '#3B82F6',
      icon: '📐',
      chapters: [
        ch({
          id: 'm1', subjectId: 'math-1', name: 'Algebra Basics', status: 'done', source: 'school', notes: [],
          flashcards: [
            { id: 'f1', chapterId: 'm1', question: 'What is a linear equation?', answer: 'An equation of the form ax + b = 0 where a ≠ 0', difficulty: 'easy', timesCorrect: 0, timesWrong: 0 },
            { id: 'f2', chapterId: 'm1', question: 'What is the quadratic formula?', answer: 'x = (-b ± √(b²-4ac)) / 2a', difficulty: 'medium', timesCorrect: 0, timesWrong: 0 },
            { id: 'f3', chapterId: 'm1', question: 'What does the discriminant tell us?', answer: 'b²-4ac > 0: two roots, = 0: one root, < 0: no real roots', difficulty: 'medium', timesCorrect: 0, timesWrong: 0 },
            { id: 'f4', chapterId: 'm1', question: 'What is the degree of a linear equation?', answer: 'Degree 1 — the highest power of x is 1', difficulty: 'easy', timesCorrect: 0, timesWrong: 0 },
            { id: 'f5', chapterId: 'm1', question: 'Solve: 2x + 6 = 0', answer: 'x = -3 (subtract 6, then divide by 2)', difficulty: 'easy', timesCorrect: 0, timesWrong: 0 }
          ],
          formulas: []
        }),
        ch({ id: 'm2', subjectId: 'math-1', name: 'Linear Equations', status: 'done', source: 'both', notes: [], flashcards: [], formulas: [] }),
        ch({
          id: 'm3', subjectId: 'math-1', name: 'Quadratic Equations', status: 'in-progress', source: 'both',
          notes: [{ id: 'n1', chapterId: 'm3', type: 'text', content: 'Remember the quadratic formula: x = [-b ± √(b² - 4ac)] / 2a', createdAt: new Date() }],
          flashcards: [
            { id: 'fx1', chapterId: 'm3', question: 'What is the standard form of a quadratic equation?', answer: 'ax² + bx + c = 0', difficulty: 'easy', timesCorrect: 2, timesWrong: 0 },
            { id: 'fx2', chapterId: 'm3', question: 'What does the discriminant (b² - 4ac) indicate?', answer: 'It indicates the nature of the roots (real/imaginary, distinct/equal)', difficulty: 'medium', timesCorrect: 1, timesWrong: 1 }
          ],
          formulas: [
            { id: 'fm1', chapterId: 'm3', title: 'Quadratic Formula', content: 'x = [-b ± √(b² - 4ac)] / 2a', isFavourite: true }
          ]
        }),
        ch({ id: 'm4', subjectId: 'math-1', name: 'Coordinate Geometry', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'm5', subjectId: 'math-1', name: 'Statistics', status: 'done', source: 'online', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'm6', subjectId: 'math-1', name: 'Probability', status: 'in-progress', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'm7', subjectId: 'math-1', name: 'Trigonometry', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'm8', subjectId: 'math-1', name: 'Geometry', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'm9', subjectId: 'math-1', name: 'Mensuration', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'm10', subjectId: 'math-1', name: 'Number System', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
      ]
    },
    {
      id: 'sci-1',
      name: 'Science',
      colour: '#10B981',
      icon: '🔬',
      chapters: [
        ch({ id: 's1', subjectId: 'sci-1', name: 'Light and Optics', status: 'in-progress', source: 'both', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 's2', subjectId: 'sci-1', name: 'Forces and Motion', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 's3', subjectId: 'sci-1', name: 'Electricity', status: 'done', source: 'online', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 's4', subjectId: 'sci-1', name: 'Chemical Reactions', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 's5', subjectId: 'sci-1', name: 'Acids and Bases', status: 'done', source: 'both', notes: [], flashcards: [], formulas: [] }),
        ...Array.from({ length: 7 }).map((_, i) => ch({ id: `s${i+6}`, subjectId: 'sci-1', name: `Science Chapter ${i+6}`, status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }))
      ]
    },
    {
      id: 'eng-1',
      name: 'English',
      colour: '#8B5CF6',
      icon: '📚',
      chapters: [
        ch({ id: 'e1', subjectId: 'eng-1', name: 'Poetry Analysis', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'e2', subjectId: 'eng-1', name: 'Creative Writing', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'e3', subjectId: 'eng-1', name: 'Macbeth', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'e4', subjectId: 'eng-1', name: 'Grammar & Syntax', status: 'done', source: 'online', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'e5', subjectId: 'eng-1', name: 'Reading Comprehension', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'e6', subjectId: 'eng-1', name: 'Essay Structure', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'e7', subjectId: 'eng-1', name: 'Literature Review', status: 'done', source: 'both', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'e8', subjectId: 'eng-1', name: 'Public Speaking', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
      ]
    },
    {
      id: 'hist-1',
      name: 'History',
      colour: '#F59E0B',
      icon: '🏛️',
      chapters: [
        ch({ id: 'h1', subjectId: 'hist-1', name: 'The French Revolution', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'h2', subjectId: 'hist-1', name: 'Industrial Revolution', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'h3', subjectId: 'hist-1', name: 'World War 1', status: 'in-progress', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'h4', subjectId: 'hist-1', name: 'World War 2', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'h5', subjectId: 'hist-1', name: 'Cold War', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'h6', subjectId: 'hist-1', name: 'Modern India', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
      ]
    },
    {
      id: 'geo-1',
      name: 'Geography',
      colour: '#14B8A6',
      icon: '🌍',
      chapters: [
        ch({ id: 'g1', subjectId: 'geo-1', name: 'Physical Geography', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'g2', subjectId: 'geo-1', name: 'Climate', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'g3', subjectId: 'geo-1', name: 'Plate Tectonics', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'g4', subjectId: 'geo-1', name: 'Natural Vegetation', status: 'in-progress', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'g5', subjectId: 'geo-1', name: 'Resources', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'g6', subjectId: 'geo-1', name: 'Population', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
      ]
    },
    {
      id: 'hin-1',
      name: 'Hindi',
      colour: '#EF4444',
      icon: 'अ',
      chapters: [
        ch({ id: 'hi1', subjectId: 'hin-1', name: 'Grammar', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'hi2', subjectId: 'hin-1', name: 'Literature Part 1', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'hi3', subjectId: 'hin-1', name: 'Poetry', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'hi4', subjectId: 'hin-1', name: 'Letter Writing', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'hi5', subjectId: 'hin-1', name: 'Essay Writing', status: 'done', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'hi6', subjectId: 'hin-1', name: 'Literature Part 2', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'hi7', subjectId: 'hin-1', name: 'Comprehension', status: 'in-progress', source: 'school', notes: [], flashcards: [], formulas: [] }),
        ch({ id: 'hi8', subjectId: 'hin-1', name: 'Vocabulary', status: 'not-started', source: 'school', notes: [], flashcards: [], formulas: [] }),
      ]
    }
  ],
  testMarks: [],
  quizHistory: [],
  mockExamResults: [],
  timerState: {
    running: false,
    endTime: null,
    mode: 'focus',
    focusLength: 25,
    breakLength: 5,
    sessionSubject: '',
    sessionName: 'Deep Focus',
  },
  examTypes: ['Unit Test', 'Mid-Term', 'Final', 'Class Test', 'Project'],
  eventTypes: ['School Class', 'Online Tuition', 'Self-Study', 'Exam', 'Project Deadline', 'Personal Note'],
  doubtCategories: ['Concept', 'Formula', 'Problem-Solving', 'General', 'Other'],
  blockTypes: ['Study', 'Homework', 'Revision', 'Break', 'Exercise', 'Other'],
  attendanceLogs: [],
};
