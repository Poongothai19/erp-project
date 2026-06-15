// Dashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser, FaEnvelope, FaPhone, FaBell, FaChartPie, FaChartBar,
  FaUsers, FaBriefcase, FaTrophy, FaClock, FaArrowUp, FaArrowDown,
  FaEye, FaEdit, FaTimes, FaCheck, FaExclamationTriangle
} from "react-icons/fa";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import BASE_URL from "../../url";
import defaultProfile from "../Assets/images/user.jpg";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    recruitment: {
      activeRoles: 0,
      applicationsReceived: 0,
      interviewsScheduled: 0,
      hiresThisMonth: 0,
      myAssignedRoles: 0,
      applicationsByStatus: [],
      weeklySubmissions: [],
      rolesByUrgency: []
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      fetchDashboardData(user);
    }
  }, []);

  const fetchDashboardData = async (user) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No authentication token found");
        setLoading(false);
        return;
      }

      console.log("Fetching real recruitment data...");
      
      // Fetch recruitment data
      const recruitmentResponse = await fetch(`${BASE_URL}/api/dashboard/recruitment-stats`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch notifications
      const notificationsResponse = await fetch(`${BASE_URL}/api/dashboard/notifications`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (recruitmentResponse.ok) {
        const recruitmentData = await recruitmentResponse.json();
        console.log("Recruitment data fetched:", recruitmentData);
        
        setDashboardData({
          recruitment: recruitmentData.data
        });
      } else {
        const errorText = await recruitmentResponse.text();
        console.error("Failed to fetch recruitment data:", recruitmentResponse.status, errorText);
        // Fallback to mock data
        setDashboardData({
          recruitment: getMockRecruitmentData(user)
        });
      }

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        console.log("Notifications fetched:", notificationsData);
        setNotifications(notificationsData.data || []);
      } else {
        console.error("Failed to fetch notifications:", notificationsResponse.status);
        setNotifications(getMockNotifications(user));
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Use mock data on error
      setDashboardData({
        recruitment: getMockRecruitmentData(user)
      });
      setNotifications(getMockNotifications(user));
    } finally {
      setLoading(false);
    }
  };

  // Keep mock data as fallback
  const getMockRecruitmentData = (user) => ({
    activeRoles: user.role === 'teamlead' ? 12 : 8,
    applicationsReceived: user.role === 'teamlead' ? 145 : 67,
    interviewsScheduled: user.role === 'teamlead' ? 23 : 12,
    hiresThisMonth: user.role === 'teamlead' ? 8 : 4,
    myAssignedRoles: user.role === 'teamlead' ? 12 : 8,
    applicationsByStatus: [
      { name: 'Applied', value: 45, color: '#8884d8' },
      { name: 'Screening', value: 32, color: '#82ca9d' },
      { name: 'Interview', value: 28, color: '#ffc658' },
      { name: 'Hired', value: 15, color: '#ff7300' }
    ],
    weeklySubmissions: [
      { week: 'W1', submissions: 12, interviews: 5 },
      { week: 'W2', submissions: 18, interviews: 8 },
      { week: 'W3', submissions: 15, interviews: 6 },
      { week: 'W4', submissions: 22, interviews: 12 }
    ],
    rolesByUrgency: [
      { name: 'High', value: 8, color: '#ff4444' },
      { name: 'Medium', value: 15, color: '#ffaa00' },
      { name: 'Normal', value: 12, color: '#00aa00' }
    ]
  });

  const getMockNotifications = (user) => [
    {
      id: 1,
      type: 'recruitment',
      title: 'New Application Received',
      message: 'John Doe applied for Senior Frontend Developer role',
      time: '2 hours ago',
      priority: 'medium',
      read: false
    }
  ];

  const getProfileUrl = (user) => {
    if (!user?.id || !user?.profile) {
      return defaultProfile;
    }
    const hasValidExtension = /\.(jpe?g|png|gif|webp)$/i.test(user.profile);
    if (!hasValidExtension) {
      return `${BASE_URL}/defaults/users/${user.id}.png`;
    }
    const isAbsoluteUrl = user.profile.startsWith("http");
    return isAbsoluteUrl ? `${user.profile}?t=${Date.now()}` : 
           `${BASE_URL}/uploads/users/${user.id}/${user.profile}?t=${Date.now()}`;
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'recruitment': return <FaBriefcase />;
      default: return <FaBell />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#00aa00';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-welcome">
          <div className="user-avatar">
            <img src={getProfileUrl(currentUser)} alt="Profile" />
          </div>
          <div className="welcome-text">
            <h1>Welcome back, {currentUser?.firstName || currentUser?.username}!</h1>
            <p>Here's what's happening with your recruitment work today</p>
          </div>
        </div>
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'recruitment' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruitment')}
          >
            Recruitment
          </button>
        </div>
      </div>

      {/* Notifications Panel */}
      <div className="notifications-panel">
        <div className="notifications-header">
          <h3><FaBell /> Recent Notifications</h3>
          <span className="notification-count">
            {notifications.filter(n => !n.read).length} unread
          </span>
        </div>
        <div className="notifications-list">
          {notifications.slice(0, 3).map(notification => (
            <div 
              key={notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => markNotificationAsRead(notification.id)}
            >
              <div className="notification-icon" style={{ color: getPriorityColor(notification.priority) }}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">{notification.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-tab">
          <div className="stats-grid">
            <div className="stat-card recruitment">
              <div className="stat-icon">
                <FaBriefcase />
              </div>
              <div className="stat-content">
                <h3>{dashboardData.recruitment.activeRoles}</h3>
                <p>Active Roles</p>
              </div>
            </div>
            
            <div className="stat-card recruitment">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h3>{dashboardData.recruitment.applicationsReceived}</h3>
                <p>Applications</p>
              </div>
            </div>
            
            <div className="stat-card recruitment">
              <div className="stat-icon">
                <FaClock />
              </div>
              <div className="stat-content">
                <h3>{dashboardData.recruitment.interviewsScheduled}</h3>
                <p>Interviews Scheduled</p>
              </div>
            </div>
            
            <div className="stat-card recruitment">
              <div className="stat-icon">
                <FaTrophy />
              </div>
              <div className="stat-content">
                <h3>{dashboardData.recruitment.hiresThisMonth}</h3>
                <p>Hires This Month</p>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Application Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.recruitment.applicationsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.recruitment.applicationsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Roles by Urgency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.recruitment.rolesByUrgency}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, value}) => `${name} (${value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.recruitment.rolesByUrgency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recruitment Tab */}
      {activeTab === 'recruitment' && (
        <div className="recruitment-tab">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-content">
                <h3>{dashboardData.recruitment.activeRoles}</h3>
                <p>Active Roles</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3>{dashboardData.recruitment.applicationsReceived}</h3>
                <p>Applications Received</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3>{dashboardData.recruitment.interviewsScheduled}</h3>
                <p>Interviews Scheduled</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3>{dashboardData.recruitment.hiresThisMonth}</h3>
                <p>Hires This Month</p>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Weekly Recruitment Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.recruitment.weeklySubmissions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="submissions" fill="#8884d8" name="Submissions" />
                  <Bar dataKey="interviews" fill="#82ca9d" name="Interviews" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Application Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.recruitment.applicationsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.recruitment.applicationsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => navigate('/recruitment-dashboard')}
            >
              View Recruitment Dashboard
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => navigate('/resume-dashboard')}
            >
              Resume Submissions
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
