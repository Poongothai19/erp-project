// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/NewGroup.css";
// import BASE_URL from "../../url";
// import defaultProfile from "../Assets/images/user.jpg";
// import Swal from "sweetalert2";

// const CreateGroup = () => {
//   const [groupName, setGroupName] = useState("");
//   const [groupDescription, setGroupDescription] = useState("");
//   const [availableUsers, setAvailableUsers] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();
//   useEffect(() => {
//     console.log("BASE_URL:", BASE_URL); //This prints it to the browser console
//   }, []);
//   useEffect(() => {
//     const fetchUsers = async () => {
//       const token = localStorage.getItem("token");
//       setLoading(true);
//       setError(null);


//       try {
//         const response = await fetch(`${BASE_URL}/api/auth/users`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });

//         const data = await response.json();
//         if (data.users) {
//           setAvailableUsers(data.users);
//         } else {
//           setError("Failed to fetch users");
//         }
//       } catch (error) {
//         setError("Error fetching users: " + error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, []);

//   const getProfileUrl = (user) => {
//     if (!user?.id) return "/default-profile.png";

//     const filename = user.profile?.split("?")[0];
//     const hasValidExtension = (name) =>
//       name && /\.(jpe?g|png|gif|webp)$/i.test(name);

//     if (filename && hasValidExtension(filename)) {
//       return filename.startsWith("http")
//         ? `${filename}?t=${Date.now()}`
//         : `${BASE_URL}/uploads/users/${user.id}/${filename}?t=${Date.now()}`;
//     }

//     return `${BASE_URL}/defaults/users/${user.id}.png`;
//   };

//   const handleSelectUser = (user) => {
//     if (user && !selectedUsers.some((u) => u.id === user.id)) {
//       setSelectedUsers([...selectedUsers, user]);
//     }
//   };

//   const handleRemoveUser = (userId) => {
//     setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
//   };

//   const handleSave = async () => {
//     if (!groupName || !groupDescription) {
//       Swal.fire("Please fill in all fields");
//       return;
//     }

//     const selectedUserIds = selectedUsers.map((user) => user.id);

//     // Send the data to the backend
//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch(`${BASE_URL}/api/newgroup/groups`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: groupName,
//           description: groupDescription,
//           selectedUserIds: selectedUserIds,
//         }),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         console.log("Group created successfully:", data);

//       } else {
//         setError(data.message || "Failed to create group");
//       }
//       navigate("/Group");

//     } catch (error) {
//       setError("Error creating group: " + error.message);
//     }
//   };

//   return (
//     <div className="container">
//       <h1>Create New Group</h1>

//       <div className="form-section">
//         <h3>New Group</h3>
//         <label>Group Name</label>
//         <input
//           type="text"
//           value={groupName}
//           onChange={(e) => setGroupName(e.target.value)}
//           className="input-field"
//         />

//         <label>Group Description</label>
//         <textarea
//           value={groupDescription}
//           onChange={(e) => setGroupDescription(e.target.value)}
//           className="textarea-field"
//         ></textarea>
//       </div>

//       <div className="group-source">
//         <h3>Group Sources</h3>
//         <label>Select Group Source Type</label>
//         <select className="dropdown">
//           <option>Users</option>
//         </select>

//         <div className="list-container">
//           <div className="list-box">
//             <p>Available</p>
//             {loading ? (
//               <p>Loading...</p>
//             ) : error ? (
//               <p>{error}</p>
//             ) : (
//               <div className="custom-list">
//                 {availableUsers.length > 0 ? (
//                   availableUsers.map((user) => {
//                     const isSelected = selectedUsers.some(
//                       (u) => u.id === user.id
//                     );
//                     return (
//                       <div
//                         key={user.id}
//                         className={`user-item ${isSelected ? "disabled" : ""
//                           }`}
//                         onClick={() =>
//                           !isSelected && handleSelectUser(user)
//                         }
//                       >
//                         <img
//                           src={getProfileUrl(user) || defaultProfile}
//                           onError={(e) => {
//                             e.target.onerror = null;
//                             e.target.src = defaultProfile;
//                           }}
//                           alt={user.role}
//                           className="user-img"
//                         />
//                         <div className="user-info">
//                           <div className="user-role">{user.role}</div>
//                           <div className="user-email">{user.email}</div>
//                         </div>
//                       </div>
//                     );
//                   })
//                 ) : (
//                   <div className="no-user">No users available</div>
//                 )}
//               </div>
//             )}
//           </div>

//           <div className="list-box">
//             <p>Selected</p>
//             <div className="custom-list">
//               {selectedUsers.length > 0 ? (
//                 selectedUsers.map((user, index) => (
//                   <div
//                     key={index}
//                     className="user-item"
//                     onClick={() => handleRemoveUser(user.id)}
//                   >
//                     <img
//                       src={getProfileUrl(user) || defaultProfile}
//                       onError={(e) => {
//                         e.target.onerror = null;
//                         e.target.src = defaultProfile;
//                       }}
//                       alt={user.name}
//                       className="user-img"
//                     />

//                     <div className="user-info">
//                       <p className="user-name">
//                         {user.role || "Unnamed User"}
//                       </p>
//                       <p className="user-email">
//                         {user.email || "No email available"}
//                       </p>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <p className="no-user">--None--</p>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="buttons">
//         <button className="group-cancel-btn" onClick={() => navigate("/")}>
//           Cancel
//         </button>
//         <button
//           className="group-save-btn"
//           onClick={handleSave}
//           disabled={!groupName || !groupDescription}
//         >
//           Save
//         </button>
//       </div>
//     </div>
//   );
// };

// export default CreateGroup;