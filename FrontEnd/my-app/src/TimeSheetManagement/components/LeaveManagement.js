import React, { useState, useEffect } from "react";
import { 
  LuCalendar, 
  LuCalendarDays,
  LuCheckCircle, 
  LuXCircle, 
  LuClock, 
  LuPlus, 
  LuTrash2, 
  LuUser, 
  LuUsers, 
  LuCheck, 
  LuX, 
  LuChevronLeft, 
  LuChevronRight, 
  LuCircleAlert, 
  LuClipboardList, 
  LuInfo,
  LuFileText,
  LuSearch,
  LuSquareCheck
} from "react-icons/lu";
import Swal from "sweetalert2";
import axios from "axios";
import BASE_URL from "../../url";
import "../styles/LeaveManagement.css";

const LeaveManagement = () => {
  // State for active tab: 'dashboard', 'apply', 'history', 'approvals', 'calendar'
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock User Identity from LocalStorage
  const userRole = localStorage.getItem("role") || "employee";
  const userFullName = localStorage.getItem("firstName") 
    ? `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName") || ""}`.trim()
    : localStorage.getItem("username") || "Employee";

  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;

  const [liveIsSupervisor, setLiveIsSupervisor] = useState(
    localStorage.getItem("isSupervisor") === "true" || 
    parsedUser?.isSupervisor === true || 
    parsedUser?.isSupervisor === "true"
  );

  const isManagerOrAdmin = 
    userRole === "admin" || 
    userRole === "super_admin" || 
    userRole === "manager" || 
    userRole === "teamlead" || 
    userRole === "team_lead" ||
    liveIsSupervisor;

  let employeeId = parsedUser?.EmployeeId || parsedUser?.employeeId || localStorage.getItem("EmployeeId");
  if (employeeId === "null" || employeeId === "undefined" || employeeId === "") {
    employeeId = null;
  }
  const token = localStorage.getItem("token");

  const [leaveBalances, setLeaveBalances] = useState({
    paid: { max: 12, used: 0, pending: 0, remaining: 12 }
  });

  // Personal Leave Requests
  const [myRequests, setMyRequests] = useState([]);

  // Manager Approvals list
  const [approvals, setApprovals] = useState([]);

  // Calendar events segregated
  const [calendarEvents, setCalendarEvents] = useState({ myLeaves: [], teamLeaves: [] });

  const fetchLeaveBalances = async () => {
    if (!employeeId || !token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/hrm/leave/balances/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setLeaveBalances(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching leave balances:", err);
    }
  };

  const fetchMyRequests = async () => {
    if (!employeeId || !token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/hrm/leave/requests/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMyRequests(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching leave requests:", err);
    }
  };

  const fetchApprovals = async () => {
    if (!employeeId || !token || !isManagerOrAdmin) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/hrm/leave/approvals/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setApprovals(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching approvals:", err);
    }
  };

  const fetchCalendarLeaves = async () => {
    if (!employeeId || !token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/hrm/leave/calendar/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCalendarEvents(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching calendar leaves:", err);
    }
  };

  // Fetch live supervisor status on mount to sync cached state
  useEffect(() => {
    if (!token || !employeeId) return;
    axios.get(`${BASE_URL}/api/hrm/leave/supervisor-status/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (res.data.success) {
        const isSup = res.data.isSupervisor === true;
        setLiveIsSupervisor(isSup);
        localStorage.setItem("isSupervisor", isSup ? "true" : "false");
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            const u = JSON.parse(stored);
            u.isSupervisor = isSup;
            localStorage.setItem("user", JSON.stringify(u));
          } catch (e) {}
        }
      }
    })
    .catch(err => {
      console.error("Error verifying supervisor status:", err);
    });
  }, [token, employeeId]);

  // Synchronize States to backend on activeTab change
  useEffect(() => {
    if (!employeeId || !token) return;
    fetchLeaveBalances();
    fetchMyRequests();
    fetchCalendarLeaves();
    if (isManagerOrAdmin) {
      fetchApprovals();
    }
  }, [employeeId, token, activeTab, isManagerOrAdmin]);

  // Form State
  const [formData, setFormData] = useState({
    leaveType: "annual",
    employeeType: "In-House",
    fromDate: "",
    toDate: "",
    halfDay: false,
    reason: ""
  });
  const [computedDays, setComputedDays] = useState(0);

  // Filters State for History
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  // Calendar Year and Month State
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 4, 1)); // Default to May 2026

  // Helper: Get business days (excluding Saturday and Sunday)
  const getBusinessDaysCount = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    let count = 0;
    const curDate = new Date(start.getTime());
    while (curDate <= end) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sundays (0) and Saturdays (6)
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  // Re-calculate days when dates or half-day checkbox changes
  useEffect(() => {
    if (formData.fromDate && formData.toDate) {
      let days = getBusinessDaysCount(formData.fromDate, formData.toDate);
      if (days > 0 && formData.halfDay) {
        days -= 0.5;
      }
      setComputedDays(days);
    } else {
      setComputedDays(0);
    }
  }, [formData.fromDate, formData.toDate, formData.halfDay]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Submit Leave Request Flow
  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!employeeId) {
      Swal.fire({
        icon: "error",
        title: "Account Configuration Error",
        text: "Your user account is not linked to an active Employee ID. Please contact an administrator."
      });
      return;
    }

    if (!formData.fromDate || !formData.toDate) {
      Swal.fire({
        icon: "warning",
        title: "Missing Dates",
        text: "Please select both a start date and an end date."
      });
      return;
    }

    if (computedDays <= 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Duration",
        text: "The leave period must contain at least 0.5 workdays."
      });
      return;
    }

    if (!formData.reason || !formData.reason.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Reason",
        text: "Please provide a reason for your leave request."
      });
      return;
    }

    // Check balances against the unified "Paid Leave" pool
    if (leaveBalances.paid) {
      const balanceRemaining = leaveBalances.paid.max - leaveBalances.paid.used;
      if (computedDays > balanceRemaining) {
        Swal.fire({
          icon: "error",
          title: "Insufficient Leave Balance",
          text: `You are requesting ${computedDays} days, but you only have ${balanceRemaining} days of Paid Leave remaining in the combined pool.`
        });
        return;
      }
    }

    Swal.fire({
      title: "Submitting request...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    axios.post(`${BASE_URL}/api/hrm/leave/requests`, {
      employeeId,
      leaveType: formData.leaveType,
      fromDate: formData.fromDate,
      toDate: formData.toDate,
      reason: formData.reason,
      halfDay: formData.halfDay
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      Swal.close();
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Leave Requested",
          text: `Your request has been submitted successfully.`,
          timer: 2000,
          showConfirmButton: false
        });
        // Reset Form
        setFormData({
          leaveType: "annual",
          employeeType: "In-House",
          fromDate: "",
          toDate: "",
          halfDay: false,
          reason: ""
        });
        setComputedDays(0);
        setActiveTab("dashboard");
        fetchLeaveBalances();
        fetchMyRequests();
        fetchCalendarLeaves();
      } else {
        Swal.fire("Error", res.data.message || "Failed to submit request", "error");
      }
    })
    .catch(err => {
      Swal.close();
      Swal.fire("Error", err.response?.data?.message || "An error occurred while submitting", "error");
    });
  };

  // Cancel Pending Leave Request Flow
  const handleCancelRequest = (id) => {
    Swal.fire({
      title: "Cancel Leave Request?",
      text: "Are you sure you want to cancel this leave request? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f43f5e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Cancel It"
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Cancelling...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
        axios.put(`${BASE_URL}/api/hrm/leave/requests/${id}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          Swal.close();
          if (res.data.success) {
            Swal.fire("Cancelled", "Your request was cancelled successfully.", "success");
            fetchLeaveBalances();
            fetchMyRequests();
            fetchCalendarLeaves();
          } else {
            Swal.fire("Error", res.data.message || "Failed to cancel request", "error");
          }
        })
        .catch(err => {
          Swal.close();
          Swal.fire("Error", err.response?.data?.message || "An error occurred while cancelling", "error");
        });
      }
    });
  };

  // Manager Approve Action
  const handleApproveLeave = (id) => {
    Swal.fire({
      title: "Approve Leave Request?",
      text: "This will approve the employee's leave request and notify them.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0d9488",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Approve Request"
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Approving...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
        axios.put(`${BASE_URL}/api/hrm/leave/requests/${id}/approve`, { managerComment: "Approved by supervisor" }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          Swal.close();
          if (res.data.success) {
            Swal.fire("Approved!", "The leave request has been successfully approved.", "success");
            fetchApprovals();
            fetchCalendarLeaves();
          } else {
            Swal.fire("Error", res.data.message || "Failed to approve request", "error");
          }
        })
        .catch(err => {
          Swal.close();
          Swal.fire("Error", err.response?.data?.message || "An error occurred while approving", "error");
        });
      }
    });
  };

  // Manager Reject Action
  const handleRejectLeave = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Leave Request",
      input: "textarea",
      inputLabel: "Rejection Reason",
      inputPlaceholder: "Provide a quick explanation for this rejection...",
      inputAttributes: {
        "aria-label": "Rejection explanation"
      },
      showCancelButton: true,
      confirmButtonColor: "#f43f5e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Reject Request"
    });

    if (reason === undefined) return; // User clicked cancel
    if (!reason.trim()) {
      Swal.fire("Warning", "Reason for rejection is required", "warning");
      return;
    }

    Swal.fire({
      title: "Rejecting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    axios.put(`${BASE_URL}/api/hrm/leave/requests/${id}/reject`, { managerComment: reason }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      Swal.close();
      if (res.data.success) {
        Swal.fire("Rejected", "The leave request was rejected.", "info");
        fetchApprovals();
        fetchCalendarLeaves();
      } else {
        Swal.fire("Error", res.data.message || "Failed to reject request", "error");
      }
    })
    .catch(err => {
      Swal.close();
      Swal.fire("Error", err.response?.data?.message || "An error occurred while rejecting", "error");
    });
  };

  // Filtered requests for My Requests tab
  const filteredMyRequests = myRequests.filter(req => {
    const matchesSearch = 
      req.reason.toLowerCase().includes(searchQuery.toLowerCase()) || 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || req.status.toLowerCase() === filterStatus.toLowerCase();
    
    const yearOfRequest = new Date(req.fromDate).getFullYear().toString();
    const matchesYear = filterYear === "all" || yearOfRequest === filterYear;
    
    return matchesSearch && matchesStatus && matchesYear;
  });

  // Calculate Dashboard metrics dynamically
  const pendingRequestsCount = myRequests.filter(req => req.status === "Pending").length;
  const approvalsPendingCount = approvals.filter(app => app.status === "Pending").length;

  const paidBal = leaveBalances.paid ? (leaveBalances.paid.max - leaveBalances.paid.used) : 12;

  // Calendar Helper Functions
  const monthsList = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCalendarDate(prev => {
      let m = prev.getMonth() - 1;
      let y = prev.getFullYear();
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      return new Date(y, m, 1);
    });
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => {
      let m = prev.getMonth() + 1;
      let y = prev.getFullYear();
      if (m > 11) {
        m = 0;
        y += 1;
      }
      return new Date(y, m, 1);
    });
  };

  // Generate calendar days logic
  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    // First day of current month
    const firstDay = new Date(year, month, 1);
    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Weekday of the first day (0 = Sun, 6 = Sat)
    const startOffset = firstDay.getDay();

    const dayBlocks = [];
    
    // Render prepended empty padding cells
    for (let i = 0; i < startOffset; i++) {
      dayBlocks.push({ date: null, isEmpty: true });
    }

    // Render active days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const cellDateObj = new Date(year, month, day);
      const isWeekend = cellDateObj.getDay() === 0 || cellDateObj.getDay() === 6;

      // Find if this day has a personal leave request
      const matchingLeaves = (calendarEvents.myLeaves || []).filter(req => {
        if (req.status !== "Approved" && req.status !== "Pending") return false;
        const from = new Date(req.fromDate);
        const to = new Date(req.toDate);
        return cellDateObj >= from && cellDateObj <= to;
      });

      // Find if this day has a team member approved leave
      const matchingApprovals = (calendarEvents.teamLeaves || []).filter(app => {
        if (app.status !== "Approved") return false;
        const from = new Date(app.fromDate);
        const to = new Date(app.toDate);
        return cellDateObj >= from && cellDateObj <= to;
      });

      dayBlocks.push({
        dateString: currentDateString,
        dayNumber: day,
        isEmpty: false,
        isWeekend,
        leaves: matchingLeaves,
        teamLeaves: matchingApprovals
      });
    }

    return dayBlocks;
  };

  const calendarDays = getCalendarDays();

  const getLeaveTypeTitle = (type) => {
    switch ((type || "").toLowerCase()) {
      case "annual": return "Annual Leave";
      case "sick":   return "Sick Leave";
      case "paid": return "Paid Leave";
      default:       return type ? type.charAt(0).toUpperCase() + type.slice(1) + " Leave" : "Leave";
    }
  };

  return (
    <div className="leave-container">
      {/* Sleek Hero Brand Header */}
      <div className="leave-hero-card">
        <h1 className="leave-hero-title">
          <LuCalendarDays size={32} />
          Leave Management System
        </h1>
        <p className="leave-hero-subtitle">
          Submit leaves, track balances, review historical request status feeds, and synchronize dates dynamically with the team calendar.
        </p>
      </div>

      {/* Tabs Menu Wrapper */}
      <div className="leave-tabs-wrapper">
        <button 
          className={`leave-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <LuClipboardList size={16} />
          Overview
        </button>
        <button 
          className={`leave-tab-btn ${activeTab === "apply" ? "active" : ""}`}
          onClick={() => setActiveTab("apply")}
        >
          <LuPlus size={16} />
          Apply Leave
        </button>
        <button 
          className={`leave-tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <LuFileText size={16} />
          My Requests
        </button>
        {isManagerOrAdmin && (
          <button 
            className={`leave-tab-btn ${activeTab === "approvals" ? "active" : ""}`}
            onClick={() => setActiveTab("approvals")}
            style={{ position: "relative" }}
          >
            <LuUsers size={16} />
            Approvals
            {approvalsPendingCount > 0 && (
              <span style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                backgroundColor: "var(--leave-rose-500)",
                color: "white",
                fontSize: "10px",
                fontWeight: "800",
                padding: "2px 6px",
                borderRadius: "10px",
                lineHeight: "1"
              }}>
                {approvalsPendingCount}
              </span>
            )}
          </button>
        )}
        <button 
          className={`leave-tab-btn ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          <LuCalendar size={16} />
          Calendar
        </button>
      </div>

      {/* Content Renderings */}

      {/* 1. DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div>
          <div className="leave-metrics-grid">
            <div className="leave-metric-card annual">
              <div className="leave-metric-header">
                <span className="leave-metric-title">Paid Leave Balance</span>
                <div className="leave-metric-icon-wrap">
                  <LuCalendar size={18} />
                </div>
              </div>
              <div className="leave-metric-number">{paidBal}</div>
              <div className="leave-metric-detail">
                <LuInfo size={12} />
                Used {leaveBalances.paid ? leaveBalances.paid.used : 0} of {leaveBalances.paid ? leaveBalances.paid.max : 12} total days
              </div>
            </div>

            <div className="leave-metric-card pending">
              <div className="leave-metric-header">
                <span className="leave-metric-title">Pending Requests</span>
                <div className="leave-metric-icon-wrap">
                  <LuClock size={18} />
                </div>
              </div>
              <div className="leave-metric-number">{pendingRequestsCount}</div>
              <div className="leave-metric-detail">
                <LuCircleAlert size={12} />
                Awaiting approval by manager
              </div>
            </div>
          </div>

          {/* Two-Column details */}
          <div className="leave-content-row">
            {/* Left: Recent Activity Feed */}
            <div className="leave-panel">
              <h2 className="leave-panel-title">
                <LuClipboardList size={20} className="text-teal-600" />
                Recent Leave Requests
              </h2>
              {myRequests.slice(0, 4).map((req) => (
                <div key={req.id} className="leave-list-item">
                  <div className="leave-list-left">
                    <div className={`leave-type-indicator ${req.leaveType}`} />
                    <div className="leave-list-info">
                      <span className="leave-list-type">
                        {getLeaveTypeTitle(req.leaveType)}
                        <span style={{ marginLeft: "8px", fontWeight: "normal", fontSize: "12px", color: "var(--leave-gray-500)" }}>
                          ({req.employeeType})
                        </span>
                      </span>
                      <span className="leave-list-dates">
                        <LuCalendar size={12} />
                        {req.fromDate} to {req.toDate} ({req.daysCount} workday{req.daysCount > 1 ? "s" : ""})
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className={`leave-list-badge ${req.status.toLowerCase()}`}>
                      {req.status}
                    </span>
                    {req.status === "Pending" && (
                      <button 
                        onClick={() => handleCancelRequest(req.id)}
                        className="leave-btn secondary"
                        style={{ padding: "6px 8px" }}
                        title="Cancel request"
                      >
                        <LuTrash2 size={14} className="text-rose-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {myRequests.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--leave-gray-500)", padding: "24px" }}>
                  No leave requests logged recently.
                </p>
              )}
              {myRequests.length > 4 && (
                <div style={{ textAlign: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--leave-gray-200)" }}>
                  <button 
                    onClick={() => setActiveTab("history")}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: "var(--leave-teal-600)", 
                      fontWeight: "600", 
                      fontSize: "14px", 
                      cursor: "pointer",
                      padding: "4px 8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    View All Requests <LuChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Quick Info Panel */}
            <div className="leave-panel">
              <h2 className="leave-panel-title">
                <LuInfo size={20} className="text-teal-600" />
                Leave Policy
              </h2>
              <div style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--leave-gray-700)" }}>
                <p style={{ margin: "0 0 10px 0" }}>
                  <strong>1. Paid Leave:</strong> <span style={{ color: "var(--leave-teal-700)", fontWeight: 600 }}>12 paid days</span> overall per year. Used for both vacations and health emergencies.
                </p>
                <div style={{ padding: "12px", background: "var(--leave-teal-50)", border: "1px solid var(--leave-teal-100)", borderRadius: "8px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <LuCircleAlert size={16} className="text-teal-600" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "12px", color: "var(--leave-teal-900)" }}>
                    Leaves are <strong>paid</strong>. Half-day options subtract 0.5 workdays. Approvals on public holidays are subject to local operations constraints. Medical certificates may be required for health-related absences exceeding 2 consecutive workdays.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. APPLY LEAVE TAB */}
      {activeTab === "apply" && (
        <div className="leave-panel">
          <h2 className="leave-panel-title">
            <LuPlus size={20} className="text-teal-600" />
            Apply For Leave
          </h2>

          <form onSubmit={handleFormSubmit}>
            <div className="leave-form-grid">
              {/*
              <div className="leave-form-group">
                <label className="leave-form-label">Leave Type</label>
                <select 
                  name="leaveType" 
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  className="leave-form-select"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                </select>
              </div>

              <div className="leave-form-group">
                <label className="leave-form-label">Employee Type</label>
                <select 
                  name="employeeType" 
                  value={formData.employeeType}
                  onChange={handleInputChange}
                  className="leave-form-select"
                >
                  <option value="In-House">In-House (HQ Operations)</option>
                  <option value="Client Side">Client Side (Deployment Projects)</option>
                </select>
              </div>
              */}

              <div className="leave-form-group">
                <label className="leave-form-label">From Date</label>
                <input 
                  type="date" 
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleInputChange}
                  required
                  className="leave-form-input"
                />
              </div>

              <div className="leave-form-group">
                <label className="leave-form-label">To Date</label>
                <input 
                  type="date" 
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleInputChange}
                  required
                  className="leave-form-input"
                />
              </div>
            </div>

            <div className="leave-form-checkbox-row">
              <input 
                type="checkbox" 
                id="halfDay"
                name="halfDay"
                checked={formData.halfDay}
                onChange={handleInputChange}
                className="leave-form-checkbox"
              />
              <label htmlFor="halfDay" className="leave-form-label" style={{ cursor: "pointer", margin: 0 }}>
                Apply half-day on last date (Subtracts 0.5 workday)
              </label>
            </div>

            {formData.fromDate && formData.toDate && (
              <div style={{ 
                backgroundColor: "var(--leave-teal-50)", 
                border: "1px solid var(--leave-teal-200)", 
                padding: "16px", 
                borderRadius: "8px", 
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--leave-teal-900)" }}>
                  Calculated Duration (Excluding Weekends):
                </span>
                <span style={{ fontSize: "20px", fontWeight: "800", color: "var(--leave-teal-600)" }}>
                  {computedDays} Workday{computedDays !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            <div className="leave-form-group" style={{ marginBottom: "24px" }}>
              <label className="leave-form-label">Reason / Comments</label>
              <textarea 
                name="reason" 
                rows="4"
                value={formData.reason}
                onChange={handleInputChange}
                required
                placeholder="Briefly describe the reason for your leave request..."
                className="leave-form-textarea"
              />
            </div>

            <div className="leave-form-actions">
              <button 
                type="button" 
                onClick={() => setActiveTab("dashboard")} 
                className="leave-btn secondary"
              >
                Cancel
              </button>
              <button type="submit" className="leave-btn primary">
                Submit Leave Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. MY REQUESTS HISTORY TAB */}
      {activeTab === "history" && (
        <div className="leave-panel">
          <h2 className="leave-panel-title">
            <LuFileText size={20} className="text-teal-600" />
            My Requests History
          </h2>

          {/* Filters Bar */}
          <div className="leave-filter-bar">
            <div className="leave-filter-search" style={{ position: "relative" }}>
              <input 
                type="text" 
                placeholder="Search requests by reason, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="leave-form-input"
                style={{ width: "100%", paddingLeft: "36px" }}
              />
              <LuSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--leave-gray-500)" }} size={16} />
            </div>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="leave-form-select leave-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              className="leave-form-select leave-filter-select"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Requests Feed List */}
          {filteredMyRequests.map((req) => (
            <div 
              key={req.id} 
              className="leave-list-item" 
              style={{ 
                flexDirection: "column", 
                alignItems: "stretch", 
                gap: "4px",
                borderLeft: `4px solid var(--leave-${req.leaveType === "annual" ? "teal" : req.leaveType === "sick" ? "amber" : "rose"}-500)`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontWeight: "800", color: "var(--leave-gray-900)", fontSize: "15px" }}>
                    {getLeaveTypeTitle(req.leaveType)}
                  </span>
                  <span style={{ color: "var(--leave-gray-500)", fontSize: "12px" }}>
                    ID: {req.id} | Applied: {req.appliedDate}
                  </span>
                  
                  {/* Compact date details capsule moved to the top row! */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--leave-gray-100)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", color: "var(--leave-gray-700)", fontWeight: "500", marginLeft: "4px" }}>
                    <span>From: <strong>{req.fromDate}</strong></span>
                    <span style={{ color: "var(--leave-gray-300)" }}>|</span>
                    <span>To: <strong>{req.toDate}</strong></span>
                    <span style={{ color: "var(--leave-gray-300)" }}>|</span>
                    <span>Days: <strong style={{ color: "var(--leave-teal-600)" }}>{req.daysCount}</strong></span>
                    {req.halfDay && (
                      <>
                        <span style={{ color: "var(--leave-gray-300)" }}>|</span>
                        <span style={{ color: "var(--leave-amber-600)", fontWeight: "600" }}>Half Day</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span className={`leave-list-badge ${req.status.toLowerCase()}`}>
                    {req.status}
                  </span>
                  {req.status === "Pending" && (
                    <button 
                      onClick={() => handleCancelRequest(req.id)}
                      className="leave-btn secondary"
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-details line combining Type and Reason */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "13px", color: "var(--leave-gray-700)", marginTop: "2px" }}>
                {/* <div>
                  Type: <span style={{ fontWeight: "600" }}>{req.employeeType}</span>
                </div>
                <div style={{ color: "var(--leave-gray-300)" }}>•</div> */}
                <div>
                  <strong>Reason:</strong> {req.reason}
                </div>
              </div>

              {req.managerComment && (
                <div style={{ fontSize: "12px", background: "var(--leave-teal-50)", padding: "6px 10px", borderLeft: "3px solid var(--leave-teal-500)", borderRadius: "0 8px 8px 0", color: "var(--leave-teal-900)", marginTop: "2px" }}>
                  <strong>Manager comment:</strong> {req.managerComment}
                </div>
              )}
            </div>
          ))}

          {filteredMyRequests.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--leave-gray-500)" }}>
              No leave requests found matching the filter criteria.
            </div>
          )}
        </div>
      )}

      {/* 4. APPROVALS TAB */}
      {activeTab === "approvals" && isManagerOrAdmin && (
        <div className="leave-panel">
          <h2 className="leave-panel-title">
            <LuUsers size={20} className="text-teal-600" />
            Manager Approvals
            <span style={{ marginLeft: "8px", fontSize: "13px", fontWeight: "normal", color: "var(--leave-gray-500)" }}>
              ({approvalsPendingCount} pending requests awaiting action)
            </span>
          </h2>

          {/* List of approvals */}
          {approvals.map((app) => (
            <div key={app.id} className="leave-approval-card">
              <div className="leave-approval-header" style={{ flexWrap: "wrap", gap: "8px" }}>
                <div className="leave-approval-user-info" style={{ flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                  <div className="leave-approval-avatar">
                    {app.employeeName.charAt(0)}
                  </div>
                  <div>
                    <span className="leave-approval-name">{app.employeeName}</span>
                    <div className="leave-approval-role">{app.role}</div>
                  </div>

                  {/* Details capsule inline inside header next to name/role! */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 10px", backgroundColor: "var(--leave-gray-50)", padding: "4px 8px", borderRadius: "8px", fontSize: "12px", color: "var(--leave-gray-700)", fontWeight: "500" }}>
                    {/* <span>Type: <strong>{getLeaveTypeTitle(app.leaveType)} ({app.employeeType})</strong></span>
                    <span style={{ color: "var(--leave-gray-300)" }}>|</span> */}
                    <span>From: <strong>{app.fromDate}</strong></span>
                    <span style={{ color: "var(--leave-gray-300)" }}>|</span>
                    <span>To: <strong>{app.toDate}</strong></span>
                    <span style={{ color: "var(--leave-gray-300)" }}>|</span>
                    <span>Duration: <strong style={{ color: "var(--leave-teal-600)" }}>{app.daysCount} Day{app.daysCount > 1 ? "s" : ""}</strong></span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  {/* Supervisor name - watermark style */}
                  {app.supervisorName && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontStyle: "italic",
                      color: "rgba(100, 116, 139, 0.45)",
                      fontWeight: "400",
                      whiteSpace: "nowrap",
                      letterSpacing: "0.02em",
                      userSelect: "none",
                      pointerEvents: "none"
                    }}>
                      <LuUser size={11} style={{ opacity: 0.4, flexShrink: 0 }} />
                      <span>{app.supervisorName}</span>
                    </div>
                  )}
                  <span className={`leave-list-badge ${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginTop: "8px" }}>
                <div style={{ 
                  fontSize: "13px", 
                  color: "var(--leave-gray-500)", 
                  fontStyle: "italic", 
                  paddingLeft: "8px", 
                  borderLeft: "2px solid var(--leave-teal-500)",
                  lineHeight: "1.4",
                  flex: 1
                }}>
                  <strong>Reason:</strong> {app.reason}
                </div>

                {app.status === "Pending" && (
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button 
                      onClick={() => handleRejectLeave(app.id)}
                      className="leave-btn reject"
                      style={{ padding: "4px 8px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <LuX size={14} />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApproveLeave(app.id)}
                      className="leave-btn approve"
                      style={{ padding: "4px 8px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <LuCheck size={14} />
                      Approve
                    </button>
                  </div>
                )}
              </div>

              {app.status === "Rejected" && app.managerComment && (
                <div style={{ fontSize: "12px", background: "var(--leave-rose-50)", borderLeft: "3px solid var(--leave-rose-500)", padding: "8px 12px", color: "var(--leave-rose-700)" }}>
                  <strong>Reason for rejection:</strong> {app.managerComment}
                </div>
              )}
            </div>
          ))}

          {approvals.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--leave-gray-500)" }}>
              No team requests logged in system.
            </div>
          )}
        </div>
      )}

      {/* 5. LEAVE CALENDAR TAB */}
      {activeTab === "calendar" && (
        <div className="leave-panel">
          <div className="leave-calendar-header">
            <h2 className="leave-calendar-month-title">
              <LuCalendarDays size={24} className="text-teal-600" />
              {monthsList[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </h2>

            <div className="leave-calendar-controls">
              <button onClick={handlePrevMonth} className="leave-calendar-ctrl-btn" title="Previous Month">
                <LuChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCalendarDate(new Date(2026, 4, 1))} 
                className="leave-btn secondary"
                style={{ padding: "8px 12px" }}
              >
                May 2026 (Demo Center)
              </button>
              <button onClick={handleNextMonth} className="leave-calendar-ctrl-btn" title="Next Month">
                <LuChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Calendar Grid Rendering */}
          <div className="leave-calendar-grid">
            {/* Weekdays headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div key={dayName} className="leave-calendar-day-header">
                {dayName}
              </div>
            ))}

            {/* Days mapping */}
            {calendarDays.map((cell, idx) => {
              if (cell.isEmpty) {
                return <div key={`empty-${idx}`} className="leave-calendar-day empty" />;
              }

              return (
                <div 
                  key={`day-${cell.dayNumber}`} 
                  className={`leave-calendar-day ${cell.isWeekend ? "weekend" : ""}`}
                >
                  <span className="leave-calendar-day-number">{cell.dayNumber}</span>
                  
                  <div className="leave-calendar-day-events">
                    {/* Render my personal requests */}
                    {cell.leaves.map((leave) => (
                      <div 
                        key={leave.id} 
                        className={`leave-calendar-event ${leave.leaveType} ${leave.status === "Pending" ? "pending-event" : ""}`}
                        title={`${getLeaveTypeTitle(leave.leaveType)} - ${leave.status}\nReason: ${leave.reason}`}
                        onClick={() => {
                          Swal.fire({
                            title: getLeaveTypeTitle(leave.leaveType),
                            html: `
                              <div style="text-align: left; font-size: 14px;">
                                <p><strong>Status:</strong> <span class="leave-list-badge ${leave.status.toLowerCase()}">${leave.status}</span></p>
                                <p><strong>Duration:</strong> ${leave.fromDate} to ${leave.toDate} (${leave.daysCount} days)</p>
                                <p><strong>Reason:</strong> ${leave.reason}</p>
                                ${leave.managerComment ? `<p><strong>Manager Comment:</strong> ${leave.managerComment}</p>` : ""}
                              </div>
                            `,
                            icon: leave.status === "Approved" ? "success" : "info"
                          });
                        }}
                      >
                        {leave.status === "Pending" ? "⏳" : ""} My {getLeaveTypeTitle(leave.leaveType).split(" ")[0]}
                      </div>
                    ))}

                    {/* Render team member approved requests */}
                    {cell.teamLeaves.map((app) => (
                      <div 
                        key={app.id} 
                        className={`leave-calendar-event ${app.leaveType}`}
                        style={{ opacity: 0.8, fontStyle: "italic" }}
                        title={`Team Leave: ${app.employeeName} (${app.role})\nType: ${getLeaveTypeTitle(app.leaveType)}\nReason: ${app.reason}`}
                        onClick={() => {
                          Swal.fire({
                            title: `Team Leave: ${app.employeeName}`,
                            html: `
                              <div style="text-align: left; font-size: 14px;">
                                <p><strong>Employee:</strong> ${app.employeeName} (${app.role})</p>
                                <p><strong>Type:</strong> ${getLeaveTypeTitle(app.leaveType)}</p>
                                <p><strong>Duration:</strong> ${app.fromDate} to ${app.toDate} (${app.daysCount} days)</p>
                                <p><strong>Reason:</strong> ${app.reason}</p>
                              </div>
                            `,
                            icon: "info"
                          });
                        }}
                      >
                        👥 {app.employeeName.split(" ")[0]} ({getLeaveTypeTitle(app.leaveType).split(" ")[0]})
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="leave-calendar-legend">
            <div className="leave-calendar-legend-item">
              <div className="leave-calendar-legend-color annual" />
              Annual Leave
            </div>
            <div className="leave-calendar-legend-item">
              <div className="leave-calendar-legend-color sick" />
              Sick Leave
            </div>
            <div className="leave-calendar-legend-item">
              <div className="leave-calendar-legend-color pending-event" />
              Pending Approval
            </div>
            <div className="leave-calendar-legend-item" style={{ marginLeft: "12px", borderLeft: "1px solid var(--leave-gray-300)", paddingLeft: "12px" }}>
              <span>👥 = Team Member approved leave</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
