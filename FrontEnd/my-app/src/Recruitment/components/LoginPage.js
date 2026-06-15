




// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEye, faEyeSlash, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
// import "../styles/Login.css";
// import prophecyLogo2 from "../Assets/images/prophecy-logo2.png";
// import prophecyLogo from "../Assets/images/prophecy-logo.png";
// import img from "../Assets/images/img.png";
// import BASE_URL from "../../url";

// const LoginPage = () => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

// // Updated handleLogin function for LoginPage.js
// // // Updated handleLogin function for LoginPage.js with fixed role routing
// // const handleLogin = async (e) => {
// //   e.preventDefault();
// //   setLoading(true);
// //   setError(""); // Reset error on new login attempt
  
// //   try {
// //     const response = await fetch(`${BASE_URL}/api/auth/login`, {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({ username, password }),
// //     });
    
// //     const data = await response.json();
    
// //     if (!response.ok) {
// //       throw new Error(data.error || "Login failed");
// //     }
    
// //     // Store token and user data
// //     localStorage.setItem("token", data.token);
// //     localStorage.setItem("username", data.user.username);
// //     localStorage.setItem("role", data.user.role);
// //     localStorage.setItem("id", data.user.id);
// //     localStorage.setItem("user", JSON.stringify(data.user));
// //     localStorage.setItem("firstName", data.user.firstName);

// //     console.log("Login successful. Token saved:", data.token);
// //     console.log("User role:", data.user.role);
// //     console.log("User data:", data.user);

// //     // Enhanced role-based redirection with comprehensive role mapping
// //     const userRole = data.user.role.toLowerCase().trim();
    
// //     // Role-specific dashboard routing
// //     switch (userRole) {
// //       case 'admin':
// //         console.log("Redirecting admin to admin dashboard");
// //         navigate('/admin-dashboard');
// //         break;
        
// //       case 'manager':
// //         console.log("Redirecting manager to recruitment dashboard");
// //         navigate('/recruitment-dashboard');
// //         break;
        
// //       case 'team_lead':
// //       case 'team lead':
// //       case 'teamlead':
// //         console.log("Redirecting team lead to recruitment dashboard");
// //         navigate('/recruitment-dashboard'); // Team leads can use manager dashboard
// //         break;
        
// //       case 'recruiter':
// //         console.log("Redirecting recruiter to recruiter view");
// //         navigate('/recruiter-view');
// //         break;
        
// //       case 'user':
// //       default:
// //         console.log("Redirecting user to recruiter view");
// //         navigate('/recruiter-view');
// //         break;
// //     }
    
// //     // Show welcome message after navigation
// //     setTimeout(() => {
// //       const welcomeMessage = `Welcome ${data.user.firstName}! You have been logged in successfully as ${data.user.role}.`;
// //       alert(welcomeMessage);
// //     }, 100);
    
// //   } catch (error) {
// //     console.error("Login Error:", error);
// //     setError(error.message);
// //   } finally {
// //     setLoading(false);
// //   }
// // };



// // In the handleLogin function, after successful login:
// const handleLogin = async (e) => {
//   e.preventDefault();
//   setLoading(true);
//   setError("");
  
//   try {
//     const response = await fetch(`${BASE_URL}/api/auth/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ username, password }),
//     });
    
//     const data = await response.json();
    
//     if (!response.ok) {
//       throw new Error(data.error || "Login failed");
//     }

//     // Clear any previous session data completely
//     localStorage.clear();
    
//     // Store fresh session data
//     localStorage.setItem("token", data.token);
//     localStorage.setItem("username", data.user.username);
//     localStorage.setItem("role", data.user.role);
//     localStorage.setItem("id", data.user.id);
//     localStorage.setItem("user", JSON.stringify(data.user));
//     localStorage.setItem("firstName", data.user.firstName);

//     console.log('🔐 New login - creating fresh session');

