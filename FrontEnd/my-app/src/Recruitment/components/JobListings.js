
// import React, { useEffect, useState, useRef } from "react";
// import { Link, useNavigate, useParams } from "react-router-dom";
// import "../styles/JobListings.css";
// import * as XLSX from "xlsx";
// import { MdDelete } from "react-icons/md";
// import { FaSearch, FaSortAlphaDown, FaFilter, FaFileImport } from "react-icons/fa";
// import Pagination from "../utils/Pagination";
// import RowsPerPageSelector from "../utils/RowsPerPageSelector";
// import { generatePageNumbers } from "../utils/paginationUtils";
// import ManageViewSidebar from "./ManageViewSidebar";
// import CreateViewDropdown from "./CandidateViewDropdown";
// import JobViewSidebar from "./JobViewSidebar";
// import { availableColumns } from "../config/filterConfig";
// import {
//   deleteSelectedRows,
  
//   handleMultipleDelete,
// } from "../utils/jobDeletion";
// import JobFilter from "./jobFilter";
// import BASE_URL from "../../url";

// const JobListings = () => {
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [jobs, setJobs] = useState([]);
//   const [filteredJobs, setFilteredJobs] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
  
//   // Sidebar state - using single state variable to control which sidebar is open
//   const [activeSidebar, setActiveSidebar] = useState(null); // 'filter', 'createView', 'manageView', or null
  
//   const [selectedColumns, setSelectedColumns] = useState([]); 
//   const [jobColumns, setJobColumns] = useState(availableColumns);
//   const [selectedJobColumns, setSelectedJobColumns] = useState([]);
//   const [tempSelectedColumns, setTempSelectedColumns] = useState(selectedColumns);
//   const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
//   const [selectedRows, setSelectedRows] = useState(new Set());
//   const [searchTerm, setSearchTerm] = useState("");
  
//   const dropdownRef = useRef(null);
//   const filterRef = useRef(null);
//   const navigate = useNavigate();
//   const { id } = useParams();

//   useEffect(() => {
//     const fetchJobs = async () => {
//       try {
//         const response = await fetch(`${BASE_URL}/api/jobs/job-openings`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//         const data = await response.json();
//         console.log("Fetched Jobs Data:", data);

//         setJobs(data);
//         setFilteredJobs(data);
//       } catch (error) {
//         console.error("Error fetching jobs:", error);
//       }
//     };
//     fetchJobs();
//   }, []);

//   const totalPages = Math.ceil(filteredJobs.length / rowsPerPage);
//   const indexOfLastJob = currentPage * rowsPerPage;
//   const indexOfFirstJob = indexOfLastJob - rowsPerPage;
//   const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

//   const toggleRowSelection = (jobId) => {
//     setSelectedRows((prev) => {
//       const newSelection = new Set(prev);
//       newSelection.has(jobId) ? newSelection.delete(jobId) : newSelection.add(jobId);
//       return newSelection;
//     });
//   };

//   const sortJobs = (key) => {
//     if (!key) return;

//     setFilteredJobs((prevJobs) => {
//       return [...prevJobs].sort((a, b) => {
//         let valueA = a[key] ?? "";
//         let valueB = b[key] ?? "";

//         if (!isNaN(valueA) && !isNaN(valueB)) {
//           valueA = Number(valueA);
//           valueB = Number(valueB);
//         }

//         return sortConfig.direction === "asc"
//           ? valueA.toString().localeCompare(valueB.toString())
//           : valueB.toString().localeCompare(valueA.toString());
//       });
//     });

//     setSortConfig((prev) => ({
//       key,
//       direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
//     }));
//   };
  
//   const isValidDate = (dateString) => {
//     const date = new Date(dateString);
//     return date instanceof Date && !isNaN(date);
//   };

//   const handleTempColumnChange = (colKey) => {
//     setTempSelectedColumns((prev) =>
//       prev.includes(colKey) ? prev.filter((key) => key !== colKey) : [...prev, colKey]
//     );
//   };
  
