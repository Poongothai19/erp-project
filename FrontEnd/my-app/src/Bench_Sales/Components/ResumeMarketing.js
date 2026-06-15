import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import BASE_URL from "../../url";
import "../Styles/BenchSalesStyles.css";
import {
  Send,
  Mail,
  MessageSquare,
  Phone,
  Users,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Search,
  X,
  ChevronDown,
} from "lucide-react";

const sanitizeText = (text) => {
  if (!text) return "";
  return String(text)
    // Remove all non-ASCII special characters
    .replace(/[\u0080-\uFFFF]/g, (char) => {
      const code = char.charCodeAt(0);
      // Keep common accented characters and spaces
      if ((code >= 0x00C0 && code <= 0x00FF) || code === 32) {
        return char;
      }
      return "";
    })
    // Remove control characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    // Remove all remaining special Unicode characters
    .replace(/[^\w\s\-./,@()&:%$#!?*+="']/gi, "")
    .trim();
};

const ResumeMarketing = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search and filter states
  const [candidateSearchTerm, setCandidateSearchTerm] = useState("");
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  
  // Ref for dropdown
  const dropdownRef = useRef(null);

  // Sanitize text to remove problematic Unicode characters
  const sanitizeText = (text) => {
    if (!text) return "";
    return String(text)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Control characters
      .replace(/[\u2000-\u200D\u200F\u2028\u2029]/g, "") // Invisible spaces
      .replace(/[\uFEFF\uFFFE]/g, "") // BOM
      .replace(/[\u2022\u2023\u2043\u204F]/g, "") // Bullet points
      .replace(/[\u25A0-\u25FF]/g, "") // Geometric shapes
      .replace(/[◆◇♦♢✦✧]/g, "") // Diamond symbols
      .trim();
  };

  const fetchWithRetry = async (url, options, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, options);
      return response;
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt}/${maxRetries} failed. Retrying...`, error.message);
      
      // Only retry on server errors (5xx) or network errors
      if (error.response?.status >= 500 || !error.response) {
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff: 1s, 2s, 3s)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
      } else {
        // Don't retry on client errors (4xx)
        throw error;
      }
    }
  }
  
  throw lastError;
};


  // Fetch candidates from Resume API
const fetchCandidates = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    Swal.fire({
      title: "Authentication Required",
      text: "Please login to access candidates",
      icon: "warning",
    }).then(() => {
      window.location.href = "/login";
    });
    return;
  }

  try {
    const response = await fetchWithRetry(
      `${BASE_URL}/api/candidates`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      3 // Max 3 retries
    );

    let candidatesData = [];
    if (response.data.success && response.data.data) {
      candidatesData = response.data.data;
    } else if (Array.isArray(response.data)) {
      candidatesData = response.data;
    }

    // Transform candidates and sanitize
    const transformedCandidates = candidatesData.map((candidate) => {
      const skills = Array.isArray(candidate.Skills)
        ? candidate.Skills
        : candidate.Skills
        ? candidate.Skills.split(",")
        : [];

      return {
        id: candidate.Id,
        name: sanitizeText(candidate.Name || ""),
        skills: skills.map((s) => sanitizeText(s)),
        experience: candidate.Experience || 0,
        role: sanitizeText(candidate.JobRole || ""),
        status: sanitizeText(candidate.Status || "Available"),
        email: sanitizeText(candidate.Email || ""),
        phone: sanitizeText(candidate.Phone || ""),
        location: sanitizeText(candidate.Location || ""),
        availability: sanitizeText(candidate.Availability || ""),
        visaStatus: sanitizeText(candidate.VisaStatus || ""),
      };
    });

    setCandidates(transformedCandidates);
    setFilteredCandidates(transformedCandidates);
    console.log("Candidates loaded successfully:", transformedCandidates.length);
  } catch (error) {
    console.error("Error fetching candidates after retries:", error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      Swal.fire("Session Expired", "Please login again", "warning").then(
        () => {
          window.location.href = "/login";
        }
      );
    } else if (error.response?.status === 404) {
      // Use mock data if API endpoint doesn't exist
      const mockCandidates = [
        {
          id: 1,
          name: "John Doe",
          skills: ["React", "Node.js", "JavaScript"],
          experience: 5,
          role: "Full Stack Developer",
          status: "Available",
          email: "john@example.com",
          phone: "123-456-7890",
          location: "New York",
          availability: "Immediate",
          visaStatus: "H1B",
        },
      ];
      setCandidates(mockCandidates);
      setFilteredCandidates(mockCandidates);
      console.log("Using mock data as API endpoint not found");
    } else if (error.response?.status >= 500) {
      // Server error
      Swal.fire(
        "Server Error",
        "The server is temporarily unavailable. Please try again in a moment.",
        "error"
      );
      setCandidates([]);
      setFilteredCandidates([]);
    } else if (!error.response) {
      // Network error
      Swal.fire(
        "Network Error",
        "Unable to connect to the server. Please check your internet connection.",
        "error"
      );
      setCandidates([]);
      setFilteredCandidates([]);
    } else {
      Swal.fire("Error", "Failed to load candidates", "error");
      setCandidates([]);
      setFilteredCandidates([]);
    }
  }
};

  // Fetch vendors from Vendor API
const fetchVendors = async () => {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetchWithRetry(
      `${BASE_URL}/api/vendors`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      3 // Max 3 retries
    );

    let vendorsData = [];
    if (response.data.success && response.data.data) {
      vendorsData = response.data.data;
    } else if (Array.isArray(response.data)) {
      vendorsData = response.data;
    }

    // Filter active vendors and sanitize
    const activeVendors = vendorsData
      .filter(
        (vendor) => vendor.Status && vendor.Status.toLowerCase() === "active"
      )
      .map((vendor) => ({
        ...vendor,
        Name: sanitizeText(vendor.Name || ""),
        ContactPerson: sanitizeText(vendor.ContactPerson || ""),
        Email: sanitizeText(vendor.Email || ""),
        Phone: sanitizeText(vendor.Phone || ""),
        Address: sanitizeText(vendor.Address || ""),
        City: sanitizeText(vendor.City || ""),
        State: sanitizeText(vendor.State || ""),
      }));

    setVendors(activeVendors);
    console.log("Vendors loaded successfully:", activeVendors.length);
  } catch (error) {
    console.error("Error fetching vendors after retries:", error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    } else if (error.response?.status >= 500) {
      console.warn("Vendor API server error - retries exhausted");
    } else if (!error.response) {
      console.warn("Network error - unable to load vendors");
    }
    
    setVendors([]);
  }
};

  // Fetch submission history (mock data for now)
  const fetchSubmissions = async () => {
    const mockSubmissions = [
      {
        id: 1,
        candidateName: "John Doe",
        vendorName: "Tech Solutions Inc",
        submittedDate: "2025-01-15",
        method: "Email",
        response: "Positive",
        status: "Submitted",
        responseDate: "2025-01-16",
      },
      {
        id: 2,
        candidateName: "Jane Smith",
        vendorName: "Global Staffing LLC",
        submittedDate: "2025-01-14",
        method: "WhatsApp",
        response: "Waiting",
        status: "Submitted",
        responseDate: null,
      },
      {
        id: 3,
        candidateName: "Mike Johnson",
        vendorName: "IT Recruiters Co",
        submittedDate: "2025-01-13",
        method: "SMS",
        response: "Rejected",
        status: "Closed",
        responseDate: "2025-01-14",
      },
    ];

    setSubmissions(mockSubmissions);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCandidates(),
          fetchVendors(),
          fetchSubmissions(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsVendorDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter candidates based on search term
  useEffect(() => {
    if (!candidateSearchTerm.trim()) {
      setFilteredCandidates(candidates);
    } else {
      const filtered = candidates.filter((candidate) => {
        const searchLower = candidateSearchTerm.toLowerCase();
        return (
          candidate.name.toLowerCase().includes(searchLower) ||
          candidate.role.toLowerCase().includes(searchLower) ||
          candidate.skills.some((skill) =>
            skill.toLowerCase().includes(searchLower)
          ) ||
          candidate.location?.toLowerCase().includes(searchLower) ||
          candidate.email?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredCandidates(filtered);
    }
  }, [candidateSearchTerm, candidates]);

  // Filter vendors based on search term
  const filteredVendors = vendors.filter((vendor) => {
    if (!vendorSearchTerm.trim()) return true;
    const searchLower = vendorSearchTerm.toLowerCase();
    return (
      vendor.Name.toLowerCase().includes(searchLower) ||
      vendor.ContactPerson?.toLowerCase().includes(searchLower) ||
      vendor.Email?.toLowerCase().includes(searchLower)
    );
  });

  const handleCandidateSelection = (candidateId) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(
        selectedCandidates.filter((id) => id !== candidateId)
      );
    } else {
      setSelectedCandidates([...selectedCandidates, candidateId]);
    }
  };

  const handleSelectAllCandidates = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(
        filteredCandidates.map((candidate) => candidate.id)
      );
    }
  };

  const handleVendorSelection = (vendorId) => {
    if (selectedVendors.includes(vendorId)) {
      setSelectedVendors(selectedVendors.filter((id) => id !== vendorId));
    } else {
      setSelectedVendors([...selectedVendors, vendorId]);
    }
  };

  const handleSelectAllVendors = () => {
    if (selectedVendors.length === filteredVendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(filteredVendors.map((vendor) => vendor.Id));
    }
  };

  const removeSelectedVendor = (vendorId) => {
    setSelectedVendors(selectedVendors.filter((id) => id !== vendorId));
  };

  const getSelectedVendorNames = () => {
    return selectedVendors
      .map((id) => {
        const vendor = vendors.find((v) => v.Id === id);
        return vendor ? sanitizeText(vendor.Name) : "";
      })
      .filter((name) => name);
  };

  // Generate email content for Gmail compose
  const generateEmailContent = (selectedVendorData, selectedCandidateData) => {
    const subject = `Resume Submission - ${
      selectedCandidateData.length
    } Candidate${selectedCandidateData.length > 1 ? "s" : ""}`;

    const candidateDetails = selectedCandidateData
      .map((candidate) => {
        return `
Name: ${sanitizeText(candidate.name)}
Role: ${sanitizeText(candidate.role) || "N/A"}
Skills: ${candidate.skills.map(s => sanitizeText(s)).join(", ") || "N/A"}
Location: ${sanitizeText(candidate.location) || "N/A"}
Experience: ${candidate.experience} years
Email: ${sanitizeText(candidate.email) || "N/A"}
Phone: ${sanitizeText(candidate.phone) || "N/A"}
Availability: ${sanitizeText(candidate.availability) || "N/A"}
Visa Status: ${sanitizeText(candidate.visaStatus) || "N/A"}
      `.trim();
      })
      .join("\n\n" + "=".repeat(50) + "\n\n");

    const body = `Dear ${
      sanitizeText(selectedVendorData.ContactPerson) || sanitizeText(selectedVendorData.Name)
    },

I hope this email finds you well.

I am writing to submit ${selectedCandidateData.length} qualified candidate${
      selectedCandidateData.length > 1 ? "s" : ""
    } for your consideration. Please find the details below:

${candidateDetails}

Please let me know if you need any additional information or would like to schedule interviews for any of these candidates.

Best regards,
${localStorage.getItem("userName") || "Prophecy Technologies"}

---
Company: Prophecy Technologies
Website: www.prophecytechs.com
    `;

    return { subject, body };
  };

  // Fixed bulk email function with full candidate details and no distribution list
  const openBulkGmailCompose = (selectedVendorData, selectedCandidateData) => {
    const subject = `Resume Submission - ${selectedCandidateData.length} Candidate${selectedCandidateData.length > 1 ? 's' : ''}`;
    
    // Create recipient list
    const vendorEmails = selectedVendorData.map(vendor => sanitizeText(vendor.Email)).filter(email => email);
    const toEmail = vendorEmails[0];
    const ccEmails = vendorEmails.slice(1).join(',');
    
    // ALWAYS use condensed version to stay within URL limits
    const condensedDetails = selectedCandidateData.map((candidate, index) => {
      return `${index + 1}. ${sanitizeText(candidate.name)} | ${sanitizeText(candidate.role) || 'N/A'} | ${candidate.experience}yr | ${candidate.skills.slice(0, 3).map(s => sanitizeText(s)).join(', ')} | ${sanitizeText(candidate.location) || 'N/A'} | ${sanitizeText(candidate.email) || 'N/A'}`;
    }).join('\n');

    const body = `Dear Vendors,

I hope this email finds you well.

I am writing to submit ${selectedCandidateData.length} qualified candidate${selectedCandidateData.length > 1 ? 's' : ''} for your consideration. Please find the candidate summaries below:

CANDIDATE PROFILES:
${condensedDetails}

For complete detailed profiles including skills breakdown, availability, and visa status, please reply to this email or call me directly.

Thank you,
${localStorage.getItem('userName') || 'Prophecy Technologies'}

---
Company: Prophecy Technologies
Website: www.prophecytechs.com
Email: ${localStorage.getItem('userEmail') || 'info@prophecytechs.com'}
Phone: ${localStorage.getItem('userPhone') || '+1 (555) 123-4567'}
      `;

    // Construct Gmail URL - keep it simple and reliable
    let gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    if (ccEmails) {
      gmailUrl += `&cc=${encodeURIComponent(ccEmails)}`;
    }
    
    // Open Gmail
    const gmailWindow = window.open(gmailUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    // Verify window opened successfully
    if (!gmailWindow || gmailWindow.closed || typeof gmailWindow.closed === 'undefined') {
      Swal.fire({
        title: 'Popup Blocked',
        text: 'Please disable your popup blocker and try again',
        icon: 'error'
      });
      return;
    }
    
    // Show detailed information in a follow-up alert
    setTimeout(() => {
      Swal.fire({
        title: 'Bulk Email Ready to Send!',
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
              <p style="margin: 0; color: #166534;"><strong>Gmail compose opened successfully</strong></p>
              <p style="margin: 5px 0 0 0; color: #166534; font-size: 14px;">Review and click Send in the Gmail window</p>
            </div>
            
            <p style="margin: 15px 0 10px 0; font-weight: 600; color: #1f2937;">Email Summary:</p>
            <div style="background: #f8f9fa; border-left: 3px solid #3b82f6; padding: 12px; margin-bottom: 15px;">
              <p style="margin: 0; font-size: 13px;"><strong>Recipients:</strong> ${selectedVendors.length} vendor${selectedVendors.length > 1 ? 's' : ''}</p>
              <p style="margin: 5px 0 0 0; font-size: 13px;"><strong>Candidates:</strong> ${selectedCandidates.length}</p>
            </div>
            
            <p style="margin: 15px 0 10px 0; font-weight: 600; color: #1f2937;">Candidate List:</p>
            <div style="background: #f8f9fa; border-radius: 6px; padding: 12px; max-height: 250px; overflow-y: auto;">
              ${selectedCandidateData.map((candidate, idx) => 
                `<div style="margin: 8px 0; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #3b82f6; font-size: 12px;">
                  <strong>${idx + 1}. ${sanitizeText(candidate.name)}</strong><br/>
                  Role: ${sanitizeText(candidate.role) || 'N/A'} | Exp: ${candidate.experience}yr<br/>
                  Skills: ${candidate.skills.slice(0, 3).map(s => sanitizeText(s)).join(', ')}<br/>
                  Location: ${sanitizeText(candidate.location) || 'N/A'} | Email: ${sanitizeText(candidate.email) || 'N/A'}
                </div>`
              ).join('')}
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Got it!',
        confirmButtonColor: '#3b82f6',
        width: '600px',
        didOpen: () => {
          if (gmailWindow && !gmailWindow.closed) {
            gmailWindow.focus();
          }
        }
      });
    }, 500);
  };

  // Enhanced single vendor email
  const openGmailCompose = (vendorData, candidateData) => {
    const { subject, body } = generateEmailContent(vendorData, candidateData);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      sanitizeText(vendorData.Email)
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(
      gmailUrl,
      "_blank",
      "width=1000,height=700,scrollbars=yes,resizable=yes"
    );
  };

  const handleSubmitResumes = async (method = "email") => {
    if (selectedCandidates.length === 0 || selectedVendors.length === 0) {
      Swal.fire({
        title: "Selection Required",
        text: "Please select at least one candidate and one vendor",
        icon: "warning",
      });
      return;
    }

    const selectedVendorData = vendors.filter((v) =>
      selectedVendors.includes(v.Id)
    );
    const selectedCandidateData = candidates.filter((c) =>
      selectedCandidates.includes(c.id)
    );
    const selectedCandidateNames = selectedCandidateData
      .map((c) => sanitizeText(c.name))
      .join(", ");
    const selectedVendorNames = selectedVendorData
      .map((v) => sanitizeText(v.Name))
      .join(", ");

    // Special handling for email method - open Gmail directly
    if (method === 'email') {
      const vendorsWithoutEmail = selectedVendorData.filter(v => !v.Email);
      
      if (vendorsWithoutEmail.length > 0) {
        Swal.fire({
          title: 'Missing Email Addresses',
          text: `The following vendors do not have email addresses: ${vendorsWithoutEmail.map(v => sanitizeText(v.Name)).join(', ')}`,
          icon: 'error'
        });
        return;
      }

      // Ask user for email preference
      const emailMethod = await Swal.fire({
        title: 'Email Method',
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p><strong>Vendors (${selectedVendors.length}):</strong> ${selectedVendorNames}</p>
            <p><strong>Candidates (${selectedCandidates.length}):</strong> ${selectedCandidateNames}</p>
            
            <div style="margin: 20px 0;">
              <p><strong>Choose email method:</strong></p>
              <div style="margin: 10px 0; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f8fafc;">
                <strong>Bulk Email:</strong> Send one email to all vendors with candidate list (recommended)
              </div>
              <div style="margin: 10px 0; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f8fafc;">
                <strong>Individual Emails:</strong> Send separate emails to each vendor (more personalized)
              </div>
            </div>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: '#3b82f6',
        denyButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Send Bulk Email',
        denyButtonText: 'Send Individual Emails',
        cancelButtonText: 'Cancel',
        allowOutsideClick: false
      });

      if (emailMethod.isConfirmed) {
        // Bulk email method
        try {
          openBulkGmailCompose(selectedVendorData, selectedCandidateData);

          // Add to submission history
          const newSubmissions = selectedVendors.map(vendorId => {
            const vendor = vendors.find(v => v.Id === vendorId);
            return selectedCandidates.map(candidateId => {
              const candidate = candidates.find(c => c.id === candidateId);
              return {
                id: Date.now() + Math.random(),
                candidateName: sanitizeText(candidate.name),
                vendorName: sanitizeText(vendor.Name),
                submittedDate: new Date().toISOString().split('T')[0],
                method: 'EMAIL (BULK)',
                response: "Waiting",
                status: "Submitted",
                responseDate: null
              };
            });
          }).flat();
          
          setSubmissions(prev => [...newSubmissions, ...prev]);
          setSelectedCandidates([]);
          setSelectedVendors([]);

        } catch (error) {
          console.error('Error opening bulk Gmail:', error);
          Swal.fire({
            title: 'Error',
            text: 'Failed to open Gmail compose. Please check your popup blocker and try again.',
            icon: 'error'
          });
        }
      } else if (emailMethod.isDenied) {
        // Individual email method
        try {
          selectedVendorData.forEach(vendor => {
            openGmailCompose(vendor, selectedCandidateData);
          });

          const newSubmissions = selectedVendors.map(vendorId => {
            const vendor = vendors.find(v => v.Id === vendorId);
            return selectedCandidates.map(candidateId => {
              const candidate = candidates.find(c => c.id === candidateId);
              return {
                id: Date.now() + Math.random(),
                candidateName: sanitizeText(candidate.name),
                vendorName: sanitizeText(vendor.Name),
                submittedDate: new Date().toISOString().split('T')[0],
                method: 'EMAIL (INDIVIDUAL)',
                response: "Waiting",
                status: "Submitted",
                responseDate: null
              };
            });
          }).flat();
          
          setSubmissions(prev => [...newSubmissions, ...prev]);

          Swal.fire({
            title: 'Individual Emails Opened!',
            html: `<p>${selectedVendors.length} Gmail windows opened with detailed candidate profiles</p>`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });

          setSelectedCandidates([]);
          setSelectedVendors([]);

        } catch (error) {
          console.error('Error opening individual Gmail:', error);
          Swal.fire({
            title: 'Error',
            text: 'Failed to open Gmail windows. Please check your popup blocker.',
            icon: 'error'
          });
        }
      }
      return;
    }

    // Handle other methods (SMS, WhatsApp) as before
    const confirm = await Swal.fire({
      title: "Confirm Submission",
      html: `
          <div style="text-align: left; margin: 20px 0;">
            <p><strong>Method:</strong> ${method.toUpperCase()}</p>
            <p><strong>Vendors (${
              selectedVendors.length
            }):</strong> ${selectedVendorNames}</p>
            <p><strong>Candidates (${selectedCandidates.length}):</strong></p>
            <p style="font-size: 14px; color: #666;">${selectedCandidateNames}</p>
          </div>
        `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Send via ${method.toUpperCase()}`,
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      setSubmitting(true);

      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Add new submissions to history for each vendor-candidate combination
        const newSubmissions = [];
        selectedVendors.forEach((vendorId) => {
          const vendor = vendors.find((v) => v.Id === vendorId);
          selectedCandidates.forEach((candidateId) => {
            const candidate = candidates.find((c) => c.id === candidateId);
            newSubmissions.push({
              id: Date.now() + Math.random(),
              candidateName: sanitizeText(candidate.name),
              vendorName: sanitizeText(vendor.Name),
              submittedDate: new Date().toISOString().split("T")[0],
              method: method.toUpperCase(),
              response: "Waiting",
              status: "Submitted",
              responseDate: null,
            });
          });
        });

        setSubmissions((prev) => [...newSubmissions, ...prev]);

        Swal.fire({
          title: "Success!",
          text: `${
            selectedCandidates.length * selectedVendors.length
          } resume submission(s) sent successfully via ${method.toUpperCase()}`,
          icon: "success",
          timer: 3000,
          showConfirmButton: false,
        });

        // Reset selections
        setSelectedCandidates([]);
        setSelectedVendors([]);
      } catch (error) {
        console.error("Submission error:", error);
        Swal.fire({
          title: "Submission Failed",
          text: "Failed to submit resumes. Please try again.",
          icon: "error",
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "submitted":
        return <Clock className="status-icon" size={16} />;
      case "closed":
        return <CheckCircle className="status-icon" size={16} />;
      default:
        return <AlertCircle className="status-icon" size={16} />;
    }
  };

  const getResponseColor = (response) => {
    switch (response.toLowerCase()) {
      case "positive":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      case "waiting":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="resume-marketing-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-marketing-container">
      <div className="resume-marketing-page-header">
        <h1>
          <Target className="icon" /> Resume Marketing
        </h1>
        <div className="header-stats">
          <div className="stat-item">
            <Users className="stat-icon" />
            <span>{candidates.length} Candidates</span>
          </div>
          <div className="stat-item">
            <Building className="stat-icon" />
            <span>{vendors.length} Active Vendors</span>
          </div>
        </div>
      </div>

      <div className="resume-marketing-section">
        <h2>Send Resumes to Vendors</h2>

        <div className="resume-marketing-content">
          <div className="resume-marketing-left-panel">
            {/* Candidate Selection */}
            <div className="resume-marketing-candidate-selection">
              <div className="section-header">
                <h3>
                  Select Candidates ({selectedCandidates.length}/
                  {filteredCandidates.length})
                </h3>
                <button
                  className="btn-link select-all-btn"
                  onClick={handleSelectAllCandidates}
                >
                  {selectedCandidates.length === filteredCandidates.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              {/* Candidate Search Bar */}
              <div
                className="search-bar-container"
                style={{ marginBottom: "15px" }}
              >
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search candidates by name, role, skills, location..."
                    value={candidateSearchTerm}
                    onChange={(e) => setCandidateSearchTerm(e.target.value)}
                    className="search-input"
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 40px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                  {candidateSearchTerm && (
                    <button
                      onClick={() => setCandidateSearchTerm("")}
                      className="clear-search-btn"
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="resume-marketing-candidates-list">
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="resume-marketing-candidate-item"
                    >
                      <div className="candidate-checkbox">
                        <input
                          type="checkbox"
                          id={`candidate-${candidate.id}`}
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={() =>
                            handleCandidateSelection(candidate.id)
                          }
                        />
                        <label htmlFor={`candidate-${candidate.id}`}>
                          <div className="candidate-info">
                            <div className="candidate-name">
                              {candidate.name}
                            </div>
                            <div className="candidate-details">
                              {candidate.role && (
                                <span className="candidate-role">
                                  {candidate.role}
                                </span>
                              )}
                              {candidate.experience && (
                                <span className="candidate-exp">
                                  {candidate.experience}
                                </span>
                              )}
                            </div>
                            {candidate.skills.length > 0 && (
                              <div className="candidate-skills">
                                {candidate.skills
                                  .slice(0, 3)
                                  .map((skill, index) => (
                                    <span key={index} className="skill-tag">
                                      {skill}
                                    </span>
                                  ))}
                                {candidate.skills.length > 3 && (
                                  <span className="skill-tag more">
                                    +{candidate.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <p>
                      {candidateSearchTerm
                        ? "No candidates found matching your search"
                        : "No candidates available"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="resume-marketing-right-panel">
            {/* Vendor Selection */}
            <div className="resume-marketing-vendor-selection">
              <div className="section-header">
                <h3>Select Vendors ({selectedVendors.length})</h3>
              </div>

              {/* Multi-select Vendor Dropdown */}
              <div
                className="multi-select-dropdown"
                ref={dropdownRef}
                style={{ position: "relative" }}
              >
                <div
                  className="dropdown-trigger"
                  onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    padding: "10px",
                    cursor: "pointer",
                    backgroundColor: "#fff",
                    minHeight: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {selectedVendors.length === 0 ? (
                      <span style={{ color: "#6b7280" }}>
                        Choose vendors...
                      </span>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}
                      >
                        {getSelectedVendorNames()
                          .slice(0, 2)
                          .map((name, index) => (
                            <span
                              key={index}
                              style={{
                                backgroundColor: "#e5e7eb",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const vendorId = selectedVendors[index];
                                  removeSelectedVendor(vendorId);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: "0",
                                  display: "flex",
                                  alignItems: "center",
                                  color: "#6b7280",
                                }}
                                title="Remove vendor"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        {selectedVendors.length > 2 && (
                          <span
                            style={{
                              backgroundColor: "#e5e7eb",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          >
                            +{selectedVendors.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isVendorDropdownOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>

                {isVendorDropdownOpen && (
                  <div
                    className="dropdown-menu"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "#fff",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      marginTop: "4px",
                      zIndex: 1000,
                      maxHeight: "300px",
                      overflowY: "auto",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {/* Vendor Search Input */}
                    <div
                      style={{
                        padding: "10px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <Search
                          className="search-icon"
                          size={16}
                          style={{
                            position: "absolute",
                            left: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#6b7280",
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Search vendors..."
                          value={vendorSearchTerm}
                          onChange={(e) => setVendorSearchTerm(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 8px 8px 32px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            outline: "none",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Select All Option */}
                    <div
                      onClick={handleSelectAllVendors}
                      style={{
                        padding: "10px",
                        cursor: "pointer",
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor:
                          selectedVendors.length === filteredVendors.length
                            ? "#f3f4f6"
                            : "#fff",
                        fontWeight: "bold",
                        color: "#374151",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedVendors.length === filteredVendors.length
                        }
                        readOnly
                        style={{ marginRight: "8px" }}
                      />
                      {selectedVendors.length === filteredVendors.length
                        ? "Deselect All"
                        : "Select All"}
                    </div>

                    {/* Vendor Options */}
                    {filteredVendors.map((vendor) => (
                      <div
                        key={vendor.Id}
                        onClick={() => handleVendorSelection(vendor.Id)}
                        style={{
                          padding: "10px",
                          cursor: "pointer",
                          backgroundColor: selectedVendors.includes(vendor.Id)
                            ? "#f3f4f6"
                            : "#fff",
                          display: "flex",
                          alignItems: "center",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedVendors.includes(vendor.Id)}
                          readOnly
                          style={{ marginRight: "8px" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "500", color: "#374151" }}>
                            {vendor.Name}
                          </div>
                          {vendor.ContactPerson && (
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                              Contact: {vendor.ContactPerson}
                            </div>
                          )}
                          {vendor.Email && (
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                              {vendor.Email}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {filteredVendors.length === 0 && (
                      <div
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          color: "#6b7280",
                        }}
                      >
                        No vendors found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Vendors Display */}
              {selectedVendors.length > 0 && (
                <div
                  className="selected-vendors-info"
                  style={{ marginTop: "15px" }}
                >
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "10px",
                    }}
                  >
                    Selected Vendors ({selectedVendors.length})
                  </h4>
                  <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                    {selectedVendors.map((vendorId) => {
                      const vendor = vendors.find((v) => v.Id === vendorId);
                      if (!vendor) return null;

                      return (
                        <div
                          key={vendorId}
                          style={{
                            padding: "8px",
                            backgroundColor: "#f9fafb",
                            borderRadius: "6px",
                            marginBottom: "5px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontWeight: "500", fontSize: "13px" }}
                            >
                              {vendor.Name}
                            </div>
                            {vendor.Email && (
                              <div
                                style={{ fontSize: "11px", color: "#6b7280" }}
                              >
                                {vendor.Email}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeSelectedVendor(vendorId)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#ef4444",
                              padding: "2px",
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Submission Actions */}
            <div className="resume-marketing-submission-actions">
              <h3>Send Method</h3>
              <div className="submission-buttons">
                <button
                  className="resume-marketing-btn-primary"
                  onClick={() => handleSubmitResumes("email")}
                  disabled={submitting}
                  title="Opens Gmail compose with candidate details"
                >
                  <Mail className="icon" />
                  {submitting ? "Processing..." : "Send via Gmail"}
                </button>

                <button
                  className="resume-marketing-btn-secondary"
                  onClick={() => handleSubmitResumes("sms")}
                  disabled={submitting}
                >
                  <MessageSquare className="icon" />
                  Send via SMS
                </button>

                <button
                  className="resume-marketing-btn-secondary"
                  onClick={() => handleSubmitResumes("whatsapp")}
                  disabled={submitting}
                >
                  <Phone className="icon" />
                  Send via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeMarketing;



