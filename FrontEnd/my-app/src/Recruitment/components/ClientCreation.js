// import React, { useRef, useState } from "react";
// import "../styles/ClientCreation.css";
// import PhoneInput from "react-phone-input-2";
// import "react-phone-input-2/lib/style.css";
// import { useNavigate } from "react-router-dom";
// import { showSuccessAlert, showWarningAlert, showErrorAlert } from "../Assets/AlertHelper";
// import BASE_URL from "../../url"; 

// const CreateClient = () => {
//   const navigate = useNavigate();
//   /* State for Address */
//   const [billingAddress, setBillingAddress] = useState({
//     street: "",
//     city: "",
//     province: "",
//     code: "",
//     country: "",
//   });
//   const [shippingAddress, setShippingAddress] = useState({
//     street: "",
//     city: "",
//     province: "",
//     code: "",
//     country: "",
//   });

//   /* State for Phone Input */
//   const [contactNumber, setContactNumber] = useState("");

//   /* Refs for non-address fields */
//   const clientNameRef = useRef(null);
//   const accountManagerRef = useRef(null);
//   const industryRef = useRef(null);
//   const parentClientRef = useRef(null);
//   const faxRef = useRef(null);
//   const websiteRef = useRef(null);
 
//   /*  Handle input changes for Address fields */
//   const handleBillingChange = (e) => {
//     setBillingAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleShippingChange = (e) => {
//     setShippingAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   /* Copy Address Function */
//   const copyAddress = (direction) => {
//     if (direction === "toShipping") {
//       setShippingAddress((prev) => ({ ...billingAddress }));
//     } else if (direction === "toBilling") {
//       setBillingAddress((prev) => ({ ...shippingAddress }));
//     }
//   };

//   /* Handle form submission */
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!clientNameRef.current.value.trim() || !contactNumber.trim()) {
//         showErrorAlert("Client Name and Contact Number are required!");
//         return;
//     }

//     const token = localStorage.getItem("token"); //token 

//     if (!token) {
//         console.error(" No token found. User must be logged in.");
//         showErrorAlert("Unauthorized! Please log in again.");
//         return;
//     }

//     console.log(" Auth Header:", `Bearer ${token}`);

//     const formData = {
//       clientName: clientNameRef.current.value.trim(),
//       contactNumber: contactNumber.trim(),
//       accountManager: accountManagerRef.current.value.trim() || null,
//       industry: industryRef.current.value.trim() || null,
//       parentClient: parentClientRef.current.value.trim() || null,
//       fax: faxRef.current.value.trim() || null,
//       website: websiteRef.current.value.trim() || null,
//       billingStreet: billingAddress.street,
//       billingCity: billingAddress.city,
//       billingProvince: billingAddress.province,
//       billingCode: billingAddress.code,
//       billingCountry: billingAddress.country,
//       shippingStreet: shippingAddress.street,
//       shippingCity: shippingAddress.city,
//       shippingProvince: shippingAddress.province,
//       shippingCode: shippingAddress.code,
//       shippingCountry: shippingAddress.country,
//     };
    

//     console.log(" Sending Data:", formData);

//     try {
//         const response = await fetch(`${BASE_URL}/api/clients`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Authorization": `Bearer ${token}`, // Include the token
//             },
//             body: JSON.stringify(formData),
//         });

//         if (!response.ok) {
//             throw new Error(`Unexpected response: ${response.status}`);
//         }

//         showSuccessAlert("Client created successfully!");
//         navigate("/Client-listings");
//     } catch (error) {
//         console.error(" API Error:", error);
//         showErrorAlert("Failed to create client");
//     }
// };

  

// return (
//   <div className="client-form-wrapper">
//   <div className="client-form-create-client-page">
//     <div className="client-form-client-form-container">
//       <h1>Create Client</h1>
//       <form onSubmit={handleSubmit} className="client-form">
//       <div className="client-button-group">
//               <button type="button" className="client-cancel-btn" onClick={() => navigate("/Client-listings")}>Cancel</button>
//               <button type="submit" className="client-save-button" >Save</button>
//             </div>
//         {/* Client Details */}
//         <section className="client-form-client-details">
//           <h3>Client Information</h3>
//           <div className="client-form-grid">
//             <div className="client-form-group">
//               <label>Client Name <span className="client-required">*</span></label>
//               <input type="text" ref={clientNameRef} required />
             
//               <label>Account Manager</label>
//               <select ref={accountManagerRef}>
//                 <option value="">Select</option>
//                 <option value="Tina">Tina</option>
//                 <option value="John">John</option>
//                 <option value="Emma">Emma</option>
//               </select>
//               <label>Industry</label>
//               <input type="text" ref={industryRef} />
//               <label>Contact Number</label>
//               <PhoneInput
//                 country="us"
//                 enableSearch
//                 placeholder="Enter phone number"
//                 inputStyle={{ width: "100%", height: "40px", marginBottom:"0px"}}
//                 value={contactNumber}
//                 onChange={setContactNumber}
//               />
//             </div>
//             <div className="client-form-group">
//               <label>Parent Client</label>
//               <input type="text" ref={parentClientRef} />
//               <label>Fax</label>
//               <input type="text" ref={faxRef} />
//               <label>Website</label>
//               <input type="text" ref={websiteRef} />
//             </div>
//           </div>
//         </section>
//         {/* Address Section */}
//         <section className="client-address-details">
//           <h3>Address Information</h3>
//           <div className="client-form-grid">
//             {/* Billing Address */}
//             <div className="client-form-group">
//               <h4>Billing Address</h4>
//               {["Street", "City", "Province", "Code", "Country"].map((field) => (
//                 <div key={field}>
//                   <label>{field}</label>
//                   <input type="text" name={field.toLowerCase()} value={billingAddress[field.toLowerCase()]} onChange={handleBillingChange} />
//                 </div>
//               ))}
//             </div>
//             {/* Shipping Address */}
//             <div className="client-form-group">
//               <h4>Shipping Address</h4>
//               {["Street", "City", "Province", "Code", "Country"].map((field) => (
//                 <div key={field}>
//                   <label>{field}</label>
//                   <input type="text" name={field.toLowerCase()} value={shippingAddress[field.toLowerCase()]} onChange={handleShippingChange} />
//                 </div>
//               ))}
//             </div>
//           </div>
//           {/* Copy Address Dropdown & Form Buttons */}
//           <div className="client-form-actions">
//             <select onChange={(e) => copyAddress(e.target.value === "billingToShipping" ? "toShipping" : "toBilling")} className="copy-address-dropdown">
//               <option value="Copy Address">Copy Address</option>
//               <option value="billingToShipping">Copy Billing to Shipping</option>
//               <option value="shippingToBilling">Copy Shipping to Billing</option>
//             </select>

            
//           </div>
//         </section>
//       </form>
//     </div>
//   </div>
//   </div>
// );
// };
// export default CreateClient;

