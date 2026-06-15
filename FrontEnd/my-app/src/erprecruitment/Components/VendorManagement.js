
import React, { useState, useEffect } from "react";
import '../styles/VendorManagement.css';
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import axios from 'axios';
import BASE_URL from '../../url';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate stats from API data
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(vendor => vendor.status === "ACTIVE").length;
  const inactiveVendors = vendors.filter(vendor => vendor.status === "INACTIVE").length;
  const directClients = vendors.filter(vendor => vendor.isDirectClient).length;

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activePopup, setActivePopup] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [vendorForm, setVendorForm] = useState({
    companyName: "",
    phone: "",
    status: "ACTIVE",
    email: "",
    contactPerson: "",
    isDirectClient: false
  });

  const [hrForm, setHrForm] = useState([
    { contactPerson: "", email: "", phone: "" }
  ]);

  const [onboardingForm, setOnboardingForm] = useState([
    { contactPerson: "", email: "", phone: "", onboardingProcess: "", complaintsProcess: "" }
  ]);

  const [accountsForm, setAccountsForm] = useState([
    { contactPerson: "", email: "", phone: "", paymentTerms: "", bankDetails: "" }
  ]);

  // Fetch vendors from API
const fetchVendors = async () => {
  try {
    setLoading(true);
    // Add delay to see loader (remove in production)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const token = localStorage.getItem('token');
    const response = await axios.get(`${BASE_URL}/api/vendor-management`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setVendors(response.data);
    setError(null);
  } catch (err) {
    console.error("Error fetching vendors:", err);
    setError("Failed to load vendors. Please try again.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = vendors.filter(vendor =>
    vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddVendor = () => {
    setShowModal(true);
    setSelectedVendor(null);
    setIsEditing(false);
    resetAllForms();
  };

  const handleActionClick = (vendorId, action) => {
    setActivePopup(action);
    const vendor = vendors.find(v => v.id === vendorId);
    setSelectedVendor(vendor);
    
    // Pre-fill forms with existing data
    if (vendor) {
      switch(action) {
        case 'hr-team':
          setHrForm(vendor.hrTeam && vendor.hrTeam.length > 0 ? vendor.hrTeam : [{ contactPerson: "", email: "", phone: "" }]);
          break;
        case 'onboarding-complaints':
          setOnboardingForm(vendor.onboardingComplaints && vendor.onboardingComplaints.length > 0 ? vendor.onboardingComplaints : [{ contactPerson: "", email: "", phone: "", onboardingProcess: "", complaintsProcess: "" }]);
          break;
        case 'accounts':
          setAccountsForm(vendor.accounts && vendor.accounts.length > 0 ? vendor.accounts : [{ contactPerson: "", email: "", phone: "", paymentTerms: "", bankDetails: "" }]);
          break;
      }
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    
    switch(formType) {
      case 'vendor':
        setVendorForm(prev => ({ ...prev, [name]: value }));
        break;
    }
  };

  const handleHrInputChange = (index, field, value) => {
    const updatedHrForm = [...hrForm];
    updatedHrForm[index] = {
      ...updatedHrForm[index],
      [field]: value
    };
    setHrForm(updatedHrForm);
  };

  const handleOnboardingInputChange = (index, field, value) => {
    const updatedOnboardingForm = [...onboardingForm];
    updatedOnboardingForm[index] = {
      ...updatedOnboardingForm[index],
      [field]: value
    };
    setOnboardingForm(updatedOnboardingForm);
  };

  const handleAccountsInputChange = (index, field, value) => {
    const updatedAccountsForm = [...accountsForm];
    updatedAccountsForm[index] = {
      ...updatedAccountsForm[index],
      [field]: value
    };
    setAccountsForm(updatedAccountsForm);
  };

  const addHrContact = () => {
    setHrForm(prev => [...prev, { contactPerson: "", email: "", phone: "" }]);
  };

  const addOnboardingContact = () => {
    setOnboardingForm(prev => [...prev, { contactPerson: "", email: "", phone: "", onboardingProcess: "", complaintsProcess: "" }]);
  };

  const addAccountsContact = () => {
    setAccountsForm(prev => [...prev, { contactPerson: "", email: "", phone: "", paymentTerms: "", bankDetails: "" }]);
  };

  const removeHrContact = (index) => {
    if (hrForm.length > 1) {
      setHrForm(prev => prev.filter((_, i) => i !== index));
    }
  };

  const removeOnboardingContact = (index) => {
    if (onboardingForm.length > 1) {
      setOnboardingForm(prev => prev.filter((_, i) => i !== index));
    }
  };

  const removeAccountsContact = (index) => {
    if (accountsForm.length > 1) {
      setAccountsForm(prev => prev.filter((_, i) => i !== index));
    }
  };

  const resetAllForms = () => {
    setVendorForm({
      companyName: "",
      phone: "",
      status: "ACTIVE",
      email: "",
      contactPerson: "",
      isDirectClient: false
    });
    setHrForm([{ contactPerson: "", email: "", phone: "" }]);
    setOnboardingForm([{ contactPerson: "", email: "", phone: "", onboardingProcess: "", complaintsProcess: "" }]);
    setAccountsForm([{ contactPerson: "", email: "", phone: "", paymentTerms: "", bankDetails: "" }]);
  };

  const handleCreateVendor = async () => {
    if (!vendorForm.companyName.trim() || !vendorForm.email.trim()) {
      alert("Please fill in all required fields (Company Name and Email)");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const vendorData = {
        companyName: vendorForm.companyName,
        contactPerson: vendorForm.contactPerson || "",
        email: vendorForm.email,
        phone: vendorForm.phone || "",
        status: vendorForm.status,
        isDirectClient: vendorForm.isDirectClient,
        hrTeam: hrForm.filter(hr => hr.contactPerson || hr.email || hr.phone),
        onboardingComplaints: onboardingForm.filter(oc => oc.contactPerson || oc.email || oc.phone || oc.onboardingProcess || oc.complaintsProcess),
        accounts: accountsForm.filter(acc => acc.contactPerson || acc.email || acc.phone || acc.paymentTerms || acc.bankDetails)
      };

      await axios.post(`${BASE_URL}/api/vendor-management`, vendorData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      await fetchVendors(); // Refresh the list
      setShowModal(false);
      setActivePopup(null);
      resetAllForms();
      alert("Vendor created successfully!");
    } catch (err) {
      console.error("Error creating vendor:", err);
      alert(err.response?.data?.message || "Failed to create vendor. Please try again.");
    }
  };

const handleUpdateVendor = async () => {
  if (!selectedVendor) return;

  if (!vendorForm.companyName.trim() || !vendorForm.email.trim()) {
    alert("Please fill in all required fields (Company Name and Email)");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const vendorData = {
      companyName: vendorForm.companyName,
      contactPerson: vendorForm.contactPerson || "",
      email: vendorForm.email,
      phone: vendorForm.phone || "",
      status: vendorForm.status,
      isDirectClient: vendorForm.isDirectClient,
      hrTeam: hrForm.filter(hr => hr.contactPerson || hr.email || hr.phone),
      onboardingComplaints: onboardingForm.filter(oc => oc.contactPerson || oc.email || oc.phone || oc.onboardingProcess || oc.complaintsProcess),
      accounts: accountsForm.filter(acc => acc.contactPerson || acc.email || acc.phone || acc.paymentTerms || acc.bankDetails)
    };

    await axios.put(`${BASE_URL}/api/vendor-management/${selectedVendor.id}`, vendorData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await fetchVendors(); // Refresh the list
    setShowModal(false);
    setActivePopup(null);
    setSelectedVendor(null);
    setIsEditing(false);
    resetAllForms();
    alert("Vendor updated successfully!");
  } catch (err) {
    console.error("Error updating vendor:", err);
    if (err.response?.status === 409) {
      alert("A vendor with this email already exists. Please use a different email address.");
    } else {
      alert(err.response?.data?.message || "Failed to update vendor. Please try again.");
    }
  }
};

  const handleSaveAction = async () => {
    if (!selectedVendor) return;

    try {
      const token = localStorage.getItem('token');
      const updateData = {};
      
      switch(activePopup) {
        case 'hr-team':
          updateData.hrTeam = hrForm.filter(hr => hr.contactPerson || hr.email || hr.phone);
          break;
        case 'onboarding-complaints':
          updateData.onboardingComplaints = onboardingForm.filter(oc => oc.contactPerson || oc.email || oc.phone || oc.onboardingProcess || oc.complaintsProcess);
          break;
        case 'accounts':
          updateData.accounts = accountsForm.filter(acc => acc.contactPerson || acc.email || acc.phone || acc.paymentTerms || acc.bankDetails);
          break;
      }

      // Get current vendor data and merge with updates
      const vendorData = {
        companyName: selectedVendor.companyName,
        contactPerson: selectedVendor.contactPerson,
        email: selectedVendor.email,
        phone: selectedVendor.phone,
        status: selectedVendor.status,
        isDirectClient: selectedVendor.isDirectClient,
        hrTeam: activePopup === 'hr-team' ? updateData.hrTeam : selectedVendor.hrTeam,
        onboardingComplaints: activePopup === 'onboarding-complaints' ? updateData.onboardingComplaints : selectedVendor.onboardingComplaints,
        accounts: activePopup === 'accounts' ? updateData.accounts : selectedVendor.accounts
      };

      await axios.put(`${BASE_URL}/api/vendor-management/${selectedVendor.id}`, vendorData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      await fetchVendors(); // Refresh the list
      setActivePopup(null);
      setSelectedVendor(null);
      resetAllForms();
      alert("Vendor updated successfully!");
    } catch (err) {
      console.error("Error updating vendor:", err);
      alert(err.response?.data?.message || "Failed to update vendor. Please try again.");
    }
  };

  const handleViewDetails = (vendor) => {
    setSelectedVendor(vendor);
    setActivePopup('view-details');
  };

  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setIsEditing(true);
    setShowModal(true);
    
    // Pre-fill the form with vendor data
    setVendorForm({
      companyName: vendor.companyName,
      phone: vendor.phone,
      status: vendor.status,
      email: vendor.email,
      contactPerson: vendor.contactPerson,
      isDirectClient: vendor.isDirectClient || false
    });
    
    // Pre-fill the action forms
    setHrForm(vendor.hrTeam && vendor.hrTeam.length > 0 ? vendor.hrTeam : [{ contactPerson: "", email: "", phone: "" }]);
    setOnboardingForm(vendor.onboardingComplaints && vendor.onboardingComplaints.length > 0 ? vendor.onboardingComplaints : [{ contactPerson: "", email: "", phone: "", onboardingProcess: "", complaintsProcess: "" }]);
    setAccountsForm(vendor.accounts && vendor.accounts.length > 0 ? vendor.accounts : [{ contactPerson: "", email: "", phone: "", paymentTerms: "", bankDetails: "" }]);
  };

  const handleDeleteVendor = async (vendorId) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${BASE_URL}/api/vendor-management/${vendorId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        await fetchVendors(); // Refresh the list
        alert("Vendor deleted successfully!");
      } catch (err) {
        console.error("Error deleting vendor:", err);
        alert(err.response?.data?.message || "Failed to delete vendor. Please try again.");
      }
    }
  };

  const handleEmailClick = (email) => {
    window.open(`mailto:${email}`, '_blank');
  };

 
     const renderPopupContent = () => {
    switch(activePopup) {
      case 'hr-team':
        return (
          <div className="vendor-popup-content">
            <h3>HR Team</h3>
            {hrForm.map((hr, index) => (
              <div key={index} className="hr-contact-group">
                <div className="vendor-form-group">
                  <label>HR Contact Person *</label>
                  <input 
                    type="text" 
                    placeholder="HR contact name" 
                    value={hr.contactPerson}
                    onChange={(e) => handleHrInputChange(index, 'contactPerson', e.target.value)}
                  />
                </div>
                <div className="vendor-form-group">
                  <label>HR Email *</label>
                  <input 
                    type="email" 
                    placeholder="hr@company.com" 
                    value={hr.email}
                    onChange={(e) => handleHrInputChange(index, 'email', e.target.value)}
                  />
                </div>
                <div className="vendor-form-group">
                  <label>HR Phone</label>
                  <input 
                    type="text" 
                    placeholder="HR phone number" 
                    value={hr.phone}
                    onChange={(e) => handleHrInputChange(index, 'phone', e.target.value)}
                  />
                </div>
                {hrForm.length > 1 && (
                  <button 
                    type="button" 
                    className="remove-contact-btn"
                    onClick={() => removeHrContact(index)}
                  >
                    Remove Contact
                  </button>
                )}
                {index === hrForm.length - 1 && (
                  <button 
                    type="button" 
                    className="add-contact-btn"
                    onClick={addHrContact}
                  >
                    + Add Another HR Contact
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      
      case 'onboarding-complaints':
        return (
          <div className="vendor-popup-content">
            <h3>Onboarding & Complaints</h3>
            {onboardingForm.map((onboarding, index) => (
              <div key={index} className="onboarding-contact-group">
                <div className="vendor-form-group">
                  <label>Contact Person *</label>
                  <input 
                    type="text" 
                    placeholder="Contact name" 
                    value={onboarding.contactPerson}
                    onChange={(e) => handleOnboardingInputChange(index, 'contactPerson', e.target.value)}
                  />
                </div>
                <div className="vendor-form-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    placeholder="contact@company.com" 
                    value={onboarding.email}
                    onChange={(e) => handleOnboardingInputChange(index, 'email', e.target.value)}
                  />
                </div>
                <div className="vendor-form-group">
                  <label>Phone</label>
                  <input 
                    type="text" 
                    placeholder="Contact phone number" 
                    value={onboarding.phone}
                    onChange={(e) => handleOnboardingInputChange(index, 'phone', e.target.value)}
                  />
                </div>
                <div className="vendor-form-group">
                  <label>Onboarding Process</label>
                  <textarea 
                    placeholder="Describe onboarding process" 
                    rows="3"
                    value={onboarding.onboardingProcess}
                    onChange={(e) => handleOnboardingInputChange(index, 'onboardingProcess', e.target.value)}
                  ></textarea>
                </div>
                <div className="vendor-form-group">
                  <label>Complaints Process</label>
                  <textarea 
                    placeholder="Describe complaints handling process" 
                    rows="3"
                    value={onboarding.complaintsProcess}
                    onChange={(e) => handleOnboardingInputChange(index, 'complaintsProcess', e.target.value)}
                  ></textarea>
                </div>
                {onboardingForm.length > 1 && (
                  <button 
                    type="button" 
                    className="remove-contact-btn"
                    onClick={() => removeOnboardingContact(index)}
                  >
                    Remove Contact
                  </button>
                )}
                {index === onboardingForm.length - 1 && (
                  <button 
                    type="button" 
                    className="add-contact-btn"
                    onClick={addOnboardingContact}
                  >
                    + Add Another Contact
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      
      case 'accounts':
        return (
          <div className="vendor-popup-content">
            <h3>Accounts</h3>
            {accountsForm.map((account, index) => (
              <div key={index} className="accounts-contact-group">
                <div className="vendor-form-group">
                  <label>Accounts Contact *</label>
                  <input 
                    type="text" 
                    placeholder="Accounts contact name" 
                    value={account.contactPerson}
                    onChange={(e) => handleAccountsInputChange(index, 'contactPerson', e.target.value)}
                  />
                </div>
                <div className="vendor-form-group">
                  <label>Accounts Email *</label>
                  <input 
                    type="email" 
                    placeholder="accounts@company.com" 
                    value={account.email}
                    onChange={(e) => handleAccountsInputChange(index, 'email', e.target.value)}
                  />
                </div>
                <div className="vendor-form-group">
                  <label>Accounts Phone</label>
                  <input 
                    type="text" 
                    placeholder="Accounts phone number" 
                    value={account.phone}
                    onChange={(e) => handleAccountsInputChange(index, 'phone', e.target.value)}
                  />
                </div>
                <div className="vendor-form-group">
                  <label>Payment Terms</label>
                  <input 
                    type="text" 
                    placeholder="Net 30, Net 45, etc." 
                    value={account.paymentTerms}
                    onChange={(e) => handleAccountsInputChange(index, 'paymentTerms', e.target.value)}
                  />
                </div>
                <div className="vendor-form-group">
                  <label>Bank Details</label>
                  <textarea 
                    placeholder="Bank account details" 
                    rows="3"
                    value={account.bankDetails}
                    onChange={(e) => handleAccountsInputChange(index, 'bankDetails', e.target.value)}
                  ></textarea>
                </div>
                {accountsForm.length > 1 && (
                  <button 
                    type="button" 
                    className="remove-contact-btn"
                    onClick={() => removeAccountsContact(index)}
                  >
                    Remove Contact
                  </button>
                )}
                {index === accountsForm.length - 1 && (
                  <button 
                    type="button" 
                    className="add-contact-btn"
                    onClick={addAccountsContact}
                  >
                    + Add Another Accounts Contact
                  </button>
                )}
              </div>
            ))}
          </div>
        );

      case 'view-details':
        return (
          <div className="vendor-popup-content">
            <h3>Vendor Details - {selectedVendor?.companyName}</h3>
            {selectedVendor && (
              <div className="vendor-details">
                <div className="detail-section">
                  <h4>Basic Information</h4>
                  <div className="detail-row">
                    <strong>Company Name:</strong> {selectedVendor.companyName}
                  </div>
                  <div className="detail-row">
                    <strong>Contact Person:</strong> {selectedVendor.contactPerson}
                  </div>
                  <div className="detail-row">
                    <strong>Email:</strong> 
                    <a 
                      href={`mailto:${selectedVendor.email}`} 
                      className="vendor-email-link"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEmailClick(selectedVendor.email);
                      }}
                    >
                      {selectedVendor.email}
                    </a>
                  </div>
                  <div className="detail-row">
                    <strong>Phone:</strong> {selectedVendor.phone}
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong> {selectedVendor.status}
                  </div>
                  <div className="detail-row">
                    <strong>Direct Client:</strong> {selectedVendor.isDirectClient ? 'Yes' : 'No'}
                  </div>
                  <div className="detail-row">
                    <strong>Created:</strong> {selectedVendor.created}
                  </div>
                </div>
                
                {/* HR Team Details */}
                <div className="detail-section">
                  <h4>HR Team Contacts</h4>
                  {selectedVendor.hrTeam && selectedVendor.hrTeam.length > 0 ? (
                    selectedVendor.hrTeam.map((hr, index) => (
                      <div key={index} className="contact-group">
                        <div className="detail-row">
                          <strong>Contact Person:</strong> {hr.contactPerson || 'Not specified'}
                        </div>
                        <div className="detail-row">
                          <strong>Email:</strong> 
                          {hr.email ? (
                            <a 
                              href={`mailto:${hr.email}`} 
                              className="vendor-email-link"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEmailClick(hr.email);
                              }}
                            >
                              {hr.email}
                            </a>
                          ) : 'Not specified'}
                        </div>
                        <div className="detail-row">
                          <strong>Phone:</strong> {hr.phone || 'Not specified'}
                        </div>
                        {index < selectedVendor.hrTeam.length - 1 && <hr className="contact-separator" />}
                      </div>
                    ))
                  ) : (
                    <div className="detail-row">No HR contacts available</div>
                  )}
                </div>

                {/* Onboarding & Complaints Details */}
                <div className="detail-section">
                  <h4>Onboarding & Complaints</h4>
                  {selectedVendor.onboardingComplaints && selectedVendor.onboardingComplaints.length > 0 ? (
                    selectedVendor.onboardingComplaints.map((onboarding, index) => (
                      <div key={index} className="contact-group">
                        <div className="detail-row">
                          <strong>Contact Person:</strong> {onboarding.contactPerson || 'Not specified'}
                        </div>
                        <div className="detail-row">
                          <strong>Email:</strong> 
                          {onboarding.email ? (
                            <a 
                              href={`mailto:${onboarding.email}`} 
                              className="vendor-email-link"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEmailClick(onboarding.email);
                              }}
                            >
                              {onboarding.email}
                            </a>
                          ) : 'Not specified'}
                        </div>
                        <div className="detail-row">
                          <strong>Phone:</strong> {onboarding.phone || 'Not specified'}
                        </div>
                        <div className="detail-row">
                          <strong>Onboarding Process:</strong> {onboarding.onboardingProcess || 'Not specified'}
                        </div>
                        <div className="detail-row">
                          <strong>Complaints Process:</strong> {onboarding.complaintsProcess || 'Not specified'}
                        </div>
                        {index < selectedVendor.onboardingComplaints.length - 1 && <hr className="contact-separator" />}
                      </div>
                    ))
                  ) : (
                    <div className="detail-row">No onboarding contacts available</div>
                  )}
                </div>

                {/* Accounts Details */}
                <div className="detail-section">
                  <h4>Accounts Information</h4>
                  {selectedVendor.accounts && selectedVendor.accounts.length > 0 ? (
                    selectedVendor.accounts.map((account, index) => (
                      <div key={index} className="contact-group">
                        <div className="detail-row">
                          <strong>Contact Person:</strong> {account.contactPerson || 'Not specified'}
                        </div>
                        <div className="detail-row">
                          <strong>Email:</strong> 
                          {account.email ? (
                            <a 
                              href={`mailto:${account.email}`} 
                              className="vendor-email-link"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEmailClick(account.email);
                              }}
                            >
                              {account.email}
                            </a>
                          ) : 'Not specified'}
                        </div>
                        <div className="detail-row">
                          <strong>Phone:</strong> {account.phone || 'Not specified'}
                        </div>
                        <div className="detail-row">
                          <strong>Payment Terms:</strong> {account.paymentTerms || 'Not specified'}
                        </div>
                        <div className="detail-row">
                          <strong>Bank Details:</strong> {account.bankDetails || 'Not specified'}
                        </div>
                        {index < selectedVendor.accounts.length - 1 && <hr className="contact-separator" />}
                      </div>
                    ))
                  ) : (
                    <div className="detail-row">No accounts information available</div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="vendor-popup-content">
            <div className="vendor-form-group">
              <label>Name *</label>
              <input 
                type="text" 
                name="companyName"
                placeholder="Company name" 
                value={vendorForm.companyName}
                onChange={(e) => handleInputChange(e, 'vendor')}
              />
            </div>

            <div className="vendor-form-group">
              <label>Phone</label>
              <input 
                type="text" 
                name="phone"
                placeholder="Phone number" 
                value={vendorForm.phone}
                onChange={(e) => handleInputChange(e, 'vendor')}
              />
            </div>

            <div className="vendor-form-group">
              <label>Status</label>
              <select 
                name="status"
                value={vendorForm.status}
                onChange={(e) => handleInputChange(e, 'vendor')}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

               <div className="vendor-form-group checkbox-group">
        <div className="checkbox-container">
          <input 
            type="checkbox" 
            name="isDirectClient"
            checked={vendorForm.isDirectClient}
            onChange={(e) => setVendorForm(prev => ({ ...prev, isDirectClient: e.target.checked }))}
          />
          <span className="checkbox-label">Direct Client</span>
        </div>
      </div>

            <div className="vendor-form-group">
              <label>Email *</label>
              <input 
                type="text" 
                name="email"
                placeholder="email1@example.com" 
                value={vendorForm.email}
                onChange={(e) => handleInputChange(e, 'vendor')}
              />
              {/* <small>You can enter multiple emails separated by commas</small> */}
            </div>

            <div className="vendor-form-group">
              <label>Contact Person</label>
              <input 
                type="text" 
                name="contactPerson"
                placeholder="Contact person name" 
                value={vendorForm.contactPerson}
                onChange={(e) => handleInputChange(e, 'vendor')}
              />
            </div>

            {/* Action Buttons inside Add Vendor Popup */}
            <div className="vendor-action-buttons-popup">
              <button 
                className="vendor-popup-action-btn"
                onClick={() => setActivePopup('hr-team')}
              >
                HR Team
              </button>
              <button 
                className="vendor-popup-action-btn"
                onClick={() => setActivePopup('onboarding-complaints')}
              >
                Onboarding & Complaints
              </button>
              <button 
                className="vendor-popup-action-btn"
                onClick={() => setActivePopup('accounts')}
              >
                Accounts
              </button>
            </div>
          </div>
        );
    }
  };
  

return (
  <div className="vendor-management-page">
    {/* Show loader while loading */}
    {loading && (
      <div className="page-loader">
        <div className="loader-spinner"></div>
        <p>Loading vendors...</p>
      </div>
    )}
    
    {/* Show content when not loading */}
    {!loading && (
      <>
        {/* Header Section */}
        <div className="vendor-management-header">
          <h1>Vendor Management</h1>
        </div>

        {/* Controls Section */}
        <div className="vendor-management-controls">
          <div className="vendor-search-box">
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="vendor-add-btn" onClick={handleAddVendor}>
            Add New Vendor
          </button>
        </div>

        {/* Stats Cards */}
        <div className="vendor-management-stats">
          <div className="vendor-stat-card total-vendors">
            <h3>{totalVendors}</h3>
            <p>Total Vendors</p>
          </div>
          <div className="vendor-stat-card active-vendors">
            <h3>{activeVendors}</h3>
            <p>Active Vendors</p>
          </div>
          <div className="vendor-stat-card inactive-vendors">
            <h3>{inactiveVendors}</h3>
            <p>Inactive Vendors</p>
          </div>
          <div className="vendor-stat-card inactive-vendors">
            <h3>{directClients}</h3>
            <p>Direct Clients</p>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="vendor-table-container">
          <table className="vendor-data-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Direct Client</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>
                    <button 
                      className="company-name-link"
                      onClick={() => handleViewDetails(vendor)}
                    >
                      {vendor.companyName}
                    </button>
                  </td>
                  <td>{vendor.contactPerson}</td>
                  <td>
                    <a 
                      href={`mailto:${vendor.email}`} 
                      className="vendor-email-link"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEmailClick(vendor.email);
                      }}
                    >
                      {vendor.email}
                    </a>
                  </td>
                  <td>{vendor.phone}</td>
                  <td>
                    <span className={`vendor-status-badge ${vendor.status.toLowerCase()}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td>
                    <span className={`vendor-client-badge ${vendor.isDirectClient ? 'direct' : 'indirect'}`}>
                      {vendor.isDirectClient ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{new Date(vendor.created).toLocaleDateString()}</td>
                  <td>
                    <div className="vendor-actions-icons">
                      <button 
                        className="vendor-action-icon view"
                        onClick={() => handleViewDetails(vendor)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="vendor-action-icon edit"
                        onClick={() => handleEditVendor(vendor)}
                        title="Edit Vendor"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="vendor-action-icon delete"
                        onClick={() => handleDeleteVendor(vendor.id)}
                        title="Delete Vendor"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* All Modals */}
        {(showModal || activePopup) && (
          <div className="vendor-modal-overlay">
            <div className="vendor-modal-content">
              <div className="vendor-modal-header">
                <h2>
                  {activePopup === 'hr-team' ? 'Vendor HR Team' :
                   activePopup === 'onboarding-complaints' ? 'Vendor Onboarding & Complaints' :
                   activePopup === 'accounts' ? 'Vendor Accounts' :
                   activePopup === 'view-details' ? 'Vendor Details' :
                   isEditing ? 'Edit Vendor' : 'Add New Vendor'}
                </h2>
                <button className="vendor-modal-close" onClick={() => {
                  setShowModal(false);
                  setActivePopup(null);
                  setSelectedVendor(null);
                  setIsEditing(false);
                  resetAllForms();
                }}>×</button>
              </div>
              
              <div className="vendor-modal-body">
                {renderPopupContent()}
              </div>

              <div className="vendor-modal-footer">
                {activePopup && activePopup !== 'view-details' && activePopup !== 'hr-team' && activePopup !== 'onboarding-complaints' && activePopup !== 'accounts' && (
                  <button 
                    className="vendor-back-btn"
                    onClick={() => {
                      if (showModal) {
                        setActivePopup(null);
                      } else {
                        setActivePopup(null);
                        setSelectedVendor(null);
                      }
                    }}
                  >
                    Back
                  </button>
                )}
                <button className="vendor-cancel-btn" onClick={() => {
                  setShowModal(false);
                  setActivePopup(null);
                  setSelectedVendor(null);
                  setIsEditing(false);
                  resetAllForms();
                }}>
                  {activePopup === 'view-details' ? 'Close' : 'Cancel'}
                </button>
                
                {activePopup !== 'view-details' && (
                  <button 
                    className="vendor-create-btn" 
                    onClick={showModal ? (isEditing ? handleUpdateVendor : handleCreateVendor) : handleSaveAction}
                  >
                    {activePopup ? 'Save' : (isEditing ? 'Update Vendor' : 'Create Vendor')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </div>
);
};

export default VendorManagement;