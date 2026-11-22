import React, { useState, useEffect } from 'react';
import { addEmployee } from '../service/userService';

function AddEmployeeCard({
  classes = [],
  selectedClassId = '',
  onSelectClassId,
  onEmployeeAdded,
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState(selectedClassId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdEmployee, setCreatedEmployee] = useState(null);

  useEffect(() => {
    if (selectedClassId) {
      setClassId(selectedClassId);
    } else if (classes.length > 0 && !classId) {
      setClassId(String(classes[0]._id));
    }
  }, [selectedClassId, classes, classId]);

  const handleClassChange = (e) => {
    const val = e.target.value;
    setClassId(val);
    if (typeof onSelectClassId === 'function') {
      onSelectClassId(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedEmployee(null);
    setLoading(true);

    try {
      const data = await addEmployee({
        email,
        name,
        surname,
        password,
        classId: classId || undefined,
      });
      setCreatedEmployee(data.employee);
      setEmail('');
      setName('');
      setSurname('');
      setPassword('');

      if (typeof onEmployeeAdded === 'function') {
        onEmployeeAdded(data.employee);
      }
    } catch (err) {
      setError(err.message || 'שגיאה בהוספת העובד');
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
        <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
          YASSMINE-MACHOUR • Employee Onboarding
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-2">הוספת עובד חדש לסניף</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {classes.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              שיוך לסניף / מקום עבודה
            </label>
            <select
              value={classId}
              onChange={handleClassChange}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} {cls.roomNumber ? `(${cls.roomNumber})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">אימייל</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="לדוגמה: emp1@company.com או 123"
            className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">שם פרטי</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם פרטי"
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">שם משפחה</label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="שם משפחה"
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            required
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl p-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold shadow-sm hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 transition-all"
        >
          {loading ? 'מוסיף עובד...' : 'הוסף עובד'}
        </button>
      </form>

      {createdEmployee && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm space-y-1">
          <p className="font-bold text-emerald-800">
            העובד נוסף בהצלחה (role: {createdEmployee.role})
          </p>
          <p>
            <strong>UID שנוצר:</strong>{' '}
            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
              {createdEmployee.uid}
            </span>
          </p>
          <p>
            <strong>שם:</strong> {createdEmployee.name} {createdEmployee.surname}
          </p>
          <p>
            <strong>אימייל:</strong> {createdEmployee.email}
          </p>
        </div>
      )}
    </div>
  );
}

export default AddEmployeeCard;