//     // Track new login session
//     try {
//       const trackResponse = await fetch(`${BASE_URL}/api/auth/track-login`, {
//         method: "POST",
//         headers: { 
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${data.token}`
//         }
//       });
      
//       const trackData = await trackResponse.json();
//       if (trackData.trackingId) {
//         localStorage.setItem("currentSessionId", trackData.trackingId);
//         console.log('🆕 New session created:', trackData.trackingId);
//       }
//     } catch (trackError) {
//       console.error("Failed to track login:", trackError);
//     }

//     // Navigation based on role
//     const userRole = data.user.role.toLowerCase().trim();
//        switch (userRole) {
//           case "admin":
//           case "super_admin":
//             navigate("/home");
//             break;
//       case 'manager':
//         navigate('/recruitment-dashboard');
//         break;
//       case 'team_lead':
//       case 'team lead':
//       case 'teamlead':
//         navigate('/recruitment-dashboard');
//         break;
//       case 'recruiter':
//       case 'user':
//       default:
//         navigate('/recruiter-view');
//         break;
//     }
    
//   } catch (error) {
//     console.error("Login Error:", error);
//     setError(error.message);
//   } finally {
//     setLoading(false);
//   }
// };
//   return (
//     <div className="login-page-container">
//       <div className="login-container">
//         <div className="logoleft-section">
//           <img src={img} alt="Logo" className="loginside-image" />
//         </div>
//         <div className="logoright-section">
//           <div className="loginlogo-section">
//             <img src={prophecyLogo2} alt="Logo" className="logo" />
//             <img src={prophecyLogo} alt="Prophecy" className="logo1" />
//           </div>
//           <h1>Login</h1>
//           <form onSubmit={handleLogin}>
//             {/* Username Input */}
//             <input
//               type="text"
//               placeholder="Username"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               required
//               autoComplete="off"
//             />
//             {/* Password Input */}
//             <div className="loginpassword-container">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 autoComplete="new-password"
//               />
//               <FontAwesomeIcon
//                 icon={showPassword ? faEyeSlash : faEye}
//                 className="eye-icon"
//                 onClick={togglePasswordVisibility}
//               />
//             </div>
//             {/* Show error message with improved styling */}
//             {error && <div className="loginerror-message">{error}</div>}
//             {/* Login Button with improved loading state */}
//             <button 
//               type="submit" 
//               className={`login-button ${loading ? 'loading' : ''}`} 
//               disabled={loading}
//             >
//               {loading ? (
//                 <>
//                   <FontAwesomeIcon 
//                     icon={faCircleNotch} 
//                     spin 
//                     style={{ marginRight: '8px' }} 
//                   />
//                   Logging in...
//                 </>
//               ) : "Login"}
//             </button>
//             {/* Forgot Password */}
//             <p className="loginforgot-password">
//               <a href="/forgot">Forgot Password?</a>
//             </p>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;


// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEye, faEyeSlash, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
// import "../styles/Login.css";
// import prophecyLogo2 from "../Assets/images/prophecy-logo2.png";
// import prophecyLogo from "../Assets/images/prophecy-logo.png";
// import img from "../Assets/images/img.png";
// import BASE_URL from "../../url";

// const LoginPage = () => {
//   // Login states
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [isFlipped, setIsFlipped] = useState(false);
  
//   // Signup states
//   const [signupEmail, setSignupEmail] = useState("");
//   const [signupPassword, setSignupPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showSignupPassword, setShowSignupPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [signupLoading, setSignupLoading] = useState(false);
//   const [signupError, setSignupError] = useState("");
//   const [signupSuccess, setSignupSuccess] = useState("");
//   const [googleLoading, setGoogleLoading] = useState(false);

//   const navigate = useNavigate();

//   // Toggle functions
//   const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
//   const toggleSignupPasswordVisibility = () => setShowSignupPassword((prev) => !prev);
//   const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

//   const flipCard = () => {
//     setIsFlipped(!isFlipped);
//     setError("");
//     setSignupError("");
//     setSignupSuccess("");
//     setUsername("");
//     setPassword("");
//     setSignupEmail("");
//     setSignupPassword("");
//     setConfirmPassword("");
//   };

//   // Email validation
//   const validateEmail = (email) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   // Handle Google Sign-Up
//   const handleGoogleSignup = async () => {
//     try {
//       setGoogleLoading(true);
//       setSignupError("");

//       // Load Google script dynamically
//       const script = document.createElement('script');
//       script.src = 'https://accounts.google.com/gsi/client';
//       script.async = true;
//       script.defer = true;
      
//       script.onload = () => {
//         if (window.google) {
//           window.google.accounts.id.initialize({
//             client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
//             callback: handleGoogleResponse
//           });
          
//           window.google.accounts.id.renderButton(
//             document.getElementById('google-signin-button'),
//             { theme: 'outline', size: 'large', width: '100%' }
//           );
//         }
//       };
      
//       document.body.appendChild(script);

//     } catch (error) {
//       console.error("Error loading Google Sign-Up:", error);
//       setSignupError("Failed to load Google Sign-Up");
//     } finally {
//       setGoogleLoading(false);
//     }
//   };

//   // Handle Google Response
//   const handleGoogleResponse = async (response) => {
//     try {
//       setGoogleLoading(true);
//       setSignupError("");

//       const { credential } = response;

//       // Send Google token to your backend
//       const res = await fetch(`${BASE_URL}/api/auth/google-signup`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ googleToken: credential }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || "Google Sign-Up failed");
//       }

//       setSignupSuccess("✓ Account created with Google! Redirecting...");

//       // Store token and user data
//       localStorage.setItem("token", data.token);
//       localStorage.setItem("username", data.user.username);
//       localStorage.setItem("role", data.user.role);
//       localStorage.setItem("id", data.user.id);
//       localStorage.setItem("user", JSON.stringify(data.user));
//       localStorage.setItem("firstName", data.user.firstName);

//       console.log("✅ Google Sign-Up successful. Token stored.");

//       // Redirect after short delay
//       setTimeout(() => {
//         const pendingApplication = localStorage.getItem('pendingJobApplication');
//         if (pendingApplication) {
//           navigate('/careers', { state: { showApplicationForm: true } });
//         } else {
//           if (data.user.role === 'manager') {
//             navigate('/recruitment-dashboard');
//           } else {
//             navigate('/recruiter-view');
//           }
//         }
//       }, 1500);

//     } catch (error) {
//       console.error("Google Sign-Up Error:", error);
//       setSignupError(error.message);
//     } finally {
//       setGoogleLoading(false);
//     }
//   };

//   // Login function
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
    
//     try {
//       if (!username.trim() || !password.trim()) {
//         setError("Please enter email and password");
//         setLoading(false);
//         return;
//       }

//       const response = await fetch(`${BASE_URL}/api/auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username: username.trim(), password }),
//       });
      
