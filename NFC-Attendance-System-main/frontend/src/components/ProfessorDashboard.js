import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { getClasses } from '../service/classesService';
import NavBar from './NavBar';
import AddEmployeeCard from '../components/AddEmployeeCard';
import ChangePasswordCard from '../components/ChangePasswordCard';

const API_BASE_URL = 'https://attendancesystem-3nux.onrender.com';
const CREATOR_SIGNATURE = 'YASSMINE-MACHOUR';

function ProfessorDashboard() {
  const [classesData, setClassesData] = useState([]);
  const [attendancesData, setAttendancesData] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const managerId = user?._id;

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [classesResponse, attendancesResponse] = await Promise.all([
        managerId ? getClasses(managerId).catch(() => []) : Promise.resolve([]),
        axios
          .get(`${API_BASE_URL}/api/attendances`, {
            params: managerId ? { managerId } : {},
            headers,
          })
          .catch(() => ({ data: [] })),
      ]);

      const fetchedClasses = Array.isArray(classesResponse) ? classesResponse : [];
      setClassesData(fetchedClasses);

      if (fetchedClasses.length > 0) {
        setSelectedClassId((prev) => prev || String(fetchedClasses[0]._id));
      }

      const allowedClassIds = new Set(fetchedClasses.map((c) => String(c._id)));
      const attList = Array.isArray(attendancesResponse.data)
        ? attendancesResponse.data
        : attendancesResponse.data?.attendances || [];

      const scopedAttendances =
        allowedClassIds.size > 0
          ? attList.filter((rec) => {
              const recClassId =
                typeof rec.classId === 'object' && rec.classId !== null
                  ? rec.classId._id
                  : rec.classId;
              return recClassId && allowedClassIds.has(String(recClassId));
            })
          : attList;

      setAttendancesData(scopedAttendances);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('אירעה שגיאה בטעינת הנתונים.');
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getBranchTheme = (type) => {
    switch (type) {
      case 'predavanje':
        return 'from-blue-600 to-indigo-700';
      case 'lab':
        return 'from-rose-600 to-red-700';
      case 'auditorne':
        return 'from-emerald-600 to-teal-700';
      default:
        return 'from-slate-800 via-blue-900 to-indigo-900';
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

  const totalMonthlyMinutes = useMemo(() => {
    return monthlySummaryByEmployee.reduce((acc, item) => acc + item.totalMinutes, 0);
  }, [monthlySummaryByEmployee]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/70 to-indigo-100/60 text-slate-900">
      <NavBar />

      <main dir="rtl" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Hero Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-blue-200 mb-3">
                <span>Enterprise Attendance & Branch Hub</span>
                <span>•</span>
                <span className="font-semibold text-white tracking-wide">{CREATOR_SIGNATURE}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
                לוח בקרה למנהל — {user ? `${user.name} ${user.surname}` : 'מנהל מערכת'}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-1.5">
                ניהול סניפים מבודדים, מעקב נוכחות NFC בזמן אמת, הוספת עובדים והגדרות אבטחה.
              </p>
            </div>

            <div className="self-start md:self-center px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs sm:text-sm">
              <div className="text-blue-200">נוצר ע״י</div>
              <div className="font-bold text-white tracking-wider">{CREATOR_SIGNATURE}</div>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="rounded-xl bg-white/10 p-4 border border-white/10">
              <div className="text-xs text-blue-200">סניפים בניהולך</div>
              <div className="text-2xl sm:text-3xl font-bold mt-1">{classesData.length}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 border border-white/10">
              <div className="text-xs text-blue-200">כניסות מתועדות ({selectedMonth})</div>
              <div className="text-2xl sm:text-3xl font-bold mt-1">{monthlyAttendances.length}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 border border-white/10">
              <div className="text-xs text-blue-200">סה״כ שעות עבודה ({selectedMonth})</div>
              <div className="text-lg sm:text-xl font-bold mt-1.5">
                {formatMinutesAsHours(totalMonthlyMinutes)}
              </div>
            </div>
          </div>
        </section>

        {/* Managed Branches Section */}
        <section className="bg-white/95 backdrop-blur rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">הסניפים שבניהולך</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                כל סניף מופרד לחלוטין ומציג נתונים רלוונטיים לניהולו בלבד.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4 text-sm font-medium">
              {error}
            </div>
          ) : classesData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {classesData.map((placeItem, index) => (
                <div
                  key={placeItem._id || index}
                  className={`rounded-2xl bg-gradient-to-br ${getBranchTheme(
                    placeItem.type
                  )} text-white p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-200`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="inline-block text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 mb-2">
                        סניף פעיל
                      </span>
                      <h3 className="text-xl font-bold leading-snug">{placeItem.name}</h3>
                    </div>
                    <span className="text-xs font-medium bg-black/20 px-3 py-1 rounded-lg">
                      {formatDate(placeItem.date)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm text-white/90 pt-2 border-t border-white/15">
                    {placeItem.roomNumber && (
                      <p>
                        <span className="text-white/70">אזור / חדר:</span> {placeItem.roomNumber}
                      </p>
                    )}
                    {(placeItem.startTime || placeItem.endTime) && (
                      <p>
                        <span className="text-white/70">שעות פעילות:</span> {placeItem.startTime} -{' '}
                        {placeItem.endTime}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center text-slate-500 text-sm">
              אין סניפים מוגדרים בנפרד — רישומי הכניסה והיציאה מופיעים בטבלאות למטה.
            </div>
          )}
        </section>

        {/* Attendance & Monthly Summary Section */}
        <section className="bg-white/95 backdrop-blur rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                מעקב כניסה/יציאה (NFC) וסיכום שעות חודשי
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                סקירה חודשית מסודרת לפי עובד ופירוט מלא של זמני כניסה, יציאה ושהייה.
              </p>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 self-start sm:self-auto">
              <label htmlFor="monthPicker" className="text-xs sm:text-sm font-semibold text-slate-700">
                בחרי חודש:
              </label>
              <input
                id="monthPicker"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Monthly Summary Table */}
          <div className="mb-8">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3">
              סיכום שעות חודשי לפי עובד
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right border-collapse text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="py-3 px-4 font-semibold">עובד</th>
                    <th className="py-3 px-4 font-semibold">מספר כניסות</th>
                    <th className="py-3 px-4 font-semibold">סה״כ שעות בחודש</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlySummaryByEmployee.length > 0 ? (
                    monthlySummaryByEmployee.map((row) => (
                      <tr key={row.empKey} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{row.empName}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900">
                            {row.sessionsCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-900">
                          {formatMinutesAsHours(row.totalMinutes)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-6 px-4 text-center text-slate-500">
                        אין רשומות נוכחות לחודש הנבחר.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Clock-In / Clock-Out Table */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3">
              פירוט שעות כניסה ויציאה
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right border-collapse text-sm">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">עובד</th>
                    <th className="py-3 px-4 font-semibold">מקום / סניף</th>
                    <th className="py-3 px-4 font-semibold">תאריך</th>
                    <th className="py-3 px-4 font-semibold">כניסה (Clock-In)</th>
                    <th className="py-3 px-4 font-semibold">יציאה (Clock-Out)</th>
                    <th className="py-3 px-4 font-semibold">משך שהייה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyAttendances.length > 0 ? (
                    monthlyAttendances.map((rec, idx) => {
                      const empObj =
                        typeof rec.studentId === 'object' && rec.studentId !== null
                          ? rec.studentId
                          : null;
                      const empName =
                        empObj?.name || empObj?.surname
                          ? `${empObj?.name || ''} ${empObj?.surname || ''}`.trim()
                          : rec.studentName || rec.uid || 'עובד';
                      const mins = getSessionMinutes(rec);

                      return (
                        <tr key={rec._id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-900">{empName}</td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                              {getPlaceName(rec)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatDate(rec.clockIn || rec.date || rec.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              {formatTime(rec.clockIn)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {rec.clockOut ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                {formatTime(rec.clockOut)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                                פעיל כעת
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {rec.clockOut || typeof rec.durationMinutes === 'number'
                              ? `${mins} דקות`
                              : '—'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-6 px-4 text-center text-slate-500">
                        אין נתוני כניסה/יציאה לחודש זה.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Action Cards Grid (Add Employee & Change Password) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <AddEmployeeCard
            classes={classesData}
            selectedClassId={selectedClassId}
            onSelectClassId={setSelectedClassId}
            onEmployeeAdded={fetchDashboardData}
          />

          <ChangePasswordCard userId={managerId} />
        </section>

        {/* Creator Signature Footer */}
        <footer className="pt-4 pb-2 text-center text-xs sm:text-sm text-slate-500">
          <span>מערכת ניהול נוכחות וסניפים • Created by </span>
          <span className="font-bold text-slate-800 tracking-wide">{CREATOR_SIGNATURE}</span>
        </footer>
      </main>
    </div>
  );
}

export default ProfessorDashboard;