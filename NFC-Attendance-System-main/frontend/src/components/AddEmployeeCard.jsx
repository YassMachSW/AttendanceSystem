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
      className="bg-white p-5 sm:p-6 rounded-xl shadow-md border border-slate-200 max-w-lg w-full text-right"
    >
      <h2 className="text-xl font-bold text-blue-900 mb-4">הוספת עובד חדש</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {classes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שיוך לסניף / מקום עבודה
            </label>
            <select
              value={classId}
              onChange={handleClassChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="לדוגמה: emp1@company.com או 123"
            className="w-full p-2.5 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם פרטי</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם פרטי"
              className="w-full p-2.5 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם משפחה</label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="שם משפחה"
              className="w-full p-2.5 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            className="w-full p-2.5 border border-gray-300 rounded-lg"
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'מוסיף עובד...' : 'הוסף עובד'}
        </button>
      </form>

      {createdEmployee && (
        <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm space-y-1">
          <p className="font-bold">העובד נוסף בהצלחה (role: {createdEmployee.role})</p>
          <p>
            <strong>UID שנוצר:</strong>{' '}
            <span className="font-mono font-bold">{createdEmployee.uid}</span>
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