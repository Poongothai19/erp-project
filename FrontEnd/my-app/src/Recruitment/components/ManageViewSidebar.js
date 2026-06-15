// import React from "react";
// import "../styles/ManageViewSidebar.css";
// import { IoClose } from "react-icons/io5";

// const ManageViewSidebar = ({ availableColumns, selectedColumns, setSelectedColumns, onClose }) => {
//   const allSelected = selectedColumns.length === availableColumns.length;

//   const handleSelectAll = () => {
//     setSelectedColumns(allSelected ? [] : availableColumns.map(col => col.key));
//   };

//   const handleChange = (e) => {
//     const { value, checked } = e.target;
//     setSelectedColumns(prev =>
//       checked ? [...prev, value] : prev.filter(col => col !== value)
//     );
//   };
//   /* Return Block */
//   return (
//     <div className="manage-sidebar-wrapper">
//       <div className="manage-sidebar-header">
//         <h3>Manage View</h3>
//         <IoClose className="manage-sidebar-close-btn" onClick={onClose} />
//       </div>
  
//       <label className="manage-sidebar-dropdown-item">
//         <input type="checkbox" checked={allSelected} onChange={handleSelectAll} />
//         Select All
//       </label>
  
//       {availableColumns.map(col => (
//         <label key={col.key} className="manage-sidebar-dropdown-item">
//           <input
//             type="checkbox"
//             value={col.key}
//             checked={selectedColumns.includes(col.key)}
//             onChange={handleChange}
//           />
//           {col.label}
//         </label>
//       ))}
  
      
//     </div>
//   );
// };  
// export default ManageViewSidebar;