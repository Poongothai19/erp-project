// import React, { useState } from "react";
// import FilterBar from "../utils/FiltersBar";
// import { applyFilter } from "./applyFilter";
// import { filters } from "../config/ClientConfig";

// const ClientFilter = ({ clients, setFilteredClients, onApplyFilters }) => {
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
//     let filteredClients = clients || []; // Ensure clients is an array
//     selectedFilters.forEach(({ filter, option, value }) => {
//       filteredClients = applyFilter(filteredClients, filter, option, value, "client");
//     });

//     setFilteredClients(filteredClients);
//     if (onApplyFilters) onApplyFilters(filteredClients);
//   };

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

// export default ClientFilter;
