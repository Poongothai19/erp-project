// import React, { useState, useEffect } from "react";
// import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
// import Sidebar from "./Recruitment/components/Sidebar";
// import LoginPage from "./Recruitment/components/LoginPage";
// // import HomePage from "./Recruitment/components/Home";
// import JobOpeningForm from "./Recruitment/components/JobOpeningForm";
// import Settings from "./Recruitment/components/Settings";
// import JobListings from "./Recruitment/components/JobListings";
// import JobCreate from "./Recruitment/components/JobCreate";
// import ForgotPassword from "./Recruitment/components/ForgotPassword";
// import ClientCreation from "./Recruitment/components/ClientCreation";
// import ClientListings from "./Recruitment/components/ClientListings";
// import ClientColumn from "./Recruitment/components/ClientColumn";
// import ClientView from "./Recruitment/components/ClientView";
// import AddModal from "./Resume_Submission/Components/AddModal";
// import CreateContact from "./Recruitment/components/ContactCreate";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import Contactlisting from "./Recruitment/components/contactlisting";
// import JobEditView from "./Recruitment/components/JobEditView";
// import Jobtemplate from "./Recruitment/components/NewJobTemplate";
// import JobTemplatesPage from "./Recruitment/components/templates";
// import Users from "./Recruitment/components/user_page";
// import ClientEditView from "./Recruitment/components/ClientColumn";
// import ContactEditView from "./Recruitment/components/ContactEditView";
// import Newgroup from "./Recruitment/components/NewGroup";
// import GroupsPage from "./Recruitment/components/groups";

// import RecruitmentDashboard from "./erprecruitment/Components/RecruitmentDashboard";
// import RoleDetailView from "./erprecruitment/Components/RoleDetailView";
// import ResumeDashboard from "./Resume_Submission/Components/ResumeDashboard";
// // Import the CandidateDetail component
// import CandidateDetail from "./Resume_Submission/Components/CandidateDetail";
// import UserManagement from "./erprecruitment/Components/UserManagement";
// import BenchSales from "./Bench_Sales/Components/BenchSales";

// import CompaniesView from "./TimeSheetManagement/components/CompaniesView";

// import ManagerTimesheet from "./TimeSheetManagement/components/ManagerTimesheet";
// import TimeSheetApprovals from "./TimeSheetManagement/components/TimeSheetApprovals";
// import UserDetails from "./TimeSheetManagement/components/UserDetails"
// import ExternalSubmission from './Bench_Sales/Components/ExternalSubmission';

// import Accounts from "./Accounts/components/useraccounts";
// import Timesheets from "./Accounts/components/Timesheets";
// import JobOpenPortal from "./erprecruitment/Components/JobOpenPortal";
// import JobDetailsPage from "./erprecruitment/Components/JobDetailsPage";

// // ✅ H1B IMPORTS
// import H1BIntakeForm from "./H1B/components/H1BIntakeForm";
// import H1BDashboard from "./H1B/components/AdminDashboard";
// import H1BSubmissionDetail from "./H1B/components/SubmissionDetail";

// // ✅ ATS IMPORTS
// import ATS from "./ATS/components/ATS";
// import CandidateForm from "./ATS/components/CandidateForm";
// import CandidateForm2 from "./ATS/components/CandidateForm2";

// // ✅ MSA IMPORTS
// import MSA from "./MSA/components/MSA";

// // ✅ INVOICE IMPORTS
// import InvoiceList from "./Invoice/components/InvoiceList";

// // ✅ DOCUSIGN SIGNING PAGE IMPORTS (NEW!)
// import PublicDocuSignSigning from './MSA/components/PublicDocuSignSigning';
// import DocuSignSigningPage from './MSA/components/DocuSignSigningPage';
// // Reverted: import SigningComplete from './MSA/components/SigningComplete'; 

// // import SubmissionDashboard from "./Submissions/components/SubmissionDashboard";
// // import SubmissionDetail from "./Submissions/components/SubmissionDetail";

// import Swal from 'sweetalert2';
// import BASE_URL from "./url";
// import "./App.css";

// const App = () => {
//   const [isPinned, setIsPinned] = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isValidating, setIsValidating] = useState(true);
//   const [userRole, setUserRole] = useState(null);
//   const location = useLocation();
//   const navigate = useNavigate();

//   const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

//   const defaultSwalOptions = {
//     background: '#f8f9fa',
//     color: '#333',
//     confirmButtonColor: '#3085d6',
//     cancelButtonColor: '#d33',
//   };

//   // Validate token with backend
//   const validateToken = async (token) => {
//     try {
//       const response = await fetch(`${BASE_URL}/api/auth/me`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Token validation failed');
//       }

//       const data = await response.json();
//       if (data.success && data.role) {
//         setUserRole(data.role);
//         localStorage.setItem("isSupervisor", data.isSupervisor ? "true" : "false");
//       }
//       return data ? true : false;

//     } catch (error) {
//       console.error('Token validation error:', error);
//       return false;
//     }
//   };

//   // Logout function
//   const handleLogout = async (reason = 'manual') => {
//     console.log(`🚪 Logging out - Reason: ${reason}`);
    
//     const sessionId = localStorage.getItem("currentSessionId");
//     const token = localStorage.getItem("token");

//     // Track logout if we have session data
//     if (sessionId && token) {
//       try {
//         await fetch(`${BASE_URL}/api/auth/track-logout`, {
//           method: "POST",
//           headers: { 
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${token}`
//           },
//           body: JSON.stringify({ trackingId: parseInt(sessionId) })
//         });
//         console.log('✅ Logout tracked successfully');
//       } catch (error) {
//         console.error("Failed to track logout:", error);
//       }
//     }

//     // Clear all session data
//     localStorage.clear();
//     sessionStorage.clear();
    
//     // Update state
//     setIsAuthenticated(false);
//     setUserRole(null);
    
//     // Navigate to login
//     navigate('/', { replace: true });
    
//     // Show appropriate message
//     if (reason === 'session_expired') {
//       toast.error('Your session has expired. Please login again.', {
//         position: "top-center",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true
//       });
//     } else if (reason === 'token_invalid') {
//       toast.error('Your session is no longer valid. Please login again.', {
//         position: "top-center",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true
//       });
//     }
//   };

//   // Check session validity
//   const checkSession = async () => {
//     const token = localStorage.getItem("token");
//     const loginTime = localStorage.getItem("loginTime");
    
//     console.log('🔍 Checking session validity...');

//     if (!token) {
//       console.log('❌ No token found');
//       setIsAuthenticated(false);
//       setUserRole(null);
//       setIsValidating(false);
//       return false;
//     }

//     // Check if session has expired (8 hours)
//     if (loginTime) {
//       const elapsed = Date.now() - parseInt(loginTime);
//       if (elapsed > SESSION_DURATION) {
//         console.log('⏰ Session expired (8 hours)');
//         await handleLogout('session_expired');
//         setIsValidating(false);
//         return false;
//       }
//     }

//     // Validate token with backend
//     const isValid = await validateToken(token);
    
//     if (!isValid) {
//       console.log('❌ Token validation failed');
//       await handleLogout('token_invalid');
//       setIsValidating(false);
//       return false;
//     }

//     console.log('✅ Session is valid');
//     setIsAuthenticated(true);
//     setIsValidating(false);
//     return true;
//   };

//   // Initial session check on mount
//   useEffect(() => {
//     checkSession();
//   }, []);

//   // Check session on every route change
// useEffect(() => {
//     if (location.pathname !== '/' && !location.pathname.includes('/h1b') && !location.pathname.includes('/sign/')) {
//       checkSession();
      
//       // Save intended destination if not authenticated
//       if (!isAuthenticated) {
//         console.log(`📍 Saving redirect path: ${location.pathname}`);
//         localStorage.setItem('redirectPath', location.pathname);
//       }
//     }
//   }, [location.pathname, isAuthenticated]);

//   // Set up session timeout (8 hours)
//   useEffect(() => {
//     if (!isAuthenticated) return;

//     const loginTime = localStorage.getItem("loginTime");
//     if (!loginTime) {
//       localStorage.setItem("loginTime", Date.now().toString());
//     }

//     // Check session every minute
//     const sessionCheckInterval = setInterval(() => {
//       const currentLoginTime = localStorage.getItem("loginTime");
//       if (currentLoginTime) {
//         const elapsed = Date.now() - parseInt(currentLoginTime);
        
//         // If more than 8 hours, logout
//         if (elapsed > SESSION_DURATION) {
//           clearInterval(sessionCheckInterval);
//           handleLogout('session_expired');
//         }
//       }
//     }, 60000); // Check every minute

//     return () => clearInterval(sessionCheckInterval);
//   }, [isAuthenticated]);

//   // Handle page visibility (user switches tabs)
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (!document.hidden && isAuthenticated) {
//         // User came back to the tab - validate session
//         checkSession();
//       }
//     };

//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
//   }, [isAuthenticated]);

//   const togglePinned = () => setIsPinned(!isPinned);

//   const hasRecruitmentAccess = () => {
//     const role = localStorage.getItem('role');
//     return role === 'manager' || role === 'admin' || role === 'super_admin' || role === 'teamlead' || role === 'team_lead';
//   };

//   const isRecruiter = () => {
//     const role = localStorage.getItem('role');
//     return role === 'user' || role === 'recruiter';
//   };

//   const hasH1BAdminAccess = () => {
//     const role = localStorage.getItem('role');
//     return role === 'admin' || role === 'super_admin';
//   };

//   const hasATSAccess = () => {
//     const role = localStorage.getItem('role');
//     return role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'user' || role === 'teamlead' || role === 'team_lead';
//   };

//   const isExternalUser = () => {
//     const role = localStorage.getItem('role');
//     return role === 'External user' || role === 'external_user' || role === 'external-user';
//   };

//   // Show loading state while validating with Prophecy branding
//   if (isValidating) {
//     return (
//       <div style={{
//         display: 'flex',
//         flexDirection: 'column',
//         justifyContent: 'center',
//         alignItems: 'center',
//         height: '100vh',
//         fontFamily: 'Arial, sans-serif'
//       }}>
//         <div style={{
//           fontSize: '48px',
//           fontWeight: 'bold',
//           color: 'rgb(1, 157, 136)',
//           marginBottom: '30px',
//           letterSpacing: '2px',
//           textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
//         }}>
//           PROPHECY
//         </div>
//         <div style={{
//           width: '60px',
//           height: '60px',
//           border: '6px solid rgba(255, 255, 255, 0.3)',
//           borderTop: '6px solid rgb(1, 157, 136)',
//           borderRadius: '50%',
//           animation: 'spin 1s linear infinite'
//         }}></div>
//         <style>{`
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//         `}</style>
//       </div>
//     );
//   }

//   const isCandidateForm2Page = location.pathname === '/ats' && new URLSearchParams(window.location.search).get('candidateForm') === 'true';
//   const isCandidateFormPage = isExternalUser() && (location.pathname === '/careers' || location.pathname === '/');
//   const isJobDetailsPage = location.pathname.startsWith('/job/');
//   const isH1BIntakePage = location.pathname === '/h1b';
  
//   // ✅ NEW: Check if this is a public signing page (no sidebar needed)
//   const isPublicSigningPage = location.pathname.startsWith('/sign/') || location.pathname.startsWith('/msa/signing/');

//   return (
//     <div className={`app-container ${isAuthenticated || isCandidateForm2Page || isCandidateFormPage || isJobDetailsPage || isH1BIntakePage || isPublicSigningPage ? "" : "login-wrapper"}`}>
//       {isAuthenticated && !isCandidateForm2Page && !isCandidateFormPage && !isJobDetailsPage && !isH1BIntakePage && !isPublicSigningPage && <Sidebar isPinned={isPinned} togglePinned={togglePinned} />}
//       <div className={`main-content ${isPinned ? "" : "shifted"}`}>
//         <ToastContainer />
//         <Routes>
//           {/* Authentication Routes */}
//        <Route path="/" element={isAuthenticated ? <Navigate to={new URLSearchParams(window.location.search).get('redirect') || (isExternalUser() ? "/careers" : (localStorage.getItem('role') === 'super_admin' ? "/recruitment-dashboard" : "/timesheets"))} /> : <LoginPage />} />
//           <Route path="/login" element={isAuthenticated ? <Navigate to={new URLSearchParams(window.location.search).get('redirect') || (localStorage.getItem('role') === 'super_admin' ? "/recruitment-dashboard" : "/timesheets")} /> : <LoginPage />} />
//           <Route path="/forgot-password" element={<ForgotPassword />} />
//           <Route path="/forgot" element={<ForgotPassword />} />
           
//           {/* ============================================ */}
//           {/* ✅ PUBLIC SIGNING PAGE - NO LOGIN REQUIRED */}
//           {/* ============================================ */}
//           {/* Used when external recipient clicks email link */}
//           {/* Route: /sign/:signingToken */}
//           <Route 
//             path="/sign/:signingToken" 
//             element={<PublicDocuSignSigning />} 
//           />
          
//           <Route 
//             path="/msa/signing/:signingToken" 
//             element={<PublicDocuSignSigning />} 
//           />


//           {/* ============================================ */}
//           {/* ✅ AUTHENTICATED SIGNING PAGE - LOGIN REQUIRED */}
//           {/* ============================================ */}
//           {/* Used by logged-in users in the app */}
//           {/* Route: /msa/docusign/:signingToken */}
//           <Route 
//             path="/msa/docusign/:signingToken" 
//             element={
//               isAuthenticated && !isExternalUser() 
//                 ? <DocuSignSigningPage /> 
//                 : <Navigate to={`/login?redirect=${location.pathname}`} />
//             } 
//           />

//           {/* ============================================ */}
//           {/* ✅ MSA MODULE - MAIN INTERFACE */}
//           {/* ============================================ */}
//           {/* Main MSA module for authenticated users */}
//           {/* Route: /msa */}
//           <Route 
//             path="/msa" 
//             element={
//               isAuthenticated && !isExternalUser() 
//                 ? <MSA /> 
//                 : <Navigate to={`/login?redirect=${location.pathname}`} />
//             } 
//           />

//           {/* H1B Routes */}
//           <Route 
//             path="/h1b" 
//             element={<H1BIntakeForm />} 
//           />

//           <Route 
//             path="/h1b/dashboard" 
//             element={isAuthenticated && hasH1BAdminAccess() ? <H1BDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           <Route 
//             path="/h1b/submissions/:id" 
//             element={isAuthenticated && hasH1BAdminAccess() ? <H1BSubmissionDetail /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           {/* Jobs Portal */}
//           <Route 
//             path="/careers" 
//             element={
//               isExternalUser() 
//                 ? <CandidateForm /> 
//                 : isAuthenticated && !isExternalUser()
//                   ? <Navigate to="/dashboard" /> 
//                   : <JobOpenPortal />
//             }
//           />

//           <Route 
//             path="/job/:jobId" 
//             element={<JobDetailsPage />} 
//           />

//           {/* ATS Routes */}
//           <Route 
//             path="/ats" 
//             element={
//               new URLSearchParams(window.location.search).get('candidateForm') === 'true' 
//                 ? <CandidateForm2 /> 
//                 : isAuthenticated && hasATSAccess() 
//                   ? <ATS /> 
//                   : <Navigate to={`/login?redirect=${location.pathname}`} />
//             } 
//           />

//           {/* Main Routes */}
//           <Route 
//             path="/dashboard" 
//             element={
//                 isAuthenticated && !isExternalUser()
//                 ? <Navigate to={localStorage.getItem('role') === 'super_admin' ? "/recruitment-dashboard" : "/timesheets"} />
//                 : <Navigate to={isAuthenticated ? "/careers" : `/login?redirect=${location.pathname}`} />
//             } 
//           />

//           <Route 
//             path="/accounts" 
//             element={
//               isAuthenticated && !isExternalUser() 
//                 ? <Accounts /> 
//                 : <Navigate to={isAuthenticated ? "/careers" : `/login?redirect=${location.pathname}`} />
//             } 
//           />

//           <Route 
//             path="/invoices" 
//             element={
//               isAuthenticated && (localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'super_admin' || localStorage.getItem('role') === 'account_manager' || localStorage.getItem('role') === 'account-manager') && !isExternalUser() 
//                 ? <InvoiceList /> 
//                 : <Navigate to={`/login?redirect=${location.pathname}`} />
//             } 
//           />
        
//           {/* Recruitment Dashboard */}
//           <Route 
//             path="/recruitment-dashboard" 
//             element={isAuthenticated && hasRecruitmentAccess() && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           <Route 
//             path="/role-detail/:roleId" 
//             element={isAuthenticated && (hasRecruitmentAccess() || isRecruiter()) && !isExternalUser() ? <RoleDetailView /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           <Route 
//             path="/teamlead-dashboard" 
//             element={isAuthenticated && (localStorage.getItem('role') === 'teamlead' || localStorage.getItem('role') === 'team_lead') && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           <Route 
//             path="/recruiter-view" 
//             element={isAuthenticated && isRecruiter() && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           <Route 
//             path="/admin-dashboard" 
//             element={isAuthenticated && (localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'super_admin') && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           {/* Job Management Routes */}
//           <Route path="/job-openings" element={isAuthenticated && !isExternalUser() ? <JobOpeningForm /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/job-create" element={isAuthenticated && !isExternalUser() ? <JobCreate /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/job-listings" element={isAuthenticated && !isExternalUser() ? <JobListings /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/job-view" element={isAuthenticated && !isExternalUser() ? <JobEditView /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

