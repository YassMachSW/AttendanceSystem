import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getClasses } from '../service/classesService';
import NavBar from './NavBar';

const API_BASE_URL = process.env.REACTAPPAPIURL || 'http://localhost:5000';

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
  const managerId = user?._id;

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!managerId) {
        setError('מזהה מנהל אינו זמין.');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [classesResponse, attendancesResponse] = await Promise.all([
          getClasses(managerId).catch(() => []),
          axios.get(`${API_BASE_URL}/api/attendances`, { headers }).catch(() => ({ data: [] })),
        ]);

        setClassesData(Array.isArray(classesResponse) ? classesResponse : []);
        const attList = Array.isArray(attendancesResponse.data)
          ? attendancesResponse.data
          : attendancesResponse.data?.attendances || [];
        setAttendancesData(attList);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('אירעה שגיאה בטעינת הנתונים.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [managerId]);

  const getCardColor = (type) => {
    switch (type) {
      case 'predavanje':
        return 'bg-blue-500';
      case 'lab':
        return 'bg-red-500';
      case 'auditorne':
        return 'bg-green-500';
      default:
        return 'bg-blue-600';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

  const getPlaceName = (rec) => {
    return (
      rec.branchName ||
      rec.locationName ||
      rec.placeName ||
      rec.classId?.name ||
      'סניף / מקום עבודה'
    );
  };

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

  const monthlySummaryByEmployee = useMemo(() => {
    const map = new Map();

    monthlyAttendances.forEach((rec) => {
      const empObj =
        typeof rec.studentId === 'object' && rec.studentId !== null ? rec.studentId : null;
      const empKey =
        empObj?._id ||
        rec.otherId ||
        rec.uid ||
        (typeof rec.studentId === 'string' ? rec.studentId : 'unknown');

      const empName =
        empObj?.name || empObj?.surname
          ? `${empObj?.name || ''} ${empObj?.surname || ''}`.trim()
          : rec.studentName || rec.uid || String(empKey);

      if (!map.has(empKey)) {
        map.set(empKey, {
          empKey,
          empName,
          totalMinutes: 0,
          sessionsCount: 0,
        });
      }

      const entry = map.get(empKey);
      entry.totalMinutes += getSessionMinutes(rec);
      entry.sessionsCount += 1;
    });

    return Array.from(map.values());
  }, [monthlyAttendances]);

  return (
    <>
      <NavBar />
      <div
        dir="rtl"
        className="flex flex-col items-center justify-start min-h-screen bg-blue-200 p-8"
      >
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg text-center mb-8">
          <h1 className="text-4xl font-semibold mb-6 text-blue-900">
            לוח בקרה למנהל — {user ? `${user.name} ${user.surname}` : 'מנהל'}
          </h1>

          {loading ? (
            <p className="text-gray-500">טוען נתונים...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : classesData.length > 0 ? (
            classesData.map((placeItem, index) => (
              <div key={placeItem._id || index} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                  {formatDate(placeItem.date)}
                </h2>
                <div
                  className={`mb-6 p-5 rounded-lg shadow-lg ${getCardColor(placeItem.type)} transition-all`}
                >
                  <h3 className="text-xl font-bold text-white mb-2">
                    מקום / סניף: {placeItem.name}
                  </h3>
                  {placeItem.roomNumber && (
                    <p className="text-base text-gray-100 mt-1">
                      אזור / חדר: {placeItem.roomNumber}
                    </p>
                  )}
                  {(placeItem.startTime || placeItem.endTime) && (
                    <p className="text-base text-gray-100 mt-1">
                      שעות פעילות: {placeItem.startTime} - {placeItem.endTime}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">
              אין סניפים/מקומות מוגדרים בנפרד — רישומי הכניסה והיציאה מופיעים בטבלה למטה.
            </p>
          )}
        </div>

        {/* אזור Clock-In / Clock-Out וסיכום שעות חודשי */}
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg">
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

          {/* סיכום שעות חודשי לכל עובד */}
          <h3 className="text-lg font-bold text-gray-800 mb-3">סיכום שעות חודשי לפי עובד</h3>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-right border-collapse border border-gray-200 text-sm">
              <thead className="bg-blue-50 text-blue-950">
                <tr>
                  <th className="border border-gray-200 p-2.5">עובד</th>
                  <th className="border border-gray-200 p-2.5">מספר כניסות</th>
                  <th className="border border-gray-200 p-2.5">סה״כ שעות בחודש</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaryByEmployee.length > 0 ? (
                  monthlySummaryByEmployee.map((row) => (
                    <tr key={row.empKey} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2.5 font-medium">{row.empName}</td>
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
                  <th className="border border-gray-200 p-2.5">עובד</th>
                  <th className="border border-gray-200 p-2.5">מקום / סניף</th>
                  <th className="border border-gray-200 p-2.5">תאריך</th>
                  <th className="border border-gray-200 p-2.5">כניסה (Clock-In)</th>
                  <th className="border border-gray-200 p-2.5">יציאה (Clock-Out)</th>
                  <th className="border border-gray-200 p-2.5">משך שהייה</th>
                </tr>
              </thead>
              <tbody>
                {monthlyAttendances.length > 0 ? (
                  monthlyAttendances.map((rec, idx) => {
                    const empObj =
                      typeof rec.studentId === 'object' && rec.studentId !== null ? rec.studentId : null;
                    const empName =
                      empObj?.name || empObj?.surname
                        ? `${empObj?.name || ''} ${empObj?.surname || ''}`.trim()
                        : rec.studentName || rec.uid || 'עובד';
                    const mins = getSessionMinutes(rec);

                    return (
                      <tr key={rec._id || idx} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-2.5">{empName}</td>
                        <td className="border border-gray-200 p-2.5">{getPlaceName(rec)}</td>
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
                    <td colSpan="6" className="border border-gray-200 p-4 text-center text-gray-500">
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