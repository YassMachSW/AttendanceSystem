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
        return 'bg-gray-500';
    }
  };

  const formatDate = (record) => {
    const rawDate = record.clockIn || record.date || record.createdAt;
    if (!rawDate) return '—';
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('hr-HR');
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return '—';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDurationText = (record) => {
    if (typeof record.durationMinutes === 'number') {
      return `${record.durationMinutes} min`;
    }
    if (record.clockIn && record.clockOut) {
      const diffMs = new Date(record.clockOut) - new Date(record.clockIn);
      if (diffMs > 0) {
        return `${Math.round(diffMs / 60000)} min`;
      }
    }
    return null;
  };

  return (
    <>
      <NavBar />
      <div className="flex flex-col items-center justify-start min-h-screen bg-blue-200 p-8">
        <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-4xl font-semibold mb-6 text-blue-900 tracking-wide">
            Evidencija za {user ? `${user.name} ${user.surname}` : 'studenta'}
          </h1>

          {loading ? (
            <p className="text-gray-500">Učitavanje podataka o prisutnosti...</p>
          ) : attendanceData.length > 0 ? (
            attendanceData.map((classData, index) => {
              const attendanceDate = formatDate(classData);
              const durationText = getDurationText(classData);

              return (
                <div key={classData._id || index} className="mb-8">
                  <h2 className="text-3xl font-semibold text-gray-700 mb-4 tracking-wider">
                    {attendanceDate}
                  </h2>
                  <div
                    className={`mb-6 p-5 rounded-lg shadow-lg ${getCardColor(classData.classId?.type)} transition-all`}
                  >
                    <h3 className="text-xl font-semibold text-white mb-2 tracking-wider font-bold">
                      {classData.classId?.name || 'Nastava / Evidencija'}
                    </h3>
                    <p
                      className={`text-xl ${
                        classData.status === 'Prisutan' ? 'text-green-200' : 'text-red-200'
                      } tracking-wide`}
                    >
                      {classData.status || 'Evidentirano'}
                    </p>
                    <p className="text-sm text-white mt-3">
                      Clock-In: <strong>{formatTime(classData.clockIn)}</strong>
                      {'  |  '}
                      Clock-Out:{' '}
                      <strong>
                        {classData.clockOut ? formatTime(classData.clockOut) : 'U tijeku'}
                      </strong>
                    </p>
                    {durationText && (
                      <p className="text-sm text-gray-100 mt-1">
                        Trajanje: <strong>{durationText}</strong>
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">Nedostupni podaci o prisutnosti.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default StudentDashboard;