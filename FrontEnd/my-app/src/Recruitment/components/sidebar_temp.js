// import React, { useState } from "react";
// import { FaAngleDown, FaAngleRight } from "react-icons/fa";
// import "../styles/sidebar_temp.css";

// const Sidebar = ({ setCurrentPage }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [openMenus, setOpenMenus] = useState({
//     general: false,
//     customization: false,
//     usersControl: false,
//     portalSetup: false,
//     careerWebsite: false,
//     jobBoardHub: false,
//   });
//   const toggleMenu = (menu) => {
//     setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
//   };
//   const menuItems = [
//     {
//       title: "General",
//       key: "general",
//       subItems: ["Personal Settings", "Company Details", "Email Settings", "Notification Settings"],
//     },
//     {
//       title: "Users and Control",
//       key: "usersControl",
//       subItems: ["Users", "Security Control"],
//     },
//     {
//       title: "Customization",
//       key: "customization",
//       subItems: ["Modules", "Templates", "Hiring Pipeline", "Customize Home page"],
//     },
//     {
//       title: "Portal Setup",
//       key: "portalSetup",
//       subItems: ["Portal"],
//     },
//     {
//       title: "Career Website",
//       key: "careerWebsite",
//       subItems: ["Career Site", "Webforms"],
//     },
//     {
//       title: "Job Board Hub",
//       key: "jobBoardHub",
//       subItems: ["Job Boards", "Quick Apply"],
//     },
//     {
//       title: "Marketplace",
//       key: "marketplace",
//       subItems: ["Google", "Microsoft", "Zapier"],
//     },
//     {
//       title: "Data Administration",
//       key: "dataAdmin",
//       subItems: ["Data Migration", "Export", "Storage", "Recycle Bin", "Activity Log"],
//     },
//     {
//       title: "Developer Space",
//       key: "developerSpace",
//       subItems: ["APIs"],
//     },
//     {
//       title: "Telephony",
//       key: "telephony",
//       subItems: ["Instant Messaging", "Mobile Apps"],
//     },
//     {
//       title: "Compliance",
//       key: "compliance",
//       subItems: ["GDPR", "Sub Processors"],
//     }
//   ];
//   const handleNavigation = (item) => {
//     if (!setCurrentPage) {
//       console.error("setCurrentPage is not available");
//       return;
//     }
//     const navigationMap = {
//       "Templates": "templates",
//       "Users": "/Users",
//     };
//     if (navigationMap[item]) {
//       setCurrentPage(navigationMap[item]);
//     } else {
//       console.log("Navigation not implemented for:", item);
//     }
//   };
//   /* Return Block */
//   return (
//     <div className="sidebar-container1">
//       <h3
//       className="sidebar-h3"
//       >Setup</h3>
//       <div className="setup-search-bar">
//         <input
//           type="text"
//           placeholder="Search"
//           className="search-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       <div className="menu">
//         {menuItems.map((menu) => (
//           <div key={menu.key} className="menu-section">
//             <div className="menu-title" onClick={() => toggleMenu(menu.key)}>
//               {openMenus[menu.key] ? <FaAngleDown /> : <FaAngleRight />}
//               {menu.title}
//             </div>
//             {openMenus[menu.key] && menu.subItems.length > 0 && (
//               <div className="sub-menu">
//                 {menu.subItems.map((item, index) => (
//                   <div key={index} className="sub-menu-item" onClick={() => handleNavigation(item)}>
//                     {item}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
// export default Sidebar;
