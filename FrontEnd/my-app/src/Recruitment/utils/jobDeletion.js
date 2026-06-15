// import Swal from "sweetalert2";

// // Function to delete jobs via API
// export const deleteJobsAPI = async (ids) => {
//   const token = localStorage.getItem("token");

//   if (!token) {
//     Swal.fire({
//       icon: "warning",
//       title: "Unauthorized!",
//       text: "No token found. Please log in again.",
//       confirmButtonColor: "#ffcc00",
//     });
//     return { success: false };
//   }

//   try {
//     const response = await fetch(`http://localhost:5000/api/jobs/delete?ids=${ids.join(",")}`, {
//       method: "DELETE",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     Swal.fire({
//       icon: "success",
//       title: "Success!",
//       text: "Jobs deleted successfully.",
//       confirmButtonColor: "#019d88",
//     });

//     return { success: true };
//   } catch (error) {
//     console.error("Error deleting jobs:", error);
//     Swal.fire({
//       icon: "error",
//       title: "Error!",
//       text: "Failed to delete jobs.",
//       confirmButtonColor: "#e74c3c",
//     });
//     return { success: false };
//   }
// };

// // Function to handle multiple deletions
// export const handleMultipleDelete = async (selectedIds, jobs, setJobs, setFilteredJobs, setSelectedRows) => {
//   if (!Array.isArray(jobs)) {
//     console.error("Jobs array is undefined or not an array.");
//     return;
//   }

//   const result = await deleteJobsAPI(selectedIds);
//   if (result.success) {
//     const updatedJobs = jobs.filter((job) => !selectedIds.includes(job.id));
//     setJobs(updatedJobs);
//     setFilteredJobs(updatedJobs);
//     setSelectedRows(new Set());
//   }
// };

// //  Function to handle single job deletion
// export const handleSingleDelete = async (jobId, jobs, setJobs, setFilteredJobs, setSelectedRows) => {
//   if (!Array.isArray(jobs)) {
//     console.error("Jobs array is undefined or not an array.");
//     return;
//   }

//   const result = await deleteJobsAPI([jobId]);
//   if (result.success) {
//     const updatedJobs = jobs.filter((job) => job.id !== jobId);
//     setJobs(updatedJobs);
//     setFilteredJobs(updatedJobs);
//     setSelectedRows(new Set());
//   }
// };

// //  Function to show confirmation for multiple deletions
// export const deleteSelectedRows = async (selectedRows, handleMultipleDelete, jobs, setJobs, setFilteredJobs, setSelectedRows) => {
//   const selectedIds = Array.from(selectedRows);

//   if (selectedIds.length === 0) {
//     Swal.fire({
//       icon: "warning",
//       title: "No Jobs Selected",
//       text: "Please select at least one job to delete.",
//       confirmButtonColor: "#ffcc00",
//     });
//     return;
//   }

//   Swal.fire({
//     title: "Are you sure?",
//     text: "Do you really want to delete the selected jobs?",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonColor: "#d33",
//     cancelButtonColor: "#3085d6",
//     confirmButtonText: "Yes, delete them!",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       handleMultipleDelete(selectedIds, jobs, setJobs, setFilteredJobs, setSelectedRows);
//     }
//   });
// };

// // Function to show confirmation for single row deletion
// export const deleteSingleRow = async (jobId, handleSingleDelete, jobs, setJobs, setFilteredJobs, setSelectedRows) => {
//   Swal.fire({
//     title: "Are you sure?",
//     text: "Do you really want to delete this job?",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonColor: "#d33",
//     cancelButtonColor: "#3085d6",
//     confirmButtonText: "Yes, delete it!",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       handleSingleDelete(jobId, jobs, setJobs, setFilteredJobs, setSelectedRows);
//     }
//   });
// };
