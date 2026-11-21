import React from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import './index.css';
import StudentLoginPage from './components/StudentLoginPage';
import ProfessorLoginPage from './components/ProfessorLoginPage';
import StudentDashboard from './components/StudentDashboard';
import ProfessorDashboard from './components/ProfessorDashboard';
import TapPage from './components/TapPage';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gray-600 relative"
      style={{
        backgroundImage:
          'url("https://egradnja.hr/sites/default/files/2024/06/17/branka%20juras%20fesb8.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-30"></div>
      <div className="relative bg-white p-16 rounded-lg shadow-2xl text-center max-w-lg w-full border-l-slate-950">
        <h1 className="text-5xl font-bold mb-6 text-blue-900 tracking-wider uppercase">
          Attendify
        </h1>
        <p className="text-lg mb-10 text-gray-600">
          מערכת מעקב נוכחות ושעות עבודה באמצעות NFC. בחרי תפקיד לכניסה:
        </p>
        <div className="space-y-6">
          <button
            type="button"
            className="w-full py-4 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
            onClick={() => navigate('/login/employee')}
          >
            כניסה לעובד (Clock-In / Clock-Out)
          </button>
          <button
            type="button"
            className="w-full py-4 bg-blue-800 text-white rounded-lg text-lg font-semibold hover:bg-blue-900 transition-colors"
            onClick={() => navigate('/login/manager')}
          >
            כניסה למנהל (דוחות וסיכום שעות)
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* עמוד הבית */}
        <Route path="/" element={<HomePage />} />

        {/* נתיבים חדשים לעובד ומנהל */}
        <Route path="/login/employee" element={<StudentLoginPage />} />
        <Route path="/login/manager" element={<ProfessorLoginPage />} />
        <Route path="/employee-dashboard" element={<StudentDashboard />} />
        <Route path="/manager-dashboard" element={<ProfessorDashboard />} />

        {/* שמירה על תאימות לנתיבים קודמים אם מישהו פותח אותם */}
        <Route path="/login/student" element={<StudentLoginPage />} />
        <Route path="/login/professor" element={<ProfessorLoginPage />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/professor-dashboard" element={<ProfessorDashboard />} />

        {/* נתיב הצמדת NFC */}
        <Route path="/tap" element={<TapPage />} />
      </Routes>
    </Router>
  );
}

export default App;