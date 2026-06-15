import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Clock, MapPin, CheckCircle, ArrowRightCircle, AlertCircle, Loader2 } from 'lucide-react';
import BASE_URL from "../../url";
import Swal from 'sweetalert2';

const TimePunchWidget = ({ employeeId, compact = false, onPunchSuccess }) => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // ... (previous useEffect and handlePunch logic remains the same)

  const fetchStatus = useCallback(async () => {
    if (!employeeId) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/hrm/time-punch/status/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching punch status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  // Use the same functions as before
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Online/Offline listeners
    const handleOnline = () => {
      console.log('🌐 Internet connection restored');
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log('🚫 Internet connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Pre-fetch location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => console.log('📍 Location permission granted/checked'),
        (err) => console.warn('📍 Location pre-fetch failed:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Re-sync status when coming online
  useEffect(() => {
    if (isOnline) {
      fetchStatus();
    }
  }, [isOnline, fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Live Timer Effect
  useEffect(() => {
    let interval = null;
    
    if (status?.hasClockedIn && !status?.hasClockedOut) {
      const inPunch = status.punches.find(p => p.PunchType === 'IN');
      if (inPunch) {
        const inTime = new Date(inPunch.PunchTimeUtc).getTime();
        
        interval = setInterval(() => {
          if (!navigator.onLine) return; // Pause visual timer when offline
          
          const now = new Date().getTime();
          const diff = now - inTime;
          
          if (diff > 0) {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setElapsedTime(
              `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            );
          }
        }, 1000);
      }
    } else {
      setElapsedTime('00:00:00');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const handlePunch = async (type) => {
    try {
      setIsPunching(true);
      const token = localStorage.getItem('token');
      
      let location = { latitude: null, longitude: null };
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 30000 // Allow using a location fetched in the last 30s
          });
        });
        location.latitude = pos.coords.latitude;
        location.longitude = pos.coords.longitude;
        console.log('📍 Location acquired:', location);
      } catch (err) {
        console.error('❌ Geolocation failed:', err.message);
      }

      const response = await axios.post(`${BASE_URL}/api/hrm/time-punch/punch`, {
        employeeId,
        punchType: type,
        ...location
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        Swal.fire({
          title: `Clocked ${type === 'IN' ? 'In' : 'Out'}!`,
          text: `Successfully recorded at ${new Date().toLocaleTimeString()}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        fetchStatus();
        if (onPunchSuccess) onPunchSuccess();
      }
    } catch (error) {
      Swal.fire({
        title: 'Punch Failed',
        text: error.response?.data?.message || 'Error recording punch',
        icon: 'error'
      });
    } finally {
      setIsPunching(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`time-punch-widget loading ${compact ? 'compact' : ''}`}>
        <Loader2 className="animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  const { hasClockedIn, hasClockedOut, punches } = status || {};

  return (
    <div className={`time-punch-widget ${compact ? 'compact' : ''}`}>
      <div className="widget-main-layout">
        <div className="widget-info-section">
          <div className="header-info">
            <h3>Daily Attendance</h3>
            <p>{currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          </div>
          <div className="live-clock">
            <Clock size={compact ? 12 : 16} />
            <span className={!isOnline ? 'offline-timer' : ''}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {!isOnline && <span className="offline-badge">OFFLINE</span>}
          </div>
        </div>

        <div className="widget-action-section">
          {!hasClockedIn ? (
            <div className="punch-action-area">
              <div className="status-badge idle">Not Clocked In</div>
              <button 
                className="punch-btn punch-in" 
                onClick={() => handlePunch('IN')}
                disabled={isPunching || !isOnline}
              >
                {isPunching ? <Loader2 className="animate-spin" size={compact ? 14 : 18} /> : <ArrowRightCircle size={compact ? 14 : 18} />}
                <span>{isOnline ? 'Clock In' : 'Waiting for Net...'}</span>
              </button>
            </div>
          ) : !hasClockedOut ? (
            <div className="punch-action-area">
              <div className="status-badge active">
                <CheckCircle size={compact ? 12 : 14} />
                <span>In: {new Date(punches.find(p => p.PunchType === 'IN').PunchTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              {!compact && (
                <div className="live-timer-container">
                  <div className="timer-label">ELAPSED TIME {!isOnline && '(PAUSED)'}</div>
                  <div className={`timer-value ${!isOnline ? 'paused' : ''}`}>{elapsedTime}</div>
                </div>
              )}

              <button 
                className="punch-btn punch-out" 
                onClick={() => handlePunch('OUT')}
                disabled={isPunching || !isOnline}
              >
                {isPunching ? <Loader2 className="animate-spin" size={compact ? 14 : 18} /> : <ArrowRightCircle size={compact ? 14 : 18} />}
                <span>{isOnline ? 'Clock Out' : 'Waiting for Net...'}</span>
              </button>
            </div>
          ) : (
            <div className="punch-action-area completed">
              <div className="status-badge success">
                <CheckCircle size={compact ? 14 : 16} />
                <span>Shift Completed</span>
              </div>
              <div className="shift-summary">
                <div className="summary-item">
                  <span className="label">IN</span>
                  <span className="value">{new Date(punches.find(p => p.PunchType === 'IN').PunchTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="summary-item">
                  <span className="label">OUT</span>
                  <span className="value">{new Date(punches.find(p => p.PunchType === 'OUT').PunchTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .time-punch-widget {
          background: #ffffff;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          width: 100%;
          max-width: 320px;
          font-family: inherit;
        }

        .time-punch-widget.compact {
          padding: 12px 16px;
          max-width: 400px;
          border-radius: 12px;
        }

        .widget-main-layout {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .compact .widget-main-layout {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .widget-info-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .header-info h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }

        .compact .header-info h3 {
          font-size: 13px;
        }

        .header-info p {
          margin: 2px 0 0;
          font-size: 12px;
          color: #6b7280;
        }

        .compact .header-info p {
          font-size: 11px;
        }

        .live-clock {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f3f4f6;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          width: fit-content;
          margin-top: 4px;
        }

        .compact .live-clock {
          font-size: 11px;
          padding: 3px 8px;
        }

        .widget-action-section {
          flex: 1;
        }

        .punch-action-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .compact .punch-action-area {
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .status-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .compact .status-badge {
          font-size: 10px;
          padding: 2px 6px;
        }

        .status-badge.idle { background: #fef3c7; color: #92400e; }
        .status-badge.active { background: #dcfce7; color: #166534; }
        .status-badge.success { background: #ecfdf5; color: #065f46; border: 1px solid #10b981; }

        .live-timer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          margin: 4px 0;
        }

        .timer-label {
          font-size: 9px;
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 0.05em;
        }

        .timer-value {
          font-family: 'Courier New', Courier, monospace;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          letter-spacing: 2px;
        }

        .punch-btn {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .compact .punch-btn {
          padding: 8px 16px;
          font-size: 12px;
          border-radius: 6px;
          width: auto;
          min-width: 120px;
        }

        .punch-in {
          background: #047857;
          color: white;
        }
        .punch-in:hover { background: #059669; }

        .punch-out {
          background: #dc2626;
          color: white;
        }
        .punch-out:hover { background: #b91c1c; }

        .punch-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .shift-summary {
          display: flex;
          width: 100%;
          gap: 8px;
        }

        .compact .shift-summary {
          justify-content: flex-end;
        }

        .summary-item {
          flex: 1;
          background: #f9fafb;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .compact .summary-item {
          flex: none;
          min-width: 60px;
        }

        .summary-item .label { font-size: 9px; color: #6b7280; font-weight: 600; }
        .summary-item .value { font-size: 12px; font-weight: 700; color: #111827; }

        .offline-timer {
          color: #9ca3af;
        }

        .offline-badge {
          font-size: 8px;
          background: #ef4444;
          color: white;
          padding: 1px 4px;
          border-radius: 4px;
          margin-left: 4px;
        }

        .timer-value.paused {
          color: #9ca3af;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TimePunchWidget;
