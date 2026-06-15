// import React, { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Trash2, Edit3 } from "lucide-react";
// import BASE_URL from "../../url";
// import axios from "axios";
// import "../styles/CreateViewSidebar.css"; // reuse same styles

// const JobViewSidebar = ({ onClose, onViewSelect }) => {
//   const [savedViews, setSavedViews] = useState([]);
//   const navigate = useNavigate();
//   /* API Fetch */
//   useEffect(() => {
//     const fetchViews = async () => {
//       const token = localStorage.getItem("token");
//       try {
//         const response = await axios.get(`${BASE_URL}/api/jobs`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         setSavedViews(response.data || []);
//       } catch (error) {
//         console.error(" Failed to fetch job views:", error);
//       }
//     };

//     fetchViews();
//   }, []);
//   /* Rename view */
//   const handleRename = async (view) => {
//     const newName = prompt("Enter new view name:", view.name);
//     if (!newName || newName.trim() === "") return;

//     const token = localStorage.getItem("token");

//     try {
//       await axios.put(
//         `${BASE_URL}/api/jobs/rename/${view.id}`,
//         { name: newName.trim() },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       const response = await axios.get(`${BASE_URL}/api/jobs`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setSavedViews(response.data || []);
//     } catch (error) {
//       console.error("Rename failed:", error);
//     }
//   };
//   /* Delete view from DB */
//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this view?")) return;

//     try {
//       const token = localStorage.getItem("token");

//       await axios.delete(`${BASE_URL}/api/jobs/${id}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       setSavedViews((prev) => prev.filter((v) => v.id !== id));
//     } catch (err) {
//       console.error("Delete failed:", err);
//       alert("Failed to delete view.");
//     }
//   };
//   /* Delete All views From DB */
//   const handleDeleteAll = async () => {
//     const token = localStorage.getItem("token");

//     if (!window.confirm("Delete all views?")) return;

//     try {
//       const deleteRequests = savedViews.map((view) =>
//         axios.delete(`${BASE_URL}/api/jobs/${view.id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })
//       );
//       await Promise.all(deleteRequests);
//       setSavedViews([]);
//     } catch (error) {
//       console.error("Bulk delete failed:", error);
//     }
//   };
//   /* Return Block */
//   return (
//     <div className="filter-sidebar active"
//     style={{width:"200px",whiteSpace:"nowrap"
      
//     }}>
//       <h3>Job Views</h3>
//       <Link to="/job-view" className="create-sidebar-item" onClick={onClose}>
//         + Create New Job View
//       </Link>
//       <div className="create-sidebar-divider" />
//       {savedViews.length > 0 ? (
//         <>
//           {savedViews.map((view) => (
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
//           <button className="bulk-delete-btn"style={{marginLeft:"10px"}} onClick={handleDeleteAll}>
//             <Trash2 size={20} color="Black" /> Delete All Views
//           </button>
//         </>
//       ) : (
//         <div className="create-sidebar-item no-views">No saved job views yet</div>
//       )}
//     </div>
//   );
// };
// export default JobViewSidebar;
