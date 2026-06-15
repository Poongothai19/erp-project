import React, { useState, useEffect } from 'react';
import { 
  LuX, LuUser, LuMail, LuBuilding, LuCopy, LuChevronRight, 
  LuLoader, LuSave, LuArrowLeft, LuFileText, LuCheckCircle 
} from 'react-icons/lu';
import axios from 'axios';
import BASE_URL from '../../url';
import OnboardingSteps from './OnboardingSteps';
import StepEditor from './StepEditor';
import { getStepTemplates } from '../utils/stepTemplates';

const OnboardingPopup = ({ isOpen, onClose, company, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client: '',         // Company name e.g. Accenture, CTS
    clientName: '',     // Contact person name e.g. John (used in "Welcome, John")
    clientEmail: '',
    candidateName: '',
    candidateEmail: '',
    employeeId: `EMP${Math.floor(Math.random() * 10000)}`,
    department: '',
    position: '',
    hireDate: new Date().toISOString().split('T')[0]
  });
  
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [existingTemplates, setExistingTemplates] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  const [createdClientId, setCreatedClientId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSteps([]);
      setSelectedStep(null);
      setShowTemplateSelector(true);
      setCreatedClientId(null);
      setSelectedTemplate(null);
      setSelectedTemplateId(null);
      setFormData({
        client: '',
        clientName: '',
        clientEmail: '',
        candidateName: '',
        candidateEmail: '',
        employeeId: `EMP${Math.floor(Math.random() * 10000)}`,
        department: '',
        position: '',
        hireDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const checkExistingTemplates = async (clientName) => {
    if (!clientName) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/onboarding/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Filter templates for this client name
        const templates = response.data.data.filter(t => 
          t.ClientName?.toLowerCase() === clientName.toLowerCase() &&
          t.CompanyId === company?.id
        );
        
        setExistingTemplates(templates);
      }
    } catch (error) {
      console.error('Error checking templates:', error);
    }
  };

  const handleSubmitStep1 = async () => {
    if (!formData.client || !formData.clientName || !formData.clientEmail || !formData.candidateName || !formData.candidateEmail) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Check if client exists
      const clientsResponse = await axios.get(`${BASE_URL}/api/onboarding/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const existingClient = clientsResponse.data.data.find(
        c => c.ClientName.toLowerCase() === formData.client.toLowerCase()
      );

      let clientId;
      if (existingClient) {
        clientId = existingClient.Id;
        setCreatedClientId(existingClient.Id);
      } else {
        const createResponse = await axios.post(
          `${BASE_URL}/api/onboarding/clients`,
          {
            clientName: formData.client,
            clientCode: formData.client.replace(/\s+/g, '').toUpperCase()
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        clientId = createResponse.data.data.Id;
        setCreatedClientId(createResponse.data.data.Id);
      }

      // Assign client to company
      try {
        await axios.post(
          `${BASE_URL}/api/onboarding/assignments`,
          {
            companyId: company.id,
            clientId: clientId
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (assignError) {
        // Ignore if already assigned
        console.log('Assignment might already exist');
      }

      await checkExistingTemplates(formData.client);
      setStep(2);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadExistingTemplate = async (template) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/onboarding/templates/${template.Id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const templateSteps = response.data.data.steps.map(step => ({
        id: Date.now() + Math.random(),
        title: step.title,
        description: step.description,
        order: step.order,
        type: step.type,
        icon: step.icon,
        isRequired: step.isRequired,
        instructions: step.instructions,
        estimatedTimeDays: step.estimatedTimeDays || 1,
        documents: step.documents || [],
        completed: false
      }));
      
      setSteps(templateSteps);
      setSelectedTemplate(template);
      setSelectedTemplateId(template.Id);
      setShowTemplateSelector(false);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // 1. Save template
      let templateId = selectedTemplateId;
      
      if (!selectedTemplateId) {
        const templateResponse = await axios.post(`${BASE_URL}/api/onboarding/templates`, {
          templateName: `${formData.client} Template`,
          description: `Onboarding for ${formData.client}`,
          companyId: company.id,
          clientId: createdClientId,
          steps: steps.map((step, index) => ({
            title: step.title,
            description: step.description,
            order: index + 1,
            type: step.type,
            icon: step.icon,
            isRequired: step.isRequired,
            instructions: step.instructions,
            estimatedTimeDays: step.estimatedTimeDays || 1,
            documents: step.documents || []
          }))
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        templateId = templateResponse.data.data.Id;
      }

      // 2. Save to NEW unique workflow employees table
      const stepsWithTracking = steps.map(step => ({
        ...step,
        completed: false,
        startedAt: new Date().toISOString()
      }));

      const workflowEmployeeData = {
        client: formData.client,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        candidateName: formData.candidateName,
        candidateEmail: formData.candidateEmail.toLowerCase(),
        candidateEmployeeId: formData.employeeId,
        department: formData.department || 'General',
        position: formData.position || 'Employee',
        hireDate: formData.hireDate,
        templateId: templateId,
        workflowSteps: stepsWithTracking,
        createdBy: localStorage.getItem('username') || 'system'
      };

      console.log('Creating workflow employee in unique table:', workflowEmployeeData);

      const response = await axios.post(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${company.id}`,
        workflowEmployeeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Workflow employee created:', response.data);

      alert(`✅ Onboarding started for ${formData.candidateName}`);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error in handleFinalSubmit:', error);
      
      let errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 409) {
        errorMessage = 'An employee with this email or ID already exists in the workflow system.';
      }
      
      alert('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className={`onboarding-modal ${step === 2 ? 'wide' : ''}`}>
        <div className="modal-header">
          <h2>Start Onboarding - {company?.name}</h2>
          <button onClick={onClose}><LuX /></button>
        </div>

        <div className="modal-body">
          {step === 1 ? (
            <div>
              <h3>Enter Details</h3>
              
              <div className="form-section">
                <h4><LuBuilding /> Client</h4>
                <input
                  type="text"
                  name="client"
                  placeholder="Client Company (e.g. Accenture, CTS) *"
                  value={formData.client}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="clientName"
                  placeholder="Client Contact Name (e.g. John) *"
                  value={formData.clientName}
                  onChange={handleChange}
                />
                <input
                  type="email"
                  name="clientEmail"
                  placeholder="Client Email *"
                  value={formData.clientEmail}
                  onChange={handleChange}
                />
              </div>

              <div className="form-section">
                <h4><LuUser /> Candidate</h4>
                <input
                  type="text"
                  name="candidateName"
                  placeholder="Candidate Name *"
                  value={formData.candidateName}
                  onChange={handleChange}
                />
                <input
                  type="email"
                  name="candidateEmail"
                  placeholder="Candidate Email *"
                  value={formData.candidateEmail}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="employeeId"
                  placeholder="Employee ID"
                  value={formData.employeeId}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="department"
                  placeholder="Department *"
                  value={formData.department}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="position"
                  placeholder="Position"
                  value={formData.position}
                  onChange={handleChange}
                />
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          ) : (
            <div>
              <button className="back-btn" onClick={() => setStep(1)}>
                <LuArrowLeft /> Back
              </button>
              
              <h3>Template for {formData.client}</h3>
              
              {showTemplateSelector ? (
                <div className="template-selector">
                  <h4>Choose Template</h4>
                  <div className="template-grid">
                    {existingTemplates.length > 0 && existingTemplates.map(t => (
                      <div key={t.Id} className="template-card" onClick={() => loadExistingTemplate(t)}>
                        <LuCopy size={32} />
                        <h5>{t.TemplateName}</h5>
                        <p>{t.StepCount || 0} steps</p>
                      </div>
                    ))}
                    
                    <div className="template-card" onClick={() => {
                      setSteps(getStepTemplates('c2c').map(s => ({...s, completed: false})));
                      setSelectedTemplate(null);
                      setSelectedTemplateId(null);
                      setShowTemplateSelector(false);
                    }}>
                      <LuBuilding size={32} />
                      <h5>C2C Contractor</h5>
                      <p>8 steps</p>
                    </div>
                    
                    <div className="template-card" onClick={() => {
                      setSteps(getStepTemplates('w2').map(s => ({...s, completed: false})));
                      setSelectedTemplate(null);
                      setSelectedTemplateId(null);
                      setShowTemplateSelector(false);
                    }}>
                      <LuUser size={32} />
                      <h5>W2 Employee</h5>
                      <p>4 steps</p>
                    </div>
                    
                    <div className="template-card" onClick={() => {
                      setSteps([]);
                      setSelectedTemplate(null);
                      setSelectedTemplateId(null);
                      setShowTemplateSelector(false);
                    }}>
                      <LuSave size={32} />
                      <h5>Create New</h5>
                      <p>Start from scratch</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="template-editor">
                  <div className="steps-panel">
                    <div className="panel-header">
                      <h4>Steps ({steps.length})</h4>
                      <button onClick={() => {
                        const newStep = {
                          id: Date.now(),
                          title: 'New Step',
                          description: '',
                          order: steps.length + 1,
                          type: 'document',
                          icon: 'LuFileText',
                          isRequired: true,
                          instructions: '',
                          documents: [],
                          estimatedTimeDays: 1,
                          completed: false
                        };
                        setSteps([...steps, newStep]);
                        setSelectedStep(newStep);
                      }}>
                        + Add Step
                      </button>
                    </div>
                    <div className="steps-list">
                      {steps.sort((a, b) => a.order - b.order).map(step => (
                        <div
                          key={step.id}
                          className={`step-item ${selectedStep?.id === step.id ? 'selected' : ''}`}
                          onClick={() => setSelectedStep(step)}
                        >
                          <span className="step-number">{step.order}</span>
                          <div>
                            <div>{step.title}</div>
                            <small>{step.description}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="editor-panel">
                    {selectedStep ? (
                      <StepEditor step={selectedStep} onUpdate={(updated) => {
                        setSteps(steps.map(s => s.id === updated.id ? updated : s));
                        setSelectedStep(null);
                      }} />
                    ) : (
                      <div className="editor-placeholder">
                        <LuFileText size={48} />
                        <p>Select a step to edit</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 ? (
            <>
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitStep1} disabled={loading}>
                {loading ? <LuLoader className="spin" /> : 'Next'} <LuChevronRight />
              </button>
            </>
          ) : (
            !showTemplateSelector && (
              <>
                <button className="btn-secondary" onClick={() => setShowTemplateSelector(true)}>
                  Back
                </button>
                <button className="btn-success" onClick={handleFinalSubmit} disabled={loading || steps.length === 0}>
                  {loading ? <LuLoader className="spin" /> : <LuSave />}
                  Start Onboarding
                </button>
              </>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default OnboardingPopup;