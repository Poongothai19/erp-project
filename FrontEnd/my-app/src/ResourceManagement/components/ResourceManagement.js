import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import BASE_URL from "../../url";
import "../styles/ResourceManagement.css";
import {
    LuUsers, LuSearch, LuEye, LuPen, LuTrash2, LuCheck, LuTrendingUp,
    LuX, LuRefreshCw, LuFilter, LuDownload, LuPhone, LuMail, LuUser, LuShield,
    LuBriefcase, LuUserCheck, LuUserX, LuBuilding, LuUserCog, LuExternalLink
} from "react-icons/lu";

const ResourceManagement = () => {
    // State Management
    const [activeTab, setActiveTab] = useState("all");
    const [resources, setResources] = useState([]);
    const [filteredResources, setFilteredResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterRole, setFilterRole] = useState("All");
    const [filterCompany, setFilterCompany] = useState("All");
    const [stats, setStats] = useState(null);
    const [selectedResource, setSelectedResource] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1
    });
    const [roles, setRoles] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [syncStatus, setSyncStatus] = useState({
        exists: false,
        count: 0,
        lastUpdated: null
    });

    const userRole = localStorage.getItem("role");

    // Fetch Resources
    const fetchResources = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            let endpoint = `${BASE_URL}/api/resource-management`;
            
            const params = {
                page,
                limit: pagination.limit
            };

            // Map tabs to backend types
            if (activeTab !== "all") {
                params.type = activeTab;
            }

            if (filterStatus !== "All") {
                params.status = filterStatus;
            }

            if (filterRole !== "All") {
                params.role = filterRole;
            }

            if (filterCompany !== "All") {
                params.company = filterCompany;
            }

            if (searchTerm) {
                params.search = searchTerm;
            }

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            if (response.data.success) {
                setResources(response.data.data);
                setFilteredResources(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error("❌ Error fetching resources:", error);
            alert("Failed to load resources: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    }, [activeTab, filterStatus, filterRole, filterCompany, searchTerm, pagination.limit]);

    // Fetch Statistics
    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${BASE_URL}/api/resource-management/stats/dashboard`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("❌ Error fetching stats:", error);
        }
    }, []);

    // Fetch Filter Options
    const fetchFilterOptions = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${BASE_URL}/api/resource-management/filters`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setRoles(["All", ...response.data.roles.filter(r => r !== null)]);
                setCompanies(["All", ...response.data.companies.filter(c => c !== null)]);
            } else {
                // Fallback values
                setRoles(["All", "Admin", "Manager", "Employee", "External User", "Candidate"]);
                setCompanies(["All", "Prophecy ERP", "Prophecy Offshore", "Cognifyar", "External"]);
            }
        } catch (error) {
            console.error("❌ Error fetching filter options:", error);
            // Fallback values
            setRoles(["All", "Admin", "Manager", "Employee", "External User", "Candidate"]);
            setCompanies(["All", "Prophecy ERP", "Prophecy Offshore", "Cognifyar", "External"]);
        }
    }, []);

    // Manual Sync
    const handleManualSync = async () => {
        if (!window.confirm("This will sync all resources from source tables. Continue?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${BASE_URL}/api/resource-management/sync/run`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                alert(`✅ Sync completed successfully! 
                Total: ${response.data.totalImported} resources
                Internal: ${response.data.breakdown?.internalEmployees || 0}
                External: ${response.data.breakdown?.externalEmployees || 0}
                Resume Submissions: ${response.data.breakdown?.resumeSubmissions || 0}`);
                fetchResources(1);
                fetchStats();
                checkSyncStatus();
            }
        } catch (error) {
            console.error("❌ Sync error:", error);
            alert("Sync failed: " + (error.response?.data?.message || error.message));
        }
    };

    // Check Sync Status
    const checkSyncStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${BASE_URL}/api/resource-management/sync/status`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSyncStatus(response.data);
            }
        } catch (error) {
            console.error("❌ Error checking sync status:", error);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        fetchResources(1);
        fetchStats();
        fetchFilterOptions();
        checkSyncStatus();
    }, [fetchResources, fetchStats, fetchFilterOptions, checkSyncStatus]);

    // Handle Filter Change
    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchResources(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [activeTab, filterStatus, filterRole, filterCompany, searchTerm]);

    // Handle Tab Change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setFilterStatus("All");
        setFilterRole("All");
        setFilterCompany("All");
        setSearchTerm("");
    };

    // Handle Page Change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchResources(newPage);
        }
    };

    // Handle Resource Selection
    const handleSelectResource = async (resource) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${BASE_URL}/api/resource-management/${resource.Id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSelectedResource(response.data.data);
                setShowModal(true);
            }
        } catch (error) {
            console.error("❌ Error loading resource details:", error);
            alert("Failed to load resource details");
        }
    };

    // Handle Delete
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this resource?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${BASE_URL}/api/resource-management/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setResources(resources.filter(r => r.Id !== id));
            setFilteredResources(filteredResources.filter(r => r.Id !== id));
            alert("✅ Resource deleted successfully");
            fetchStats(); // Refresh stats
        } catch (error) {
            console.error("❌ Error deleting resource:", error);
            alert("Error deleting resource");
        }
    };

    // Handle Update Status
    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `${BASE_URL}/api/resource-management/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setResources(resources.map(r =>
                r.Id === id ? { ...r, Status: newStatus } : r
            ));
            setFilteredResources(filteredResources.map(r =>
                r.Id === id ? { ...r, Status: newStatus } : r
            ));

            alert("✅ Status updated successfully");
        } catch (error) {
            console.error("❌ Error updating status:", error);
            alert("Failed to update status");
        }
    };

    // Get Status Class
    const getStatusClass = (status) => {
        if (!status) return "rm-status-active";
        
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case "active":
            case "available":
                return "rm-status-available";
            case "allocated":
            case "busy":
                return "rm-status-allocated";
            case "on leave":
            case "onleave":
                return "rm-status-onleave";
            case "inactive":
            case "not available":
                return "rm-status-inactive";
            default:
                return "rm-status-active";
        }
    };

    // Get Type Icon and Color
    const getTypeInfo = (resource) => {
        if (!resource) return { icon: <LuUser size={14} />, color: "#6b7280", label: "User" };
        
        const resourceType = resource.ResourceType;
        const sourceTable = resource.SourceTable;
        
        // Check for internal employees
        if (resourceType === 'Admin' || resourceType === 'Manager' || 
            resourceType === 'Employee' || resourceType === 'Candidate' ||
            sourceTable === 'userinfo' || 
            sourceTable === 'ProphecyOffshoreEmployees' || 
            sourceTable === 'CognifyarEmployees' ||
            sourceTable === 'Candidates') {
            
            if (resourceType === 'Admin') {
                return { icon: <LuShield size={14} />, color: "#ef4444", label: "Admin" };
            } else if (resourceType === 'Manager') {
                return { icon: <LuBriefcase size={14} />, color: "#f59e0b", label: "Manager" };
            } else if (resourceType === 'Candidate') {
                return { icon: <LuUserX size={14} />, color: "#3b82f6", label: "Candidate" };
            } else {
                return { icon: <LuUserCheck size={14} />, color: "#10b981", label: "Employee" };
            }
        }
        
        // Check for external users
        if (resourceType === 'ExternalUser' || resourceType === 'External' || 
            (sourceTable === 'userinfo' && resourceType === 'ExternalUser')) {
            return { icon: <LuExternalLink size={14} />, color: "#8b5cf6", label: "External" };
        }
        
        // Check for resume submission
        if (resourceType === 'ResumeSubmission' || sourceTable === 'Resume Submission') {
            return { icon: <LuUser size={14} />, color: "#06b6d4", label: "Resume" };
        }
        
        return { icon: <LuUser size={14} />, color: "#6b7280", label: resourceType || 'User' };
    };

    // Get Role Display Text
    const getRoleDisplay = (resource) => {
        if (resource.Role) return resource.Role;
        
        switch (resource.ResourceType) {
            case 'Admin':
                return 'Admin';
            case 'Manager':
                return 'Manager';
            case 'Employee':
                return 'Employee';
            case 'ExternalUser':
            case 'External':
                return 'External User';
            case 'Candidate':
                return 'Candidate';
            case 'ResumeSubmission':
                return 'Resume Submission';
            default:
                return resource.ResourceType || '–';
        }
    };

    // Render Stats Cards
    const renderStats = () => {
        if (!stats) return null;

        const statsData = [
            { 
                label: "Total Resources", 
                value: stats.total || stats.TotalResources || 0, 
                icon: <LuUsers size={18} />,
                color: "" 
            },
            { 
                label: "Internal", 
                value: stats.InternalEmployees || stats.InternalCount || 0, 
                icon: <LuUserCog size={18} />,
                color: "" 
            },
            { 
                label: "External", 
                value: stats.ExternalEmployees || stats.ExternalCount || 0, 
                icon: <LuExternalLink size={18} />,
                color: "" 
            },
            { 
                label: "Resume Submission", 
                value: stats.ResumeSubmissions || stats.ResumeSubmissionCount || 0, 
                icon: <LuUser size={18} />,
                color: "" 
            }
        ];

        return (
            <div className="rm-stats">
                {statsData.map((stat, idx) => (
                    <div key={idx} className="rm-stat-card">
                        <div className="rm-stat-icon" style={{ background: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="rm-stat-content">
                            <div className="rm-stat-label">{stat.label}</div>
                            <div className="rm-stat-value">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Render Sync Status
    const renderSyncStatus = () => {
        return (
            <div className="rm-sync-status">
                <div className="rm-sync-info">
                    <span className="rm-sync-label">
                        {syncStatus.exists ? `📊 ${syncStatus.count} Resources` : '🔭 No data'}
                    </span>
                    {syncStatus.lastUpdated && (
                        <span className="rm-sync-time">
                            Updated: {new Date(syncStatus.lastUpdated).toLocaleString()}
                        </span>
                    )}
                </div>
                <button 
                    className="rm-btn-sync"
                    onClick={handleManualSync}
                    title="Sync all resources"
                >
                    <LuRefreshCw size={16} />
                    Sync Now
                </button>
            </div>
        );
    };

    // Render Table
    const renderTable = () => {
        if (loading) {
            return (
                <div className="rm-loading">
                    <div className="rm-spinner"></div>
                    <p>Loading resources...</p>
                </div>
            );
        }

        if (filteredResources.length === 0) {
            return (
                <div className="rm-empty">
                    <LuUsers size={48} />
                    <p>No resources found</p>
                    {!syncStatus.exists && (
                        <button 
                            className="rm-btn-primary"
                            onClick={handleManualSync}
                        >
                            <LuRefreshCw size={16} />
                            Run Initial Sync
                        </button>
                    )}
                </div>
            );
        }

        return (
            <>
                <div className="rm-table-container">
                    <table className="rm-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone Number</th>
                                <th>Email ID</th>
                                <th>Company</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Source</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResources.map((resource) => {
                                const typeInfo = getTypeInfo(resource);
                                
                                return (
                                    <tr key={resource.Id}>
                                        <td>
                                            <div className="rm-name-cell">
                                                <div
                                                    className="rm-avatar"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${typeInfo.color} 0%, ${typeInfo.color}99 100%)`
                                                    }}
                                                >
                                                    {resource.Name?.charAt(0)?.toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <span className="rm-name">{resource.Name || '–'}</span>
                                                    {resource.EmployeeId && (
                                                        <span className="rm-id">ID: {resource.EmployeeId}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {resource.PhoneNumber ? (
                                                <div className="rm-phone-cell">
                                                    <LuPhone size={14} style={{ marginRight: '6px', color: '#6b7280' }} />
                                                    <a href={`tel:${resource.PhoneNumber}`} className="rm-phone-link">
                                                        {resource.PhoneNumber}
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="rm-na">–</span>
                                            )}
                                        </td>
                                        <td>
                                            {resource.EmailId ? (
                                                <div className="rm-email-cell">
                                                    <LuMail size={14} style={{ marginRight: '6px', color: '#6b7280' }} />
                                                    <a href={`mailto:${resource.EmailId}`} className="rm-email-link">
                                                        {resource.EmailId}
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="rm-na">–</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="rm-company-cell">
                                                <LuBuilding size={14} style={{ marginRight: '6px', color: '#6b7280' }} />
                                                {resource.Company || '–'}
                                            </div>
                                        </td>
                                        <td>{getRoleDisplay(resource)}</td>
                                        <td>
                                            <div className="rm-status-cell">
                                                <span className={`rm-badge ${getStatusClass(resource.Status)}`}>
                                                    {resource.Status || 'Active'}
                                                </span>
                                                {userRole === 'admin' || userRole === 'manager' ? (
                                                    <select
                                                        className="rm-status-select"
                                                        value={resource.Status || 'Active'}
                                                        onChange={(e) => handleUpdateStatus(resource.Id, e.target.value)}
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Available">Available</option>
                                                        <option value="Allocated">Allocated</option>
                                                        <option value="On Leave">On Leave</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="rm-source-badge">
                                                {resource.Source || resource.SourceTable || '–'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="rm-actions">
                                                <button
                                                    className="rm-action-btn view"
                                                    onClick={() => handleSelectResource(resource)}
                                                    title="View Details"
                                                >
                                                    <LuEye size={16} />
                                                </button>
                                                {userRole === 'admin' || userRole === 'manager' ? (
                                                    <>
                                                        <button
                                                            className="rm-action-btn edit"
                                                            title="Edit"
                                                            onClick={() => alert('Edit functionality coming soon')}
                                                        >
                                                            <LuPen size={16} />
                                                        </button>
                                                        <button
                                                            className="rm-action-btn delete"
                                                            title="Delete"
                                                            onClick={() => handleDelete(resource.Id)}
                                                        >
                                                            <LuTrash2 size={16} />
                                                        </button>
                                                    </>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="rm-pagination">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            Previous
                        </button>
                        <span>
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </>
        );
    };

    // Render Filter Modal
    const renderFilterModal = () => {
        if (!showFilterModal) return null;

        return (
            <div className="rm-modal-overlay" onClick={() => setShowFilterModal(false)}>
                <div className="rm-modal rm-filter-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="rm-modal-header">
                        <h2>Advanced Filters</h2>
                        <button
                            className="rm-modal-close"
                            onClick={() => setShowFilterModal(false)}
                        >
                            <LuX size={20} />
                        </button>
                    </div>
                    <div className="rm-modal-body">
                        <div className="rm-filter-section">
                            <h3>Role</h3>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="rm-select"
                            >
                                {roles.map((role, idx) => (
                                    <option key={idx} value={role}>
                                        {role === 'All' ? 'All Roles' : role}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="rm-filter-section">
                            <h3>Company</h3>
                            <select
                                value={filterCompany}
                                onChange={(e) => setFilterCompany(e.target.value)}
                                className="rm-select"
                            >
                                {companies.map((company, idx) => (
                                    <option key={idx} value={company}>
                                        {company === 'All' ? 'All Companies' : company}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="rm-filter-section">
                            <h3>Status</h3>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="rm-select"
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Available">Available</option>
                                <option value="Allocated">Allocated</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="rm-filter-actions">
                            <button
                                className="rm-btn-primary"
                                onClick={() => {
                                    fetchResources(1);
                                    setShowFilterModal(false);
                                }}
                            >
                                Apply Filters
                            </button>
                            <button
                                className="rm-btn-secondary"
                                onClick={() => {
                                    setFilterRole("All");
                                    setFilterCompany("All");
                                    setFilterStatus("All");
                                    setShowFilterModal(false);
                                    fetchResources(1);
                                }}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render Details Modal
    const renderDetailsModal = () => {
        if (!selectedResource || !showModal) return null;

        const typeInfo = getTypeInfo(selectedResource);

        return (
            <div className="rm-modal-overlay" onClick={() => setShowModal(false)}>
                <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="rm-modal-header">
                        <div className="rm-modal-title">
                            <h2>{selectedResource.Name}</h2>
                            <div className="rm-modal-subtitle">
                                {selectedResource.EmployeeId && `ID: ${selectedResource.EmployeeId}`}
                            </div>
                        </div>
                        <button
                            className="rm-modal-close"
                            onClick={() => setShowModal(false)}
                        >
                            <LuX size={20} />
                        </button>
                    </div>

                    <div className="rm-modal-body">
                        <div className="rm-details-grid">
                            <div className="rm-detail-item">
                                <label>Category</label>
                                <div className="rm-detail-value">
                                    {typeInfo.icon}
                                    <span style={{ marginLeft: '6px' }}>{typeInfo.label}</span>
                                </div>
                            </div>
                            <div className="rm-detail-item">
                                <label>Role</label>
                                <div className="rm-detail-value">{getRoleDisplay(selectedResource)}</div>
                            </div>
                            <div className="rm-detail-item">
                                <label>Company</label>
                                <div className="rm-detail-value">
                                    <LuBuilding size={14} style={{ marginRight: '6px', color: '#6b7280' }} />
                                    {selectedResource.Company || '–'}
                                </div>
                            </div>
                            <div className="rm-detail-item">
                                <label>Status</label>
                                <div className="rm-detail-value">
                                    <span className={`rm-badge ${getStatusClass(selectedResource.Status)}`}>
                                        {selectedResource.Status || 'Active'}
                                    </span>
                                </div>
                            </div>
                            <div className="rm-detail-item">
                                <label>Phone</label>
                                <div className="rm-detail-value">
                                    {selectedResource.PhoneNumber ? (
                                        <a href={`tel:${selectedResource.PhoneNumber}`} className="rm-phone">
                                            <LuPhone size={12} style={{ marginRight: '4px' }} />
                                            {selectedResource.PhoneNumber}
                                        </a>
                                    ) : '–'}
                                </div>
                            </div>
                            <div className="rm-detail-item">
                                <label>Email</label>
                                <div className="rm-detail-value">
                                    {selectedResource.EmailId ? (
                                        <a href={`mailto:${selectedResource.EmailId}`} className="rm-email">
                                            <LuMail size={12} style={{ marginRight: '4px' }} />
                                            {selectedResource.EmailId}
                                        </a>
                                    ) : '–'}
                                </div>
                            </div>
                            <div className="rm-detail-item">
                                <label>Source</label>
                                <div className="rm-detail-value">
                                    <span className="rm-source-badge">
                                        {selectedResource.Source || selectedResource.SourceTable || '–'}
                                    </span>
                                </div>
                            </div>
                            <div className="rm-detail-item">
                                <label>Created</label>
                                <div className="rm-detail-value">
                                    {selectedResource.CreatedAt ? new Date(selectedResource.CreatedAt).toLocaleDateString() : '–'}
                                </div>
                            </div>
                        </div>

                        {selectedResource.Location && (
                            <div className="rm-info-section">
                                <h3>Location</h3>
                                <div className="rm-info-content">{selectedResource.Location}</div>
                            </div>
                        )}

                        {selectedResource.Skills && (
                            <div className="rm-info-section">
                                <h3>Skills</h3>
                                <div className="rm-info-content">{selectedResource.Skills}</div>
                            </div>
                        )}

                        {selectedResource.ExperienceYears && (
                            <div className="rm-info-section">
                                <h3>Experience</h3>
                                <div className="rm-info-content">
                                    {selectedResource.ExperienceYears} years
                                    {selectedResource.ExperienceMonths && ` ${selectedResource.ExperienceMonths} months`}
                                </div>
                            </div>
                        )}

                        {selectedResource.Department && (
                            <div className="rm-info-section">
                                <h3>Department</h3>
                                <div className="rm-info-content">{selectedResource.Department}</div>
                            </div>
                        )}

                        {selectedResource.Position && (
                            <div className="rm-info-section">
                                <h3>Position</h3>
                                <div className="rm-info-content">{selectedResource.Position}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="rm-container">
            {/* Header */}
            <div className="rm-header">
                <div className="rm-header-content">
                    <h1>Resource Management</h1>
                </div>
                <div className="rm-header-actions">
                    {renderSyncStatus()}
                </div>
            </div>

            {/* Stats */}
            {renderStats()}


{/* Tabs */}
<div className="rm-tabs">
    <button
        className={`rm-tab ${activeTab === "all" ? "active" : ""}`}
        onClick={() => handleTabChange("all")}
    >
        All Resources ({stats?.total || stats?.TotalResources || 0})
    </button>
    <button
        className={`rm-tab ${activeTab === "InternalEmployee" ? "active" : ""}`}
        onClick={() => handleTabChange("InternalEmployee")}
    >
        Internal ({stats?.InternalEmployees || stats?.InternalCount || 0})
    </button>
    <button
        className={`rm-tab ${activeTab === "ExternalEmployee" ? "active" : ""}`}
        onClick={() => handleTabChange("ExternalEmployee")}
    >
        External ({stats?.ExternalEmployees || stats?.ExternalCount || 0})
    </button>
    <button
        className={`rm-tab ${activeTab === "Candidate" ? "active" : ""}`}
        onClick={() => handleTabChange("Candidate")}
    >
        Bench ({stats?.Candidates || 0})
    </button>
    <button
        className={`rm-tab ${activeTab === "ResumeSubmission" ? "active" : ""}`}
        onClick={() => handleTabChange("ResumeSubmission")}
    >
        Resume Submission ({stats?.ResumeSubmissions || stats?.ResumeSubmissionCount || 0})
    </button>
</div>

            {/* Filters */}
            <div className="rm-filters">
                <div className="rm-search">
                    <LuSearch size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchResources(1)}
                    />
                    {/* <button className="rm-search-btn" onClick={() => fetchResources(1)}>
                        Search
                    </button> */}
                </div>

                <div className="rm-filter-group">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rm-select"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Available">Available</option>
                        <option value="Allocated">Allocated</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div className="rm-filter-group">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="rm-select"
                    >
                        <option value="All">All Roles</option>
                        {roles.map((role, idx) => (
                            <option key={idx} value={role}>
                                {role === 'All' ? 'All Roles' : role}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="rm-filter-group">
                    <select
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        className="rm-select"
                    >
                        <option value="All">All Companies</option>
                        {companies.map((company, idx) => (
                            <option key={idx} value={company}>
                                {company === 'All' ? 'All Companies' : company}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="rm-filter-group">
                    <select
                        className="rm-select"
                        onChange={(e) => {
                            setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
                            setTimeout(() => fetchResources(1), 100);
                        }}
                        value={pagination.limit}
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                </div>

                <div className="rm-filter-group">
                    <button
                        className="rm-btn-filter"
                        onClick={() => setShowFilterModal(true)}
                    >
                        <LuFilter size={16} />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            {renderTable()}

            {/* Modals */}
            {renderFilterModal()}
            {renderDetailsModal()}
        </div>
    );
};

export default ResourceManagement;