//           {/* Client Management Routes */}
//           <Route path="/client-creation" element={isAuthenticated && !isExternalUser() ? <ClientCreation /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/Client-listings" element={isAuthenticated && !isExternalUser() ? <ClientListings /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/client-column" element={isAuthenticated && !isExternalUser() ? <ClientColumn /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/client-view" element={isAuthenticated && !isExternalUser() ? <ClientEditView /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

//           {/* Contact Management Routes */}
//           <Route path="/create-contact" element={isAuthenticated && !isExternalUser() ? <CreateContact /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/Contactlisting" element={isAuthenticated && !isExternalUser() ? <Contactlisting /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/Contact-View" element={isAuthenticated && !isExternalUser() ? <ContactEditView /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

//           {/* Template and User Routes */}
//           <Route path="/jobtemplate" element={isAuthenticated && !isExternalUser() ? <Jobtemplate /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/template" element={isAuthenticated && !isExternalUser() ? <JobTemplatesPage /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/Users" element={isAuthenticated && !isExternalUser() ? <Users /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

//           {/* ============================================ */}
//           {/* ✅ RESUME DASHBOARD AND CANDIDATE DETAIL ROUTES */}
//           {/* ============================================ */}
//           {/* Main Resume Dashboard */}
//           <Route 
//             path="/resume-dashboard" 
//             element={isAuthenticated && !isExternalUser() ? <ResumeDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           {/* Candidate Detail Page */}
//           <Route 
//             path="/candidates/:id" 
//             element={isAuthenticated && !isExternalUser() ? <CandidateDetail /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           {/* Edit Candidate Page - Optional (if you want a separate edit page) */}
//           <Route 
//             path="/candidates/edit/:id" 
//             element={isAuthenticated && !isExternalUser() ? <AddModal /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           {/* User Management - Admin Only */}
//           <Route 
//             path="/user-management" 
//             element={isAuthenticated && (localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'super_admin') && !isExternalUser() ? <UserManagement /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
//           />

//           {/* Bench Sales Routes */}
//           <Route path="/bench-sales" element={isAuthenticated && !isExternalUser() ? <BenchSales /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/bench-sales-dashboard" element={isAuthenticated && !isExternalUser() ? <BenchSales view="dashboard" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/bench-sales-recruiter" element={isAuthenticated && !isExternalUser() ? <BenchSales view="recruiter" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/bench-candidates" element={isAuthenticated && !isExternalUser() ? <BenchSales view="candidates" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/bench-requirements" element={isAuthenticated && !isExternalUser() ? <BenchSales view="requirements" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/bench-submissions" element={isAuthenticated && !isExternalUser() ? <BenchSales view="submissions" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/bench-marketing" element={isAuthenticated && !isExternalUser() ? <BenchSales view="marketing" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/bench-analytics" element={isAuthenticated && !isExternalUser() ? <BenchSales view="analytics" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/bench-vendors" element={isAuthenticated && !isExternalUser() ? <BenchSales view="vendors" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/bench-hotlist" element={isAuthenticated && !isExternalUser() ? <BenchSales view="hotlist" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/bench-external-submission" element={isAuthenticated && !isExternalUser() ? <ExternalSubmission /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/timesheets" element={isAuthenticated && !isExternalUser() ? <Timesheets /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           {/* <Route path="/submissions" element={isAuthenticated && !isExternalUser() ? <SubmissionDashboard /> : <Navigate to="/" />} /> */}
//           {/* <Route path="/submissions/:id" element={isAuthenticated && !isExternalUser() ? <SubmissionDetail /> : <Navigate to="/" />} /> */}

//           {/* Time Sheet Management Routes */}
//           <Route path="/companies" element={isAuthenticated && !isExternalUser() ? <CompaniesView /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/manager-timesheet" element={isAuthenticated && !isExternalUser() ? <ManagerTimesheet /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/timesheet-approvals" element={isAuthenticated && (localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'super_admin' || localStorage.getItem('role') === 'manager' || localStorage.getItem('role') === 'teamlead' || localStorage.getItem('role') === 'team_lead' || localStorage.getItem('isSupervisor') === 'true') && !isExternalUser() ? <TimeSheetApprovals /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

//           <Route path="/user-details/:employeeId" element={isAuthenticated && !isExternalUser() ? <UserDetails/> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

//           {/* Groups Routes */}
//           <Route path="/Newgroup" element={isAuthenticated && !isExternalUser() ? <Newgroup /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
//           <Route path="/Group" element={isAuthenticated && !isExternalUser() ? <GroupsPage /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          
//           {/* Settings Route */}
//           <Route 
//             path="/settings" 
//             element={isAuthenticated && !isExternalUser() ? <Settings /> : <Navigate to={isAuthenticated ? "/careers" : `/login?redirect=${location.pathname}`} />} 
//           />
          
//           {/* Catch-all route */}
//                <Route path="*" element={<Navigate to={isAuthenticated ? (isExternalUser() ? "/careers" : (localStorage.getItem('role') === 'super_admin' ? "/recruitment-dashboard" : "/timesheets")) : `/login?redirect=${location.pathname}`} />} />
//         </Routes>
//       </div>
//     </div>
//   );
// };

// export default App;

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Recruitment/components/Sidebar";
import LoginPage from "./Recruitment/components/LoginPage";
// import HomePage from "./Recruitment/components/Home";
import LeaveManagement from "./TimeSheetManagement/components/LeaveManagement";
import JobOpeningForm from "./Recruitment/components/JobOpeningForm";
import Settings from "./Recruitment/components/Settings";
import SocialMediaSettings from "./Recruitment/components/SocialMediaSettings";
import JobListings from "./Recruitment/components/JobListings";
import JobCreate from "./Recruitment/components/JobCreate";
import ForgotPassword from "./Recruitment/components/ForgotPassword";
import ClientCreation from "./Recruitment/components/ClientCreation";
import ClientListings from "./Recruitment/components/ClientListings";
import ClientColumn from "./Recruitment/components/ClientColumn";
import ClientView from "./Recruitment/components/ClientView";
import AddModal from "./Resume_Submission/Components/AddModal";
import CreateContact from "./Recruitment/components/ContactCreate";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Contactlisting from "./Recruitment/components/contactlisting";
import JobEditView from "./Recruitment/components/JobEditView";
import Jobtemplate from "./Recruitment/components/NewJobTemplate";
import JobTemplatesPage from "./Recruitment/components/templates";
import Users from "./Recruitment/components/user_page";
import ClientEditView from "./Recruitment/components/ClientColumn";
import ContactEditView from "./Recruitment/components/ContactEditView";
import Newgroup from "./Recruitment/components/NewGroup";
import GroupsPage from "./Recruitment/components/groups";

import RecruitmentDashboard from "./erprecruitment/Components/RecruitmentDashboard";
import RoleDetailView from "./erprecruitment/Components/RoleDetailView";
import ResumeDashboard from "./Resume_Submission/Components/ResumeDashboard";
// Import the CandidateDetail component
import CandidateDetail from "./Resume_Submission/Components/CandidateDetail";
import UserManagement from "./erprecruitment/Components/UserManagement";
import BenchSales from "./Bench_Sales/Components/BenchSales";

import CompaniesView from "./TimeSheetManagement/components/CompaniesView";

import ManagerTimesheet from "./TimeSheetManagement/components/ManagerTimesheet";
import TimeSheetApprovals from "./TimeSheetManagement/components/TimeSheetApprovals";
import UserDetails from "./TimeSheetManagement/components/UserDetails";

import ExternalSubmission from './Bench_Sales/Components/ExternalSubmission';

import Accounts from "./Accounts/components/useraccounts";
import Timesheets from "./Accounts/components/Timesheets";
import JobOpenPortal from "./erprecruitment/Components/JobOpenPortal";
import JobDetailsPage from "./erprecruitment/Components/JobDetailsPage";

// ✅ H1B IMPORTS
import H1BIntakeForm from "./H1B/components/H1BIntakeForm";
import CognifyarH1BIntakeForm from "./H1B/components/CognifyarH1BIntakeForm";
import DisensystemH1BIntakeForm from "./H1B/components/DisensystemH1BIntakeForm";
import H1BDashboard from "./H1B/components/AdminDashboard";
import H1BSubmissionDetail from "./H1B/components/SubmissionDetail";

// ✅ ATS IMPORTS
import ATS from "./ATS/components/ATS";
import CandidateForm from "./ATS/components/CandidateForm";
import CandidateForm2 from "./ATS/components/CandidateForm2";

// ✅ MSA IMPORTS
import MSA from "./MSA/components/MSA";

// ✅ INVOICE IMPORTS
import InvoiceList from "./Invoice/components/InvoiceList";

