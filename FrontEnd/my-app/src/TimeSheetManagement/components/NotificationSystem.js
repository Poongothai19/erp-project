import React from 'react';
import { 
  Bell, 
  X, 
  FileSpreadsheet, 
  Users, 
  AlertTriangle, 
  DollarSign 
} from 'lucide-react';

const NotificationSystem = React.memo(({ 
  isOpen, 
  onClose,
  notifications,
  navigate,
  companyId
}) => {
  if (!isOpen) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'external_timesheet':
        return <FileSpreadsheet size={20} className="notification-icon external" />;
      case 'project_ended':
        return <Users size={20} className="notification-icon project" />;
      case 'h1b_expiry':
        return <AlertTriangle size={20} className="notification-icon h1b" />;
      case 'negative_balance':
        return <DollarSign size={20} className="notification-icon balance" />;
      default:
        return <Bell size={20} className="notification-icon default" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'external_timesheet':
        return '#3b82f6';
      case 'project_ended':
        return '#f59e0b';
      case 'h1b_expiry':
        return '#ef4444';
      case 'negative_balance':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="notification-overlay"
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className="notification-panel">
        {/* Header */}
        <div className="notification-header">
          <div className="notification-title">
            <Bell size={20} />
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <span className="notification-count-badge">
                {notifications.length}
              </span>
            )}
          </div>
          <button className="notification-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Notification List */}
        <div className="notification-list">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div 
                key={notification.id || index}
                className={`notification-item ${notification.priority || 'normal'}`}
                style={{ borderLeftColor: getNotificationColor(notification.type) }}
              >
                <div className="notification-icon-container">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  
                  {notification.details && (
                    <div className="notification-details">
                      {notification.details}
                    </div>
                  )}
                  
                  <div className="notification-meta">
                    <span className="notification-time">
                      {formatTime(notification.timestamp)}
                    </span>
                    {notification.count > 1 && (
                      <span className="notification-item-count">
                        {notification.count} items
                      </span>
                    )}
                  </div>
                </div>

                {notification.action && (
                  <button 
                    className="notification-action-btn"
                    onClick={() => {
                      // Navigate to Employee Details Page
                      if (notification.employeeData) {
                        navigate(`/user-details/${notification.employeeData.EmployeeId || notification.employeeData.Id || notification.employeeData.id}`, {
                          state: {
                            employee: notification.employeeData,
                            company: { id: companyId }
                          }
                        });
                      } else if (notification.action?.handler) {
                        notification.action.handler();
                      }
                      onClose(); // Close notification panel after action
                    }}
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="notification-empty">
              <Bell size={48} />
              <p>No new notifications</p>
              <span>You're all caught up!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notification-footer">
            <button className="notification-clear-all">
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </>
  );
});

NotificationSystem.displayName = 'NotificationSystem';

export default NotificationSystem;
