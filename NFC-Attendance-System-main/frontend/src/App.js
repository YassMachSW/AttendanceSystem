import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import StudentLoginPage from './components/StudentLoginPage';
import ProfessorLoginPage from './components/ProfessorLoginPage';
import StudentDashboard from './components/StudentDashboard';
import ProfessorDashboard from './components/ProfessorDashboard';
import TapPage from './components/TapPage';
// function TapPlaceholder() {
//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6 text-center">
//       <div className="bg-white p-8 rounded-lg shadow max-w-md w-full">
//         <h2 className="text-2xl font-bold text-blue-900 mb-3">NFC Tap</h2>
//         <p className="text-gray-600">
//           דף רישום הכניסה/יציאה (Clock-In / Clock-Out) יחובר כאן.
//         </p>
//       </div>
//     </div>
//   );
// }
function App() {
  return (
  <Router>
      <Routes>
        {/* Home Page */}
        <Route
          path="/"
          element={
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
                <h1 className="text-5xl font-bold mb-8 text-blue-900 tracking-wider uppercase">
                  Attendify
                </h1>
                <p className="text-lg mb-12 text-gray-600">
                  FESB-ov sustav za praćenje prisutnosti nastave. Odaberite ulogu za prijavu:
                </p>
                <div className="space-y-6">
                  <button
                    className="w-full py-4 bg-blue-400 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
                    onClick={() => (window.location.href = '/login/student')}
                  >
                    Prijava za Studente
                  </button>
                  <button
                    className="w-full py-4 bg-blue-800 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
                    onClick={() => (window.location.href = '/login/professor')}
                  >
                    Prijava za Profesore
                  </button>
                </div>
              </div>
            </div>
          }
        />
        {/* Login & Dashboards */}
        <Route path="/login/student" element={<StudentLoginPage />} />
        <Route path="/login/professor" element={<ProfessorLoginPage />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/professor-dashboard" element={<ProfessorDashboard />} />
        {/* NFC Tap Route for Clock-In / Clock-Out */}
        <Route path="/tap" element={<TapPage />} />
      </Routes>
    </Router>
  );
}

export default App;