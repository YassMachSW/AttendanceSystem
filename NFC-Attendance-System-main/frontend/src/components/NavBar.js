import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <nav className="bg-white text-blue-900 p-4 shadow-sm" dir="rtl">
      <div className="flex justify-between items-center max-w-5xl mx-auto">
        <Link to="/" className="text-2xl font-bold uppercase hover:text-blue-600">
          Attendify
        </Link>
        <ul className="flex items-center space-x-6 space-x-reverse">
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="hover:text-blue-600 text-lg font-medium focus:outline-none"
            >
              התנתקות
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;