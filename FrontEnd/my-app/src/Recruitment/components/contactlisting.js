// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { EllipsisVertical, Table, Plus, Phone } from "lucide-react";
// import { MdDelete } from "react-icons/md";
// import ManageViewSidebar from "./ManageViewSidebar";
// import ManageViewDropdown from "./ManageViewDropdown";
// import CreateViewDropdown from "./CandidateViewDropdown";
// import CreateViewSidebar from "./ContactViewSidebar";
// import { availableColumns as contactColumns } from "../config/ContactConfig";
// import { FaFileImport, FaFilter, FaSearch } from "react-icons/fa";
// import "../styles/ContactListing.css";
// import RowsPerPageSelector from "../utils/RowsPerPageSelector";
// import { Link } from "react-router-dom";
// import JobFilter from "./jobFilter";
// import Pagination from "../utils/Pagination";
// import ContactFilter from "./ContactFilter";
// import ContactTable from "./ContactTable";
// import Swal from "sweetalert2";
// import BASE_URL from "../../url";

// export default function ContactListing() {
//   const [contacts, setContacts] = useState([]);
//   const [selectedRows, setSelectedRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [recordsPerPage, setRecordsPerPage] = useState(5);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [filterOpen, setFilterOpen] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [moredropdownOpen, setMoredropdownOpen] = useState(false);
//   const [filter, setFilter] = useState([]);
//   const [showFilters, setShowFilters] = useState(false);
//   const [filteredJobs, setFilteredJobs] = useState([]);
//   const [recordsDropdownOpen, setRecordsDropdownOpen] = useState(false);
//   const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
//   const [selectedFilters, setSelectedFilters] = useState({});
//   const [selectedView, setSelectedView] = useState("All contacts");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showCreateView, setShowCreateView] = useState(false);
//   const [showManageView, setShowManageView] = useState(false);
//   const [selectedColumns, setSelectedColumns] = useState(["firstName",
//     "lastName", "email",]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchContacts();
//   }, []);

//   const fetchContacts = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${BASE_URL}/api/contacts`);
//       setContacts(response.data || []); // Default to an empty array if no data
//     } catch (error) {
//       console.error("Error fetching contacts:", error);
//       setError("Failed to fetch contacts.");
//       setContacts([]); // Set to empty array on error
//     } finally {
//       setLoading(false); // Ensure loading is set to false
//     }
//   };

//   const handleApplyFilters = (filteredData) => {
//     setFilteredJobs(filteredData);
//   };

//   useEffect(() => {
//     console.log("Updated Contacts List:", contacts);
//   }, [contacts]);

//   const filteredContacts = searchQuery
//     ? contacts.filter((contact) =>
//       Object.values(contact)
//         .join(" ") // Combine all fields for better search
//         .toLowerCase()
//         .includes(searchQuery.toLowerCase())
//     )
//     : contacts;

//   const totalPages = Math.ceil(filteredContacts.length / recordsPerPage);

//   useEffect(() => {
//     if (currentPage > totalPages) {
//       setCurrentPage(totalPages > 0 ? totalPages : 1);
//     }
//   }, [filteredContacts, totalPages]);

//   const startIndex = (currentPage - 1) * recordsPerPage;
//   const endIndex = startIndex + recordsPerPage;
//   const currentContacts = filteredContacts.slice(startIndex, endIndex);

//   useEffect(() => {
//     setCurrentPage(1); // Reset to first page when records per page changes
//   }, [recordsPerPage]);

//   useEffect(() => {
//     if (filteredContacts.length > 0 && currentPage > totalPages) {
//       setCurrentPage(totalPages);
//     }
//   }, [filteredContacts.length, totalPages]);

//   const handleFilterChange = (filterKey) => {
//     setSelectedFilters((prev) => ({
//       ...prev,
//       [filterKey]: prev[filterKey] ? null : { condition: "", value: "" },
//     }));
//   };

//   const handleConditionChange = (filterKey, condition) => {
//     setSelectedFilters((prev) => ({
//       ...prev,
//       [filterKey]: { ...prev[filterKey], condition },
//     }));
//   };

//   const handleValueChange = (filterKey, value) => {
//     setSelectedFilters((prev) => ({
//       ...prev,
//       [filterKey]: { ...prev[filterKey], value },
//     }));
//   };

//   const allFields = [
//     "contactId", "firstName", "lastName", "email", "workPhone", "mobile",
//     "department", "fax", "clientName", "secondaryEmail",
//     "jobTitle", "source", "contactOwner", "isPrimaryContact", "emailOptOut",
//     "description", "createdAt", "updatedAt"
//   ];


//   const [SelectedContacts, setSelectedContacts] = useState(() => {
//     return JSON.parse(localStorage.getItem("selectedContactColumns")) || allFields;
//   });

//   useEffect(() => {
//     const storedColumns = JSON.parse(localStorage.getItem("selectedContactColumns")) || allFields;
//     setSelectedContacts([...storedColumns]);
//   }, []);

//   const toggleColumnSelection = (column) => {
//     setSelectedContacts((prevSelected) => {
//       let updatedSelection;

//       if (prevSelected.includes(column)) {
//         updatedSelection = prevSelected.filter((col) => col !== column);
//       } else {
//         updatedSelection = [...prevSelected, column];
//       }

//       localStorage.setItem("selectedContactColumns", JSON.stringify(updatedSelection));
//       return updatedSelection;
//     });
//   };

//   const handleRowSelection = (contactId) => {
//     setSelectedRows((prev) =>
//       prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
//     );
//   };

//   const handleSelectAll = () => {
//     const contactsToSelect = filteredContacts.length > 0 ? filteredContacts : currentContacts;
//     if (selectedRows.length === filteredContacts.length) {
//       setSelectedRows([]); // Deselect all
//     } else {
//       setSelectedRows(filteredContacts.map(contact => contact.contactId));
//     }
//   };

