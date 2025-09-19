import { Routes, Route } from 'react-router-dom'
import { LandingRoute, RequireAuth, RequireAdmin } from "./components/guards";


import './App.css'
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import QuizResult from "./pages/QuizResult";
import UserManagement from "./pages/admin/UserManagement";
import QuizResultManagement from "./pages/admin/QuizResultManagement";
import QuestionManagement from "./pages/admin/QuestionManagement";
import QuestionEdit from "./pages/admin/QuestionEdit";
import ContactDetail from "./pages/admin/ContactDetail";
import Contact from "./pages/Contact";
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import ContactManagement from './pages/admin/ContactManagement';
import Logout from './pages/Logout';


function App() {
  return (
    <div className="min-h-screen">
      <Routes>

        {/* Decide landing */}
        <Route path="/" element={<LandingRoute />} />
        <Route path="/logout" element={<Logout />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated (normal + admin) */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/home" element={<Home />} />
          <Route path="/quiz/:categoryId" element={<Quiz />} />
          <Route path="/quiz-result/:quizId" element={<QuizResult />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Admin-only */}
        <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/quiz-results" element={<QuizResultManagement />} />
          <Route path="/admin/questions" element={<QuestionManagement />} />
          <Route path="/admin/questions/new" element={<QuestionEdit />} />
          <Route path="/admin/questions/:id/edit" element={<QuestionEdit />} />
          <Route path="/admin/contacts" element={<ContactManagement />} />
          <Route path="/admin/contacts/:contactId" element={<ContactDetail />} />
        </Route>
      </Routes>
    </div >
  );
}

export default App

