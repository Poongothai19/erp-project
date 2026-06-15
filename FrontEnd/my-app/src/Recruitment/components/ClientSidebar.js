// import React, { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Trash2, Edit3 } from "lucide-react";
// import BASE_URL from "../../url";
// import axios from "axios";
// import "../styles/CreateViewSidebar.css";

// const ClientViewSidebar = ({ onClose, onViewSelect }) => {
//   const [clientViews, setClientViews] = useState([]);
//   const navigate = useNavigate();
//   /* API Fetch  */
//   useEffect(() => {
//     const fetchClientViews = async () => {
//       const token = localStorage.getItem("token");
//       try {
//         const response = await axios.get(`${BASE_URL}/api/clients/getviews`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         setClientViews(response.data || []);
//       } catch (error) {
//         console.error("Failed to fetch client views:", error);
//       }
//     };

//     fetchClientViews();
//   }, []);
//   /* Rename View Event */
//   const handleRename = async (view) => {
//     const newName = prompt("Enter new view name:", view.name);
//     if (!newName?.trim()) return;
//     const token = localStorage.getItem("token");//token
//     try {
//       await axios.put(
//         `${BASE_URL}/api/clients/clientviews/${view.id}/rename`, // Corrected dynamic path
//         { name: newName.trim() },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       // Refresh views
//       const refreshed = await axios.get(`${BASE_URL}/api/clients/getviews`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setClientViews(refreshed.data || []);
//     } catch (err) {
//       console.error(" Rename failed:", err);
//     }
//   };
//   /* Handle delete Event */
//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this view?")) return;
//     try {
//       const token = localStorage.getItem("token");
//       await axios.delete(`${BASE_URL}/api/clients/clientviews/${id}`, { // Corrected dynamic path
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       setClientViews((prev) => prev.filter((v) => v.id !== id));
//     } catch (err) {
//       console.error("Delete failed:", err);
//       alert("Failed to delete view.");
//     }
//   };
// /* Delete All Views  */
//   const handleDeleteAll = async () => {
//     const token = localStorage.getItem("token");

//     if (!window.confirm("Delete all views?")) return;

//     try {
//       const deleteRequests = clientViews.map((view) =>
//         axios.delete(`${BASE_URL}/api/clients/clientviews/${view.id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })
//       );
//       await Promise.all(deleteRequests);
//       setClientViews([]);
//     } catch (error) {
//       console.error("Bulk delete failed:", error);
//     }
//   };

// /* Return Block */

//   return (
//     <div className="filter-sidebar active">
//       <h3>Client Views</h3>

//       <Link to="/client-view" className="create-sidebar-item" onClick={onClose}>
//         + Create New View
//       </Link>
//       <div className="create-sidebar-divider" />
//       {clientViews.length > 0 ? (
//         <>
//           {clientViews.map((view) => (
//             <div key={view.id} className="create-sidebar-item view-row">
//               <span onClick={() => onViewSelect(view)}> {view.name}</span>
//               <span className="action-btn" onClick={() => handleRename(view)} title="Rename">
//                 <Edit3 size={20} color="#019d88" />
//               </span>
//               <span className="action-btn" onClick={() => handleDelete(view.id)} title="Delete">
//                 <Trash2 size={20} color="#019d88" />
//               </span>
//             </div>
//           ))}
//           <button className="bulk-delete-btn" onClick={handleDeleteAll}>
//             <Trash2 size={18}  color="Black" /> Delete All Views
//           </button>
//         </>
//       ) : (
//         <div className="create-sidebar-item no-views">No saved views yet</div>
//       )}
//     </div>
//   );
// };

// export default ClientViewSidebar;
