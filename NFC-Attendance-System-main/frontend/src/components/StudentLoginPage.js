import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../service/userService';

function StudentLoginPage() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setError('');

    try {
      const response = await loginUser(studentId, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          uid: response.uid,
          name: response.name,
          surname: response.surname,
        })
      );

      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate('/employee-dashboard');
      }

      console.log('Login response:', response);
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'אימייל או סיסמה שגויים');
      } else {
        setError('אימייל או סיסמה שגויים');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-blue-100"
      dir="rtl"
      style={{
        backgroundImage:
          'url("https://egradnja.hr/sites/default/files/2024/06/17/branka%20juras%20fesb8.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-30"></div>
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full relative z-10">
        <h1 className="text-3xl font-bold mb-4 text-blue-900">כניסת עובד</h1>
        <input
          type="text"
          placeholder="אימייל"
          className="w-full p-3 mb-4 border border-gray-300 rounded text-right"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <input
          type="password"
          placeholder="סיסמה"
          className="w-full p-3 mb-4 border border-gray-300 rounded text-right"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="button"
          className="w-full py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          onClick={handleLogin}
        >
          התחברות
        </button>
      </div>
    </div>
  );
}

export default StudentLoginPage;