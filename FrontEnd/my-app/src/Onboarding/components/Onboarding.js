



import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Onboarding.css';
import OnboardingForm from './OnboardingForm';
import OnboardingView from './OnboardingView';
import axios from 'axios';
import BASE_URL from '../../url';

const Onboarding = () => {
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);

  // Check if user has existing submission
const checkExistingSubmission = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // First, check if we already have onboarding status in localStorage
    const cachedStatus = localStorage.getItem('onboardingCompleted');
    const cachedSubmission = localStorage.getItem('onboardingSubmission');
    
    console.log('Cached onboarding status:', cachedStatus);
    console.log('Cached submission exists:', !!cachedSubmission);
    
    if (cachedStatus === 'true' && cachedSubmission) {
      // Use cached data first for faster loading
      try {
        const submissionData = JSON.parse(cachedSubmission);
        setEmployeeData(submissionData);
        setHasExistingSubmission(true);
        console.log('Using cached submission data');
      } catch (parseError) {
        console.error('Error parsing cached submission:', parseError);
        // Continue to fetch from server
      }
    }
    
    // Always check with server to ensure data is current
    try {
      const statusResponse = await axios.get(`${BASE_URL}/api/onboarding/check-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Onboarding status check from server:', statusResponse.data);
      
      // Fetch submissions data
      const response = await axios.get(`${BASE_URL}/api/onboarding/my-submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Submissions data from server:', response.data);

      if (response.data && response.data.length > 0) {
        // User has existing submission, show view mode
        const latestSubmission = response.data[0];
        console.log('Latest submission found:', latestSubmission);
        setEmployeeData(latestSubmission);
        setHasExistingSubmission(true);
        
        // Update localStorage with fresh data
        localStorage.setItem('onboardingCompleted', 'true');
        localStorage.setItem('onboardingSubmission', JSON.stringify(latestSubmission));
      } else {
        // No existing submission, show empty form
        console.log('No existing submissions found');
        setHasExistingSubmission(false);
        setEmployeeData(null);
        localStorage.setItem('onboardingCompleted', 'false');
        localStorage.removeItem('onboardingSubmission');
      }
    } catch (serverError) {
      console.error("Error checking with server:", serverError);
      // If server fails, use cached data if available
      if (cachedStatus === 'true' && cachedSubmission) {
        console.log('Using cached data due to server error');
        // Data already set from cache above
      } else {
        setHasExistingSubmission(false);
        setEmployeeData(null);
        localStorage.setItem('onboardingCompleted', 'false');
      }
    }
  } catch (error) {
    console.error("Error checking submissions:", error);
    setHasExistingSubmission(false);
    setEmployeeData(null);
    localStorage.setItem('onboardingCompleted', 'false');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    checkExistingSubmission();
  }, []);

