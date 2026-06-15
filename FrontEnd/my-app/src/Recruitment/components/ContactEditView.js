// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { availableColumns } from "../config/ContactConfig";
// import "../styles/Contact-edit.css";
// import "../styles/ManageViewDropdown.css";
// import Swal from "sweetalert2";
// import BASE_URL from "../../url";

// const EditView = () => {
//   const navigate = useNavigate();
//   const [viewName, setViewName] = useState("");
//   const [selectedColumns, setSelectedColumns] = useState([]);
//   const [savedViews, setSavedViews] = useState([]); 
  
//  //Fetch views on mount
 
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

//     try {
//       // Get token from localStorage
//       const token = localStorage.getItem("token");

//       // If no token, redirect to login page (or show an alert)
//       if (!token) {
//         Swal.fire("Please log in to save this view.");
//         navigate("/login");
//         return;
//       }

//       // Make the API request to save the view with the token in the headers
//       const response = await axios.post(
//         `${BASE_URL}/api/contacts/views/create`,
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

//       // Handle successful response
//       Swal.fire(response.data.message || "View saved successfully!");
//       navigate("/Contactlisting"); // Navigate to the contacts listing page
//     } catch (err) {
//       // Improved error handling
//       if (err.response) {
//         // If the error comes from the backend, show the response error message
//         console.error("Failed to save view:", err.response.data);
//         Swal.fire(`Failed to save view: ${err.response.data.message || err.message}`);
//       } else {
//         // If the error is not related to the backend (e.g., network error)
//         console.error("Failed to save view:", err.message);
//         Swal.fire(`Failed to save view: ${err.message}`);
//       }
//     }
//   };

// /* Return block */

//   return (
//     <div className="contact-edit-view-container">
//       <h2 className="contact-edit-view-title">Edit View</h2>

//       <div className="contact-edit-view-group">
//         <label className="contact-edit-view-label">View Name</label>
//         <input
//           type="text"
//           value={viewName}
//           onChange={(e) => setViewName(e.target.value)}
//           placeholder="Enter view name..."
//           className="contact-edit-view-input"
//         />
//       </div>

//       <div className="contact-edit-view-group">
//         <label className="contact-edit-view-label">Select Columns</label>
//         {availableColumns.map((col) => (
//           <label key={col.key} className="contact-edit-view-label">
//             <input
//               type="checkbox"
//               value={col.key}
//               checked={selectedColumns.includes(col.key)}
//               onChange={() => handleColumnChange(col.key)}
//               className="contact-edit-view-checkbox"
//             />{" "}
//             {col.label}
//           </label>
//         ))}
//       </div>

//       <button className="contact-edit-view-checkbox" onClick={handleSave}>
//         Save View
//       </button>
//     </div>
//   );
// };

// export default EditView;