//       const data = await response.json();
      
//       if (!response.ok) {
//         throw new Error(data.error || "Login failed");
//       }

//       if (!data.token) {
//         throw new Error("No authentication token received");
//       }
      
//       localStorage.setItem("token", data.token);
//       localStorage.setItem("username", data.user.username);
//       localStorage.setItem("role", data.user.role);
//       localStorage.setItem("id", data.user.id);
//       localStorage.setItem("user", JSON.stringify(data.user));
//       localStorage.setItem("firstName", data.user.firstName);

//       console.log("✅ Login successful. Token stored.");

//       const pendingApplication = localStorage.getItem('pendingJobApplication');
      
//       if (pendingApplication) {
//         navigate('/careers', { state: { showApplicationForm: true } });
//       } else {
//         if (data.user.role === 'manager') {
//           navigate('/recruitment-dashboard');
//         } else {
//           navigate('/recruiter-view');
//         }
//       }
      
//     } catch (error) {
//       console.error("Login Error:", error);
//       setError(error.message);
//     }
    
//     setLoading(false);
//   };

//   // Signup function
//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setSignupLoading(true);
//     setSignupError("");
//     setSignupSuccess("");
    
//     if (!signupEmail.trim()) {
//       setSignupError("Email is required");
//       setSignupLoading(false);
//       return;
//     }

//     if (!validateEmail(signupEmail)) {
//       setSignupError("Please enter a valid email address");
//       setSignupLoading(false);
//       return;
//     }

//     if (signupPassword !== confirmPassword) {
//       setSignupError("Passwords do not match");
//       setSignupLoading(false);
//       return;
//     }

//     if (signupPassword.length < 6) {
//       setSignupError("Password must be at least 6 characters long");
//       setSignupLoading(false);
//       return;
//     }
    
//     try {
//       const response = await fetch(`${BASE_URL}/api/auth/signup`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           username: signupEmail.trim().toLowerCase(), 
//           password: signupPassword
//         }),
//       });
      
//       const data = await response.json();
      
//       if (!response.ok) {
//         const errorMessage = typeof data.error === 'string' 
//           ? data.error 
//           : data.message || "Signup failed";
//         throw new Error(errorMessage);
//       }
      
//       setSignupSuccess("✓ Account created successfully! Logging you in...");
      
//       setSignupEmail("");
//       setSignupPassword("");
//       setConfirmPassword("");
      
//       setTimeout(async () => {
//         try {
//           const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ 
//               username: signupEmail.trim().toLowerCase(), 
//               password: signupPassword 
//             }),
//           });
          
//           const loginData = await loginResponse.json();
          
//           if (loginResponse.ok && loginData.token) {
//             localStorage.setItem("token", loginData.token);
//             localStorage.setItem("username", loginData.user.username);
//             localStorage.setItem("role", loginData.user.role);
//             localStorage.setItem("id", loginData.user.id);
//             localStorage.setItem("user", JSON.stringify(loginData.user));
//             localStorage.setItem("firstName", loginData.user.firstName);

//             console.log("✅ Auto-login successful after signup");

//             const pendingApplication = localStorage.getItem('pendingJobApplication');
            
//             if (pendingApplication) {
//               navigate('/careers', { state: { showApplicationForm: true } });
//             } else {
//               if (loginData.user.role === 'manager') {
//                 navigate('/recruitment-dashboard');
//               } else {
//                 navigate('/recruiter-view');
//               }
//             }
//           }
//         } catch (loginError) {
//           console.error("Auto-login error:", loginError);
//           setError("Login failed after signup. Please try logging in manually.");
//           setIsFlipped(false);
//         }
//       }, 1500);
      
//     } catch (error) {
//       console.error("Signup Error:", error);
//       setSignupError(error.message || "An error occurred during signup");
//     }
    
//     setSignupLoading(false);
//   };

//   const handleForgotPassword = (e) => {
//     e.preventDefault();
//     navigate('/forgot-password');
//   };

//   return (
//     <div className="login-page-container">
//       <div className="login-container">
//         <div className="logoleft-section">
//           <img src={img} alt="Logo" className="loginside-image" />
//         </div>
        
