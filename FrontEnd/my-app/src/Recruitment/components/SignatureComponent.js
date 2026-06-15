// import React, { useState, useRef, useEffect } from 'react';
// import SignatureCanvas from 'react-signature-canvas';
// import BASE_URL from "../../url";
// import Swal from "sweetalert2";

// function SignatureComponent({ selectedUser, setSelectedUser, setUsers, activeUser, setActiveUser }) {
//   const [signatureMode, setSignatureMode] = useState('type'); // 'type' or 'draw'
//   const [signatureInput, setSignatureInput] = useState('');
//   const [isLoading, setIsLoading] = useState(true);
//   const sigCanvas = useRef(null);

//   // For debugging
//   const [debug, setDebug] = useState({
//     hasSignature: false,
//     signatureType: 'none',
//     signatureLength: 0
//   });

//   // Determine if signature is an image (data URL) or text
//   const isImageSignature = (sig) => {
//     return sig && typeof sig === 'string' && sig.startsWith('data:image');
//   };

//   useEffect(() => {
//     const fetchSignature = async () => {
//       if (!selectedUser?.id) return;

//       const token = localStorage.getItem("token");
//       try {
//         const res = await fetch(`${BASE_URL}/api/edituser/getuser/${selectedUser.id}/signature`, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           }
//         });

//         const data = await res.json();
//         if (data.signature) {
//           setSelectedUser(prev => ({ ...prev, signature: data.signature }));
//         }
//       } catch (err) {
//         console.error("Failed to fetch signature:", err);
//       }
//     };

//     fetchSignature();
//   }, [selectedUser?.id]);


//   // Re-render canvas when switching tabs or after component mount
//   useEffect(() => {
//     if (signatureMode === 'draw' && selectedUser?.signature && isImageSignature(selectedUser.signature)) {
//       const timer = setTimeout(() => {
//         if (sigCanvas.current) {
//           try {
//             sigCanvas.current.clear();
//             sigCanvas.current.fromDataURL(selectedUser.signature);
//             console.log("Reloaded canvas after mode switch");
//           } catch (err) {
//             console.error("Error reloading canvas:", err);
//           }
//         }
//       }, 300);

//       return () => clearTimeout(timer);
//     }
//   }, [signatureMode]);

//   const saveSignature = async () => {
//     let signatureData;

//     if (signatureMode === 'draw') {
//       signatureData = sigCanvas.current.isEmpty() ? '' : sigCanvas.current.toDataURL('image/png');

//       // Check if data URL is too large
//       if (signatureData && signatureData.length > 100000) {
//         console.log("Warning: Signature data URL is large:", signatureData.length, "bytes");
//         // Consider compressing the image or using a different format
//         // For now, we'll use it as is
//       }
//     } else {
//       signatureData = signatureInput;
//     }

//     console.log("Saving signature type:", signatureMode);
//     console.log("Signature data length:", signatureData.length);

//     const token = localStorage.getItem("token");
//     try {
//       const res = await fetch(`${BASE_URL}/api/edituser/${selectedUser.id}/signature`, {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ signature: signatureData }),
//       });

//       if (!res.ok) {
//         console.error("Server responded with error:", res.status);
//         throw new Error("Signature update failed.");
//       }

//       console.log("Signature saved successfully");
//       const updated = { ...selectedUser, signature: signatureData };
//       setSelectedUser(updated);
//       setUsers((prev) =>
//         prev.map((user) =>
//           user.id === selectedUser.id ? updated : user
//         )
//       );

//       // Also update activeUser if the updated user is self
//       if (selectedUser.id === activeUser.id) {
//         localStorage.setItem("user", JSON.stringify(updated));
//         setActiveUser(updated);
//       }

//       // Update debug info
//       setDebug({
//         hasSignature: true,
//         signatureType: signatureMode === 'draw' ? 'image' : 'text',
//         signatureLength: signatureData.length
//       });

//       Swal.fire(" Signature saved!");
//     } catch (err) {
//       console.error(" Failed to update signature:", err);
//       Swal.fire(" Failed to save signature.");
//     }
//   };

//   const clearSignature = async () => {
//     if (signatureMode === 'draw' && sigCanvas.current) {
//       sigCanvas.current.clear();
//     }

//     const token = localStorage.getItem("token");
//     try {
//       const res = await fetch(`${BASE_URL}/api/edituser/${selectedUser.id}/signature`, {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ signature: "" }),
//       });

//       if (!res.ok) throw new Error("Signature clear failed.");

//       console.log("Signature cleared successfully");
//       const updated = { ...selectedUser, signature: "" };
//       setSignatureInput("");

//       setSelectedUser(updated);
//       setUsers((prev) =>
//         prev.map((user) =>
//           user.id === selectedUser.id ? updated : user
//         )
//       );

//       if (selectedUser.id === activeUser.id) {
//         localStorage.setItem("user", JSON.stringify(updated));
//         setActiveUser(updated);
//       }

//       // Update debug info
//       setDebug({
//         hasSignature: false,
//         signatureType: 'none',
//         signatureLength: 0
//       });

//       Swal.fire(" Signature cleared.");
//     } catch (err) {
//       console.error("Failed to clear signature:", err);
//       Swal.fire("Failed to clear signature.");
//     }
//   };

