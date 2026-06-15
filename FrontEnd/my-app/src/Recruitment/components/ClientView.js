// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/ClientView.css";
// import { toast } from "react-toastify";

// const ManageClientView = () => {
//   const [viewName, setViewName] = useState("Untitled View");
//   const [viewDescription, setViewDescription] = useState("");
//   const [views, setViews] = useState([]);
//   const [selectedView, setSelectedView] = useState("");
//   const [selectedOptions, setSelectedOptions] = useState(() => {
//     return JSON.parse(localStorage.getItem("selectedColumns")) || [
//       "Client Name",
//       "Billing Code",
//       "Last Activity Time",
//       "Industry",
//       "Fax",
//       "Billing Street",
//       "Contact Number",
//       "Created Time",
//       "Created By",
//     ];
//   });

//   const [searchTerm, setSearchTerm] = useState(""); // Search filter state

//   const [availableOptions, setAvailableOptions] = useState([
//     "About",
//     "Last emailed",
//     "Modified By",
//     "Modified Time",
//   ]);

//   const handleSelect = (option) => {
//     setAvailableOptions(availableOptions.filter((item) => item !== option));
//     setSelectedOptions([...selectedOptions, option]);
//   };

//   const handleRemove = (option) => {
//     setSelectedOptions(selectedOptions.filter((item) => item !== option));
//     setAvailableOptions([...availableOptions, option]);
//   };

//   // Filter available options based on search term
//   const filteredOptions = availableOptions.filter((option) =>
//     option.toLowerCase().includes(searchTerm.toLowerCase())
//   );
//   const navigate = useNavigate();
//   const handleSave = () => {
//     localStorage.setItem("selectedColumns", JSON.stringify(selectedOptions));
//     toast.success("View saved successfully!");
//     navigate("/Clients");
//   };

//   const [criteriaList, setCriteriaList] = useState([
//     { id: 1, inputValue: "", selectedOption1: "None", selectedOption2: "None" }
//   ]);

//   const addCriteria = () => {
//     setCriteriaList([
//       ...criteriaList,
//       {
//         id: criteriaList.length + 1,
//         inputValue: "",
//         selectedOption1: "None",
//         selectedOption2: "None"
//       }
//     ]);
//   };

//   const removeCriteria = (id) => {
//     setCriteriaList((prevList) =>
//       prevList
//         .filter((item) => item.id !== id)
//         .map((item, index) => ({ ...item, id: index + 1 }))
//     );
//   };
//   const handleInputChange = (id, value) => {
//     setCriteriaList(
//       criteriaList.map((criteria) =>
//         criteria.id === id ? { ...criteria, inputValue: value } : criteria
//       )
//     );
//   };

//   const handleSelectChange = (id, field, value) => {
//     setCriteriaList(
//       criteriaList.map((criteria) =>
//         criteria.id === id ? { ...criteria, [field]: value } : criteria
//       )
//     );
//   };
//   const handleSaveView = () => {
//     if (!viewName.trim) {
//       toast.error("View name cannot be empty!");
//       return;
//     }

//     const storedViews = JSON.parse(localStorage.getItem("views")) || [];

//     if (storedViews.includes(viewName)) {
//       toast.error("View name already exists!");
//       return;
//     }

//     const updatedViews = [...storedViews, viewName];

//     localStorage.setItem("views", JSON.stringify(updatedViews));

//     setViewName("");
//     setSelectedView(viewName);
//     toast.success("View saved successfully!");
//     navigate("/Clients"); // Navigate back to Clients page after saving
//   };

// /* Return Block */

//   return (
//     <div className="manage-client">
//       <div className="header1">
//         <h1>Edit View</h1>
//       </div>
//       <div className="edit">
//         <input
//           type="text"
//           className="view-name-input"
//           placeholder="Enter View Name"
//           value={viewName}
//           onChange={(e) => setViewName(e.target.value)}
//         />
//         <input
//           type="text"
//           className="view-description-input"
//           placeholder="Add Description"
//           value={viewDescription}
//           onChange={(e) => setViewDescription(e.target.value)}
//         />
//       </div>

//       <div>
//         <b><label className="criteria-title">Specify Criteria</label></b>
//         {criteriaList.map((criteria, index) => (
//           <div key={criteria.id} className="criteria-section">
//             <span>{criteria.id}.</span>
//             <select
//               className="criteria-dropdown-menu"
//               value={criteria.selectedOption1}
//               onChange={(e) => handleSelectChange(criteria.id, "selectedOption1", e.target.value)}
//             >
//               <option>None</option>
//               <option>Option 1</option>
//               <option>Option 2</option>
//             </select>
//             <select
//               className="criteria-dropdown-menu"
//               value={criteria.selectedOption2}
//               onChange={(e) => handleSelectChange(criteria.id, "selectedOption2", e.target.value)}
//             >
//               <option>None</option>
//               <option>Option A</option>
//               <option>Option B</option>
//             </select>
//             <input
//               type="text"
//               className="input1"
//               value={criteria.inputValue}
//               onChange={(e) => handleInputChange(criteria.id, e.target.value)}
//             />

//             {/* "-" button for deleting rows, starts from the second row */}
//             {criteriaList.length > 1 && (
//               <button className="remove-criteria" onClick={() => removeCriteria(criteria.id)}>-</button>
//             )}

//             {/* "+" button only appears on the last row */}
//             {criteriaList.length - 1 === index && (
//               <button className="add-criteria" onClick={addCriteria}>+</button>
//             )}
//           </div>
//         ))}

//       </div>

//       {/* Columns Selection */}
//       <div className="columns-container">
//         {/* Available Columns */}
//         <div className="available-column">
//           <h3>Available</h3>
//           <input
//             type="text"
//             className="search-box"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <div className="scroll-container">
//             <ul>
//               {filteredOptions.length > 0 ? (
//                 filteredOptions.map((option) => (
//                   <li key={option} onClick={() => handleSelect(option)}>
//                     {option}
//                   </li>
//                 ))
//               ) : (
//                 <li className="no-results">No matching results</li>
//               )}
//             </ul>
//           </div>
//         </div>

//         {/* Selected Columns */}
//         <div className="selected-column">
//           <h3>Selected</h3>
//           <div className="scroll-container">
//             <ul>
//               {selectedOptions.map((option) => (
//                 <li key={option} onClick={() => handleRemove(option)}>
//                   {option} <span className="remove">✖</span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       </div>

//       {/* Footer Section */}
//       <footer
//         style={{
//           display: "flex",
//           justifyContent: "flex-end",
//           gap: "10px",
//         }}
//       >
//         <button className="cancel-btn">Cancel</button>
//         <button className="save-btn" onClick={handleSaveView}>Save</button>
//       </footer>
//     </div>
//   );
// };

// export default ManageClientView;