//         {/* Card flip container */}
//         <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
//           {/* Front side - Login */}
//           <div className="flip-card-front">
//             <div className="logoright-section">
//               <div className="loginlogo-section">
//                 <img src={prophecyLogo2} alt="Logo" className="logo" />
//                 <img src={prophecyLogo} alt="Prophecy" className="logo1" />
//               </div>
//               <h1>Login</h1>
//               <form onSubmit={handleLogin}>
//                 <input
//                   type="text"
//                   placeholder="Email"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                   required
//                   autoComplete="off"
//                 />
                
//                 <div className="loginpassword-container">
//                   <input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     autoComplete="new-password"
//                   />
//                   <FontAwesomeIcon
//                     icon={showPassword ? faEyeSlash : faEye}
//                     className="eye-icon"
//                     onClick={togglePasswordVisibility}
//                   />
//                 </div>
                
//                 {error && <div className="loginerror-message">{error}</div>}
                
//                 <button 
//                   type="submit" 
//                   className={`login-button ${loading ? 'loading' : ''}`} 
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <FontAwesomeIcon 
//                         icon={faCircleNotch} 
//                         spin 
//                         style={{ marginRight: '8px' }} 
//                       />
//                       Logging in...
//                     </>
//                   ) : "Login"}
//                 </button>
                
//                 <p className="loginforgot-password">
//                   <a href="/forgot-password" onClick={handleForgotPassword}>
//                     Forgot Password?
//                   </a>
//                 </p>
                
//                 <p className="signup-link">
//                   Don't have an account? 
//                   <a href="#" onClick={(e) => { e.preventDefault(); flipCard(); }}>
//                     Sign Up
//                   </a>
//                 </p>
//               </form>
//             </div>
//           </div>

//           {/* Back side - Signup */}
//           <div className="flip-card-back">
//             <div className="logoright-section">
//               <div className="loginlogo-section">
//                 <img src={prophecyLogo2} alt="Logo" className="logo" />
//                 <img src={prophecyLogo} alt="Prophecy" className="logo1" />
//               </div>
//               <h1>Sign Up</h1>
//               <form onSubmit={handleSignup}>
//                 <input
//                   type="email"
//                   placeholder="Email Address*"
//                   value={signupEmail}
//                   onChange={(e) => setSignupEmail(e.target.value)}
//                   required
//                   autoComplete="off"
//                 />
                
//                 <div className="loginpassword-container">
//                   <input
//                     type={showSignupPassword ? "text" : "password"}
//                     placeholder="Password *"
//                     value={signupPassword}
//                     onChange={(e) => setSignupPassword(e.target.value)}
//                     required
//                     autoComplete="new-password"
//                   />
//                   <FontAwesomeIcon
//                     icon={showSignupPassword ? faEyeSlash : faEye}
//                     className="eye-icon"
//                     onClick={toggleSignupPasswordVisibility}
//                   />
//                 </div>
                
//                 <div className="loginpassword-container">
//                   <input
//                     type={showConfirmPassword ? "text" : "password"}
//                     placeholder="Confirm Password *"
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     required
//                     autoComplete="new-password"
//                   />
//                   <FontAwesomeIcon
//                     icon={showConfirmPassword ? faEyeSlash : faEye}
//                     className="eye-icon"
//                     onClick={toggleConfirmPasswordVisibility}
//                   />
//                 </div>
                
//                 {signupError && <div className="loginerror-message">{signupError}</div>}
//                 {signupSuccess && (
//                   <div className="signup-success-message" style={{
//                     color: '#28a745',
//                     backgroundColor: '#d4edda',
//                     border: '1px solid #c3e6cb',
//                     padding: '10px',
//                     borderRadius: '5px',
//                     margin: '10px 0',
//                     textAlign: 'center'
//                   }}>
//                     {signupSuccess}
//                   </div>
//                 )}
                
//                 <button 
//                   type="submit" 
//                   className={`login-button ${signupLoading ? 'loading' : ''}`} 
//                   disabled={signupLoading || googleLoading}
//                 >
//                   {signupLoading ? (
//                     <>
//                       <FontAwesomeIcon 
//                         icon={faCircleNotch} 
//                         spin 
//                         style={{ marginRight: '8px' }} 
//                       />
//                       Creating Account...
//                     </>
//                   ) : "Create Account"}
//                 </button>

//                 {/* Google Sign-Up Button */}
//                 <div style={{ margin: '15px 0', textAlign: 'center', fontSize: '14px', color: '#666' }}>
//                   OR
//                 </div>

