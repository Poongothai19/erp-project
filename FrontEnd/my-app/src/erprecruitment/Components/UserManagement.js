import React, { useState, useEffect } from 'react';
 
import { 
  LuUsers, 
  LuUserPlus, 
  LuSearch, 
  LuEllipsisVertical,
  LuPen, 
  LuTrash2, 
  LuEye, 
  LuEyeOff,
  LuMail, 
  LuPhone, 
  LuX,
  LuSave,
  LuUser,
  LuShield,
  LuCrown,
  LuUserCheck,
  LuClock,
  LuCalendar,
  LuChartBar,
  LuLogIn,
  LuLogOut
} from 'react-icons/lu';

import axios from 'axios';
import BASE_URL from '../../url';
import '../styles/UserManagement.css';

const UserManagement = () => {
   
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Add state for session data
  const [userSessions, setUserSessions] = useState({});
  const [sessionStats, setSessionStats] = useState({});
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [selectedUserForSessions, setSelectedUserForSessions] = useState(null);
  const [sessionPeriod, setSessionPeriod] = useState('daily');
  
  // Password visibility states
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    role: 'user',
    password: '',
    employeeId: ''
  });

  const roles = [
    { value: 'admin', label: 'Admin', icon: <LuShield />, color: '#dc3545' },
    { value: 'manager', label: 'Manager', icon: <LuCrown />, color: '#0eb381ff' },
    { value: 'teamlead', label: 'Team Lead', icon: <LuUserCheck />, color: '#ffc107' },
    { value: 'employee', label: 'employee', icon: <LuUser />, color: '#17a2b8' },
    { value: 'user', label: 'User', icon: <LuUser />, color: '#6c757d' },
    { value: 'external', label: 'External User', icon: <LuUser />, color: '#9b59b6' }
  ];

  const statuses = [
    { value: 'active', label: 'Active', color: '#20c997' },
    { value: 'inactive', label: 'Inactive', color: '#de6b76ff' }
  ];

  // Fetch users from the existing /api/auth/users endpoint
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}/api/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Fetched users:", response.data);
        
        // Handle both possible response formats
        const userData = response.data.users || response.data || [];
        
        // SET USERS FIRST
        setUsers(userData);
        setFilteredUsers(userData);
        setLoading(false);

        console.log("=== USER DATA DEBUG ===");
        userData.forEach(user => {
          console.log(`User: ${user.firstName} ${user.lastName}`, {
            id: user.id,
            lastLogin: user.lastLogin,
            lastLogout: user.lastLogout,
            hasLastLogin: !!user.lastLogin,
            hasLastLogout: !!user.lastLogout
          });
        });
        console.log("=== END DEBUG ===");
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Add this useEffect after your existing useEffects
  useEffect(() => {
    const fetchAllSessionStats = async () => {
      if (users.length > 0) {
        try {
          const token = localStorage.getItem('token');
          const statsPromises = users.map(async (user) => {
            try {
              const response = await axios.get(
                `${BASE_URL}/api/auth/user-session-stats/${user.id}?period=monthly`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return { userId: user.id, stats: response.data };
            } catch (err) {
              console.error(`Error fetching stats for user ${user.id}:`, err);
              return { userId: user.id, stats: { totalHours: 0 } };
            }
          });

          const statsResults = await Promise.all(statsPromises);
          const newStats = {};
          statsResults.forEach(result => {
            newStats[result.userId] = result.stats;
          });
          setSessionStats(newStats);
        } catch (error) {
          console.error("Error fetching session stats:", error);
        }
      }
    };

    fetchAllSessionStats();
  }, [users]);

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.mobile && user.mobile.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // For status filtering
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[4]; // Default to 'user'
  };

  const getStatusColor = (status) => {
    return statuses.find(s => s.value === status)?.color || '#20c997';
  };

  const fetchUserSessionStats = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/auth/user-session-stats/${userId}?period=${sessionPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSessionStats(prev => ({
        ...prev,
        [userId]: response.data
      }));
    } catch (err) {
      console.error("Error fetching session stats:", err);
    }
  };

  // Add function to open session details modal
  const openSessionModal = async (user) => {
    setSelectedUserForSessions(user);
    setSessionModalOpen(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/auth/user-sessions/${user.id}?period=${sessionPeriod}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter sessions based on the selected period
      const filteredSessions = filterSessionsByPeriod(response.data.sessions || [], sessionPeriod);
      
      setUserSessions(prev => ({
        ...prev,
        [user.id]: {
          ...response.data,
          sessions: filteredSessions
        }
      }));
    } catch (err) {
      console.error("Error fetching session details:", err);
    }
  };

  // Add this helper function to filter sessions by period
  const filterSessionsByPeriod = (sessions, period) => {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return sessions;
    }

    return sessions.filter(session => {
      const sessionDate = new Date(session.login_time || session.createdAt);
      return sessionDate >= startDate;
    });
  };

  useEffect(() => {
    if (sessionModalOpen && selectedUserForSessions) {
      openSessionModal(selectedUserForSessions);
    }
  }, [sessionPeriod]);

  // Add new user - Fixed to use correct endpoint
  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.email) {
      alert('Please fill in all required fields (First Name, Email)');
      return;
    }

    if (!newUser.password || newUser.password.trim() === '') {
      alert('Please enter a password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // Employee role uses email as username, others use firstName
      const username = newUser.role === 'employee' 
        ? newUser.email.trim().toLowerCase() 
        : newUser.firstName.trim().toLowerCase().replace(/\s+/g, '');
      
      const userData = {
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName?.trim() || '',
        email: newUser.email.trim().toLowerCase(),
        mobile: newUser.mobile?.trim() || '',
        role: newUser.role,
        username: username, // Employee: email, Others: firstName
        password: newUser.password.trim(),
        employeeId: newUser.employeeId?.trim() || ''
      };
      
      const token = localStorage.getItem('token');
      
      // Use the correct endpoint that we created
      const response = await axios.post(`${BASE_URL}/api/auth/create-user`, userData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("User created successfully:", response.data);

      // Refresh users list
      const usersResponse = await axios.get(`${BASE_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUsers = usersResponse.data.users || usersResponse.data || [];
      setUsers(updatedUsers);
      
      // Reset form
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        role: 'user',
        password: ''
      });
      
      setShowAddModal(false);
      alert(`User added successfully! They can now login with username: ${username}`);
      
    } catch (err) {
      console.error("Error adding user:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to add user. Please try again.';
      alert(errorMessage);
    }
  };

  // Enhanced Edit user with role and password support
  const handleEditUser = async () => {
    if (!selectedUser) return;

    if (!selectedUser.firstName || !selectedUser.email) {
      alert('Please fill in all required fields (First Name, Email)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(selectedUser.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const userData = {
        firstName: selectedUser.firstName.trim(),
        lastName: selectedUser.lastName?.trim() || '',
        email: selectedUser.email.trim().toLowerCase(),
        mobile: selectedUser.mobile?.trim() || '',
        role: selectedUser.role, // Include role in update
        employeeId: selectedUser.EmployeeId || selectedUser.employeeId || '', // Sync EmployeeId
      };

      // Include password only if it's been changed
      if (selectedUser.password && selectedUser.password.trim()) {
        userData.password = selectedUser.password.trim();
      }

      const token = localStorage.getItem('token');
      
      // Use existing update endpoint
      await axios.put(`${BASE_URL}/api/auth/user/${selectedUser.id}`, userData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh users list
      const usersResponse = await axios.get(`${BASE_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUsers = usersResponse.data.users || usersResponse.data || [];
      setUsers(updatedUsers);
      setShowEditModal(false);
      setSelectedUser(null);
      alert('User updated successfully!');
      
    } catch (err) {
      console.error("Error updating user:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to update user. Please try again.';
      alert(errorMessage);
    }
  };

  const toggleDropdown = (userId) => {
    setDropdownOpen(dropdownOpen === userId ? null : userId);
  };

  const openEditModal = (user) => {
    setSelectedUser({ 
      ...user,
      password: '', // Initialize password field as empty
      employeeId: user.EmployeeId || user.employeeId || ''
    });
    setShowEditModal(true);
    setDropdownOpen(null);
  };

  const handleDeleteUser = async (user) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete ${user.firstName} ${user.lastName}?\n\nThis action cannot be undone!`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${BASE_URL}/api/auth/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh users list
      const usersResponse = await axios.get(`${BASE_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUsers = usersResponse.data.users || usersResponse.data || [];
      setUsers(updatedUsers);
      setDropdownOpen(null);
      alert(`User ${user.firstName} ${user.lastName} has been permanently deleted.`);
      
    } catch (err) {
      console.error("Error deleting user:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to delete user. Please try again.';
      alert(errorMessage);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      role: 'user',
      employeeId: '',
      password: ''
    });
    setShowAddPassword(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setShowEditPassword(false);
  };

  if (loading) return <div className="user-management-container">Loading users...</div>;
  if (error) return <div className="user-management-container">Error: {error}</div>;

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="user-management-header">
        <div className="user-management-header-left">
          <LuUsers className="user-management-header-icon" />
          <h1 className="user-management-title">User Management</h1>
          <span className="user-management-count">{filteredUsers.length} users</span>
        </div>
        <button className="user-management-add-button" onClick={() => setShowAddModal(true)}>
          <LuUserPlus />
          Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="user-management-filters-container">
        <div className="user-management-search-container">
          <LuSearch className="user-management-search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="user-management-search-input"
          />
        </div>
        <div className="user-management-filter-group">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="user-management-filter-select"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="user-management-filter-select"
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="user-management-table-container">
        <table className="user-management-table">
          <thead className="user-management-table-header">
            <tr>
              <th className="user-management-th">User</th>
              <th className="user-management-th">Contact</th>
              <th className="user-management-th">Role</th>
              <th className="user-management-th">Status</th>
              <th className="user-management-th">Last Login</th>
              <th className="user-management-th">Last Logout</th>
              <th className="user-management-th">Total Hours</th>
              <th className="user-management-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user.id} className="user-management-table-row">
                <td className="user-management-td">
                  <div className="user-management-user-cell">
                    <div className="user-management-avatar">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div>
                      <div className="user-management-user-name">{user.firstName} {user.lastName}</div>
                      <div className="user-management-user-email">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="user-management-td">
                  <div className="user-management-contact-info">
                    <div className="user-management-contact-item">
                      <LuMail size={12} />
                      {user.email}
                    </div>
                    {user.mobile && (
                      <div className="user-management-contact-item">
                        <LuPhone size={12} />
                        Mobile: {user.mobile}
                      </div>
                    )}
                  </div>
                </td>
                <td className="user-management-td">
                  <div className="user-management-role-cell">
                    <span className="user-management-role-icon" style={{color: getRoleInfo(user.role).color}}>
                      {getRoleInfo(user.role).icon}
                    </span>
                    {getRoleInfo(user.role).label}
                  </div>
                </td>
                <td className="user-management-td">
                  <span className="user-management-status-badge" style={{backgroundColor: getStatusColor(user.status || 'active')}}>
                    {user.status || 'Active'}
                  </span>
                </td>
                <td className="user-management-td">
                  <div className="session-tracker-cell">
                    <LuLogIn size={14} className="session-login-icon" />
                    <span className="session-time-display">
                      {user.lastLogin 
                        ? `${new Date(user.lastLogin).toLocaleDateString()} ${new Date(user.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                        : 'Never'
                      }
                    </span>
                  </div>
                </td>
                <td className="user-management-td">
                  <div className="session-tracker-cell">
                    <LuLogOut size={14} className="session-logout-icon" />
                    <span className="session-time-display">
                      {user.lastLogout 
                        ? `${new Date(user.lastLogout).toLocaleDateString()} ${new Date(user.lastLogout).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                        : user.lastLogin ? 'Active' : 'Never'
                      }
                    </span>
                  </div>
                </td>
                <td className="user-management-td">
                  <div className="session-tracker-cell">
                    <LuClock size={14} className="session-hours-icon" />
                    <span className="session-total-hours">
                      {sessionStats[user.id]?.totalHours?.toFixed(1) || '0.0'} hrs
                    </span>
                  </div>
                </td>
                <td className="user-management-td">
                  <div className="user-management-actions-container">
                    <button
                      className="user-management-action-button"
                      onClick={() => toggleDropdown(user.id)}
                    >
                      <LuEllipsisVertical />
                    </button>
                    {dropdownOpen === user.id && (
                      <>
                        <div className="user-management-dropdown-overlay" onClick={() => setDropdownOpen(null)}></div>
                        <div className={`user-management-dropdown ${index >= filteredUsers.length - 2 ? 'dropdown-up' : ''}`}>
                        <button
                          className="user-management-dropdown-item"
                          onClick={() => openEditModal(user)}
                        >
                          <LuPen /> Edit
                        </button>
                        <button
                          className="user-management-dropdown-item"
                          onClick={() => openSessionModal(user)}
                        >
                          <LuChartBar /> Session Details
                        </button>
                        <button
                          className="user-management-dropdown-item"
                          onClick={() => alert(`Viewing ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nRole: ${user.role}\nPhone: ${user.phone || 'N/A'}\nMobile: ${user.mobile || 'N/A'}`)}
                        >
                          <LuEye /> View Details
                        </button>
                        <button
                          className="user-management-dropdown-item user-management-dropdown-delete"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <LuTrash2 /> Delete
                        </button>
                      </div>
                    </>
                  )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Session Modal */}
      {sessionModalOpen && selectedUserForSessions && (
        <div className="user-management-modal-overlay">
          <div className="user-management-modal session-analytics-modal">
            <div className="user-management-modal-header">
              <h2 className="user-management-modal-title">
                Session Details - {selectedUserForSessions.firstName} {selectedUserForSessions.lastName}
              </h2>
              <button className="user-management-close-button" onClick={() => setSessionModalOpen(false)}>
                <LuX />
              </button>
            </div>
            <div className="session-analytics-body">
              <div className="session-period-controls">
                <label>View Period:</label>
                <select 
                  value={sessionPeriod} 
                  onChange={(e) => {
                    setSessionPeriod(e.target.value);
                  }}
                  className="session-period-dropdown"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div className="session-metrics-grid">
                <div className="session-metric-card">
                  <div className="session-metric-value">
                    {sessionStats[selectedUserForSessions.id]?.totalHours?.toFixed(1) || '0.0'}
                  </div>
                  <div className="session-metric-label">Total Hours</div>
                </div>
                <div className="session-metric-card">
                  <div className="session-metric-value">
                    {userSessions[selectedUserForSessions.id]?.sessions?.length || 0}
                  </div>
                  <div className="session-metric-label">Sessions</div>
                </div>
                <div className="session-metric-card">
                  <div className="session-metric-value">
                    {userSessions[selectedUserForSessions.id]?.sessions?.filter(s => s.logout_time).length || 0}
                  </div>
                  <div className="session-metric-label">Completed</div>
                </div>
              </div>
              
              <div className="session-history-section">
                <h3>Recent Sessions ({sessionPeriod})</h3>
                {userSessions[selectedUserForSessions.id]?.sessions?.length > 0 ? (
                  <div className="session-history-table">
                    <div className="session-table-header-row">
                      <div>Login Time</div>
                      <div>Logout Time</div>
                      <div>Duration</div>
                      <div>Status</div>
                    </div>
                    {userSessions[selectedUserForSessions.id].sessions.map(session => (
                      <div key={session.id} className="session-table-data-row">
                        <div>
                          {session.login_time 
                            ? new Date(session.login_time).toLocaleString()
                            : 'N/A'
                          }
                        </div>
                        <div>
                          {session.logout_time 
                            ? new Date(session.logout_time).toLocaleString()
                            : 'Active'
                          }
                        </div>
                        <div className="session-duration-badge">
                          {session.session_duration_minutes 
                            ? `${Math.floor(session.session_duration_minutes / 60)}h ${session.session_duration_minutes % 60}m`
                            : session.logout_time ? '0m' : 'In Progress'
                          }
                        </div>
                        <div>
                          <span className={`session-status-indicator ${session.logout_time ? 'session-status-completed' : 'session-status-active'}`}>
                            {session.logout_time ? 'Completed' : 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="session-empty-state">
                    <p>No sessions found for the selected period.</p>
                    <p style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                      Sessions will appear after users login and logout.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="user-management-modal-overlay">
          <div className="user-management-modal">
            <div className="user-management-modal-header">
              <h2 className="user-management-modal-title">Add New User</h2>
              <button className="user-management-close-button" onClick={closeAddModal}>
                <LuX />
              </button>
            </div>
            <div className="user-management-modal-body">
              <div className="user-management-form-group">
                <label className="user-management-label">First Name*</label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  className="user-management-input"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Last Name</label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  className="user-management-input"
                  placeholder="Enter last name"
                />
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Email*</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="user-management-input"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Mobile</label>
                <input
                  type="tel"
                  value={newUser.mobile}
                  onChange={(e) => setNewUser({...newUser, mobile: e.target.value})}
                  className="user-management-input"
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="user-management-select"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Password*</label>
                <div className="user-management-password-input-wrapper">
                  <input
                    type={showAddPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="user-management-input"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="user-management-password-toggle"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                  >
                    {showAddPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                  </button>
                </div>
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Employee ID (for Timesheets)</label>
                <input
                  type="text"
                  value={newUser.employeeId}
                  onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})}
                  className="user-management-input"
                  placeholder="e.g. EMP7942"
                />
              </div>
            </div>
            <div className="user-management-modal-footer">
              <button className="user-management-cancel-button" onClick={closeAddModal}>
                Cancel
              </button>
              <button className="user-management-save-button" onClick={handleAddUser}>
                <LuSave />
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="user-management-modal-overlay">
          <div className="user-management-modal">
            <div className="user-management-modal-header">
              <h2 className="user-management-modal-title">Edit User</h2>
              <button className="user-management-close-button" onClick={closeEditModal}>
                <LuX />
              </button>
            </div>
            <div className="user-management-modal-body">
              <div className="user-management-form-group">
                <label className="user-management-label">First Name*</label>
                <input
                  type="text"
                  value={selectedUser.firstName || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
                  className="user-management-input"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Last Name</label>
                <input
                  type="text"
                  value={selectedUser.lastName || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
                  className="user-management-input"
                  placeholder="Enter last name"
                />
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Email*</label>
                <input
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="user-management-input"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Mobile</label>
                <input
                  type="tel"
                  value={selectedUser.mobile || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, mobile: e.target.value})}
                  className="user-management-input"
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Role</label>
                <select
                  value={selectedUser.role || 'user'}
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                  className="user-management-select"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Password (optional)</label>
                <div className="user-management-password-input-wrapper">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={selectedUser.password || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, password: e.target.value})}
                    className="user-management-input"
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                  <button
                    type="button"
                    className="user-management-password-toggle"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                  </button>
                </div>
                <small style={{color: '#666', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                  Leave blank to keep the current password unchanged
                </small>
              </div>
              <div className="user-management-form-group">
                <label className="user-management-label">Employee ID (for Timesheets)</label>
                <input
                  type="text"
                  value={selectedUser.EmployeeId || selectedUser.employeeId || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, EmployeeId: e.target.value, employeeId: e.target.value})}
                  className="user-management-input"
                  placeholder="e.g. EMP7942"
                />
              </div>
            </div>
            <div className="user-management-modal-footer">
              <button className="user-management-cancel-button" onClick={closeEditModal}>
                Cancel
              </button>
              <button className="user-management-save-button" onClick={handleEditUser}>
                <LuSave />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="user-management-dropdown-overlay"
          onClick={() => setDropdownOpen(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;