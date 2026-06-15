

// import React, { useEffect, useState, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import BASE_URL from "../../url";

// import {
//   LuLayoutDashboard,
//   LuBriefcase,
//   LuSettings,
//   LuLogOut,
//   LuChevronLeft,
//   LuChevronRight,
//   LuUserCheck,
//   LuUsers,
//   LuFileText,
//   LuChartBar,
//   LuUserPlus,
//   LuSend,
//   LuTarget,
//   LuBarChart,
//   LuStar,
//   LuClock,
//   LuClipboardList,
//   LuFileStack,
//   LuCircleCheck
// } from "react-icons/lu";


// import { FaAngleDown, FaAngleUp, FaThumbtack } from "react-icons/fa";
// import "../styles/Sidebar.css";
// import prophecyLogo2 from "../Assets/images/prophecy-logo2.png";
// import prophecyLogo from "../Assets/images/prophecy-logo.png";

// const Sidebar = () => {
//   const [isPinned, setIsPinned] = useState(localStorage.getItem("sidebarPinned") === "true");
//   const [isHovered, setIsHovered] = useState(false);
//   const [openSubmenu, setOpenSubmenu] = useState(null);
//   const [openBenchSalesSubmenu, setOpenBenchSalesSubmenu] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
//   const sidebarRef = useRef(null);
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Get user role from localStorage
//   const userRole = localStorage.getItem("role");
//   const isExpanded = isPinned || isHovered || isMobile;

//   // Check if user is external user
//   const isExternalUser = userRole === 'External user' || userRole === 'external_user' || userRole === 'external-user';

//   // ✅ CHECK IF USER IS ADMIN FOR H1B ACCESS (ADMIN ONLY)
//   const isAdmin = userRole === 'admin' || userRole === 'super_admin';

//   // ✅ REDIRECT EXTERNAL USERS TO CANDIDATE FORM
//   useEffect(() => {
//     if (isExternalUser && location.pathname !== "/ats") {
//       navigate("/ats?candidateForm=true", { replace: true });
//     }
//   }, [isExternalUser, navigate, location.pathname]);

//   // Handle screen resize
//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth <= 768;
//       setIsMobile(mobile);
//       if (mobile && isPinned) {
//         setIsSidebarVisible(false);
//       } else {
//         setIsSidebarVisible(true);
//       }
//     };

//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [isPinned]);

//   // Save pinned state to localStorage
//   useEffect(() => {
//     localStorage.setItem("sidebarPinned", isPinned);
//   }, [isPinned]);

