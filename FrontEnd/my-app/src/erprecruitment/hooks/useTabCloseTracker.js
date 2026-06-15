// // hooks/useTabCloseTracker.js
// import { useEffect } from 'react';
// import BASE_URL from '../../url';

// const useTabCloseTracker = () => {
//   useEffect(() => {
//     const handleTabClose = () => {
//       const token = localStorage.getItem('token');
//       const sessionId = localStorage.getItem('currentSessionId');
      
//       if (token && sessionId) {
//         console.log('🔄 Tab closed - automatic logout for session:', sessionId);
        
//         // Send logout tracking via Beacon API
//         const data = {
//           trackingId: parseInt(sessionId),
//           action: 'tab_close'
//         };
        
//         const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
//         const beaconSuccess = navigator.sendBeacon(`${BASE_URL}/api/auth/track-logout-beacon`, blob);
        
//         console.log('📡 Beacon sent successfully:', beaconSuccess);
        
//         // Clear session data immediately
//         localStorage.removeItem('token');
//         localStorage.removeItem('currentSessionId');
//         localStorage.removeItem('username');
//         localStorage.removeItem('role');
//         localStorage.removeItem('id');
//         localStorage.removeItem('user');
//         localStorage.removeItem('firstName');
//       }
//     };

//     window.addEventListener('beforeunload', handleTabClose);

//     return () => {
//       window.removeEventListener('beforeunload', handleTabClose);
//     };
//   }, []);
// };

// export default useTabCloseTracker;



// hooks/useTabCloseTracker.js
// FIXED VERSION - Only logs out on actual tab/browser close, NOT on tab switching
// hooks/useTabCloseTracker.js
// IMPROVED VERSION - Better detection and reliability
import { useEffect, useRef } from 'react';
import BASE_URL from '../../url';

const useTabCloseTracker = () => {
  const logoutSentRef = useRef(false);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    // Function to send logout tracking
    const sendLogoutTracking = () => {
      if (logoutSentRef.current) {
        console.log('⚠️ Logout already sent, skipping duplicate');
        return false;
      }
      
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('currentSessionId');
      
      if (!token || !sessionId) {
        console.log('❌ No token or session ID found');
        return false;
      }

      console.log('🚪 Browser/Tab CLOSING - sending logout tracking for session:', sessionId);
      
      try {
        const data = JSON.stringify({
          trackingId: parseInt(sessionId)
        });
        
        const blob = new Blob([data], { type: 'application/json' });
        const beaconSent = navigator.sendBeacon(
          `${BASE_URL}/api/auth/track-logout`,
          blob
        );
        
        console.log('📡 Beacon sent:', beaconSent ? '✅ Success' : '❌ Failed');
        
        if (beaconSent) {
          logoutSentRef.current = true;
        }
        
        return beaconSent;
      } catch (error) {
        console.error('❌ Error sending beacon:', error);
        return false;
      }
    };

    // Handle ONLY actual browser/tab close
    const handleBeforeUnload = (e) => {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('currentSessionId');
      
      // Only track if user is logged in and NOT navigating internally
      if (token && sessionId && !isNavigatingRef.current && !logoutSentRef.current) {
        console.log('🚪 ACTUAL BROWSER CLOSE DETECTED - Tracking logout');
        sendLogoutTracking();
      }
    };

    // Handle pagehide for better mobile support
    const handlePageHide = (e) => {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('currentSessionId');
      
      // e.persisted means page is going into back/forward cache (NOT closing)
      if (e.persisted) {
        console.log('📄 Page cached (back/forward) - NOT logging out');
        return;
      }
      
      if (token && sessionId && !isNavigatingRef.current && !logoutSentRef.current) {
        console.log('📤 ACTUAL PAGE UNLOAD - Tracking logout');
        sendLogoutTracking();
      }
    };

    // Track internal navigation (React Router)
    const handleClick = (e) => {
      const target = e.target.closest('a, button');
      if (target) {
        // Check if it's an internal navigation (not external link)
        const href = target.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('//')) {
          isNavigatingRef.current = true;
          console.log('🔗 Internal navigation detected');
          
          // Reset after a delay
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 1000);
        }
      }
    };

    // Handle browser back/forward buttons
    const handlePopState = () => {
      isNavigatingRef.current = true;
      console.log('⬅️ Browser navigation detected');
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    };

    // Detect React Router navigation (additional safety)
    const handleLocationChange = () => {
      isNavigatingRef.current = true;
      console.log('🔄 Route change detected');
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    };

    // Register event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    console.log('✅ Tab close tracker initialized');

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
      console.log('🧹 Tab close tracker cleaned up');
    };
  }, []); // Empty dependency array - only run once

  return null;
};

export default useTabCloseTracker;