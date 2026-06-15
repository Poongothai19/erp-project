// OnboardingModule/components/StepPreview.js
import React from 'react';
import { 
  LuArrowRight, 
  LuCircleCheckBig, 
  LuMail, 
  LuFileText, 
  LuShield,
  LuCreditCard,
  LuUpload,
  LuFilePen,
  LuUserCheck,
  LuDownload
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

const StepPreview = ({ steps }) => {
  const getIconComponent = (iconName) => {
    const IconComponent = iconMap[iconName] || LuFileText;
    return <IconComponent size={24} />;
  };

  const getWorkflowType = () => {
    const stepTypes = steps.map(s => s.type);
    if (stepTypes.includes('verification') && stepTypes.includes('payment')) {
      return 'C2C Candidate Flow';
    } else if (stepTypes.includes('verification') && stepTypes.length <= 4) {
      return 'W2 Candidate Flow';
    } else {
      return 'Other Onboarding Flow';
    }
  };

  return (
    <div className="step-preview-unique">
      <div className="preview-header-unique">
        <h2><LuCircleCheckBig /> Onboarding Workflow Preview</h2>
        <div className="workflow-info-unique">
          <span className="workflow-type-unique">{getWorkflowType()}</span>
          <span className="step-count-unique">{steps.length} steps</span>
        </div>
      </div>

      <div className="workflow-visualization-unique">
        {steps.sort((a, b) => a.order - b.order).map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="workflow-step-unique">
              <div className="step-visual-unique">
                <div className="step-icon-preview-unique">
                  {getIconComponent(step.icon)}
                </div>
                <div className="step-number-preview-unique">{index + 1}</div>
              </div>
              
              <div className="step-details-unique">
                <div className="step-header-preview-unique">
                  <h3>{step.title}</h3>
                  {step.isRequired && <span className="required-tag-unique">Required</span>}
                </div>
                
                <p className="step-description-preview-unique">{step.description}</p>
                
                {step.type === 'email' && step.instructions && (
                  <div className="email-preview-unique">
                    <h4><LuMail /> Email Notification</h4>
                    <div className="email-content-unique">
                      {step.instructions}
                    </div>
                  </div>
                )}
                
                {step.documents && step.documents.length > 0 && (
                  <div className="documents-preview-unique">
                    <h4><LuDownload /> Required Documents</h4>
                    <ul>
                      {step.documents.map((doc, idx) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {step.instructions && step.type !== 'email' && (
                  <div className="instructions-preview-unique">
                    <h4>Instructions</h4>
                    <p>{step.instructions}</p>
                  </div>
                )}
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="workflow-connector-unique">
                <LuArrowRight />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="preview-summary-unique">
        <div className="summary-card-unique">
          <h3>Workflow Summary</h3>
          <div className="summary-stats-unique">
            <div className="stat-item-unique">
              <strong>Total Steps</strong>
              <span>{steps.length}</span>
            </div>
            <div className="stat-item-unique">
              <strong>Required Steps</strong>
              <span>{steps.filter(s => s.isRequired).length}</span>
            </div>
            <div className="stat-item-unique">
              <strong>Total Documents</strong>
              <span>{steps.reduce((acc, step) => acc + (step.documents?.length || 0), 0)}</span>
            </div>
            <div className="stat-item-unique">
              <strong>Estimated Time</strong>
              <span>{steps.length * 2}-{steps.length * 4} days</span>
            </div>
          </div>
        </div>
        
        <div className="workflow-notes-unique">
          <h3>Implementation Notes</h3>
          <ul>
            <li>This workflow is ready to be assigned to candidates</li>
            <li>Each step will be tracked for completion</li>
            <li>Email notifications will be sent automatically</li>
            <li>Required documents must be uploaded before proceeding</li>
            <li>The workflow can be customized per candidate if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StepPreview;