import React, { useState } from 'react';
import ModalOverlay from './ModalOverlay';
import ModalHeader from './ModalHeader';
import FormFieldGroup from './FormFieldGroup';
import InputField from './InputField';

const EmployeeDetailsModal = React.memo(({ 
  isOpen, 
  employee,
  onClose 
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen || !employee) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
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
                {employee.Name ? employee.Name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>{employee.Name}</h3>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>{employee.Position || 'No position specified'}</p>
              </div>
            </div>

            {/* Row 1: Employee Code and Email */}
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Employee Code">
                <InputField value={employee.EmployeeCode || employee.employeeCode || 'N/A'} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Email">
                <InputField value={employee.Email || 'N/A'} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* Row 2: Phone and Department */}
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Phone">
                <InputField value={employee.Phone || 'N/A'} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Department">
                <InputField value={employee.Department || 'N/A'} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* Row 3: Position and Employment Type */}
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Position">
                <InputField value={employee.Position || 'N/A'} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Employment Type">
                <InputField value={employee.EmploymentType || 'N/A'} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* Row 4: Status and Hire Date */}
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Status">
                <InputField value={employee.Status || 'N/A'} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Hire Date">
                <InputField value={formatDate(employee.HireDate)} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* Row 5: Supervisor and Backup Supervisor */}
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Supervisor">
                <InputField value={employee.SupervisorName || 'N/A'} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Backup Supervisor">
                <InputField value={employee.BackupSupervisorName || 'N/A'} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* Row 6: Timesheet Settings */}
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Timesheet Required">
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: employee.TimesheetRequired ? '#dcfce7' : '#fee2e2',
                  color: employee.TimesheetRequired ? '#166534' : '#991b1b',
                  border: '1px solid ' + (employee.TimesheetRequired ? '#22c55e' : '#ef4444'),
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {employee.TimesheetRequired ? 'Yes' : 'No'}
                </div>
              </FormFieldGroup>
              <div />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="mts-emp-form-grid">
            {/* HOME ADDRESS SECTION */}
            <div style={{
              paddingBottom: '16px',
              marginBottom: '16px',
              gridColumn: '1 / -1',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Home Address
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Street Address">
                <InputField value={employee.StreetAddress || 'N/A'} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Apartment, Suite, Unit, Building, or Floor">
                <InputField value={employee.ApartmentSuite || 'N/A'} disabled={true} />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="City">
                <InputField value={employee.City || 'N/A'} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="State">
                <InputField value={employee.State || 'N/A'} disabled={true} />
              </FormFieldGroup>
            </div>
            
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Zip Code">
                <InputField value={employee.ZipCode || 'N/A'} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Country">
                <InputField value={employee.Country || 'N/A'} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* MAILING ADDRESS SECTION (Optional) */}
            {(employee.MailingStreetAddress || employee.MailingAddressId) && (
              <>
                <div style={{
                  paddingBottom: '16px',
                  marginBottom: '16px',
                  marginTop: '24px',
                  gridColumn: '1 / -1',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    Mailing Address
                  </h4>
                </div>

                <div className="mts-emp-form-row">
                  <FormFieldGroup label="Street Address">
                    <InputField value={employee.MailingStreetAddress || 'N/A'} disabled={true} />
                  </FormFieldGroup>
                  <FormFieldGroup label="Apartment, Suite, Unit">
                    <InputField value={employee.MailingApartmentSuite || 'N/A'} disabled={true} />
                  </FormFieldGroup>
                </div>

                <div className="mts-emp-form-row">
                  <FormFieldGroup label="City">
                    <InputField value={employee.MailingCity || 'N/A'} disabled={true} />
                  </FormFieldGroup>
                  <FormFieldGroup label="State">
                    <InputField value={employee.MailingState || 'N/A'} disabled={true} />
                  </FormFieldGroup>
                </div>

                <div className="mts-emp-form-row">
                  <FormFieldGroup label="Zip Code">
                    <InputField value={employee.MailingZipCode || 'N/A'} disabled={true} />
                  </FormFieldGroup>
                  <FormFieldGroup label="Country">
                    <InputField value={employee.MailingCountry || 'N/A'} disabled={true} />
                  </FormFieldGroup>
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="mts-emp-form-grid">
            {/* VISA & WORK AUTHORIZATION SECTION */}
            <div style={{
              paddingBottom: '16px',
              marginBottom: '16px',
              gridColumn: '1 / -1',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Visa & Work Authorization
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Visa Status">
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#e0f2fe',
                  border: '1px solid #0284c7',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#0369a1',
                  fontWeight: '600'
                }}>
                  {employee.VisaStatus || 'US Citizen'}
                </div>
              </FormFieldGroup>
              <FormFieldGroup label="Visa Number">
                <InputField value={employee.VisaNumber || employee.AuthorizationNumber || 'N/A'} disabled={true} />
              </FormFieldGroup>
            </div>
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Visa Issue Date">
                <InputField value={formatDate(employee.VisaIssueDate || employee.IssueDate)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Visa Expiry Date">
                <InputField value={formatDate(employee.VisaExpiryDate || employee.ExpiryDate)} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* PROJECT INFORMATION SECTION */}
            <div style={{
              paddingBottom: '16px',
              marginBottom: '16px',
              marginTop: '24px',
              gridColumn: '1 / -1',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Project Details
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Client Name">
                <InputField value={employee.ClientName || employee.clientName || 'N/A'} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Project Name">
                <InputField value={employee.ProjectName || employee.projectName || 'N/A'} disabled={true} />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Project Status">
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: employee.ProjectStatus === 'Active' ? '#d1fae5' : '#f3f4f6',
                  color: employee.ProjectStatus === 'Active' ? '#065f46' : '#6b7280',
                  border: '1px solid ' + (employee.ProjectStatus === 'Active' ? '#6ee7b7' : '#d1d5db'),
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {employee.ProjectStatus || 'N/A'}
                </div>
              </FormFieldGroup>
              <FormFieldGroup label="Bill Rate ($/hr)">
                <InputField 
                  value={employee.BillRate ? `$${parseFloat(employee.BillRate).toFixed(2)}/hr` : 'N/A'} 
                  disabled={true}
                  style={{ color: '#10b981', fontWeight: '600' }}
                />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Project Start Date">
                <InputField value={formatDate(employee.ProjectStartDate)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Project End Date">
                <InputField value={formatDate(employee.ProjectEndDate)} disabled={true} />
              </FormFieldGroup>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="mts-emp-form-grid">
            {/* 401(K) RETIREMENT PLAN SECTION */}
            <div style={{
              paddingBottom: '16px',
              marginBottom: '16px',
              gridColumn: '1 / -1',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                401(k) Retirement Plan
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Enrollment Status">
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: employee.Retirement401kEnrolled ? '#d1fae5' : '#fecaca',
                  color: employee.Retirement401kEnrolled ? '#065f46' : '#7f1d1d',
                  border: '1px solid ' + (employee.Retirement401kEnrolled ? '#6ee7b7' : '#fca5a5'),
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{employee.Retirement401kEnrolled ? '✓ Enrolled' : '✗ Not Enrolled'}</span>
                </div>
              </FormFieldGroup>
              {employee.Retirement401kEnrolled && (
                <FormFieldGroup label="Contribution Percentage">
                  <InputField 
                    value={employee.Retirement401kPercentage ? `${employee.Retirement401kPercentage}%` : 'N/A'} 
                    disabled={true}
                    style={{ fontWeight: '600', color: '#10b981' }}
                  />
                </FormFieldGroup>
              )}
            </div>

            {/* MEDICAL INSURANCE SECTION */}
            <div style={{
              paddingBottom: '16px',
              marginBottom: '16px',
              marginTop: '24px',
              gridColumn: '1 / -1',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Medical Insurance
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Enrollment Status">
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: employee.MedicalInsuranceEnrolled ? '#d1fae5' : '#fecaca',
                  color: employee.MedicalInsuranceEnrolled ? '#065f46' : '#7f1d1d',
                  border: '1px solid ' + (employee.MedicalInsuranceEnrolled ? '#6ee7b7' : '#fca5a5'),
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{employee.MedicalInsuranceEnrolled ? '✓ Enrolled' : '✗ Not Enrolled'}</span>
                </div>
              </FormFieldGroup>
              {employee.MedicalInsuranceEnrolled && (
                <>
                  <FormFieldGroup label="Plan Type">
                    <div style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#166534',
                      fontWeight: '600'
                    }}>
                      {employee.MedicalInsurancePlan || 'N/A'}
                    </div>
                  </FormFieldGroup>
                  <FormFieldGroup label="Effective Date">
                    <InputField value={formatDate(employee.MedicalInsuranceEffectiveDate)} disabled={true} />
                  </FormFieldGroup>
                </>
              )}
            </div>

            {/* EMERGENCY CONTACT SECTION */}
            <div style={{
              paddingBottom: '16px',
              marginBottom: '16px',
              marginTop: '24px',
              gridColumn: '1 / -1',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Emergency Contact
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Contact Name">
                <InputField value={employee.EmergencyContactName || 'N/A'} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Contact Phone">
                <InputField value={employee.EmergencyContactPhone || 'N/A'} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* BENEFITS SUMMARY */}
            <div style={{
              gridColumn: '1 / -1',
              backgroundColor: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '24px'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#166534', margin: '0 0 12px 0' }}>
                Benefits Summary
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#ffffff', border: '1px solid #86efac', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>401(k) Plan</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{employee.Retirement401kEnrolled ? 'Active' : 'Inactive'}</div>
                  {employee.Retirement401kEnrolled && employee.Retirement401kPercentage && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{employee.Retirement401kPercentage}% contribution</div>}
                </div>
                <div style={{ padding: '12px', backgroundColor: '#ffffff', border: '1px solid #86efac', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Medical Insurance</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{employee.MedicalInsuranceEnrolled ? 'Active' : 'Inactive'}</div>
                  {employee.MedicalInsuranceEnrolled && employee.MedicalInsurancePlan && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{employee.MedicalInsurancePlan} plan</div>}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const StepIndicator = () => (
    <div className="mts-step-indicator">
      <div className="mts-step-line" />
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className={`mts-step-item ${currentStep >= step ? 'active' : ''}`}>
          <div className="mts-step-number">{currentStep > step ? '✓' : step}</div>
          <span className="mts-step-label">
            {step === 1 && 'Basic Info'}
            {step === 2 && 'Address'}
            {step === 3 && 'Visa & Project'}
            {step === 4 && 'Benefits'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="mts-emp-modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <ModalHeader title="Employee Details" onClose={onClose} />
        
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
          
          {currentStep < 4 ? (
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

EmployeeDetailsModal.displayName = 'EmployeeDetailsModal';

export default EmployeeDetailsModal;
