import React, { useState, useEffect } from 'react';
import { getAttendance } from '../service/attendanceService';
import NavBar from './NavBar';

function StudentDashboard() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentUID = user?.uid;

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!studentUID) {
        setAttendanceData([]);
        setLoading(false);
        return;
      }

      try {
        const response = await getAttendance(studentUID);
        const list = Array.isArray(response) ? response : response?.attendances || [];

        const sortedData = [...list].sort((a, b) => {
          const dateA = new Date(a.clockIn || a.date || a.createdAt || 0);
          const dateB = new Date(b.clockIn || b.date || b.createdAt || 0);
          return dateB - dateA;
        });

        setAttendanceData(sortedData);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [studentUID]);

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

  const formatDate = (record) => {
    const rawDate = record.clockIn || record.date || record.createdAt;
    if (!rawDate) return '—';
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return '—';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDurationText = (record) => {
    if (typeof record.durationMinutes === 'number') {
      return `${record.durationMinutes} דקות`;
    }
    if (record.clockIn && record.clockOut) {
      const diffMs = new Date(record.clockOut) - new Date(record.clockIn);
      if (diffMs > 0) {
        return `${Math.round(diffMs / 60000)} דקות`;
      }
    }
    return null;
  };

  const getPlaceName = (record) => {
    return (
      record.branchName ||
      record.locationName ||
      record.placeName ||
      record.classId?.name ||
      'סניף / מקום עבודה'
    );
  };

  return (
    <>
      <NavBar />
      <div
        dir="rtl"
        className="flex flex-col items-center justify-start min-h-screen bg-blue-200 p-8"
      >
        <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-4xl font-semibold mb-6 text-blue-900">
            נוכחות ושעות עבור {user ? `${user.name} ${user.surname}` : 'עובד'}
          </h1>

          {loading ? (
            <p className="text-gray-500">טוען נתוני נוכחות...</p>
          ) : attendanceData.length > 0 ? (
            attendanceData.map((record, index) => {
              const attendanceDate = formatDate(record);
              const durationText = getDurationText(record);
              const placeName = getPlaceName(record);

              return (
                <div key={record._id || index} className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                    {attendanceDate}
                  </h2>
                  <div
                    className={`mb-6 p-5 rounded-lg shadow-lg ${getCardColor(record.classId?.type)} transition-all`}
                  >
                    <h3 className="text-xl font-bold text-white mb-2">
                      מקום / סניף: {placeName}
                    </h3>
                    <p className="text-base text-green-100 font-medium">
                      סטטוס: {record.clockOut ? 'הושלמה כניסה ויציאה' : 'נרשמה כניסה (במשמרת)'}
                    </p>
                    <p className="text-sm text-white mt-3">
                      כניסה (Clock-In): <strong>{formatTime(record.clockIn)}</strong>
                      {'  |  '}
                      יציאה (Clock-Out):{' '}
                      <strong>
                        {record.clockOut ? formatTime(record.clockOut) : 'טרם נרשמה יציאה'}
                      </strong>
                    </p>
                    {durationText && (
                      <p className="text-sm text-gray-100 mt-1">
                        משך שהייה: <strong>{durationText}</strong>
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">אין עדיין נתוני כניסה ויציאה להצגה.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default StudentDashboard;