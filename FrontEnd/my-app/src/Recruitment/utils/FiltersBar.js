// import React from "react";
// import "../styles/FilterBar.css";

// const FilterBar = ({
//   availableFilters,
//   selectedFilters,
//   handleFilterToggle,
//   handleOptionChange,
//   handleValueChange,
//   handleApplyFilters,
// }) => {
//   return (
//     <div className="filter-section">
//       <h4>Filter Options</h4>

//       {/* Display Filters as Checkboxes with Inline Conditions */}
//       <div className="filters-list">
//         {Object.keys(availableFilters).map((filter) => {
//           const selectedFilter = selectedFilters.find((f) => f.filter === filter);
//           return (
//             <div key={filter} className={`filter-item ${selectedFilter ? "active" : ""}`}>
//               <div className="filter-label-container">
//                 {/* Checkbox in a separate div */}
//                 <div className="checkbox-container">
//                   <input
//                     type="checkbox"
//                     checked={!!selectedFilter}
//                     onChange={() => handleFilterToggle(filter)}
//                   />
//                 </div>
//                 <span className="filter-label">{filter}</span>
//               </div>

//               {/* Show Condition & Value Input Below Selected Filter */}
//               {selectedFilter && (
//                 <div className="filter-controls">
//                   <label>Condition:</label>
//                   <select
//                     value={selectedFilter.option}
//                     onChange={(e) => handleOptionChange(filter, e)}
//                   >
//                     <option value="">Select Condition</option>
//                     {availableFilters[filter]?.map((option) => (
//                       <option key={option} value={option}>
//                         {option}
//                       </option>
//                     ))}
//                   </select>

//                   {/* Show Input Field if Condition is Selected */}
//                   {selectedFilter.option && (
//                     <>
//                       <label>Enter Value:</label>
//                       <input
//                         type="text"
//                         value={selectedFilter.value}
//                         onChange={(e) => handleValueChange(filter, e)}
//                         placeholder="Enter value"
//                       />
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>

//       {/* Apply Filters Button */}
//       {selectedFilters.length > 0 && (
//         <button className="apply-filters-btn" onClick={handleApplyFilters}>
//           Apply Filters
//         </button>
//       )}
//     </div>
//   );
// };

// export default FilterBar;