//   const handleSelectAllColumns = () => {
//     if (tempSelectedColumns.length === availableColumns.length) {
//       setTempSelectedColumns([]);
//     } else {
//       setTempSelectedColumns(availableColumns.map((col) => col.key));
//     }
//   };

//   const handleBulkDelete = async () => {
//     await deleteSelectedRows(
//       Array.from(selectedRows),
//       handleMultipleDelete,
//       jobs,
//       setJobs,
//       setFilteredJobs,
//       setSelectedRows
//     );
//   };

//   const handleSearch = (e) => {
//     const value = e.target.value.toLowerCase();
//     setSearchTerm(value);
//     setCurrentPage(1);

//     const filtered = jobs.filter((job) =>
//       job.postingTitle.toLowerCase().includes(value)
//     );
//     setFilteredJobs(filtered);
//   };

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setDropdownOpen(false);
//       }
      
//       // Close filter sidebar if it's open and clicked outside
//       if (filterRef.current && !filterRef.current.contains(event.target) && activeSidebar === 'filter') {
//         setActiveSidebar(null);
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [activeSidebar]);

//   return (
//     <div className="job-listing-container">
//       <div className="job-listing-column-selector">
//         <div className="job-listing-dropdown">
//           {dropdownOpen && (
//             <div ref={dropdownRef} className="job-listing-dropdown-btn">
//               {/* Select All Checkbox */}
//               <div className="job-listing-dropdown-item select-all">
//                 <input
//                   type="checkbox"
//                   id="selectAllColumns"
//                   checked={tempSelectedColumns.length === availableColumns.length}
//                   onChange={handleSelectAllColumns}
//                 />
//                 <label htmlFor="selectAllColumns"><strong>Select All</strong></label>
//               </div>

//               {availableColumns.map((col) => (
//                 <div key={col.key} className="job-listing-dropdown-item">
//                   <input
//                     type="checkbox"
//                     id={col.key}
//                     checked={tempSelectedColumns.includes(col.key)}
//                     onChange={() => handleTempColumnChange(col.key)}
//                   />
//                   <label htmlFor={col.key}>{col.label}</label>
//                 </div>
//               ))}

//               <button className="job-listing-ok-button" onClick={() => {
//                 setSelectedColumns(tempSelectedColumns);
//                 setDropdownOpen(false);
//               }}>
//                 OK
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
      
//       <div className="job-listing-filter-container">
//         {activeSidebar === 'filter' && (
//           <div ref={filterRef} className="job-listing-filter-sidebar-active">
//             <JobFilter 
//               jobs={jobs} 
//               setFilteredJobs={setFilteredJobs} 
//               onClose={() => setActiveSidebar(null)}
//             />
//           </div>
//         )}
        
//         {activeSidebar === 'createView' && (
//           <div className="job-listing-filter-sidebar active">
//             <JobViewSidebar
//               onClose={() => setActiveSidebar(null)}
//               onViewSelect={(view) => {
//                 setSelectedColumns(view.columns);
//                 setActiveSidebar(null);
//               }}
//             />
//           </div>
//         )}
        
//         {activeSidebar === 'manageView' && (
//           <div className="job-listing-filter-sidebar active">
//             <ManageViewSidebar
//               availableColumns={jobColumns}
//               selectedColumns={selectedJobColumns}
//               setSelectedColumns={setSelectedJobColumns}
//               onClose={() => setActiveSidebar(null)}
//             />
//           </div>
//         )}
//       </div>
      
//       <div className="job-listing-main-container">
//         <h2>All Job Openings</h2>
//         <div className="job-listing-main">
//           <button 
//             className="job-listing-button" 
//             onClick={() => setActiveSidebar(activeSidebar === 'filter' ? null : 'filter')}
//           >
//             <FaFilter size={16} /> Filters
//           </button>
//           <div className="job-listing-search-container">
//             <FaSearch className="job-listing-search-iconjob" />
//             <input
//               type="text"
//               placeholder="Search by Job Title..."
//               value={searchTerm}
//               onChange={handleSearch}
//               className="job-listing-search-input"
//             />
//           </div>
//         </div>
        
