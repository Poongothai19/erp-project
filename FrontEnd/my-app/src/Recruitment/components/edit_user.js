// import { useState, useEffect } from "react";
// import "../styles/edit_user.css";
// import { useNavigate } from "react-router-dom";
// import Swal from "sweetalert2";
// import BASE_URL from "../../url"; 

// export default function EditUser({ id, onClose }) {  //  Changed from userId to id
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     alias: "",
//     role: "",
//     email: "",
//     phone: "",
//     mobile: "",
//     fax: "",
//     website: "",
//     dob: "",
//     street: "",
//     city: "",
//     province: "",
//     postalCode: "",
//     country: ""
//   });
 
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   //  Fetch User Data
//   const fetchUserData = async (id) => {
//     const token = localStorage.getItem("token");
  
//     if (!token) {
//       console.error(" No token found. User must be logged in.");
//       Swal.fire("Unauthorized! Please log in again.");
//       return;
//     }
  
//     try {
//       setLoading(true);
  
//       const response = await fetch(`${BASE_URL}/api/edituser/${id}`, {
//         method: "GET", //  Fix this line
//         headers: {
//           "Authorization": `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
  
//       if (!response.ok) {
//         throw new Error("Failed to fetch user data");
//       }
  
//       const data = await response.json();
//       setFormData((prev) => ({ ...prev, ...data }));
//     } catch (error) {
//       console.error(" Error fetching user:", error);
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   //  Fetch user when `id` changes
//   useEffect(() => {
//     if (id) {  //  Using `id`
//       fetchUserData(id);
//     }
//   }, [id]);

//   // Handle input change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   //  Handle Save (Update User)
//   const handleSave = async () => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       Swal.fire("Unauthorized! Please log in again.");
//       return;
//     }

//     try {
//       setLoading(true);

//       const response = await fetch(`${BASE_URL}/api/edituser/${id}`, {  // `id` instead of `userId`
//         method: "PUT",
//         headers: {
//           "Authorization": `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to update user");
//       }

//       Swal.fire(" User updated successfully!");

//       //  Refresh user data after update
//       fetchUserData(id);
     
//       onClose(); // Close modal after save
//       navigate("/Users");
      
//     } catch (error) {
//       console.error("Error updating user:", error);
//       Swal.fire(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

// /* Return Block */

//   return (
//     <div className="edit-modal-overlay">
//       <div className="edit-user-form">
//         <h3>Edit User Information</h3>
//         <div className="edit-input-group">
//           <label>First Name</label>
//           <input
//             type="text"
//             name="firstName"
//             value={formData.firstName}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>Last Name <span className="edit-required">*</span></label>
//           <input
//             type="text"
//             name="lastName"
//             value={formData.lastName}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>Alias</label>
//           <input
//             type="text"
//             name="alias"
//             value={formData.alias}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//   <label>Role <span className="edit-required">*</span></label>
//   <input 
//     type="text" 
//     name="role"  // Add name attribute
//     value={formData.role} 
//     onChange={handleChange}  // Enable editing
//   />
// </div>
//         <div className="edit-input-group">
//           <label>Email <span className="edit-required">*</span></label>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>Phone</label>
//           <input
//             type="text"
//             name="phone"
//             value={formData.phone}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>Mobile</label>
//           <input
//             type="text"
//             name="mobile"
//             value={formData.mobile}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>Fax</label>
//           <input
//             type="text"
//             name="fax"
//             value={formData.fax}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>Website</label>
//           <input
//             type="text"
//             name="website"
//             value={formData.website}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>Date of birth</label>
//         <input
//   type="date"
//   name="dob"
//   value={formData.dob ? formData.dob.split("T")[0] : ""}
//   onChange={handleChange}
// />
// </div>
//          <div className="edit-input-group">
//           <label>Street</label>
//           <input
//             type="text"
//             name="street"
//             value={formData.street}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>City</label>
//           <input
//             type="text"
//             name="city"
//             value={formData.city}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>Province</label>
//           <input
//             type="text"
//             name="province"
//             value={formData.province}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>Postal Code</label>
//           <input
//             type="text"
//             name="postalCode"
//             value={formData.postalCode}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-input-group">
//           <label>Country</label>
//           <input
//             type="text"
//             name="country"
//             value={formData.country}
//             onChange={handleChange}
//           />
//         </div>
//         <div className="edit-modal-actions">
//         <button className="edit-cancel-btn" onClick={onClose}>
//             Cancel
//           </button>
//           <button className="edit-save-btn" onClick={handleSave}>
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
