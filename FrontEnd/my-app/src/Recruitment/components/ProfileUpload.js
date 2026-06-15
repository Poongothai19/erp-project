// import React, { useState, useCallback, useRef } from "react";
// import Cropper from "react-easy-crop";
// import getCroppedImg from "../utils/cropImage";
// import axios from "axios";
// import "../styles/ProfileUpload.css";
// import BASE_URL from "../../url";

// const ProfileUpload = ({ id, onUpload, onClose }) => {
//   const [image, setImage] = useState(null);
//   const [crop, setCrop] = useState({ x: 0, y: 0 });
//   const [zoom, setZoom] = useState(1);
//   const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
//   const [cropping, setCropping] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);
//   const fileInputRef = useRef(null);

//   const onCropComplete = useCallback((_, croppedAreaPixels) => {
//     setCroppedAreaPixels(croppedAreaPixels);
//   }, []);

//   const handleCancel = () => {
//     setImage(null); // Reset the image state to cancel file selection
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) handleFile(file);
//   };

//   const handleFile = (file) => {
//     if (file && file.type.startsWith("image/")) {
//       setImage(URL.createObjectURL(file));
//     }
//   };

//   const handleDragEnter = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };

//   const handleDragLeave = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();

//     setIsDragging(false);

//     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
//       handleFile(e.dataTransfer.files[0]);
//       e.dataTransfer.clearData();
//     }
//   };

//   const handleUpload = async () => {
//     if (!id || !image || !croppedAreaPixels) {
//       console.error("Cannot upload: ID is missing or crop not ready");
//       return;
//     }

//     setCropping(true);

//     try {
//       const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
//       const formData = new FormData();
//       formData.append("file", croppedBlob);

//       // Get token from localStorage
//       const token = localStorage.getItem("token");

//       const response = await axios.post(
//         `${BASE_URL}/api/auth/upload-profile?id=${id}`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//             Authorization: `Bearer ${token}`, //  Add token in headers
//           },
//         }
//       );

//       console.log(" Upload success:", response.data);
//       if (onUpload) onUpload(response.data.url);
//       onClose();
//     } catch (error) {
//       console.error("Failed to upload cropped image:", error);
//     } finally {
//       setCropping(false);
//     }
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="profile-upload-modal">
//         <div className="modal-header">
//           <h3>Upload Profile Photo</h3>
//           <button className="close-button" onClick={onClose}>&times;</button>
//         </div>

//         {!image ? (
//           <div
//             className={`dropzone ${isDragging ? 'dragging' : ''}`}
//             onDragEnter={handleDragEnter}
//             onDragLeave={handleDragLeave}
//             onDragOver={handleDragOver}
//             onDrop={handleDrop}
//             onClick={() => fileInputRef.current.click()}
//           >
//             <input
//               type="file"
//               ref={fileInputRef}
//               accept="image/*"
//               onChange={handleFileChange}
//               style={{ display: 'none' }}
//             />
//             <div className="dropzone-content">
//               <div className="upload-icon">
//                 <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
//                   <polyline points="17 8 12 3 7 8"></polyline>
//                   <line x1="12" y1="3" x2="12" y2="15"></line>
//                 </svg>
//               </div>
//               <p>Drag & drop an image or click to browse</p>
//             </div>
//           </div>
//         ) : (
//           <>
//             <div className="crop-container">
//               <Cropper
//                 image={image}
//                 crop={crop}
//                 zoom={zoom}
//                 aspect={1}
//                 onCropChange={setCrop}
//                 onZoomChange={setZoom}
//                 onCropComplete={onCropComplete}
//               />
//             </div>

//             <div className="zoom-control">
//               <label>Zoom:</label>
//               <input
//                 type="range"
//                 min="1"
//                 max="3"
//                 step="0.1"
//                 value={zoom}
//                 onChange={(e) => setZoom(parseFloat(e.target.value))}
//               />
//             </div>

//             <div className="modal-footer">
//               <button className="cancel-button" onClick={handleCancel}>
//                 Cancel
//               </button>
//               <button
//                 className="set-profile-button"
//                 onClick={handleUpload}
//                 disabled={cropping}
//               >
//                 {cropping ? "Processing..." : "Set Profile"}
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ProfileUpload;