//   const toggleContactSelection = (id) => {
//     if (id === "all") {
//       const allSelected =
//         contacts.length > 0 &&
//         contacts.every((contact) => selectedRows.has(contact.contactId));

//       if (allSelected) {
//         setSelectedRows(new Set());
//       } else {
//         const allIds = new Set(contacts.map((contact) => contact.contactId));
//         setSelectedRows(allIds);
//       }
//     } else {
//       setSelectedRows((prevSelected) => {
//         const newSelected = new Set(prevSelected);
//         if (newSelected.has(id)) {
//           newSelected.delete(id);
//         } else {
//           newSelected.add(id);
//         }
//         return newSelected;
//       });
//     }
//   };

//   const removeDuplicateCandidates = (contacts) => {
//     return [...new Map(contacts.map(contact => [contact.contactId, contact])).values()];
//   };

//   const uniqueContacts = removeDuplicateCandidates(currentContacts);

//   const handleDeleteSelected = async () => {
//     if (selectedRows.length === 0) {
//       Swal.fire("No contacts selected.");
//       return;
//     }

//     try {
//       await axios.post(`${BASE_URL}/api/contacts/delete-bulk`, {
//         contactIds: selectedRows,
//       });

//       setContacts((prevContacts) =>
//         prevContacts.filter((contact) => !selectedRows.includes(contact.contactId))
//       );

//       setSelectedRows([]);
//       Swal.fire("Contacts deleted successfully!", "", "success");
//     } catch (err) {
//       Swal.fire("Failed to delete contacts. Try again!", "", "error");
//     }
//   };
//   /* Return Block */
//   return (
//     <div
//       id="contact-page-listings"
//       className={`contact-page-container ${showFilters || showCreateView || showManageView ? "contact-sidebar-open" : ""}`}
//     >
//       {(showFilters || showCreateView || showManageView) && (
//         <div
//           className="contact-overlay"
//           onClick={() => {
//             setShowFilters(false);
//             setShowCreateView(false);
//             setShowManageView(false);
//           }}
//         />
//       )}
  
//       {showFilters && (
//         <div className="contact-filter-sidebar active">
//           <ContactFilter
//             contacts={contacts}
//             setFilteredContacts={setFilteredJobs}
//           />
//         </div>
//       )}
  
//       {showCreateView && (
//         <div className="contact-filter-sidebar active">
//           <CreateViewSidebar
//             onClose={() => setShowCreateView(false)}
//             onViewSelect={(view) => {
//               setSelectedColumns(view.columns);
//               setShowCreateView(false);
//             }}
//           />
//         </div>
//       )}
  
//       {showManageView && (
//         <div className="contact-filter-sidebar active">
//           <ManageViewSidebar
//             availableColumns={contactColumns}
//             selectedColumns={selectedColumns}
//             setSelectedColumns={setSelectedColumns}
//             onClose={() => setShowManageView(false)}
//           />
//         </div>
//       )}
  
//       <div className="contact-content">
//         <h2>All Contacts</h2>
  
//         <div className="contact-header-container">
//           <button
//             className="contact-filter-sidebar-btn"
//             onClick={() => {
//               setShowFilters((prev) => !prev);
//               if (!showFilters) setShowCreateView(false);
//             }}
//           >
//             <FaFilter size={20} /> Filters
//           </button>
  
//           <div className="contact-search-container1">
//             <input
//               type="text"
//               placeholder="Search by Contact Name..."
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setCurrentPage(1);
//               }}
//               className="contact-search-input1"
//             />
//             <FaSearch className="contact-search-icon" />
//           </div>
//         </div>
  
//         <div className="contact-toolbar">
//           <div className="left-contact-align">
//             <button
//               className="contact-delete-selected-btn"
//               onClick={handleDeleteSelected}
//               disabled={selectedRows.length === 0}
//             >
//               <MdDelete size={16} />
//             </button>
  
//             <CreateViewDropdown
//               setShowCreateView={() => {
//                 setShowCreateView((prev) => !prev);
//                 if (!showCreateView) setShowFilters(false);
//               }}
//             />
  
//             <ManageViewDropdown
//               selectedColumns={selectedColumns}
//               setSelectedColumns={setSelectedColumns}
//               setShowManageView={setShowManageView}
//             />
//           </div>
  
//           <div className="right-contact-align">
//             <input
//               type="file"
//               accept=".csv, .xlsx"
//               style={{ display: "none" }}
//               id="fileUpload"
//             />
//             <label htmlFor="fileUpload" className="contact-import-btn">
//               <FaFileImport size={18} /> Import
//             </label>
  
//             <button
//               className="contact-add-btn"
//               onClick={() => navigate("/create-contact")}
//             >
//               <Plus size={14} /> Add contact
//             </button>
  
//             <RowsPerPageSelector
//               rowsPerPage={rowsPerPage}
//               setRowsPerPage={setRowsPerPage}
//             />
//           </div>
//         </div>
  
//         {loading ? (
//           <p>Loading contacts...</p>
//         ) : filteredContacts && filteredContacts.length === 0 ? (
//           <p>No contacts found</p>
//         ) : (
//           <ContactTable
//             contacts={uniqueContacts || []}
//             selectedRows={selectedRows}
//             selectedColumns={selectedColumns}
//             toggleRowSelection={toggleContactSelection}
//             handleSelectAll={handleSelectAll}
//             handleRowSelection={handleRowSelection}
//             sortContacts={() => { }}
//             availableColumns={contactColumns}
//           />
//         )}
  
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           onPageChange={setCurrentPage}
//         />
//       </div>
//     </div>
//   );
  
// }
