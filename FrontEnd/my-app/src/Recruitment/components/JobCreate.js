// import React from "react";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom"; 
// import "../styles/jobcreate.css";

// const JobOpenPage = () => {
//   const navigate = useNavigate(); 
//   const handleCreateJob = () => {
//     navigate('/job-openings');
//   };

//   const handleImportJob = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       alert(`File selected: ${file.name}`);
//     }
//   };

//   return (
//     <div className="job-create-container">
//       <div className="job-create-container-button-container">
//         <motion.button
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//           // initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           onClick={handleCreateJob}
//           className="job-button create-job"
//         >
//           Create Job Open
//         </motion.button>

//         <motion.label
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//           // initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.2 }}
//           className="job-button import-job import-label"
//         >
//           Import Job Open
//           <input type="file" accept=".csv,.xlsx,.json" className="hidden-input" onChange={handleImportJob} />
//         </motion.label>
//       </div>
//     </div>
//   );
// };

// export default JobOpenPage;
