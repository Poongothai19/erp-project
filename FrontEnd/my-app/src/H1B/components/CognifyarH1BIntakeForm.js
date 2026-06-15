import React, { useState } from "react";
import "../styles/CognifyarH1B.css";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../url";
import logo from "../../Recruitment/Assets/images/download.png";
import { 
  FaCheck, 
  FaCircle, 
  FaTimes, 
  FaFileUpload, 
  FaFilePdf, 
  FaFileWord, 
  FaFileImage, 
  FaFileAlt,
  FaPhone,
  FaEnvelope,
  FaQuestionCircle,
  FaArrowUp,
  FaClipboardCheck,
  FaListAlt,
  FaPassport,
  FaFileSignature,
  FaUserGraduate,
  FaCheckSquare,
  FaCalendarAlt,
  FaCalendarCheck,
  FaInfoCircle
} from "react-icons/fa";

function Card({ title, children }) {
  return (
    <section className="cog-card">
      <h2 className="cog-section-title">{title}</h2>
      {children}
    </section>
  );
}

export default function CognifyarH1BIntakeForm() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  const [form, setForm] = useState({
    employer_name: "Cognifyar Technologies",
    filing_type: "",
    anticipated_start_date: "",
    prefix: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    passport_no: "",
    passport_expiry_date: "",
    nationality: "",
    country_of_birth: "",
    place_of_birth: "",
    phone: "",
    email: "",
    current_status: "",
    i94_expiration: "",
    bachelors_degree: "",
    bachelors_field: "",
    masters_degree: "",
    masters_field: "",
    masters_cap_quota_eligible: "",
    h4_required: "",
    h4_count: "",
    job_title: "",
    job_summary: "",
    expected_salary: "",
    worksite_address: "",
    home_address: "",
    offsite_details: "",
    end_client: "",
    tier1_vendor: "",
    tier2_vendor: "",
    tier3_vendor: "",
    consent: false,
  });

  const [files, setFiles] = useState({
    passport: null,
    visa_copy: null,
    resume: null,
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    passport: null,
    visa_copy: null,
    resume: null,
  });

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  // ✅ Handle file upload to backend
  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file size (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setMsg(`❌ ${fileType} file is too large. Maximum size is 50MB.`);
      return;
    }

    // Validate file type
    const allowedTypes = {
      passport: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      visa_copy: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      resume: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ],
    };

    if (!allowedTypes[fileType].includes(file.type)) {
      setMsg(`❌ Invalid file type for ${fileType}. Check accepted formats.`);
      return;
    }

    // Store file in state for submission
    setFiles((p) => ({ ...p, [fileType]: file }));
    setMsg(null);
  };

  // ✅ Submit function with S3 file upload - CORRECTED
const submit = async (e) => {
  e?.preventDefault();
  
  setMsg(null);
  setShowSuccess(false);
  setSubmissionId(null);

  // Validation
  if (!form.first_name || !form.last_name || !form.email) {
    return setMsg("❌ Please fill First Name, Last Name, and Email.");
  }
  
  if (!form.current_status) {
    return setMsg("❌ Please select Current Nonimmigrant Status.");
  }
  
  if (!form.bachelors_degree) {
    return setMsg("❌ Please enter Bachelor's Degree information.");
  }
  
  if (!form.consent) {
    return setMsg("❌ Consent is required to submit.");
  }

  // Validate required files
  if (!files.resume) {
    return setMsg("❌ Please upload all required documents: Resume.");
  }

  setBusy(true);
  setMsg("📤 Uploading files to secure storage...");

  try {
    // ✅ STEP 1: Upload files to S3 and get S3 keys
    const uploadedS3Keys = {};
    const fileTypes = ['resume']; // passport and visa_copy are commented out

    for (const fileType of fileTypes) {
      if (!files[fileType]) {
        setBusy(false);
        return setMsg(`❌ Missing ${fileType.replace('_', ' ')} file.`);
      }

      setMsg(`📤 Uploading ${fileType.replace('_', ' ')}...`);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', files[fileType]);
      formData.append('fileType', fileType);
      formData.append('submissionId', 'temp');

      try {
        console.log(`Uploading ${fileType}:`, files[fileType].name);
        
        // Upload to S3 via backend
        const uploadResponse = await fetch(`${BASE_URL}/api/h1b/upload`, {
          method: 'POST',
          // DO NOT set Content-Type header for FormData
          body: formData
        });

        console.log(`Upload response status for ${fileType}:`, uploadResponse.status);
        
        if (!uploadResponse.ok) {
          let errorText = await uploadResponse.text();
          console.error(`Upload failed for ${fileType}:`, errorText);
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || errorData.error || `Failed to upload ${fileType}`);
          } catch {
            throw new Error(`Upload failed with status ${uploadResponse.status}`);
          }
        }

        const uploadResult = await uploadResponse.json();
        console.log(`Upload result for ${fileType}:`, uploadResult);
        
        // ✅ CORRECTED: Check the correct property structure
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || `Upload failed for ${fileType}`);
        }

        // ✅ CORRECTED: Access s3Key from the right place
        const s3Key = uploadResult.file?.s3Key || uploadResult.data?.s3Key || uploadResult.s3Key;
        
        if (!s3Key) {
          console.error('No S3 key in response:', uploadResult);
          throw new Error(`No S3 key returned for ${fileType}`);
        }

        // Store the S3 key
        uploadedS3Keys[fileType] = s3Key;
        console.log(`✅ ${fileType} uploaded to S3:`, s3Key);

      } catch (uploadError) {
        console.error(`Upload error for ${fileType}:`, uploadError);
        setBusy(false);
        return setMsg(`❌ Failed to upload ${fileType.replace('_', ' ')}: ${uploadError.message}`);
      }
    }

    setMsg(`✅ All files uploaded! Saving application...`);
    console.log('Uploaded S3 keys:', uploadedS3Keys);

    // ✅ STEP 2: Prepare submission data with S3 keys
    const submissionData = {
      // Personal Information
      prefix: form.prefix,
      first_name: form.first_name,
      middle_name: form.middle_name,
      last_name: form.last_name,
      gender: form.gender,
      date_of_birth: form.date_of_birth || null,
      
      // Contact
      phone: form.phone || '',
      email: form.email,
      
      // Passport & Nationality
      passport_number: form.passport_no || '',
      passport_expiry_date: form.passport_expiry_date || null,
      nationality: form.nationality || '',
      country_of_birth: form.country_of_birth || '',
      place_of_birth: form.place_of_birth || '',
      
      // Immigration
      current_status: form.current_status,
      i94_expiration: form.i94_expiration || null,
      
      // Employment
      position_title: form.job_title || '',
      job_summary: form.job_summary || '',
      expected_salary: form.expected_salary || '',
      worksite_address: form.worksite_address || '',
      home_address: form.home_address || '',
      offsite_details: form.offsite_details || '',
      
      // Education
      bachelors_degree: form.bachelors_degree,
      bachelors_field: form.bachelors_field || '',
      masters_degree: form.masters_degree || '',
      masters_field: form.masters_field || '',
      masters_cap_quota_eligible: form.masters_cap_quota_eligible || '',
      
      // Client & Vendor
      end_client: form.end_client || '',
      tier1_vendor: form.tier1_vendor || '',
      tier2_vendor: form.tier2_vendor || '',
      tier3_vendor: form.tier3_vendor || '',
      
      // Filing
      filing_type: form.filing_type,
      employer_name: form.employer_name,
      anticipated_start_date: form.anticipated_start_date || null,
      h4_required: form.h4_required || '',
      h4_count: form.h4_count || '',
      
      // ✅ Use actual S3 keys from upload
      passport_copy_s3_key: uploadedS3Keys.passport || '',
      visa_copy_s3_key: uploadedS3Keys.visa_copy || '',
      resume_s3_key: uploadedS3Keys.resume || '',
      
      // Consent
      consent: form.consent
    };

    console.log('Submitting data to backend:', submissionData);

    // ✅ STEP 3: Save to database using PUBLIC route
    const saveResponse = await fetch(`${BASE_URL}/api/h1b/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData)
    });

    console.log('Save response status:', saveResponse.status);
    
    if (!saveResponse.ok) {
      let errorMessage = 'Failed to save application';
      try {
        const errorData = await saveResponse.json();
        console.error('Backend save error:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    const saveResult = await saveResponse.json();
    console.log('Save result:', saveResult);
    
    if (saveResult.success) {
      // ✅ CORRECTED: Get submission ID from different possible locations
      const submissionId = saveResult.submission_id || 
                          saveResult.data?.submission_id || 
                          saveResult.data?.SubmissionId || 
                          `H1B-${saveResult.data?.Id || saveResult.data?.id || Date.now()}`;
      
      setSubmissionId(submissionId);
      setMsg(`✅ Application submitted successfully! Your Submission ID: ${submissionId}`);
      setShowSuccess(true);
      
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      throw new Error(saveResult.message || 'Submission failed');
    }
    
  } catch (e) {
    console.error('Submission error:', e);
    setMsg(`❌ Submission failed: ${e.message}`);
    
    // Add more detailed error info
    if (e.message.includes('Failed to fetch')) {
      setMsg(`❌ Cannot connect to server. Please check your internet connection and try again.`);
    }
  } finally {
    setBusy(false);
  }
};

  const resetForm = () => {
    setForm({
      employer_name: "Cognifyar Technologies",
      filing_type: "",
      anticipated_start_date: "",
      prefix: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      gender: "",
      date_of_birth: "",
      passport_no: "",
      passport_expiry_date: "",
      nationality: "",
      country_of_birth: "",
      place_of_birth: "",
      phone: "",
      email: "",
      current_status: "",
      i94_expiration: "",
      bachelors_degree: "",
      bachelors_field: "",
      masters_degree: "",
      masters_field: "",
      masters_cap_quota_eligible: "",
      h4_required: "",
      job_title: "",
      job_summary: "",
      expected_salary: "",
      worksite_address: "",
      home_address: "",
      offsite_details: "",
      end_client: "",
      tier1_vendor: "",
      tier2_vendor: "",
      tier3_vendor: "",
      consent: false,
    });
    setFiles({
      passport: null,
      visa_copy: null,
      resume: null,
    });
    setUploadedFiles({
      passport: null,
      visa_copy: null,
      resume: null,
    });
    setMsg(null);
    setSubmissionId(null);
    setShowSuccess(false);
    setUploadProgress({});
  };

  const startNewApplication = () => {
    resetForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="cog-container">
      {/* Navigation Bar */}
      <header className="cog-header">
        <div className="cog-container-inner">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "2px" }}>
                  <img src={logo} alt="Cognifyar Technologies Logo" style={{ height: "60px", objectFit: "contain" }} />
                </div>
                <div style={{ fontSize: 16, opacity: 0.9, marginLeft: "8px" }}>
                  H-1B Intake Portal
                </div>
              </div>
            </div>
            
            {/* Contact Information Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    <FaPhone size={12} />
                  </span>
                  <a 
                    href="tel:+919150283384" 
                    style={{ 
                      fontSize: 12, 
                      color: "white", 
                      textDecoration: "none",
                      fontWeight: 500 
                    }}
                  >
                    +91 91502 83384
                  </a>
                </div>
                <div style={{ height: 12, width: 1, background: "rgba(255,255,255,0.3)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    <FaPhone size={12} />
                  </span>
                  <a 
                    href="tel:+15516894006" 
                    style={{ 
                      fontSize: 12, 
                      color: "white", 
                      textDecoration: "none",
                      fontWeight: 500 
                    }}
                  >
                    +1 (551) 689 4006
                  </a>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  <FaEnvelope size={12} />
                </span>
                <a 
                  href="mailto:notifications@cognifyar.com" 
                  style={{ 
                    fontSize: 12, 
                    color: "white", 
                    textDecoration: "none",
                    fontWeight: 500 
                  }}
                >
                  onboarding@cognifyar.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="cog-main">
        {showSuccess && submissionId && (
          <div
            className="cog-card"
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "2px solid rgba(34, 197, 94, 0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(34, 197, 94, 0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                <FaCheck size={24} color="#22c55e" />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  Application Submitted Successfully!
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "#ffffff",
                    fontSize: 13,
                  }}
                >
                  Your H-1B application has been received. Please save
                  your Submission ID for future reference.
                </p>
                <div
                  style={{
                    marginTop: 8,
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.9)",
                    borderRadius: 8,
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <div
                    style={{ fontWeight: 600, color: "#475569", fontSize: 12 }}
                  >
                    SUBMISSION ID
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#0B2A4A",
                      fontFamily: "monospace",
                      letterSpacing: 1,
                    }}
                  >
                    {submissionId}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748B",
                      marginTop: 4,
                    }}
                  >
                    Submission Time: {new Date().toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button
                    onClick={startNewApplication}
                    className="cog-button-primary"
                    style={{ background: "#0B2A4A" }}
                  >
                    Submit Another Application
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(submissionId);
                      alert("Submission ID copied to clipboard!");
                    }}
                    className="cog-button-primary"
                    style={{ background: "#64748B" }}
                  >
                    <FaClipboardCheck style={{ marginRight: 8 }} />
                    Copy Submission ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {msg && !showSuccess && (
          <div
            className={`cog-message ${
              msg.startsWith("✅")
                ? "cog-message-success"
                : msg.includes("❌")
                  ? "cog-message-error"
                  : "cog-message-warning"
            }`}
          >
            {msg}
          </div>
        )}

        {!showSuccess && (
          <>
            <div
              className="cog-card"
              style={{ background: "rgba(245, 158, 11, 0.05)" }}
            >
              <div
                style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <div style={{ fontSize: 24 }}>
                  <FaListAlt size={24} color="#92400e" />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", color: "#f8f8f8" }}>
                    Application Checklist
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                      {form.first_name && form.last_name ? (
                        <FaCheck size={12} color="#22c55e" />
                      ) : (
                        <FaCircle size={12} color="#ef4444" />
                      )}
                      Personal Information
                    </div>
                    <div style={{ fontSize: 13, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                      {form.email ? (
                        <FaCheck size={12} color="#22c55e" />
                      ) : (
                        <FaCircle size={12} color="#ef4444" />
                      )}
                      Contact Details
                    </div>
                    <div style={{ fontSize: 13, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                      {form.current_status ? (
                        <FaCheck size={12} color="#22c55e" />
                      ) : (
                        <FaCircle size={12} color="#ef4444" />
                      )}
                      Immigration Status
                    </div>
                    <div style={{ fontSize: 13, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                      {form.bachelors_degree ? (
                        <FaCheck size={12} color="#22c55e" />
                      ) : (
                        <FaCircle size={12} color="#ef4444" />
                      )}
                      Education Details
                    </div>
                    <div style={{ fontSize: 13, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                      {files.resume ? (
                        <FaCheck size={12} color="#22c55e" />
                      ) : (
                        <FaCircle size={12} color="#ef4444" />
                      )}
                      Documents Uploaded
                    </div>
                    <div style={{ fontSize: 13, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                      {form.consent ? (
                        <FaCheck size={12} color="#22c55e" />
                      ) : (
                        <FaCircle size={12} color="#ef4444" />
                      )}
                      Consent Given
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form sections (same as before) */}
            <Card title="Employee Personal Information">
              <div className="cog-grid" style={{ gridTemplateColumns: "100px 1fr 1fr 1fr" }}>
                <div className="cog-form-group">
                  <label className="cog-label">Prefix</label>
                  <select
                    className="cog-select"
                    value={form.prefix}
                    onChange={(e) => setField("prefix", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option>Mr.</option>
                    <option>Mrs.</option>
                    <option>Ms.</option>
                    <option>Dr.</option>
                  </select>
                </div>
                <div className="cog-form-group">
                  <label className="cog-label h1b-required">First Name</label>
                  <input
                    className="cog-input"
                    value={form.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                    onFocus={() => handleFocus("first_name")}
                    onBlur={handleBlur}
                    required
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">Middle Name</label>
                  <input
                    className="cog-input"
                    value={form.middle_name}
                    onChange={(e) => setField("middle_name", e.target.value)}
                    onFocus={() => handleFocus("middle_name")}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label h1b-required">Last Name</label>
                  <input
                    className="cog-input"
                    value={form.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                    onFocus={() => handleFocus("last_name")}
                    onBlur={handleBlur}
                    required
                  />
                </div>
              </div>

              <div className="cog-grid" style={{ marginTop: 8 }}>
                <div className="cog-form-group">
                  <label className="cog-label">Gender</label>
                  <select
                    className="cog-select"
                    value={form.gender}
                    onChange={(e) => setField("gender", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">
                    Date of Birth (MM/DD/YYYY)
                  </label>
                  <input
                    className="cog-input"
                    placeholder="MM/DD/YYYY"
                    value={form.date_of_birth}
                    onChange={(e) => setField("date_of_birth", e.target.value)}
                    onFocus={() => handleFocus("date_of_birth")}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">Passport No.</label>
                  <input
                    className="cog-input"
                    value={form.passport_no}
                    onChange={(e) => setField("passport_no", e.target.value)}
                    onFocus={() => handleFocus("passport_no")}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              <div className="cog-grid" style={{ marginTop: 8 }}>
                <div className="cog-form-group">
                  <label className="cog-label">
                    Passport Expiry Date (MM/DD/YYYY)
                  </label>
                  <input
                    className="cog-input"
                    placeholder="MM/DD/YYYY"
                    value={form.passport_expiry_date}
                    onChange={(e) =>
                      setField("passport_expiry_date", e.target.value)
                    }
                    onFocus={() => handleFocus("passport_expiry_date")}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">Nationality</label>
                  <input
                    className="cog-input"
                    value={form.nationality}
                    onChange={(e) => setField("nationality", e.target.value)}
                    onFocus={() => handleFocus("nationality")}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">Country of Birth</label>
                  <input
                    className="cog-input"
                    value={form.country_of_birth}
                    onChange={(e) =>
                      setField("country_of_birth", e.target.value)
                    }
                    onFocus={() => handleFocus("country_of_birth")}
                    onBlur={handleBlur}
                    placeholder=""
                  />
                </div>
              </div>

              <div className="cog-grid" style={{ marginTop: 8 }}>
                <div className="cog-form-group">
                  <label className="cog-label">Place of Birth (City)</label>
                  <input
                    className="cog-input"
                    value={form.place_of_birth}
                    onChange={(e) => setField("place_of_birth", e.target.value)}
                    onFocus={() => handleFocus("place_of_birth")}
                    onBlur={handleBlur}
                    placeholder=""
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">Phone Number</label>
                  <input
                    className="cog-input"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    onFocus={() => handleFocus("phone")}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label h1b-required">Email</label>
                  <input
                    className="cog-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    onFocus={() => handleFocus("email")}
                    onBlur={handleBlur}
                    required
                  />
                </div>
              </div>
            </Card>

            <Card title="Immigration Status">
              <div className="cog-grid">
                <div className="cog-form-group">
                  <label className="cog-label h1b-required">
                    Current Nonimmigrant Status
                  </label>
                  <select
                    className="cog-select"
                    value={form.current_status}
                    onChange={(e) => setField("current_status", e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option>Not in USA</option>
                    <option>H-4</option>
                    <option>L-1</option>
                    <option>L-2</option>
                    <option>EAD</option>
                    <option>OPT</option>
                    <option>CPT</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">
                    I-94 Expiration Date (if applicable)
                  </label>
                  <input
                    className="cog-input"
                    type="date"
                    value={form.i94_expiration}
                    onChange={(e) => setField("i94_expiration", e.target.value)}
                    onFocus={() => handleFocus("i94_expiration")}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">Type of Filing</label>
                  <select
                    className="cog-select"
                    value={form.filing_type}
                    onChange={(e) => setField("filing_type", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option>H1 Transfer</option>
                    <option>Extension</option>
                    <option>Amendment</option>
                    <option>Extension & Amendment</option>
                    <option>H1B Lottery</option>
                    <option>Change of Status</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card title="Education">
              <div className="cog-grid">
                <div className="cog-form-group">
                  <label className="cog-label h1b-required">
                    Bachelor's Degree
                  </label>
                  <input
                    className="cog-input"
                    value={form.bachelors_degree}
                    onChange={(e) =>
                      setField("bachelors_degree", e.target.value)
                    }
                    placeholder="e.g., Bachelor of Science in Computer Science"
                    onFocus={() => handleFocus("bachelors_degree")}
                    onBlur={handleBlur}
                    required
                  />
                </div>
              </div>

              <div className="cog-grid" style={{ marginTop: 12 }}>
                <div className="cog-form-group">
                  <label className="cog-label">Master's Degree</label>
                  <input
                    className="cog-input"
                    value={form.masters_degree}
                    onChange={(e) => setField("masters_degree", e.target.value)}
                    placeholder="e.g., Master of Science in Engineering"
                    onFocus={() => handleFocus("masters_degree")}
                    onBlur={handleBlur}
                  />
                </div>
              </div>


            </Card>

            <Card title="Employment Details (if applicable)">
              <div className="cog-grid">
                <div className="cog-form-group">
                  <label className="cog-label">Job Title</label>
                  <input
                    className="cog-input"
                    value={form.job_title}
                    onChange={(e) => setField("job_title", e.target.value)}
                    onFocus={() => handleFocus("job_title")}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">Expected Salary</label>
                  <input
                    className="cog-input"
                    value={form.expected_salary}
                    onChange={(e) =>
                      setField("expected_salary", e.target.value)
                    }
                    onFocus={() => handleFocus("expected_salary")}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="cog-label">Job Duties / Summary</label>
                <textarea
                  className="cog-textarea"
                  style={
                    focusedField === "job_summary"
                      ? {
                          borderColor: "rgba(13, 148, 136, 1)",
                          boxShadow: "0 0 0 3px rgba(13, 148, 136, 0.1)",
                        }
                      : {}
                  }
                  value={form.job_summary}
                  onChange={(e) => setField("job_summary", e.target.value)}
                  onFocus={() => handleFocus("job_summary")}
                  onBlur={handleBlur}
                  placeholder="Describe job duties and responsibilities..."
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="cog-label">Worksite Address</label>
                <textarea
                  className="cog-textarea"
                  style={{
                    minHeight: "70px",
                    ...(focusedField === "worksite_address"
                      ? {
                          borderColor: "rgba(13, 148, 136, 1)",
                          boxShadow: "0 0 0 3px rgba(13, 148, 136, 0.1)",
                        }
                      : {}),
                  }}
                  value={form.worksite_address}
                  onChange={(e) => setField("worksite_address", e.target.value)}
                  onFocus={() => handleFocus("worksite_address")}
                  onBlur={handleBlur}
                  placeholder="Enter worksite address..."
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="cog-label">Home Address</label>
                <textarea
                  className="cog-textarea"
                  style={{
                    minHeight: "70px",
                    ...(focusedField === "home_address"
                      ? {
                          borderColor: "rgba(13, 148, 136, 1)",
                          boxShadow: "0 0 0 3px rgba(13, 148, 136, 0.1)",
                        }
                      : {}),
                  }}
                  value={form.home_address}
                  onChange={(e) => setField("home_address", e.target.value)}
                  onFocus={() => handleFocus("home_address")}
                  onBlur={handleBlur}
                  placeholder="Enter home address..."
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="cog-label">
                  Employment outside of USA (if applicable)
                </label>
                <textarea
                  className="cog-textarea"
                  style={{
                    minHeight: "70px",
                    ...(focusedField === "offsite_details"
                      ? {
                          borderColor: "rgba(13, 148, 136, 1)",
                          boxShadow: "0 0 0 3px rgba(13, 148, 136, 0.1)",
                        }
                      : {}),
                  }}
                  value={form.offsite_details}
                  onChange={(e) => setField("offsite_details", e.target.value)}
                  onFocus={() => handleFocus("offsite_details")}
                  onBlur={handleBlur}
                  placeholder="Details about employment outside USA..."
                />
              </div>
            </Card>

            <Card title="Client & Vendor Chain">
              <div className="cog-grid">
                <div className="cog-form-group">
                  <label className="cog-label">End Client</label>
                  <input
                    className="cog-input"
                    value={form.end_client}
                    onChange={(e) => setField("end_client", e.target.value)}
                    onFocus={() => handleFocus("end_client")}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">Tier 1 Vendor</label>
                  <input
                    className="cog-input"
                    value={form.tier1_vendor}
                    onChange={(e) => setField("tier1_vendor", e.target.value)}
                    onFocus={() => handleFocus("tier1_vendor")}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
              <div className="cog-grid" style={{ marginTop: 12 }}>
                <div className="cog-form-group">
                  <label className="cog-label">Tier 2 Vendor</label>
                  <input
                    className="cog-input"
                    value={form.tier2_vendor}
                    onChange={(e) => setField("tier2_vendor", e.target.value)}
                    onFocus={() => handleFocus("tier2_vendor")}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="cog-form-group">
                  <label className="cog-label">Tier 3 Vendor</label>
                  <input
                    className="cog-input"
                    value={form.tier3_vendor}
                    onChange={(e) => setField("tier3_vendor", e.target.value)}
                    onFocus={() => handleFocus("tier3_vendor")}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
            </Card>

            <Card title="Dependent Filing">
              <div className="cog-grid">
                <div className="cog-form-group">
                  <label className="cog-label">
                    H-4 Dependent Filing Required?
                  </label>
                  <select
                    className="cog-select"
                    value={form.h4_required}
                    onChange={(e) => setField("h4_required", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                {form.h4_required === "Yes" && (
                  <div className="cog-form-group">
                    <label className="cog-label">
                      How many H-4
                    </label>
                    <select
                      className="cog-select"
                      value={form.h4_count}
                      onChange={(e) => setField("h4_count", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                      <option>4</option>
                      <option>5</option>
                    </select>
                  </div>
                )}
              </div>
            </Card>

            {/* ✅ UPLOAD DOCUMENTS - WORKING FILE UPLOADS */}
            <Card title="Upload Documents">
              <div style={{ display: "grid", gap: 12, width: "100%" }}>
                {/* PASSPORT AND VISA COPY UPLOADS COMMENTED OUT 
                <div className="cog-form-group">
                  <label className="cog-label h1b-required">
                    <FaPassport style={{ marginRight: 8 }} />
                    1. Passport (Required)
                  </label>
                  ...
                </div>
                
                <div className="cog-form-group">
                  <label className="cog-label h1b-required">
                    <FaFileSignature style={{ marginRight: 8 }} />
                    2. Visa Copy (Required)
                  </label>
                  ...
                </div>
                */}

                <div className="cog-form-group">
                  <label className="cog-label h1b-required">
                    <FaFileAlt style={{ marginRight: 8 }} />
                    3. Resume (Required)
                  </label>
                  <div
                    style={{
                      position: "relative",
                      border: "2px dashed #D7DBE7",
                      borderRadius: 10,
                      padding: 16,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      background: files.resume
                        ? "rgba(34, 197, 94, 0.05)"
                        : "rgba(226, 232, 240, 0.5)",
                      borderColor: files.resume
                        ? "rgba(34, 197, 94, 0.3)"
                        : "#D7DBE7",
                    }}
                  >
                    <input
                      type="file"
                      className="cog-file-input"
                      onChange={(e) => handleFileUpload(e, "resume")}
                      accept=".pdf,.doc,.docx,.txt"
                      style={{ display: "none" }}
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      style={{ cursor: "pointer", display: "block" }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}>
                        <FaFileUpload size={24} />
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#0B2A4A",
                          marginBottom: 4,
                        }}
                      >
                        {files.resume
                          ? "✅ File Selected"
                          : "Click to upload or drag & drop"}
                      </div>
                      {files.resume && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748B",
                            marginTop: 4,
                          }}
                        >
                          {files.resume.name} (
                          {(files.resume.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      )}
                    </label>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <FaInfoCircle size={10} />
                    Accepted: <FaFilePdf size={10} /> PDF, <FaFileWord size={10} /> DOC/DOCX, <FaFileAlt size={10} /> TXT (Max 50MB)
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Consent & Final Submission">
              <div style={{ marginBottom: 14 }}>
                <label className="cog-checkbox-label">
                  <input
                    type="checkbox"
                    className="cog-checkbox"
                    checked={form.consent}
                    onChange={(e) => setField("consent", e.target.checked)}
                    required
                  />
                  <div style={{color :'black', display: "flex", alignItems: "center", gap: 8 }}>
                    <FaCheckSquare />
                    I confirm that the information provided is accurate and
                    complete, and I understand that only the submitted details
                    will be stored. *
                  </div>
                </label>

                {/* 
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "12px 14px",
                    borderRadius: 8,
                    marginTop: 12,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <FaInfoCircle color="#0B2A4A" />
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0B2A4A",
                      }}
                    >
                      Important Dates & Information:
                    </div>
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                      <FaCalendarAlt size={12} style={{ marginTop: 2 }} />
                      <div>
                        <strong>Prophecy application deadline:</strong> Submit
                        all required H‑1B details and documents by March 18, 2026.
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                      <FaCalendarAlt size={12} style={{ marginTop: 2 }} />
                      <div>
                        <strong>USCIS H‑1B cap registration period:</strong>{" "}
                        March 4, 2026 – March 19, 2026.
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                      <FaCalendarCheck size={12} style={{ marginTop: 2 }} />
                      <div>
                        <strong>USCIS H‑1B selection notifications:</strong>{" "}
                        Expected by April 1, 2026.
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <FaEnvelope size={12} style={{ marginTop: 2 }} />
                      <div>
                        You will receive a confirmation email with your
                        Submission ID after successful submission.
                      </div>
                    </div>
                  </div>
                </div>
                */}
              </div>

              <div className="cog-action-buttons">
                <button
                  className="cog-button-primary"
                  disabled={busy}
                  onClick={submit}
                  style={{ flex: 2 }}
                >
                  {busy ? "Submitting..." : "Submit H-1B Application"}
                </button>
                <button
                  onClick={resetForm}
                  className="cog-button-primary"
                  style={{
                    flex: 1,
                    background: "#64748B",
                  }}
                >
                  Clear Form
                </button>
              </div>

              {/* 
              <div className="cog-debug-info" style={{ marginTop: 12 }}>
                <div className="cog-debug-title">Application Progress:</div>
                <div>
                  • Personal Info:{" "}
                  {form.first_name && form.last_name
                    ? "✓ Complete"
                    : "✗ Required"}
                </div>
                <div>• Contact: {form.email ? "✓ Complete" : "✗ Required"}</div>
                <div>
                  • Immigration:{" "}
                  {form.current_status ? "✓ Complete" : "✗ Required"}
                </div>
                <div>
                  • Education:{" "}
                  {form.bachelors_degree ? "✓ Complete" : "✗ Required"}
                </div>
                <div>
                  • Documents: {Object.values(files).filter((f) => f).length}/3
                  uploaded
                </div>
                <div>• Consent: {form.consent ? "✓ Given" : "✗ Required"}</div>
              </div>
              */}
            </Card>
          </>
        )}

        {/* Footer Information - Updated with contact details */}
        <div
          className="cog-card"
          style={{
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#0B2A4A" }}>Need Help?</h3>
          
          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            marginBottom: 16 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: "#475569" }}>
                  <FaPhone size={14} />
                </span>
                <a 
                  href="tel:+919150283384" 
                  style={{ 
                    fontSize: 14, 
                    color: "#0B2A4A", 
                    textDecoration: "none",
                    fontWeight: 600 
                  }}
                >
                  +91 91502 83384
                </a>
              </div>
              <div style={{ height: 16, width: 1, background: "#e2e8f0" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: "#475569" }}>
                  <FaPhone size={14} />
                </span>
                <a 
                  href="tel:+15516894006" 
                  style={{ 
                    fontSize: 14, 
                    color: "#0B2A4A", 
                    textDecoration: "none",
                    fontWeight: 600 
                  }}
                >
                  +1 (551) 689 4006
                </a>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, color: "#475569" }}>
                <FaEnvelope size={14} />
              </span>
              <a 
                href="mailto:onboarding@cognifyar.com" 
                style={{ 
                  fontSize: 14, 
                  color: "#0B2A4A", 
                  textDecoration: "none",
                  fontWeight: 600 
                }}
              >
                onboarding@cognifyar.com
              </a>
            </div>
          </div>
          
          <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
            This is a public application portal. No login required. All data is securely processed.
          </div>
        </div>
      </main>

      {/* Fixed Help Button - Updated contact info */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => {
            const container = document.querySelector('.main-content');
            if (container) {
              container.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          style={{
            background: "rgba(13, 148, 136, 0.9)",
            color: "white",
            border: "none",
            width: 40,
            height: 40,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <FaArrowUp />
        </button>
      </div>
    </div>
  );
}

