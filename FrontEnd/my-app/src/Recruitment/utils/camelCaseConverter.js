// const toCamelCase = (obj) => {
//   if (Array.isArray(obj)) {
//     return obj.map(toCamelCase);
//   } else if (obj !== null && typeof obj === "object") {
//     return Object.keys(obj).reduce((acc, key) => {
//       const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()); // Convert snake_case to camelCase
//       acc[camelKey] = toCamelCase(obj[key]); // Recursively process values
//       return acc;
//     }, {});
//   }
//   return obj;
// };
