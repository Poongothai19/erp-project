// import { useState, useEffect } from "react";
// import axios from "axios";
// import "../styles/new_user.css";
// import BASE_URL from "../../url"; 

// export default function AddUserForm({ userId, onClose }) {
//   const [userData, setUserData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     role: "",
//     profile: ""
//   });
 
//   const handleChange = (e) => {
//     setUserData({ ...userData, [e.target.name]: e.target.value });
//   };
  
//   useEffect(() => {
//     if (userId) {
//       axios
//         .get(`${BASE_URL}/api/newuser/${userId}`)
//         .then((response) => {
//           setUserData(response.data);
//         })
//         .catch((error) => {
//           console.error("Error fetching user details:", error);
//         });
//     }
//   }, [userId]);

//   const handleSave = async () => {
//     try {
//       const token = localStorage.getItem("token");

//       if (!token) {
//         console.error("User is not authenticated!");
//         return;
//       }

//       if (userId) {
//         //  Update User (PUT request)
//         await axios.put(`${BASE_URL}/api/newuser/${userId}`, userData, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log("User updated successfully!");
//       } else {
//         //  Create New User (POST request)
//         await axios.post(`${BASE_URL}/api/newuser`, userData, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log("User created successfully!");
//       }

//       onClose();
//     } catch (error) {
//       console.error("Error saving user:", error.response ? error.response.data : error.message);
//     }
//   };

//   return (
//     <div className="new-user-form-overlay">
//       <div className="form-container">
//         <div className="form-header">
//           <h2>{userId ? "Edit User" : "Add New User"}</h2>
//           <button className="help-btn" onClick={() => console.log("Help clicked")}>
//             <span className="help-icon">?</span>
//           </button>
//         </div>
//         <div className="form-body">
//           <div className="form-group">
//             <label className="form-label">First Name<span className="required">*</span></label>
//             <input
//               type="text"
//               className="form-input"
//               name="firstName"
//               value={userData.firstName}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label className="form-label">Last Name<span className="required">*</span></label>
//             <input
//               type="text"
//               className="form-input"
//               name="lastName"
//               value={userData.lastName}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label className="form-label">Email<span className="required">*</span></label>
//             <input
//               type="email"
//               className="form-input"
//               name="email"
//               value={userData.email}
//               placeholder="Invitation will be sent to this email"
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label className="form-label">Role<span className="required">*</span></label>
//             <input
//               type="text"
//               className="form-input"
//               name="role"
//               value={userData.role}
//               onChange={handleChange}
//               required
//             />
//           </div>  
//         </div>
//         <div className="form-buttons">
//           <button className="cancel-btn" onClick={onClose}>Cancel</button>
//           <button className="save-btn" onClick={handleSave}>Save</button>
//         </div>
//       </div>
//     </div> //This was missing
//   );
// }
