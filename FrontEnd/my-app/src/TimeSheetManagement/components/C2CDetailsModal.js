import React, { useState } from 'react';
import ModalOverlay from './ModalOverlay';
import ModalHeader from './ModalHeader';
import FormFieldGroup from './FormFieldGroup';
import InputField from './InputField';
import { Building, Linkedin, Globe } from 'lucide-react';

const C2CDetailsModal = React.memo(({ 
  isOpen, 
  c2c,
  onClose 
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen || !c2c) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' && value.trim() === '') return 'N/A';
    if (typeof value === 'number' && value === 0) return '0';
    if (typeof value === 'object') return 'N/A';
    return String(value).trim() || 'N/A';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="mts-emp-form-grid">
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', gridColumn: '1 / -1' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {c2c.contractorName ? c2c.contractorName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
                  {getValue(c2c.contractorName)}
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#10b981', fontWeight: '500' }}>
                  {getValue(c2c.jobTitle)}
                </p>
                <p style={{ margin: '2px 0 0 0', color: '#6b7280' }}>
                  {getValue(c2c.companyName)}
                </p>
              </div>
            </div>

            {/* Contractor Details */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>Contractor Details</h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Email">
                <InputField value={getValue(c2c.email)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Phone">
                <InputField value={getValue(c2c.phone)} disabled={true} />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Work Authorization">
                <InputField value={getValue(c2c.workAuthorization)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="LinkedIn Profile">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <InputField value={getValue(c2c.linkedInUrl)} disabled={true} />
                  {c2c.linkedInUrl && c2c.linkedInUrl !== 'N/A' && (
                    <a href={c2c.linkedInUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5' }}>
                      <Linkedin size={20} />
                    </a>
                  )}
                </div>
              </FormFieldGroup>
            </div>

             {/* Vendor Details */}
             <div style={{ gridColumn: '1 / -1', marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>Vendor (Employer) Details</h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Industry">
                <InputField value={getValue(c2c.vendorIndustry)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Website">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <InputField value={getValue(c2c.vendorWebsite)} disabled={true} />
                  {c2c.vendorWebsite && c2c.vendorWebsite !== 'N/A' && (
                    <a href={c2c.vendorWebsite} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981' }}>
                      <Globe size={20} />
                    </a>
                  )}
                </div>
              </FormFieldGroup>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="mts-emp-form-grid">
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '16px',
              marginTop: 0,
              gridColumn: '1 / -1'
            }}>
              Address Information
            </h4>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Street Address">
                <InputField value={getValue(c2c.streetAddress)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Suite/Apartment">
                <InputField value={getValue(c2c.apartmentSuite)} disabled={true} />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="City">
                <InputField value={getValue(c2c.city)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="State">
                <InputField value={getValue(c2c.state)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Zip Code">
                <InputField value={getValue(c2c.zipCode)} disabled={true} />
              </FormFieldGroup>
            </div>
          </div>
        );
        
      case 3:
        const hasTaxInfo = c2c.ein && c2c.ein !== 'N/A';
        const hasBankInfo = c2c.bankName && c2c.bankName !== 'N/A';

        if (!hasTaxInfo && !hasBankInfo) {
          return (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
              <Building size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p>No Tax or Bank information available for this deployment.</p>
            </div>
          );
        }

        return (
          <div className="mts-emp-form-grid">
            {hasTaxInfo && (
              <>
                <div style={{
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '16px',
                  marginBottom: '16px',
                  gridColumn: '1 / -1'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Tax Information
                  </h4>
                </div>

                <div className="mts-emp-form-row">
                  <FormFieldGroup label="EIN">
                    <InputField value={getValue(c2c.ein)} disabled={true} />
                  </FormFieldGroup>
                  <FormFieldGroup label="State of Incorporation">
                    <InputField value={getValue(c2c.stateOfIncorporation)} disabled={true} />
                  </FormFieldGroup>
                </div>
              </>
            )}

            {hasBankInfo && (
              <>
                <div style={{
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '16px',
                  marginBottom: '16px',
                  marginTop: hasTaxInfo ? '16px' : '0',
                  gridColumn: '1 / -1'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Bank Details
                  </h4>
                </div>

                <div className="mts-emp-form-row">
                  <FormFieldGroup label="Bank Name">
                    <InputField value={getValue(c2c.bankName)} disabled={true} />
                  </FormFieldGroup>
                  <FormFieldGroup label="Account Holder Name">
                    <InputField value={getValue(c2c.bankAccountHolder)} disabled={true} />
                  </FormFieldGroup>
                </div>

                <div className="mts-emp-form-row">
                  <FormFieldGroup label="Account Number">
                    <InputField value="••••••••" disabled={true} title="Account number is hidden for security" />
                  </FormFieldGroup>
                  <FormFieldGroup label="Routing Number">
                    <InputField value={getValue(c2c.bankRoutingNumber)} disabled={true} />
                  </FormFieldGroup>
                </div>

                <div className="mts-emp-form-row">
                  <FormFieldGroup label="Account Type">
                    <InputField value={getValue(c2c.paymentMode)} disabled={true} />
                  </FormFieldGroup>
                  <FormFieldGroup label="Payment Terms">
                    <InputField value={getValue(c2c.paymentTerms)} disabled={true} />
                  </FormFieldGroup>
                </div>
              </>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="mts-emp-form-grid">
            <div style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '16px',
              marginBottom: '16px',
              gridColumn: '1 / -1'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Contract Details
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="End Client Name">
                <InputField value={getValue(c2c.clientName)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Implementation Partner">
                <InputField value={getValue(c2c.implementationPartner)} disabled={true} />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Bill Rate ($/hr)">
                <InputField 
                  value={
                    c2c.billRate && c2c.billRate !== null && c2c.billRate !== undefined 
                      ? `$${parseFloat(c2c.billRate).toFixed(2)}/hr`
                      : 'N/A'
                  } 
                  disabled={true} 
                />
              </FormFieldGroup>
              <FormFieldGroup label="C2C Bill Rate ($/hr)">
                <InputField 
                  value={
                    c2c.c2cBillRate && c2c.c2cBillRate !== null && c2c.c2cBillRate !== undefined
                      ? `$${parseFloat(c2c.c2cBillRate).toFixed(2)}/hr`
                      : 'N/A'
                  } 
                  disabled={true} 
                />
              </FormFieldGroup>
            </div>

            <div style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '16px',
              marginBottom: '16px',
              marginTop: '16px',
              gridColumn: '1 / -1'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                PO Information
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="PO Start Date">
                <InputField value={formatDate(c2c.poStartDate)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="PO End Date">
                <InputField value={formatDate(c2c.poEndDate)} disabled={true} />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Hire Date">
                <InputField value={formatDate(c2c.hireDate)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Status">
                <InputField value={getValue(c2c.status)} disabled={true} />
              </FormFieldGroup>
            </div>

            {c2c.notes && c2c.notes.trim() !== '' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <FormFieldGroup label="Notes">
                  <textarea
                    value={getValue(c2c.notes)}
                    disabled={true}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      lineHeight: '1.5',
                      minHeight: '80px',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280'
                    }}
                  />
                </FormFieldGroup>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="mts-emp-form-grid">
            {/* HR TEAM SECTION */}
            <div style={{
              gridColumn: '1 / -1',
              paddingBottom: '24px',
              borderBottom: '2px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
                marginTop: 0
              }}>
                HR Team
              </h3>

              {c2c.hrContacts && Array.isArray(c2c.hrContacts) && c2c.hrContacts.length > 0 ? (
                c2c.hrContacts.map((contact, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: index < c2c.hrContacts.length - 1 ? '16px' : '0'
                  }}>
                    <FormFieldGroup label="HR Contact Person">
                      <InputField
                        value={getValue(contact.name)}
                        disabled={true}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="HR Email">
                      <InputField
                        type="email"
                        value={getValue(contact.email)}
                        disabled={true}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="HR Phone">
                      <InputField
                        type="tel"
                        value={getValue(contact.phone)}
                        disabled={true}
                      />
                    </FormFieldGroup>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  No HR contacts available
                </div>
              )}
            </div>

            {/* ONBOARDING & COMPLAINTS SECTION */}
            <div style={{
              gridColumn: '1 / -1',
              paddingBottom: '24px',
              borderBottom: '2px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
                marginTop: 0
              }}>
                Onboarding & Complaints
              </h3>

              {c2c.onboardingContacts && Array.isArray(c2c.onboardingContacts) && c2c.onboardingContacts.length > 0 ? (
                c2c.onboardingContacts.map((contact, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: index < c2c.onboardingContacts.length - 1 ? '16px' : '0'
                  }}>
                    <FormFieldGroup label="Contact Person">
                      <InputField
                        value={getValue(contact.name)}
                        disabled={true}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="Email">
                      <InputField
                        type="email"
                        value={getValue(contact.email)}
                        disabled={true}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="Phone">
                      <InputField
                        type="tel"
                        value={getValue(contact.phone)}
                        disabled={true}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="Onboarding Process">
                      <textarea
                        value={getValue(contact.onboardingProcess)}
                        disabled={true}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontFamily: 'inherit',
                          lineHeight: '1.5',
                          minHeight: '80px',
                          backgroundColor: '#f9fafb',
                          color: '#6b7280'
                        }}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="Complaints Process">
                      <textarea
                        value={getValue(contact.complaintsProcess)}
                        disabled={true}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontFamily: 'inherit',
                          lineHeight: '1.5',
                          minHeight: '80px',
                          backgroundColor: '#f9fafb',
                          color: '#6b7280'
                        }}
                      />
                    </FormFieldGroup>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  No onboarding/complaints contacts available
                </div>
              )}
            </div>

            {/* ACCOUNTS SECTION */}
            <div style={{
              gridColumn: '1 / -1'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
                marginTop: 0
              }}>
                Accounts
              </h3>

              {c2c.accountsContacts && Array.isArray(c2c.accountsContacts) && c2c.accountsContacts.length > 0 ? (
                c2c.accountsContacts.map((contact, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: index < c2c.accountsContacts.length - 1 ? '16px' : '0'
                  }}>
                    <FormFieldGroup label="Accounts Contact">
                      <InputField
                        value={getValue(contact.name)}
                        disabled={true}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="Accounts Email">
                      <InputField
                        type="email"
                        value={getValue(contact.email)}
                        disabled={true}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="Accounts Phone">
                      <InputField
                        type="tel"
                        value={getValue(contact.phone)}
                        disabled={true}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="Payment Terms">
                      <InputField
                        value={getValue(contact.paymentTerms)}
                        disabled={true}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="Bank Details">
                      <textarea
                        value={getValue(contact.bankDetails)}
                        disabled={true}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontFamily: 'inherit',
                          lineHeight: '1.5',
                          minHeight: '80px',
                          backgroundColor: '#f9fafb',
                          color: '#6b7280'
                        }}
                      />
                    </FormFieldGroup>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  No accounts contacts available
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const StepIndicator = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '0',
        right: '0',
        height: '2px',
        backgroundColor: '#e5e7eb',
        zIndex: 1
      }} />
      
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
          flex: 1
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: currentStep >= step ? '#10b981' : '#e5e7eb',
            color: currentStep >= step ? 'white' : '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            {currentStep > step ? '✓' : step}
          </div>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: currentStep >= step ? '#10b981' : '#9ca3af',
            textAlign: 'center'
          }}>
            {step === 1 && 'Entity Info'}
            {step === 2 && 'Address'}
            {step === 3 && 'Banking'}
            {step === 4 && 'PO Details'}
            {step === 5 && 'Departments'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="mts-emp-modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <ModalHeader title="C2C Contractor Details" onClose={onClose} />
        
        <StepIndicator />
        
        <div className="mts-emp-modal-body">
          {renderStepContent()}
        </div>
        
        <div className="mts-emp-modal-actions">
          {currentStep > 1 && (
            <button 
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="mts-emp-modal-btn mts-emp-modal-btn-cancel"
              type="button"
            >
              Previous
            </button>
          )}
          
          {currentStep < 5 ? (
            <button 
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="mts-emp-modal-btn mts-emp-modal-btn-save"
              type="button"
            >
              Next
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="mts-emp-modal-btn mts-emp-modal-btn-cancel"
              type="button"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
});

C2CDetailsModal.displayName = 'C2CDetailsModal';

export default C2CDetailsModal;