//                 <button
//                   type="button"
//                   onClick={handleGoogleSignup}
//                   disabled={googleLoading}
//                   style={{
//                     width: '100%',
//                     padding: '12px',
//                     marginBottom: '15px',
//                     backgroundColor: '#4285F4',
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '5px',
//                     fontSize: '16px',
//                     fontWeight: 'bold',
//                     cursor: googleLoading ? 'not-allowed' : 'pointer',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     gap: '10px',
//                     opacity: googleLoading ? 0.7 : 1,
//                     transition: 'background-color 0.3s'
//                   }}
//                   onMouseEnter={(e) => !googleLoading && (e.target.style.backgroundColor = '#3367D6')}
//                   onMouseLeave={(e) => !googleLoading && (e.target.style.backgroundColor = '#4285F4')}
//                 >
//                   {googleLoading ? (
//                     <>
//                       <FontAwesomeIcon 
//                         icon={faCircleNotch} 
//                         spin 
//                         style={{ marginRight: '8px' }} 
//                       />
//                       Signing up...
//                     </>
//                   ) : (
//                     <>
//                       <svg width="20" height="20" viewBox="0 0 24 24">
//                         <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
//                         <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//                         <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
//                         <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
//                       </svg>
//                       Sign up with Google
//                     </>
//                   )}
//                 </button>

//                 <div id="google-signin-button" style={{ display: 'none' }}></div>
                
//                 <p className="signup-link">
//                   Already have an account? 
//                   <a href="#" onClick={(e) => { e.preventDefault(); flipCard(); }}>
//                     Login
//                   </a>
//                 </p>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;


import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import "../styles/Login.css";
import prophecyLogo2 from "../Assets/images/prophecy-logo2.png";
import prophecyLogo from "../Assets/images/prophecy-logo.png";
import img from "../Assets/images/img.png";
import BASE_URL from "../../url";

