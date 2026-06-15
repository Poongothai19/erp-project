// OnboardingModule/components/StepEditor.js
import React, { useState, useEffect } from 'react';
import { 
  LuFileText, 
  LuMail, 
  LuShield, 
  LuCreditCard, 
  LuUpload,
  LuFilePen,
  LuUserCheck,
  LuCircleCheckBig,
  LuSave,
  LuX
} from 'react-icons/lu';

const iconOptions = [
  { value: 'LuFileText', label: 'Document', icon: LuFileText },
  { value: 'LuMail', label: 'Email', icon: LuMail },
  { value: 'LuShield', label: 'Verification', icon: LuShield },
  { value: 'LuCreditCard', label: 'Payment', icon: LuCreditCard },
  { value: 'LuUpload', label: 'Upload', icon: LuUpload },
  { value: 'LuFileSignature', label: 'Signature', icon: LuFilePen },
  { value: 'LuUserCheck', label: 'User Check', icon: LuUserCheck },
  { value: 'LuCheckCircle', label: 'Completion', icon: LuCircleCheckBig }
];

const typeOptions = [
  { value: 'document', label: 'Document Upload' },
  { value: 'email', label: 'Email Notification' },
  { value: 'verification', label: 'Background Check' },
  { value: 'payment', label: 'Payment Setup' },
  { value: 'signature', label: 'Digital Signature' }
];

const StepEditor = ({ step, onUpdate }) => {
  const [editedStep, setEditedStep] = useState(step);
  const [newDocument, setNewDocument] = useState('');

  useEffect(() => {
    setEditedStep(step);
  }, [step]);

  const handleChange = (field, value) => {
    setEditedStep(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(editedStep);
  };

  const addDocument = () => {
    if (newDocument.trim()) {
      const updatedDocuments = [...(editedStep.documents || []), newDocument.trim()];
      handleChange('documents', updatedDocuments);
      setNewDocument('');
    }
  };

  const removeDocument = (index) => {
    const updatedDocuments = editedStep.documents.filter((_, i) => i !== index);
    handleChange('documents', updatedDocuments);
  };

  const getIconComponent = (iconName) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    const IconComponent = iconOption?.icon || LuFileText;
    return <IconComponent size={24} />;
  };

  return (
    <div className="step-editor-unique">
      <div className="editor-header-unique">
        <h3>Edit Step: {editedStep.title || 'New Step'}</h3>
        <button className="onboarding-btn-unique onboarding-btn-primary-unique" onClick={handleSave}>
          <LuSave /> Save Changes
        </button>
      </div>

      <div className="editor-form-unique">
        <div className="onboarding-form-group-unique">
          <label>Step Title *</label>
          <input
            type="text"
            className="onboarding-input-unique"
            value={editedStep.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter step title"
          />
        </div>

        <div className="onboarding-form-group-unique">
          <label>Description</label>
          <textarea
            className="onboarding-textarea-unique"
            value={editedStep.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe what this step involves"
            rows="3"
          />
        </div>

        <div className="onboarding-form-row-unique">
          <div className="onboarding-form-group-unique">
            <label>Step Icon</label>
            <div className="icon-selector-unique">
              {iconOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`icon-option-unique ${editedStep.icon === option.value ? 'selected-unique' : ''}`}
                  onClick={() => handleChange('icon', option.value)}
                  title={option.label}
                >
                  <option.icon size={20} />
                </button>
              ))}
            </div>
          </div>

          <div className="onboarding-form-group-unique">
            <label>Step Type</label>
            <select
              className="onboarding-select-unique"
              value={editedStep.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="onboarding-form-row-unique">
          <div className="onboarding-form-group-unique">
            <label className="onboarding-checkbox-label-unique">
              <input
                type="checkbox"
                checked={editedStep.isRequired}
                onChange={(e) => handleChange('isRequired', e.target.checked)}
              />
              Required Step
            </label>
          </div>

          <div className="onboarding-form-group-unique">
            <label>Order</label>
            <input
              type="number"
              className="onboarding-number-input-unique"
              value={editedStep.order}
              onChange={(e) => handleChange('order', parseInt(e.target.value))}
              min="1"
            />
          </div>
        </div>

        <div className="onboarding-form-group-unique">
          <label>Instructions / Email Template</label>
          <textarea
            className="onboarding-textarea-unique"
            value={editedStep.instructions}
            onChange={(e) => handleChange('instructions', e.target.value)}
            placeholder={editedStep.type === 'email' 
              ? "Enter email template content..." 
              : "Provide instructions for this step..."}
            rows="4"
          />
          {editedStep.type === 'email' && (
            <small className="onboarding-helper-text-unique">
              Use {"{candidate_name}"}, {"{company_name}"}, {"{step_number}"} as variables
            </small>
          )}
        </div>

        <div className="onboarding-form-group-unique">
          <label>Required Documents</label>
          <div className="documents-input-unique">
            <input
              type="text"
              className="onboarding-input-unique"
              value={newDocument}
              onChange={(e) => setNewDocument(e.target.value)}
              placeholder="Add a required document (e.g., I-9 Form, W-4)"
              onKeyPress={(e) => e.key === 'Enter' && addDocument()}
            />
            <button type="button" onClick={addDocument} className="onboarding-btn-unique onboarding-btn-small-unique">
              Add
            </button>
          </div>
          
          {editedStep.documents && editedStep.documents.length > 0 && (
            <div className="documents-list-unique">
              <h5>Document List:</h5>
              <ul>
                {editedStep.documents.map((doc, index) => (
                  <li key={index}>
                    <span>{doc}</span>
                    <button 
                      type="button" 
                      className="onboarding-btn-icon-unique onboarding-btn-icon-danger-unique onboarding-btn-icon-small-unique"
                      onClick={() => removeDocument(index)}
                    >
                      <LuX />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="onboarding-form-group-unique">
          <label>Step Preview</label>
          <div className="onboarding-preview-card-unique">
            <div className="onboarding-preview-header-unique">
              <div className="onboarding-preview-icon-unique">
                {getIconComponent(editedStep.icon)}
              </div>
              <div className="preview-info">
                <h4>
                  <span className="onboarding-preview-number-unique">Step {editedStep.order}</span>
                  {editedStep.title}
                </h4>
                {editedStep.isRequired && (
                  <span className="onboarding-preview-required-unique">Required</span>
                )}
              </div>
            </div>
            <p className="onboarding-preview-description-unique">{editedStep.description}</p>
            {editedStep.documents && editedStep.documents.length > 0 && (
              <div className="onboarding-preview-documents-unique">
                <strong>Required:</strong>
                <ul>
                  {editedStep.documents.slice(0, 3).map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                  {editedStep.documents.length > 3 && (
                    <li>+{editedStep.documents.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepEditor;