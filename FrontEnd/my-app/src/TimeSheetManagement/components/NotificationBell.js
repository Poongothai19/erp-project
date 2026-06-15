import React from 'react';
import { Bell } from 'lucide-react';

const NotificationBell = React.memo(({ 
  notificationCount, 
  onClick 
}) => {
  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell-btn"
        onClick={onClick}
        title="View notifications"
      >
        <Bell size={20} />
        {notificationCount > 0 && (
          <span className="notification-bell-badge">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </button>
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;
