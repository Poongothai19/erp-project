// import React, { useState, useEffect } from 'react';
// import '../styles/CandidateForm.css';
// import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
// import BASE_URL from '../../url';

// // US States list
// const US_STATES = [
//   'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
//   'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
//   'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
//   'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
//   'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
//   'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
//   'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
// ];

// const VISA_TYPES = ['H1B', 'H4', 'L1', 'L2', 'O1', 'EB1', 'EB2', 'EB3', 'GC', 'EAD', 'USC', 'GC Holder', 'TN', 'E2'];

// export default function ATSCandidateForm({ onSubmit, selectedRole }) {
//   const [formData, setFormData] = useState({
//     first_name: '',
//     last_name: '',
//     email: '',
//     phone: '',
//     position: '',
//     visa_type: '',
//     current_state: '',
//     current_city: '',
//     employment_type: []
//   });

//   const [jobId, setJobId] = useState(null);
//   const [resumeFile, setResumeFile] = useState(null);
//   const [submitted, setSubmitted] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [dragActive, setDragActive] = useState(false);

//   // ✅ Initialize form with job ID if available
//   useEffect(() => {
//     console.log('📋 ATS Candidate Form mounted');
//     console.log('🔍 Checking for selectedRole...');
    
//     if (selectedRole && selectedRole.role) {
//       console.log('✅ Found selectedRole:', selectedRole.role);
//       console.log('📌 Capturing job_id:', selectedRole.id);
      
//       setFormData(prev => ({
//         ...prev,
//         position: selectedRole.role
//       }));
//       setJobId(selectedRole.id);
//     } else {
//       console.log('⚠️ No selectedRole provided');
//     }
//   }, [selectedRole]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value
//     });
//     setError('');
//   };

//   const handleEmploymentTypeChange = (type) => {
//     setFormData(prev => ({
//       ...prev,
//       employment_type: prev.employment_type.includes(type)
//         ? prev.employment_type.filter(t => t !== type)
//         : [...prev.employment_type, type]
//     }));
//     setError('');
//   };

//   const handleFileUpload = (file) => {
//     const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
//     const validExtensions = ['.pdf', '.doc', '.docx'];
    
//     const fileName = file.name.toLowerCase();
//     const fileType = file.type;
//     const ext = fileName.substring(fileName.lastIndexOf('.'));

//     if (!validTypes.includes(fileType) && !validExtensions.includes(ext)) {
//       setError('Invalid file type. Please upload PDF, DOC, or DOCX files only.');
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       setError('File size exceeds 5MB limit. Please upload a smaller file.');
//       return;
//     }

