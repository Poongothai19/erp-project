// import React, { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import "../styles/ClientListings.css";
// import { FaFileImport, FaFilter, FaSearch } from "react-icons/fa";
// import { Trash } from "lucide-react";
// import Pagination from "../utils/Pagination";
// import { availableColumns as clientColumns } from "../config/ClientConfig";
// import RowsPerPageSelector from "../utils/RowsPerPageSelector";
// import ManageViewDropdown from "./ManageViewDropdown";
// import ManageViewSidebar from "./ManageViewSidebar";
// import ClientViewSidebar from "./ClientSidebar";
// import CreateViewDropdown from "./CandidateViewDropdown";
// import ClientTable from "./ClientTable";
// import ClientFilter from "./ClientFilter";
// import Swal from "sweetalert2";
// import BASE_URL from "../../url";

// const ClientListings = () => {
//   const [clients, setClients] = useState([]);
//   const [filteredClients, setFilteredClients] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [showFilters, setShowFilters] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
//   const [selectedRows, setSelectedRows] = useState(new Set());
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [showManageView, setShowManageView] = useState(false);
//   const [selectedView, setSelectedView] = useState("");
//   const [showCreateView, setShowCreateView] = useState(false);
//   const [selectedColumns, setSelectedColumns] = useState([
//     "clientId",
//     "clientName",
//     "contactNumber"
//   ]);
//   const [views, setViews] = useState([]);
//   const navigate = useNavigate();



//   const handleSearch = (e) => {
//     const value = e.target.value.toLowerCase();
//     setSearchTerm(value);
//     setFilteredClients(clients.filter((client) => client.clientName.toLowerCase().includes(value)));
//   };

//   const handleFileChange = (event) => {
//     console.log("Selected file:", event.target.files[0]);
//   };

//   const handleImportClick = () => {
//     document.getElementById("fileInput").click();
//   };

//   const handleViewSelection = (viewName) => {
//     setSelectedView(viewName);
//     setDropdownOpen(false);
//   };

//   useEffect(() => {
//     const fetchClients = async () => {
//       try {
//         const response = await fetch(`${BASE_URL}/api/clients`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });

//         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//         const data = await response.json();
//         setClients(data);
//         setFilteredClients(data);
//       } catch (error) {
//         console.error("Error fetching clients:", error);
//       }
//     };
//     fetchClients();
//   }, []);

//   useEffect(() => {
//     const storedColumns = JSON.parse(localStorage.getItem("selectedColumns"));
//     if (storedColumns) {
//       setSelectedColumns(storedColumns);
//     }
//   }, []);

//   const handleDelete = async (clientId = null) => {
//     const idsToDelete = clientId ? [clientId] : Array.from(selectedRows);

//     if (idsToDelete.length === 0) {
//       Swal.fire("Please select clients to delete.");
//       return;
//     }

//     const confirmDelete = window.confirm(
//       clientId
//         ? "Are you sure you want to delete this client?"
//         : `Are you sure you want to delete ${idsToDelete.length} clients?`
//     );

//     if (!confirmDelete) return;

//     try {
//       const response = await fetch(`${BASE_URL}/api/clients`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({ clientIds: idsToDelete }),
//       });

//       const result = await response.json();
//       if (!response.ok) throw new Error(result.message);

//       // Filter out deleted clients from the list
//       const remainingClients = clients.filter(
//         (client) => !idsToDelete.includes(client.clientId)
//       );
//       setClients(remainingClients);
//       setFilteredClients(remainingClients);
//       setSelectedRows(new Set());

//       Swal.fire(result.message || "Deleted successfully!");
//     } catch (error) {
//       console.error("Error deleting clients:", error);
//       Swal.fire("Error deleting clients: " + error.message);
//     }
//   };

//   const totalPages = Math.ceil(filteredClients.length / rowsPerPage);
//   const indexOfLastClient = currentPage * rowsPerPage;
//   const indexOfFirstClient = indexOfLastClient - rowsPerPage;
//   const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);