//   // Display the saved signature when in view mode
//   const renderSavedSignature = () => {
//     if (!selectedUser?.signature) {
//       return <p style={{ fontStyle: 'italic', color: '#666' }}>No signature saved</p>;
//     }

//     if (isImageSignature(selectedUser.signature)) {
//       return (
//         <div style={{ marginBottom: '1rem' }}>
//           <p>Current signature:</p>
//           <img
//             src={selectedUser.signature}
//             alt="Saved Signature"
//             style={{
//               maxWidth: '400px',
//               border: '1px solid #ccc',
//               borderRadius: '8px',
//               padding: '0.5rem',
//               backgroundColor: '#fff'
//             }}
//             onError={(e) => {
//               console.error("Error loading signature image");
//               e.target.style.display = 'none';
//               e.target.parentNode.innerHTML += '<p style="color: red">Error loading signature image</p>';
//             }}
//           />
//         </div>
//       );
//     } else {
//       return (
//         <div style={{ marginBottom: '1rem' }}>
//           <p>Current signature:</p>
//           <div style={{
//             maxWidth: '400px',
//             padding: '0.75rem',
//             border: '1px solid #ccc',
//             borderRadius: '8px',
//             fontFamily: "'Pacifico', cursive",
//             fontSize: '20px',
//             backgroundColor: '#fff'
//           }}>
//             {selectedUser.signature}
//           </div>
//         </div>
//       );
//     }
//   };

//   return (
//     <div>
//       <h3 className="section-title">Signature</h3>
//       {selectedUser ? (
//         <>
//           {/* Display the current saved signature */}
//           {renderSavedSignature()}

//           {/* Debug information (remove in production) */}
//           <div style={{ marginBottom: '1rem', fontSize: '12px', color: '#666', display: 'none' }}>
//             <p>Debug: {debug.hasSignature ? `Has ${debug.signatureType} signature (${debug.signatureLength} bytes)` : 'No signature'}</p>
//           </div>

//           <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
//             {/* Signature Mode Selector */}
//             <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
//               <button
//                 type="button"
//                 onClick={() => setSignatureMode('type')}
//                 style={{
//                   padding: "0.5rem 1rem",
//                   borderRadius: "4px",
//                   border: "1px solid #ccc",
//                   background: signatureMode === 'type' ? "linear-gradient(180deg, #019d88, #0d2e26)" : "#f5f5f5",
//                   color: signatureMode === 'type' ? "white" : "black",
//                   cursor: "pointer"
//                 }}
//               >
//                 Type Signature
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setSignatureMode('draw')}
//                 style={{
//                   padding: "0.5rem 1rem",
//                   borderRadius: "4px",
//                   border: "1px solid #ccc",

//                   background: signatureMode === 'draw'
//                     ? "linear-gradient(180deg, #019d88, #0d2e26)"
//                     : "#f5f5f5",

//                   color: signatureMode === 'draw' ? "white" : "black",
//                   cursor: "pointer"
//                 }}
//               >
//                 Draw Signature
//               </button>
//             </div>

//             {/* Type Signature Input */}
//             {signatureMode === 'type' && (
//               <textarea
//                 value={signatureInput}
//                 onChange={(e) => setSignatureInput(e.target.value)}
//                 placeholder="Type your signature here"
//                 rows={4}
//                 style={{
//                   width: "100%",
//                   maxWidth: "400px",
//                   fontSize: "20px",
//                   padding: "0.75rem",
//                   border: "1px solid #ccc",
//                   borderRadius: "8px",
//                   resize: "none",
//                   fontFamily: "'Pacifico', cursive"
//                 }}
//               />
//             )}

//             {/* Draw Signature Canvas */}
//             {signatureMode === 'draw' && (
//               <div>
//                 {isLoading ? (
//                   <div style={{ width: '400px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc', borderRadius: '8px' }}>
//                     Loading...
//                   </div>
//                 ) : (
//                   <SignatureCanvas
//                     ref={sigCanvas}
//                     penColor="black"
//                     canvasProps={{
//                       width: 400,
//                       height: 150,
//                       className: 'sigCanvas',
//                       style: {
//                         border: '1px solid #ccc',
//                         borderRadius: '8px',
//                       },
//                     }}
//                   />
//                 )}
//                 <button
//                   onClick={() => sigCanvas.current.clear()}
//                   style={{
//                     marginTop: '0.5rem',
//                     padding: '0.25rem 0.5rem',
//                     fontSize: '0.875rem',
//                     background: 'linear-gradient(180deg, #019d88, #0d2e26)',
//                     color: 'white',
//                     marginBottom: '40px',
//                     border: '1px solid #ccc',
//                     borderRadius: '4px',
//                     cursor: 'pointer'
//                   }}
//                 >
//                   Reset Canvas
//                 </button>
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div style={{ display: "flex", gap: "0.5rem" }}>
//               <button
//                 type="button"
//                 onClick={saveSignature}
//                 className="save-btn"
//               >
//                 Save
//               </button>

//               <button
//                 type="button"
//                 onClick={clearSignature}
//                 className="clear-btn"
//               >
//                 Clear
//               </button>
//             </div>
//           </div>
//         </>
//       ) : (
//         <p>Loading signature...</p>
//       )}
//     </div>
//   );
// }

// export default SignatureComponent;