//     setResumeFile(file);
//     setError('');
//   };

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === 'dragenter' || e.type === 'dragover') {
//       setDragActive(true);
//     } else if (e.type === 'dragleave') {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);

//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       handleFileUpload(e.dataTransfer.files[0]);
//     }
//   };

//   const handleFileInputChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       handleFileUpload(e.target.files[0]);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (!formData.first_name.trim()) {
//       setError('First name is required');
//       return;
//     }
//     if (!formData.last_name.trim()) {
//       setError('Last name is required');
//       return;
//     }
//     if (!formData.email.trim()) {
//       setError('Email is required');
//       return;
//     }
//     if (!formData.phone.trim()) {
//       setError('Phone number is required');
//       return;
//     }
//     if (!formData.position.trim()) {
//       setError('Position is required');
//       return;
//     }
//     if (!resumeFile) {
//       setError('Resume file is required');
//       return;
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(formData.email)) {
//       setError('Please enter a valid email address');
//       return;
//     }

//     setLoading(true);

//     try {
//       const formDataToSend = new FormData();
//       formDataToSend.append('first_name', formData.first_name);
//       formDataToSend.append('last_name', formData.last_name);
//       formDataToSend.append('email', formData.email);
//       formDataToSend.append('phone', formData.phone);
//       formDataToSend.append('position', formData.position);
//       formDataToSend.append('visa_type', formData.visa_type || '');
//       formDataToSend.append('current_state', formData.current_state || '');
//       formDataToSend.append('current_city', formData.current_city || '');
//       formDataToSend.append('employment_type', formData.employment_type.join(',') || '');
//       formDataToSend.append('resume', resumeFile);
      
//       // ✅ Add job_id if available
//       if (jobId) {
//         formDataToSend.append('job_id', jobId);
//         console.log('📌 Submitting with job_id:', jobId);
//       }

//       const response = await fetch(`${BASE_URL}/api/ats/apply`, {
//         method: 'POST',
//         body: formDataToSend
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         setError(data.message || 'Failed to submit application');
//         setLoading(false);
//         return;
//       }

//       console.log('✅ Application submitted successfully:', data);
      
//       if (onSubmit) {
//         onSubmit({
//           ...formData,
//           resume_link: resumeFile.name,
//           id: data.data.id,
//           created_at: data.data.created_at,
//           job_id: jobId
//         });
//       }

//       setSubmitted(true);
      
//       // ✅ Reset form after successful submission (NO auto-logout)
//       setTimeout(() => {
//         setFormData({
//           first_name: '',
//           last_name: '',
//           email: '',
//           phone: '',
//           position: selectedRole?.role || '',
//           visa_type: '',
//           current_state: '',
//           current_city: '',
//           employment_type: []
//         });
//         setResumeFile(null);
//         setSubmitted(false);
//       }, 2000);

//     } catch (err) {
//       console.error('❌ Submit error:', err);
//       setError(err.message || 'An error occurred while submitting your application');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="candidate-form-wrapper">
//       <div className="candidate-form-card">
//         <div className="candidate-form-header">
//           <h2 className="candidate-form-title">Candidate Application Form</h2>
//           <p className="candidate-form-subtitle">Join our team by submitting your application</p>
//         </div>

//         <div className="candidate-application-form">
//           {error && (
//             <div className="candidate-error-message">
//               <AlertCircle size={18} className="candidate-error-icon" />
//               <span>{error}</span>
//             </div>
//           )}

//           <div className="candidate-form-row">
//             <div className="candidate-form-group">
//               <label htmlFor="first_name" className="candidate-form-label">First Name *</label>
//               <input
//                 type="text"
//                 id="first_name"
//                 name="first_name"
//                 className="candidate-form-input"
//                 value={formData.first_name}
//                 onChange={handleInputChange}
//                 placeholder="Enter first name"
//                 required
//                 disabled={loading}
//               />
//             </div>
//             <div className="candidate-form-group">
//               <label htmlFor="last_name" className="candidate-form-label">Last Name *</label>
//               <input
//                 type="text"
//                 id="last_name"
//                 name="last_name"
//                 className="candidate-form-input"
//                 value={formData.last_name}
//                 onChange={handleInputChange}
//                 placeholder="Enter last name"
//                 required
//                 disabled={loading}
//               />
//             </div>
//           </div>

//           <div className="candidate-form-row">
//             <div className="candidate-form-group">
//               <label htmlFor="email" className="candidate-form-label">Email *</label>
//               <input
//                 type="email"
//                 id="email"
//                 name="email"
//                 className="candidate-form-input"
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 placeholder="Enter email"
//                 required
//                 disabled={loading}
//               />
//             </div>
//             <div className="candidate-form-group">
//               <label htmlFor="phone" className="candidate-form-label">Phone *</label>
//               <input
//                 type="tel"
//                 id="phone"
//                 name="phone"
//                 className="candidate-form-input"
//                 value={formData.phone}
//                 onChange={handleInputChange}
//                 placeholder="Enter phone number"
//                 required
//                 disabled={loading}
//               />
//             </div>
//           </div>

//           <div className="candidate-form-group candidate-form-group-full">
//             <label htmlFor="position" className="candidate-form-label">Position *</label>
//             <input
//               type="text"
//               id="position"
//               name="position"
//               className="candidate-form-input"
//               value={formData.position}
//               onChange={handleInputChange}
//               placeholder="Enter position applying for"
//               required
//               disabled={loading}
//             />
//           </div>

//           <div className="candidate-form-row">
//             <div className="candidate-form-group">
//               <label htmlFor="visa_type" className="candidate-form-label">Visa Type</label>
//               <select
//                 id="visa_type"
//                 name="visa_type"
//                 className="candidate-form-input"
//                 value={formData.visa_type}
//                 onChange={handleInputChange}
//                 disabled={loading}
//               >
//                 <option value="">Select Visa Type (Optional)</option>
//                 {VISA_TYPES.map(type => (
//                   <option key={type} value={type}>{type}</option>
//                 ))}
//               </select>
//             </div>
            
//             <div className="candidate-form-group">
//               <label htmlFor="current_state" className="candidate-form-label">State</label>
//               <select
//                 id="current_state"
//                 name="current_state"
//                 className="candidate-form-input"
//                 value={formData.current_state}
//                 onChange={handleInputChange}
//                 disabled={loading}
//               >
//                 <option value="">Select State (Optional)</option>
//                 {US_STATES.map(state => (
//                   <option key={state} value={state}>{state}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="candidate-form-group candidate-form-group-full">
//             <label htmlFor="current_city" className="candidate-form-label">City</label>
//             <input
//               type="text"
//               id="current_city"
//               name="current_city"
//               className="candidate-form-input"
//               value={formData.current_city}
//               onChange={handleInputChange}
//               placeholder="Enter city (Optional)"
//               disabled={loading}
//             />
//           </div>

//           <div className="candidate-form-group candidate-form-group-full">
//             <label className="candidate-form-label">Employment Type</label>
//             <div className="candidate-checkbox-group">
//               {['W2', 'C2C'].map(type => (
//                 <label key={type} className="candidate-checkbox-label">
//                   <input
//                     type="checkbox"
//                     name={`employment_type_${type}`}
//                     checked={formData.employment_type.includes(type)}
//                     onChange={() => handleEmploymentTypeChange(type)}
//                     disabled={loading}
//                   />
//                   <span>{type}</span>
//                 </label>
//               ))}
//             </div>
//           </div>

//           <div className="candidate-form-group candidate-form-group-full">
//             <label className="candidate-form-label">Upload Resume *</label>
//             <div
//               className={`candidate-file-upload ${dragActive ? 'active' : ''} ${resumeFile ? 'has-file' : ''}`}
//               onDragEnter={handleDrag}
//               onDragLeave={handleDrag}
//               onDragOver={handleDrag}
//               onDrop={handleDrop}
//             >
//               <input
//                 type="file"
//                 id="resume"
//                 className="candidate-file-input"
//                 onChange={handleFileInputChange}
//                 accept=".pdf,.doc,.docx"
//                 required
//                 disabled={loading}
//               />
//               <label htmlFor="resume" className="candidate-file-upload-label">
//                 {resumeFile ? (
//                   <>
//                     <CheckCircle size={24} className="candidate-upload-icon success" />
//                     <span className="candidate-file-upload-text">
//                       Selected: {resumeFile.name}
//                     </span>
//                   </>
//                 ) : (
//                   <>
//                     <Upload size={24} className="candidate-upload-icon" />
//                     <span className="candidate-file-upload-text">
//                       {dragActive
//                         ? 'Drop your resume here'
//                         : 'Click to upload or drag and drop'}
//                     </span>
//                     <span className="candidate-file-upload-hint">
//                       PDF, DOC, or DOCX (max 5MB)
//                     </span>
//                   </>
//                 )}
//               </label>
//             </div>
//           </div>

//           <button
//             onClick={handleSubmit}
//             className="candidate-submit-btn"
//             disabled={loading}
//           >
//             {loading ? (
//               <>
//                 <span className="candidate-loader"></span>
//                 Submitting...
//               </>
//             ) : (
//               'Submit Application'
//             )}
//           </button>

//           {submitted && (
//             <div className="candidate-success-message">
//               <CheckCircle size={20} className="candidate-success-icon" />
//               <span>✓ Application submitted successfully!</span>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import '../styles/CandidateForm.css';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import BASE_URL from '../../url';

// US States list
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const VISA_TYPES = ['H1B', 'H4', 'L1', 'L2', 'O1', 'EB1', 'EB2', 'EB3', 'GC', 'EAD', 'USC', 'GC Holder', 'TN', 'E2'];

export default function ATSCandidateForm({ onSubmit, selectedRole, onApplicationSubmitted }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    visa_type: '',
    current_state: '',
    current_city: '',
    employment_type: []
  });

  const [jobId, setJobId] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // ✅ Initialize form with job ID if available
  useEffect(() => {
    console.log('📋 ATS Candidate Form mounted');
    console.log('🔍 Checking for selectedRole...');
    
    if (selectedRole && selectedRole.role) {
      console.log('✅ Found selectedRole:', selectedRole.role);
      console.log('📌 Capturing job_id:', selectedRole.id);
      
      setFormData(prev => ({
        ...prev,
        position: selectedRole.role
      }));
      setJobId(selectedRole.id);
    } else {
      console.log('⚠️ No selectedRole provided');
    }
  }, [selectedRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleEmploymentTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      employment_type: prev.employment_type.includes(type)
        ? prev.employment_type.filter(t => t !== type)
        : [...prev.employment_type, type]
    }));
    setError('');
  };

  const handleFileUpload = (file) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.doc', '.docx'];
    
    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    const ext = fileName.substring(fileName.lastIndexOf('.'));

    if (!validTypes.includes(fileType) && !validExtensions.includes(ext)) {
      setError('Invalid file type. Please upload PDF, DOC, or DOCX files only.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    setResumeFile(file);
    setError('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name.trim()) {
      setError('First name is required');
      return;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!formData.position.trim()) {
      setError('Position is required');
      return;
    }
    if (!resumeFile) {
      setError('Resume file is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('position', formData.position);
      formDataToSend.append('visa_type', formData.visa_type || '');
      formDataToSend.append('current_state', formData.current_state || '');
      formDataToSend.append('current_city', formData.current_city || '');
      formDataToSend.append('employment_type', formData.employment_type.join(',') || '');
      formDataToSend.append('resume', resumeFile);
      
      // ✅ Add job_id if available
      if (jobId) {
        formDataToSend.append('job_id', jobId);
        console.log('📌 Submitting with job_id:', jobId);
      }

      const response = await fetch(`${BASE_URL}/api/ats/apply`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to submit application');
        setLoading(false);
        return;
      }

      console.log('✅ Application submitted successfully:', data);
      
      // ✅ Call the callback to refresh applicants table
      if (onApplicationSubmitted) {
        console.log('📢 Calling onApplicationSubmitted callback');
        onApplicationSubmitted(data.data);
      }

      // ✅ Also call original onSubmit if provided
      if (onSubmit) {
        onSubmit({
          ...formData,
          resume_link: resumeFile.name,
          id: data.data.id,
          created_at: data.data.created_at,
          job_id: jobId
        });
      }

      setSubmitted(true);
      
      // ✅ Reset form after successful submission
      setTimeout(() => {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          position: selectedRole?.role || '',
          visa_type: '',
          current_state: '',
          current_city: '',
          employment_type: []
        });
        setResumeFile(null);
        setSubmitted(false);
      }, 2000);

    } catch (err) {
      console.error('❌ Submit error:', err);
      setError(err.message || 'An error occurred while submitting your application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidate-form-wrapper">
      <div className="candidate-form-card">
        <div className="candidate-form-header">
          <h2 className="candidate-form-title">Candidate Application Form</h2>
          <p className="candidate-form-subtitle">Join our team by submitting your application</p>
        </div>

        <div className="candidate-application-form">
          {error && (
            <div className="candidate-error-message">
              <AlertCircle size={18} className="candidate-error-icon" />
              <span>{error}</span>
            </div>
          )}

          <div className="candidate-form-row">
            <div className="candidate-form-group">
              <label htmlFor="first_name" className="candidate-form-label">First Name *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className="candidate-form-input"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="Enter first name"
                required
                disabled={loading}
              />
            </div>
            <div className="candidate-form-group">
              <label htmlFor="last_name" className="candidate-form-label">Last Name *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className="candidate-form-input"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Enter last name"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="candidate-form-row">
            <div className="candidate-form-group">
              <label htmlFor="email" className="candidate-form-label">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                className="candidate-form-input"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                required
                disabled={loading}
              />
            </div>
            <div className="candidate-form-group">
              <label htmlFor="phone" className="candidate-form-label">Phone *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="candidate-form-input"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="candidate-form-group candidate-form-group-full">
            <label htmlFor="position" className="candidate-form-label">Position *</label>
            <input
              type="text"
              id="position"
              name="position"
              className="candidate-form-input"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="Enter position applying for"
              required
              disabled={loading}
            />
          </div>

          <div className="candidate-form-row">
            <div className="candidate-form-group">
              <label htmlFor="visa_type" className="candidate-form-label">Visa Type</label>
              <select
                id="visa_type"
                name="visa_type"
                className="candidate-form-input"
                value={formData.visa_type}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Select Visa Type (Optional)</option>
                {VISA_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="candidate-form-group">
              <label htmlFor="current_state" className="candidate-form-label">State</label>
              <select
                id="current_state"
                name="current_state"
                className="candidate-form-input"
                value={formData.current_state}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Select State (Optional)</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="candidate-form-group candidate-form-group-full">
            <label htmlFor="current_city" className="candidate-form-label">City</label>
            <input
              type="text"
              id="current_city"
              name="current_city"
              className="candidate-form-input"
              value={formData.current_city}
              onChange={handleInputChange}
              placeholder="Enter city (Optional)"
              disabled={loading}
            />
          </div>

          <div className="candidate-form-group candidate-form-group-full">
            <label className="candidate-form-label">Employment Type</label>
            <div className="candidate-checkbox-group">
              {['W2', 'C2C'].map(type => (
                <label key={type} className="candidate-checkbox-label">
                  <input
                    type="checkbox"
                    name={`employment_type_${type}`}
                    checked={formData.employment_type.includes(type)}
                    onChange={() => handleEmploymentTypeChange(type)}
                    disabled={loading}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="candidate-form-group candidate-form-group-full">
            <label className="candidate-form-label">Upload Resume *</label>
            <div
              className={`candidate-file-upload ${dragActive ? 'active' : ''} ${resumeFile ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="resume"
                className="candidate-file-input"
                onChange={handleFileInputChange}
                accept=".pdf,.doc,.docx"
                required
                disabled={loading}
              />
              <label htmlFor="resume" className="candidate-file-upload-label">
                {resumeFile ? (
                  <>
                    <CheckCircle size={24} className="candidate-upload-icon success" />
                    <span className="candidate-file-upload-text">
                      Selected: {resumeFile.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="candidate-upload-icon" />
                    <span className="candidate-file-upload-text">
                      {dragActive
                        ? 'Drop your resume here'
                        : 'Click to upload or drag and drop'}
                    </span>
                    <span className="candidate-file-upload-hint">
                      PDF, DOC, or DOCX (max 5MB)
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="candidate-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="candidate-loader"></span>
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </button>

          {submitted && (
            <div className="candidate-success-message">
              <CheckCircle size={20} className="candidate-success-icon" />
              <span>✓ Application submitted successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}