//   const toggleRowSelection = (clientId) => {
//     setSelectedRows((prev) => {
//       const newSelection = new Set(prev);
//       newSelection.has(clientId) ? newSelection.delete(clientId) : newSelection.add(clientId);
//       return newSelection;
//     });
//   };

//   const sortClients = (key) => {
//     if (!key) return;
//     setFilteredClients((prevClients) => {
//       return [...prevClients].sort((a, b) => {
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

//   return (
//     <div className={`client-listings-container ${showFilters || showManageView ? "sidebar-open" : ""}`}>
//       {showFilters && <div className="client-listings-overlay" onClick={() => {
//         setShowFilters(false);
//         setShowManageView(false);
//         setShowCreateView(false);
//       }}></div>}

//       {showFilters && (
//         <div className="client-listings-filter-sidebar active">
//           <ClientFilter clients={clients} setFilteredClients={setFilteredClients} />
//         </div>
//       )}
//       {showCreateView && (
//         <div className="client-listings-filter-sidebar active">
//           <ClientViewSidebar
//             onClose={() => setShowCreateView(false)}
//             onViewSelect={(view) => {
//               setSelectedColumns(view.columns);
//               setShowCreateView(false);
//             }}
//           />
//         </div>
//       )}
//       {showManageView && (
//         <div className="client-listings-filter-sidebar active">
//           <ManageViewSidebar
//             availableColumns={clientColumns}
//             selectedColumns={selectedColumns}
//             setSelectedColumns={setSelectedColumns}
//             onClose={() => setShowManageView(false)}
//           />
//         </div>
//       )}

//       <div className="client-listings-content">
//         <h2>All Clients</h2>

//         <div className="client-listings-search-filter-container">
//           <button className="client-listings-filter-button" onClick={() => setShowFilters((prev) => !prev)}>
//             <FaFilter size={16} /> Filters
//           </button>
//           <div className="client-listings-search-container">
//             <FaSearch className="client-listings-search-icon" />
//             <input
//               type="text"
//               placeholder="Search by Client Name..."
//               value={searchTerm}
//               onChange={handleSearch}
//               className="client-listings-search-input"
//             />
//           </div>
//         </div>

//         <div className="client-listings-tool">
//           <div className="left-client-align">
//             <button
//               className="client-delete-selected-btn"
//               // style={{ height: '40px', padding: '2px 6px', marginTop: '3px' }}
//               onClick={() => handleDelete()}
//               disabled={selectedRows.size === 0}
//             >
//               <Trash
//                 size={18}
//                 style={{
//                   marginLeft: "3px",
//                   marginBottom: "-2px",
//                   marginRight: "3px",
//                 }}
//               />
//             </button>

//             <CreateViewDropdown
//               setShowCreateView={() => {
//                 setShowCreateView((prev) => !prev);
//                 if (!showCreateView) setShowFilters(false); //  close filter sidebar
//               }}
//             />
//             <ManageViewDropdown
//               selectedColumns={selectedColumns}
//               setSelectedColumns={setSelectedColumns}
//               setShowManageView={setShowManageView}
//             />
//           </div>

//           <div className="right-client-align">
//             <input type="file" id="fileInput" style={{ display: "none" }} onChange={handleFileChange} />
//             <button className="client-listings-import-button" onClick={handleImportClick}>
//               <FaFileImport size={16} /> Import
//             </button>
//             <button className="client-listings-navigate-button" onClick={() => navigate("/client-creation")}>
//               + Add Client
//             </button>
//             <RowsPerPageSelector rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} />
//           </div>
//         </div>

//         <ClientTable
//           clients={currentClients}
//           selectedColumns={selectedColumns}
//           selectedRows={selectedRows}
//           toggleRowSelection={toggleRowSelection}
//           handleSelectAll={() =>
//             setSelectedRows(
//               selectedRows.size === clients.length
//                 ? new Set()
//                 : new Set(clients.map((c) => c.clientId))
//             )
//           }
//           sortClients={sortClients}
//           availableColumns={clientColumns}
//           handleDelete={handleDelete}
//         />
//         <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
//       </div>
//     </div>
//   );
// };

// export default ClientListings;
