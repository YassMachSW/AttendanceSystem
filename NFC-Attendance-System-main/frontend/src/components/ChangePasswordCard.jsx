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
      className="bg-white/95 backdrop-blur p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200/80 w-full text-right"
    >
      <div className="mb-5 pb-3 border-b border-slate-100">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
          YASSMINE-MACHOUR • Security Settings
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-2">שינוי סיסמה למנהל</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">סיסמה נוכחית</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="הזיני סיסמה נוכחית"
            className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">סיסמה חדשה</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="הזיני סיסמה חדשה"
            className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            אימות סיסמה חדשה
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="הזיני שוב את הסיסמה החדשה"
            className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            required
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl p-2.5">
            {error}
          </p>
        )}
        {successMsg && (
          <p className="text-emerald-700 text-sm font-semibold bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
            {successMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-slate-800 to-indigo-900 text-white rounded-xl font-semibold shadow-sm hover:from-slate-900 hover:to-indigo-950 disabled:opacity-50 transition-all"
        >
          {loading ? 'מעדכן סיסמה...' : 'עדכן סיסמה'}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordCard;