// OnboardingModule/components/OnboardingModule.js
import React, { useState, useEffect } from 'react';
import { 
  LuSettings, 
  LuListChecks, 
  LuBuilding, 
  LuFileText, 
  LuClipboardCheck, 
  LuUpload, 
  LuFilePen,
  LuUserCheck,
  LuMail,
  LuShield,
  LuCreditCard,
  LuUsers,
  LuCheckCircle,
  LuArrowRight,
  LuEdit,
  LuTrash2,
  LuCopy,
  LuPlus,
  LuSave,
  LuX,
  LuLoader
} from 'react-icons/lu';
import OnboardingSteps from './OnboardingSteps';
import StepEditor from './StepEditor';
import StepPreview from './StepPreview';
import { getStepTemplates, getWorkflowTemplates } from '../utils/stepTemplates';
import axios from 'axios';
import BASE_URL from '../../url';
import '../styles/OnboardingModule.css';

const OnboardingModule = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [templateSource, setTemplateSource] = useState('');

  // Load templates from localStorage on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const savedData = JSON.parse(localStorage.getItem('onboardingTemplates') || '{}');
      
      // Load default steps if no saved data
      if (!savedData.currentSteps) {
        const defaultSteps = getStepTemplates('c2c');
        setSteps(defaultSteps);
      } else {
        setSteps(savedData.currentSteps);
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      const defaultSteps = getStepTemplates('c2c');
      setSteps(defaultSteps);
    }
  };

  const saveSteps = async () => {
    setLoading(true);
    
    try {
      // Save to localStorage
      const savedData = JSON.parse(localStorage.getItem('onboardingTemplates') || '{}');
      savedData.currentSteps = steps;
      localStorage.setItem('onboardingTemplates', JSON.stringify(savedData));
      
      alert('✅ Template saved successfully!');
      
      setShowSaveNotification(true);
      setTimeout(() => {
        setShowSaveNotification(false);
      }, 3000);
    } catch (error) {
      console.error('❌ Error saving steps:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    const newStep = {
      id: Date.now(),
      title: 'New Step',
      description: 'Step description',
      icon: 'LuFileText',
      order: steps.length + 1,
      type: 'document',
      isRequired: true,
      instructions: '',
      documents: [],
      estimatedTimeDays: 1
    };
    setSteps([...steps, newStep]);
    setSelectedStep(newStep);
  };

  const deleteStep = (id) => {
    if (window.confirm('Are you sure you want to delete this step?')) {
      const updatedSteps = steps.filter(step => step.id !== id);
      setSteps(updatedSteps);
      if (selectedStep?.id === id) {
        setSelectedStep(null);
      }
    }
  };

  const duplicateStep = (step) => {
    const duplicated = {
      ...step,
      id: Date.now(),
      title: `${step.title} (Copy)`,
      order: steps.length + 1
    };
    setSteps([...steps, duplicated]);
  };

  const updateStep = (updatedStep) => {
    const updatedSteps = steps.map(step => 
      step.id === updatedStep.id ? updatedStep : step
    );
    setSteps(updatedSteps);
    setSelectedStep(null);
  };

  const reorderSteps = (fromIndex, toIndex) => {
    const updatedSteps = [...steps];
    const [movedStep] = updatedSteps.splice(fromIndex, 1);
    updatedSteps.splice(toIndex, 0, movedStep);
    
    const reordered = updatedSteps.map((step, index) => ({
      ...step,
      order: index + 1
    }));
    
    setSteps(reordered);
  };

  const applyTemplate = (templateType) => {
    const template = getWorkflowTemplates(templateType);
    setSteps(template.steps);
    setActiveTab('steps');
    setTemplateSource('template');
    alert(`✅ Applied ${templateType} template with ${template.steps.length} steps`);
  };

  return (
    <div className="onboarding-module-unique">
      <div className="module-header-unique">
        <h1><LuSettings /> Onboarding Workflow Management</h1>
        <div className="header-info-unique">
          {showSaveNotification && (
            <div className="save-notification-unique">
              ✓ Changes saved successfully!
            </div>
          )}
        </div>
        <div className="header-actions-unique">
          <button 
            className="onboarding-btn-unique onboarding-btn-success-unique" 
            onClick={saveSteps}
            disabled={loading}
          >
            {loading ? <LuLoader /> : <LuSave />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {previewMode ? (
        <StepPreview steps={steps} />
      ) : (
        <>
          <div className="module-tabs-unique">
            <button 
              className={`tab-btn-unique ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              <LuCopy /> Workflow Templates
            </button>
            <button 
              className={`tab-btn-unique ${activeTab === 'steps' ? 'active' : ''}`}
              onClick={() => setActiveTab('steps')}
            >
              <LuListChecks /> Onboarding Steps
            </button>
          </div>

          <div className="module-content-unique">
            {activeTab === 'templates' && (
              <div className="templates-section-unique">
                <div className="onboarding-section-header-unique">
                  <h2><LuCopy /> Select Workflow Template</h2>
                </div>
                <div className="onboarding-templates-grid-unique">
                  <div className="onboarding-workflow-card-unique" onClick={() => applyTemplate('c2c')}>
                    <div className="onboarding-workflow-icon-unique">
                      <LuBuilding />
                    </div>
                    <h3>C2C Candidate Flow</h3>
                    <p>For contractors and consultants</p>
                    <div className="onboarding-step-count-unique">8 steps</div>
                  </div>
                  
                  <div className="onboarding-workflow-card-unique" onClick={() => applyTemplate('w2')}>
                    <div className="onboarding-workflow-icon-unique">
                      <LuUserCheck />
                    </div>
                    <h3>W2 Candidate Flow</h3>
                    <p>For full-time employees</p>
                    <div className="onboarding-step-count-unique">4 steps</div>
                  </div>
                  
                  <div className="onboarding-workflow-card-unique" onClick={() => applyTemplate('other')}>
                    <div className="onboarding-workflow-icon-unique">
                      <LuUsers />
                    </div>
                    <h3>Other Onboarding Flow</h3>
                    <p>For other types of onboarding</p>
                    <div className="onboarding-step-count-unique">6 steps</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'steps' && (
              <div className="steps-section-unique">
                <div className="onboarding-section-header-unique">
                  <div className="section-title-unique">
                    <h2><LuListChecks /> Manage Onboarding Steps</h2>
                  </div>
                  <div className="section-actions-unique">
                    <button className="onboarding-btn-unique onboarding-btn-primary-unique" onClick={addStep}>
                      <LuPlus /> Add New Step
                    </button>
                  </div>
                </div>
                
                <div className="onboarding-steps-container-unique">
                  <div className="onboarding-steps-list-container-unique">
                    <OnboardingSteps 
                      steps={steps}
                      selectedStep={selectedStep}
                      onSelectStep={setSelectedStep}
                      onDeleteStep={deleteStep}
                      onDuplicateStep={duplicateStep}
                      onReorder={reorderSteps}
                    />
                    {steps.length === 0 && (
                      <div className="onboarding-empty-state-unique">
                        <p>No steps yet. Create one or apply a template.</p>
                        <button className="onboarding-btn-unique onboarding-btn-primary-unique" onClick={() => setActiveTab('templates')}>
                          Select Template
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {selectedStep && (
                    <div className="onboarding-step-editor-container-unique">
                      <StepEditor 
                        step={selectedStep}
                        onUpdate={updateStep}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OnboardingModule;