
import React, { useState, useEffect, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  FaPencilAlt,
  FaStar,
  FaPlus,
  FaCamera,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import "../styles/user_page.css";
import AddUserForm from "../components/new_user";
import EditUser from "../components/edit_user";
import Groups from "./groups";
import LocaleInformation from "../components/LocaleInformation";
import moment from "moment-timezone";
import ProfileUpload from "../components/ProfileUpload";
import SignatureComponent from "../components/SignatureComponent";
import Swal from "sweetalert2";
import BASE_URL from "../../url";
import defaultProfile from "../Assets/images/user.jpg";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeUser, setActiveUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : {};
  });
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLocaleModalOpen, setIsLocaleModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [localeInfo, setLocaleInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("Users");

  const role = localStorage.getItem("role") || "default_role";

  const getProfileUrl = (user) => {
    if (!user?.id) return null;
    const filename = user.profile?.split("?")[0];
    const hasValidExtension = (name) =>
      name && /\.(jpe?g|png|gif|webp)$/i.test(name);

    if (filename && hasValidExtension(filename)) {
      return filename.startsWith("http")
        ? `${filename}?t=${Date.now()}`
        : `${BASE_URL}/uploads/users/${user.id}/${filename}?t=${Date.now()}`;
    }
    return `${BASE_URL}/defaults/users/${user.id}.png`;
  };

  const handleProfileUpdate = (profileFilename) => {
    if (!selectedUser) return;
    if (role !== "admin" && selectedUser.id !== activeUser?.id) {
      return alert("You are not authorized to update this profile.");
    }

    const updatedUser = { ...selectedUser, profile: profileFilename };
    setSelectedUser(updatedUser);
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === selectedUser.id ? updatedUser : user
      )
    );
    setIsProfileModalOpen(false);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) return alert("Unauthorized! Please log in again.");
      try {
        const url =
          role === "admin"
            ? `${BASE_URL}/api/auth/users`
            : `${BASE_URL}/api/auth/role/${role}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
        }

        let fetchedUsers = (await response.json()).users || [];

        if (role !== "admin") {
          fetchedUsers = fetchedUsers.filter((u) => u.id === activeUser.id);
          if (fetchedUsers.length === 0) return alert("User data not found.");
        }

        setUsers(fetchedUsers);
        const defaultUser = selectedUser
          ? fetchedUsers.find((u) => u.id === selectedUser.id)
          : fetchedUsers[0];

        setSelectedUser(defaultUser || null);
      } catch (error) {
        console.error("Error fetching users:", error.message);
      }
    };

    fetchUsers();
  }, [role, activeUser?.id]);

  useEffect(() => {
    const fetchLocaleInfo = async () => {
      if (!selectedUser?.id) return;
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/api/locale/${selectedUser.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setLocaleInfo(data);
      } catch (error) {
        console.error("Error fetching locale info:", error.message);
      }
    };
    fetchLocaleInfo();
  }, [selectedUser]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "Groups") navigate("/Group");
    else if (tab === "Users") navigate("/Users");
    else if (tab === "Activate Users") navigate("/ActivateUsers");
    else if (tab === "Free Trial") navigate("/FreeTrial");
  };

  const handleUserClick = (user) => setSelectedUser(user);
  const handleAddUser = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const handleCloseEditModal = () => setIsEditModalOpen(false);
  const handleCloseLocaleModal = () => setIsLocaleModalOpen(false);

  const handleEditClick = (user) => {
    setSelectedUserId(user.id);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/edituser/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete user");

      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));

      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }

      if (activeUser?.id === userId) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }

      alert("User deleted successfully.");
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user.");
    }
  };

  const handleUserUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const url =
        role === "admin"
          ? `${BASE_URL}/api/auth/users`
          : `${BASE_URL}/api/auth/role/${role}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to refresh users");

      const data = await response.json();
      setUsers(data.users);

      const updatedUser = data.users.find((user) => user.id === selectedUser?.id);
      setSelectedUser(updatedUser || data.users[0]);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error refreshing users:", error);
    }
  };

  const renderActiveComponent = () => {
    if (activeTab === "Groups") return <Groups />;

    return (
      <div className="user-container">
        <div className="user-list">
          {role === "admin" && (
            <button className="add-user-btn" onClick={handleAddUser}>
              <FaPlus /> Add New User
            </button>
          )}

          {showModal && role === "admin" && (
            <div className="modal-overlay">
              <AddUserForm onClose={handleCloseModal} />
            </div>
          )}

          {users.map((user) => {
            const imageUrl = getProfileUrl(user);

            // Non-admins can only see themselves
            if (role !== "admin" && user.id !== activeUser?.id) {
              return null;
            }

            return (
              <div
                key={user.id}
                className={`user-card ${selectedUser?.id === user.id ? "active-user" : ""}`}
                onClick={() => {
                  if (role === "admin" || user.id === activeUser?.id) {
                    handleUserClick(user);
                  }
                }}
              >
                <div className="user-avatar">
                  <img
                    src={imageUrl || defaultProfile}
                    alt="Profile"
                    className="avatar-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultProfile;
                    }}
                  />
                </div>
                <div>
                  <h4>
                    {user.firstName} {user.lastName}{" "}
                    {(role === "admin" || user.id === activeUser?.id) && <FaStar className="star-icon" />}
                  </h4>
                  <p>{user.role}</p>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="user-details">
          {selectedUser ? (
            <>
              <div className="user-header">
                <div className="user-avatar cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                  <img
                    src={getProfileUrl(selectedUser) || defaultProfile}
                    alt="Profile"
                    className="avatar-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultProfile;
                    }}
                  />
                </div>

                <div className="selectedUser">
                  <h2>
                    {selectedUser.firstName} {selectedUser.lastName}
                    <FaPencilAlt 
                      className="edit-icon" 
                      onClick={() => handleEditClick(selectedUser)} 
                    />
                    {role === "admin" && (
                      <FaTrash
                        className="trash-icon"
                        onClick={() => handleDeleteUser(selectedUser.id)}
                      />
                    )}
                  </h2>
                  <p>{selectedUser.role}</p>
                  <p>{selectedUser.email}</p>
                </div>
              </div>

              <h3 className="section-title-locale">
                Locale Information
                <FaPencilAlt 
                  className="edit-icon" 
                  onClick={() => setIsLocaleModalOpen(true)} 
                />
              </h3>

              <table className="user-info-table">
                <tbody>
                  <tr>
                    <td>Language</td>
                    <td><strong>{localeInfo?.language || "English (United Kingdom)"}</strong></td>
                  </tr>
                  <tr>
                    <td>Country Locale</td>
                    <td><strong>{localeInfo?.country || "United States"}</strong></td>
                  </tr>
                  <tr>
                    <td>Date Format</td>
                    <td><strong>{localeInfo?.date_format || "MM/DD/YYYY"}</strong></td>
                  </tr>
                  <tr>
                    <td>Time Format</td>
                    <td><strong>{localeInfo?.time_format || "12 Hours"}</strong></td>
                  </tr>
                  <tr>
                    <td>Time Zone</td>
                    <td>
                      <strong>
                        {localeInfo?.time_zone
                          ? `(UTC${moment.tz(localeInfo.time_zone).format("Z")}) ${localeInfo.time_zone}`
                          : "Not Set"}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
              <SignatureComponent
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                setUsers={setUsers}
                activeUser={activeUser}
                setActiveUser={setActiveUser}
              />
            </>
          ) : (
            <div className="no-user-selected">
              <p>No user selected or user data not found.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="user-page">
      <div className="user-management-content">
        <div className="header pinned-header">
          <nav className="navbar">
            {["Users", "Groups", "Activate Users", "Free Trial"].map((tab) => (
              <span
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </span>
            ))}
          </nav>
        </div>

        {renderActiveComponent()}
      </div>

      {isEditModalOpen && selectedUser && (
        <div className="modal-overlay">
          <EditUser id={selectedUser.id} onClose={handleUserUpdate} />
        </div>
      )}

      {isLocaleModalOpen && selectedUser && (
        <div className="modal-overlay">
          <LocaleInformation
            userId={selectedUser.id}
            onClose={handleCloseLocaleModal}
            onSave={(updatedData) => {
              const updatedUser = { ...selectedUser, ...updatedData };
              setSelectedUser(updatedUser);
              setLocaleInfo(updatedData);
              setUsers((prev) =>
                prev.map((user) =>
                  user.id === selectedUser.id ? { ...user, ...updatedData } : user
                )
              );
              handleCloseLocaleModal();
            }}
          />
        </div>
      )}

      {isProfileModalOpen && selectedUser && (
        <div className="modal-overlay">
          <ProfileUpload
            id={selectedUser.id}
            onUpload={handleProfileUpdate}
            onClose={() => setIsProfileModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;