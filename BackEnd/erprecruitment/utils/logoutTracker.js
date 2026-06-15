import BASE_URL from '../../url';

export const trackLogout = async () => {
  try {
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('currentSessionId');
    
    if (sessionId && token) {
      await fetch(`${BASE_URL}/api/auth/track-logout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ trackingId: sessionId })
      });
    }
    
    // Clear all stored session data
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('id');
    localStorage.removeItem('user');
    localStorage.removeItem('firstName');
    localStorage.removeItem('currentSessionId');
    
  } catch (error) {
    console.error("Error tracking logout:", error);
    // Still clear local storage even if tracking fails
    localStorage.clear();
  }
};