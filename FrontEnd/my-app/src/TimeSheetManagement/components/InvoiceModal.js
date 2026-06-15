import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save } from 'lucide-react';
import ModalOverlay from './ModalOverlay';
import ModalHeader from './ModalHeader';
import FormFieldGroup from './FormFieldGroup';
import InputField from './InputField';
import SelectField from './SelectField';
import { INVOICE_FORM_INITIAL_STATE } from './MTS_Constants';

const InvoiceModal = React.memo(({ 
  isOpen, 
  mode,
  invoiceData,
  c2cContractors = [], // ✅ DEFAULT EMPTY ARRAY
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({ ...INVOICE_FORM_INITIAL_STATE });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const isAddMode = mode === 'add';
  const title = isAddMode ? 'Create New Invoice' : 'Edit Invoice';
  const saveText = isAddMode ? 'Create Invoice' : 'Save Changes';

  useEffect(() => {
    if (invoiceData) {
      setFormData({ ...invoiceData });
    } else if (isAddMode) {
      setFormData({ ...INVOICE_FORM_INITIAL_STATE });
    }
    setErrors({});
    setCurrentStep(1);
  }, [invoiceData, isAddMode, isOpen]);

  const handleUpdateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const handleContractorSelect = useCallback((contractorId) => {
    console.log('Selected contractor ID:', contractorId);
    
    if (!Array.isArray(c2cContractors)) {
      console.warn('⚠️ c2cContractors is not an array');
      return;
    }
    
    const contractor = c2cContractors.find(c => String(c.id) === String(contractorId));
    if (contractor) {
      console.log('Found contractor:', contractor);
      setFormData(prev => ({
        ...prev,
        contractorId: contractor.id,
        contractorName: contractor.contractorName,
        companyName: contractor.companyName,
        email: contractor.email
      }));
    } else {
      console.log('Contractor not found for ID:', contractorId);
    }
  }, [c2cContractors]);

  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.invoiceNumber.trim()) {
          newErrors.invoiceNumber = 'Invoice number is required';
        }
        if (!formData.contractorId) {
          newErrors.contractorId = 'Contractor is required';
        }
        break;
        
      case 2:
        if (!formData.amount || formData.amount <= 0) {
          newErrors.amount = 'Valid amount is required';
        }
        if (!formData.issueDate.trim()) {
          newErrors.issueDate = 'Issue date is required';
        }
        if (!formData.dueDate.trim()) {
          newErrors.dueDate = 'Due date is required';
        }
        break;
        
      case 3:
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        }
        break;
        
      case 4:
        // Final step - just verify everything is filled
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSave = useCallback(async () => {
    if (!validateStep(4)) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setIsLoading(false);
    }
  }, [validateStep, formData, onSave, onClose]);

  const generateInvoiceNumber = useCallback(() => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}${random}`;
  }, []);

  useEffect(() => {
    if (isAddMode && !formData.invoiceNumber && currentStep === 1 && isOpen) {
      handleUpdateField('invoiceNumber', generateInvoiceNumber());
    }
  }, [isAddMode, formData.invoiceNumber, handleUpdateField, generateInvoiceNumber, currentStep, isOpen]);

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return formData.invoiceNumber.trim() && formData.contractorId;
      case 2:
        return formData.amount && formData.amount > 0 && formData.issueDate.trim() && formData.dueDate.trim();
      case 3:
        return formData.description.trim();
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="mts-emp-form-grid">
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Invoice Number" required error={errors.invoiceNumber}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <InputField
                    value={formData.invoiceNumber}
                    onChange={(e) => handleUpdateField('invoiceNumber', e.target.value)}
                    placeholder="Enter invoice number"
                    disabled={!isAddMode}
                    style={{ flex: 1 }}
                  />
                  {isAddMode && (
                    <button
                      type="button"
                      onClick={() => handleUpdateField('invoiceNumber', generateInvoiceNumber())}
                      className="mts-generate-id-btn"
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      Generate
                    </button>
                  )}
                </div>
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Select Contractor" required error={errors.contractorId}>
                <select
                  value={formData.contractorId || ''}
                  onChange={(e) => {
                    handleContractorSelect(e.target.value);
                  }}
                  className="mts-emp-form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="">Select Contractor</option>
                  {Array.isArray(c2cContractors) && c2cContractors.length > 0 ? (
                    c2cContractors.map(contractor => (
                      <option key={contractor.id} value={contractor.id}>
                        {contractor.contractorName} - {contractor.companyName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No contractors available
                    </option>
                  )}
                </select>
                {(!Array.isArray(c2cContractors) || c2cContractors.length === 0) && (
                  <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                    No contractors available. Add contractors first.
                  </div>
                )}
              </FormFieldGroup>
            </div>

            {formData.contractorName && (
              <div className="mts-emp-form-row">
                <FormFieldGroup label="Contractor Name">
                  <InputField
                    value={formData.contractorName}
                    disabled={true}
                  />
                </FormFieldGroup>
                <FormFieldGroup label="Email">
                  <InputField
                    type="email"
                    value={formData.email}
                    disabled={true}
                  />
                </FormFieldGroup>
              </div>
            )}
          </div>
        );

      case 2:
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
                Invoice Dates & Amount
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Issue Date" required error={errors.issueDate}>
                <InputField
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleUpdateField('issueDate', e.target.value)}
                />
              </FormFieldGroup>
              <FormFieldGroup label="Due Date" required error={errors.dueDate}>
                <InputField
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleUpdateField('dueDate', e.target.value)}
                />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Invoice Amount ($)" required error={errors.amount}>
                <InputField
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleUpdateField('amount', e.target.value)}
                  placeholder="Enter invoice amount"
                />
              </FormFieldGroup>
              <FormFieldGroup label="Payment Terms">
                <SelectField
                  value={formData.paymentTerms}
                  onChange={(e) => handleUpdateField('paymentTerms', e.target.value)}
                  options={['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt']}
                />
              </FormFieldGroup>
            </div>
          </div>
        );

      case 3:
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
                Invoice Details
              </h4>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <FormFieldGroup label="Description" required error={errors.description}>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleUpdateField('description', e.target.value)}
                  placeholder="Enter invoice description or services provided..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                />
              </FormFieldGroup>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <FormFieldGroup label="Notes (Optional)">
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleUpdateField('notes', e.target.value)}
                  placeholder="Add any additional notes..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </FormFieldGroup>
            </div>
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
                margin: 0,
                marginBottom: '12px'
              }}>
                Invoice Status
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Status">
                <SelectField
                  value={formData.status}
                  onChange={(e) => handleUpdateField('status', e.target.value)}
                  options={['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']}
                />
              </FormFieldGroup>
            </div>

            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '16px',
              gridColumn: '1 / -1',
              marginTop: '12px'
            }}>
              <div style={{ fontSize: '14px', color: '#166534', lineHeight: '1.6' }}>
                <strong>Invoice Summary:</strong><br/>
                Invoice #: {formData.invoiceNumber}<br/>
                Contractor: {formData.contractorName}<br/>
                Amount: ${parseFloat(formData.amount || 0).toFixed(2)}<br/>
                Due Date: {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : 'N/A'}<br/>
                Status: {formData.status}
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
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className={`mts-step-item ${currentStep >= step ? 'active' : ''}`}>
          <div className="mts-step-number">{currentStep > step ? '✓' : step}</div>
          <span className="mts-step-label">
            {step === 1 && 'Invoice Info'}
            {step === 2 && 'Dates & Amount'}
            {step === 3 && 'Details'}
            {step === 4 && 'Status'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="mts-emp-modal-content" style={{ maxWidth: '800px' }}>
        <ModalHeader title={title} onClose={onClose} />
        
        <StepIndicator />
        
        <div className="mts-emp-modal-body">
          {renderStepContent()}
        </div>
        
        <div className="mts-emp-modal-actions">
          {currentStep > 1 && (
            <button 
              onClick={prevStep}
              className="mts-emp-modal-btn mts-emp-modal-btn-cancel"
              type="button"
              disabled={isLoading}
            >
              Previous
            </button>
          )}
          
          {currentStep < 4 ? (
            <button 
              onClick={nextStep}
              className="mts-emp-modal-btn mts-emp-modal-btn-save"
              disabled={!isStepValid || isLoading}
              type="button"
            >
              Next
            </button>
          ) : (
            <button 
              onClick={handleSave}
              className="mts-emp-modal-btn mts-emp-modal-btn-save"
              disabled={!isStepValid || isLoading}
              type="button"
            >
              {isLoading ? (
                <>
                  <div className="mts-loading" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {saveText}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
});

InvoiceModal.displayName = 'InvoiceModal';

export default InvoiceModal;
