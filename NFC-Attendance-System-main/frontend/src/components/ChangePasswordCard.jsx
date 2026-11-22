import React, { useState } from 'react';
import { changeUserPassword } from '../service/userService';

function ChangePasswordCard({ userId }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!userId) {
      setError('מזהה משתמש חסר. התחברי מחדש ונסה שוב.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמה החדשה ואימות הסיסמה אינם תואמים.');
      return;
    }

    setLoading(true);
    try {
      const data = await changeUserPassword({
        userId,
        currentPassword,
        newPassword,
      });
      setSuccessMsg(data.message || 'הסיסמה עודכנה בהצלחה!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'שגיאה בעדכון הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="bg-white p-5 sm:p-6 rounded-xl shadow-md border border-slate-200 max-w-lg w-full text-right mt-8"
    >
      <h2 className="text-xl font-bold text-blue-900 mb-4">שינוי סיסמה למנהל</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה נוכחית</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="הזיני סיסמה נוכחית"
            className="w-full p-2.5 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="הזיני סיסמה חדשה"
            className="w-full p-2.5 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            אימות סיסמה חדשה
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="הזיני שוב את הסיסמה החדשה"
            className="w-full p-2.5 border border-gray-300 rounded-lg"
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        {successMsg && <p className="text-emerald-700 text-sm font-semibold">{successMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'מעדכן סיסמה...' : 'עדכן סיסמה'}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordCard;