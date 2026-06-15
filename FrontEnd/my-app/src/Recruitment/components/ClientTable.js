// import React from "react";
// import { Link } from "react-router-dom";
// import "../styles/clienttable.css"
// const ClientTable = ({
//   clients,
//   selectedColumns,
//   selectedRows,
//   toggleRowSelection,
//   handleSelectAll,
//   sortClients,
//   availableColumns,
// }) => {
//   return (
//     <table>
//       <thead>
//         <tr>
//           {/* Select All Checkbox */}
//           <th>
//             <input
//               type="checkbox"
//               checked={
//                 clients.length > 0 &&
//                 clients.every((client) => selectedRows.has(client.clientId))
//               }
//               onChange={handleSelectAll}
//             />
//           </th>
//           {/* Dynamically render only selected columns */}
//           {selectedColumns.map((colKey) => {
//             const colMeta = availableColumns.find((col) => col.key === colKey);
//             const label = colMeta?.label || colKey.replace(/([A-Z])/g, " $1").trim();
//             return (
//               <th key={`header-${colKey}`} onClick={() => sortClients(colKey)}>
//                 {label.charAt(0).toUpperCase() + label.slice(1)}
//               </th>
//             );
//           })}
//         </tr>
//       </thead>
//       <tbody>
//         {clients.length > 0 ? (
//           clients.map((client) => (
//             <tr key={`row-${client.clientId}`}>
//               {/* Row Checkbox */}
//               <td>
//                 <input
//                   type="checkbox"
//                   checked={selectedRows.has(client.clientId)}
//                   onChange={() => toggleRowSelection(client.clientId)}
//                 />
//               </td>

//               {/* Only selected columns */}
//               {selectedColumns.map((colKey) => {
//                 const value = client[colKey];
//                 return (
//                   <td key={`cell-${client.clientId}-${colKey}`}>
//                     {colKey === "clientName" ? (
//                       <Link to={`/ClientOverviewPage/${client.clientId}`}>
//                         {value}
//                       </Link>
//                     ) : typeof value === "string" ? (
//                       value
//                         .toLowerCase()
//                         .replace(/(^|\s)\w/g, (c) => c.toUpperCase())
//                     ) : (
//                       value ?? "N/A"
//                     )}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))
//         ) : (
//           <tr>
//             <td colSpan={selectedColumns.length + 1}>No clients available.</td>
//           </tr>
//         )}
//       </tbody>
//     </table>
//   );
// };

// export default ClientTable;