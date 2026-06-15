// // import React, { useEffect, useState } from "react";
// // import axios from "axios";
// // import "../styles/LocaleInformation.css";
// // import countries from "i18n-iso-countries";
// // import { languages } from "countries-list";
// // import moment from "moment-timezone";
// // import DatePicker from "react-datepicker";
// // import "react-datepicker/dist/react-datepicker.css";
// // import Swal from "sweetalert2";
// // import BASE_URL from "../../url"; 

// // countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

// // const LocaleInformation = ({ onClose, onSave }) => {
// //   const [localeData, setLocaleData] = useState({
// //     id: "",
// //     language: "",
// //     country: "",
// //     dateFormat: "",
// //     timeFormat: "",
// //     timeZone: "",
// //   });

// //   const [options, setOptions] = useState({
// //     languages: [],
// //     countries: [],
// //     dateFormats: [],
// //     timeFormats: [],
// //     timeZones: [],
// //   });

// //   const [selectedDate, setSelectedDate] = useState(null);

// //   const getReadableTimeZone = (zone) => {
// //     try {
// //       const offset = moment.tz(zone).utcOffset();
// //       const hours = Math.floor(offset / 60);
// //       const minutes = offset % 60;
// //       const sign = offset >= 0 ? "+" : "-";
// //       const formattedOffset = `${sign}${String(Math.abs(hours)).padStart(2, "0")}:${String(
// //         Math.abs(minutes)
// //       ).padStart(2, "0")}`;
// //       return `(UTC${formattedOffset}) ${zone.replace("_", " ")}`;
// //     } catch {
// //       return zone;
// //     }
// //   };

// //   const fetchLocaleData = async () => {
// //     try {
// //       const token = localStorage.getItem("token");
// //       const response = await axios.get(`${BASE_URL}/api/locale/options`, {
// //         // timeout: 8000,
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       const { countries, languages, dateFormats, timeFormats, timeZones } = response.data;

// //       const allTimeZones = moment.tz.names();

// //       const formattedTimeZones = allTimeZones
// //         .map((zone) => ({
// //           value: zone,
// //           label: getReadableTimeZone(zone),
// //         }))
// //         .sort((a, b) => a.label.localeCompare(b.label));

// //       setOptions({
// //         countries,
// //         languages,
// //         dateFormats,
// //         timeFormats: ["12h", "24h"],
// //         timeZones: formattedTimeZones,
// //       });
// //     } catch (error) {
// //       console.error("Error fetching locale data:", error);

// //       const fallbackTimeZones = moment.tz.names().map((zone) => ({
// //         value: zone,
// //         label: getReadableTimeZone(zone),
// //       }));

// //       setOptions({
// //         countries: [],
// //         languages: [],
// //         dateFormats: [],
// //         timeFormats: ["12h", "24h"],
// //         timeZones: fallbackTimeZones,
// //       });
// //     }
// //   };

// //   const fetchExistingLocale = async () => {
// //     const token = localStorage.getItem("token");
// //     const storedId = localStorage.getItem("id");
  
// //     if (!storedId) return;
  
// //     try {
// //       const res = await axios.get(`${BASE_URL}/api/locale/${storedId}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
  
// //       const fetchedData = res.data;
// //       setLocaleData((prev) => ({
// //         ...prev,
// //         ...fetchedData,
// //         timeZone: fetchedData.time_zone || prev.timeZone,
// //       }));
  
// //       if (fetchedData.dateFormat) {
// //         const parsedDate = moment(fetchedData.dateFormat, "MM/DD/YYYY").toDate();
// //         setSelectedDate(parsedDate);
// //       }
// //     } catch (err) {
// //       console.error("Error fetching existing locale", err);
// //     }
// //   };
  
// //   useEffect(() => {
// //     const fetchAllData = async () => {
// //       await fetchLocaleData();
// //       await fetchExistingLocale();

// //       const storedId = localStorage.getItem("id");
// //       if (storedId) {
// //         setLocaleData((prev) => ({ ...prev, id: parseInt(storedId) }));
// //       }
// //     };

// //     fetchAllData();
// //   }, []);
// //   useEffect(() => {
// //     if (
// //       localeData.timeZone &&
// //       !options.timeZones.some((tz) => tz.value === localeData.timeZone)
// //     ) {
// //       const fallback = {
// //         value: localeData.timeZone,
// //         label: getReadableTimeZone(localeData.timeZone),
// //       };
// //       setOptions((prev) => ({
// //         ...prev,
// //         timeZones: [...prev.timeZones, fallback],
// //       }));
// //     }
// //   }, [localeData.timeZone, options.timeZones]);
  
// // //   const handleSave = async () => {
// // //     const { language, country, dateFormat, timeFormat, timeZone, id } = localeData;

// // //     if (!language || !country || !dateFormat || !timeFormat || !timeZone) {
// // //       Swal.fire("Please fill out all fields before saving.");
// // //       return;
// // //     }

// // //     try {
// // //       const token = localStorage.getItem("token");

// // //       const payload = {
// // //         id,
// // //         language,
// // //         country,
// // //         date_format: dateFormat,
// // //         time_format: timeFormat,
// // //         time_zone: timeZone,
// // //       };

// // //       const response = await axios.put(`${BASE_URL}/api/locale/${id}`, payload, {
// // //         headers: {
// // //           Authorization: `Bearer ${token}`,
// // //           "Content-Type": "application/json",
// // //         },
// // //       });

// // //       console.log("Locale saved:", response.data);
// // //       onSave(response.data);
// // // await fetchLocaleData(); // 🔁 Refresh all dropdown options
// // // onClose();

// // //     } catch (error) {
// // //       console.error("Error saving locale information:", error);
// // //       alert("Failed to save locale information. Please try again.");
// // //     }
// // //   };
// // const handleSave = async () => {
// //   console.log(localeData);
// //   const { language, country, dateFormat, timeFormat, timeZone, id } = localeData;

// //   if (!language || !country || !dateFormat || !timeFormat || !timeZone) {
// //     Swal.fire("Please fill out all fields before saving.");
// //     return;
// //   }

// //   try {
// //     const token = localStorage.getItem("token");

// //     const payload = {
// //       id,
// //       language,
// //       country,
// //       date_format: dateFormat,
// //       time_format: timeFormat,
// //       time_zone: timeZone,
// //     };

// //     const response = await axios.put(`${BASE_URL}/api/locale/${id}`, payload, {
// //       headers: {
// //         Authorization: `Bearer ${token}`,
// //         "Content-Type": "application/json",
// //       },
// //     });

// //     console.log("Locale saved:", response.data);
// //     onSave(response.data);
// // await fetchLocaleData(); // 🔁 Refresh all dropdown options
// // onClose();

// //   } catch (error) {
// //     console.error("Error saving locale information:", error);
// //     alert("Failed to save locale information. Please try again.");
// //   }
// // };

// //   const handleChange = (e) => {
// //     const { name, value } = e.target;
// //     setLocaleData({ ...localeData, [name]: value });
// //   };

// //   const allLanguages = Object.entries(languages).map(([code, data]) => ({
// //     code,
// //     name: data.name,
// //   }));

// //   const allCountries = Object.entries(countries.getNames("en", { select: "official" })).map(
// //     ([code, name]) => ({ code, name })
// //   );

// //   const timeFormatLabels = {
// //     "12h": "12 Hours",
// //     "24h": "24 Hours",
// //   };

// //   return (
// //     <div className="modal-overlay">
// //       <div className="modal-content">
// //         <h3>Locale Information</h3>

// //         <label>Language</label>
// //         <select name="language" value={localeData.language} onChange={handleChange}>
// //           <option value="">Select Language</option>
// //           {allLanguages.map(({ code, name }) => (
// //             <option key={code} value={name}>
// //               {name}
// //             </option>
// //           ))}
// //         </select>

// //         <label>Country Locale</label>
// //         <select name="country" value={localeData.country} onChange={handleChange}>
// //           <option value="">Select Country</option>
// //           {allCountries.map(({ code, name }) => (
// //             <option key={code} value={name}>
// //               {name}
// //             </option>
// //           ))}
// //         </select>

// //         <label>Date Format</label>
// //         <DatePicker
// //           selected={selectedDate}
// //           onChange={(date) => {
// //             setSelectedDate(date);
// //             if (date) {
// //               const formattedDate = moment(date).format("MM/DD/YYYY");
// //               setLocaleData((prev) => ({ ...prev, dateFormat: formattedDate }));
// //             }
// //           }}
// //           dateFormat="MM/dd/yyyy"
// //           placeholderText="Select Date"
// //           className="date-picker"
// //         />

// //         <label>Time Format</label>
// //         <select name="timeFormat" value={localeData.timeFormat} onChange={handleChange}>
// //           <option value="">Select Time Format</option>
// //           {options.timeFormats.map((format, i) => (
// //             <option key={i} value={format}>
// //               {timeFormatLabels[format] || format}
// //             </option>
// //           ))}
// //         </select>

// //         <label>Time Zone</label>
// //         <select name="timeZone" value={localeData.timeZone} onChange={handleChange}>
// //           <option value="">Select Time Zone</option>
// //           {options.timeZones.map((zone, i) => (
// //             <option key={i} value={zone.value}>
// //               {zone.label}
// //             </option>
// //           ))}
// //         </select>

// //         <div className="modal-buttons">
// //           <button className="cancel-btnlocale" onClick={onClose}>
// //             Cancel
// //           </button>
// //           <button className="save-btn" onClick={handleSave}>
// //             Save
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default LocaleInformation;
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "../styles/LocaleInformation.css";
// import countries from "i18n-iso-countries";
// import { languages } from "countries-list";
// import moment from "moment-timezone";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import Swal from "sweetalert2";
// import BASE_URL from "../../url";

// countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

// const LocaleInformation = ({ onClose, onSave }) => {
//   const [localeData, setLocaleData] = useState({
//     id: "",
//     language: "",
//     country: "",
//     dateFormat: "",
//     timeFormat: "",
//     timeZone: "",
//   });

//   const [options, setOptions] = useState({
//     languages: [],
//     countries: [],
//     dateFormats: [],
//     timeFormats: [],
//     timeZones: [],
//   });

//   const [selectedDate, setSelectedDate] = useState(null);

//   const getReadableTimeZone = (zone) => {
//     try {
//       const offset = moment.tz(zone).utcOffset();
//       const hours = Math.floor(offset / 60);
//       const minutes = offset % 60;
//       const sign = offset >= 0 ? "+" : "-";
//       const formattedOffset = `${sign}${String(Math.abs(hours)).padStart(2, "0")}:${String(
//         Math.abs(minutes)
//       ).padStart(2, "0")}`;
//       return `(UTC${formattedOffset}) ${zone.replace("_", " ")}`;
//     } catch {
//       return zone;
//     }
//   };

//   const fetchLocaleData = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.get(`${BASE_URL}/api/locale/options`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const { countries, languages, dateFormats, timeFormats } = response.data;
//       const allTimeZones = moment.tz.names();

//       const formattedTimeZones = allTimeZones
//         .map((zone) => ({
//           value: zone,
//           label: getReadableTimeZone(zone),
//         }))
//         .sort((a, b) => a.label.localeCompare(b.label));

//       setOptions({
//         countries,
//         languages,
//         dateFormats,
//         timeFormats: ["12h", "24h"],
//         timeZones: formattedTimeZones,
//       });
//     } catch (error) {
//       console.error("Error fetching locale data:", error);
//       const fallbackTimeZones = moment.tz.names().map((zone) => ({
//         value: zone,
//         label: getReadableTimeZone(zone),
//       }));

//       setOptions({
//         countries: [],
//         languages: [],
//         dateFormats: [],
//         timeFormats: ["12h", "24h"],
//         timeZones: fallbackTimeZones,
//       });
//     }
//   };

//   const fetchExistingLocale = async () => {
//     const token = localStorage.getItem("token");
//     const storedId = localStorage.getItem("id");

//     if (!storedId) return;

//     try {
//       const res = await axios.get(`${BASE_URL}/api/locale/${storedId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const fetchedData = res.data;

//       setLocaleData((prev) => ({
//         ...prev,
//         id: parseInt(storedId),
//         language: fetchedData.language || "",
//         country: fetchedData.country || "",
//         dateFormat: fetchedData.dateFormat || "",
//         timeFormat: fetchedData.timeFormat || "",
//         timeZone: fetchedData.time_zone || "",
//       }));

//       if (fetchedData.dateFormat) {
//         const parsedDate = moment(fetchedData.dateFormat, "MM/DD/YYYY").toDate();
//         setSelectedDate(parsedDate);
//       }
//     } catch (err) {
//       console.error("Error fetching existing locale", err);
//     }
//   };

//   useEffect(() => {
//     const fetchAllData = async () => {
//       await fetchLocaleData();
//       await fetchExistingLocale();
//     };

//     fetchAllData();
//   }, []);

//   useEffect(() => {
//     if (
//       localeData.timeZone &&
//       !options.timeZones.some((tz) => tz.value === localeData.timeZone)
//     ) {
//       const fallback = {
//         value: localeData.timeZone,
//         label: getReadableTimeZone(localeData.timeZone),
//       };
//       setOptions((prev) => ({
//         ...prev,
//         timeZones: [...prev.timeZones, fallback],
//       }));
//     }
//   }, [localeData.timeZone, options.timeZones]);

//   const handleSave = async () => {
//     const { language, country, dateFormat, timeFormat, timeZone, id } = localeData;

//     if (!language || !country || !dateFormat || !timeFormat || !timeZone) {
//       Swal.fire("Please fill out all fields before saving.");
//       return;
//     }

//     try {
//       const token = localStorage.getItem("token");

//       const payload = {
//         id,
//         language,
//         country,
//         date_format: dateFormat,
//         time_format: timeFormat,
//         time_zone: timeZone,
//       };

//       const response = await axios.put(`${BASE_URL}/api/locale/${id}`, payload, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       console.log("Locale saved:", response.data);
//       onSave(response.data);
//       await fetchLocaleData(); // 🔁 Refresh all dropdown options
//       onClose();
//     } catch (error) {
//       console.error("Error saving locale information:", error);
//       alert("Failed to save locale information. Please try again.");
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setLocaleData({ ...localeData, [name]: value });
//   };

//   const allLanguages = Object.entries(languages).map(([code, data]) => ({
//     code,
//     name: data.name,
//   }));

//   const allCountries = Object.entries(countries.getNames("en", { select: "official" })).map(
//     ([code, name]) => ({ code, name })
//   );

//   const timeFormatLabels = {
//     "12h": "12 Hours",
//     "24h": "24 Hours",
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <h3>Locale Information</h3>

//         <label>Language</label>
//         <select name="language" value={localeData.language || ""} onChange={handleChange}>
//           <option value="">Select Language</option>
//           {allLanguages.map(({ code, name }) => (
//             <option key={code} value={name}>
//               {name}
//             </option>
//           ))}
//         </select>

//         <label>Country Locale</label>
//         <select name="country" value={localeData.country || ""} onChange={handleChange}>
//           <option value="">Select Country</option>
//           {allCountries.map(({ code, name }) => (
//             <option key={code} value={name}>
//               {name}
//             </option>
//           ))}
//         </select>

//         <label>Date Format</label>
//         <DatePicker
//           selected={selectedDate}
//           onChange={(date) => {
//             setSelectedDate(date);
//             if (date) {
//               const formattedDate = moment(date).format("MM/DD/YYYY");
//               setLocaleData((prev) => ({ ...prev, dateFormat: formattedDate }));
//             }
//           }}
//           dateFormat="MM/dd/yyyy"
//           placeholderText="Select Date"
//           className="date-picker"
//         />

//         <label>Time Format</label>
//         <select name="timeFormat" value={localeData.timeFormat || ""} onChange={handleChange}>
//           <option value="">Select Time Format</option>
//           {options.timeFormats.map((format, i) => (
//             <option key={i} value={format}>
//               {timeFormatLabels[format] || format}
//             </option>
//           ))}
//         </select>

//         <label>Time Zone</label>
//         <select name="timeZone" value={localeData.timeZone || ""} onChange={handleChange}>
//           <option value="">Select Time Zone</option>
//           {options.timeZones.map((zone, i) => (
//             <option key={i} value={zone.value}>
//               {zone.label}
//             </option>
//           ))}
//         </select>

//         <div className="modal-buttons">
//           <button className="cancel-btnlocale" onClick={onClose}>
//             Cancel
//           </button>
//           <button className="save-btn" onClick={handleSave}>
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LocaleInformation;
