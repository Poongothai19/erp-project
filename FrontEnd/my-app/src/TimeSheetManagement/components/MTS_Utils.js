export const handleAuthError = (error, navigate) => {
  if (error.response?.status === 401) {
    console.error('❌ 401 Unauthorized - Token is invalid or expired');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    if (navigate) {
      navigate('/login', { replace: true });
    }
    return true; // Indicates auth error was handled
  }
  return false;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatCurrency = (amount) => {
  if (!amount || amount === 0) return 'N/A';
  return `$${parseFloat(amount).toFixed(2)}`;
};

export const parseContacts = (contacts) => {
  try {
    if (!contacts) {
      return [];
    }

    // If it's already a string (JSON), parse it
    if (typeof contacts === 'string') {
      if (contacts.trim() === '' || contacts.trim() === 'null') {
        return [];
      }
      return JSON.parse(contacts);
    }

    // If it's already an array, return as-is
    if (Array.isArray(contacts)) {
      return contacts;
    }

    // If it's an object, wrap in array
    if (typeof contacts === 'object') {
      return [contacts];
    }

    // Default: return empty array
    return [];
  } catch (error) {
    console.warn('⚠️ Error parsing contacts:', error.message);
    return [];
  }
};
