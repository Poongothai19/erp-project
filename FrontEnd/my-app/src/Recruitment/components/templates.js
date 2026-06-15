// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "../styles/templates.css";
// import Sidebar from "./sidebar_temp";
// import NewJobTemplate from "./NewJobTemplate";
// import { FaEllipsisH } from "react-icons/fa";
// import { ChevronDown } from "lucide-react";  //  Correct
// import BASE_URL from "../../url";


// const JobTemplates = ({ jobTemplates, setJobTemplates, onCreateTemplate, onCreateFolder }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [recordsPerPage, setRecordsPerPage] = useState(5);
//   const [currentPaginationPage, setCurrentPaginationPage] = useState(1);
//   const [recordsDropdownOpen, setRecordsDropdownOpen] = useState(false); //  Fix: Add missing state

//   useEffect(() => {
//     const fetchJobTemplates = async () => {
//       try {
//         const token = localStorage.getItem("token"); // Retrieve the token from storage
//         if (!token) {
//           console.error("No authentication token found.");
//           return;
//         }

//         const response = await axios.get(`${BASE_URL}/api/jobtemplate`, {
//           headers: {
//             Authorization: `Bearer ${token}`, // Ensure token is included
//           },
//         });

//         console.log("Fetched job templates:", response.data);
//         setJobTemplates(response.data); // Update the state with fetched data
//       } catch (error) {
//         console.error("Error fetching job templates:", error.response?.data || error.message);
//       }
//     };

//     fetchJobTemplates();
//   }, []);  // Remove `setJobTemplates` from dependency array to prevent unnecessary re-renders



//   // Filter jobs based on search input
//   const filteredJobs = jobTemplates.filter((job) =>
//     job.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) // Optional chaining (?) to prevent errors
//   );

//   const totalPages = Math.ceil(filteredJobs.length / recordsPerPage);

//   useEffect(() => {
//     if (currentPaginationPage > totalPages) {
//       setCurrentPaginationPage(totalPages > 0 ? totalPages : 1);
//     }
//   }, [filteredJobs, totalPages]);

//   const startIndex = (currentPaginationPage - 1) * recordsPerPage;
//   const endIndex = Math.min(startIndex + recordsPerPage, filteredJobs.length);
//   const currentJobs = filteredJobs.slice(startIndex, endIndex);


//   return (
//     <div className="main-content">
//       <nav className="navbar">
//         <span>Email Templates</span>
//         <span className="active">Job Templates</span>
//       </nav>
//       <h2>Job Templates</h2>
//       <p>You can use these templates to create a new job with just a few clicks and organize them in different folders.</p>
//       <div className="controls">
//         <div className="left-controls">

//         <input
//           type="text"
//           placeholder="Search"
//           className="search-box"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//         {/* Records Per Page Dropdown */}
//         <div className="temp-records-dropdown-container">
//           <div className="temp-dropdown-selected" onClick={() => setRecordsDropdownOpen(!recordsDropdownOpen)}>
//             {recordsPerPage} Records per page
//             <ChevronDown size={24} color="#032b26" strokeWidth={3} absoluteStrokeWidth />
//           </div>

//           {recordsDropdownOpen && (
//             <div className="temp-dropdown-menu">
//               {[5, 10, 20, 50].map((num) => (
//                 <div
//                   key={num}
//                   className="temp-dropdown-item"
//                   onClick={() => {
//                     setRecordsPerPage(num);  //  Update records per page
//                     setCurrentPaginationPage(1);  //  Reset to first page
//                     setRecordsDropdownOpen(false); //  Close dropdown
//                   }}
//                 >
//                   {num}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//         </div>
//         <div className="right-controls">
//         <button className="primary-btn" onClick={onCreateTemplate}>+ New Job Template</button>
//         <button className="secondary-btn" onClick={onCreateFolder}>New Template Folder</button>
//       </div>
//       </div>
//       <table className="jobtemp-table">
//         <thead>
//           <tr>
//             <th> Name</th>
//             <th>Industry</th>
//             <th>Client Name</th>
//             <th>Contact Name</th>
//             <th>Experience</th>
//             <th>Required Skills</th>
//           </tr>
//         </thead>
//         <tbody>
//           {currentJobs.length > 0 &&
//             currentJobs.map((job) => (
//               <tr key={job.id}>
//                 <td>{job.templateName}</td>
//                 <td>{job.industry}</td>
//                 <td>{job.clientName}</td>
//                 <td>{job.contactName}</td>
//                 <td>{job.experience}</td>
//                 <td>{job.skills.join(", ")}</td>
//               </tr>
//             ))
//           }
//         </tbody>
//       </table>
//       <div className="pagination">
//         <button disabled={currentPaginationPage === 1} onClick={() => setCurrentPaginationPage(1)}>« First</button>
//         <button disabled={currentPaginationPage === 1} onClick={() => setCurrentPaginationPage((prev) => Math.max(1, prev - 1))}>‹ Prev</button>
//         {[...Array(totalPages)].map((_, index) => {
//           const page = index + 1;
//           return (
//             <button
//               key={page}
//               className={currentPaginationPage === page ? "active" : ""}
//               onClick={() => setCurrentPaginationPage(page)}
//             >
//               {page}
//             </button>
//           );
//         })}
//         <button disabled={currentPaginationPage >= totalPages} onClick={() => setCurrentPaginationPage((prev) => Math.min(totalPages, prev + 1))}>Next ›</button>
//         <button disabled={currentPaginationPage >= totalPages} onClick={() => setCurrentPaginationPage(totalPages)}>Last »</button>
//       </div>
//     </div>
//   );
// };
// const JobTemplatesPage = () => {
//   const [currentPage, setCurrentPage] = useState("templates");
//   const [jobTemplates, setJobTemplates] = useState([]);
//   const renderPage = () => {
//     switch (currentPage) {
//       case "templates":
//         return (
//           <JobTemplates
//             jobTemplates={jobTemplates}
//             setJobTemplates={setJobTemplates}
//             onCreateTemplate={() => setCurrentPage("new-template")}
//             onCreateFolder={() => setCurrentPage("create-folder")}
//           />
//         );
//       case "new-template":
//         return (
//           <NewJobTemplate
//             setJobTemplates={setJobTemplates}
//             setCurrentPage={setCurrentPage}
//           />
//         );
//       case "create-folder":
//         return <CreateJobTemplateFolder onCancel={() => setCurrentPage("templates")} />;
//       default:
//         return <JobTemplates jobTemplates={jobTemplates} setJobTemplates={setJobTemplates} />;
//     }
//   };

//   return (
//     <div className="page-container">
//       <Sidebar setCurrentPage={setCurrentPage} />
//       {renderPage()}
//     </div>

//   );
// };

// const CreateJobTemplateFolder = ({ onCancel }) => {
//   return (
//     <div className="create-folder">
//       <nav className="navbar">
//         <span>Email Templates</span>
//         <span className="active">Job Templates</span>
//       </nav>
//       <h2>Create Job Template Folder</h2>
//       <label>Folder Name <span className="required">*</span></label>
//       <input type="text" placeholder="Enter folder name" className="folder-input" />
//       <div className="buttons">
//         <button className="cancel-btn" onClick={onCancel}>Cancel</button>
//         <button className="save-btn">Save</button>
//       </div>
//     </div>
//   );
// };

// export default JobTemplatesPage;
