import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getClasses } from '../service/classesService';
import NavBar from './NavBar';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ProfessorDashboard() {
  const [classesData, setClassesData] = useState([]);
  const [attendancesData, setAttendancesData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const professorId = user?._id;

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!professorId) {
        setError('Profesor ID nije dostupan.');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [classesResponse, attendancesResponse] = await Promise.all([
          getClasses(professorId),
          axios.get(`${API_BASE_URL}/api/attendances`, { headers }).catch(() => ({ data: [] })),
        ]);

        setClassesData(Array.isArray(classesResponse) ? classesResponse : []);
        const attList = Array.isArray(attendancesResponse.data)
          ? attendancesResponse.data
          : attendancesResponse.data?.attendances || [];
        setAttendancesData(attList);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Došlo je do pogreške prilikom učitavanja podataka.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [professorId]);

  const getCardColor = (type) => {
    switch (type) {
      case 'predavanje':
        return 'bg-blue-500';
      case 'lab':
        return 'bg-red-500';
      case 'auditorne':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return '—';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSessionMinutes = (record) => {
    if (typeof record.durationMinutes === 'number') {
      return Math.max(0, record.durationMinutes);
    }
    if (record.clockIn && record.clockOut) {
      const diffMs = new Date(record.clockOut) - new Date(record.clockIn);
      if (diffMs > 0) {
        return Math.round(diffMs / 60000);
      }
    }
    return 0;
  };

  const formatMinutesAsHours = (totalMinutes) => {
    const mins = Math.max(0, Math.round(totalMinutes || 0));
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${String(remMins).padStart(2, '0')}m (${(mins / 60).toFixed(2)} שעות)`;
  };

  // סינון רשומות לפי החודש הנבחר (YYYY-MM)
  const monthlyAttendances = useMemo(() => {
    return attendancesData.filter((rec) => {
      const refDate = rec.clockIn || rec.date || rec.createdAt;
      if (!refDate) return false;
      const d = new Date(refDate);
      if (Number.isNaN(d.getTime())) return false;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym === selectedMonth;
    });
  }, [attendancesData, selectedMonth]);

  // חישוב סיכום שעות חודשי לכל סטודנט
  const monthlySummaryByStudent = useMemo(() => {
    const map = new Map();

    monthlyAttendances.forEach((rec) => {
      const studentObj = typeof rec.studentId === 'object' && rec.studentId !== null ? rec.studentId : null;
      const studentKey =
        studentObj?._id ||
        rec.otherId ||
        rec.uid ||
        (typeof rec.studentId === 'string' ? rec.studentId : 'unknown');

      const studentName =
        studentObj?.name || studentObj?.surname
          ? `${studentObj?.name || ''} ${studentObj?.surname || ''}`.trim()
          : rec.studentName || rec.uid || String(studentKey);

      if (!map.has(studentKey)) {
        map.set(studentKey, {
          studentKey,
          studentName,
          totalMinutes: 0,
          sessionsCount: 0,
        });
      }

      const entry = map.get(studentKey);
      entry.totalMinutes += getSessionMinutes(rec);
      entry.sessionsCount += 1;
    });

    return Array.from(map.values());
  }, [monthlyAttendances]);

  return (
    <>
      <NavBar />
      <div className="flex flex-col items-center justify-start min-h-screen bg-blue-200 p-8">
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg text-center mb-8">
          <h1 className="text-4xl font-semibold mb-6 text-blue-900 tracking-wide">
            Nastava profesora {user ? `${user.name} ${user.surname}` : 'profesora'}
          </h1>

          {loading ? (
            <p className="text-gray-500">Učitavanje podataka o nastavi...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : classesData.length > 0 ? (
            classesData.map((classData, index) => (
              <div key={classData._id || index} className="mb-8">
                <h2 className="text-3xl font-semibold text-gray-700 mb-4 tracking-wider">
                  {formatDate(classData.date)}
                </h2>
                <div
                  className={`mb-6 p-5 rounded-lg shadow-lg ${getCardColor(classData.type)} transition-all`}
                >
                  <h3 className="text-xl font-semibold text-white mb-2 tracking-wider font-bold">
                    {classData.name}
                  </h3>
                  <p className="text-lg text-gray-100 mt-2 tracking-widest">
                    {classData.roomNumber}
                  </p>
                  <p className="text-lg text-gray-100 mt-2 tracking-widest">
                    {classData.startTime} - {classData.endTime}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Nema dostupnih podataka o nastavi.</p>
          )}
        </div>

        {/* אזור Clock-In / Clock-Out וסיכום שעות חודשי */}
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg" dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-blue-900">
              מעקב כניסה/יציאה (NFC) וסיכום שעות חודשי
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="monthPicker" className="text-sm font-semibold text-gray-700">
                בחרי חודש:
              </label>
              <input
                id="monthPicker"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* סיכום שעות חודשי לכל סטודנט */}
          <h3 className="text-lg font-bold text-gray-800 mb-3">סיכום שעות חודשי לפי סטודנט</h3>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-right border-collapse border border-gray-200 text-sm">
              <thead className="bg-blue-50 text-blue-950">
                <tr>
                  <th className="border border-gray-200 p-2.5">סטודנט</th>
                  <th className="border border-gray-200 p-2.5">מספר כניסות</th>
                  <th className="border border-gray-200 p-2.5">סה״כ שעות בחודש</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaryByStudent.length > 0 ? (
                  monthlySummaryByStudent.map((row) => (
                    <tr key={row.studentKey} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2.5 font-medium">{row.studentName}</td>
                      <td className="border border-gray-200 p-2.5">{row.sessionsCount}</td>
                      <td className="border border-gray-200 p-2.5 font-semibold text-blue-900">
                        {formatMinutesAsHours(row.totalMinutes)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="border border-gray-200 p-4 text-center text-gray-500">
                      אין רשומות נוכחות לחודש הנבחר.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* פירוט כניסות ויציאות */}
          <h3 className="text-lg font-bold text-gray-800 mb-3">פירוט שעות כניסה ויציאה</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse border border-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="border border-gray-200 p-2.5">סטודנט</th>
                  <th className="border border-gray-200 p-2.5">תאריך</th>
                  <th className="border border-gray-200 p-2.5">כניסה (Clock-In)</th>
                  <th className="border border-gray-200 p-2.5">יציאה (Clock-Out)</th>
                  <th className="border border-gray-200 p-2.5">משך שהייה</th>
                </tr>
              </thead>
              <tbody>
                {monthlyAttendances.length > 0 ? (
                  monthlyAttendances.map((rec, idx) => {
                    const studentObj =
                      typeof rec.studentId === 'object' && rec.studentId !== null ? rec.studentId : null;
                    const studentName =
                      studentObj?.name || studentObj?.surname
                        ? `${studentObj?.name || ''} ${studentObj?.surname || ''}`.trim()
                        : rec.studentName || rec.uid || 'סטודנט';
                    const mins = getSessionMinutes(rec);

                    return (
                      <tr key={rec._id || idx} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-2.5">{studentName}</td>
                        <td className="border border-gray-200 p-2.5">
                          {formatDate(rec.clockIn || rec.date || rec.createdAt)}
                        </td>
                        <td className="border border-gray-200 p-2.5 text-emerald-700 font-medium">
                          {formatTime(rec.clockIn)}
                        </td>
                        <td className="border border-gray-200 p-2.5 text-amber-700 font-medium">
                          {rec.clockOut ? formatTime(rec.clockOut) : 'טרם נרשמה יציאה'}
                        </td>
                        <td className="border border-gray-200 p-2.5">
                          {rec.clockOut || typeof rec.durationMinutes === 'number'
                            ? `${mins} דקות`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="border border-gray-200 p-4 text-center text-gray-500">
                      אין נתוני כניסה/יציאה לחודש זה.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfessorDashboard;