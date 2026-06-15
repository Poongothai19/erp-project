// OnboardingModule/components/OnboardingSteps.js
import React from 'react';
import { 
  LuGripVertical, 
  LuTrash2, 
  LuCopy, 
  LuArrowRight,
  LuFileText,
  LuMail,
  LuShield,
  LuCreditCard,
  LuUpload,
  LuFilePen,
  LuUserCheck,
  LuCircleCheckBig 
} from 'react-icons/lu';

const iconMap = {
  LuFileText: LuFileText,
  LuMail: LuMail,
  LuShield: LuShield,
  LuCreditCard: LuCreditCard,
  LuUpload: LuUpload,
  LuFileSignature: LuFilePen,
  LuUserCheck: LuUserCheck,
  LuCheckCircle: LuCircleCheckBig 
};

const OnboardingSteps = ({ 
  steps, 
  selectedStep, 
  onSelectStep, 
  onDeleteStep, 
  onDuplicateStep,
  onReorder 
}) => {
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = e.dataTransfer.getData('text/plain');
    onReorder(parseInt(sourceIndex), targetIndex);
  };

  const getIconComponent = (iconName) => {
    const IconComponent = iconMap[iconName] || LuFileText;
    return <IconComponent size={20} />;
  };

  const getTypeBadge = (type) => {
    const typeLabels = {
      document: 'DOCUMENT',
      email: 'EMAIL',
      verification: 'VERIFICATION',
      payment: 'PAYMENT',
      signature: 'SIGNATURE'
    };
    
    const typeColors = {
      document: 'blue',
      email: 'green',
      verification: 'orange',
      payment: 'purple',
      signature: 'red'
    };
    
    const label = typeLabels[type] || 'DOCUMENT';
    const color = typeColors[type] || 'gray';
    
    return (
      <span className={`onboarding-type-badge-unique onboarding-badge-${color}-unique`}>
        {label}
      </span>
    );
  };

  const getDocumentText = (count) => {
    return count === 1 ? 'document' : 'documents';
  };

  return (
    <div className="steps-list-unique">
      <h3>Workflow Steps ({steps.length})</h3>
      <div className="steps-container">
        {steps.length === 0 ? (
          <div className="onboarding-empty-state-unique">
            <p>No steps added yet. Add your first step or select a template.</p>
          </div>
        ) : (
          steps.sort((a, b) => a.order - b.order).map((step, index) => (
            <div 
              key={step.id}
              className={`onboarding-step-item-unique ${selectedStep?.id === step.id ? 'selected-unique' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onSelectStep(step)}
            >
              <div className="step-drag-handle-unique">
                <LuGripVertical />
              </div>
              
              <div className="step-content-unique">
                <div className="step-header-unique">
                  <div className="step-icon-unique">
                    {getIconComponent(step.icon)}
                  </div>
                  <div className="step-info-unique">
                    <div className="step-title-unique">
                      <span className="step-number-unique"> {index + 1}</span>
                      <h4>{step.title}</h4>
                      {step.isRequired && <span className="onboarding-required-badge-unique">Required</span>}
                    </div>
                    <p className="onboarding-step-description-unique">{step.description}</p>
                    <div className="onboarding-step-meta-unique">
                      {getTypeBadge(step.type)}
                      {step.documents?.length > 0 && (
                        <span className="onboarding-doc-count-unique">
                          {step.documents.length} {getDocumentText(step.documents.length)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="step-actions-unique">
                  <button 
                    className="onboarding-btn-icon-unique"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateStep(step);
                    }}
                    title="Duplicate"
                  >
                    <LuCopy />
                  </button>
                  <button 
                    className="onboarding-btn-icon-unique onboarding-btn-icon-danger-unique"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteStep(step.id);
                    }}
                    title="Delete"
                  >
                    <LuTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {steps.length > 0 && (
        <div className="workflow-progress-unique">
          <div className="progress-bar-unique">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`progress-step-unique ${selectedStep?.id === step.id ? 'active' : ''}`}>
                  <span className="step-dot">{index + 1}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="progress-line-unique">
                    <LuArrowRight />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="progress-stats-unique">
            <span>Total Steps: {steps.length}</span>
            <span>Required: {steps.filter(s => s.isRequired).length}</span>
            <span>Documents: {steps.reduce((acc, step) => acc + (step.documents?.length || 0), 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingSteps;