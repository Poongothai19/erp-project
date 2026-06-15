import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import BASE_URL from "../../url";
import "../Styles/BenchSalesStyles.css";
import {
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Save,
  X,
  Check,
  Calendar,
} from "lucide-react";

const ExternalSubmission = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const parseDate = (dateString) => {
    if (!dateString || dateString.trim() === "") {
      return "";
    }

    dateString = dateString.trim();

    // Match format: D/M/YYYY or DD/MM/YYYY (DD/MM/YYYY format)
    const slashRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const slashMatch = dateString.match(slashRegex);

    if (slashMatch) {
      const day = parseInt(slashMatch[1], 10);        // First is DAY
      const month = parseInt(slashMatch[2], 10);      // Second is MONTH
      const year = parseInt(slashMatch[3], 10);       // Third is YEAR

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const formattedMonth = String(month).padStart(2, "0");
        const formattedDay = String(day).padStart(2, "0");
        return `${year}-${formattedMonth}-${formattedDay}`; // Return as YYYY-MM-DD
      }
    }

    // Check if already in ISO format (YYYY-MM-DD)
    const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (isoRegex.test(dateString)) {
      return dateString;
    }

    return "";
  };



    const formatDateForDisplay = (dateString) => {
      // If empty, return empty string (not today's date)
      if (!dateString || dateString.trim() === "") {
        return "";
      }

      try {
        // Parse the ISO format date (YYYY-MM-DD)
        const [year, month, day] = dateString.split("-");
        
        if (!year || !month || !day) {
          return dateString; // Return as-is if format is wrong
        }

        // Format as D/M/YYYY (e.g., 3/1/2025)
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        
        return `${dayNum}/${monthNum}/${year}`;
      } catch (e) {
        return dateString; // Return original if parsing fails
      }
    };

  const bulkDeleteExternalSubmissions = async () => {
    if (selectedIds.length === 0) {
      Swal.fire({
        title: "No Selection",
        text: "Please select at least one submission to delete",
        icon: "warning",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedIds.length} submission(s). You won't be able to revert this!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete all!",
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem("token");

      try {
        setLoading(true);

        const deletePromises = selectedIds.map((id) =>
          axios.delete(`${BASE_URL}/api/external-submissions/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          })
        );

        await Promise.all(deletePromises);

        Swal.fire({
          title: "Deleted!",
          text: `${selectedIds.length} submission(s) have been deleted.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        setSelectedIds([]);
        await fetchExternalSubmissions();
      } catch (error) {
        console.error("Error bulk deleting submissions:", error);

        let errorMessage = "Failed to delete submissions";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        Swal.fire({
          title: "Error",
          text: errorMessage,
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const syncExternalToSubmissions = async (externalSubmission, status) => {
    const token = localStorage.getItem("token");

    if (!token) return false;

    try {
      if (!externalSubmission.name || externalSubmission.name.trim() === "") {
        console.warn("Cannot sync: No candidate name provided");
        return false;
      }

      const checkResponse = await axios.get(`${BASE_URL}/api/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      let existingSubmissions = [];
      if (checkResponse.data) {
        if (Array.isArray(checkResponse.data)) {
          existingSubmissions = checkResponse.data;
        } else if (
          checkResponse.data.data &&
          Array.isArray(checkResponse.data.data)
        ) {
          existingSubmissions = checkResponse.data.data;
        } else if (
          checkResponse.data.recordset &&
          Array.isArray(checkResponse.data.recordset)
        ) {
          existingSubmissions = checkResponse.data.recordset;
        }
      }

      const candidateName = externalSubmission.name.trim();
      const vendor =
        externalSubmission.vendorCompany ||
        externalSubmission.vendorName ||
        externalSubmission.client ||
        "";

      const alreadySynced = existingSubmissions.some((sub) => {
        const subCandidateName = (sub.CandidateName || "").toLowerCase().trim();
        const subVendor = (sub.VendorName || sub.Client || "")
          .toLowerCase()
          .trim();

        return (
          subCandidateName === candidateName.toLowerCase() &&
          subVendor === vendor.toLowerCase()
        );
      });

      if (alreadySynced) {
        console.log("Submission already synced, skipping duplicate");
        return false;
      }

      const submissionData = {
        candidateName: candidateName,
        jobTitle: externalSubmission.role || "N/A",
        candidateSkills: externalSubmission.role || "",
        vendorName:
          externalSubmission.vendorCompany ||
          externalSubmission.vendorName ||
          "Unknown",
        client: externalSubmission.client || "Unknown",
        status: status,
        submissionDate: externalSubmission.date,
        location: externalSubmission.location || "",
        rate: externalSubmission.rate || "",
        response: "Waiting",
        candidateEmail: externalSubmission.vendorMail || "",
        candidatePhone: externalSubmission.vendorContact || "",
        priority: "Medium",
      };

      const response = await axios.post(
        `${BASE_URL}/api/submissions`,
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      if (response.data.success || response.status === 201) {
        console.log(
          "Successfully synced external submission to internal submissions"
        );
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Sync to submissions failed:", error);
      return false;
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredSubmissions.map((sub) => sub.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const sanitizeText = (text) => {
    if (!text) return "";
    return String(text)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
      .replace(/[\u2000-\u200D\u200F\u2028\u2029]/g, "")
      .replace(/[\uFEFF\uFFFE]/g, "")
      .replace(/[◆♦●■▪▫]/g, "")
      .replace(/[^\w\s\-./,@()&:%$#!?*+="'ñáéíóúàèìòùäëïöü]/gi, "")
      .trim();
  };

  const [newSubmission, setNewSubmission] = useState({
    date: "",
    name: "",
    role: "",
    rate: "",
    client: "",
    location: "",
    vendorName: "",
    vendorMail: "",
    vendorContact: "",
    vendorCompany: "",
    status: "Submitted",
  });

  const statusOptions = [
    "Submitted",
    "Interview Scheduled",
    "Selected",
    "Joined",
    "Rejected",
  ];

  const getUniqueMonths = () => {
    const monthsSet = new Set();
    submissions.forEach((submission) => {
      if (submission.date) {
        const date = new Date(submission.date);
        if (!isNaN(date.getTime())) {
          const yearMonth = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          monthsSet.add(yearMonth);
        }
      }
    });

    return Array.from(monthsSet).sort().reverse();
  };

  const monthOptions = getUniqueMonths();

  const formatMonthForDisplay = (monthString) => {
    if (!monthString) return "";
    const [year, month] = monthString.split("-");
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const fetchExternalSubmissions = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No authentication token found");
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

      const response = await axios.get(`${BASE_URL}/api/external-submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      let submissionsData = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          submissionsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          submissionsData = response.data.data;
        } else if (
          response.data.success &&
          Array.isArray(response.data.submissions)
        ) {
          submissionsData = response.data.submissions;
        } else if (
          response.data.recordset &&
          Array.isArray(response.data.recordset)
        ) {
          submissionsData = response.data.recordset;
        }
      }

      console.log("Raw submissions data from API:", submissionsData);

      const transformedSubmissions = Array.isArray(submissionsData)
        ? submissionsData.map((submission) => {
            // Extract date - FIXED to handle database DateTime format
            let dateValue = "";
            
            // Try different date field names that might come from database
            const dbDate = submission.SubmissionDate || 
                          submission.submissionDate || 
                          submission.Date || 
                          submission.date;

            if (dbDate) {
              console.log(`Original date from DB: ${dbDate}`);
              
              try {
                // Parse the date from database (could be ISO string or date object)
                const parsedDate = new Date(dbDate);
                
                if (!isNaN(parsedDate.getTime())) {
                  // Convert to YYYY-MM-DD format for internal storage
                  const year = parsedDate.getFullYear();
                  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
                  const day = String(parsedDate.getDate()).padStart(2, "0");
                  dateValue = `${year}-${month}-${day}`;
                  
                  console.log(`Parsed date: ${dateValue}`);
                }
              } catch (e) {
                console.warn(`Error parsing date: ${e.message}`);
                dateValue = "";
              }
            }

            return {
              id: submission.Id || submission.id,
              date: dateValue, // Now properly formatted as YYYY-MM-DD
              name: sanitizeText(submission.CandidateName || ""),
              role: sanitizeText(submission.Role || ""),
              rate: sanitizeText(submission.Rate || ""),
              client: sanitizeText(submission.Client || ""),
              location: sanitizeText(submission.Location || ""),
              vendorName: sanitizeText(submission.VendorName || ""),
              vendorMail: sanitizeText(submission.VendorMail || ""),
              vendorContact: sanitizeText(submission.VendorContact || ""),
              vendorCompany: sanitizeText(submission.VendorCompany || ""),
              status: sanitizeText(submission.Status || "Submitted"),
            };
          })
        : [];

      console.log("Transformed submissions:", transformedSubmissions);

      setSubmissions(transformedSubmissions);
    } catch (error) {
      console.error("Fetch external submissions error:", error);
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
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to load external submissions";

        Swal.fire({
          title: "Error Loading External Submissions",
          text: errorMessage,
          icon: "error",
        });

        setSubmissions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (csvText) => {
    const normalizedText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalizedText.split("\n").filter((line) => line.trim());

    if (lines.length < 2) return [];

    // Parse headers more robustly
    const headers = [];
    let currentHeader = "";
    let insideQuotes = false;

    for (let char of lines[0]) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        headers.push(currentHeader.trim().replace(/^"|"$/g, "").toLowerCase());
        currentHeader = "";
      } else {
        currentHeader += char;
      }
    }
    headers.push(currentHeader.trim().replace(/^"|"$/g, "").toLowerCase());

    console.log("Parsed headers:", headers);

    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let currentValue = "";
      let insideQuotes = false;

      for (let char of lines[i]) {
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === "," && !insideQuotes) {
          values.push(currentValue.trim().replace(/^"|"$/g, ""));
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/^"|"$/g, ""));

      if (values.length === headers.length && values.some((v) => v.trim() !== "")) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        data.push(row);
      }
    }

    return data;
  };

  const findFieldValue = (row, possibleNames) => {
  for (const name of possibleNames) {
    const lowerName = name.toLowerCase();
    // Check exact match
    if (row[lowerName]) {
      return row[lowerName];
    }
    // Check for partial matches
    const keys = Object.keys(row);
    for (const key of keys) {
      if (key.includes(lowerName) || lowerName.includes(key)) {
        if (row[key] && row[key].trim() !== "") {
          return row[key];
        }
      }
    }
  }
  return "";
};

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");

      if (!isCSV) {
        Swal.fire({
          title: "Invalid File Type",
          text: "Please upload a CSV file only",
          icon: "error",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          title: "File Too Large",
          text: "File size must be less than 10MB",
          icon: "error",
        });
        return;
      }

      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      Swal.fire({
        title: "No File Selected",
        text: "Please select a CSV file to import",
        icon: "warning",
      });
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setImporting(true);

      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(importFile, "UTF-8");
      });

      const parsedData = parseCSV(fileContent);

      if (parsedData.length === 0) {
        Swal.fire({
          title: "Empty File",
          text: "The CSV file contains no data",
          icon: "warning",
        });
        setImporting(false);
        return;
      }

      // Transform the CSV data - FIXED DATE PARSING
    const transformedData = parsedData.map((row, index) => {
      console.log(`Processing row ${index + 1}:`, row);

      // Parse date
      let parsedDate = "";
      const dateValue = findFieldValue(row, ["date", "submission date", "submissiondate"]);
      
      if (dateValue && dateValue.trim() !== "") {
        parsedDate = parseDate(dateValue.trim());
      }

      // Extract fields with improved matching
      const name = sanitizeText(
        findFieldValue(row, ["name", "candidate name", "candidatename"])
      );

      const role = sanitizeText(
        findFieldValue(row, ["role", "position", "job title", "jobtitle"])
      );

      const client = sanitizeText(
        findFieldValue(row, ["client", "company", "account"])
      );

      const rate = sanitizeText(
        findFieldValue(row, ["rate", "salary", "cost"])
      );

      const location = sanitizeText(
        findFieldValue(row, ["location", "city", "place"])
      );

      // VENDOR fields - use improved matching
      const vendorName = sanitizeText(
        findFieldValue(row, ["vendor name", "vendorname", "recruiter name", "recruitername"])
      );

      const vendorMail = sanitizeText(
        findFieldValue(row, ["vendor mail", "vendor email", "vendormail", "vendoremail", "email", "recruiter email"])
      );

      const vendorContact = sanitizeText(
        findFieldValue(row, ["vendor contact", "vendor phone", "vendorcontact", "vendorphone", "phone", "contact", "recruiter phone", "recruiter contact"])
      );

      const vendorCompany = sanitizeText(
        findFieldValue(row, ["vendor company", "vendorcompany", "recruiter company", "recruitercompany", "recruitment agency"])
      );

      const status = sanitizeText(
        findFieldValue(row, ["status"]) || "Submitted"
      );

      console.log(`Row ${index + 1} extracted:`, {
        name,
        role,
        client,
        rate,
        location,
        vendorName,
        vendorMail,
        vendorContact,
        vendorCompany,
        status,
        date: parsedDate
      });

      return {
        date: parsedDate,
        name,
        role,
        client,
        rate,
        location,
        vendorName,
        vendorMail,
        vendorContact,
        vendorCompany,
        status,
      };
    });

    console.log("Final transformed data:", transformedData);

      const response = await axios.post(
        `${BASE_URL}/api/external-submissions/import`,
        { data: transformedData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        }
      );

      if (response.data.success) {
        const { successCount, errorCount, totalRows, validRows, errors } =
          response.data;

        let message = `Successfully imported ${successCount} submissions`;
        if (errorCount > 0) {
          message += `\n${errorCount} submissions failed`;
        }
        if (validRows < totalRows) {
          message += `\n${
            totalRows - validRows
          } rows skipped (missing required fields)`;
        }

        Swal.fire({
          title: "Import Complete",
          html: message.replace(/\n/g, "<br>"),
          icon: successCount > 0 ? "success" : "warning",
          confirmButtonText: "OK",
        });

        setShowImportModal(false);
        setImportFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        await fetchExternalSubmissions();
      } else {
        throw new Error(response.data.message || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);

      let errorMessage = "Failed to import file";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        title: "Import Failed",
        text: errorMessage,
        icon: "error",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "Date",
      "Name",
      "Role",
      "Rate",
      "Client",
      "Location",
      "Vendor Name",
      "Vendor Mail",
      "Vendor Contact",
      "Vendor Company",
      "Status",
    ];
    const sampleData = [
      "10/6/2025",
      "John Doe",
      "Full Stack Developer",
      "$65/hr",
      "TCS",
      "New York",
      "Jane Smith",
      "jane@vendor.com",
      "1234567890",
      "Vendor Corp",
      "Submitted",
    ];

    const csvContent = [
      headers.join(","),
      sampleData.map((field) => `"${field}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "external_submissions_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addExternalSubmission = async () => {
    if (!newSubmission.name || !newSubmission.role || !newSubmission.client) {
      Swal.fire({
        title: "Validation Error",
        text: "Please fill in required fields: Name, Role, and Client",
        icon: "warning",
      });
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setLoading(true);

      const submissionData = {
        candidateName: newSubmission.name,
        role: newSubmission.role,
        rate: newSubmission.rate,
        client: newSubmission.client,
        location: newSubmission.location,
        vendorName: newSubmission.vendorName,
        vendorMail: newSubmission.vendorMail,
        vendorContact: newSubmission.vendorContact,
        vendorCompany: newSubmission.vendorCompany,
        status: newSubmission.status,
        submissionDate: parseDate(newSubmission.date),
      };

      const response = await axios.post(
        `${BASE_URL}/api/external-submissions`,
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      if (response.data.success) {
        setNewSubmission({
          date: "",
          name: "",
          role: "",
          rate: "",
          client: "",
          location: "",
          vendorName: "",
          vendorMail: "",
          vendorContact: "",
          vendorCompany: "",
          status: "Submitted",
        });
        setShowAddForm(false);

        Swal.fire({
          title: "Success",
          text: "External submission added successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        await fetchExternalSubmissions();
      } else {
        throw new Error(response.data.message || "Failed to add submission");
      }
    } catch (error) {
      console.error("Error adding external submission:", error);

      let errorMessage = "Failed to add external submission";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExternalSubmission = async (id) => {
    const token = localStorage.getItem("token");

    try {
      setLoading(true);

      const updateData = {
        candidateName: editingData.name,
        role: editingData.role,
        rate: editingData.rate,
        client: editingData.client,
        location: editingData.location,
        vendorName: editingData.vendorName,
        vendorMail: editingData.vendorMail,
        vendorContact: editingData.vendorContact,
        vendorCompany: editingData.vendorCompany,
        status: editingData.status,
        submissionDate: parseDate(editingData.date),
      };

      const response = await axios.put(
        `${BASE_URL}/api/external-submissions/${id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        const currentSubmission = submissions.find((s) => s.id === id);

        if (editingData.status !== "Submitted" && currentSubmission) {
          await syncExternalToSubmissions(
            { ...currentSubmission, ...editingData },
            editingData.status
          );
        }

        setEditingId(null);
        setEditingData({});

        Swal.fire({
          title: "Success",
          text:
            editingData.status !== "Submitted"
              ? "External submission updated and added to Submission Tracking"
              : "External submission updated successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        await fetchExternalSubmissions();
      } else {
        throw new Error(response.data.message || "Failed to update submission");
      }
    } catch (error) {
      console.error("Error updating external submission:", error);

      let errorMessage = "Failed to update external submission";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteExternalSubmission = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem("token");

      try {
        setLoading(true);

        const response = await axios.delete(
          `${BASE_URL}/api/external-submissions/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        if (response.data.success) {
          Swal.fire({
            title: "Deleted!",
            text: "External submission has been deleted.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });

          await fetchExternalSubmissions();
        } else {
          throw new Error(
            response.data.message || "Failed to delete submission"
          );
        }
      } catch (error) {
        console.error("Error deleting external submission:", error);

        let errorMessage = "Failed to delete external submission";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        Swal.fire({
          title: "Error",
          text: errorMessage,
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const startEditing = (submission) => {
    setEditingId(submission.id);
    setEditingData({ ...submission });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingData({});
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.vendorCompany.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "" || submission.status === filterStatus;

    const matchesMonth =
      filterMonth === "" ||
      (() => {
        if (!submission.date) return false;
        try {
          const submissionDate = new Date(submission.date);
          if (isNaN(submissionDate.getTime())) return false;
          const submissionMonth = `${submissionDate.getFullYear()}-${String(
            submissionDate.getMonth() + 1
          ).padStart(2, "0")}`;
          return submissionMonth === filterMonth;
        } catch {
          return false;
        }
      })();

    return matchesSearch && matchesStatus && matchesMonth;
  });

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Name",
      "Role",
      "Rate",
      "Client",
      "Location",
      "Vendor Name",
      "Vendor Mail",
      "Vendor Contact",
      "Vendor Company",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredSubmissions.map((sub) =>
        [
          formatDateForDisplay(sub.date),
          sub.name,
          sub.role,
          sub.rate,
          sub.client,
          sub.location,
          sub.vendorName,
          sub.vendorMail,
          sub.vendorContact,
          sub.vendorCompany,
          sub.status,
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "external_submissions.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearMonthFilter = () => {
    setFilterMonth("");
  };

  useEffect(() => {
    fetchExternalSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="ext-sub-container">
        <div className="ext-sub-header">
          <h1>
            <FileSpreadsheet className="ext-sub-icon" /> External Submissions
          </h1>
        </div>
        <div className="ext-sub-loading-container">
          <div className="ext-sub-loading-spinner"></div>
          <p>Loading external submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ext-sub-container">
        <div className="ext-sub-header">
          <h1>
            <FileSpreadsheet className="ext-sub-icon" /> External Submissions
          </h1>
        </div>
        <div className="ext-sub-error-container">
          <p>Error loading external submissions: {error}</p>
          <button
            className="ext-sub-btn ext-sub-btn-primary"
            onClick={fetchExternalSubmissions}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ext-sub-container">
      <div className="ext-sub-header">
        <h1>
          <FileSpreadsheet className="ext-sub-icon" /> External Submissions
        </h1>
        <div className="ext-sub-header-actions">
          {selectedIds.length > 0 && (
            <div className="ext-sub-bulk-actions">
              <span className="ext-sub-selection-count">
                {selectedIds.length} selected
              </span>
              <button
                className="ext-sub-btn ext-sub-btn-danger"
                onClick={bulkDeleteExternalSubmissions}
              >
                <Trash2 size={16} /> Delete Selected
              </button>
              <button
                className="ext-sub-btn ext-sub-btn-secondary"
                onClick={() => setSelectedIds([])}
              >
                Clear Selection
              </button>
            </div>
          )}
          <button
            className="ext-sub-btn ext-sub-btn-success"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={16} /> Add Submission
          </button>
          <button
            className="ext-sub-btn ext-sub-btn-info"
            onClick={() => setShowImportModal(true)}
          >
            <Upload size={16} /> Import CSV
          </button>
          <button
            className="ext-sub-btn ext-sub-btn-secondary"
            onClick={exportToCSV}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="ext-sub-filters">
        <div className="ext-sub-filter-group">
          <div className="ext-sub-search-container">
            <Search size={16} className="ext-sub-search-icon" />
            <input
              type="text"
              placeholder="Search by name, role, client, or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ext-sub-search-input"
            />
          </div>
        </div>
        <div className="ext-sub-filter-group">
          <Filter size={16} className="ext-sub-filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="ext-sub-filter-select"
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="ext-sub-filter-group">
          <Calendar size={16} className="ext-sub-filter-icon" />
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="ext-sub-filter-select"
          >
            <option value="">All Months</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {formatMonthForDisplay(month)}
              </option>
            ))}
          </select>
          {filterMonth && (
            <button
              className="ext-sub-clear-filter"
              onClick={clearMonthFilter}
              title="Clear month filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {showImportModal && (
        <div className="ext-sub-modal-overlay">
          <div className="ext-sub-modal-content">
            <div className="ext-sub-modal-header">
              <h2>Import External Submissions</h2>
              <button
                className="ext-sub-close-btn"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="ext-sub-modal-body">
              <div className="ext-sub-import-instructions">
                <h3>Instructions:</h3>
                <ul>
                  <li>Upload a CSV file (.csv)</li>
                  <li>
                    Required columns: <strong>Date, Name, Role, Client</strong>
                  </li>
                  <li>
                    Optional columns: Rate, Location, Vendor Name, Vendor Mail,
                    Vendor Contact, Vendor Company, Status
                  </li>
                  <li>
                    Status values: Submitted, Interview Scheduled, Selected,
                    Joined, Rejected
                  </li>
                  <li>
                    Date format: M/D/YYYY (e.g., 3/1/2025 or 03/01/2025)
                  </li>
                  <li>Maximum file size: 10MB</li>
                </ul>
                <button
                  className="ext-sub-btn ext-sub-btn-link"
                  onClick={downloadTemplate}
                >
                  <Download size={16} /> Download Template
                </button>
              </div>

              <div className="ext-sub-file-upload">
                <label
                  htmlFor="file-upload"
                  className="ext-sub-file-upload-label"
                >
                  <Upload size={20} />
                  <span>Click to select CSV file</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileChange}
                  className="ext-sub-file-input-hidden"
                />
                {importFile && (
                  <div className="ext-sub-file-selected">
                    <FileSpreadsheet size={20} />
                    <span>{importFile.name}</span>
                    <span className="ext-sub-file-size">
                      ({(importFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                )}
              </div>

              <div className="ext-sub-modal-actions">
                <button
                  className="ext-sub-btn ext-sub-btn-secondary"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  className="ext-sub-btn ext-sub-btn-primary"
                  onClick={handleImport}
                  disabled={!importFile || importing}
                >
                  {importing ? (
                    <>
                      <div className="ext-sub-spinner-small"></div> Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="ext-sub-modal-overlay">
          <div className="ext-sub-modal-content ext-sub-modal-large">
            <div className="ext-sub-modal-header">
              <h2>Add External Submission</h2>
              <button
                className="ext-sub-close-btn"
                onClick={() => setShowAddForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="ext-sub-modal-body">
              <div className="ext-sub-form">
                <div className="ext-sub-form-row">
                  <div className="ext-sub-form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={newSubmission.date}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ext-sub-form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={newSubmission.name}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="ext-sub-form-group">
                    <label>Role *</label>
                    <input
                      type="text"
                      value={newSubmission.role}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          role: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="ext-sub-form-row">
                  <div className="ext-sub-form-group">
                    <label>Rate</label>
                    <input
                      type="text"
                      value={newSubmission.rate}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          rate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ext-sub-form-group">
                    <label>Client *</label>
                    <input
                      type="text"
                      value={newSubmission.client}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          client: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="ext-sub-form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={newSubmission.location}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          location: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ext-sub-form-row">
                  <div className="ext-sub-form-group">
                    <label>Vendor Name</label>
                    <input
                      type="text"
                      value={newSubmission.vendorName}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          vendorName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ext-sub-form-group">
                    <label>Vendor Email</label>
                    <input
                      type="email"
                      value={newSubmission.vendorMail}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          vendorMail: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ext-sub-form-group">
                    <label>Vendor Contact</label>
                    <input
                      type="text"
                      value={newSubmission.vendorContact}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          vendorContact: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ext-sub-form-row">
                  <div className="ext-sub-form-group">
                    <label>Vendor Company</label>
                    <input
                      type="text"
                      value={newSubmission.vendorCompany}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          vendorCompany: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ext-sub-form-group">
                    <label>Status</label>
                    <select
                      value={newSubmission.status}
                      onChange={(e) =>
                        setNewSubmission({
                          ...newSubmission,
                          status: e.target.value,
                        })
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="ext-sub-modal-actions">
                <button
                  className="ext-sub-btn ext-sub-btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="ext-sub-btn ext-sub-btn-primary"
                  onClick={addExternalSubmission}
                >
                  <Save size={16} /> Add Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="ext-sub-summary">
        <div className="ext-sub-summary-item">
          <strong>Total Submissions</strong>
          <span>{filteredSubmissions.length}</span>
        </div>
        <div className="ext-sub-summary-item">
          <strong>Submitted</strong>
          <span>
            {filteredSubmissions.filter((s) => s.status === "Submitted").length}
          </span>
        </div>
        <div className="ext-sub-summary-item">
          <strong>Interview Scheduled</strong>
          <span>
            {
              filteredSubmissions.filter(
                (s) => s.status === "Interview Scheduled"
              ).length
            }
          </span>
        </div>
        <div className="ext-sub-summary-item">
          <strong>Selected</strong>
          <span>
            {filteredSubmissions.filter((s) => s.status === "Selected").length}
          </span>
        </div>
      </div>
      <br />

      {filterMonth && (
        <div className="ext-sub-filter-info">
          <span>
            Showing submissions for:{" "}
            <strong>{formatMonthForDisplay(filterMonth)}</strong>
          </span>
          <button
            className="ext-sub-btn ext-sub-btn-link"
            onClick={clearMonthFilter}
          >
            Clear filter
          </button>
        </div>
      )}

      <div className="ext-sub-table-container">
         
        <div className="ext-sub-table-wrapper">
          <table className="ext-sub-table">
            <thead>
              <tr>
                <th className="ext-sub-table-checkbox-cell">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredSubmissions.length &&
                      filteredSubmissions.length > 0
                    }
                    onChange={handleSelectAll}
                    className="ext-sub-checkbox"
                  />
                </th>
                <th className="ext-sub-table-date-cell">Date</th>
                <th className="ext-sub-table-name-cell">Name</th>
                <th className="ext-sub-table-role-cell">Role</th>
                <th>Rate</th>
                <th>Client</th>
                <th>Location</th>
                <th>Vendor Name</th>
                <th>Vendor Mail</th>
                <th>Vendor Contact</th>
                <th>Vendor Company</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="13" className="ext-sub-no-data-row">
                    No external submissions found
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="ext-sub-table-row">
                    {editingId === submission.id ? (
                      <>
                        {/* EDITING MODE */}
                        <td className="ext-sub-table-checkbox-cell">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(submission.id)}
                            onChange={() => handleSelectRow(submission.id)}
                            className="ext-sub-checkbox"
                            disabled={editingId === submission.id}
                          />
                        </td>
                        <td className="ext-sub-table-date-cell">
                          <input
                            type="date"
                            value={editingData.date || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                date: e.target.value,
                              })
                            }
                            className="ext-sub-table-input"
                          />
                        </td>
                        <td className="ext-sub-table-name-cell">
                          <input
                            type="text"
                            value={editingData.name || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                name: e.target.value,
                              })
                            }
                            className="ext-sub-table-input"
                          />
                        </td>
                        <td className="ext-sub-table-role-cell">
                          <input
                            type="text"
                            value={editingData.role || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                role: e.target.value,
                              })
                            }
                            className="ext-sub-table-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingData.rate || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                rate: e.target.value,
                              })
                            }
                            className="ext-sub-table-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingData.client || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                client: e.target.value,
                              })
                            }
                            className="ext-sub-table-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingData.location || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                location: e.target.value,
                              })
                            }
                            className="ext-sub-table-input"
                          />
                        </td>
                        {/* VENDOR NAME - EDITABLE */}
                        <td>
                          <input
                            type="text"
                            value={editingData.vendorName || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                vendorName: e.target.value,
                              })
                            }
                            className="ext-sub-table-input"
                          />
                        </td>
                        {/* VENDOR MAIL - EDITABLE */}
                        <td>
                          <input
                            type="email"
                            value={editingData.vendorMail || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                vendorMail: e.target.value,
                              })
                            }
                            className="ext-sub-table-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingData.vendorContact || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                vendorContact: e.target.value,
                              })
                            }
                            className="ext-sub-table-input"
                          />
                        </td>
                        {/* VENDOR COMPANY - EDITABLE */}
                        <td>
                          <input
                            type="text"
                            value={editingData.vendorCompany || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                vendorCompany: e.target.value,
                              })
                            }
                            className="ext-sub-table-input"
                          />
                        </td>
                        <td>
                          <select
                            value={editingData.status || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                status: e.target.value,
                              })
                            }
                            className="ext-sub-table-select"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="ext-sub-action-buttons">
                            <button
                              className="ext-sub-btn-sm ext-sub-btn-success"
                              onClick={() =>
                                updateExternalSubmission(submission.id)
                              }
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="ext-sub-btn-sm ext-sub-btn-secondary"
                              onClick={cancelEditing}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* VIEW MODE */}
                        <td className="ext-sub-table-checkbox-cell">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(submission.id)}
                            onChange={() => handleSelectRow(submission.id)}
                            className="ext-sub-checkbox"
                          />
                        </td>
                        <td className="ext-sub-table-date-cell">
                          {formatDateForDisplay(submission.date)}
                        </td>
                        <td className="ext-sub-table-name-cell">
                          {submission.name}
                        </td>
                        <td className="ext-sub-table-role-cell">
                          {submission.role}
                        </td>
                        <td>{submission.rate}</td>
                        <td>{submission.client}</td>
                        <td>{submission.location}</td>
                        {/* VENDOR NAME - VISIBLE */}
                        <td>{submission.vendorName}</td>
                        {/* VENDOR MAIL - VISIBLE */}
                        <td>
                          {submission.vendorMail && (
                            <a
                              href={`mailto:${submission.vendorMail}`}
                              className="ext-sub-email-link"
                            >
                              {submission.vendorMail}
                            </a>
                          )}
                        </td>
                        <td>{submission.vendorContact}</td>
                        {/* VENDOR COMPANY - VISIBLE */}
                        <td>{submission.vendorCompany}</td>
                        <td>
                          <span
                            className={`ext-sub-status-badge ext-sub-status-${submission.status
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {submission.status}
                          </span>
                        </td>
                        <td>
                          <div className="ext-sub-action-buttons">
                            <button
                              className="ext-sub-btn-sm ext-sub-btn-info"
                              onClick={() => startEditing(submission)}
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="ext-sub-btn-sm ext-sub-btn-danger"
                              onClick={() =>
                                deleteExternalSubmission(submission.id)
                              }
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExternalSubmission;