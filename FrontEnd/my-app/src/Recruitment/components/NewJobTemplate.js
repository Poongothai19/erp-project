// import React, { useState, useEffect } from "react";
// import "../styles/NewJobTemplate.css";
// import axios from "axios";
// // import RequiredSkills from "./RequiredSkills";
// import ReactQuill from 'react-quill'; // Import ReactQuill
// import 'react-quill/dist/quill.snow.css'; // Import the Quill styles
// import skill from '../../data/skill.json'
// import Swal from "sweetalert2";
// import BASE_URL from "../../url";
// const NewJobTemplate = ({ setJobTemplates, setCurrentPage }) => {
//   const [templateName, setTemplateName] = useState("");
//   const [industry, setIndustry] = useState("");
//   const [clientName, setClientName] = useState("");
//   const [storeUnder, setStoreUnder] = useState("");
//   const [contactName, setContactName] = useState("");
//   const [selectedSkills, setSelectedSkills] = useState([]);
//   const [experience, setExperience] = useState("");
//   const [salary, setSalary] = useState("");
//   const [jobDescription, setJobDescription] = useState("");
//   const [requirements, setRequirements] = useState("");
//   const [benefits, setBenefits] = useState("");
//   const [isSubmitted, setIsSubmitted] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const jobData = {
//       templateName,
//       industry,
//       storeUnder,
//       clientName,
//       contactName,
//       skills: selectedSkills,
//       experience,
//       salary,
//       jobDescription,
//       requirements,
//       benefits,
//     };

//     console.log("Sending data:", jobData);



//     try {
//       const token = localStorage.getItem("token"); // Retrieve the token from storage
//       if (!token) {
//         console.error("No authentication token found.");
//         return; //  Ensure function exits if there's no token
//       } //  Correctly close the if statement

//       const response = await axios.post(`${BASE_URL}/api/jobtemplate`, jobData, {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include token in headers
//         },
//       });

//       Swal.fire("Job Template Created Successfully!");

//       if (typeof setJobTemplates === "function") {
//         setJobTemplates((prev) => [...prev, response.data]);
//       } else {
//         console.error("Error: setJobTemplates is not a function");
//       }

//       // Clear the form
//       setTemplateName("");
//       setIndustry("");
//       setStoreUnder("");
//       setClientName("");
//       setContactName("");
//       setSelectedSkills([]);
//       setExperience("");
//       setSalary("");
//       setJobDescription("");
//       setRequirements("");
//       setBenefits("");

//       setIsSubmitted(true);
//     } catch (error) {
//       console.error("Error saving job template:", error);
//       Swal.fire("Error saving job template");
//     }
//   }


//   // Redirect after submission
//   useEffect(() => {
//     if (isSubmitted) {
//       setCurrentPage("templates");
//     }
//   }, [isSubmitted, setCurrentPage]);

//   const handleSkillSelect = (event) => {
//     const selectedSkill = event.target.value;
//     if (selectedSkill && !selectedSkills.includes(selectedSkill)) {
//       setSelectedSkills([...selectedSkills, selectedSkill]);
//     }
//   };

//   // Handle skill removal
//   const removeSkill = (skill) => {
//     setSelectedSkills(selectedSkills.filter((s) => s !== skill));
//   };
//   // Custom Fonts List
//   useEffect(() => {
//     const fonts = [
//       "Arial", "Arial Black", "Arvo", "Book Antiqua", "Calibri", "Comic Sans MS",
//       "Courier New", "Garamond", "Georgia", "Impact", "Lucida Console", "Monospace",
//       "MSMincho", "MSPMincho", "Narrow", "Serif", "Tahoma", "Times New Roman", "Verdana"
//     ];

//     const Font = ReactQuill.Quill.import("formats/font");
//     Font.whitelist = fonts;
//     ReactQuill.Quill.register(Font, true);
//   }, []);

//   // Move quillModules outside useEffect
//   const quillModules = {
//     toolbar: [
//       [{ font: [] }],
//       [{ size: [] }],
//       ["bold", "italic", "underline", "strike"],
//       [{ align: [] }],
//       [{ list: "ordered" }, { list: "bullet" }],
//       [{ script: "sub" }, { script: "super" }],
//       ["blockquote", "code-block"],
//       ["link", "image"],
//       [{ color: [] }, { background: [] }],
//       ["clean"],
//     ],
//   };


//   return (
//     <div className="new-job-template-container">
//       <h3 className="title">New Job Template</h3>

//       <div className="form-group">
//         <label>Template Name</label>
//         <input
//           type="text"
//           className="input-field"
//           placeholder="Enter template name"
//           value={templateName}
//           onChange={(e) => setTemplateName(e.target.value)}
//         />
//       </div>

//       <div className="form-group">
//         <label>Industry</label>
//         <select
//           className="select-field"
//           value={industry}
//           onChange={(e) => setIndustry(e.target.value)}
//         >
//           <option>-None-</option>
//           <option>Prophecy</option>
//           <option>TCS</option>
//         </select>
//       </div>
//       <div className="form-group">
//         <label>Store Under</label>
//         <select
//           className="select-field"
//           value={storeUnder}
//           onChange={(e) => setStoreUnder(e.target.value)}
//         >
//           <option value="">- Select an option -</option>
//           <option value="Public Job Templates">Public Job Templates</option>

//         </select>
//       </div>

//       <div className="form-group">
//         <label>Client Name</label>
//         <input
//           type="text"
//           className="input-field"
//           placeholder="Search for Clients"
//           value={clientName}
//           onChange={(e) => setClientName(e.target.value)}
//         />
//       </div>

//       <div className="form-group">
//         <label>Contact Name</label>
//         <input
//           type="text"
//           className="input-field"
//           placeholder="Search for Contacts"
//           value={contactName}
//           onChange={(e) => setContactName(e.target.value)}
//         />
//       </div>

//       <div className="form-group">
//         <label>Skills</label>
//         <select className="select-field" onChange={handleSkillSelect}>
//           <option value="">Select a skill</option>
//           {skill.skills.map((skillName, index) => (
//             <option key={index} value={skillName}>{skillName}</option>
//           ))}
//         </select>
//         <div className="selected-skills">
//           {selectedSkills.map((skill, index) => (
//             <span key={index} className="skill-tag">
//               {skill} <button onClick={() => removeSkill(skill)}>x</button>
//             </span>
//           ))}
//         </div>
//       </div>

//       <div className="form-group">
//         <label>Work Experience</label>
//         <select
//           className="select-field"
//           value={experience}
//           onChange={(e) => setExperience(e.target.value)}
//         >
//           <option value="">-None-</option>
//           <option value="1">1 Year</option>
//           <option value="2">2 Years</option>
//           <option value="3">3 Years</option>
//           <option value="5">5+ Years</option>
//         </select>
//       </div>

//       <div className="form-group">
//         <label>Salary</label>
//         <input
//           type="text"
//           className="input-field"
//           placeholder="Enter salary"
//           value={salary}
//           onChange={(e) => setSalary(e.target.value)}
//         />
//       </div>

//       <div className="form-group job-description">
//         <label>Job Description</label>
//         <ReactQuill
//           className="job-textarea"
//           value={jobDescription}
//           onChange={setJobDescription}
//           modules={quillModules}
//           placeholder="Enter job description"
//         />
//       </div>

//       <div className="form-group job-description">
//         <label>Requirements</label>
//         <ReactQuill
//           className="job-textarea"
//           value={requirements}
//           onChange={setRequirements}
//           modules={quillModules}
//           placeholder="Enter requirements"
//         />
//       </div>

//       <div className="form-group job-description">
//         <label>Benefits</label>
//         <ReactQuill
//           className="job-textarea"
//           value={benefits}
//           onChange={setBenefits}
//           modules={quillModules}
//           placeholder="Enter benefits"
//         />
//       </div>
//       <div className="button-group">
//         <button className="primary-btn1 " onClick={handleSubmit}>Save</button>
//         {/* <button className="secondary-btn1">Preview</button> */}
//         <button className="cancel-btn" onClick={() => setCurrentPage("templates")}>Cancel</button>
//         </div>
//     </div>

//   );

// };

// export default NewJobTemplate;