//         <div className="job-listing-toolbar-job">
//           <div className="job-listing-left-job-tool">
//             <button 
//               className="job-listing-delete-selected-btn" 
//               // style={{ height: '40px', padding: '2px 6px', marginTop: '3px' }} 
//               onClick={handleBulkDelete} 
//               disabled={selectedRows.size === 0}
//             >
//               <MdDelete size={20} />
//             </button>
            
//             <CreateViewDropdown
//               setShowCreateView={() => {
//                 setActiveSidebar(activeSidebar === 'createView' ? null : 'createView');
//               }}
//             />
            
//             <button 
//               className="job-listing-jddropdown-btn" 
//               onClick={() => {
//                 setActiveSidebar(activeSidebar === 'manageView' ? null : 'manageView');
//               }}
//             >
//               Manage View
//             </button>
//           </div>
          
//           <div className="job-listing-right-job-tool">
//             <button className="job-listing-navigate-button" onClick={() => navigate("/job-openings")}>
//               + Add Jobpost
//             </button>
//             <div className="job-listing-import-container">
//               <input type="file" accept=".csv, .xlsx" style={{ display: "none" }} id="fileUpload" />
//               <label htmlFor="fileUpload" className="job-listing-import-button">
//                 <FaFileImport size={16} />
//                 Import
//               </label>
//             </div>
//             <RowsPerPageSelector rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} />
//           </div>
//         </div>
        
//         <table>
//           <thead>
//             <tr>
//               <th>
//                 <input
//                   type="checkbox"
//                   onChange={(e) =>
//                     setSelectedRows(e.target.checked ? new Set(jobs.map((job) => job.id)) : new Set())
//                   }
//                 />
//               </th>
//               <th onClick={() => sortJobs("id")}>Job ID</th>
//               <th onClick={() => sortJobs("postingTitle")}>Job Posting Title</th>
//               {selectedColumns.map((col) => (
//                 <th key={col} onClick={() => sortJobs(col)}>
//                   {availableColumns.find((c) => c.key === col)?.label}
//                 </th>
//               ))}
//               {/* {selectedRows.size > 0 && <th>Actions</th>} */}
//             </tr>
//           </thead>
          
//           <tbody>
//             {currentJobs.length > 0 ? (
//               currentJobs.map((job) => (
//                 <tr key={job.id}>
//                   <td>
//                     <input
//                       type="checkbox"
//                       checked={selectedRows.has(job.id)}
//                       onChange={() => toggleRowSelection(job.id)}
//                     />
//                   </td>
//                   <td>{job.id}</td>
//                   <td><Link to={`/JoboverviewPage/${job.id}`}>{job.postingTitle}</Link></td>
//                   {selectedColumns.map((col) => (
//                     <td key={col}>
//                       {col === "dateOpened" && job.dateOpened
//                         ? isValidDate(job.dateOpened)
//                           ? new Date(job.dateOpened).toISOString().split("T")[0]
//                           : "Invalid Date"
//                         : col === "targetDate" && job.targetDate
//                           ? isValidDate(job.targetDate)
//                             ? new Date(job.targetDate).toISOString().split("T")[0]
//                             : "Invalid Date"
//                           : col === "jobDescription"
//                             ? <p dangerouslySetInnerHTML={{ __html: job[col] || "" }}></p>
//                             : typeof job[col] === "object" && job[col] !== null
//                               ? JSON.stringify(job[col])
//                               : job[col] || "N/A"}
//                     </td>
//                   ))}
//                   {/* {selectedRows.has(job.id) && (
//                     <td>
//                       <button 
//                         className="delete-icon-btn" 
//                         onClick={() => deleteSingleRow(job.id, handleSingleDelete, jobs, setJobs, setFilteredJobs, setSelectedRows)}
//                       >
//                         <MdDelete size={18} />
//                       </button>
//                     </td>
//                   )} */}
//                 </tr>
//               ))
//             ) : (
//               <tr><td colSpan="7">No job openings available.</td></tr>
//             )}
//           </tbody>
//         </table>
        
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           onPageChange={setCurrentPage}
//         />
//       </div>
//     </div>
//   );
// };

// export default JobListings;