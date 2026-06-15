// import React from "react";
// import { generatePageNumbers} from "../utils/paginationUtils"; // Import functions
// import "../styles/Pagination.css"; // Import CSS

// const Pagination = ({ currentPage, totalPages, onPageChange, rowsPerPage, setRowsPerPage }) => {
//   return (
//     <div className="pagination-wrapper">
//       {/* Pagination Controls */}
//       <div className="pagination-container">
//         <button
//           className={`pagination-button ${currentPage === 1 ? "disabled" : ""}`}
//           onClick={() => onPageChange(currentPage - 1)}
//           disabled={currentPage === 1}
//         >
//           Previous
//         </button>
//         {generatePageNumbers(currentPage, totalPages).map((page, index) => (
//           <button
//             key={index}
//             className={`pagination-button ${currentPage === page ? "active" : ""} ${page === "..." ? "pagination-dots" : ""}`}
//             onClick={() => page !== "..." && onPageChange(page)}
//           >
//             {page}
//           </button>
//         ))}

//         <button
//           className={`pagination-button ${currentPage === totalPages ? "disabled" : ""}`}
//           onClick={() => onPageChange(currentPage + 1)}
//           disabled={currentPage === totalPages}
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Pagination;
