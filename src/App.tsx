import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import ChapterDetail from './pages/ChapterDetail';
import Planner from './pages/Planner';
import Calendar from './pages/Calendar';
import Homework from './pages/Homework';
import Doubts from './pages/Doubts';
import Quiz from './pages/Quiz';
import Timer from './pages/Timer';
import Exams from './pages/Exams';
import Settings from './pages/Settings';
import ParentDashboard from './pages/ParentDashboard';
import Analytics from './pages/Analytics';
import RevisionPlanner from './pages/RevisionPlanner';
import MockExam from './pages/MockExam';

function AppInner() {
  const { state } = useAppContext();
  const needsOnboarding = !state.profile?.name?.trim();

  return (
    <BrowserRouter basename="/chaptered">
      {needsOnboarding && <Onboarding />}
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/subjects/:subjectId/chapter/:chapterId" element={<ChapterDetail />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/homework" element={<Homework />} />
          <Route path="/doubts" element={<Doubts />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/revision" element={<RevisionPlanner />} />
          <Route path="/mock-exam" element={<MockExam />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppInner />;
}
