import { Routes, Route } from 'react-router-dom'

import './App.css'
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import QuizResult from "./pages/QuizResult";
// import UserManagement from "./pages/admin/UserManagement";
import QuizResultManagement from "./pages/admin/QuizResultManagement";
import QuestionManagement from "./pages/admin/QuestionManagement";
import QuestionEdit from "./pages/admin/QuestionEdit";
import ContactDetail from "./pages/ContactDetails";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/quiz/:categoryId" element={<Quiz />} />
        <Route path="/quiz/result/:quizId" element={<QuizResult />} />

        {/* Admin + Contact routes you already added */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/contact/:id" element={<ContactDetail />} />
        {/* <Route path="/admin/users" element={<UserManagement />} /> */}
        <Route path="/admin/quiz-results" element={<QuizResultManagement />} />
        <Route path="/admin/questions" element={<QuestionManagement />} />
        <Route path="/admin/questions/:id" element={<QuestionEdit />} />
      </Routes>
    </div>
  );
}

export default App

