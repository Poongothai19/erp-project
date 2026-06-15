// src/Bench_Sales/Components/SubmissionTracking.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import BASE_URL from "../../url";
import "../Styles/BenchSalesStyles.css";
import {
  Send,
  FileSpreadsheet,
  Edit,
  Save,
  XCircle,
  X,
  Trash2,
} from "lucide-react";

const SubmissionTracking = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const navigate = useNavigate();

  const statusStages = [
    // "Submitted",
    "Interview Scheduled",
    "Selected",
    "Joined",
    "Rejected",
  ];

  const handleExternalSubmissionClick = () => {
    navigate("/bench-external-submission");
  };

  const SkillsDisplay = ({ skills }) => {
    const skillsArray = Array.isArray(skills)
      ? skills
      : skills
      ? skills.split(",").map((skill) => skill.trim())
      : [];
    const visibleSkills = skillsArray.slice(0, 2);
    const remainingSkills = skillsArray.slice(2);
    const hasMoreSkills = remainingSkills.length > 0;

    return (
      <p className="skills">
        {visibleSkills.length > 0 ? (
          <div className="skills-display-container">
            <span className="visible-skills">{visibleSkills.join(", ")}</span>
            {hasMoreSkills && (
              <span className="skills-tooltip-trigger">
                , +{remainingSkills.length} more
                <div className="skills-tooltip">
                  <div className="skills-tooltip-content">
                    <strong>Additional Skills:</strong>
                    <br />
                    {remainingSkills.join(", ")}
                  </div>
                </div>
              </span>
            )}
          </div>
        ) : (
          "No skills listed"
        )}
      </p>
    );
  };

  const initializeEditForm = (submission) => {
    setEditFormData({
      candidate: submission.candidate || "",
      jobTitle: submission.jobTitle || "",
      skills: Array.isArray(submission.skills)
        ? submission.skills.join(", ")
        : submission.skills || "",
      vendor: submission.vendor || "",
      location: submission.location || "",
      rate: submission.rate || "",
      duration: submission.duration || "",
      experience: submission.experience || "",
      jobType: submission.jobType || "",
      priority: submission.priority || "Medium",
      status: submission.status || "Submitted",
      date: submission.date || "",
      interviewDate: submission.interviewDate || "",
      nextStep: submission.nextStep || "",
      response: submission.response || "",
      candidateEmail: submission.candidateEmail || "",
      candidatePhone: submission.candidatePhone || "",
      matchScore: submission.matchScore || "",
      feedbackNotes: submission.feedbackNotes || "",
    });
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      Swal.fire({
        title: "Authentication Required",
        text: "Please login to continue",
        icon: "warning",
      });
      return;
    }

    setUpdateLoading(true);

    try {
      // Check if this is an external submission
      const isExternal =
        typeof selectedSubmission.id === "string" &&
        selectedSubmission.id.startsWith("ext-");

      // Strip 'ext-' prefix if it exists
      let actualId = selectedSubmission.id;
      if (isExternal) {
        actualId = selectedSubmission.id.replace("ext-", "");
      } else if (typeof selectedSubmission.id === "string") {
        actualId = parseInt(selectedSubmission.id);
      }

      // Different update data for external vs internal submissions
      let updateData;

      if (isExternal) {
        // For external submissions, use the external-submissions endpoint structure
        updateData = {
          candidateName: editFormData.candidate || "",
          role: editFormData.jobTitle || "",
          rate: editFormData.rate || "",
          client: editFormData.vendor || "",
          location: editFormData.location || "",
          vendorName: editFormData.vendor || "",
          vendorMail: editFormData.candidateEmail || "",
          vendorContact: editFormData.candidatePhone || "",
          vendorCompany: editFormData.vendor || "",
          status: editFormData.status || "Submitted",
          submissionDate: editFormData.date || "",
        };
      } else {
        // For internal submissions, use the submissions endpoint structure
        updateData = {
          id: actualId,
          candidate: editFormData.candidate || "",
          jobTitle: editFormData.jobTitle || "",
          skills:
            typeof editFormData.skills === "string"
              ? editFormData.skills
                  .split(",")
                  .map((skill) => skill.trim())
                  .filter((skill) => skill.length > 0)
              : Array.isArray(editFormData.skills)
              ? editFormData.skills
              : [],
          vendor: editFormData.vendor || "",
          location: editFormData.location || "",
          rate: editFormData.rate || "",
          duration: editFormData.duration || "",
          experience: editFormData.experience || "",
          jobType: editFormData.jobType || "",
          priority: editFormData.priority || "Medium",
          status: editFormData.status || "Submitted",
          date: editFormData.date || "",
          interviewDate: editFormData.interviewDate || null,
          nextStep: editFormData.nextStep || null,
          response: editFormData.response || "",
          candidateEmail: editFormData.candidateEmail || "",
          candidatePhone: editFormData.candidatePhone || "",
          matchScore: editFormData.matchScore
            ? parseFloat(editFormData.matchScore)
            : null,
          feedbackNotes: editFormData.feedbackNotes || "",
        };
      }

      // Use appropriate endpoint based on submission type
      const endpoint = isExternal
        ? `${BASE_URL}/api/external-submissions/${actualId}`
        : `${BASE_URL}/api/submissions/${actualId}`;

      const response = await axios.put(endpoint, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      if (
        response.status === 200 ||
        response.data.success === true ||
        response.data.message === "Submission updated successfully"
      ) {
        const updatedSubmissionData = {
          ...selectedSubmission,
          ...editFormData,
          skills:
            typeof editFormData.skills === "string"
              ? editFormData.skills
                  .split(",")
                  .map((skill) => skill.trim())
                  .filter((skill) => skill.length > 0)
              : Array.isArray(editFormData.skills)
              ? editFormData.skills
              : [],
        };

        const updatedSubmissions = submissions.map((sub) =>
          sub.id === selectedSubmission.id ? updatedSubmissionData : sub
        );

        setSubmissions(updatedSubmissions);
        setSelectedSubmission(updatedSubmissionData);
        setIsEditing(false);

        Swal.fire({
          title: "Success!",
          text: "Submission has been updated successfully",
          icon: "success",
          timer: 3000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.data?.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating submission:", error);

      let errorMessage = "Failed to update submission";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
        localStorage.removeItem("token");
      } else if (error.response?.data?.error || error.response?.data?.message) {
        errorMessage = error.response.data.error || error.response.data.message;
      }

      Swal.fire({
        title: "Update Failed",
        text: errorMessage,
        icon: "error",
      });
    } finally {
      setUpdateLoading(false);
    }
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    initializeEditForm(selectedSubmission);
  };

  const handleStartEdit = () => {
    initializeEditForm(selectedSubmission);
    setIsEditing(true);
  };

  const handleDeleteSubmission = async (submissionId, e) => {
    // Stop event propagation to prevent card click
    e.stopPropagation();

    const token = localStorage.getItem("token");

    if (!token) {
      Swal.fire({
        title: "Authentication Required",
        text: "Please login to continue",
        icon: "warning",
      });
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: "Delete Submission?",
      text: "Are you sure you want to delete this submission? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      // Check if it's an external submission (has 'ext-' prefix)
      const isExternal =
        typeof submissionId === "string" && submissionId.startsWith("ext-");

      // Strip 'ext-' prefix if it exists
      let actualId = submissionId;
      if (isExternal) {
        actualId = submissionId.replace("ext-", "");
      } else if (typeof submissionId === "string") {
        actualId = parseInt(submissionId);
      }

      // Use appropriate endpoint based on submission type
      const endpoint = isExternal
        ? `${BASE_URL}/api/external-submissions/${actualId}`
        : `${BASE_URL}/api/submissions/${actualId}`;

      const response = await axios.delete(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      if (response.status === 200 || response.data.success === true) {
        // Remove submission from local state
        setSubmissions((prev) => prev.filter((sub) => sub.id !== submissionId));

        Swal.fire({
          title: "Deleted!",
          text: "Submission has been deleted successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh submissions list after deletion
        fetchSubmissions();
      } else {
        throw new Error(response.data?.message || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting submission:", error);

      let errorMessage = "Failed to delete submission";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
        localStorage.removeItem("token");
      } else if (error.response?.data?.error || error.response?.data?.message) {
        errorMessage = error.response.data.error || error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = "Submission not found";
      }

      Swal.fire({
        title: "Delete Failed",
        text: errorMessage,
        icon: "error",
      });
    }
  };

  const fetchSubmissions = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      Swal.fire({
        title: "Authentication Required",
        text: "Please login to continue",
        icon: "warning",
      }).then(() => {
        window.location.href = "/login";
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch BOTH internal submissions and external submissions
      const [internalRes, externalRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/submissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }),
        axios.get(`${BASE_URL}/api/external-submissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }),
      ]);

      // Process internal submissions
      let internalData = [];
      if (internalRes.status === "fulfilled" && internalRes.value.data) {
        const data = internalRes.value.data;
        if (Array.isArray(data)) {
          internalData = data;
        } else if (data.data && Array.isArray(data.data)) {
          internalData = data.data;
        } else if (data.recordset && Array.isArray(data.recordset)) {
          internalData = data.recordset;
        }
      }

      // Process external submissions
      let externalData = [];
      if (externalRes.status === "fulfilled" && externalRes.value.data) {
        const data = externalRes.value.data;
        if (Array.isArray(data)) {
          externalData = data;
        } else if (data.data && Array.isArray(data.data)) {
          externalData = data.data;
        } else if (data.recordset && Array.isArray(data.recordset)) {
          externalData = data.recordset;
        }
      }

      // Filter external submissions - ONLY show if status is NOT "Submitted" AND has a candidate name
      const syncedExternalData = externalData.filter((sub) => {
        const candidateName = (sub.CandidateName || sub.Name || "").trim();
        return (
          sub.Status &&
          sub.Status !== "Submitted" &&
          candidateName.length > 0 &&
          candidateName.toLowerCase() !== "unknown candidate" &&
          candidateName.toLowerCase() !== "unknown" &&
          candidateName.toLowerCase() !== "n/a"
        );
      });
      // Transform internal submissions
      const transformedInternal = internalData
        .filter((submission) => {
          // Filter out "Unknown Candidate" and empty candidates
          const candidateName = (submission.CandidateName || "").trim();
          return (
            candidateName.length > 0 &&
            candidateName.toLowerCase() !== "unknown candidate" &&
            candidateName.toLowerCase() !== "unknown" &&
            candidateName.toLowerCase() !== "n/a"
          );
        })
        .map((submission) => ({
          id: submission.Id || submission.id,
          candidate: submission.CandidateName || "Unknown Candidate",
          skills: submission.CandidateSkills
            ? typeof submission.CandidateSkills === "string"
              ? submission.CandidateSkills.split(",").map((skill) =>
                  skill.trim()
                )
              : submission.CandidateSkills
            : [],
          vendor:
            submission.VendorName || submission.Client || "Unknown Vendor",
          jobTitle: submission.JobTitle || "N/A",
          status: submission.Status || "Submitted",
          date: submission.SubmissionDate
            ? new Date(submission.SubmissionDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          nextStep: submission.NextStep
            ? new Date(submission.NextStep).toISOString().split("T")[0]
            : null,
          response: submission.Response || "Waiting",
          interviewDate: submission.InterviewDate
            ? new Date(submission.InterviewDate).toISOString().split("T")[0]
            : null,
          feedbackNotes: submission.FeedbackNotes || "",
          location: submission.Location || "N/A",
          rate: submission.Rate || "N/A",
          duration: submission.Duration || "N/A",
          experience: submission.Experience || "N/A",
          jobType: submission.JobType || "N/A",
          priority: submission.Priority || "Medium",
          candidateEmail: submission.CandidateEmail || "N/A",
          candidatePhone: submission.CandidatePhone || "N/A",
          matchScore: submission.MatchScore || "N/A",
          createdAt: submission.CreatedAt || new Date().toISOString(),
          isExternal: false,
        }));

      // Transform external submissions (only those not "Submitted" and with valid candidate names)
      const transformedExternal = syncedExternalData.map(submission => {
        const candidateName = submission.CandidateName || submission.Name || '';
        
        return {
          id: `ext-${submission.Id || submission.id}`,
          candidate: candidateName.trim(),
          skills: submission.Role ? [submission.Role] : [],
          vendor: submission.VendorCompany || submission.VendorName || submission.Client || 'Unknown Vendor',
          jobTitle: submission.Role || 'N/A',
          status: submission.Status || 'Submitted',
          date: submission.SubmissionDate 
            ? new Date(submission.SubmissionDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          nextStep: null,
          response: 'Waiting',
          interviewDate: null,
          feedbackNotes: submission.Notes || '',
          location: submission.Location || 'N/A',
          rate: submission.Rate || 'N/A',
          duration: 'N/A',
          experience: 'N/A',
          jobType: 'N/A',
          priority: 'Medium',
          // IMPORTANT: For external submissions, use vendor contact info, not candidate info
          candidateEmail: submission.VendorMail || 'N/A',  // This is actually vendor email
          candidatePhone: submission.VendorContact || 'N/A',  // This is actually vendor phone
          matchScore: 'N/A',
          createdAt: new Date().toISOString(),
          isExternal: true,
          vendorName: submission.VendorName || 'N/A',
          client: submission.Client || 'N/A'
        };
      });

      // Combine both arrays - external submissions will show on kanban board if status is not "Submitted"
      const allSubmissions = [...transformedInternal, ...transformedExternal];

      setSubmissions(allSubmissions);
    } catch (error) {
      console.error("Fetch submissions error:", error);
      setError(error.message);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        Swal.fire({
          title: "Session Expired",
          text: "Please login again",
          icon: "warning",
        }).then(() => {
          window.location.href = "/login";
        });
      } else {
        Swal.fire({
          title: "Error Loading Submissions",
          text:
            error.response?.data?.error ||
            error.message ||
            "Failed to load submissions",
          icon: "error",
        });
      }
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (submission, newStatus) => {
    const token = localStorage.getItem("token");

    if (!token) {
      Swal.fire({
        title: "Authentication Required",
        text: "Please login to continue",
        icon: "warning",
      });
      return false;
    }

    try {
      // Check if it's an external submission (has 'ext-' prefix)
      const isExternal =
        typeof submission.id === "string" && submission.id.startsWith("ext-");

      // Strip 'ext-' prefix if it exists
      let actualId = submission.id;
      if (isExternal) {
        actualId = submission.id.replace("ext-", "");
      } else if (typeof submission.id === "string") {
        actualId = parseInt(submission.id);
      }

      // Use appropriate endpoint and data structure based on submission type
      const endpoint = isExternal
        ? `${BASE_URL}/api/external-submissions/${actualId}`
        : `${BASE_URL}/api/submissions/${actualId}/status`;

      // For external submissions, send the full update object to avoid NULL errors
      let requestData;
      if (isExternal) {
        requestData = {
          candidateName: submission.candidate || submission.candidateName || "",
          role: submission.jobTitle || "",
          rate: submission.rate || "",
          client: submission.vendor || "",
          location: submission.location || "",
          vendorName: submission.vendorName || submission.vendor || "",
          vendorMail: submission.candidateEmail || "",
          vendorContact: submission.candidatePhone || "",
          vendorCompany: submission.vendor || "",
          status: newStatus,
          submissionDate:
            submission.date || new Date().toISOString().split("T")[0],
        };
      } else {
        requestData = { status: newStatus };
      }

      const response = await axios.put(endpoint, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      if (response.status === 200 || response.data.success === true) {
        // Update local state
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === submission.id ? { ...sub, status: newStatus } : sub
          )
        );

        Swal.fire({
          title: "Status Updated",
          text: `Submission status changed to ${newStatus}`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating submission status:", error);
      let errorMessage = "Failed to update status";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        title: "Update Failed",
        text: errorMessage,
        icon: "error",
      });
      return false;
    }
  };

  const handleShowDetails = (submission) => {
    setSelectedSubmission(submission);
    setIsEditing(false);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setIsEditing(false);
    setSelectedSubmission(null);
    setEditFormData({});
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const getSubmissionsByStatus = (status) => {
    return submissions.filter((sub) => sub.status === status);
  };

  const handleDragStart = (e, submissionId) => {
    e.dataTransfer.setData("submissionId", submissionId.toString());
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    const submissionId = e.dataTransfer.getData("submissionId");

    if (!submissionId) return;

    // Find submission - compare as strings first, then try number
    const submission = submissions.find((sub) => {
      return sub.id === submissionId || sub.id === parseInt(submissionId);
    });

    if (!submission) {
      console.warn("Submission not found:", submissionId);
      return;
    }

    if (submission.status === targetStatus) {
      return; // Same status, no need to update
    }

    // Update status with the full submission data to avoid NULL errors
    await updateSubmissionStatus(submission, targetStatus);
  };

  const handleCardClick = (submission) => {
    // Open modal for both internal and external submissions
    setSelectedSubmission(submission);
    setIsEditing(false);
    setShowDetailsModal(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove("drag-over");
    }
  };

  if (loading) {
    return (
      <div className="submission-tracking-container">
        <div className="submission-tracking-page-header">
          <h1>Submission & Interview Tracking</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="submission-tracking-container">
        <div className="submission-tracking-page-header">
          <h1>Submission & Interview Tracking</h1>
        </div>
        <div className="error-container">
          <p>Error loading submissions: {error}</p>
          <button className="btn btn-primary" onClick={fetchSubmissions}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="submission-tracking-container">
      <div className="submission-tracking-page-header">
        <h1>
          <Send className="icon" /> Submission & Interview Tracking
        </h1>
        <div className="header-actions">
          <button
            className="btn btn-info"
            onClick={handleExternalSubmissionClick}
          >
            <FileSpreadsheet size={16} /> External Submission
          </button>
          {/* <button className="btn btn-secondary" onClick={fetchSubmissions} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button> */}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="no-data-container">
          <p>No submissions found. Add some submissions to get started.</p>
        </div>
      ) : (
        <div className="submission-tracking-kanban-board">
          {statusStages.map((status) => (
            <div
              key={status}
              className="submission-tracking-kanban-column"
              onDrop={(e) => handleDrop(e, status)}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <h3>
                {status}
                <span className="count">
                  ({getSubmissionsByStatus(status).length})
                </span>
              </h3>
              <div className="submission-tracking-submissions-list">
                {getSubmissionsByStatus(status).map((submission) => {
                  const isExternal =
                    typeof submission.id === "string" &&
                    submission.id.startsWith("ext-");

                  return (
                    <div
                      key={submission.id}
                      className="submission-tracking-submission-card"
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, submission.id)}
                      onClick={() => handleCardClick(submission)}
                      style={{
                        cursor: isExternal ? "not-allowed" : "pointer",
                        position: "relative",
                        opacity: isExternal ? 0.85 : 1,
                        userSelect: "none",
                      }}
                    >
                      {/* Delete Button */}
                      <button
                        className="submission-card-delete-btn"
                        onClick={(e) =>
                          handleDeleteSubmission(submission.id, e)
                        }
                        title="Delete submission"
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "#F3F4F6",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          color: "#c82333",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          zIndex: 10,
                          transition: "background 0.2s",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* External Badge */}
                      {isExternal && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            left: "8px",
                            background: "#FEE2E2",
                            color: "#991B1B",
                            padding: "2px 8px",
                            borderRadius: "3px",
                            fontSize: "10px",
                            fontWeight: "700",
                            zIndex: 5,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          External
                        </div>
                      )}

                      <h4
                        style={{
                          paddingRight: "40px",
                          paddingTop: isExternal ? "28px" : "8px",
                          margin: "0 0 8px 0",
                        }}
                      >
                        {submission.candidate}
                      </h4>

                      <SkillsDisplay skills={submission.skills} />

                      {submission.jobTitle && (
                        <p className="job-title">{submission.jobTitle}</p>
                      )}

                      <div className="submission-tracking-submission-details">
                        <div>Client: {submission.vendor}</div>
                        <div>Submitted: {submission.date}</div>
                        {submission.nextStep && (
                          <div>Next Step: {submission.nextStep}</div>
                        )}
                        {submission.interviewDate && (
                          <div>Interview: {submission.interviewDate}</div>
                        )}
                        {submission.response &&
                          submission.response !== "Waiting" && (
                            <div>Response: {submission.response}</div>
                          )}
                      </div>

                      <div
                        className={`submission-tracking-status-indicator submission-tracking-status-${submission.status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {submission.status}
                      </div>
                    </div>
                  );
                })}
                {getSubmissionsByStatus(status).length === 0 && (
                  <div className="empty-column-message">
                    No submissions in this stage
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailsModal && selectedSubmission && (
        <div className="req-tracking-modal-overlay">
          <div className="req-tracking-modal-content req-tracking-modal-large">
            <div className="req-tracking-modal-header">
              <h2>Submission Details - {selectedSubmission.candidate}</h2>
              <div className="req-tracking-modal-header-actions">
                {!isEditing ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleStartEdit}
                    disabled={selectedSubmission?.isExternal}
                    style={{
                      marginRight: "10px",
                      opacity: selectedSubmission?.isExternal ? 0.5 : 1,
                      cursor: selectedSubmission?.isExternal
                        ? "not-allowed"
                        : "pointer",
                    }}
                    title={
                      selectedSubmission?.isExternal
                        ? "External submissions are read-only. Edit in External Submissions page."
                        : "Edit submission"
                    }
                  >
                    <Edit size={16} /> Edit
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button
                      className="btn btn-success"
                      onClick={handleSaveEdit}
                      disabled={updateLoading}
                      style={{ marginRight: "8px" }}
                    >
                      <Save size={16} /> {updateLoading ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={updateLoading}
                      style={{ marginRight: "10px" }}
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  </div>
                )}
                <button
                  className="req-tracking-close-btn"
                  onClick={handleCloseModal}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="req-tracking-modal-body">
              <div className="req-tracking-view-details">
                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Candidate Name:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.candidate || ""}
                        onChange={(e) =>
                          handleEditInputChange("candidate", e.target.value)
                        }
                        className="form-control"
                      />
                    ) : (
                      selectedSubmission.candidate
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Job Title:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.jobTitle || ""}
                        onChange={(e) =>
                          handleEditInputChange("jobTitle", e.target.value)
                        }
                        className="form-control"
                      />
                    ) : (
                      selectedSubmission.jobTitle
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Skills:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.skills || ""}
                        onChange={(e) =>
                          handleEditInputChange("skills", e.target.value)
                        }
                        className="form-control"
                        placeholder="Enter skills separated by commas"
                      />
                    ) : Array.isArray(selectedSubmission.skills) ? (
                      selectedSubmission.skills.join(", ")
                    ) : (
                      selectedSubmission.skills
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Client:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.vendor || ""}
                        onChange={(e) =>
                          handleEditInputChange("vendor", e.target.value)
                        }
                        className="form-control"
                      />
                    ) : (
                      selectedSubmission.vendor
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Location:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.location || ""}
                        onChange={(e) =>
                          handleEditInputChange("location", e.target.value)
                        }
                        className="form-control"
                      />
                    ) : (
                      selectedSubmission.location
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Rate:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.rate || ""}
                        onChange={(e) =>
                          handleEditInputChange("rate", e.target.value)
                        }
                        className="form-control"
                      />
                    ) : (
                      selectedSubmission.rate
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Duration:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.duration || ""}
                        onChange={(e) =>
                          handleEditInputChange("duration", e.target.value)
                        }
                        className="form-control"
                      />
                    ) : (
                      selectedSubmission.duration
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">
                    Experience Required:
                  </div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.experience || ""}
                        onChange={(e) =>
                          handleEditInputChange("experience", e.target.value)
                        }
                        className="form-control"
                      />
                    ) : (
                      selectedSubmission.experience
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Job Type:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <select
                        value={editFormData.jobType || ""}
                        onChange={(e) =>
                          handleEditInputChange("jobType", e.target.value)
                        }
                        className="form-control"
                      >
                        <option value="">Select Job Type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Contract-to-hire">
                          Contract-to-hire
                        </option>
                        <option value="Temporary">Temporary</option>
                      </select>
                    ) : (
                      selectedSubmission.jobType
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Priority:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <select
                        value={editFormData.priority || ""}
                        onChange={(e) =>
                          handleEditInputChange("priority", e.target.value)
                        }
                        className="form-control"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    ) : (
                      <span
                        className={`req-tracking-priority-badge req-tracking-priority-${selectedSubmission.priority.toLowerCase()}`}
                      >
                        {selectedSubmission.priority}
                      </span>
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Current Status:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <select
                        value={editFormData.status || ""}
                        onChange={(e) =>
                          handleEditInputChange("status", e.target.value)
                        }
                        className="form-control"
                      >
                        {statusStages.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`req-tracking-status-badge req-tracking-status-${selectedSubmission.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {selectedSubmission.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">
                    Submission Date:
                  </div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editFormData.date || ""}
                        onChange={(e) =>
                          handleEditInputChange("date", e.target.value)
                        }
                        className="form-control"
                      />
                    ) : (
                      selectedSubmission.date
                    )}
                  </div>
                </div>

                {(selectedSubmission.interviewDate || isEditing) && (
                  <div className="req-tracking-view-row">
                    <div className="req-tracking-view-label">
                      Interview Date:
                    </div>
                    <div className="req-tracking-view-value">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editFormData.interviewDate || ""}
                          onChange={(e) =>
                            handleEditInputChange(
                              "interviewDate",
                              e.target.value
                            )
                          }
                          className="form-control"
                        />
                      ) : (
                        selectedSubmission.interviewDate
                      )}
                    </div>
                  </div>
                )}

                {(selectedSubmission.nextStep || isEditing) && (
                  <div className="req-tracking-view-row">
                    <div className="req-tracking-view-label">Next Step:</div>
                    <div className="req-tracking-view-value">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editFormData.nextStep || ""}
                          onChange={(e) =>
                            handleEditInputChange("nextStep", e.target.value)
                          }
                          className="form-control"
                        />
                      ) : (
                        selectedSubmission.nextStep
                      )}
                    </div>
                  </div>
                )}

                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Response:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <select
                        value={editFormData.response || ""}
                        onChange={(e) =>
                          handleEditInputChange("response", e.target.value)
                        }
                        className="form-control"
                      >
                        <option value="Waiting">Waiting</option>
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                        <option value="Interview Scheduled">
                          Interview Scheduled
                        </option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    ) : (
                      selectedSubmission.response
                    )}
                  </div>
                </div>

                {(selectedSubmission.candidateEmail && selectedSubmission.candidateEmail !== 'N/A') || isEditing ? (
                  <div className="req-tracking-view-row">
                    <div className="req-tracking-view-label">
                      {selectedSubmission?.isExternal ? 'Vendor Email:' : 'Candidate Email:'}
                    </div>
                    <div className="req-tracking-view-value">
                      {isEditing ? (
                        <input 
                          type="email" 
                          value={editFormData.candidateEmail || ''} 
                          onChange={(e) => handleEditInputChange('candidateEmail', e.target.value)} 
                          className="form-control"
                          disabled={selectedSubmission?.isExternal}
                        />
                      ) : selectedSubmission.candidateEmail}
                    </div>
                  </div>
                ) : null}

                {(selectedSubmission.candidatePhone && selectedSubmission.candidatePhone !== 'N/A') || isEditing ? (
                  <div className="req-tracking-view-row">
                    <div className="req-tracking-view-label">
                      {selectedSubmission?.isExternal ? 'Vendor Contact:' : 'Candidate Phone:'}
                    </div>
                    <div className="req-tracking-view-value">
                      {isEditing ? (
                        <input 
                          type="tel" 
                          value={editFormData.candidatePhone || ''} 
                          onChange={(e) => handleEditInputChange('candidatePhone', e.target.value)} 
                          className="form-control"
                          disabled={selectedSubmission?.isExternal}
                        />
                      ) : selectedSubmission.candidatePhone}
                    </div>
                  </div>
                ) : null}

                {(selectedSubmission.matchScore &&
                  selectedSubmission.matchScore !== "N/A") ||
                isEditing ? (
                  <div className="req-tracking-view-row">
                    <div className="req-tracking-view-label">Match Score:</div>
                    <div className="req-tracking-view-value">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editFormData.matchScore || ""}
                          onChange={(e) =>
                            handleEditInputChange("matchScore", e.target.value)
                          }
                          className="form-control"
                          placeholder="Enter percentage (0-100)"
                        />
                      ) : selectedSubmission.matchScore !== "N/A" ? (
                        `${selectedSubmission.matchScore}%`
                      ) : (
                        selectedSubmission.matchScore
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="req-tracking-view-row req-tracking-view-row-full">
                  <div className="req-tracking-view-label">Feedback Notes:</div>
                  <div className="req-tracking-view-value">
                    {isEditing ? (
                      <textarea
                        value={editFormData.feedbackNotes || ""}
                        onChange={(e) =>
                          handleEditInputChange("feedbackNotes", e.target.value)
                        }
                        className="form-control"
                        rows="4"
                        placeholder="Enter feedback notes..."
                      />
                    ) : (
                      selectedSubmission.feedbackNotes ||
                      "No feedback notes available"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionTracking;





