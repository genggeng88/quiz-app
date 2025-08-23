import { Routes, Route, Link } from 'react-router-dom'

// remove after writing real components
const Navbar = () => {
  return (
    <nav style={{ padding: 12 }}>
      <Link to="/" style={{ padding: 12 }}>Login</Link>
      <Link to="/register" style={{ padding: 12 }}>Register</Link>
      <Link to="/home" style={{ padding: 12 }}>Home</Link>
      <Link to="/quiz/1" style={{ padding: 12 }}>Quiz</Link>
      <Link to="/quiz-result/1" style={{ padding: 12 }}>Quiz Result</Link>
      <Link to="/contact" style={{ padding: 12 }}>Contact Us</Link>
    </nav>
  )
}
const Login = () => <h2>Login Page</h2>
const Register = () => <h2>Register Page</h2>
const Home = () => <h2>Home Page</h2>
const Quiz = () => <h2>Quiz Page</h2>
const QuizResult = () => <h2>Quiz Result Page</h2>
const ContactUs = () => <h2>Contact Us Page</h2>

import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/quiz/:categoryId" element={<Quiz />} />
        <Route path="/quiz-result/:quizId" element={<QuizResult />} />
        <Route path="/contact" element={<ContactUs />} />
      </Routes>
    </div>
  );
}

export default App