const LoginPage = () => {
  // Login states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Signup states
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // 1. LOAD GOOGLE SDK
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("✅ Google SDK loaded successfully");
        // Initialize button if we're on signup page
        if (isFlipped) {
          setTimeout(() => initializeGoogleButton(), 500);
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  // 2. HANDLE FLIPPED STATE
  useEffect(() => {
    if (isFlipped && window.google) {
      setTimeout(() => {
        initializeGoogleButton();
      }, 500);
    }
  }, [isFlipped]);

  // 3. INITIALIZE GOOGLE BUTTON
  const initializeGoogleButton = () => {
    try {
      if (!window.google) {
        console.error("❌ Google SDK not loaded yet");
        return;
      }

      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      console.log("🔍 Client ID:", clientId ? "✅ Found" : "❌ Missing");

      if (!clientId) {
        console.error("❌ REACT_APP_GOOGLE_CLIENT_ID is not set in .env file");
        setSignupError("Google Sign-Up is not configured. Client ID missing.");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleSignUp,
      });

      const googleButtonContainer = document.getElementById('google-signup-button');
      if (googleButtonContainer) {
        googleButtonContainer.innerHTML = ''; // Clear previous rendering
        window.google.accounts.id.renderButton(
          googleButtonContainer,
          { 
            theme: 'outline', 
            size: 'large',
            width: '100%',
            text: 'signup_with'
          }
        );
        console.log("✅ Google button rendered successfully");
      } else {
        console.error("❌ google-signup-button container not found in DOM");
      }
    } catch (error) {
      console.error("❌ Error initializing Google button:", error);
      setSignupError("Failed to initialize Google Sign-Up");
    }
  };

  // 4. HANDLE GOOGLE SIGNUP
  const handleGoogleSignUp = async (response) => {
    try {
      const { credential } = response;

      if (!credential) {
        throw new Error("No credential received from Google");
      }

      // Decode JWT to get user info
      const decodedToken = JSON.parse(atob(credential.split('.')[1]));
      const googleEmail = decodedToken.email;
      const googleName = decodedToken.name;

      console.log("✅ Google credential received:", googleEmail);

      setSignupLoading(true);
      setSignupError("");
      setSignupSuccess("");

      // Send Google signup data to backend
      const res = await fetch(`${BASE_URL}/api/auth/google-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail,
          name: googleName,
          googleToken: credential,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Google signup failed");
      }

      // Store token and user data
      if (data.token) {
        const role = data.user.role ? data.user.role.toLowerCase().trim() : "";
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("role", role);
        localStorage.setItem("id", data.user.id);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("firstName", data.user.firstName);
        localStorage.setItem("isSupervisor", data.user.isSupervisor ? "true" : "false");

        console.log("✅ Google Signup successful. Token stored.");


        // Redirect based on role
        if (role === "super_admin") {
          navigate("/recruitment-dashboard");
        } else {
          navigate("/timesheets");
        }
      }
    } catch (error) {
      console.error("Google Signup Error:", error);
      setSignupError(error.message || "Google signup failed");
      setSignupLoading(false);
    }
  };

  // Toggle functions
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleSignupPasswordVisibility = () => setShowSignupPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    setError("");
    setSignupError("");
    setSignupSuccess("");
    setUsername("");
    setPassword("");
    setSignupEmail("");
    setSignupPassword("");
    setConfirmPassword("");
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Login function
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (!username.trim() || !password.trim()) {
        setError("Please enter email and password");
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Check if token exists
      if (!data.token) {
        throw new Error("No authentication token received");
      }
      
      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.user.username);
      const role = data.user.role ? data.user.role.toLowerCase().trim() : "";
      localStorage.setItem("role", role);
      localStorage.setItem("id", data.user.id);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("firstName", data.user.firstName);
      localStorage.setItem("isSupervisor", data.user.isSupervisor ? "true" : "false");

      console.log("✅ Login successful. Token stored.");


      // Check for a redirect parameter in the URL query string
      const searchParams = new URLSearchParams(location.search);
      const queryRedirect = searchParams.get('redirect');
      
      // Check if there's a pending job application
      const pendingApplication = localStorage.getItem('pendingJobApplication');
      
      if (pendingApplication) {
        // Redirect to job portal which will auto-fill the form
        navigate('/careers', { state: { showApplicationForm: true } });
      } else {
        // Role-based routing takes priority
        const role = data.user.role ? data.user.role.toLowerCase().trim() : "";
        localStorage.setItem("role", role);
        localStorage.removeItem('redirectPath');

        if (role === "super_admin") {
          navigate("/recruitment-dashboard");
        } else {
          navigate("/timesheets");
        }
      }
      
    } catch (error) {
      console.error("Login Error:", error);
      setError(error.message);
    }
    
    setLoading(false);
  };

  // Signup function - NO AUTO-LOGIN
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError("");
    setSignupSuccess("");
    
    // Validation
    if (!signupEmail.trim()) {
      setSignupError("Email is required");
      setSignupLoading(false);
      return;
    }

    if (!validateEmail(signupEmail)) {
      setSignupError("Please enter a valid email address");
      setSignupLoading(false);
      return;
    }

    if (signupPassword !== confirmPassword) {
      setSignupError("Passwords do not match");
      setSignupLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters long");
      setSignupLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: signupEmail.trim().toLowerCase(), 
          password: signupPassword
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : data.message || "Signup failed";
        throw new Error(errorMessage);
      }
      
      setSignupSuccess("✓ Account created successfully! Please login with your credentials.");
      
      // Reset form
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setIsFlipped(false);
        setSignupSuccess("");
        setUsername(signupEmail);
        setPassword("");
      }, 2000);
      
    } catch (error) {
      console.error("Signup Error:", error);
      setSignupError(error.message || "An error occurred during signup");
    }
    
    setSignupLoading(false);
  };

  // Navigation to forgot password
  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  return (
    <div className="login-page-container">
      <div className="login-container">
        <div className="logoleft-section">
          <img src={img} alt="Logo" className="loginside-image" />
        </div>
        
        {/* Card flip container */}
        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
          {/* Front side - Login */}
          <div className="flip-card-front">
            <div className="logoright-section">
              <div className="loginlogo-section">
                <img src={prophecyLogo2} alt="Logo" className="logo" />
                <img src={prophecyLogo} alt="Prophecy" className="logo1" />
              </div>
              <h1>Login</h1>
              <form onSubmit={handleLogin}>
                <input
                  type="text"
                  placeholder="Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="off"
                />
                
                <div className="loginpassword-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="eye-icon"
                    onClick={togglePasswordVisibility}
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
                      Logging in...
                    </>
                  ) : "Login"}
                </button>
                
                <p className="loginforgot-password">
                  <a href="/forgot-password" onClick={handleForgotPassword}>
                    Forgot Password?
                  </a>
                </p>
                
                <p className="signup-link">
                  Don't have an account? 
                  <a href="#" onClick={(e) => { e.preventDefault(); flipCard(); }}>
                    Sign Up
                  </a>
                </p>
              </form>
            </div>
          </div>

          {/* Back side - Signup */}
          <div className="flip-card-back">
            <div className="logoright-section">
              <div className="loginlogo-section">
                <img src={prophecyLogo2} alt="Logo" className="logo" />
                <img src={prophecyLogo} alt="Prophecy" className="logo1" />
              </div>
              <h1>Sign Up</h1>
              <form onSubmit={handleSignup}>
                <input
                  type="email"
                  placeholder="Email Address*"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
                
                <div className="loginpassword-container">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    placeholder="Password *"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <FontAwesomeIcon
                    icon={showSignupPassword ? faEyeSlash : faEye}
                    className="eye-icon"
                    onClick={toggleSignupPasswordVisibility}
                  />
                </div>
                
                <div className="loginpassword-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password *"
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
                
                {signupError && <div className="loginerror-message">{signupError}</div>}
                {signupSuccess && (
                  <div className="signup-success-message" style={{
                    color: '#28a745',
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    padding: '10px',
                    borderRadius: '5px',
                    margin: '10px 0',
                    textAlign: 'center'
                  }}>
                    {signupSuccess}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className={`login-button ${signupLoading ? 'loading' : ''}`} 
                  disabled={signupLoading}
                >
                  {signupLoading ? (
                    <>
                      <FontAwesomeIcon 
                        icon={faCircleNotch} 
                        spin 
                        style={{ marginRight: '8px' }} 
                      />
                      Creating Account...
                    </>
                  ) : "Create Account"}
                </button>

                {/* Google Sign Up Button */}
                <div style={{ margin: '20px 0', textAlign: 'center' }}>
                  <p style={{ color: '#666', marginBottom: '15px' }}>- OR -</p>
                  <div id="google-signup-button" style={{ display: 'flex', justifyContent: 'center' }}></div>
                </div>
                
                <p className="signup-link">
                  Already have an account? 
                  <a href="#" onClick={(e) => { e.preventDefault(); flipCard(); }}>
                    Login
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEye, faEyeSlash, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
// import "../styles/Login.css";
// import prophecyLogo2 from "../Assets/images/prophecy-logo2.png";
// import prophecyLogo from "../Assets/images/prophecy-logo.png";
// import img from "../Assets/images/img.png";
// import BASE_URL from "../../url";

// const LoginPage = () => {
//   // Login states
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [isFlipped, setIsFlipped] = useState(false);
  
//   // Signup states
//   const [signupEmail, setSignupEmail] = useState("");
//   const [signupPassword, setSignupPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showSignupPassword, setShowSignupPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [signupLoading, setSignupLoading] = useState(false);
//   const [signupError, setSignupError] = useState("");
//   const [signupSuccess, setSignupSuccess] = useState("");

//   const navigate = useNavigate();

//   // Toggle functions
//   const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
//   const toggleSignupPasswordVisibility = () => setShowSignupPassword((prev) => !prev);
//   const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

//   const flipCard = () => {
//     setIsFlipped(!isFlipped);
//     setError("");
//     setSignupError("");
//     setSignupSuccess("");
//     setUsername("");
//     setPassword("");
//     setSignupEmail("");
//     setSignupPassword("");
//     setConfirmPassword("");
//   };

//   // Email validation
//   const validateEmail = (email) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   // Login function
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
    
//     try {
//       if (!username.trim() || !password.trim()) {
//         setError("Please enter email and password");
//         setLoading(false);
//         return;
//       }

//       const response = await fetch(`${BASE_URL}/api/auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
//       });
      
//       const data = await response.json();
      
//       if (!response.ok) {
//         throw new Error(data.error || "Login failed");
//       }

//       // Check if token exists
//       if (!data.token) {
//         throw new Error("No authentication token received");
//       }
      
//       // Store token and user data
//       localStorage.setItem("token", data.token);
//       localStorage.setItem("username", data.user.username);
//       localStorage.setItem("role", data.user.role);
//       localStorage.setItem("id", data.user.id);
//       localStorage.setItem("user", JSON.stringify(data.user));
//       localStorage.setItem("firstName", data.user.firstName);

//       console.log("✅ Login successful. Token stored.");

//       // Check if there's a pending job application
//       const pendingApplication = localStorage.getItem('pendingJobApplication');
      
//       if (pendingApplication) {
//         // Redirect to job portal which will auto-fill the form
//         navigate('/careers', { state: { showApplicationForm: true } });
//       } else {
//         // Redirect based on role
//         if (data.user.role === 'manager') {
//           navigate('/recruitment-dashboard');
//         } else {
//           navigate('/recruiter-view');
//         }
//       }
      
//     } catch (error) {
//       console.error("Login Error:", error);
//       setError(error.message);
//     }
    
//     setLoading(false);
//   };

//   // Signup function - NO AUTO-LOGIN
//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setSignupLoading(true);
//     setSignupError("");
//     setSignupSuccess("");
    
//     // Validation
//     if (!signupEmail.trim()) {
//       setSignupError("Email is required");
//       setSignupLoading(false);
//       return;
//     }

//     if (!validateEmail(signupEmail)) {
//       setSignupError("Please enter a valid email address");
//       setSignupLoading(false);
//       return;
//     }

//     if (signupPassword !== confirmPassword) {
//       setSignupError("Passwords do not match");
//       setSignupLoading(false);
//       return;
//     }

//     if (signupPassword.length < 6) {
//       setSignupError("Password must be at least 6 characters long");
//       setSignupLoading(false);
//       return;
//     }
    
//     try {
//       const response = await fetch(`${BASE_URL}/api/auth/signup`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           username: signupEmail.trim().toLowerCase(), 
//           password: signupPassword
//         }),
//       });
      
//       const data = await response.json();
      
//       if (!response.ok) {
//         const errorMessage = typeof data.error === 'string' 
//           ? data.error 
//           : data.message || "Signup failed";
//         throw new Error(errorMessage);
//       }
      
//       setSignupSuccess("✓ Account created successfully! Please login with your credentials.");
      
//       // Reset form
//       setSignupEmail("");
//       setSignupPassword("");
//       setConfirmPassword("");
      
//       // Redirect to login after 2 seconds
//       setTimeout(() => {
//         setIsFlipped(false);
//         setSignupSuccess("");
//         setUsername(signupEmail);
//         setPassword("");
//       }, 2000);
      
//     } catch (error) {
//       console.error("Signup Error:", error);
//       setSignupError(error.message || "An error occurred during signup");
//     }
    
//     setSignupLoading(false);
//   };

//   // Navigation to forgot password
//   const handleForgotPassword = (e) => {
//     e.preventDefault();
//     navigate('/forgot-password');
//   };

//   return (
//     <div className="login-page-container">
//       <div className="login-container">
//         <div className="logoleft-section">
//           <img src={img} alt="Logo" className="loginside-image" />
//         </div>
        
//         {/* Card flip container */}
//         <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
//           {/* Front side - Login */}
//           <div className="flip-card-front">
//             <div className="logoright-section">
//               <div className="loginlogo-section">
//                 <img src={prophecyLogo2} alt="Logo" className="logo" />
//                 <img src={prophecyLogo} alt="Prophecy" className="logo1" />
//               </div>
//               <h1>Login</h1>
//               <form onSubmit={handleLogin}>
//                 <input
//                   type="text"
//                   placeholder="Email"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                   required
//                   autoComplete="off"
//                 />
                
//                 <div className="loginpassword-container">
//                   <input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     autoComplete="new-password"
//                   />
//                   <FontAwesomeIcon
//                     icon={showPassword ? faEyeSlash : faEye}
//                     className="eye-icon"
//                     onClick={togglePasswordVisibility}
//                   />
//                 </div>
                
//                 {error && <div className="loginerror-message">{error}</div>}
                
//                 <button 
//                   type="submit" 
//                   className={`login-button ${loading ? 'loading' : ''}`} 
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <FontAwesomeIcon 
//                         icon={faCircleNotch} 
//                         spin 
//                         style={{ marginRight: '8px' }} 
//                       />
//                       Logging in...
//                     </>
//                   ) : "Login"}
//                 </button>
                
//                 <p className="loginforgot-password">
//                   <a href="/forgot-password" onClick={handleForgotPassword}>
//                     Forgot Password?
//                   </a>
//                 </p>
                
//                 <p className="signup-link">
//                   Don't have an account? 
//                   <a href="#" onClick={(e) => { e.preventDefault(); flipCard(); }}>
//                     Sign Up
//                   </a>
//                 </p>
//               </form>
//             </div>
//           </div>

//           {/* Back side - Signup */}
//           <div className="flip-card-back">
//             <div className="logoright-section">
//               <div className="loginlogo-section">
//                 <img src={prophecyLogo2} alt="Logo" className="logo" />
//                 <img src={prophecyLogo} alt="Prophecy" className="logo1" />
//               </div>
//               <h1>Sign Up</h1>
//               <form onSubmit={handleSignup}>
//                 <input
//                   type="email"
//                   placeholder="Email Address*"
//                   value={signupEmail}
//                   onChange={(e) => setSignupEmail(e.target.value)}
//                   required
//                   autoComplete="off"
//                 />
                
//                 <div className="loginpassword-container">
//                   <input
//                     type={showSignupPassword ? "text" : "password"}
//                     placeholder="Password *"
//                     value={signupPassword}
//                     onChange={(e) => setSignupPassword(e.target.value)}
//                     required
//                     autoComplete="new-password"
//                   />
//                   <FontAwesomeIcon
//                     icon={showSignupPassword ? faEyeSlash : faEye}
//                     className="eye-icon"
//                     onClick={toggleSignupPasswordVisibility}
//                   />
//                 </div>
                
//                 <div className="loginpassword-container">
//                   <input
//                     type={showConfirmPassword ? "text" : "password"}
//                     placeholder="Confirm Password *"
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     required
//                     autoComplete="new-password"
//                   />
//                   <FontAwesomeIcon
//                     icon={showConfirmPassword ? faEyeSlash : faEye}
//                     className="eye-icon"
//                     onClick={toggleConfirmPasswordVisibility}
//                   />
//                 </div>
                
//                 {signupError && <div className="loginerror-message">{signupError}</div>}
//                 {signupSuccess && (
//                   <div className="signup-success-message" style={{
//                     color: '#28a745',
//                     backgroundColor: '#d4edda',
//                     border: '1px solid #c3e6cb',
//                     padding: '10px',
//                     borderRadius: '5px',
//                     margin: '10px 0',
//                     textAlign: 'center'
//                   }}>
//                     {signupSuccess}
//                   </div>
//                 )}
                
//                 <button 
//                   type="submit" 
//                   className={`login-button ${signupLoading ? 'loading' : ''}`} 
//                   disabled={signupLoading}
//                 >
//                   {signupLoading ? (
//                     <>
//                       <FontAwesomeIcon 
//                         icon={faCircleNotch} 
//                         spin 
//                         style={{ marginRight: '8px' }} 
//                       />
//                       Creating Account...
//                     </>
//                   ) : "Create Account"}
//                 </button>
                
//                 <p className="signup-link">
//                   Already have an account? 
//                   <a href="#" onClick={(e) => { e.preventDefault(); flipCard(); }}>
//                     Login
//                   </a>
//                 </p>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;