//   // Handle clicks outside sidebar to close it on mobile
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (isMobile && !isPinned && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//         setIsSidebarVisible(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isMobile, isPinned]);

//   // Close sidebar when route changes on mobile
//   useEffect(() => {
//     if (isMobile && !isPinned) {
//       setIsSidebarVisible(false);
//     }
//   }, [location, isMobile, isPinned]);

//   // UPDATED LOGOUT FUNCTION WITH TRACKING
//   const handleLogout = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const sessionId = localStorage.getItem('currentSessionId');
      
//       console.log('🚪 Manual logout initiated');
      
//       // Track logout if we have a session ID
//       if (sessionId && token) {
//         try {
//           const response = await fetch(`${BASE_URL}/api/auth/track-logout`, {
//             method: "POST",
//             headers: { 
//               "Content-Type": "application/json",
//               "Authorization": `Bearer ${token}`
//             },
//             credentials: 'include',
//             body: JSON.stringify({ trackingId: parseInt(sessionId) })
//           });
          
//           if (response.ok) {
//             console.log('✅ Logout tracked successfully');
//           } else {
//             console.log('⚠️ Logout tracking failed, but continuing...');
//           }
//         } catch (trackError) {
//           console.error("Error tracking logout:", trackError);
//         }
//       }
      
//       // Clear all stored data
//       localStorage.removeItem('token');
//       localStorage.removeItem('username');
//       localStorage.removeItem('role');
//       localStorage.removeItem('id');
//       localStorage.removeItem('user');
//       localStorage.removeItem('firstName');
//       localStorage.removeItem('currentSessionId');
//       localStorage.removeItem('sidebarPinned');
      
//       console.log('🧹 Local storage cleared');
      
//       // Navigate to login
//       navigate('/');
      
//     } catch (error) {
//       console.error("Error during logout:", error);
//       localStorage.clear();
//       navigate('/');
//     }
//   };

//   const toggleSidebar = () => {
//     setIsSidebarVisible(!isSidebarVisible);
//   };

//   const toggleSubmenu = (menu) => {
//     setOpenSubmenu(openSubmenu === menu ? null : menu);
//   };

//   const toggleBenchSalesSubmenu = () => {
//     setOpenBenchSalesSubmenu(!openBenchSalesSubmenu);
//   };

//   const isActive = (path) => {
//     if (path.includes('?')) {
//       // Special handling for resume-dashboard to ignore other query params like 't' or 'refresh'
//       if (path.startsWith('/resume-dashboard')) {
//         const currentParams = new URLSearchParams(location.search);
//         const targetParams = new URLSearchParams(path.split('?')[1]);
//         return location.pathname === '/resume-dashboard' && currentParams.get('view') === targetParams.get('view');
//       }
//       return (location.pathname + location.search) === path;
//     }
//     return location.pathname === path;
//   };

//   // Check if current path is recruitment related
//   const isRecruitmentActive = () => {
//     return location.pathname === "/recruitment-dashboard" || 
//            location.pathname === "/recruiter-view" || 
//            location.pathname === "/teamlead-dashboard" ||
//            location.pathname === "/admin-dashboard" ||
//            location.pathname === "/vendor-management";
//   };

//   // Check if current path is ATS related
//   const isATSActive = () => {
//     return location.pathname === "/ats";
//   };

//   // ✅ Check if current path is H1B related (Dashboard or Details only)
//   const isH1BActive = () => {
//     return location.pathname === "/h1b/dashboard" || location.pathname.startsWith("/h1b/submissions/");
//   };

//   // Check if current path is Jobs related
//   const isJobsActive = () => {
//     return location.pathname === "/careers" ;
//   };

//   // Direct navigation to recruitment dashboard based on user role
//   const handleRecruitmentClick = () => {
//     if (userRole === "manager" || userRole === "admin" || userRole === "super_admin") {
//       navigate("/recruitment-dashboard");
//     } else if (userRole === "user" || userRole === "recruiter") {
//       navigate("/recruiter-view");
//     } else if (userRole === "teamlead" || userRole === "team_lead") {
//       navigate("/teamlead-dashboard");
//     } else {
//       navigate("/recruitment-dashboard");
//     }
//   };

//   // Direct navigation to bench sales dashboard based on user role
//   const handleBenchSalesClick = () => {
//     if (userRole === "manager" || userRole === "admin" || userRole === "super_admin") {
//       navigate("/bench-sales-dashboard");
//     } else if (userRole === "user") {
//       navigate("/bench-sales-recruiter");
//     } else if (userRole === "teamlead") {
//       navigate("/bench-sales-dashboard");
//     }
//   };

//   const benchSalesMenu = [
//     { path: "/bench-candidates", label: "Candidate Management", icon: <LuUsers size={16} /> },
//     { path: "/bench-requirements", label: "Requirements", icon: <LuFileText size={16} /> },
//     { path: "/bench-submissions", label: "Submissions", icon: <LuSend size={16} /> },
//     { path: "/bench-vendors", label: "Vendors", icon: <LuUsers size={16} /> },
//     { path: "/bench-marketing", label: "Marketing", icon: <LuTarget size={16} /> },
//     { path: "/bench-hotlist", label: "Hotlist", icon: <LuStar size={16} /> },
//   ];

//   // ✅ H1B SUBMENU - ADMIN ONLY (Dashboard and View Details)
//   const h1bMenu = [
//     { path: "/h1b/dashboard", label: "H1B Dashboard", icon: <LuLayoutDashboard size={16} /> },
//     // { path: "/h1b/submissions", label: "View Details", icon: <LuFileStack size={16} /> },
//   ];

//   // Check if ATS should be shown
//   const shouldShowATS = userRole === "admin" || userRole === "super_admin" || userRole === "manager" || userRole === "User" || userRole === "teamlead" || userRole === "team_lead";

//   // Check if Bench Sales should be shown
//   const shouldShowBenchSales = userRole && userRole !== "employee" && !isExternalUser;

//   // ✅ CHECK IF H1B SHOULD BE SHOWN - ADMIN ONLY
//   const shouldShowH1B = isAdmin;

//   // Check if Jobs should be shown - ONLY for external users
//   const shouldShowJobs = isExternalUser;

//   const shouldShowAccounts = userRole === "admin" || userRole === "super_admin" || userRole === "account_manager" || userRole === "account-manager";
//   const shouldShowTimesheetApprovals = userRole === "admin" || userRole === "super_admin" || userRole === "manager" || userRole === "teamlead" || userRole === "team_lead" || localStorage.getItem('isSupervisor') === 'true';



//   // Menu items based on user role
//   const getMenuItems = () => {
//     // If user is external user, show only Candidate Form (no menu needed, will redirect)
//     if (isExternalUser) {
//       return [
//         { 
//           path: "/ats?candidateForm=true", 
//           label: "Application Form", 
//           icon: <LuBriefcase size={20} />,
//           show: true
//         }
//       ];
//     }

//     // If user is employee, show only Dashboard, Accounts, and Timesheets
//     if (userRole === "employee") {
//       return [
//         { 
//           path: "/home", 
//           label: "Dashboard", 
//           icon: <LuLayoutDashboard size={20} />,
//           show: true
//         },
//         // {
//         //   label: "Accounts",
//         //   icon: <LuFileText size={20} />,
//         //   path: "/accounts",
//         //   show: true
//         // },
//         {
//           label: "Timesheets",
//           icon: <LuClock size={20} />,
//           path: "/timesheets",
//           show: true
//         },
//         {
//           label: "Timesheet Approvals",
//           icon: <LuCircleCheck size={20} />,
//           path: "/timesheet-approvals",
//           show: localStorage.getItem('isSupervisor') === 'true'
//         }

//       ];
//     }


//     // For all other roles, show the full menu
//     const baseItems = [
//       { 
//         path: "/home", 
//         label: "Dashboard", 
//         icon: <LuLayoutDashboard size={20} />,
//         show: true
//       },
//       {
//         path: "/timesheets?mode=internal",
//         label: "My Timesheets",
//         icon: <LuClock size={20} />,
//         show: userRole === "manager" || userRole === "teamlead" || userRole === "team_lead" || userRole === "user" || userRole === "admin"
//       }
//     ];

//     // Recruitment submenu
//     const recruitmentSubmenu = [
//       { 
//         path: "/recruitment-dashboard", 
//         label: "Recruitment Dashboard", 
//         icon: <LuLayoutDashboard size={16} />,
//         onClick: handleRecruitmentClick,
//         show: true
//       },
//       { 
//         path: "/vendor-management", 
//         label: "Vendor Management", 
//         icon: <LuUsers size={16} />,
//         onClick: () => navigate("/vendor-management"),
//         show: true
//       }
//     ];

//     const recruitmentItem = {
//       label: "Recruitment",
//       icon: <LuBriefcase size={20} />,
//       submenu: recruitmentSubmenu,
//       show: true
//     };

//     const candidateManagementSubmenu = [
//       { 
//         path: "/resume-dashboard?view=sourcing", 
//         label: "Sourcing", 
//         icon: <LuUserCheck size={16} />,
//         onClick: () => navigate(`/resume-dashboard?view=sourcing&t=${Date.now()}`),
//         show: true
//       },
//       { 
//         path: "/resume-dashboard?view=bench", 
//         label: "Bench candidates", 
//         icon: <LuUsers size={16} />,
//         onClick: () => navigate(`/resume-dashboard?view=bench&t=${Date.now()}`),
//         show: true
//       },
//       { 
//         path: "/resume-dashboard?view=review", 
//         label: "Need To review", 
//         icon: <LuFileStack size={16} />,
//         onClick: () => navigate(`/resume-dashboard?view=review&t=${Date.now()}`),
//         show: true
//       }
//     ];

//     const resumeSubmissionItem = {
//       label: "Candidate Manage",
//       icon: <LuUsers size={20} />,
//       submenu: candidateManagementSubmenu,
//       show: true
//     };

//     const submissionsItem = {
//       path: "/submissions", 
//       label: "Job Submissions", 
//       icon: <LuSend size={20} />,
//       show: true
//     };

//     const atsItem = {
//       path: "/ats",
//       label: "ATS",
//       icon: <LuClipboardList size={20} />,
//       show: shouldShowATS
//     };

//     // ✅ H1B ITEM - ADMIN ONLY (with submenu)
//     const h1bItem = {
//       label: "H1B Management",
//       icon: <LuFileStack size={20} />,
//       submenu: h1bMenu,
//       show: shouldShowH1B
//     };

//     // const msaItem = {
//     //   path: "/msa",
//     //   label: "MSA",
//     //   icon: <LuFileText size={20} />,
//     //   show: userRole === "admin" || userRole === "super_admin" || userRole === "account_manager" || userRole === "account-manager"
//     // };

//     const adminItems = [
//       {
//         label: "User Management",
//         icon: <LuUsers size={20} />,
//         path: "/user-management",
//         show: userRole === "admin" || userRole === "super_admin"
//       },
//       {
//         label: "Accounting",
//         icon: <LuFileText size={20} />,
//         path: "/companies",
//         show: shouldShowAccounts
//       },
//       {
//         label: "Invoices",
//         icon: <LuFileText size={20} />,
//         path: "/invoices",
//         show: shouldShowAccounts
//       },
//       {
//         label: "Onboarding",
//         icon: <LuUserPlus size={20} />,
//         path: "/onboarding",
//         show: userRole === "admin" || userRole === "super_admin"
//       },
//       {
//         label: "Timesheet Approvals",
//         icon: <LuClock size={20} />,
//         path: "/timesheet-approvals",
//         show: shouldShowTimesheetApprovals
//       }
//     ];

//     return [
//       ...baseItems,
//       recruitmentItem,
//       resumeSubmissionItem,
//       submissionsItem,
//       atsItem,
//       h1bItem,  // ✅ ADDED H1B ITEM WITH SUBMENU
//       // msaItem,  // ✅ ADDED MSA ITEM
//       ...adminItems.filter(item => item.show)
//     ];
//   };

//   const menuItems = getMenuItems();

//   return (
//     <>
//       {/* Mobile Toggle Button - Outside Sidebar */}
//       {isMobile && (
//         <button
//           className={`sidebar-toggle ${isSidebarVisible ? 'open' : ''}`}
//           onClick={toggleSidebar}
//           aria-label="Toggle sidebar"
//         >
//           {isSidebarVisible ? <LuChevronLeft /> : <LuChevronRight />}
//         </button>
//       )}

//       <div className={`sidebar-overlay ${isMobile && isSidebarVisible ? 'visible' : ''}`} onClick={() => setIsSidebarVisible(false)}></div>

//       <div className="Mainsidebar-container">
//         <div
//           ref={sidebarRef}
//           className={`sidebar ${isExpanded ? "expanded" : "collapsed"} ${isSidebarVisible ? "visible" : "hidden"}`}
//           onMouseEnter={() => !isMobile && !isPinned && setIsHovered(true)}
//           onMouseLeave={() => !isMobile && !isPinned && setIsHovered(false)}
//         >
//           {/* Sidebar Header */}
//           <div className="sidebar-header">
//             <div className="logo-container">
//               <img src={prophecyLogo2} alt="Logo" className="initial-logo" />
//               {isExpanded && <img src={prophecyLogo} alt="Logo" className="logo" />}
//             </div>

//             {/* Pin Button - Only show on desktop */}
//             {isExpanded && !isMobile && (
//               <button className="pin-button" onClick={() => setIsPinned(!isPinned)} aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}>
//                 <FaThumbtack className={`pin-icon ${isPinned ? "pinned" : ""}`} />
//               </button>
//             )}

//             {/* Close Button - Only show on mobile */}
//             {isExpanded && isMobile && (
//               <button className="close-button" onClick={() => setIsSidebarVisible(false)} aria-label="Close sidebar">
//                 <LuChevronLeft />
//               </button>
//             )}
//           </div>

//           {/* Sidebar Menu */}
//           <nav>
//             <ul className="menu">
//               {menuItems.map((item, index) => {
//                 if (!item.show) return null;

//                 if (item.submenu) {
//                   return (
//                     <React.Fragment key={index}>
//                       <li
//                         className={`menu-item ${openSubmenu === item.label ? "open" : ""} ${item.submenu.some(subItem => isActive(subItem.path)) ? "active" : ""}`}
//                         onClick={() => toggleSubmenu(item.label)}
//                       >
//                         {item.icon}
//                         {isExpanded && <span className="menu-text">{item.label}</span>}
//                         {isExpanded && item.submenu && (
//                           <span className="submenu-icon">
//                             {openSubmenu === item.label ? <FaAngleUp /> : <FaAngleDown />}
//                           </span>
//                         )}
//                         {item.submenu.some(subItem => isActive(subItem.path)) && <span className="active-indicator"></span>}
//                       </li>

//                       {isExpanded && openSubmenu === item.label && (
//                         <ul className="submenu">
//                           {item.submenu.filter(subItem => subItem.show !== false).map((subItem, subIndex) => (
//                             <li
//                               key={subIndex}
//                               className={`submenu-item ${isActive(subItem.path) ? "active" : ""}`}
//                               onClick={subItem.onClick ? subItem.onClick : () => navigate(subItem.path)}
//                             >
//                               <span className="submenu-icon">{subItem.icon}</span>
//                               <span className="submenu-text">{subItem.label}</span>
//                               {isActive(subItem.path) && <span className="active-indicator"></span>}
//                             </li>
//                           ))}
//                         </ul>
//                       )}
//                     </React.Fragment>
//                   );
//                 } else {
//                   return (
//                     <li
//                       key={index}
//                       className={`menu-item ${item.onClick && isRecruitmentActive() ? "active" : isActive(item.path) ? "active" : ""}`}
//                       onClick={item.onClick ? item.onClick : () => navigate(item.path)}
//                     >
//                       {item.icon}
//                       {isExpanded && <span className="menu-text">{item.label}</span>}
//                       {(item.onClick && isRecruitmentActive()) || (item.path === "/ats" && isATSActive()) || (item.path === "/jobs" && isJobsActive()) || isActive(item.path) ? <span className="active-indicator"></span> : null}
//                     </li>
//                   );
//                 }
//               })}

//               {/* Bench Sales Submenu - Only show if user is not employee and not external user */}
//               {shouldShowBenchSales && (
//                 <li
//                   className={`menu-item ${openBenchSalesSubmenu ? "open" : ""} ${location.pathname.includes("/bench-") || location.pathname === "/bench-sales" ? "active" : ""}`}
//                   onClick={toggleBenchSalesSubmenu}
//                 >
//                   <LuChartBar size={20} />
//                   {isExpanded && <span className="menu-text">Bench Sales</span>}
//                   {isExpanded && (
//                     <span className="submenu-icon">
//                       {openBenchSalesSubmenu ? <FaAngleUp /> : <FaAngleDown />}
//                     </span>
//                   )}
//                   {(location.pathname.includes("/bench-") || location.pathname === "/bench-sales") && <span className="active-indicator"></span>}
//                 </li>
//               )}
              
//               {/* Bench Sales Submenu Items - Only show if user is not employee and not external user */}
//               {shouldShowBenchSales && isExpanded && openBenchSalesSubmenu && (
//                 <ul className="submenu">
//                   <li
//                     className={`submenu-item ${isActive("/bench-sales-dashboard") || isActive("/bench-sales-recruiter") ? "active" : ""}`}
//                     onClick={handleBenchSalesClick}
//                   >
//                     <span className="submenu-icon"><LuLayoutDashboard size={16} /></span>
//                     <span className="submenu-text">Bench Sales Dashboard</span>
//                     {(isActive("/bench-sales-dashboard") || isActive("/bench-sales-recruiter")) && <span className="active-indicator"></span>}
//                   </li>
//                   {benchSalesMenu.map((item, index) => (
//                     <li
//                       key={index}
//                       className={`submenu-item ${isActive(item.path) ? "active" : ""}`}
//                       onClick={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         navigate(item.path);
//                       }}
//                     >
//                       <span className="submenu-icon">{item.icon}</span>
//                       <span className="submenu-text">{item.label}</span>
//                       {isActive(item.path) && <span className="active-indicator"></span>}
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </ul>
//           </nav>

//           {/* Settings & Logout - Only show if user is logged in */}
//           {userRole && (
//             <div className="settings-section">
//               <ul>
//                 {!isExternalUser && (
//                   <li className={isActive("/settings") ? "active" : ""} onClick={() => navigate("/settings")}>
//                     <LuSettings size={20} />
//                     {isExpanded && <span className="menu-text">Settings</span>}
//                     {isActive("/settings") && <span className="active-indicator"></span>}
//                   </li>
//                 )}
//                 <li onClick={handleLogout}>
//                   <LuLogOut size={20} />
//                   {isExpanded && <span className="menu-text">Log Out</span>}
//                 </li>
//               </ul>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BASE_URL from "../../url";

import {
  LuLayoutDashboard,
  LuBriefcase,
  LuSettings,
  LuLogOut,
  LuChevronLeft,
  LuChevronRight,
  LuUserCheck,
  LuUsers,
  LuFileText,
  LuChartBar,
  LuUserPlus,
  LuSend,
  LuTarget,
  LuBarChart,
  LuStar,
  LuClock,
  LuClipboardList,
  LuFileStack,
  LuCircleCheck,
  LuCalendar
} from "react-icons/lu";


import { FaAngleDown, FaAngleUp, FaThumbtack } from "react-icons/fa";
import "../styles/Sidebar.css";
import prophecyLogo2 from "../Assets/images/prophecy-logo2.png";
import prophecyLogo from "../Assets/images/prophecy-logo.png";

const Sidebar = () => {
  const [isPinned, setIsPinned] = useState(localStorage.getItem("sidebarPinned") === "true");
  const [isHovered, setIsHovered] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [openBenchSalesSubmenu, setOpenBenchSalesSubmenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get user role from localStorage
  const userRole = localStorage.getItem("role");
  const isExpanded = isPinned || isHovered || isMobile;

  // Check if user is external user
  const isExternalUser = userRole === 'External user' || userRole === 'external_user' || userRole === 'external-user';

  // ✅ CHECK IF USER IS ADMIN FOR H1B ACCESS (ADMIN ONLY)
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  // ✅ REDIRECT EXTERNAL USERS TO CANDIDATE FORM
  useEffect(() => {
    if (isExternalUser && location.pathname !== "/ats") {
      navigate("/ats?candidateForm=true", { replace: true });
    }
  }, [isExternalUser, navigate, location.pathname]);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && isPinned) {
        setIsSidebarVisible(false);
      } else {
        setIsSidebarVisible(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isPinned]);

  // Save pinned state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarPinned", isPinned);
  }, [isPinned]);

  // Handle clicks outside sidebar to close it on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && !isPinned && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isPinned]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile && !isPinned) {
      setIsSidebarVisible(false);
    }
  }, [location, isMobile, isPinned]);

  // UPDATED LOGOUT FUNCTION WITH TRACKING
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('currentSessionId');
      
      console.log('🚪 Manual logout initiated');
      
      // Track logout if we have a session ID
      if (sessionId && token) {
        try {
          const response = await fetch(`${BASE_URL}/api/auth/track-logout`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify({ trackingId: parseInt(sessionId) })
          });
          
          if (response.ok) {
            console.log('✅ Logout tracked successfully');
          } else {
            console.log('⚠️ Logout tracking failed, but continuing...');
          }
        } catch (trackError) {
          console.error("Error tracking logout:", trackError);
        }
      }
      
      // Clear all stored data
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('id');
      localStorage.removeItem('user');
      localStorage.removeItem('firstName');
      localStorage.removeItem('currentSessionId');
      localStorage.removeItem('sidebarPinned');
      
      console.log('🧹 Local storage cleared');
      
      // Navigate to login
      navigate('/');
      
    } catch (error) {
      console.error("Error during logout:", error);
      localStorage.clear();
      navigate('/');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const toggleSubmenu = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  const toggleBenchSalesSubmenu = () => {
    setOpenBenchSalesSubmenu(!openBenchSalesSubmenu);
  };

  const isActive = (path) => {
    if (path.includes('?')) {
      // Special handling for resume-dashboard to ignore other query params like 't' or 'refresh'
      if (path.startsWith('/resume-dashboard')) {
        const currentParams = new URLSearchParams(location.search);
        const targetParams = new URLSearchParams(path.split('?')[1]);
        return location.pathname === '/resume-dashboard' && currentParams.get('view') === targetParams.get('view');
      }
      return (location.pathname + location.search) === path;
    }
    return location.pathname === path;
  };

  // Check if current path is recruitment related
  const isRecruitmentActive = () => {
    return location.pathname === "/recruitment-dashboard" || 
           location.pathname === "/recruiter-view" || 
           location.pathname === "/teamlead-dashboard" ||
           location.pathname === "/admin-dashboard" ||
           location.pathname === "/vendor-management";
  };

  // Check if current path is ATS related
  const isATSActive = () => {
    return location.pathname === "/ats";
  };

  // ✅ Check if current path is H1B related (Dashboard or Details only)
  const isH1BActive = () => {
    return location.pathname === "/h1b/dashboard" || location.pathname.startsWith("/h1b/submissions/");
  };

  // Check if current path is Jobs related
  const isJobsActive = () => {
    return location.pathname === "/careers" ;
  };

  // Direct navigation to recruitment dashboard based on user role
  const handleRecruitmentClick = () => {
    if (userRole === "manager" || userRole === "admin" || userRole === "super_admin") {
      navigate("/recruitment-dashboard");
    } else if (userRole === "user" || userRole === "recruiter") {
      navigate("/recruiter-view");
    } else if (userRole === "teamlead" || userRole === "team_lead") {
      navigate("/teamlead-dashboard");
    } else {
      navigate("/recruitment-dashboard");
    }
  };

  // Direct navigation to bench sales dashboard based on user role
  const handleBenchSalesClick = () => {
    if (userRole === "manager" || userRole === "admin" || userRole === "super_admin") {
      navigate("/bench-sales-dashboard");
    } else if (userRole === "user") {
      navigate("/bench-sales-recruiter");
    } else if (userRole === "teamlead") {
      navigate("/bench-sales-dashboard");
    }
  };

  const benchSalesMenu = [
    { path: "/bench-candidates", label: "Candidate Management", icon: <LuUsers size={16} /> },
    { path: "/bench-requirements", label: "Requirements", icon: <LuFileText size={16} /> },
    { path: "/bench-submissions", label: "Submissions", icon: <LuSend size={16} /> },
    { path: "/bench-vendors", label: "Vendors", icon: <LuUsers size={16} /> },
    { path: "/bench-marketing", label: "Marketing", icon: <LuTarget size={16} /> },
    { path: "/bench-hotlist", label: "Hotlist", icon: <LuStar size={16} /> },
  ];

  // ✅ H1B SUBMENU - ADMIN ONLY (Dashboard and View Details)
  const h1bMenu = [
    { path: "/h1b/dashboard", label: "H1B Dashboard", icon: <LuLayoutDashboard size={16} /> },
    // { path: "/h1b/submissions", label: "View Details", icon: <LuFileStack size={16} /> },
  ];

  // Check if ATS should be shown
  const shouldShowATS = userRole === "admin" || userRole === "super_admin" || userRole === "manager" || userRole === "User" || userRole === "teamlead" || userRole === "team_lead";

  // Check if Bench Sales should be shown
  const shouldShowBenchSales = userRole && userRole !== "employee" && !isExternalUser;

  // ✅ CHECK IF H1B SHOULD BE SHOWN - ADMIN ONLY
  const shouldShowH1B = isAdmin;

  // Check if Jobs should be shown - ONLY for external users
  const shouldShowJobs = isExternalUser;

  const shouldShowAccounts = userRole === "admin" || userRole === "super_admin" || userRole === "account_manager" || userRole === "account-manager";
  const shouldShowTimesheetApprovals = userRole === "admin" || userRole === "super_admin" || userRole === "manager" || userRole === "teamlead" || userRole === "team_lead" || localStorage.getItem('isSupervisor') === 'true';



  // Menu items based on user role
  const getMenuItems = () => {
    // If user is external user, show only Candidate Form (no menu needed, will redirect)
    if (isExternalUser) {
      return [
        { 
          path: "/ats?candidateForm=true", 
          label: "Application Form", 
          icon: <LuBriefcase size={20} />,
          show: true
        }
      ];
    }

    // If user is employee, show only Dashboard, Accounts, and Timesheets
    if (userRole === "employee") {
      return [
        { 
          path: "/home", 
          label: "Dashboard", 
          icon: <LuLayoutDashboard size={20} />,
          show: false
        },
        {
          label: "Accounts",
          icon: <LuFileText size={20} />,
          path: "/accounts",
          show: true
        },
        {
          label: "Timesheets",
          icon: <LuClock size={20} />,
          path: "/timesheets",
          show: true
        },
        // {
        //   label: "Leave Manage",
        //   icon: <LuCalendar size={20} />,
        //   path: "/leave-manage",
        //   show: true
        // },
        {
          label: "Timesheet Approvals",
          icon: <LuCircleCheck size={20} />,
          path: "/timesheet-approvals",
          show: localStorage.getItem('isSupervisor') === 'true'
        }

      ];
    }


    // For all other roles, show the full menu
    const baseItems = [
      { 
        path: "/home", 
        label: "Dashboard", 
        icon: <LuLayoutDashboard size={20} />,
        show: false
      },
      {
        path: "/timesheets?mode=internal",
        label: "My Timesheets",
        icon: <LuClock size={20} />,
        show: userRole === "manager" || userRole === "teamlead" || userRole === "team_lead" || userRole === "user" || userRole === "admin"
      },
      // {
      //   path: "/leave-manage",
      //   label: "Leave Manage",
      //   icon: <LuCalendar size={20} />,
      //   show: true
      // }
    ];

    const recruitmentSubmenu = [
      { 
        path: "/recruitment-dashboard", 
        label: "Recruitment Dashboard", 
        icon: <LuLayoutDashboard size={16} />,
        onClick: handleRecruitmentClick,
        show: true
      }
    ];

    const recruitmentItem = {
      label: "Recruitment",
      icon: <LuBriefcase size={20} />,
      submenu: recruitmentSubmenu,
      show: true
    };

    const candidateManagementSubmenu = [
      { 
        path: "/resume-dashboard?view=sourcing", 
        label: "Sourcing", 
        icon: <LuUserCheck size={16} />,
        onClick: () => navigate(`/resume-dashboard?view=sourcing&t=${Date.now()}`),
        show: true
      },
      { 
        path: "/resume-dashboard?view=bench", 
        label: "Bench candidates", 
        icon: <LuUsers size={16} />,
        onClick: () => navigate(`/resume-dashboard?view=bench&t=${Date.now()}`),
        show: true
      },
      { 
        path: "/resume-dashboard?view=review", 
        label: "Need To review", 
        icon: <LuFileStack size={16} />,
        onClick: () => navigate(`/resume-dashboard?view=review&t=${Date.now()}`),
        show: true
      }
    ];

    const resumeSubmissionItem = {
      label: "Candidate Manage",
      icon: <LuUsers size={20} />,
      submenu: candidateManagementSubmenu,
      show: true
    };

    // const submissionsItem = {
    //   path: "/submissions", 
    //   label: "Job Submissions", 
    //   icon: <LuSend size={20} />,
    //   show: true
    // };

    const atsItem = {
      path: "/ats",
      label: "ATS",
      icon: <LuClipboardList size={20} />,
      show: shouldShowATS
    };

    // ✅ H1B ITEM - ADMIN ONLY (with submenu)
    const h1bItem = {
      label: "H1B Management",
      icon: <LuFileStack size={20} />,
      submenu: h1bMenu,
      show: shouldShowH1B
    };

    // const msaItem = {
    //   path: "/msa",
    //   label: "MSA",
    //   icon: <LuFileText size={20} />,
    //   show: userRole === "admin" || userRole === "super_admin" || userRole === "account_manager" || userRole === "account-manager"
    // };

    const adminItems = [
      {
        label: "User Management",
        icon: <LuUsers size={20} />,
        path: "/user-management",
        show: userRole === "admin" || userRole === "super_admin"
      },
      {
        label: "Accounting",
        icon: <LuFileText size={20} />,
        path: "/companies",
        show: shouldShowAccounts
      },
      {
        label: "Invoices",
        icon: <LuFileText size={20} />,
        path: "/invoices",
        show: shouldShowAccounts
      },
      // {
      //   label: "Onboarding",
      //   icon: <LuUserPlus size={20} />,
      //   path: "/onboarding",
      //   show: userRole === "admin" || userRole === "super_admin"
      // },
      {
        label: "Timesheet Approvals",
        icon: <LuClock size={20} />,
        path: "/timesheet-approvals",
        show: shouldShowTimesheetApprovals
      }
    ];

    return [
      ...baseItems,
      recruitmentItem,
      resumeSubmissionItem,
      // submissionsItem,
      atsItem,
      h1bItem,  // ✅ ADDED H1B ITEM WITH SUBMENU
      // msaItem,  // ✅ ADDED MSA ITEM
      ...adminItems.filter(item => item.show)
    ];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Toggle Button - Outside Sidebar */}
      {isMobile && (
        <button
          className={`sidebar-toggle ${isSidebarVisible ? 'open' : ''}`}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          {isSidebarVisible ? <LuChevronLeft /> : <LuChevronRight />}
        </button>
      )}

      <div className={`sidebar-overlay ${isMobile && isSidebarVisible ? 'visible' : ''}`} onClick={() => setIsSidebarVisible(false)}></div>

      <div className="Mainsidebar-container">
        <div
          ref={sidebarRef}
          className={`sidebar ${isExpanded ? "expanded" : "collapsed"} ${isSidebarVisible ? "visible" : "hidden"}`}
          onMouseEnter={() => !isMobile && !isPinned && setIsHovered(true)}
          onMouseLeave={() => !isMobile && !isPinned && setIsHovered(false)}
        >
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <div className="logo-container">
              <img src={prophecyLogo2} alt="Logo" className="initial-logo" />
              {isExpanded && <img src={prophecyLogo} alt="Logo" className="logo" />}
            </div>

            {/* Pin Button - Only show on desktop */}
            {isExpanded && !isMobile && (
              <button className="pin-button" onClick={() => setIsPinned(!isPinned)} aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}>
                <FaThumbtack className={`pin-icon ${isPinned ? "pinned" : ""}`} />
              </button>
            )}

            {/* Close Button - Only show on mobile */}
            {isExpanded && isMobile && (
              <button className="close-button" onClick={() => setIsSidebarVisible(false)} aria-label="Close sidebar">
                <LuChevronLeft />
              </button>
            )}
          </div>

          {/* Sidebar Menu */}
          <nav>
            <ul className="menu">
              {menuItems.map((item, index) => {
                if (!item.show) return null;

                if (item.submenu) {
                  return (
                    <React.Fragment key={index}>
                      <li
                        className={`menu-item ${openSubmenu === item.label ? "open" : ""} ${item.submenu.some(subItem => isActive(subItem.path)) ? "active" : ""}`}
                        onClick={() => toggleSubmenu(item.label)}
                      >
                        {item.icon}
                        {isExpanded && <span className="menu-text">{item.label}</span>}
                        {isExpanded && item.submenu && (
                          <span className="submenu-icon">
                            {openSubmenu === item.label ? <FaAngleUp /> : <FaAngleDown />}
                          </span>
                        )}
                        {item.submenu.some(subItem => isActive(subItem.path)) && <span className="active-indicator"></span>}
                      </li>

                      {isExpanded && openSubmenu === item.label && (
                        <ul className="submenu">
                          {item.submenu.filter(subItem => subItem.show !== false).map((subItem, subIndex) => (
                            <li
                              key={subIndex}
                              className={`submenu-item ${isActive(subItem.path) ? "active" : ""}`}
                              onClick={subItem.onClick ? subItem.onClick : () => navigate(subItem.path)}
                            >
                              <span className="submenu-icon">{subItem.icon}</span>
                              <span className="submenu-text">{subItem.label}</span>
                              {isActive(subItem.path) && <span className="active-indicator"></span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </React.Fragment>
                  );
                } else {
                  return (
                    <li
                      key={index}
                      className={`menu-item ${item.onClick && isRecruitmentActive() ? "active" : isActive(item.path) ? "active" : ""}`}
                      onClick={item.onClick ? item.onClick : () => navigate(item.path)}
                    >
                      {item.icon}
                      {isExpanded && <span className="menu-text">{item.label}</span>}
                      {(item.onClick && isRecruitmentActive()) || (item.path === "/ats" && isATSActive()) || (item.path === "/jobs" && isJobsActive()) || isActive(item.path) ? <span className="active-indicator"></span> : null}
                    </li>
                  );
                }
              })}

              {/* Bench Sales Submenu - Only show if user is not employee and not external user */}
              {shouldShowBenchSales && (
                <li
                  className={`menu-item ${openBenchSalesSubmenu ? "open" : ""} ${location.pathname.includes("/bench-") || location.pathname === "/bench-sales" ? "active" : ""}`}
                  onClick={toggleBenchSalesSubmenu}
                >
                  <LuChartBar size={20} />
                  {isExpanded && <span className="menu-text">Bench Sales</span>}
                  {isExpanded && (
                    <span className="submenu-icon">
                      {openBenchSalesSubmenu ? <FaAngleUp /> : <FaAngleDown />}
                    </span>
                  )}
                  {(location.pathname.includes("/bench-") || location.pathname === "/bench-sales") && <span className="active-indicator"></span>}
                </li>
              )}
              
              {/* Bench Sales Submenu Items - Only show if user is not employee and not external user */}
              {shouldShowBenchSales && isExpanded && openBenchSalesSubmenu && (
                <ul className="submenu">
                  <li
                    className={`submenu-item ${isActive("/bench-sales-dashboard") || isActive("/bench-sales-recruiter") ? "active" : ""}`}
                    onClick={handleBenchSalesClick}
                  >
                    <span className="submenu-icon"><LuLayoutDashboard size={16} /></span>
                    <span className="submenu-text">Bench Sales Dashboard</span>
                    {(isActive("/bench-sales-dashboard") || isActive("/bench-sales-recruiter")) && <span className="active-indicator"></span>}
                  </li>
                  {benchSalesMenu.map((item, index) => (
                    <li
                      key={index}
                      className={`submenu-item ${isActive(item.path) ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      <span className="submenu-icon">{item.icon}</span>
                      <span className="submenu-text">{item.label}</span>
                      {isActive(item.path) && <span className="active-indicator"></span>}
                    </li>
                  ))}
                </ul>
              )}
            </ul>
          </nav>

          {/* Settings & Logout - Only show if user is logged in */}
          {userRole && (
            <div className="settings-section">
              <ul>
                {!isExternalUser && (
                  <li className={isActive("/recruitment/social-settings") ? "active" : ""} onClick={() => navigate("/recruitment/social-settings")}>
                    <LuSettings size={20} />
                    {isExpanded && <span className="menu-text">Settings</span>}
                    {isActive("/recruitment/social-settings") && <span className="active-indicator"></span>}
                  </li>
                )}
                <li onClick={handleLogout}>
                  <LuLogOut size={20} />
                  {isExpanded && <span className="menu-text">Log Out</span>}
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;







// import React, { useEffect, useState, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import BASE_URL from "../../url";

// import {
//   LuLayoutDashboard,
//   LuBriefcase,
//   LuSettings,
//   LuLogOut,
//   LuChevronLeft,
//   LuChevronRight,
//   LuUserCheck,
//   LuUsers,
//   LuFileText,
//   LuChartBar,
//   LuUserPlus,
//   LuSend,
//   LuTarget,
//   LuBarChart,
//   LuStar,
//   LuClock,
//   LuClipboardList,
//   LuFileStack,
//   LuCircleCheck,
//   LuCalendar
// } from "react-icons/lu";


// import { FaAngleDown, FaAngleUp, FaThumbtack } from "react-icons/fa";
// import "../styles/Sidebar.css";
// import prophecyLogo2 from "../Assets/images/prophecy-logo2.png";
// import prophecyLogo from "../Assets/images/prophecy-logo.png";

// const Sidebar = () => {
//   const [isPinned, setIsPinned] = useState(localStorage.getItem("sidebarPinned") === "true");
//   const [isHovered, setIsHovered] = useState(false);
//   const [openSubmenu, setOpenSubmenu] = useState(null);
//   const [openBenchSalesSubmenu, setOpenBenchSalesSubmenu] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
//   const sidebarRef = useRef(null);
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Get user role from localStorage
//   const userRole = localStorage.getItem("role");
//   const isExpanded = isPinned || isHovered || isMobile;

//   // Check if user is external user
//   const isExternalUser = userRole === 'External user' || userRole === 'external_user' || userRole === 'external-user';

//   // ✅ CHECK IF USER IS ADMIN FOR H1B ACCESS (ADMIN ONLY)
//   const isAdmin = userRole === 'admin' || userRole === 'super_admin';

//   // ✅ REDIRECT EXTERNAL USERS TO CANDIDATE FORM
//   useEffect(() => {
//     if (isExternalUser && location.pathname !== "/ats") {
//       navigate("/ats?candidateForm=true", { replace: true });
//     }
//   }, [isExternalUser, navigate, location.pathname]);

//   // Handle screen resize
//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth <= 768;
//       setIsMobile(mobile);
//       if (mobile && isPinned) {
//         setIsSidebarVisible(false);
//       } else {
//         setIsSidebarVisible(true);
//       }
//     };

//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [isPinned]);

//   // Save pinned state to localStorage
//   useEffect(() => {
//     localStorage.setItem("sidebarPinned", isPinned);
//   }, [isPinned]);

//   // Handle clicks outside sidebar to close it on mobile
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (isMobile && !isPinned && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//         setIsSidebarVisible(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isMobile, isPinned]);

//   // Close sidebar when route changes on mobile
//   useEffect(() => {
//     if (isMobile && !isPinned) {
//       setIsSidebarVisible(false);
//     }
//   }, [location, isMobile, isPinned]);

//   // UPDATED LOGOUT FUNCTION WITH TRACKING
//   const handleLogout = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const sessionId = localStorage.getItem('currentSessionId');
      
//       console.log('🚪 Manual logout initiated');
      
//       // Track logout if we have a session ID
//       if (sessionId && token) {
//         try {
//           const response = await fetch(`${BASE_URL}/api/auth/track-logout`, {
//             method: "POST",
//             headers: { 
//               "Content-Type": "application/json",
//               "Authorization": `Bearer ${token}`
//             },
//             credentials: 'include',
//             body: JSON.stringify({ trackingId: parseInt(sessionId) })
//           });
          
//           if (response.ok) {
//             console.log('✅ Logout tracked successfully');
//           } else {
//             console.log('⚠️ Logout tracking failed, but continuing...');
//           }
//         } catch (trackError) {
//           console.error("Error tracking logout:", trackError);
//         }
//       }
      
//       // Clear all stored data
//       localStorage.removeItem('token');
//       localStorage.removeItem('username');
//       localStorage.removeItem('role');
//       localStorage.removeItem('id');
//       localStorage.removeItem('user');
//       localStorage.removeItem('firstName');
//       localStorage.removeItem('currentSessionId');
//       localStorage.removeItem('sidebarPinned');
      
//       console.log('🧹 Local storage cleared');
      
//       // Navigate to login
//       navigate('/');
      
//     } catch (error) {
//       console.error("Error during logout:", error);
//       localStorage.clear();
//       navigate('/');
//     }
//   };

//   const toggleSidebar = () => {
//     setIsSidebarVisible(!isSidebarVisible);
//   };

//   const toggleSubmenu = (menu) => {
//     setOpenSubmenu(openSubmenu === menu ? null : menu);
//   };

//   const toggleBenchSalesSubmenu = () => {
//     setOpenBenchSalesSubmenu(!openBenchSalesSubmenu);
//   };

//   const isActive = (path) => {
//     if (path.includes('?')) {
//       // Special handling for resume-dashboard to ignore other query params like 't' or 'refresh'
//       if (path.startsWith('/resume-dashboard')) {
//         const currentParams = new URLSearchParams(location.search);
//         const targetParams = new URLSearchParams(path.split('?')[1]);
//         return location.pathname === '/resume-dashboard' && currentParams.get('view') === targetParams.get('view');
//       }
//       return (location.pathname + location.search) === path;
//     }
//     return location.pathname === path;
//   };

//   // Check if current path is recruitment related
//   const isRecruitmentActive = () => {
//     return location.pathname === "/recruitment-dashboard" || 
//            location.pathname === "/recruiter-view" || 
//            location.pathname === "/teamlead-dashboard" ||
//            location.pathname === "/admin-dashboard" ||
//            location.pathname === "/vendor-management";
//   };

//   // Check if current path is ATS related
//   const isATSActive = () => {
//     return location.pathname === "/ats";
//   };

//   // ✅ Check if current path is H1B related (Dashboard or Details only)
//   const isH1BActive = () => {
//     return location.pathname === "/h1b/dashboard" || location.pathname.startsWith("/h1b/submissions/");
//   };

//   // Check if current path is Jobs related
//   const isJobsActive = () => {
//     return location.pathname === "/careers" ;
//   };

//   // Direct navigation to recruitment dashboard based on user role
//   const handleRecruitmentClick = () => {
//     if (userRole === "manager" || userRole === "admin" || userRole === "super_admin") {
//       navigate("/recruitment-dashboard");
//     } else if (userRole === "user" || userRole === "recruiter") {
//       navigate("/recruiter-view");
//     } else if (userRole === "teamlead" || userRole === "team_lead") {
//       navigate("/teamlead-dashboard");
//     } else {
//       navigate("/recruitment-dashboard");
//     }
//   };

//   // Direct navigation to bench sales dashboard based on user role
//   const handleBenchSalesClick = () => {
//     if (userRole === "manager" || userRole === "admin" || userRole === "super_admin") {
//       navigate("/bench-sales-dashboard");
//     } else if (userRole === "user") {
//       navigate("/bench-sales-recruiter");
//     } else if (userRole === "teamlead") {
//       navigate("/bench-sales-dashboard");
//     }
//   };

//   const benchSalesMenu = [
//     { path: "/bench-candidates", label: "Candidate Management", icon: <LuUsers size={16} /> },
//     { path: "/bench-requirements", label: "Requirements", icon: <LuFileText size={16} /> },
//     { path: "/bench-submissions", label: "Submissions", icon: <LuSend size={16} /> },
//     { path: "/bench-vendors", label: "Vendors", icon: <LuUsers size={16} /> },
//     { path: "/bench-marketing", label: "Marketing", icon: <LuTarget size={16} /> },
//     { path: "/bench-hotlist", label: "Hotlist", icon: <LuStar size={16} /> },
//   ];

//   // ✅ H1B SUBMENU - ADMIN ONLY (Dashboard and View Details)
//   const h1bMenu = [
//     { path: "/h1b/dashboard", label: "H1B Dashboard", icon: <LuLayoutDashboard size={16} /> },
//     // { path: "/h1b/submissions", label: "View Details", icon: <LuFileStack size={16} /> },
//   ];

//   // Check if ATS should be shown
//   const shouldShowATS = userRole === "admin" || userRole === "super_admin" || userRole === "manager" || userRole === "User" || userRole === "teamlead" || userRole === "team_lead";

//   // Check if Bench Sales should be shown
//   const shouldShowBenchSales = userRole && userRole !== "employee" && !isExternalUser;

//   // ✅ CHECK IF H1B SHOULD BE SHOWN - ADMIN ONLY
//   const shouldShowH1B = isAdmin;

//   // Check if Jobs should be shown - ONLY for external users
//   const shouldShowJobs = isExternalUser;

//   const shouldShowAccounts = userRole === "admin" || userRole === "super_admin" || userRole === "account_manager" || userRole === "account-manager";
//   const shouldShowTimesheetApprovals = userRole === "admin" || userRole === "super_admin" || userRole === "manager" || userRole === "teamlead" || userRole === "team_lead" || localStorage.getItem('isSupervisor') === 'true';



//   // Menu items based on user role
//   const getMenuItems = () => {
//     // If user is external user, show only Candidate Form (no menu needed, will redirect)
//     if (isExternalUser) {
//       return [
//         { 
//           path: "/ats?candidateForm=true", 
//           label: "Application Form", 
//           icon: <LuBriefcase size={20} />,
//           show: true
//         }
//       ];
//     }

//     // If user is employee, show only Dashboard, Accounts, and Timesheets
//     if (userRole === "employee") {
//       return [
//         { 
//           path: "/home", 
//           label: "Dashboard", 
//           icon: <LuLayoutDashboard size={20} />,
//           show: true
//         },
//         {
//           label: "Accounts",
//           icon: <LuFileText size={20} />,
//           path: "/accounts",
//           show: true
//         },
//         {
//           label: "Timesheets",
//           icon: <LuClock size={20} />,
//           path: "/timesheets",
//           show: true
//         },
//         {
//           label: "Leave Manage",
//           icon: <LuCalendar size={20} />,
//           path: "/leave-manage",
//           show: true
//         },
//         {
//           label: "Timesheet Approvals",
//           icon: <LuCircleCheck size={20} />,
//           path: "/timesheet-approvals",
//           show: localStorage.getItem('isSupervisor') === 'true'
//         }

//       ];
//     }


//     // For all other roles, show the full menu
//     const baseItems = [
//       { 
//         path: "/home", 
//         label: "Dashboard", 
//         icon: <LuLayoutDashboard size={20} />,
//         show: true
//       },
//       {
//         path: "/timesheets?mode=internal",
//         label: "My Timesheets",
//         icon: <LuClock size={20} />,
//         show: userRole === "manager" || userRole === "teamlead" || userRole === "team_lead" || userRole === "user" || userRole === "admin"
//       },
//       {
//         path: "/leave-manage",
//         label: "Leave Manage",
//         icon: <LuCalendar size={20} />,
//         show: true
//       }
//     ];

//     // Recruitment submenu
//     const recruitmentSubmenu = [
//       { 
//         path: "/recruitment-dashboard", 
//         label: "Recruitment Dashboard", 
//         icon: <LuLayoutDashboard size={16} />,
//         onClick: handleRecruitmentClick,
//         show: true
//       },
//       { 
//         path: "/vendor-management", 
//         label: "Vendor Management", 
//         icon: <LuUsers size={16} />,
//         onClick: () => navigate("/vendor-management"),
//         show: true
//       }
//     ];

//     const recruitmentItem = {
//       label: "Recruitment",
//       icon: <LuBriefcase size={20} />,
//       submenu: recruitmentSubmenu,
//       show: true
//     };

//     const candidateManagementSubmenu = [
//       { 
//         path: "/resume-dashboard?view=sourcing", 
//         label: "Sourcing", 
//         icon: <LuUserCheck size={16} />,
//         onClick: () => navigate(`/resume-dashboard?view=sourcing&t=${Date.now()}`),
//         show: true
//       },
//       { 
//         path: "/resume-dashboard?view=bench", 
//         label: "Bench candidates", 
//         icon: <LuUsers size={16} />,
//         onClick: () => navigate(`/resume-dashboard?view=bench&t=${Date.now()}`),
//         show: true
//       },
//       { 
//         path: "/resume-dashboard?view=review", 
//         label: "Need To review", 
//         icon: <LuFileStack size={16} />,
//         onClick: () => navigate(`/resume-dashboard?view=review&t=${Date.now()}`),
//         show: true
//       }
//     ];

//     const resumeSubmissionItem = {
//       label: "Candidate Manage",
//       icon: <LuUsers size={20} />,
//       submenu: candidateManagementSubmenu,
//       show: true
//     };

//     const submissionsItem = {
//       path: "/submissions", 
//       label: "Job Submissions", 
//       icon: <LuSend size={20} />,
//       show: true
//     };

//     const atsItem = {
//       path: "/ats",
//       label: "ATS",
//       icon: <LuClipboardList size={20} />,
//       show: shouldShowATS
//     };

//     // ✅ H1B ITEM - ADMIN ONLY (with submenu)
//     const h1bItem = {
//       label: "H1B Management",
//       icon: <LuFileStack size={20} />,
//       submenu: h1bMenu,
//       show: shouldShowH1B
//     };

//     const msaItem = {
//       path: "/msa",
//       label: "MSA",
//       icon: <LuFileText size={20} />,
//       show: userRole === "admin" || userRole === "super_admin" || userRole === "account_manager" || userRole === "account-manager"
//     };

//     const adminItems = [
//       {
//         label: "User Management",
//         icon: <LuUsers size={20} />,
//         path: "/user-management",
//         show: userRole === "admin" || userRole === "super_admin"
//       },
//       {
//         label: "Accounting",
//         icon: <LuFileText size={20} />,
//         path: "/companies",
//         show: shouldShowAccounts
//       },
//       {
//         label: "Onboarding",
//         icon: <LuUserPlus size={20} />,
//         path: "/onboarding",
//         show: userRole === "admin" || userRole === "super_admin"
//       },
//       {
//         label: "Timesheet Approvals",
//         icon: <LuClock size={20} />,
//         path: "/timesheet-approvals",
//         show: shouldShowTimesheetApprovals
//       }
//     ];

//     return [
//       ...baseItems,
//       recruitmentItem,
//       resumeSubmissionItem,
//       submissionsItem,
//       atsItem,
//       h1bItem,  // ✅ ADDED H1B ITEM WITH SUBMENU
//       msaItem,  // ✅ ADDED MSA ITEM
//       ...adminItems.filter(item => item.show)
//     ];
//   };

//   const menuItems = getMenuItems();

//   return (
//     <>
//       {/* Mobile Toggle Button - Outside Sidebar */}
//       {isMobile && (
//         <button
//           className={`sidebar-toggle ${isSidebarVisible ? 'open' : ''}`}
//           onClick={toggleSidebar}
//           aria-label="Toggle sidebar"
//         >
//           {isSidebarVisible ? <LuChevronLeft /> : <LuChevronRight />}
//         </button>
//       )}

//       <div className={`sidebar-overlay ${isMobile && isSidebarVisible ? 'visible' : ''}`} onClick={() => setIsSidebarVisible(false)}></div>

//       <div className="Mainsidebar-container">
//         <div
//           ref={sidebarRef}
//           className={`sidebar ${isExpanded ? "expanded" : "collapsed"} ${isSidebarVisible ? "visible" : "hidden"}`}
//           onMouseEnter={() => !isMobile && !isPinned && setIsHovered(true)}
//           onMouseLeave={() => !isMobile && !isPinned && setIsHovered(false)}
//         >
//           {/* Sidebar Header */}
//           <div className="sidebar-header">
//             <div className="logo-container">
//               <img src={prophecyLogo2} alt="Logo" className="initial-logo" />
//               {isExpanded && <img src={prophecyLogo} alt="Logo" className="logo" />}
//             </div>

//             {/* Pin Button - Only show on desktop */}
//             {isExpanded && !isMobile && (
//               <button className="pin-button" onClick={() => setIsPinned(!isPinned)} aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}>
//                 <FaThumbtack className={`pin-icon ${isPinned ? "pinned" : ""}`} />
//               </button>
//             )}

//             {/* Close Button - Only show on mobile */}
//             {isExpanded && isMobile && (
//               <button className="close-button" onClick={() => setIsSidebarVisible(false)} aria-label="Close sidebar">
//                 <LuChevronLeft />
//               </button>
//             )}
//           </div>

//           {/* Sidebar Menu */}
//           <nav>
//             <ul className="menu">
//               {menuItems.map((item, index) => {
//                 if (!item.show) return null;

//                 if (item.submenu) {
//                   return (
//                     <React.Fragment key={index}>
//                       <li
//                         className={`menu-item ${openSubmenu === item.label ? "open" : ""} ${item.submenu.some(subItem => isActive(subItem.path)) ? "active" : ""}`}
//                         onClick={() => toggleSubmenu(item.label)}
//                       >
//                         {item.icon}
//                         {isExpanded && <span className="menu-text">{item.label}</span>}
//                         {isExpanded && item.submenu && (
//                           <span className="submenu-icon">
//                             {openSubmenu === item.label ? <FaAngleUp /> : <FaAngleDown />}
//                           </span>
//                         )}
//                         {item.submenu.some(subItem => isActive(subItem.path)) && <span className="active-indicator"></span>}
//                       </li>

//                       {isExpanded && openSubmenu === item.label && (
//                         <ul className="submenu">
//                           {item.submenu.filter(subItem => subItem.show !== false).map((subItem, subIndex) => (
//                             <li
//                               key={subIndex}
//                               className={`submenu-item ${isActive(subItem.path) ? "active" : ""}`}
//                               onClick={subItem.onClick ? subItem.onClick : () => navigate(subItem.path)}
//                             >
//                               <span className="submenu-icon">{subItem.icon}</span>
//                               <span className="submenu-text">{subItem.label}</span>
//                               {isActive(subItem.path) && <span className="active-indicator"></span>}
//                             </li>
//                           ))}
//                         </ul>
//                       )}
//                     </React.Fragment>
//                   );
//                 } else {
//                   return (
//                     <li
//                       key={index}
//                       className={`menu-item ${item.onClick && isRecruitmentActive() ? "active" : isActive(item.path) ? "active" : ""}`}
//                       onClick={item.onClick ? item.onClick : () => navigate(item.path)}
//                     >
//                       {item.icon}
//                       {isExpanded && <span className="menu-text">{item.label}</span>}
//                       {(item.onClick && isRecruitmentActive()) || (item.path === "/ats" && isATSActive()) || (item.path === "/jobs" && isJobsActive()) || isActive(item.path) ? <span className="active-indicator"></span> : null}
//                     </li>
//                   );
//                 }
//               })}

//               {/* Bench Sales Submenu - Only show if user is not employee and not external user */}
//               {shouldShowBenchSales && (
//                 <li
//                   className={`menu-item ${openBenchSalesSubmenu ? "open" : ""} ${location.pathname.includes("/bench-") || location.pathname === "/bench-sales" ? "active" : ""}`}
//                   onClick={toggleBenchSalesSubmenu}
//                 >
//                   <LuChartBar size={20} />
//                   {isExpanded && <span className="menu-text">Bench Sales</span>}
//                   {isExpanded && (
//                     <span className="submenu-icon">
//                       {openBenchSalesSubmenu ? <FaAngleUp /> : <FaAngleDown />}
//                     </span>
//                   )}
//                   {(location.pathname.includes("/bench-") || location.pathname === "/bench-sales") && <span className="active-indicator"></span>}
//                 </li>
//               )}
              
//               {/* Bench Sales Submenu Items - Only show if user is not employee and not external user */}
//               {shouldShowBenchSales && isExpanded && openBenchSalesSubmenu && (
//                 <ul className="submenu">
//                   <li
//                     className={`submenu-item ${isActive("/bench-sales-dashboard") || isActive("/bench-sales-recruiter") ? "active" : ""}`}
//                     onClick={handleBenchSalesClick}
//                   >
//                     <span className="submenu-icon"><LuLayoutDashboard size={16} /></span>
//                     <span className="submenu-text">Bench Sales Dashboard</span>
//                     {(isActive("/bench-sales-dashboard") || isActive("/bench-sales-recruiter")) && <span className="active-indicator"></span>}
//                   </li>
//                   {benchSalesMenu.map((item, index) => (
//                     <li
//                       key={index}
//                       className={`submenu-item ${isActive(item.path) ? "active" : ""}`}
//                       onClick={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         navigate(item.path);
//                       }}
//                     >
//                       <span className="submenu-icon">{item.icon}</span>
//                       <span className="submenu-text">{item.label}</span>
//                       {isActive(item.path) && <span className="active-indicator"></span>}
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </ul>
//           </nav>

//           {/* Settings & Logout - Only show if user is logged in */}
//           {userRole && (
//             <div className="settings-section">
//               <ul>
//                 {!isExternalUser && (
//                   <li className={isActive("/settings") ? "active" : ""} onClick={() => navigate("/settings")}>
//                     <LuSettings size={20} />
//                     {isExpanded && <span className="menu-text">Settings</span>}
//                     {isActive("/settings") && <span className="active-indicator"></span>}
//                   </li>
//                 )}
//                 <li onClick={handleLogout}>
//                   <LuLogOut size={20} />
//                   {isExpanded && <span className="menu-text">Log Out</span>}
//                 </li>
//               </ul>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;



// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import BASE_URL from "../../url";

// import {
//   LuLayoutDashboard,
//   LuBriefcase,
//   LuSettings,
//   LuLogOut,
//   LuChevronLeft,
//   LuChevronRight,
//   LuUserCheck,
//   LuUsers,
//   LuFileText,
//   LuChartBar,
//   LuUserPlus,
//   LuSend,
//   LuTarget,
//   LuStar,
//   LuClock,
//   LuClipboardList,
//   LuReceipt,
//   LuBuilding,
//   LuFilePen,
// } from "react-icons/lu";
// import { FaAngleDown, FaAngleUp, FaThumbtack, FaLock } from "react-icons/fa";
// import "../styles/Sidebar.css";
// import prophecyLogo2 from "../Assets/images/prophecy-logo2.png";
// import prophecyLogo from "../Assets/images/prophecy-logo.png";

// const Sidebar = () => {
//   const [isPinned, setIsPinned] = useState(localStorage.getItem("sidebarPinned") === "true");
//   const [isHovered, setIsHovered] = useState(false);
//   const [openSubmenu, setOpenSubmenu] = useState(null);
//   const [openBenchSalesSubmenu, setOpenBenchSalesSubmenu] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
//   const sidebarRef = useRef(null);
//   const navigate = useNavigate();
//   const location = useLocation();

//   const userRole = localStorage.getItem("role");
//   const isExpanded = isPinned || isHovered || isMobile;

//   // Check if user is external user
//   const isExternalUser = userRole === 'External user' || userRole === 'external_user' || userRole === 'external-user';
  
//   // Check if user is candidate
//   const isCandidate = userRole === 'candidate';
  
//   // Check if user is employer
//   const isEmployer = userRole === 'employer';

//   // Redirect external users to candidate form
//   useEffect(() => {
//     if (isExternalUser && location.pathname !== "/ats") {
//       navigate("/ats?candidateForm=true", { replace: true });
//     }
//   }, [isExternalUser, navigate, location.pathname]);

//   // ✅ Redirect employers away from /home to their dashboard
//   useEffect(() => {
//     if (isEmployer && location.pathname === "/home") {
//       navigate("/employer-dashboard", { replace: true });
//     }
//   }, [isEmployer, navigate, location.pathname]);

//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth <= 768;
//       setIsMobile(mobile);
//       if (mobile && isPinned) {
//         setIsSidebarVisible(false);
//       } else {
//         setIsSidebarVisible(true);
//       }
//     };

//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [isPinned]);

//   useEffect(() => {
//     localStorage.setItem("sidebarPinned", isPinned);
//   }, [isPinned]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (isMobile && !isPinned && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//         setIsSidebarVisible(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isMobile, isPinned]);

//   useEffect(() => {
//     if (isMobile && !isPinned) {
//       setIsSidebarVisible(false);
//     }
//   }, [location, isMobile, isPinned]);

//   const handleLogout = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const sessionId = localStorage.getItem('currentSessionId');
      
//       if (sessionId && token) {
//         try {
//           await fetch(`${BASE_URL}/api/auth/track-logout`, {
//             method: "POST",
//             headers: { 
//               "Content-Type": "application/json",
//               "Authorization": `Bearer ${token}`
//             },
//             credentials: 'include',
//             body: JSON.stringify({ trackingId: parseInt(sessionId) })
//           });
//         } catch (trackError) {
//           console.error("Error tracking logout:", trackError);
//         }
//       }
      
//       localStorage.clear();
//       navigate('/');
      
//     } catch (error) {
//       console.error("Error during logout:", error);
//       localStorage.clear();
//       navigate('/');
//     }
//   };

//   const toggleSidebar = () => {
//     setIsSidebarVisible(!isSidebarVisible);
//   };

//   const toggleSubmenu = (menu) => {
//     setOpenSubmenu(openSubmenu === menu ? null : menu);
//   };

//   const toggleBenchSalesSubmenu = () => {
//     setOpenBenchSalesSubmenu(!openBenchSalesSubmenu);
//   };

//   const isActive = (path) => {
//     return location.pathname === path;
//   };

//   // Check if current path is recruitment related
//   const isRecruitmentActive = () => {
//     return location.pathname === "/recruitment-dashboard" || 
//            location.pathname === "/recruiter-view" || 
//            location.pathname === "/teamlead-dashboard" ||
//            location.pathname === "/admin-dashboard" ||
//            location.pathname === "/vendor-management";
//   };

//   // Check if current path is ATS related
//   const isATSActive = () => {
//     return location.pathname === "/ats";
//   };

//   // Check if current path is Jobs related
//   const isJobsActive = () => {
//     return location.pathname === "/careers";
//   };

//   // Check if current path is candidate onboarding related
//   const isCandidateOnboardingActive = () => {
//     return location.pathname === "/candidate-onboarding";
//   };

//   // Check if current path is employer related
//   const isEmployerActive = () => {
//     return location.pathname === "/employer-dashboard" || location.pathname === "/employer-form";
//   };

//   const handleRecruitmentClick = () => {
//     if (userRole === "manager" || userRole === "admin") {
//       navigate("/recruitment-dashboard");
//     } else if (userRole === "user" || userRole === "recruiter") {
//       navigate("/recruiter-view");
//     } else if (userRole === "teamlead" || userRole === "team_lead") {
//       navigate("/teamlead-dashboard");
//     } else {
//       navigate("/recruitment-dashboard");
//     }
//   };

//   const handleBenchSalesClick = () => {
//     if (userRole === "manager" || userRole === "admin") {
//       navigate("/bench-sales-dashboard");
//     } else if (userRole === "user") {
//       navigate("/bench-sales-recruiter");
//     } else if (userRole === "teamlead") {
//       navigate("/bench-sales-dashboard");
//     }
//   };

//   const benchSalesMenu = [
//     { path: "/bench-candidates", label: "Candidate Management", icon: <LuUsers size={16} /> },
//     { path: "/bench-requirements", label: "Requirements", icon: <LuFileText size={16} /> },
//     { path: "/bench-submissions", label: "Submissions", icon: <LuSend size={16} /> },
//     { path: "/bench-vendors", label: "Vendors", icon: <LuUsers size={16} /> },
//     { path: "/bench-marketing", label: "Marketing", icon: <LuTarget size={16} /> },
//     { path: "/bench-hotlist", label: "Hotlist", icon: <LuStar size={16} /> },
//   ];

//   const recruitmentSubmenu = [
//     { 
//       path: "/recruitment-dashboard", 
//       label: "Recruitment Dashboard", 
//       icon: <LuLayoutDashboard size={16} />,
//       onClick: handleRecruitmentClick
//     },
//     { 
//       path: "/vendor-management", 
//       label: "Vendor Management", 
//       icon: <LuUsers size={16} />,
//       onClick: () => navigate("/vendor-management")
//     }
//   ];

//   // Check if ATS should be shown
//   const shouldShowATS = userRole === "admin" || userRole === "manager" || userRole === "user" || userRole === "teamlead" || userRole === "team_lead";

//   // Check if Bench Sales should be shown
//   const shouldShowBenchSales = userRole && userRole !== "employee" && !isExternalUser && userRole !== "employer" && userRole !== "candidate";

//   // Check if Jobs should be shown - ONLY for external users
//   const shouldShowJobs = isExternalUser;

//   const shouldShowAccounts = userRole === "admin" || userRole === "account_manager" || userRole === "account-manager";

//   const getMenuItems = () => {
//     // If user is external user, show only Candidate Form
//     if (isExternalUser) {
//       return [
//         { 
//           path: "/ats?candidateForm=true", 
//           label: "Application Form", 
//           icon: <LuBriefcase size={20} />,
//           show: true
//         }
//       ];
//     }

//     // ✅ CANDIDATE VIEW
//     if (userRole === "candidate") {
//       return [
//         { 
//           path: "/candidate-onboarding", 
//           label: "Dashboard", 
//           icon: <LuLayoutDashboard size={20} />,
//           show: true
//         },
//         { 
//           path: "/candidate-onboarding?tab=onboarding", 
//           label: "Onboarding Form", 
//           icon: <LuFilePen size={20} />,
//           show: true,
//           onClick: () => {
//             navigate("/candidate-onboarding", { state: { activeTab: 'onboarding' } });
//           }
//         }
//       ];
//     }

//     // ✅ EMPLOYER VIEW - Dashboard and Company Information
//     if (userRole === "employer") {
//       return [
//         { 
//           path: "/employer-dashboard", 
//           label: "Dashboard", 
//           icon: <LuLayoutDashboard size={20} />,
//           show: true
//         },
//         { 
//           path: "/employer-dashboard", 
//           label: "Company Information", 
//           icon: <LuBuilding size={20} />,
//           show: true,
//           onClick: () => navigate("/employer-dashboard", { state: { employerTab: 'company-info' } })
//         }
//       ];
//     }

//     // Employee view
//     if (userRole === "employee") {
//       const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
      
//       return [
//         { 
//           path: "/dashboard", 
//           label: "Dashboard", 
//           icon: <LuLayoutDashboard size={20} />,
//           show: true,
//           disabled: false
//         },
//         {
//           label: "Accounts",
//           icon: <LuFileText size={20} />,
//           path: onboardingCompleted ? "/accounts" : "#",
//           show: true,
//           disabled: !onboardingCompleted,
//           locked: !onboardingCompleted,
//           onClick: !onboardingCompleted ? (e) => {
//             e.preventDefault();
//             alert("Please complete your onboarding first to access Accounts.");
//           } : undefined
//         },
//         {
//           label: "Timesheets",
//           icon: <LuClock size={20} />,
//           path: onboardingCompleted ? "/timesheets" : "#",
//           show: true,
//           disabled: !onboardingCompleted,
//           locked: !onboardingCompleted,
//           onClick: !onboardingCompleted ? (e) => {
//             e.preventDefault();
//             alert("Please complete your onboarding first to access Timesheets.");
//           } : undefined
//         },
//         {
//           label: "Invoice",
//           icon: <LuReceipt size={20} />,
//           path: onboardingCompleted ? "/invoices" : "#",
//           show: true,
//           disabled: !onboardingCompleted,
//           locked: !onboardingCompleted,
//           onClick: !onboardingCompleted ? (e) => {
//             e.preventDefault();
//             alert("Please complete your onboarding first to access Invoice.");
//           } : undefined
//         }
//       ];
//     }

//     // For all other roles (admin, manager, hr, etc.) - show full menu
//     const baseItems = [
//       { 
//         path: "/home", 
//         label: "Dashboard", 
//         icon: <LuLayoutDashboard size={20} />,
//         show: true
//       }
//     ];

//     // EMPLOYER MANAGEMENT - for admin/manager/hr to view all employers
//     const employerManagementItem = {
//       path: "/employer-directory",
//       label: "Employer Management",
//       icon: <LuBuilding size={20} />,
//       show: userRole === "admin" || userRole === "manager" || userRole === "hr"
//     };

//     // ONSITE ONBOARDING MENU ITEM
//     const onsiteOnboardingItem = {
//       path: "/onboarding-company",
//       label: "Onboarding",
//       icon: <LuBuilding size={20} />,
//       show: userRole === "admin" || userRole === "manager" || userRole === "hr"
//     };

//     const recruitmentItem = {
//       label: "Recruitment",
//       icon: <LuBriefcase size={20} />,
//       submenu: recruitmentSubmenu,
//       show: userRole === "admin" || userRole === "manager" || userRole === "hr" || userRole === "teamlead" || userRole === "team_lead"
//     };

//     const resumeSubmissionItem = {
//       path: "/resume-dashboard", 
//       label: "Resume Submission", 
//       icon: <LuUserCheck size={20} />,
//       show: userRole === "admin" || userRole === "manager" || userRole === "hr" || userRole === "teamlead" || userRole === "team_lead"
//     };
    
//     const resourceManagementItem = {
//       path: "/resource-management",
//       label: "Resource Management",
//       icon: <LuUsers size={20} />,
//       show: userRole === "admin" || userRole === "manager" || userRole === "teamlead" || userRole === "team_lead"
//     };
    
//     const atsItem = {
//       path: "/ats",
//       label: "ATS",
//       icon: <LuClipboardList size={20} />,
//       show: shouldShowATS
//     };
    
//     const invoiceItem = {
//       label: "Invoice",
//       icon: <LuReceipt size={20} />,
//       path: "/invoices",
//       show: userRole === "admin" || userRole === "manager" || userRole === "account_manager" || userRole === "teamlead" || userRole === "team_lead"
//     };

//     const adminItems = [
//       {
//         label: "Admin",
//         icon: <LuUsers size={20} />,
//         submenu: [
//           {
//             label: "User Management",
//             icon: <LuUsers size={16} />,
//             path: "/user-management",
//             show: userRole === "admin"
//           },
//           // {
//           //   label: "Onboarding Steps",
//           //   icon: <LuUserPlus size={16} />,
//           //   path: "/onboarding-steps",
//           //   show: userRole === "admin"
//           // },
//           // {
//           //   label: "Workflow Display",
//           //   icon: <LuClipboardList size={16} />,
//           //   path: "/workflow-display",
//           //   show: userRole === "admin"
//           // }

//             {
//         label: "MSA",  // ADD THIS NEW MENU ITEM
//         icon: <LuFileText size={16} />,
//         path: "/msa",
//         show: userRole === "admin"
//       }
//         ],
//         show: userRole === "admin"
//       },
//       {
//         label: "Accounting",
//         icon: <LuFileText size={20} />,
//         path: "/companies",
//         show: userRole === "admin" || userRole === "manager" || userRole === "account_manager"
//       }
//     ];

//     return [
//       ...baseItems,
//       recruitmentItem,
//       invoiceItem,
//       resumeSubmissionItem,
//       atsItem,
//       employerManagementItem,
//       onsiteOnboardingItem,
//       resourceManagementItem,
//       ...adminItems.filter(item => item.show)
//     ];
//   };

//   const menuItems = getMenuItems();

//   return (
//     <>
//       {isMobile && (
//         <button
//           className={`sidebar-toggle ${isSidebarVisible ? 'open' : ''}`}
//           onClick={toggleSidebar}
//           aria-label="Toggle sidebar"
//         >
//           {isSidebarVisible ? <LuChevronLeft /> : <LuChevronRight />}
//         </button>
//       )}

//       <div className={`sidebar-overlay ${isMobile && isSidebarVisible ? 'visible' : ''}`} onClick={() => setIsSidebarVisible(false)}></div>

//       <div className="Mainsidebar-container">
//         <div
//           ref={sidebarRef}
//           className={`sidebar ${isExpanded ? "expanded" : "collapsed"} ${isSidebarVisible ? "visible" : "hidden"}`}
//           onMouseEnter={() => !isMobile && !isPinned && setIsHovered(true)}
//           onMouseLeave={() => !isMobile && !isPinned && setIsHovered(false)}
//         >
//           <div className="sidebar-header">
//             <div className="logo-container">
//               <img src={prophecyLogo2} alt="Logo" className="initial-logo" />
//               {isExpanded && <img src={prophecyLogo} alt="Logo" className="logo" />}
//             </div>

//             {isExpanded && !isMobile && (
//               <button className="pin-button" onClick={() => setIsPinned(!isPinned)} aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}>
//                 <FaThumbtack className={`pin-icon ${isPinned ? "pinned" : ""}`} />
//               </button>
//             )}

//             {isExpanded && isMobile && (
//               <button className="close-button" onClick={() => setIsSidebarVisible(false)} aria-label="Close sidebar">
//                 <LuChevronLeft />
//               </button>
//             )}
//           </div>

//           <nav>
//             <ul className="menu">
//               {menuItems.map((item, index) => {
//                 if (!item.show) return null;
                
//                 if (item.submenu) {
//                   return (
//                     <React.Fragment key={index}>
//                       <li
//                         className={`menu-item ${openSubmenu === item.label ? "open" : ""} ${item.submenu.some(subItem => isActive(subItem.path)) ? "active" : ""}`}
//                         onClick={() => toggleSubmenu(item.label)}
//                       >
//                         {item.icon}
//                         {isExpanded && <span className="menu-text">{item.label}</span>}
//                         {isExpanded && item.submenu && (
//                           <span className="submenu-icon">
//                             {openSubmenu === item.label ? <FaAngleUp /> : <FaAngleDown />}
//                           </span>
//                         )}
//                         {item.submenu.some(subItem => isActive(subItem.path)) && <span className="active-indicator"></span>}
//                       </li>

//                       {isExpanded && openSubmenu === item.label && (
//                         <ul className="submenu">
//                           {item.submenu.filter(subItem => subItem.show !== false).map((subItem, subIndex) => (
//                             <li
//                               key={subIndex}
//                               className={`submenu-item ${isActive(subItem.path) ? "active" : ""}`}
//                               onClick={subItem.onClick ? subItem.onClick : () => navigate(subItem.path)}
//                             >
//                               <span className="submenu-icon">{subItem.icon}</span>
//                               <span className="submenu-text">{subItem.label}</span>
//                               {isActive(subItem.path) && <span className="active-indicator"></span>}
//                             </li>
//                           ))}
//                         </ul>
//                       )}
//                     </React.Fragment>
//                   );
//                 } else {
//                   // Special handling for candidate menu items
//                   if (userRole === "candidate") {
//                     return (
//                       <li
//                         key={index}
//                         className={`menu-item ${(item.path === "/candidate-onboarding" && location.pathname === "/candidate-onboarding") ? "active" : ""}`}
//                         onClick={() => {
//                           if (item.path === "/candidate-onboarding?tab=onboarding") {
//                             navigate("/candidate-onboarding", { state: { activeTab: 'onboarding' } });
//                           } else {
//                             navigate("/candidate-onboarding");
//                           }
//                         }}
//                       >
//                         {item.icon}
//                         {isExpanded && <span className="menu-text">{item.label}</span>}
//                         {(item.path === "/candidate-onboarding" && location.pathname === "/candidate-onboarding") && <span className="active-indicator"></span>}
//                       </li>
//                     );
//                   } 
//                   // Special handling for employer menu items
//                   else if (userRole === "employer") {
//                     return (
//                       <li
//                         key={index}
//                         className={`menu-item ${(item.path === "/employer-dashboard" && location.pathname === "/employer-dashboard") || 
//                                               (item.path === "/employer-form" && location.pathname === "/employer-form") ? "active" : ""}`}
//                         onClick={() => {
//                           navigate(item.path);
//                         }}
//                       >
//                         {item.icon}
//                         {isExpanded && <span className="menu-text">{item.label}</span>}
//                         {((item.path === "/employer-dashboard" && location.pathname === "/employer-dashboard") || 
//                           (item.path === "/employer-form" && location.pathname === "/employer-form")) && 
//                           <span className="active-indicator"></span>}
//                       </li>
//                     );
//                   } else {
//                     return (
//                       <li
//                         key={index}
//                         className={`menu-item ${item.disabled ? 'disabled' : ''} ${item.onClick && isRecruitmentActive() ? "active" : isActive(item.path) ? "active" : ""}`}
//                         onClick={item.onClick ? item.onClick : item.disabled ? undefined : () => navigate(item.path)}
//                         style={{ cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? 0.6 : 1 }}
//                       >
//                         {item.icon}
//                         {isExpanded && (
//                           <>
//                             <span className="menu-text">{item.label}</span>
//                             {item.locked && <FaLock size={14} style={{ marginLeft: 'auto' }} />}
//                           </>
//                         )}
//                         {(item.onClick && isRecruitmentActive()) || (item.path === "/ats" && isATSActive()) || (item.path === "/careers" && isJobsActive()) || isActive(item.path) ? <span className="active-indicator"></span> : null}
//                       </li>
//                     );
//                   }
//                 }
//               })}

//               {/* Bench Sales Submenu */}
//               {shouldShowBenchSales && (
//                 <li
//                   className={`menu-item ${openBenchSalesSubmenu ? "open" : ""} ${location.pathname.includes("/bench-") || location.pathname === "/bench-sales" ? "active" : ""}`}
//                   onClick={toggleBenchSalesSubmenu}
//                 >
//                   <LuChartBar size={20} />
//                   {isExpanded && <span className="menu-text">Bench Sales</span>}
//                   {isExpanded && (
//                     <span className="submenu-icon">
//                       {openBenchSalesSubmenu ? <FaAngleUp /> : <FaAngleDown />}
//                     </span>
//                   )}
//                   {(location.pathname.includes("/bench-") || location.pathname === "/bench-sales") && <span className="active-indicator"></span>}
//                 </li>
//               )}
              
//               {shouldShowBenchSales && isExpanded && openBenchSalesSubmenu && (
//                 <ul className="submenu">
//                   <li
//                     className={`submenu-item ${isActive("/bench-sales-dashboard") || isActive("/bench-sales-recruiter") ? "active" : ""}`}
//                     onClick={handleBenchSalesClick}
//                   >
//                     <span className="submenu-icon"><LuLayoutDashboard size={16} /></span>
//                     <span className="submenu-text">Bench Sales Dashboard</span>
//                     {(isActive("/bench-sales-dashboard") || isActive("/bench-sales-recruiter")) && <span className="active-indicator"></span>}
//                   </li>
//                   {benchSalesMenu.map((item, index) => (
//                     <li
//                       key={index}
//                       className={`submenu-item ${isActive(item.path) ? "active" : ""}`}
//                       onClick={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         navigate(item.path);
//                       }}
//                     >
//                       <span className="submenu-icon">{item.icon}</span>
//                       <span className="submenu-text">{item.label}</span>
//                       {isActive(item.path) && <span className="active-indicator"></span>}
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </ul>
//           </nav>

//           <div className="settings-section">
//             <ul>
//               {/* Don't show Settings for candidates or employers */}
//               {userRole !== "candidate" && userRole !== "employer" && (
//                 <li className={isActive("/settings") ? "active" : ""} onClick={() => navigate("/settings")}>
//                   <LuSettings size={20} />
//                   {isExpanded && <span className="menu-text">Settings</span>}
//                   {isActive("/settings") && <span className="active-indicator"></span>}
//                 </li>
//               )}
//               <li onClick={handleLogout}>
//                 <LuLogOut size={20} />
//                 {isExpanded && <span className="menu-text">Log Out</span>}
//               </li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;