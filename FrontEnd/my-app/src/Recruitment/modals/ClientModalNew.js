// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "../styles/ClientModalNew.css";
// import PhoneInput from "react-phone-input-2";
// import "react-phone-input-2/lib/style.css";
// import BASE_URL from "../../url";

// const ClientModal = ({ onClose, onSelectClient }) => {
//   const [showClientForm, setShowClientForm] = useState(false);
//   const [clients, setClients] = useState([]);
//   const [selectedClient, setSelectedClient] = useState("");
//   const [clientName, setClientName] = useState("");
//   const [contactNumber, setContactNumber] = useState("");
//   const [website, setWebsite] = useState("");
//   const [industry, setIndustry] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");


//   {/* Function to Handle Selection */ }
//   const handleClientSelection = (clientName) => {
//     console.log("Selected Client:", clientName);
//     setSelectedClient(clientName); //  Update the selected client state
//     onSelectClient(clientName); // Pass the selected client name back to the parent component
//     setTimeout(() => onClose(), 100); //  Close modal after selection
//   };

//   const filteredClients = clients.filter(client =>
//     client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
//   );
//   const fetchClients = async () => {
//     const token = localStorage.getItem("token"); // Retrieve token

//     if (!token) {
//       console.error("No token found in localStorage.");
//       alert("Unauthorized: Please log in again.");
//       return;
//     }

//     console.log(" Token Retrieved:", token); // Debugging

//     try {
//       const response = await axios.get(`${BASE_URL}/api/clients`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       console.log("Clients Fetched:", response.data);
//       setClients(response.data);
//     } catch (error) {
//       console.error(" Error fetching clients:", error);
//       alert("Failed to fetch clients. Please try again.");
//     }
//   };

//   // Ensure fetchClients is defined BEFORE useEffect
//   useEffect(() => {
//     fetchClients();
//   }, []);


//   // Save New Client to DB
//   const handleSave = async () => {
//     if (!clientName.trim()) {
//       alert("Client Name is required!");
//       return;
//     }

//     const token = localStorage.getItem("token");
//     if (!token) {
//       alert("Unauthorized: Please log in again.");
//       return;
//     }

//     const newClient = { clientName, contactNumber, website, industry };

//     try {
//       await axios.post(`${BASE_URL}/api/clients`, newClient, {
//         headers: { Authorization: `Bearer ${token}` }, //  Include token in headers
//       });

//       fetchClients(); // Refresh client list after saving
//       setShowClientForm(false); // Close form after saving
//       resetForm(); // Clear form fields
//     } catch (error) {
//       console.error("Error saving client:", error);
//       alert(`Failed to save client: ${error.response?.data?.message || "Server error"}`);
//     }
//   };


//   // Reset Form Fields
//   const resetForm = () => {
//     setClientName("");
//     setContactNumber("");
//     setWebsite("");
//     setIndustry("");
//   };

//   return (
//     <>
//       {!showClientForm ? (
//         <div className="client-modal-overlay" onClick={onClose}>
//           <div className="client-modal-popup" onClick={(e) => e.stopPropagation()}>
//             {/* Popup Header */}
//             <div className="client-modal-header">
//               <h4>Show:</h4>
//               <div className="client-modal-actions">
//                 <button
//                   className="client-modal-new-client-btn"
//                   onClick={() => setShowClientForm(true)}
//                 >
//                   + New Client
//                 </button>
//                 <input
//                   type="text"
//                   className="client-modal-search"
//                   placeholder="Search"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 <button className="client-modal-close" onClick={onClose}>✖</button>
//               </div>
//             </div>

//             {/* Popup Table */}
//             <div className="client-modal-content">
//               <table className="client-modal-table">
//                 <thead>
//                   <tr>
//                     <th></th>
//                     <th>Client Name</th>
//                     <th>Contact Number</th>
//                     <th>Website</th>
//                     <th>Industry</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredClients.length > 0 ? (
//                     filteredClients.map((client, index) => (
//                       <tr
//                         key={index}
//                         className={
//                           selectedClient === client.clientName ? "selected-row" : ""
//                         }
//                         onClick={() => handleClientSelection(client.clientName)}
//                       >
//                         <td>
//                           <input
//                             type="radio"
//                             name="selectedClient"
//                             className="client-modal-small-radio"
//                             value={client.clientName}
//                             checked={selectedClient === client.clientName}
//                             onChange={() => handleClientSelection(client.clientName)}
//                           />
//                         </td>
//                         <td>{client.clientName}</td>
//                         <td>{client.contactNumber || "N/A"}</td>
//                         <td>{client.website || "N/A"}</td>
//                         <td>{client.industry || "N/A"}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan="5">No clients found.</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="client-modal-form-overlay">
//           <div className="client-modal-form-container">
//             {/* Form Header */}
//             <div className="client-modal-form-header">
//               <h2>Quick Create: Client</h2>
//               <button
//                 className="client-modal-form-close-btn"
//                 onClick={() => setShowClientForm(false)}
//               >
//                 ✖
//               </button>
//             </div>

//             {/* Form Fields */}
//             <label className="client-modal-form-label">Client Name *</label>
//             <input
//               type="text"
//               className="client-modal-form-input1"
//               value={clientName}
//               onChange={(e) => setClientName(e.target.value)}
//               required
//             />

//             <label className="client-modal-form-label">Contact Number</label>
//             <PhoneInput
//               country={"us"}
//               enableSearch={true}
//               placeholder="Enter phone number"
//               containerStyle={{ width: "100%" }}
//               inputStyle={{ borderColor: "#087465",width: "100%", height: "45px", fontSize: "16px" }}
//               buttonStyle={{ width: "40px" }}
//               value={contactNumber}
//               onChange={setContactNumber}
//             />

//             <label className="client-modal-form-label">Website</label>
//             <input
//               type="url"
//               className="client-modal-form-input"
//               value={website}
//               onChange={(e) => setWebsite(e.target.value)}
//             />

//             <label className="client-modal-form-label">Industry</label>
//             <select
//               className="client-modal-form-select"
//               value={industry}
//               onChange={(e) => setIndustry(e.target.value)}
//             >
//               <option value="">- None -</option>
//               <option value="IT">IT</option>
//               <option value="Finance">Finance</option>
//               <option value="Healthcare">Healthcare</option>
//             </select>

//             {/* Form Buttons */}
//             <div className="client-modal-actions">
//               <button
//                 className="client-modal-cancel-btn"
//                 onClick={() => setShowClientForm(false)}
//               >
//                 Cancel
//               </button>
//               <button className="client-modal-save-associate-btn">
//                 Save and Associate
//               </button>
//               <button className="client-modal-save-btn" onClick={handleSave}>
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default ClientModal;


