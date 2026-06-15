// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../components/Navbar";
// import "../styles/groups.css";
// import { FaTrash } from "react-icons/fa";
// import BASE_URL from "../../url";
// import defaultProfile from "../Assets/images/user.jpg";
// import Swal from "sweetalert2";

// const GroupsPage = () => {
//   const [groups, setGroups] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState("Groups");

//   const handleTabClick = (tab) => {
//     setActiveTab(tab);
//   };

//   const [userRole, setUserRole] = useState(null);
//   useEffect(() => {
//     const user = JSON.parse(localStorage.getItem("user"));
//     if (user?.role) setUserRole(user.role);
//   }, []);


//   useEffect(() => {
//     const fetchGroups = async () => {
//       const token = localStorage.getItem("token");
//       setLoading(true);
//       setError(null);

//       try {
//         const response = await fetch(`${BASE_URL}/api/newgroup/groups`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });

//         const data = await response.json();
//         if (response.ok) {
//           setGroups(data.groups || []); // Assuming the API response returns groups in `data.groups`
//         } else {
//           setError(data.message || "Failed to fetch groups");
//         }
//       } catch (error) {
//         setError("Error fetching groups: " + error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchGroups();
//   }, []);
//   const getProfileUrl = (user) => {
//     if (!user?.userId) return "/default-profile.png";

//     const filename = user.profile?.split("?")[0];
//     const hasValidExtension = (name) =>
//       name && /\.(jpe?g|png|gif|webp)$/i.test(name);

//     if (filename && hasValidExtension(filename)) {
//       return filename.startsWith("http")
//         ? `${filename}?t=${Date.now()}`
//         : `${BASE_URL}/uploads/users/${user.userId}/${filename}?t=${Date.now()}`;
//     }

//     return `${BASE_URL}/defaults/users/${user.userId}.png`;
//   };
//   const handleDelete = async (groupId) => {
//     const confirm = window.confirm("Are you sure you want to delete this group?");
//     if (!confirm) return;

//     const token = localStorage.getItem("token");

//     try {
//       const response = await fetch(`${BASE_URL}/api/newgroup/groups/${groupId}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       const data = await response.json();
//       if (response.ok) {
//         setGroups((prev) => prev.filter((group) => group.groupId !== groupId));
//       } else {
//         Swal.fire(data.message || "Failed to delete group.");
//       }
//     } catch (err) {
//       console.error(err);
//       Swal.fire("Error deleting group.");
//     }
//   };
//   /* Return Block */
//   return (
//     <div>
//       <Navbar activeTab={activeTab} onTabClick={handleTabClick} />
//       <div className="groups-content">
//         {/* Header Section */}
//         <div className="groups-header">
//           <h2>Groups</h2>
//           <button
//             className="create-group-btn"
//             onClick={() => navigate("/Newgroup")}
//           >
//             Create New Group
//           </button>
//         </div>
//         {loading ? (
//           <p>Loading...</p>
//         ) : error ? (
//           <p className="error-message">{error}</p>
//         ) : groups.length > 0 ? (
//           <div className="group-list">
//             {groups.map((group, index) => (
//               <div className="group-card" key={index}>
//                 {/* <h4>{group.groupName}</h4>
//               <FaTrash
//               className="delete-icon"
//               onClick={() => handleDelete(group.groupId)}
//               title="Delete Group"
//               /> */}
//                 <div className="group-card-header">
//                   <h4>{group.groupName}</h4>
//                   {userRole === "admin" && (
//                     <FaTrash
//                       className="delete-icon"
//                       onClick={() => handleDelete(group.groupId)}
//                       title="Delete Group"
//                     />
//                   )}
//                 </div>
//                 <p>{group.description}</p>
//                 <p>
//                   Members:{" "}
//                   {group.users.length > 0
//                     ? group.users.map((user) => (
//                       <div key={user.userId} className="user-profile">
//                         <img
//                           src={getProfileUrl(user) || defaultProfile}
//                           alt={`${user.firstName} ${user.lastName}`}
//                           className="profile-picture"
//                           onError={(e) => {
//                             e.target.onerror = null; // prevent infinite loop
//                             e.target.src = defaultProfile;
//                           }}
//                         />
//                         <span>{user.firstName} {user.lastName} ({user.role})</span>
//                       </div>
//                     ))
//                     : "No members"}
//                 </p>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-group">No Group is Created</p>
//         )}
//         <div className="help-icon">
//           <a href="#">Help</a>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default GroupsPage;
