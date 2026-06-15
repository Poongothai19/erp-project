// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { availableColumns } from "../config/filterConfig";
// import "../styles/CandidateEditView.css";
// import "../styles/ManageViewDropdown.css";
// import Swal from "sweetalert2";
// import BASE_URL from "../../url";

// const EditView = () => {
//   const navigate = useNavigate();
//   const [viewName, setViewName] = useState("");
//   const [selectedColumns, setSelectedColumns] = useState([]);
//   const [savedViews, setSavedViews] = useState([]);

//   // Fetch views on mount

//   const handleColumnChange = (key) => {
//     setSelectedColumns((prev) =>
//       prev.includes(key)
//         ? prev.filter((col) => col !== key)
//         : [...prev, key]
//     );
//   };

//   const handleSave = async () => {
//     if (!viewName.trim()) {
//       Swal.fire("Please provide a view name!");
//       return;
//     }

//     const token = localStorage.getItem("token");

//     try {
//       const response = await axios.post(
//         `${BASE_URL}/api/jobs/create`, //Updated endpoint
//         {
//           name: viewName.trim(),
//           columns: selectedColumns,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       Swal.fire(response.data.message || " View saved successfully!");
//       navigate("/job-listings");
//     } catch (err) {
//       console.error(" Failed to save view:", err);
//       Swal.fire("Failed to save view. Check console.");
//     }
//   };
// /* Return Block */
//   return (
//     <div className="edit-view-container">
//       <h2 className="edit-view-title">Edit View</h2>

//       <div className="edit-view-group">
//         <label className="edit-view-label">View Name</label>
//         <input
//           type="text"
//           value={viewName}
//           onChange={(e) => setViewName(e.target.value)}
//           placeholder="Enter view name..."
//           className="edit-view-input"
//         />
//       </div>

//       <div className="edit-view-group">
//         <label className="edit-view-label">Select Columns</label>
//         {availableColumns.map((col) => (
//           <label key={col.key} className="edit-view-label">
//             <input
//               type="checkbox"
//               value={col.key}
//               checked={selectedColumns.includes(col.key)}
//               onChange={() => handleColumnChange(col.key)}
//               className="edit-view-checkbox"
//             />{" "}
//             {col.label}
//           </label>
//         ))}
//       </div>

//       <button className="edit-view-save-btn" onClick={handleSave}>
//         Save View
//       </button>
//     </div>
//   );
// };

// export default EditView;
