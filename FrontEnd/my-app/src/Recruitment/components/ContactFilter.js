// import React, { useState } from "react";
// import FilterBar from "../utils/FiltersBar";
// import { applyFilter } from "./applyFilter";
// import { filters } from "../config/ContactConfig";

// const ContactFilter = ({ contacts, setFilteredContacts, onApplyFilters }) => {
//   const [selectedFilters, setSelectedFilters] = useState([]);

//   // Toggle filter selection (Checkbox)
//   const handleFilterToggle = (filter) => {
//     setSelectedFilters((prevFilters) => {
//       return prevFilters.some((f) => f.filter === filter)
//         ? prevFilters.filter((f) => f.filter !== filter)
//         : [...prevFilters, { filter, option: "", value: "" }];
//     });
//   };

//   // Handle condition (option) change
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

//   // Apply all selected filters
//   const handleApplyFilters = () => {
//     let filteredContacts = contacts || [];

//     selectedFilters.forEach(({ filter, option, value }) => {
//       filteredContacts = applyFilter(filteredContacts, filter, option, value, "contact");
//     });

//     if (typeof setFilteredContacts === "function") {
//       setFilteredContacts(filteredContacts);
//     } else {
//       console.error("setFilteredContacts is not a function. Make sure it's passed as a prop.");
//     }

//     if (onApplyFilters) onApplyFilters(filteredContacts);
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

// export default ContactFilter;
