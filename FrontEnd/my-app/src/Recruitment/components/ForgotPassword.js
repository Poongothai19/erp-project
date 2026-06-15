import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faCircleNotch, faCheckCircle, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "../styles/Login.css";
import prophecyLogo2 from "../Assets/images/prophecy-logo2.png";
import prophecyLogo from "../Assets/images/prophecy-logo.png";
import img from "../Assets/images/img.png";
import BASE_URL from "../../url";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Request, 2: Reset, 3: Success
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [tokenVerified, setTokenVerified] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check for token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyToken(token);
    } else {
      // No token in URL, show email input form
      setStep(1);
      setTokenVerified(true);
    }
  }, [searchParams]);

  const verifyToken = async (token) => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/verify-reset-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Invalid or expired token");
      }
      
      setUserInfo(data);
      setStep(2); // Move to reset password step
      setTokenVerified(true);
      
    } catch (error) {
      console.error("Token verification error:", error);
      setError(error.message);
      setStep(1); // Go back to email input if token is invalid
      setTokenVerified(true);
    }
    
    setLoading(false);
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }
      
      setSuccess(data.message || "Password reset link has been sent to your email.");
      setStep(3); // Move to success step
      
    } catch (error) {
      console.error("Request reset error:", error);
      setError(error.message);
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Validation
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    const token = searchParams.get('token');
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token, 
          newPassword 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      
      setSuccess("Password has been reset successfully! Redirecting to login...");
      setStep(3); // Move to success step
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error("Reset password error:", error);
      setError(error.message);
    }
    
    setLoading(false);
  };

  const toggleNewPasswordVisibility = () => setShowNewPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

  const handleBackToLogin = () => {
    navigate('/');
  };

  const handleResetAnother = () => {
    setStep(1);
    setEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setUserInfo(null);
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Show loading while verifying token
  if (!tokenVerified) {
    return (
      <div className="login-page-container">
        <div className="login-container">
          <div className="logoleft-section">
            <img src={img} alt="Logo" className="loginside-image" />
          </div>
          
          <div className="logoright-section">
            <div className="loginlogo-section">
              <img src={prophecyLogo2} alt="Logo" className="logo" />
              <img src={prophecyLogo} alt="Prophecy" className="logo1" />
            </div>
            
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <FontAwesomeIcon 
                icon={faCircleNotch} 
                spin 
                style={{ 
                  fontSize: '48px', 
                  color: '#17a2b8',
                  marginBottom: '20px'
                }} 
              />
              <h3>Verifying reset link...</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-container">
      <div className="login-container">
        <div className="logoleft-section">
          <img src={img} alt="Logo" className="loginside-image" />
        </div>
        
        <div className="logoright-section">
          <div className="loginlogo-section">
            <img src={prophecyLogo2} alt="Logo" className="logo" />
            <img src={prophecyLogo} alt="Prophecy" className="logo1" />
          </div>
          
          {/* Back to Login Button */}
          <div style={{ marginBottom: '20px' }}>
            <Link 
              to="/" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                color: '#fefefeff', 
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '8px' }} />
              Back to Login
            </Link>
          </div>
          
          <h1>Reset Password</h1>
          
          {/* Step 1: Request Password Reset */}
          {step === 1 && (
            <form onSubmit={handleRequestReset}>
              <p style={{ color: '#0d0d0dff', marginBottom: '20px', textAlign: 'center' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              {error && (
                <div className="loginerror-message" style={{ marginBottom: '15px' }}>
                  {error}
                </div>
              )}
              
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ marginBottom: '15px' }}
              />
              
              <button 
                type="submit" 
                className={`login-button ${loading ? 'loading' : ''}`} 
                disabled={loading}
                style={{ marginBottom: '15px' }}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon 
                      icon={faCircleNotch} 
                      spin 
                      style={{ marginRight: '8px' }} 
                    />
                    Sending...
                  </>
                ) : "Send Reset Link"}
              </button>
            </form>
          )}
          
          {/* Step 2: Reset Password */}
          {step === 2 && userInfo && (
            <form onSubmit={handleResetPassword}>
              <p style={{ color: '#666', marginBottom: '20px', textAlign: 'center' }}>
                Hello <strong>{userInfo.firstName || userInfo.username}</strong>, 
                please enter your new password.
              </p>
              
              <div className="loginpassword-container" style={{ marginBottom: '15px' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <FontAwesomeIcon
                  icon={showNewPassword ? faEyeSlash : faEye}
                  className="eye-icon"
                  onClick={toggleNewPasswordVisibility}
                />
              </div>
              
              <div className="loginpassword-container" style={{ marginBottom: '15px' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <FontAwesomeIcon
                  icon={showConfirmPassword ? faEyeSlash : faEye}
                  className="eye-icon"
                  onClick={toggleConfirmPasswordVisibility}
                />
              </div>
              
              {error && <div className="loginerror-message">{error}</div>}
              
              <button 
                type="submit" 
                className={`login-button ${loading ? 'loading' : ''}`} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon 
                      icon={faCircleNotch} 
                      spin 
                      style={{ marginRight: '8px' }} 
                    />
                    Resetting...
                  </>
                ) : "Reset Password"}
              </button>
            </form>
          )}
          
          {/* Step 3: Success Message */}
          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <FontAwesomeIcon 
                icon={faCheckCircle} 
                style={{ 
                  color: '#28a745', 
                  fontSize: '48px', 
                  marginBottom: '20px' 
                }} 
              />
              
              <h2 style={{ color: '#28a745', marginBottom: '20px' }}>
                {success}
              </h2>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px' }}>
                <button 
                  onClick={handleBackToLogin}
                  className="login-button"
                  style={{ flex: 1 }}
                >
                  Back to Login
                </button>
                
                {step === 3 && success.includes("sent") && (
                  <button 
                    onClick={handleResetAnother}
                    className="login-button"
                    style={{ 
                      flex: 1,
                      backgroundColor: '#6c757d',
                      borderColor: '#6c757d'
                    }}
                  >
                    Reset Another
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;