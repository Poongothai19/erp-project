// import React, { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Trash2, Edit3 } from "lucide-react";
// import BASE_URL from "../../url";
// import axios from "axios";
// import "../styles/ContactCreateviewSB.css";

// const CreateContactViewSidebar = ({ onClose, onViewSelect }) => {
//   const [savedViews, setSavedViews] = useState([]);
//   const navigate = useNavigate();
//   /* API Fetch  */
//   useEffect(() => {
//     const fetchViews = async () => {
//       const token = localStorage.getItem("token");
//       console.log(token);
//       try {
//         const response = await axios.get(`${BASE_URL}/api/contacts/views/allviews`, {

//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         setSavedViews(response.data || []);

//       } catch (error) {
//         console.error("Failed to fetch views:", error.response ? error.response.data : error.message);
//         alert("Failed to fetch views. Check the console for details.");
//       }
//     };
//     fetchViews();
//   }, []);
// /* Rename view event  */
//   const handleRename = async (view) => {
//     const newName = prompt("Enter new view name:", view.name);
//     if (!newName || newName.trim() === "") return;

//     const token = localStorage.getItem("token"); // Retrieve the token from localStorage
//     if (!token) {
//       alert("No authentication token found.");
//       return;
//     }

//     try {
//       // Send PUT request with the token in the headers
//       await axios.put(`${BASE_URL}/api/contacts/views/${view.id}`,
//         { name: newName.trim() },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const response = await axios.get(`${BASE_URL}/api/contacts/views`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setSavedViews(response.data || []);
//     } catch (error) {
//       console.error(" Rename failed:", error);
//     }
//   };
// /* Delete view event */
//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this view?")) return;

//     const token = localStorage.getItem("token");
//     try {
//       // Send DELETE request with the token in the headers
//       await axios.delete(`${BASE_URL}/api/contacts/views/${id}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       // Filter using 'id' instead of 'ContactId'
//       setSavedViews((prev) => prev.filter((v) => v.id !== id));
//     } catch (err) {
//       console.error(" Delete failed:", err);
//       alert("Failed to delete view.");
//     }
//   };
//   /* Delete All Created Views  */
//   const handleDeleteAll = async () => {
//     if (!window.confirm("Delete all views?")) return;

//     const token = localStorage.getItem("token");
//     try {
//       const deleteRequests = savedViews.map((view) =>
//         axios.delete(`${BASE_URL}/api/contacts/views/${view.id}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         })
//       );
//       await Promise.all(deleteRequests);
//       setSavedViews([]);
//     } catch (error) {
//       console.error(" Bulk delete failed:", error);
//     }
//   };
// /* Return block */
//   return (
//     <div className="Contact-filter-sidebar active">
//       <h3>Views</h3>
//       <Link to="/contact-view" className="Contact-create-sidebar-item" onClick={onClose}>
//         Create New View
//       </Link>
//       <div className="Contact-create-sidebar-divider" />
//       {savedViews.length > 0 ? (
//         <>
//           {savedViews.map((view) => (
//             <div key={view.id} className="Contact-create-sidebar-item view-row">
//               <span onClick={() => onViewSelect(view)}>{view.name}</span>
//               <span className="Contact-action-btn" onClick={() => handleRename(view)} title="Rename">
//                 <Edit3 size={20} color="#019d88" />
//               </span>
//               <span className="Contact-action-btn" onClick={() => handleDelete(view.id)} title="Delete">
//                 <Trash2 size={20} color="#019d88" />
//               </span>
//             </div>
//           ))}
//           <button className="Contact-bulk-delete-btn" onClick={handleDeleteAll}>
//             <Trash2 size={18}  color="Black"/> Delete All Views
//           </button>
//         </>
//       ) : (
//         <div className="Contact-create-sidebar-item no-views">No saved views yet</div>
//       )}
//     </div>
//   );
// };

// export default CreateContactViewSidebar;
