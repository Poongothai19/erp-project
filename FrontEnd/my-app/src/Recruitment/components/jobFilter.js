// import React, { useState } from "react";
// import FilterBar from "../utils/FiltersBar";
// import { applyFilter } from "./applyFilter";
// import { filters } from "../config/filterConfig";

// const JobFilter = ({ jobs, setFilteredJobs, onApplyFilters }) => {
//   const [selectedFilters, setSelectedFilters] = useState([]);

//   // Toggle filter selection (Checkbox)
//   const handleFilterToggle = (filter) => {
//     setSelectedFilters((prevFilters) => {
//       return prevFilters.some((f) => f.filter === filter)
//         ? prevFilters.filter((f) => f.filter !== filter) // Remove filter if unchecked
//         : [...prevFilters, { filter, option: "", value: "" }];
//     });
//   };

//   // Handle condition change
//   const handleOptionChange = (filter, event) => {
//     setSelectedFilters((prevFilters) =>
//       prevFilters.map((f) =>
//         f.filter === filter ? { ...f, option: event.target.value, value: "" } : f
//       )
//     );
//   };

//   // Handle input value change
//   const handleValueChange = (filter, event) => {
//     setSelectedFilters((prevFilters) =>
//       prevFilters.map((f) =>
//         f.filter === filter ? { ...f, value: event.target.value } : f
//       )
//     );
//   };

//   // Apply filters
//   const handleApplyFilters = () => {
//     let filteredJobs = jobs || []; // Ensure jobs is an array
//     selectedFilters.forEach(({ filter, option, value }) => {
//       filteredJobs = applyFilter(filteredJobs, filter, option, value, "job");
//     });

//     setFilteredJobs(filteredJobs);
//     if (onApplyFilters) onApplyFilters(filteredJobs);
//   };
// // Return Block
//   return (
//     <FilterBar
//       availableFilters={filters}
//       selectedFilters={selectedFilters}
//       handleFilterToggle={handleFilterToggle}
//       handleOptionChange={handleOptionChange}
//       handleValueChange={handleValueChange}
//       handleApplyFilters={handleApplyFilters}
//     />
//   );
// };

// export default JobFilter;

