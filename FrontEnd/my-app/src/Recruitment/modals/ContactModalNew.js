

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "../styles/ContactModalNew.css";
// import PhoneInput from "react-phone-input-2";
// import "react-phone-input-2/lib/style.css";
// import BASE_URL from "../../url";

// const Contact = ({ onClose, onSelectContact }) => {
//   const [showContactForm, setShowContactForm] = useState(false);
//   const [contacts, setContacts] = useState([]);
//   const [selectedContact, setSelectedContact] = useState(null);
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [email, setEmail] = useState("");
//   const [jobTitle, setJobTitle] = useState("");
//   const [workPhone, setWorkPhone] = useState("");
//   const [mobile, setMobile] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");

//   const handleContactSelection = (contact) => {
//     console.log("Selected Contact:", contact);
//     setSelectedContact(contact); // Update the selected contact state
//     onSelectContact(contact); // Pass the selected contact back to the parent component
//     setTimeout(() => onClose(), 100); // Close modal after selection
//   };

//   const filteredContacts = contacts.filter(contact =>
//     `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const fetchContacts = async () => {
//     const token = localStorage.getItem("token"); // Retrieve token

//     if (!token) {
//       console.error("No token found in localStorage.");
//       alert("Unauthorized: Please log in again.");
//       return;
//     }

//     console.log("Token Retrieved:", token); // Debugging

//     try {
//       const response = await axios.get(`${BASE_URL}/api/contacts`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       console.log("Contacts Fetched:", response.data);
//       setContacts(response.data);
//     } catch (error) {
//       console.error("Error fetching contacts:", error);
//       alert("Failed to fetch contacts. Please try again.");
//     }
//   };

//   // Ensure fetchContacts is defined BEFORE useEffect
//   useEffect(() => {
//     fetchContacts();
//   }, []);

//   // Save New Contact to DB
//   const handleSave = async () => {
//     if (!firstName.trim() || !email.trim()) {
//       alert("First Name and Email are required!");
//       return;
//     }

//     const token = localStorage.getItem("token");
//     if (!token) {
//       alert("Unauthorized: Please log in again.");
//       return;
//     }

//     const newContact = {
//       firstName,
//       lastName,
//       email,
//       jobTitle,
//       workPhone,
//       mobile,
//     };

//     try {
//       await axios.post(`${BASE_URL}/api/contacts`, newContact, {
//         headers: { Authorization: `Bearer ${token}` }, // Include token in headers
//       });

//       fetchContacts(); // Refresh contact list after saving
//       setShowContactForm(false); // Close form after saving
//       resetForm(); // Clear form fields
//     } catch (error) {
//       console.error("Error saving contact:", error);
//       alert(`Failed to save contact: ${error.response?.data?.message || "Server error"}`);
//     }
//   };

//   // Reset Form Fields
//   const resetForm = () => {
//     setFirstName("");
//     setLastName("");
//     setEmail("");
//     setJobTitle("");
//     setWorkPhone("");
//     setMobile("");
//   };

//   return (
//     <div className="contact-overlay" onClick={showContactForm ? null : onClose}>
//       {showContactForm ? (
//         // Contact Form
//         <div className="contact-form-container" onClick={(e) => e.stopPropagation()}>
//           {/* Form Header */}
//           <div className="contact-form-header">
//             <h2>Quick Create: Contact</h2>
//             <button
//               className="contact-form-close-btn"
//               onClick={() => setShowContactForm(false)}
//             >
//               ✖
//             </button>
//           </div>

//           {/* Form Fields */}
//           <label className="contact-form-label">First Name *</label>
//           <input
//             type="text"
//             className="contact-form-input1"
//             value={firstName}
//             onChange={(e) => setFirstName(e.target.value)}
//             required
//           />

//           <label className="contact-form-label">Last Name</label>
//           <input
//             type="text"
//             className="contact-form-input"
//             value={lastName}
//             onChange={(e) => setLastName(e.target.value)}
//           />

//           <label className="contact-form-label">Email *</label>
//           <input
//             type="email"
//             className="contact-form-input"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />

//           <label className="contact-form-label">Job Title</label>
//           <input
//             type="text"
//             className="contact-form-input"
//             value={jobTitle}
//             onChange={(e) => setJobTitle(e.target.value)}
//           />

//           <label className="contact-form-label">Work Phone</label>
//           <PhoneInput
//             country={"us"}
//             enableSearch={true}
//             placeholder="Enter work phone number"
//             containerStyle={{ width: "100%" }}
//             inputStyle={{ borderColor: "#087465", width: "100%", height: "45px", fontSize: "16px" }}
//             buttonStyle={{ width: "40px" }}
//             value={workPhone}
//             onChange={setWorkPhone}
//           />

//           <label className="mobile contact-form-label">Mobile</label>
//           <PhoneInput
//             country={"us"}
//             enableSearch={true}
//             placeholder="Enter mobile number"
//             containerStyle={{ width: "100%" }}
//             inputStyle={{ borderColor: "#087465", width: "100%", height: "45px", fontSize: "16px" }}
//             buttonStyle={{ width: "40px" }}
//             value={mobile}
//             onChange={setMobile}
//           />

//           {/* Form Buttons */}
//           <div className="contact-actions">
//             <button
//               className="contact-cancel-btn"
//               onClick={() => setShowContactForm(false)}
//             >
//               Cancel
//             </button>
//             <button className="contact-save-associate-btn">
//               Save and Associate
//             </button>
//             <button className="contact-save-btn" onClick={handleSave}>
//               Save
//             </button>
//           </div>
//         </div>
//       ) : (
//         // Contacts List Popup
//         <div className="contact-popup" onClick={(e) => e.stopPropagation()}>
//           {/* Popup Header */}
//           <div className="contact-header">
//             <h4>Show:</h4>
//             <div className="contact-actions">
//               <button
//                 className="contact-new-btn"
//                 onClick={() => setShowContactForm(true)}
//               >
//                 + New Contact
//               </button>
//               <input
//                 type="text"
//                 className="contact-search"
//                 style={{background:"#eaeaea" }}
//                 placeholder="Search"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               <button className="contact-close" onClick={onClose}>✖</button>
//             </div>
//           </div>

//           {/* Popup Table */}
//           <div className="contact-content">
//             <table className="contact-table">
//               <thead>
//                 <tr>
//                   <th></th>
//                   <th>Contact Name</th>
//                   <th>Email</th>
//                   <th>Job Title</th>
//                   <th>Work Phone</th>
//                   <th>Mobile</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredContacts.length > 0 ? (
//                   filteredContacts.map((contact, index) => (
//                     <tr
//                       key={index}
//                       className={
//                         selectedContact?.email === contact.email ? "selected-row" : ""
//                       }
//                       onClick={() => handleContactSelection(contact)}
//                     >
//                       <td>
//                         <input
//                           type="radio"
//                           name="selectedContact"
//                           className="contact-small-radio"
//                           checked={selectedContact?.email === contact.email}
//                           onChange={() => handleContactSelection(contact)}
//                         />
//                       </td>
//                       <td>{contact.firstName} {contact.lastName}</td>
//                       <td>{contact.email || "N/A"}</td>
//                       <td>{contact.jobTitle || "N/A"}</td>
//                       <td>{contact.workPhone || "N/A"}</td>
//                       <td>{contact.mobile || "N/A"}</td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="6">No contacts found.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Contact;