// ✅ DOCUSIGN SIGNING PAGE IMPORTS (NEW!)
import PublicDocuSignSigning from './MSA/components/PublicDocuSignSigning';
import DocuSignSigningPage from './MSA/components/DocuSignSigningPage';
// Reverted: import SigningComplete from './MSA/components/SigningComplete'; 

// import SubmissionDashboard from "./Submissions/components/SubmissionDashboard";
// import SubmissionDetail from "./Submissions/components/SubmissionDetail";

import Swal from 'sweetalert2';
import BASE_URL from "./url";
import "./App.css";

const App = () => {
  const [isPinned, setIsPinned] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

  const defaultSwalOptions = {
    background: '#f8f9fa',
    color: '#333',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
  };

  // Validate token with backend
  const validateToken = async (token) => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      const data = await response.json();
      if (data.success && data.role) {
        setUserRole(data.role);
        localStorage.setItem("isSupervisor", data.isSupervisor ? "true" : "false");
      }
      return data ? true : false;

    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Logout function
  const handleLogout = async (reason = 'manual') => {
    console.log(`🚪 Logging out - Reason: ${reason}`);
    
    const sessionId = localStorage.getItem("currentSessionId");
    const token = localStorage.getItem("token");

    // Track logout if we have session data
    if (sessionId && token) {
      try {
        await fetch(`${BASE_URL}/api/auth/track-logout`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ trackingId: parseInt(sessionId) })
        });
        console.log('✅ Logout tracked successfully');
      } catch (error) {
        console.error("Failed to track logout:", error);
      }
    }

    // Clear all session data
    localStorage.clear();
    sessionStorage.clear();
    
    // Update state
    setIsAuthenticated(false);
    setUserRole(null);
    
    // Navigate to login
    navigate('/', { replace: true });
    
    // Show appropriate message
    if (reason === 'session_expired') {
      toast.error('Your session has expired. Please login again.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } else if (reason === 'token_invalid') {
      toast.error('Your session is no longer valid. Please login again.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  };

  // Check session validity
  const checkSession = async () => {
    const token = localStorage.getItem("token");
    const loginTime = localStorage.getItem("loginTime");
    
    console.log('🔍 Checking session validity...');

    if (!token) {
      console.log('❌ No token found');
      setIsAuthenticated(false);
      setUserRole(null);
      setIsValidating(false);
      return false;
    }

    // Check if session has expired (8 hours)
    if (loginTime) {
      const elapsed = Date.now() - parseInt(loginTime);
      if (elapsed > SESSION_DURATION) {
        console.log('⏰ Session expired (8 hours)');
        await handleLogout('session_expired');
        setIsValidating(false);
        return false;
      }
    }

    // Validate token with backend
    const isValid = await validateToken(token);
    
    if (!isValid) {
      console.log('❌ Token validation failed');
      await handleLogout('token_invalid');
      setIsValidating(false);
      return false;
    }

    console.log('✅ Session is valid');
    setIsAuthenticated(true);
    setIsValidating(false);
    return true;
  };

  // Initial session check on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Check session on every route change
useEffect(() => {
    if (location.pathname !== '/' && !location.pathname.includes('/h1b') && !location.pathname.includes('/sign/')) {
      checkSession();
      
      // Save intended destination if not authenticated
      if (!isAuthenticated) {
        console.log(`📍 Saving redirect path: ${location.pathname}`);
        localStorage.setItem('redirectPath', location.pathname);
      }
    }
  }, [location.pathname, isAuthenticated]);

  // Set up session timeout (8 hours)
  useEffect(() => {
    if (!isAuthenticated) return;

    const loginTime = localStorage.getItem("loginTime");
    if (!loginTime) {
      localStorage.setItem("loginTime", Date.now().toString());
    }

    // Check session every minute
    const sessionCheckInterval = setInterval(() => {
      const currentLoginTime = localStorage.getItem("loginTime");
      if (currentLoginTime) {
        const elapsed = Date.now() - parseInt(currentLoginTime);
        
        // If more than 8 hours, logout
        if (elapsed > SESSION_DURATION) {
          clearInterval(sessionCheckInterval);
          handleLogout('session_expired');
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(sessionCheckInterval);
  }, [isAuthenticated]);

  // Handle page visibility (user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // User came back to the tab - validate session
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  const togglePinned = () => setIsPinned(!isPinned);

  const hasRecruitmentAccess = () => {
    const role = localStorage.getItem('role');
    return role === 'manager' || role === 'admin' || role === 'super_admin' || role === 'teamlead' || role === 'team_lead';
  };

  const isRecruiter = () => {
    const role = localStorage.getItem('role');
    return role === 'user' || role === 'recruiter';
  };

  const hasH1BAdminAccess = () => {
    const role = localStorage.getItem('role');
    return role === 'admin' || role === 'super_admin';
  };

  const hasATSAccess = () => {
    const role = localStorage.getItem('role');
    return role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'user' || role === 'teamlead' || role === 'team_lead';
  };

  const isExternalUser = () => {
    const role = localStorage.getItem('role');
    return role === 'External user' || role === 'external_user' || role === 'external-user';
  };

  // Show loading state while validating with Prophecy branding
  if (isValidating) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'rgb(1, 157, 136)',
          marginBottom: '30px',
          letterSpacing: '2px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          PROPHECY
        </div>
        <div style={{
          width: '60px',
          height: '60px',
          border: '6px solid rgba(255, 255, 255, 0.3)',
          borderTop: '6px solid rgb(1, 157, 136)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const isCandidateForm2Page = location.pathname === '/ats' && new URLSearchParams(window.location.search).get('candidateForm') === 'true';
  const isCandidateFormPage = isExternalUser() && (location.pathname === '/careers' || location.pathname === '/');
  const isJobDetailsPage = location.pathname.startsWith('/job/');
  const isH1BIntakePage = location.pathname === '/h1b';
  const isCognifyarH1BIntakePage = location.pathname === '/cognifyar-h1b';
  const isDisensystemH1BIntakePage = location.pathname === '/disensystem-h1b';
  
  // ✅ NEW: Check if this is a public signing page (no sidebar needed)
  const isPublicSigningPage = location.pathname.startsWith('/sign/') || location.pathname.startsWith('/msa/signing/');

  return (
    <div className={`app-container ${isAuthenticated || isCandidateForm2Page || isCandidateFormPage || isJobDetailsPage || isH1BIntakePage || isCognifyarH1BIntakePage || isDisensystemH1BIntakePage || isPublicSigningPage ? "" : "login-wrapper"}`}>
      {isAuthenticated && !isCandidateForm2Page && !isCandidateFormPage && !isJobDetailsPage && !isH1BIntakePage && !isCognifyarH1BIntakePage && !isDisensystemH1BIntakePage && !isPublicSigningPage && <Sidebar isPinned={isPinned} togglePinned={togglePinned} />}
      <div className={`main-content ${isPinned ? "" : "shifted"}`}>
        <ToastContainer />
        <Routes>
          {/* Authentication Routes */}
       <Route path="/" element={isAuthenticated ? <Navigate to={new URLSearchParams(window.location.search).get('redirect') || (isExternalUser() ? "/careers" : (localStorage.getItem('role') === 'super_admin' ? "/recruitment-dashboard" : "/timesheets"))} /> : <LoginPage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to={new URLSearchParams(window.location.search).get('redirect') || (localStorage.getItem('role') === 'super_admin' ? "/recruitment-dashboard" : "/timesheets")} /> : <LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot" element={<ForgotPassword />} />
           
          {/* ============================================ */}
          {/* ✅ PUBLIC SIGNING PAGE - NO LOGIN REQUIRED */}
          {/* ============================================ */}
          {/* Used when external recipient clicks email link */}
          {/* Route: /sign/:signingToken */}
          <Route 
            path="/sign/:signingToken" 
            element={<PublicDocuSignSigning />} 
          />
          
          <Route 
            path="/msa/signing/:signingToken" 
            element={<PublicDocuSignSigning />} 
          />


          {/* ============================================ */}
          {/* ✅ AUTHENTICATED SIGNING PAGE - LOGIN REQUIRED */}
          {/* ============================================ */}
          {/* Used by logged-in users in the app */}
          {/* Route: /msa/docusign/:signingToken */}
          <Route 
            path="/msa/docusign/:signingToken" 
            element={
              isAuthenticated && !isExternalUser() 
                ? <DocuSignSigningPage /> 
                : <Navigate to={`/login?redirect=${location.pathname}`} />
            } 
          />

          {/* ============================================ */}
          {/* ✅ MSA MODULE - MAIN INTERFACE */}
          {/* ============================================ */}
          {/* Main MSA module for authenticated users */}
          {/* Route: /msa */}
          <Route 
            path="/msa" 
            element={
              isAuthenticated && !isExternalUser() 
                ? <MSA /> 
                : <Navigate to={`/login?redirect=${location.pathname}`} />
            } 
          />

          {/* H1B Routes */}
          <Route 
            path="/h1b" 
            element={<H1BIntakeForm />} 
          />
          <Route 
            path="/cognifyar-h1b" 
            element={<CognifyarH1BIntakeForm />} 
          />
          <Route 
            path="/disensystem-h1b" 
            element={<DisensystemH1BIntakeForm />} 
          />

          <Route 
            path="/h1b/dashboard" 
            element={isAuthenticated && hasH1BAdminAccess() ? <H1BDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          <Route 
            path="/h1b/submissions/:id" 
            element={isAuthenticated && hasH1BAdminAccess() ? <H1BSubmissionDetail /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          {/* Jobs Portal */}
          <Route 
            path="/careers" 
            element={
              isExternalUser() 
                ? <CandidateForm /> 
                : isAuthenticated && !isExternalUser()
                  ? <Navigate to="/dashboard" /> 
                  : <JobOpenPortal />
            }
          />

          <Route 
            path="/job/:jobId" 
            element={<JobDetailsPage />} 
          />

          {/* ATS Routes */}
          <Route 
            path="/ats" 
            element={
              new URLSearchParams(window.location.search).get('candidateForm') === 'true' 
                ? <CandidateForm2 /> 
                : isAuthenticated && hasATSAccess() 
                  ? <ATS /> 
                  : <Navigate to={`/login?redirect=${location.pathname}`} />
            } 
          />

          {/* Main Routes */}
          <Route 
            path="/dashboard" 
            element={
                isAuthenticated && !isExternalUser()
                ? <Navigate to={localStorage.getItem('role') === 'super_admin' ? "/recruitment-dashboard" : "/timesheets"} />
                : <Navigate to={isAuthenticated ? "/careers" : `/login?redirect=${location.pathname}`} />
            } 
          />

          <Route 
            path="/accounts" 
            element={
              isAuthenticated && !isExternalUser() 
                ? <Accounts /> 
                : <Navigate to={isAuthenticated ? "/careers" : `/login?redirect=${location.pathname}`} />
            } 
          />

          <Route 
            path="/invoices" 
            element={
              isAuthenticated && (localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'super_admin' || localStorage.getItem('role') === 'account_manager' || localStorage.getItem('role') === 'account-manager') && !isExternalUser() 
                ? <InvoiceList /> 
                : <Navigate to={`/login?redirect=${location.pathname}`} />
            } 
          />
        
          {/* Recruitment Dashboard */}
          <Route 
            path="/recruitment-dashboard" 
            element={isAuthenticated && hasRecruitmentAccess() && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          <Route 
            path="/role-detail/:roleId" 
            element={isAuthenticated && (hasRecruitmentAccess() || isRecruiter()) && !isExternalUser() ? <RoleDetailView /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          <Route 
            path="/teamlead-dashboard" 
            element={isAuthenticated && (localStorage.getItem('role') === 'teamlead' || localStorage.getItem('role') === 'team_lead') && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          <Route 
            path="/recruiter-view" 
            element={isAuthenticated && isRecruiter() && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          <Route 
            path="/admin-dashboard" 
            element={isAuthenticated && (localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'super_admin') && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          {/* Job Management Routes */}
          <Route path="/job-openings" element={isAuthenticated && !isExternalUser() ? <JobOpeningForm /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/job-create" element={isAuthenticated && !isExternalUser() ? <JobCreate /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/job-listings" element={isAuthenticated && !isExternalUser() ? <JobListings /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/job-view" element={isAuthenticated && !isExternalUser() ? <JobEditView /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

          {/* Client Management Routes */}
          <Route path="/client-creation" element={isAuthenticated && !isExternalUser() ? <ClientCreation /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/Client-listings" element={isAuthenticated && !isExternalUser() ? <ClientListings /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/client-column" element={isAuthenticated && !isExternalUser() ? <ClientColumn /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/client-view" element={isAuthenticated && !isExternalUser() ? <ClientEditView /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

          {/* Contact Management Routes */}
          <Route path="/create-contact" element={isAuthenticated && !isExternalUser() ? <CreateContact /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/Contactlisting" element={isAuthenticated && !isExternalUser() ? <Contactlisting /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/Contact-View" element={isAuthenticated && !isExternalUser() ? <ContactEditView /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

          {/* Template and User Routes */}
          <Route path="/jobtemplate" element={isAuthenticated && !isExternalUser() ? <Jobtemplate /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/template" element={isAuthenticated && !isExternalUser() ? <JobTemplatesPage /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/Users" element={isAuthenticated && !isExternalUser() ? <Users /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

          {/* ============================================ */}
          {/* ✅ RESUME DASHBOARD AND CANDIDATE DETAIL ROUTES */}
          {/* ============================================ */}
          {/* Main Resume Dashboard */}
          <Route 
            path="/resume-dashboard" 
            element={isAuthenticated && !isExternalUser() ? <ResumeDashboard /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          {/* Candidate Detail Page */}
          <Route 
            path="/candidates/:id" 
            element={isAuthenticated && !isExternalUser() ? <CandidateDetail /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          {/* Edit Candidate Page - Optional (if you want a separate edit page) */}
          <Route 
            path="/candidates/edit/:id" 
            element={isAuthenticated && !isExternalUser() ? <AddModal /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          {/* User Management - Admin Only */}
          <Route 
            path="/user-management" 
            element={isAuthenticated && (localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'super_admin') && !isExternalUser() ? <UserManagement /> : <Navigate to={`/login?redirect=${location.pathname}`} />} 
          />

          {/* Bench Sales Routes */}
          <Route path="/bench-sales" element={isAuthenticated && !isExternalUser() ? <BenchSales /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/bench-sales-dashboard" element={isAuthenticated && !isExternalUser() ? <BenchSales view="dashboard" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/bench-sales-recruiter" element={isAuthenticated && !isExternalUser() ? <BenchSales view="recruiter" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/bench-candidates" element={isAuthenticated && !isExternalUser() ? <BenchSales view="candidates" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/bench-requirements" element={isAuthenticated && !isExternalUser() ? <BenchSales view="requirements" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/bench-submissions" element={isAuthenticated && !isExternalUser() ? <BenchSales view="submissions" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/bench-marketing" element={isAuthenticated && !isExternalUser() ? <BenchSales view="marketing" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/bench-analytics" element={isAuthenticated && !isExternalUser() ? <BenchSales view="analytics" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/bench-vendors" element={isAuthenticated && !isExternalUser() ? <BenchSales view="vendors" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/bench-hotlist" element={isAuthenticated && !isExternalUser() ? <BenchSales view="hotlist" /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/bench-external-submission" element={isAuthenticated && !isExternalUser() ? <ExternalSubmission /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/timesheets" element={isAuthenticated && !isExternalUser() ? <Timesheets /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          {/* <Route path="/submissions" element={isAuthenticated && !isExternalUser() ? <SubmissionDashboard /> : <Navigate to="/" />} /> */}
          {/* <Route path="/submissions/:id" element={isAuthenticated && !isExternalUser() ? <SubmissionDetail /> : <Navigate to="/" />} /> */}

          {/* Time Sheet Management Routes */}
          <Route path="/companies" element={isAuthenticated && !isExternalUser() ? <CompaniesView /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/manager-timesheet" element={isAuthenticated && !isExternalUser() ? <ManagerTimesheet /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/timesheet-approvals" element={isAuthenticated && (localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'super_admin' || localStorage.getItem('role') === 'manager' || localStorage.getItem('role') === 'teamlead' || localStorage.getItem('role') === 'team_lead' || localStorage.getItem('isSupervisor') === 'true') && !isExternalUser() ? <TimeSheetApprovals /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />

          <Route path="/user-details/:employeeId" element={isAuthenticated && !isExternalUser() ? <UserDetails/> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
<Route path="/leave-manage" element={isAuthenticated && !isExternalUser() ? <LeaveManagement /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          {/* Groups Routes */}
          <Route path="/Newgroup" element={isAuthenticated && !isExternalUser() ? <Newgroup /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          <Route path="/Group" element={isAuthenticated && !isExternalUser() ? <GroupsPage /> : <Navigate to={`/login?redirect=${location.pathname}`} />} />
          
          {/* Settings Route */}
          <Route 
            path="/settings" 
            element={isAuthenticated && !isExternalUser() ? <Settings /> : <Navigate to={isAuthenticated ? "/careers" : `/login?redirect=${location.pathname}`} />} 
          />

          {/* Social Media Settings Route */}
          <Route 
            path="/recruitment/social-settings" 
            element={isAuthenticated && !isExternalUser() ? <SocialMediaSettings /> : <Navigate to={isAuthenticated ? "/careers" : `/login?redirect=${location.pathname}`} />} 
          />
          
          {/* Catch-all route */}
               <Route path="*" element={<Navigate to={isAuthenticated ? (isExternalUser() ? "/careers" : (localStorage.getItem('role') === 'super_admin' ? "/recruitment-dashboard" : "/timesheets")) : `/login?redirect=${location.pathname}`} />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;


// import React, { useState, useEffect } from "react";
// import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
// import Sidebar from "./Recruitment/components/Sidebar";
// import LoginPage from "./Recruitment/components/LoginPage";
// import HomePage from "./Recruitment/components/Home";
// import JobOpeningForm from "./Recruitment/components/JobOpeningForm";
// import Settings from "./Recruitment/components/Settings";
// import JobListings from "./Recruitment/components/JobListings";
// import JobCreate from "./Recruitment/components/JobCreate";
// import ForgotPassword from "./Recruitment/components/ForgotPassword";
// import ClientCreation from "./Recruitment/components/ClientCreation";
// import ClientListings from "./Recruitment/components/ClientListings";
// import ClientColumn from "./Recruitment/components/ClientColumn";
// import ClientView from "./Recruitment/components/ClientView";

// import CreateContact from "./Recruitment/components/ContactCreate";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import Contactlisting from "./Recruitment/components/contactlisting";
// import JobEditView from "./Recruitment/components/JobEditView";
// import Jobtemplate from "./Recruitment/components/NewJobTemplate";
// import JobTemplatesPage from "./Recruitment/components/templates";
// import Users from "./Recruitment/components/user_page";
// import ClientEditView from "./Recruitment/components/ClientColumn";
// import ContactEditView from "./Recruitment/components/ContactEditView";
// import Newgroup from "./Recruitment/components/NewGroup";
// import GroupsPage from "./Recruitment/components/groups";

// import RecruitmentDashboard from "./erprecruitment/Components/RecruitmentDashboard";
// import RoleDetailView from "./erprecruitment/Components/RoleDetailView";
// import ResumeDashboard from "./Resume_Submission/Components/ResumeDashboard";
// import UserManagement from "./erprecruitment/Components/UserManagement";
// import VendorManagement from "./erprecruitment/Components/VendorManagement";
// import BenchSales from "./Bench_Sales/Components/BenchSales";

// import CompaniesView from "./TimeSheetManagement/components/CompaniesView";

// import ManagerTimesheet from "./TimeSheetManagement/components/ManagerTimesheet";
// import UserDetails from "./TimeSheetManagement/components/UserDetails"
// import ExternalSubmission from './Bench_Sales/Components/ExternalSubmission';
// import Onboarding from "./Onboarding/components/Onboarding";
// import OnboardingModule from "./OnboardingModule/components/OnboardingModule";

// import Accounts from "./Accounts/components/useraccounts";
// import Timesheets from "./Accounts/components/Timesheets";
// import InvoiceList from "./Invoice/components/InvoiceList";
// import JobOpenPortal from "./erprecruitment/Components/JobOpenPortal";
// import JobDetailsPage from "./erprecruitment/Components/JobDetailsPage";

// // ✅ H1B IMPORTS
// import H1BIntakeForm from "./H1B/components/H1BIntakeForm";
// import H1BDashboard from "./H1B/components/AdminDashboard";
// import H1BSubmissionDetail from "./H1B/components/SubmissionDetail";

// // ATS Imports
// import ATS from "./ATS/components/ATS";
// import CandidateForm from "./ATS/components/CandidateForm";
// import CandidateForm2 from "./ATS/components/CandidateForm2";
// import CandidateDetail from "./Resume_Submission/Components/CandidateDetail";

// // ✅ MSA IMPORTS
// import MSA from "./MSA/components/MSA";
// import PublicDocuSignSigning from './MSA/components/PublicDocuSignSigning';
// import DocuSignSigningPage from './MSA/components/DocuSignSigningPage';

// // ✅ ONSITE ONBOARDING IMPORTS
// import EmployeeDirectory from "./OnsiteOnboarding/components/EmployeeDirectory";
// import OnboardingCompany from "./OnsiteOnboarding/components/OnboardingCompany";
// import EmployerDirectory from './OnsiteOnboarding/components/EmployerDirectory';
// import EmployerDashboard from './OnsiteOnboarding/components/EmployerDashboard';
// import CandidateOnboarding from './OnsiteOnboarding/components/CandidateOnboarding';
// import OnboardingPublicSigning from './OnsiteOnboarding/components/OnboardingPublicSigning';

// import Swal from 'sweetalert2';
// import BASE_URL from "./url";
// import "./App.css";

// const App = () => {
//   const [isPinned, setIsPinned] = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isValidating, setIsValidating] = useState(true);
//   const [userRole, setUserRole] = useState(null);
//   const location = useLocation();
//   const navigate = useNavigate();

//   const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

//   const defaultSwalOptions = {
//     background: '#f8f9fa',
//     color: '#333',
//     confirmButtonColor: '#3085d6',
//     cancelButtonColor: '#d33',
//   };

//   // Validate token with backend
//   const validateToken = async (token) => {
//     try {
//       const response = await fetch(`${BASE_URL}/api/auth/me`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Token validation failed');
//       }

//       const data = await response.json();
//       if (data.success && data.role) {
//         setUserRole(data.role);
//       }
//       return data ? true : false;
//     } catch (error) {
//       console.error('Token validation error:', error);
//       return false;
//     }
//   };

//   // Logout function
//   const handleLogout = async (reason = 'manual') => {
//     console.log(`🚪 Logging out - Reason: ${reason}`);
    
//     const sessionId = localStorage.getItem("currentSessionId");
//     const token = localStorage.getItem("token");

//     // Track logout if we have session data
//     if (sessionId && token) {
//       try {
//         await fetch(`${BASE_URL}/api/auth/track-logout`, {
//           method: "POST",
//           headers: { 
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${token}`
//           },
//           body: JSON.stringify({ trackingId: parseInt(sessionId) })
//         });
//         console.log('✅ Logout tracked successfully');
//       } catch (error) {
//         console.error("Failed to track logout:", error);
//       }
//     }

//     // Clear all session data
//     localStorage.clear();
//     sessionStorage.clear();
    
//     // Update state
//     setIsAuthenticated(false);
//     setUserRole(null);
    
//     // Navigate to login
//     navigate('/', { replace: true });
    
//     // Show appropriate message
//     if (reason === 'session_expired') {
//       toast.error('Your session has expired. Please login again.', {
//         position: "top-center",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true
//       });
//     } else if (reason === 'token_invalid') {
//       toast.error('Your session is no longer valid. Please login again.', {
//         position: "top-center",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true
//       });
//     }
//   };

//   // Check session validity
//   const checkSession = async () => {
//     const token = localStorage.getItem("token");
//     const loginTime = localStorage.getItem("loginTime");
    
//     console.log('🔍 Checking session validity...');

//     if (!token) {
//       console.log('❌ No token found');
//       setIsAuthenticated(false);
//       setUserRole(null);
//       setIsValidating(false);
//       return false;
//     }

//     // Check if session has expired (8 hours)
//     if (loginTime) {
//       const elapsed = Date.now() - parseInt(loginTime);
//       if (elapsed > SESSION_DURATION) {
//         console.log('⏰ Session expired (8 hours)');
//         await handleLogout('session_expired');
//         setIsValidating(false);
//         return false;
//       }
//     }

//     // Validate token with backend
//     const isValid = await validateToken(token);
    
//     if (!isValid) {
//       console.log('❌ Token validation failed');
//       await handleLogout('token_invalid');
//       setIsValidating(false);
//       return false;
//     }

//     console.log('✅ Session is valid');
//     setIsAuthenticated(true);
//     setIsValidating(false);
//     return true;
//   };

//   // Initial session check on mount
//   useEffect(() => {
//     // Exclude public routes
//     if (location.pathname !== '/' && !location.pathname.includes('/h1b') && !location.pathname.startsWith('/sign/') && !location.pathname.startsWith('/onsite/sign/')) {
//       checkSession();
//     } else if (location.pathname === '/') {
//       // Still run it for the root to handle automatic login
//       checkSession();
//     } else {
//       // For public pages, we can stop validating
//       setIsValidating(false);
//     }
//   }, []);

//   // Check session on every route change - exclude public routes
//   useEffect(() => {
//     if (location.pathname !== '/' && !location.pathname.includes('/h1b') && !location.pathname.startsWith('/sign/') && !location.pathname.startsWith('/onsite/sign/')) {
//       checkSession();
//     }
//   }, [location.pathname]);

//   // Set up session timeout (8 hours)
//   useEffect(() => {
//     if (!isAuthenticated) return;

//     const loginTime = localStorage.getItem("loginTime");
//     if (!loginTime) {
//       localStorage.setItem("loginTime", Date.now().toString());
//     }

//     // Check session every minute
//     const sessionCheckInterval = setInterval(() => {
//       const currentLoginTime = localStorage.getItem("loginTime");
//       if (currentLoginTime) {
//         const elapsed = Date.now() - parseInt(currentLoginTime);
        
//         // If more than 8 hours, logout
//         if (elapsed > SESSION_DURATION) {
//           clearInterval(sessionCheckInterval);
//           handleLogout('session_expired');
//         }
//       }
//     }, 60000); // Check every minute

//     return () => clearInterval(sessionCheckInterval);
//   }, [isAuthenticated]);

//   // Handle page visibility (user switches tabs)
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (!document.hidden && isAuthenticated) {
//         // User came back to the tab - validate session
//         checkSession();
//       }
//     };

//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
//   }, [isAuthenticated]);

//   const togglePinned = () => setIsPinned(!isPinned);

//   const hasRecruitmentAccess = () => {
//     const role = localStorage.getItem('role');
//     return role === 'manager' || role === 'admin' || role === 'teamlead' || role === 'team_lead';
//   };

//   const isRecruiter = () => {
//     const role = localStorage.getItem('role');
//     return role === 'user' || role === 'recruiter';
//   };

//   // ✅ Check if user is ADMIN ONLY for H1B ADMIN DASHBOARD & DETAILS
//   const hasH1BAdminAccess = () => {
//     const role = localStorage.getItem('role');
//     return role === 'admin';
//   };

//   // Helper function to check if user can access ATS
//   const hasATSAccess = () => {
//     const role = localStorage.getItem('role');
//     return role === 'admin' || role === 'manager' || role === 'user' || role === 'teamlead' || role === 'team_lead';
//   };

//   // Helper function to check if user is external user
//   const isExternalUser = () => {
//     const role = localStorage.getItem('role');
//     return role === 'External user' || role === 'external_user' || role === 'external-user';
//   };

//   // ✅ Helper function to check if user can access Onsite Onboarding
//   const hasOnsiteOnboardingAccess = () => {
//     const role = localStorage.getItem('role');
//     return role === 'admin' || role === 'manager' || role === 'hr';
//   };

//   // Show loading state while validating with Prophecy branding
//   if (isValidating) {
//     return (
//       <div style={{
//         display: 'flex',
//         flexDirection: 'column',
//         justifyContent: 'center',
//         alignItems: 'center',
//         height: '100vh',
//         fontFamily: 'Arial, sans-serif'
//       }}>
//         <div style={{
//           fontSize: '48px',
//           fontWeight: 'bold',
//           color: 'rgb(1, 157, 136)',
//           marginBottom: '30px',
//           letterSpacing: '2px',
//           textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
//         }}>
//           PROPHECY
//         </div>
//         <div style={{
//           width: '60px',
//           height: '60px',
//           border: '6px solid rgba(255, 255, 255, 0.3)',
//           borderTop: '6px solid rgb(1, 157, 136)',
//           borderRadius: '50%',
//           animation: 'spin 1s linear infinite'
//         }}></div>
//         <style>{`
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//         `}</style>
//       </div>
//     );
//   }

//   // ✅ Check if this is the direct ATS candidate form (candidateForm=true)
//   const isCandidateForm2Page = location.pathname === '/ats' && new URLSearchParams(window.location.search).get('candidateForm') === 'true';
  
//   // ✅ Check if this is the external user candidate form (via careers/JobOpenPortal)
//   const isCandidateFormPage = isExternalUser() && (location.pathname === '/careers' || location.pathname === '/');

//   // ✅ Check if this is a job details page (for external users)
//   const isJobDetailsPage = location.pathname.startsWith('/job/');

//   // ✅ Check if this is H1B Intake Form (PUBLIC - no sidebar needed)
//   const isH1BIntakePage = location.pathname === '/h1b';

//   // ✅ Check if this is a public signing page (no sidebar needed)
//   const isPublicSigningPage = location.pathname.startsWith('/sign/') || location.pathname.startsWith('/onsite/sign/');

//   return (
//     <div className={`app-container ${isAuthenticated || isCandidateForm2Page || isCandidateFormPage || isJobDetailsPage || isH1BIntakePage || isPublicSigningPage ? "" : "login-wrapper"}`}>
//       {isAuthenticated && !isCandidateForm2Page && !isCandidateFormPage && !isJobDetailsPage && !isH1BIntakePage && !isPublicSigningPage && <Sidebar isPinned={isPinned} togglePinned={togglePinned} />}
//       <div className={`main-content ${isPinned ? "" : "shifted"}`}>
//         <ToastContainer />
//         <Routes>
//           {/* Public Signing Pages - MOVED TO TOP FOR PUBLIC ACCESS */}
//           <Route 
//             path="/sign/:signingToken" 
//             element={<PublicDocuSignSigning />} 
//           />
//           <Route 
//             path="/onsite/sign/:signingToken" 
//             element={<OnboardingPublicSigning />} 
//           />

//           {/* Authentication Routes */}
//           <Route path="/" element={isAuthenticated ? <Navigate to={isExternalUser() ? "/careers" : "/dashboard"} /> : <LoginPage />} />
//           <Route path="/forgot-password" element={<ForgotPassword />} />
//           <Route path="/forgot" element={<ForgotPassword />} />
           
//           {/* ✅ H1B INTAKE FORM - PUBLIC ACCESS */}
//           <Route 
//             path="/h1b" 
//             element={<H1BIntakeForm />} 
//           />

//           {/* ✅ H1B DASHBOARD - ADMIN ONLY */}
//           <Route 
//             path="/h1b/dashboard" 
//             element={isAuthenticated && hasH1BAdminAccess() ? <H1BDashboard /> : <Navigate to="/" />} 
//           />

//           {/* ✅ H1B SUBMISSION DETAILS - ADMIN ONLY */}
//           <Route 
//             path="/h1b/submissions/:id" 
//             element={isAuthenticated && hasH1BAdminAccess() ? <H1BSubmissionDetail /> : <Navigate to="/" />} 
//           />

//           {/* ✅ Jobs Portal */}
//           <Route 
//             path="/careers" 
//             element={
//               isExternalUser() 
//                 ? <CandidateForm /> 
//                 : isAuthenticated && !isExternalUser()
//                   ? <Navigate to="/dashboard" /> 
//                   : <JobOpenPortal />
//             }
//           />

//           {/* Candidate Detail Route */}
//           <Route 
//             path="/candidates/:id" 
//             element={
//               isAuthenticated && !isExternalUser() 
//                 ? <CandidateDetail /> 
//                 : <Navigate to="/" />
//             } 
//           />

//           {/* ✅ Job Details Page */}
//           <Route 
//             path="/job/:jobId" 
//             element={
//               <JobDetailsPage />
//             } 
//           />

//           {/* ✅ ATS Routes */}
//           <Route 
//             path="/ats" 
//             element={
//               new URLSearchParams(window.location.search).get('candidateForm') === 'true' 
//                 ? <CandidateForm2 /> 
//                 : isAuthenticated && hasATSAccess() 
//                   ? <ATS /> 
//                   : <Navigate to="/" />
//             } 
//           />

//           {/* ============================================ */}
//           {/* ✅ MSA ROUTES */}
//           {/* ============================================ */}

//           {/* MSA ROUTES SECTION */}

//           {/* Authenticated Signing Page - Login required */}
//           {/* Used by logged-in users in the app */}
//           <Route 
//             path="/msa/docusign/:signingToken" 
//             element={
//               isAuthenticated && !isExternalUser() 
//                 ? <DocuSignSigningPage /> 
//                 : <Navigate to="/" />
//             } 
//           />

//           {/* Main MSA Module */}
//           <Route 
//             path="/msa" 
//             element={
//               isAuthenticated && !isExternalUser() 
//                 ? <MSA /> 
//                 : <Navigate to="/" />
//             } 
//           />

//           {/* ✅ ONSITE ONBOARDING ROUTES */}
//           <Route 
//             path="/employer-directory" 
//             element={
//               isAuthenticated && hasOnsiteOnboardingAccess() 
//                 ? <EmployerDirectory /> 
//                 : <Navigate to="/" />
//             } 
//           />

//           {/* Candidate Onboarding Route */}
//           <Route 
//             path="/candidate-onboarding" 
//             element={
//               isAuthenticated && localStorage.getItem('role') === 'candidate' 
//                 ? <CandidateOnboarding /> 
//                 : <Navigate to="/" />
//             } 
//           />

//           {/* Employer Dashboard Route */}
//           <Route 
//             path="/employer-dashboard" 
//             element={
//               isAuthenticated && localStorage.getItem('role') === 'employer' 
//                 ? <EmployerDashboard /> 
//                 : <Navigate to="/" />
//             } 
//           />
          
//           <Route 
//             path="/employee-directory" 
//             element={
//               isAuthenticated && hasOnsiteOnboardingAccess() 
//                 ? <EmployeeDirectory /> 
//                 : <Navigate to="/" />
//             } 
//           />

//           <Route 
//             path="/onboarding-company" 
//             element={
//               isAuthenticated && hasOnsiteOnboardingAccess() 
//                 ? <OnboardingCompany /> 
//                 : <Navigate to="/" />
//             } 
//           />

//           {/* Main Routes */}
//           <Route 
//             path="/dashboard" 
//             element={
//               isAuthenticated && !isExternalUser() 
//                 ? <HomePage /> 
//                 : <Navigate to={isAuthenticated ? "/careers" : "/"} />
//             } 
//           />

//           <Route 
//             path="/accounts" 
//             element={
//               isAuthenticated && !isExternalUser() 
//                 ? <Accounts /> 
//                 : <Navigate to={isAuthenticated ? "/careers" : "/"} />
//             } 
//           />
        
//           {/* Recruitment Dashboard */}
//           <Route 
//             path="/recruitment-dashboard" 
//             element={isAuthenticated && hasRecruitmentAccess() && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to="/" />} 
//           />

//           {/* Role Detail View */}
//           <Route 
//             path="/role-detail/:roleId" 
//             element={isAuthenticated && (hasRecruitmentAccess() || isRecruiter()) && !isExternalUser() ? <RoleDetailView /> : <Navigate to="/" />} 
//           />

//           {/* Team Lead Dashboard */}
//           <Route 
//             path="/teamlead-dashboard" 
//             element={isAuthenticated && (localStorage.getItem('role') === 'teamlead' || localStorage.getItem('role') === 'team_lead') && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to="/" />} 
//           />

//           {/* Invoices Route */}
//           <Route 
//             path="/invoices" 
//             element={isAuthenticated && !isExternalUser() && (userRole === "admin" || userRole === "manager" || userRole === "teamlead" || userRole === "team_lead") ? <InvoiceList /> : <Navigate to="/" />} 
//           />

//           {/* Recruiter View */}
//           <Route 
//             path="/recruiter-view" 
//             element={isAuthenticated && isRecruiter() && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to="/" />} 
//           />

//           {/* Vendor Management */}
//           <Route 
//             path="/vendor-management" 
//             element={isAuthenticated && !isExternalUser() ? <VendorManagement /> : <Navigate to="/" />} 
//           />

//           {/* Employee Onboarding Route */}
//           <Route 
//             path="/onboarding" 
//             element={
//               isAuthenticated && !isExternalUser() && localStorage.getItem('role') === 'employee' && 
//               localStorage.getItem('onboardingCompleted') !== 'true' 
//                 ? <Onboarding /> 
//                 : <Navigate to={isExternalUser() ? "/careers" : "/dashboard"} />
//             } 
//           />

//           {/* Onboarding Steps Route - Admin Only */}
//           <Route 
//             path="/onboarding-steps" 
//             element={
//               isAuthenticated && userRole === "admin" && !isExternalUser() 
//                 ? <OnboardingModule /> 
//                 : <Navigate to="/" />
//             } 
//           />

//           {/* Admin Dashboard */}
//           <Route 
//             path="/admin-dashboard" 
//             element={isAuthenticated && localStorage.getItem('role') === 'admin' && !isExternalUser() ? <RecruitmentDashboard /> : <Navigate to="/" />} 
//           />

//           {/* Job Management Routes */}
//           <Route path="/job-openings" element={isAuthenticated && !isExternalUser() ? <JobOpeningForm /> : <Navigate to="/" />} />
//           <Route path="/job-create" element={isAuthenticated && !isExternalUser() ? <JobCreate /> : <Navigate to="/" />} />
//           <Route path="/job-listings" element={isAuthenticated && !isExternalUser() ? <JobListings /> : <Navigate to="/" />} />
//           <Route path="/job-view" element={isAuthenticated && !isExternalUser() ? <JobEditView /> : <Navigate to="/" />} />

//           {/* Client Management Routes */}
//           <Route path="/client-creation" element={isAuthenticated && !isExternalUser() ? <ClientCreation /> : <Navigate to="/" />} />
//           <Route path="/Client-listings" element={isAuthenticated && !isExternalUser() ? <ClientListings /> : <Navigate to="/" />} />
//           <Route path="/client-column" element={isAuthenticated && !isExternalUser() ? <ClientColumn /> : <Navigate to="/" />} />
//           <Route path="/client-view" element={isAuthenticated && !isExternalUser() ? <ClientEditView /> : <Navigate to="/" />} />

//           {/* Contact Management Routes */}
//           <Route path="/create-contact" element={isAuthenticated && !isExternalUser() ? <CreateContact /> : <Navigate to="/" />} />
//           <Route path="/Contactlisting" element={isAuthenticated && !isExternalUser() ? <Contactlisting /> : <Navigate to="/" />} />
//           <Route path="/Contact-View" element={isAuthenticated && !isExternalUser() ? <ContactEditView /> : <Navigate to="/" />} />

//           {/* Template and User Routes */}
//           <Route path="/jobtemplate" element={isAuthenticated && !isExternalUser() ? <Jobtemplate /> : <Navigate to="/" />} />
//           <Route path="/template" element={isAuthenticated && !isExternalUser() ? <JobTemplatesPage /> : <Navigate to="/" />} />
//           <Route path="/Users" element={isAuthenticated && !isExternalUser() ? <Users /> : <Navigate to="/" />} />

//           {/* Resume Dashboard */}
//           <Route path="/resume-dashboard" element={isAuthenticated && !isExternalUser() ? <ResumeDashboard /> : <Navigate to="/" />} /> 

//           {/* User Management - Admin Only */}
//           <Route 
//             path="/user-management" 
//             element={isAuthenticated && localStorage.getItem('role') === 'admin' && !isExternalUser() ? <UserManagement /> : <Navigate to="/" />} 
//           />

//           {/* Bench Sales Routes */}
//           <Route path="/bench-sales" element={isAuthenticated && !isExternalUser() ? <BenchSales /> : <Navigate to="/" />} />
//           <Route path="/bench-sales-dashboard" element={isAuthenticated && !isExternalUser() ? <BenchSales view="dashboard" /> : <Navigate to="/" />} />
//           <Route path="/bench-sales-recruiter" element={isAuthenticated && !isExternalUser() ? <BenchSales view="recruiter" /> : <Navigate to="/" />} />
//           <Route path="/bench-candidates" element={isAuthenticated && !isExternalUser() ? <BenchSales view="candidates" /> : <Navigate to="/" />} />
//           <Route path="/bench-requirements" element={isAuthenticated && !isExternalUser() ? <BenchSales view="requirements" /> : <Navigate to="/" />} />
//           <Route path="/bench-submissions" element={isAuthenticated && !isExternalUser() ? <BenchSales view="submissions" /> : <Navigate to="/" />} />
//           <Route path="/bench-marketing" element={isAuthenticated && !isExternalUser() ? <BenchSales view="marketing" /> : <Navigate to="/" />} />
//           <Route path="/bench-analytics" element={isAuthenticated && !isExternalUser() ? <BenchSales view="analytics" /> : <Navigate to="/" />} />
//           <Route path="/bench-vendors" element={isAuthenticated && !isExternalUser() ? <BenchSales view="vendors" /> : <Navigate to="/" />} />
//           <Route path="/bench-hotlist" element={isAuthenticated && !isExternalUser() ? <BenchSales view="hotlist" /> : <Navigate to="/" />} />
//           <Route path="/bench-external-submission" element={isAuthenticated && !isExternalUser() ? <ExternalSubmission /> : <Navigate to="/" />} />
//           <Route path="/timesheets" element={isAuthenticated && !isExternalUser() ? <Timesheets /> : <Navigate to="/" />} />

//           {/* Time Sheet Management Routes */}
//           <Route path="/companies" element={isAuthenticated && !isExternalUser() ? <CompaniesView /> : <Navigate to="/" />} />
//           <Route path="/manager-timesheet" element={isAuthenticated && !isExternalUser() ? <ManagerTimesheet /> : <Navigate to="/" />} />
//           <Route path="/user-details/:employeeId" element={isAuthenticated && !isExternalUser() ? <UserDetails/> : <Navigate to="/" />} />

//           {/* Groups Routes */}
//           <Route path="/Newgroup" element={isAuthenticated && !isExternalUser() ? <Newgroup /> : <Navigate to="/" />} />
//           <Route path="/Group" element={isAuthenticated && !isExternalUser() ? <GroupsPage /> : <Navigate to="/" />} />
          
//           {/* Settings Route */}
//           <Route 
//             path="/settings" 
//             element={isAuthenticated && !isExternalUser() ? <Settings /> : <Navigate to={isAuthenticated ? "/careers" : "/"} />} 
//           />
          
//           {/* Catch-all route */}
//           <Route path="*" element={<Navigate to={isAuthenticated ? (isExternalUser() ? "/careers" : "/dashboard") : "/"} />} />
//         </Routes>
//       </div>
//     </div>
//   );
// };

// export default App;