const handleFormSubmit = async (formDataFromForm) => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Is editing?', isEditing);
    console.log('Form data received:', formDataFromForm);
    
    // Create FormData for file uploads
    const formDataToSend = new FormData();
    
    // Add ALL form fields from formDataFromForm
    for (const key in formDataFromForm) {
      if (formDataFromForm.hasOwnProperty(key)) {
        const value = formDataFromForm[key];
        
        if (value === null || value === undefined || value === '') {
          continue;
        }
        
        if (value instanceof File) {
          console.log(`Adding file: ${key} - ${value.name}`);
          formDataToSend.append(key, value);
        }
        else if (Array.isArray(value)) {
          console.log(`Adding array: ${key} - ${JSON.stringify(value)}`);
          formDataToSend.append(key, JSON.stringify(value));
        }
        else if (typeof value === 'boolean') {
          console.log(`Adding boolean: ${key} - ${value}`);
          formDataToSend.append(key, value.toString());
        }
        else {
          console.log(`Adding field: ${key} - ${value}`);
          formDataToSend.append(key, value);
        }
      }
    }

    // Add employee ID from localStorage if available
    const employeeId = localStorage.getItem('employeeId');
    if (employeeId) {
      formDataToSend.append('employeeId', employeeId);
    }

    // Add user ID from localStorage
    const userId = localStorage.getItem('id');
    if (userId) {
      formDataToSend.append('userId', userId);
    }

    const endpoint = isEditing && employeeData 
      ? `${BASE_URL}/api/onboarding/${employeeData.id}`
      : `${BASE_URL}/api/onboarding`;

    const method = isEditing ? 'put' : 'post';

    console.log(`Sending ${method.toUpperCase()} request to: ${endpoint}`);

    const response = await axios[method](
      endpoint, 
      formDataToSend, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('Submission successful:', response.data);
    
    // FIXED: The backend returns success on HTTP 201/200 status
    // Check HTTP status code instead of response.data.success
    if (response.status === 201 || response.status === 200) {
      // Set onboarding completion flag
      localStorage.setItem('onboardingCompleted', 'true');
      
      // Create submission data object
      const submissionData = {
        id: response.data.employeeId || employeeData?.id,
        ...formDataFromForm,
        message: response.data.message,
        documentsUploaded: response.data.documentsUploaded || 0
      };
      
      // Update local storage with employee data if needed
      if (response.data.employeeData) {
        localStorage.setItem('employeeData', JSON.stringify(response.data.employeeData));
      }
      
      // Store submission data
      localStorage.setItem('onboardingSubmission', JSON.stringify(submissionData));
      
      alert('✅ Onboarding submitted successfully! You can now access Accounts and Timesheets.');
      
      // 🔥 FIX: Navigate IMMEDIATELY to Accounts page
      navigate('/accounts');
      
      // 🔥 FIX: Update state AFTER navigation
      setTimeout(() => {
        // After navigation, trigger the event for Accounts page
        window.dispatchEvent(new Event('onboardingCompleted'));
      }, 100);
      
    } else {
      throw new Error(response.data.message || 'Submission failed');
    }
    
  } catch (error) {
    console.error("Error submitting form:", error);
    console.error("Error response:", error.response?.data);
    
    // Handle the specific case where backend returns success message but no success flag
    if (error.response?.status === 201 || error.response?.status === 200) {
      // This means the submission was successful but axios threw an error due to our logic
      console.log('Submission was actually successful! Handling as success...');
      
      // Set onboarding completion flag
      localStorage.setItem('onboardingCompleted', 'true');
      
      // Create submission data
      const submissionData = {
        ...formDataFromForm,
        id: error.response.data.employeeId || employeeData?.id,
        message: error.response.data.message
      };
      
      alert('✅ Onboarding submitted successfully! You can now access Accounts and Timesheets.');
      
      // 🔥 FIX: Navigate IMMEDIATELY to Accounts page
      navigate('/accounts');
      
      // 🔥 FIX: Update state AFTER navigation
      setTimeout(() => {
        // After navigation, trigger the event for Accounts page
        window.dispatchEvent(new Event('onboardingCompleted'));
      }, 100);
      
      return;
    }
    
    let errorMessage = "Failed to submit form. Please try again.";
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = typeof error.response.data.error === 'string' 
        ? error.response.data.error 
        : error.response.data.error.message || JSON.stringify(error.response.data.error);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    alert(`Error: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};

  const handleEdit = () => {
    console.log('Starting edit mode for employee:', employeeData);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    console.log('Canceling edit mode');
    setIsEditing(false);
    checkExistingSubmission(); // Refresh data
  };

  const handleCancelOnboarding = () => {
    if (window.confirm('Are you sure you want to cancel onboarding? You can complete it later from your dashboard.')) {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="ob-loading">
        <div className="ob-loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If onboarding already completed, redirect to dashboard
  if (localStorage.getItem('onboardingCompleted') === 'true' && hasExistingSubmission && !isEditing) {
    // Show completed view instead of redirecting
    return (
      <div className="ob-container">
        <div className="ob-header">
          <div className="ob-header-content">
            <div className="ob-header-text">
              <h1>Employee Onboarding</h1>
              <p className="ob-subtitle">Your onboarding is complete</p>
            </div>
          </div>
        </div>

        <div className="ob-view-container-wrapper">
          <div className="ob-success-message">
            <div className="ob-success-icon">✔</div>
            <div className="ob-success-text">
              <h3>Onboarding Completed Successfully!</h3>
              <p>Your onboarding has been submitted. You can now access Accounts and Timesheets.</p>
            </div>
            <button 
              className="ob-btn-edit-main"
              onClick={handleEdit}
            >
              ✏️ Edit My Submission
            </button>
          </div>
          
          <div className="ob-view-section">
            <OnboardingView 
              employee={employeeData}
            />
          </div>
          
          <div className="ob-navigation-buttons">
            <button 
              className="ob-btn-dashboard"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
            <button 
              className="ob-btn-accounts"
              onClick={() => navigate('/accounts')}
            >
              View in Accounts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ob-container">
      <div className="ob-header">
        <div className="ob-header-content">
          <div className="ob-header-text">
            <h1>Employee Onboarding</h1>
            <p className="ob-subtitle">Complete your onboarding to access all features</p>
            
            {isEditing ? (
              <div className="ob-edit-notice">
                <strong>✏️ Editing Your Submission</strong>
                <button 
                  onClick={handleCancelEdit}
                  className="ob-btn-cancel-edit"
                >
                  Cancel Edit
                </button>
              </div>
            ) : (
              <div className="ob-cancel-section">
                <button 
                  onClick={handleCancelOnboarding}
                  className="ob-btn-cancel"
                >
                  ← Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Show Form Mode (for new submission or editing) */}
      <div className="ob-form-container">
        <h2 className="ob-form-title">
          {isEditing ? 'Edit Your Onboarding Submission' : 'Complete Your Onboarding'}
        </h2>
        <p className="ob-form-description">
          Please fill out all required information. Once submitted, you'll have full access to Accounts and Timesheets.
        </p>
        
        <OnboardingForm 
          onSubmit={handleFormSubmit}
          initialData={isEditing ? employeeData : null}
          isEditing={isEditing}
          loading={loading}
        />
        
        <div className="ob-form-footer">
          <button 
            onClick={handleCancelOnboarding}
            className="ob-btn-cancel-form"
          >
            Cancel
          </button>
          <p className="ob-form-note">
            Note: All fields marked with * are required. You can edit your submission later if needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;