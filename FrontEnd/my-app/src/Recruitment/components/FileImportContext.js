// import React, { createContext, useState } from "react";

// export const FileImportContext = createContext();

// export const FileImportProvider = ({ children }) => {
//   const [fileName, setFileName] = useState("");

//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       setFileName(file.name);
//     }
//   };

//   return (
//     <FileImportContext.Provider value={{ handleFileChange, fileName }}>
//       {children}
//     </FileImportContext.Provider>
//   );
// };
