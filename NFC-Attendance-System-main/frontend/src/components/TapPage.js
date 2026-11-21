import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACTAPPAPIURL || 'http://localhost:5000';

function TapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasProcessedRef = useRef(false);

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const processTap = async () => {
      const searchParams = new URLSearchParams(location.search);
      const locationParam =
        searchParams.get('locationId') ||
        searchParams.get('branchId') ||
        searchParams.get('classId') ||
        localStorage.getItem('lastLocationId') ||
        localStorage.getItem('lastClassId') ||
        '';

      if (locationParam) {
        localStorage.setItem('lastLocationId', locationParam);
        localStorage.setItem('lastClassId', locationParam);
      }

      const token = localStorage.getItem('token');
      const rawUser = localStorage.getItem('user');
      let parsedUser = null;

      try {
        parsedUser = rawUser ? JSON.parse(rawUser) : null;
      } catch (e) {
        parsedUser = null;
      }

      if (!token || !parsedUser || !parsedUser.uid) {
        const currentPath = `${location.pathname}${location.search}`;
        localStorage.setItem('redirectAfterLogin', currentPath);
        navigate('/login/employee');
        return;
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/nfc/`,
          {
            uid: parsedUser.uid,
            ...(locationParam
              ? {
                  classId: locationParam,
                  locationId: locationParam,
                }
              : {}),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setResultData(response.data);
        setStatus('success');
      } catch (err) {
        console.error('Error recording NFC attendance:', err);
        setErrorMessage(
          err.response?.data?.message || 'שגיאה ברישום הכניסה/יציאה. נסי שוב.'
        );
        setStatus('error');
      }
    };

    processTap();
  }, [location.pathname, location.search, navigate]);

  const formatTime = (dateValue) => {
    if (!dateValue) return '';
    return new Date(dateValue).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const placeName =
    resultData?.locationName ||
    resultData?.branchName ||
    resultData?.placeName ||
    resultData?.className ||
    resultData?.classId?.name ||
    resultData?.attendance?.classId?.name ||
    '';

  return (
    <div
      dir="rtl"
      className="flex items-center justify-center min-h-screen bg-slate-100 p-6 text-center"
    >
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        {status === 'loading' && (
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-2">רושם נוכחות...</h2>
            <p className="text-gray-600">מעדכן Clock-In / Clock-Out מול השרת</p>
          </div>
        )}

        {status === 'success' && resultData && (
          <div>
            <div
              className={`text-sm font-semibold inline-block px-3 py-1 rounded-full mb-4 ${
                resultData.action === 'clock-out'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {resultData.action === 'clock-out' ? 'Clock-Out (יציאה)' : 'Clock-In (כניסה)'}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {resultData.action === 'clock-out'
                ? 'נרשמה יציאה בהצלחה'
                : 'נרשמה כניסה בהצלחה'}
            </h2>

            {placeName && (
              <p className="text-blue-900 font-semibold mb-4">
                מקום / סניף: {placeName}
              </p>
            )}

            {resultData.action === 'clock-in' && resultData.clockIn && (
              <p className="text-gray-700 text-lg">
                שעת כניסה: <strong>{formatTime(resultData.clockIn)}</strong>
              </p>
            )}

            {resultData.action === 'clock-out' && (
              <div className="space-y-2 text-gray-700">
                <p>
                  שעת כניסה: <strong>{formatTime(resultData.clockIn)}</strong>
                </p>
                <p>
                  שעת יציאה: <strong>{formatTime(resultData.clockOut)}</strong>
                </p>
                {typeof resultData.durationMinutes === 'number' && (
                  <p className="text-blue-900 font-semibold pt-1">
                    משך שהייה: {resultData.durationMinutes} דקות
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/employee-dashboard')}
              className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              מעבר ללוח העובד שלי
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <h2 className="text-2xl font-bold text-red-700 mb-2">לא הצלחנו לרשום</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              ניסיון חוזר
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TapPage;