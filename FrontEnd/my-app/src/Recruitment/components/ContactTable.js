// import React from "react";
// import { Link } from "react-router-dom";

// export default function ContactTable({
//   contacts,
//   selectedRows,
//   selectedColumns,
//   handleSelectAll,
//   handleRowSelection,
//   availableColumns
// }) {
//   // Helper function to determine if all rows are selected
//   const allSelected = contacts.length > 0 && 
//     contacts.every(contact => selectedRows.includes(contact.contactId));

//     /* Return Block */

//   return (
//     <div className="table-responsive">
//       <table>
//         <thead>
//           <tr>
//             <th>
//               <input
//                 type="checkbox"
//                 checked={allSelected}
//                 onChange={handleSelectAll}
//               />
//             </th>
//             {/* Display only selected columns */}
//             {selectedColumns.map(column => (
//               <th key={column}>
//                 {availableColumns.find(col => col.key === column)?.label || column}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {contacts.length === 0 ? (
//             <tr>
//               <td colSpan={selectedColumns.length + 1} style={{ textAlign: "center" }}>
//                 No contacts found
//               </td>
//             </tr>
//           ) : (
//             contacts.map((contact) => (
//               <tr key={contact.contactId}>
//                 <td>
//                   <input
//                     type="checkbox"
//                     checked={selectedRows.includes(contact.contactId)}
//                     onChange={() => handleRowSelection(contact.contactId)}
//                   />
//                 </td>
//                 {selectedColumns.map(column => (
//                   <td key={`${contact.contactId}-${column}`}>
//                     {column === "firstName" || column === "lastName" ? (
//                       <Link to={`/ContactOverviewPage/${contact.contactId}`} style={{ color: "#006a66", textDecoration: "none" }}>
//                         {contact[column]}
//                       </Link>
//                     ) : (
//                       contact[column]
//                     )}
//                   </td>
//                 ))}
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }