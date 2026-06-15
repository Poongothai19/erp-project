// import React, { useState, useEffect } from "react";
// import "../styles/InternalTimesheet.css";
// import axios from 'axios';
// import BASE_URL from '../../url';
// import Swal from 'sweetalert2';
// import { 
//   Clock, 
//   BarChart3, 
//   CheckCircle2, 
//   AlertCircle, 
//   Calendar, 
//   Download, 
//   Save, 
//   Send,
//   FileText,
//   History,
//   Info,
//   MoreVertical,
//   Plus,
//   ClipboardList,
//   User,
//   PieChart
// } from "lucide-react";

// // --- Sub-components ---

// const StatusDonut = ({ data }) => {
//   const total = Object.values(data).reduce((a, b) => a + b, 0);
//   let cumulativePercent = 0;

//   const getCoordinatesForPercent = (percent) => {
//     const x = Math.cos(2 * Math.PI * percent);
//     const y = Math.sin(2 * Math.PI * percent);
//     return [x, y];
//   };

//   const segments = [
//     { key: 'filled', color: '#10b981' },
//     { key: 'partial', color: '#f59e0b' },
//     { key: 'notFilled', color: '#ef4444' },
//     { key: 'leave', color: '#3b82f6' },
//   ];

//   return (
//     <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
//       {total === 0 ? (
//         <circle cx="0" cy="0" r="1" fill="#f1f5f9" />
//       ) : (
//         segments.map((s) => {
//           const percent = data[s.key] / total;
//           if (percent === 0) return null;
          
//           const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
//           cumulativePercent += percent;
//           const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
//           const largeArcFlag = percent > 0.5 ? 1 : 0;
          
//           const pathData = [
//             `M ${startX} ${startY}`,
//             `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
//             `L 0 0`,
//           ].join(' ');

//           return <path key={s.key} d={pathData} fill={s.color} />;
//         })
//       )}
//       <circle cx="0" cy="0" r="0.7" fill="white" />
//     </svg>
//   );
// };

// // --- Main Component ---

// const InternalTimesheet = ({ refreshTrigger }) => {
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [timesheetData, setTimesheetData] = useState([]);
//   const [editingCell, setEditingCell] = useState(null);
//   const [editValue, setEditValue] = useState("");
//   const [contextMenu, setContextMenu] = useState(null);
//   const [savedTimesheetId, setSavedTimesheetId] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [taskModal, setTaskModal] = useState(null);
//   const [taskInput, setTaskInput] = useState("");
//   const [dailyTasks, setDailyTasks] = useState({});
//   const [submittedWeeks, setSubmittedWeeks] = useState(new Set());
//   const [allowEditing, setAllowEditing] = useState(false);
//   const [hasExplicitPermission, setHasExplicitPermission] = useState(false);
//   const [permissionLoading, setPermissionLoading] = useState(true);
//   const [dataLoading, setDataLoading] = useState(true);
//   const [isTimesheetRequired, setIsTimesheetRequired] = useState(true);
//   const [submittingWeekIndex, setSubmittingWeekIndex] = useState(null);
//   const [validationError, setValidationError] = useState(null);

//   const months = [
//     "January", "February", "March", "April", "May", "June",
//     "July", "August", "September", "October", "November", "December"
//   ];

//   const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

//   const now = new Date();
//   const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
//   const isCurrentMonth = selectedMonth === utcToday.getUTCMonth() + 1 && selectedYear === utcToday.getUTCFullYear();

//   // ✅ Robust date parser to avoid timezone shifts (UTC/EST issues)
//   const parseDate = (dateInput) => {
//     if (!dateInput) return null;
//     if (dateInput instanceof Date) {
//       return new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate()));
//     }
//     if (typeof dateInput === 'string') {
//       if (dateInput.includes('T') || dateInput.endsWith('Z')) {
//         const d = new Date(dateInput);
//         return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
//       }
//       const parts = dateInput.split('-');
//       if (parts.length === 3) {
//         return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
//       }
//     }
//     const d = new Date(dateInput);
//     if (!isNaN(d.getTime())) {
//       return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
//     }
//     return null;
//   };

//   const formatDateKey = (date) => {
//     if (!date) return "";
//     const d = parseDate(date);
//     if (!d) return "";
//     return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
//   };

//   const isDateEditable = (date) => {
//     if (!date) return false;
//     const d = parseDate(date);
//     const localToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
//     if (d > localToday) return false;
//     if (!isCurrentMonth && !allowEditing) return false;
//     return true;
//   };

//   const isWeekSubmittable = (week) => {
//     if (!week || !week.fullDates) return false;
//     return week.fullDates.some((date, idx) => date && isDateEditable(date) && week.hours[idx] > 0);
//   };

//   const isWeekSubmitted = (weekIndex, week) => {
//     if (!week) week = timesheetData[weekIndex];
//     if (!week || !week.fullDates) return false;
//     const firstDate = week.fullDates.find(d => d !== null);
//     if (!firstDate) return false;
//     const monday = getMondayOfDate(firstDate);
//     return submittedWeeks.has(formatDateKey(monday));
//   };

//   const isCellEditable = (weekIndex, date) => {
//     if (!isDateEditable(date)) return false;
//     if (hasExplicitPermission) return allowEditing;
//     return !isWeekSubmitted(weekIndex, timesheetData[weekIndex]);
//   };

//   useEffect(() => {
//     const checkEditingPermission = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const response = await axios.get(`${BASE_URL}/api/timesheets/check-editing-permission`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (response.data.success) {
//           setAllowEditing(response.data.allowEditing);
//           setHasExplicitPermission(!!response.data.permission);
//           setIsTimesheetRequired(response.data.timesheetRequired !== false);
//         }
//       } catch (error) {
//         console.error("Error checking editing permission:", error);
//       } finally {
//         setPermissionLoading(false);
//       }
//     };
//     checkEditingPermission();
//     const interval = setInterval(checkEditingPermission, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     const loadData = async () => {
//       setDataLoading(true);
//       try {
//         generateTimesheetData();
//         await loadTimesheetData();
//       } catch (error) {
//         console.error("Error loading data:", error);
//       } finally {
//         setDataLoading(false);
//       }
//     };
//     loadData();
//     setValidationError(null);
//   }, [selectedMonth, selectedYear]);

//   useEffect(() => {
//     const handleClickOutside = () => setContextMenu(null);
//     window.addEventListener('click', handleClickOutside);
//     return () => window.removeEventListener('click', handleClickOutside);
//   }, []);

//   useEffect(() => {
//     if (refreshTrigger > 0) loadTimesheetData();
//   }, [refreshTrigger]);

//   async function loadTimesheetData() {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.get(`${BASE_URL}/api/timesheets`, {
//         headers: { Authorization: `Bearer ${token}` },
//         params: { month: selectedMonth, year: selectedYear }
//       });
//       if (response.data && response.data.length > 0) {
//         setSavedTimesheetId(response.data[0].id);
//         let allEntries = [];
//         const submittedWeeksSet = new Set();
//         for (const weekRecord of response.data) {
//           const detail = await axios.get(`${BASE_URL}/api/timesheets/${weekRecord.id}`, {
//             headers: { Authorization: `Bearer ${token}` }
//           });
//           if (detail.data.entries) allEntries = [...allEntries, ...detail.data.entries];
//           const status = (weekRecord.Status || '').trim().toUpperCase();
//           if (status !== 'DRAFT' && status !== 'REJECTED') {
//             const [y, m, d] = weekRecord.WeekStartDate.split('T')[0].split('-').map(Number);
//             submittedWeeksSet.add(formatDateKey(new Date(Date.UTC(y, m - 1, d))));
//           }
//         }
//         populateTimesheetFromEntries(allEntries);
//         loadDailyTasks(allEntries);
//         setSubmittedWeeks(submittedWeeksSet);
//       } else {
//         setSavedTimesheetId(null);
//         setSubmittedWeeks(new Set());
//       }
//     } catch (error) {
//       console.error("Error loading timesheet:", error);
//     }
//   }

//   function getMondayOfDate(date) {
//     const d = parseDate(date);
//     const day = d.getUTCDay();
//     const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
//     return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
//   }

//   function loadDailyTasks(entries) {
//     const tasks = {};
//     entries.forEach(entry => {
//       const d = parseDate(entry.date || entry.Date);
//       if (!d) return;
//       const key = formatDateKey(d);
//       const text = entry.description || entry.Description || entry.task || entry.Notes;
//       if (text && text.trim() !== '' && text !== 'General Work') tasks[key] = text;
//     });
//     setDailyTasks(tasks);
//   }

//   function populateTimesheetFromEntries(entries) {
//     const map = {};
//     entries.forEach(e => {
//       const key = formatDateKey(parseDate(e.date || e.Date));
//       map[key] = { hours: parseFloat(e.hours || e.Hours), type: (e.dayType || e.HourType || 'regular').toLowerCase() };
//     });
//     setTimesheetData(prev => prev.map(week => ({
//       ...week,
//       hours: week.fullDates.map((d, idx) => {
//         const entry = map[formatDateKey(d)];
//         if (!entry) return week.hours[idx];
//         // If it's a regular weekday and hours are 0, default to 8h (assumed not filled)
//         if (entry.hours === 0 && entry.type === 'regular' && d.getUTCDay() !== 0 && d.getUTCDay() !== 6) {
//           return 8;
//         }
//         return entry.hours;
//       }),
//       types: week.fullDates.map((d, idx) => map[formatDateKey(d)] ? map[formatDateKey(d)].type : week.types[idx])
//     })));
//   }

//   const generateTimesheetData = () => {
//     const first = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
//     const last = new Date(Date.UTC(selectedYear, selectedMonth, 0));
//     let cur = getMondayOfDate(first);
//     const weeks = [];
//     while (cur <= last) {
//       let week = { dates: [], fullDates: [], hours: [], dayNames: [], types: [] };
//       for (let i = 0; i < 7; i++) {
//         const copy = new Date(cur);
//         week.dates.push(copy.getUTCDate());
//         week.fullDates.push(copy);
//         week.dayNames.push(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][copy.getUTCDay()]);
//         const dayOfWeek = copy.getUTCDay();
//         week.hours.push((dayOfWeek === 0 || dayOfWeek === 6) ? 0 : 8);
//         week.types.push('regular');
//         cur.setUTCDate(cur.getUTCDate() + 1);
//       }
//       weeks.push(week);
//     }
//     setTimesheetData(weeks);
//   };

//   // --- Logic Helpers ---

//   const calculateWeeklyTotal = (week) => {
//     const total = week.hours.reduce((sum, hours) => sum + hours, 0);
//     return parseFloat(total.toFixed(2));
//   };

//   const calculateMonthlyTotal = () => {
//     let total = 0;
//     timesheetData.forEach(w => w.hours.forEach(h => total += h));
//     return total;
//   };

//   const calculateRegularHours = () => {
//     let total = 0;
//     timesheetData.forEach(w => w.fullDates.forEach((d, i) => {
//       if (w.types[i] === 'regular') total += w.hours[i];
//     }));
//     return total;
//   };

//   const calculateMonthlyOvertime = () => {
//     let total = 0;
//     timesheetData.forEach(w => w.hours.forEach(h => {
//       total += Math.max(0, h - 8);
//     }));
//     return total;
//   };
//   const calculateDaysWorked = () => {
//     let c = 0;
//     timesheetData.forEach(w => w.hours.forEach((h, i) => { if (h > 0 && w.dates[i] !== null) c++; }));
//     return c;
//   };
  
//   const getHourStatus = (hours, date, type) => {
//     if (date === null || type === 'empty') return "empty";
//     if (type === 'leave') return "leave";
//     if (type === 'holiday') return "holiday";
//     if (hours === 8) return "filled";
//     if (hours === 0) return "not-filled";
//     if (hours > 0 && hours < 8) return "partial";
//     return "not-filled";
//   };

//   const getCellDisplay = (hours, type) => {
//     if (type === 'leave') return 'Leave';
//     if (type === 'holiday') return 'Holiday';
//     return `${hours}h`;
//   };
  
//   const getStatusBreakdown = () => {
//     const stats = { filled: 0, partial: 0, notFilled: 0, leave: 0 };
//     timesheetData.forEach(w => w.fullDates.forEach((d, i) => {
//       if (!d || d.getUTCMonth() + 1 !== selectedMonth) return;
//       const type = w.types[i];
//       const hours = w.hours[i];
//       if (type === 'leave' || type === 'holiday') stats.leave++;
//       else if (hours === 8) stats.filled++;
//       else if (hours > 0) stats.partial++;
//       else stats.notFilled++;
//     }));
//     return stats;
//   };

//   const getWeekDateRange = (week) => {
//     const start = week.fullDates[0];
//     const end = week.fullDates[6];
//     const opt = { month: 'short', day: 'numeric' };
//     return `${start.toLocaleDateString('en-US', opt)} - ${end.toLocaleDateString('en-US', opt)}`;
//   };

//   const getDayTaskCount = (date) => dailyTasks[formatDateKey(date)] ? 1 : 0;

//   const formatHours = (hours) => {
//     const h = Math.floor(hours);
//     const m = Math.round((hours - h) * 60);
//     return `${h}h ${String(m).padStart(2, '0')}m`;
//   };

//   const openTaskModal = (wIdx, date) => {
//     const dateKey = formatDateKey(date);
//     setTaskInput(dailyTasks[dateKey] || "");
//     setTaskModal({ date, wIdx });
//     setValidationError(null);
//   };

//   // --- Interaction Handlers ---

//   const handleHourClick = (wIdx, dIdx, hours, date, type) => {
//     if (!date || type === 'leave' || type === 'holiday' || !isDateEditable(date) || !isCellEditable(wIdx, date)) return;
//     setEditingCell({ wIdx, dIdx });
//     setEditValue(hours.toString());
//   };

//   const handleHourChange = (e) => {
//     const v = e.target.value;
//     if (v === "" || (/^\d*\.?\d*$/.test(v) && parseFloat(v) <= 24)) setEditValue(v);
//   };

//   const handleHourSave = () => {
//     if (editingCell && editValue !== "") {
//       const { wIdx, dIdx } = editingCell;
//       const newData = [...timesheetData];
//       newData[wIdx].hours[dIdx] = parseFloat(editValue) || 0;
//       setTimesheetData(newData);
//     }
//     setEditingCell(null);
//     setEditValue("");
//   };

//   const handleRightClick = (e, wIdx, dIdx, date) => {
//     e.preventDefault();
//     if (!date || !isDateEditable(date) || !isCellEditable(wIdx, date)) return;
//     setContextMenu({ wIdx, dIdx, x: e.clientX, y: e.clientY });
//   };

//   const handleSetDayType = (type) => {
//     if (contextMenu) {
//       const { wIdx, dIdx } = contextMenu;
//       const newData = [...timesheetData];
//       newData[wIdx].types[dIdx] = type;
//       if (type === 'leave' || type === 'holiday') newData[wIdx].hours[dIdx] = 0;
//       else {
//         const d = newData[wIdx].fullDates[dIdx];
//         const isFuture = d > new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
//         newData[wIdx].hours[dIdx] = (isFuture || d.getUTCDay() === 0 || d.getUTCDay() === 6) ? 0 : 8;
//       }
//       setTimesheetData(newData);
//     }
//     setContextMenu(null);
//   };

//   const handleWeeklySubmit = async (idx) => {
//     if (isSaving || isSubmitting || submittingWeekIndex !== null) return;
//     setSubmittingWeekIndex(idx);
//     try {
//       const week = timesheetData[idx];
      
//       // Task Validation: Ensure all days with hours have a task
//       const missingTasks = week.fullDates.some((d, i) => week.hours[i] > 0 && !dailyTasks[formatDateKey(d)]);
//       if (missingTasks) {
//         Swal.fire({
//           title: 'Missing Tasks',
//           text: `Please enter tasks for all days with hours in Week ${idx + 1} before submitting.`,
//           icon: 'warning',
//           confirmButtonColor: '#10b981'
//         });
//         setSubmittingWeekIndex(null);
//         return;
//       }

//       const entries = week.fullDates.map((d, i) => ({
//         date: formatDateKey(d), hours: week.hours[i], dayType: week.types[i], task: dailyTasks[formatDateKey(d)]
//       }));
//       const token = localStorage.getItem('token');
//       await axios.post(`${BASE_URL}/api/timesheets/internal`, { weekStartDate: formatDateKey(week.fullDates[0]), entries }, { headers: { Authorization: `Bearer ${token}` } });
//       const refresh = await axios.get(`${BASE_URL}/api/timesheets`, { headers: { Authorization: `Bearer ${token}` }, params: { month: selectedMonth, year: selectedYear } });
//       const saved = refresh.data.find(w => formatDateKey(parseDate(w.WeekStartDate)) === formatDateKey(week.fullDates[0]));
//       if (saved) await axios.put(`${BASE_URL}/api/timesheets/${saved.id}/submit`, {}, { headers: { Authorization: `Bearer ${token}` } });
//       setSubmittedWeeks(p => new Set([...p, formatDateKey(week.fullDates[0])]));
//       Swal.fire({
//         title: 'Submitted!',
//         text: 'Week submitted successfully!',
//         icon: 'success',
//         timer: 2000,
//         showConfirmButton: false
//       });
//       loadTimesheetData();
//     } catch (e) { 
//       Swal.fire({
//         title: 'Error',
//         text: 'Submission failed. Please try again.',
//         icon: 'error',
//         confirmButtonColor: '#ef4444'
//       });
//     } finally { setSubmittingWeekIndex(null); }
//   };

//   const handleMonthlySubmit = async () => {
//     if (isSaving || isSubmitting) return;
    
//     const result = await Swal.fire({
//       title: 'Submit Monthly Timesheet?',
//       text: "Are you sure you want to submit all weeks of this month for approval?",
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonColor: '#10b981',
//       cancelButtonColor: '#94a3b8',
//       confirmButtonText: 'Yes, submit all'
//     });

//     if (!result.isConfirmed) return;

//     setIsSubmitting(true);
//     try {
//       const token = localStorage.getItem('token');
//       for (let i = 0; i < timesheetData.length; i++) {
//         const week = timesheetData[i];
//         if (isWeekSubmitted(i, week)) continue;
        
//         // Task Validation for each week
//         const missingTasks = week.fullDates.some((d, idx) => week.hours[idx] > 0 && !dailyTasks[formatDateKey(d)]);
//         if (missingTasks) {
//           Swal.fire({
//             title: 'Missing Tasks',
//             text: `Please enter tasks for all days with hours in Week ${i + 1} before submitting.`,
//             icon: 'warning',
//             confirmButtonColor: '#10b981'
//           });
//           setIsSubmitting(false);
//           return;
//         }

//         const entries = week.fullDates.map((d, idx) => ({
//           date: formatDateKey(d), hours: week.hours[idx], dayType: week.types[idx], task: dailyTasks[formatDateKey(d)]
//         }));
        
//         await axios.post(`${BASE_URL}/api/timesheets/internal`, { weekStartDate: formatDateKey(week.fullDates[0]), entries }, { headers: { Authorization: `Bearer ${token}` } });
//         const refresh = await axios.get(`${BASE_URL}/api/timesheets`, { headers: { Authorization: `Bearer ${token}` }, params: { month: selectedMonth, year: selectedYear } });
//         const saved = refresh.data.find(w => formatDateKey(parseDate(w.WeekStartDate)) === formatDateKey(week.fullDates[0]));
//         if (saved) await axios.put(`${BASE_URL}/api/timesheets/${saved.id}/submit`, {}, { headers: { Authorization: `Bearer ${token}` } });
//       }
//       Swal.fire({
//         title: 'Success!',
//         text: 'Monthly timesheet submitted successfully!',
//         icon: 'success',
//         timer: 2500,
//         showConfirmButton: false
//       });
//       loadTimesheetData();
//     } catch (e) { 
//       Swal.fire({
//         title: 'Error',
//         text: 'Monthly submission failed. Please try again.',
//         icon: 'error',
//         confirmButtonColor: '#ef4444'
//       });
//     } finally { setIsSubmitting(false); }
//   };

//   const handleSave = async () => {
//     setIsSaving(true);
//     try {
//       const token = localStorage.getItem('token');
//       for (const week of timesheetData) {
//         if (!isWeekSubmittable(week)) continue;
//         const entries = week.fullDates.map((d, i) => ({ date: formatDateKey(d), hours: week.hours[i], dayType: week.types[i], task: dailyTasks[formatDateKey(d)] || "General Work" }));
//         await axios.post(`${BASE_URL}/api/timesheets/internal`, { weekStartDate: formatDateKey(week.fullDates[0]), entries }, { headers: { Authorization: `Bearer ${token}` } });
//       }
//       Swal.fire({
//         title: 'Saved!',
//         text: 'Changes saved as draft.',
//         icon: 'success',
//         timer: 2000,
//         showConfirmButton: false
//       });
//       loadTimesheetData();
//     } catch (e) { 
//       Swal.fire({
//         title: 'Error',
//         text: 'Save failed. Please try again.',
//         icon: 'error',
//         confirmButtonColor: '#ef4444'
//       });
//     } finally { setIsSaving(false); }
//   };

//   const handleExport = async () => {
//     if (!savedTimesheetId) {
//       Swal.fire({
//         title: 'Save First',
//         text: 'Please save your changes before exporting.',
//         icon: 'info',
//         confirmButtonColor: '#3b82f6'
//       });
//       return;
//     }
//     try {
//       const token = localStorage.getItem('token');
//       const res = await axios.get(`${BASE_URL}/api/timesheets/${savedTimesheetId}/export`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
//       const url = window.URL.createObjectURL(new Blob([res.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `timesheet-${selectedMonth}-${selectedYear}.csv`;
//       link.click();
//     } catch (e) { 
//       Swal.fire({
//         title: 'Export Failed',
//         text: 'Could not export timesheet. Please try again.',
//         icon: 'error',
//         confirmButtonColor: '#ef4444'
//       });
//     }
//   };

//   // --- Render ---

//   const statsBreakdown = getStatusBreakdown();

//   if (!isTimesheetRequired) return (
//     <div className="timesheet-container">
//       <div className="timesheet-not-required-message" style={{ padding: '100px', textAlign: 'center', background: 'white', borderRadius: '24px' }}>
//         <ClipboardList size={64} color="#94a3b8" />
//         <h2 style={{ marginTop: '24px' }}>Timesheet Not Required</h2>
//       </div>
//     </div>
//   );

//   return (
//     <div className="timesheet-container">
//       {/* Header (Removed redundant title) */}
//       {/* Header Controls Removed */}

//       {/* Stats Grid */}
//       <div className="timesheet-stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon-wrapper teal"><Clock size={18} /></div>
//           <div className="stat-info">
//             <div className="stat-label">Total Hours</div>
//             <div className="stat-value">{timesheetData.length * 40}h 00m</div>
//             {/* <div className="stat-subtext">Monthly Target</div> */}
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon-wrapper green"><BarChart3 size={18} /></div>
//           <div className="stat-info">
//             <div className="stat-label">Regular Hours</div>
//             <div className="stat-value">{formatHours(calculateRegularHours())}</div>
//             {/* <div className="stat-subtext">80%</div> */}
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon-wrapper blue"><User size={18} /></div>
//           <div className="stat-info">
//             <div className="stat-label">Overtime</div>
//             <div className="stat-value">{formatHours(calculateMonthlyOvertime())}</div>
//             {/* <div className="stat-subtext">5% of total hours</div> */}
//           </div>
//         </div>
//         <div className="stat-card donut-card">
//           <div className="donut-chart-wrapper">
//             <StatusDonut data={statsBreakdown} />
//           </div>
//           <div className="donut-legend">
//             <div className="stat-label" style={{ marginBottom: '4px' }}>Status Summary</div>
//             <div className="legend-item"><div className="legend-label"><div className="legend-dot dot-filled"></div> Filled</div> <span>{formatHours(statsBreakdown.filled * 8)}</span></div>
//             <div className="legend-item"><div className="legend-label"><div className="legend-dot dot-partial"></div> Partial</div> <span>{formatHours(statsBreakdown.partial * 4)}</span></div>
//             <div className="legend-item"><div className="legend-label"><div className="legend-dot dot-notfilled"></div> Not Filled</div> <span>{formatHours(statsBreakdown.notFilled * 8)}</span></div>
//           </div>
//         </div>
//       </div>

//       {/* Control Bar */}
//       <div className="timesheet-control-bar" style={{ padding: '8px 16px', marginBottom: '16px' }}>
//         <div className="control-selectors" style={{ gap: '8px' }}>
//           <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="control-select" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
//             {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
//           </select>
//           <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="control-select" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
//             {years.map(y => <option key={y} value={y}>{y}</option>)}
//           </select>
//         </div>
//         <div className="control-notes" style={{ color: '#ef4444', fontSize: '0.7rem' }}>
//           Note: Editable dates: 1st to today ({utcToday.getUTCDate()}). Future dates are frozen.
//         </div>
//         <div className="control-actions" style={{ gap: '12px' }}>
//           <span style={{ fontSize: '0.7rem' }}><PieChart size={12} style={{ verticalAlign: 'middle' }} /> Click on any day to edit hours</span>
//           <span style={{ fontSize: '0.7rem' }}><Calendar size={12} style={{ verticalAlign: 'middle' }} /> Mark as Leave or Holiday</span>
//           <button className="btn-add-entry" onClick={handleSave} style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0' }}>
//             <Plus size={16} /> Save Draft
//           </button>
//           <button className="btn-add-entry" onClick={handleMonthlySubmit} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
//             <Send size={16} /> Submit Month for Approval
//           </button>
//         </div>
//       </div>

//       {/* Weekly Cards */}
//       {dataLoading ? <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div> : (
//         <div className="timesheet-list">
//           {timesheetData.map((week, wIdx) => {
//             const submitted = isWeekSubmitted(wIdx, week);
//             const isActiveWeek = week.fullDates.some(d => formatDateKey(d) === formatDateKey(utcToday));
//             return (
//               <div key={wIdx} className={`week-card ${isActiveWeek ? 'active-week' : ''}`}>
//                 <div className="week-info-aside">
//                   <div className="week-label"><Calendar size={16} /> Week {wIdx + 1}</div>
//                   <div className="week-dates">{getWeekDateRange(week)}</div>
//                   <div className="week-total-box">
//                     <div style={{ fontSize: '0.875rem', fontWeight: '800' }}>{calculateWeeklyTotal(week)}h</div>
//                     <div style={{ fontSize: '0.625rem', fontWeight: '600' }}>Total Hours</div>
//                   </div>
//                 </div>
//                 <div className="week-days-row">
//                   {week.fullDates.map((date, dIdx) => (
//                     <div key={dIdx} className="day-column">
//                       <div className="day-header">
//                         <div className="day-name">{week.dayNames[dIdx]} {date.getUTCDate()}</div>
//                       </div>
//                       {editingCell?.wIdx === wIdx && editingCell?.dIdx === dIdx ? (
//                         <input type="text" value={editValue} onChange={handleHourChange} onBlur={handleHourSave} autoFocus className="control-select" style={{ width: '40px' }} />
//                       ) : (
//                         <div 
//                           className={`day-hour-pill ${getHourStatus(week.hours[dIdx], date, week.types[dIdx])}`}
//                           onClick={() => handleHourClick(wIdx, dIdx, week.hours[dIdx], date, week.types[dIdx])}
//                           onContextMenu={e => handleRightClick(e, wIdx, dIdx, date)}
//                         >
//                           {getCellDisplay(week.hours[dIdx], week.types[dIdx])}
//                         </div>
//                       )}
//                       <div className="day-tasks-count" onClick={() => openTaskModal(wIdx, date)} style={{ cursor: 'pointer' }}>
//                         {getDayTaskCount(date) > 0 ? (
//                           <><CheckCircle2 size={12} style={{ color: '#10b981' }} /> Tasks</>
//                         ) : (
//                           <><ClipboardList size={12} /> Tasks</>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="week-status-aside">
//                   {submitted ? (
//                     <div className="status-badge submitted">
//                       <CheckCircle2 size={14} /> Submitted
//                     </div>
//                   ) : isWeekSubmittable(week) ? (
//                     <button 
//                       className="status-badge submittable" 
//                       onClick={() => handleWeeklySubmit(wIdx)}
//                       disabled={submittingWeekIndex === wIdx}
//                     >
//                       {submittingWeekIndex === wIdx ? '...' : <><Send size={14} /> Submit</>}
//                     </button>
//                   ) : (
//                     <div className="status-badge not-submitted">
//                       <Info size={14} /> Draft
//                     </div>
//                   )}
//                   {/* MoreVertical removed */}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* Footer Summary */}
//       {/* <div className="timesheet-footer-stats">
//         <div className="footer-stat-item">
//           <div className="footer-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><CheckCircle2 size={18} /></div>
//           <div className="footer-stat-info">
//             <div className="footer-stat-label">Approved Hours</div>
//             <div className="footer-stat-value">{formatHours(calculateMonthlyTotal())}</div>
//           </div>
//         </div>
//         <div className="footer-stat-item">
//           <div className="footer-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}><Clock size={18} /></div>
//           <div className="footer-stat-info">
//             <div className="footer-stat-label">Pending Hours</div>
//             <div className="footer-stat-value">4h 00m</div>
//           </div>
//         </div>
//         <div className="footer-stat-item">
//           <div className="footer-stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><History size={18} /></div>
//           <div className="footer-stat-info">
//             <div className="footer-stat-label">Overtime Hours</div>
//             <div className="footer-stat-value">{formatHours(calculateMonthlyOvertime())}</div>
//           </div>
//         </div>
//         <div className="footer-stat-item">
//           <div className="footer-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><Calendar size={20} /></div>
//           <div className="footer-stat-info">
//             <div className="footer-stat-label">Days in Month</div>
//             <div className="footer-stat-value">31</div>
//           </div>
//         </div>
//       </div> */}

//       {/* Task Modal (Keeping existing logic) */}
//       {taskModal && (
//         <div className="task-modal-overlay" onClick={() => setTaskModal(null)}>
//           <div className="task-modal" onClick={e => e.stopPropagation()}>
//             <h3>Task for {taskModal.date.getUTCDate()} {months[taskModal.date.getUTCMonth()]}</h3>
//             <textarea
//               value={taskInput} 
//               onChange={e => setTaskInput(e.target.value)}
//               placeholder="What did you work on today?"
//               rows="5" 
//               className="task-textarea"
//               readOnly={!isDateEditable(taskModal.date) || !isCellEditable(taskModal.wIdx, taskModal.date)}
//             />
//             <div className="task-modal-buttons">
//               {(isDateEditable(taskModal.date) && isCellEditable(taskModal.wIdx, taskModal.date)) ? (
//                 <>
//                   <button onClick={() => {
//                     const key = formatDateKey(taskModal.date);
//                     const newTasks = { ...dailyTasks };
//                     if (taskInput.trim()) newTasks[key] = taskInput.trim();
//                     else delete newTasks[key];
//                     setDailyTasks(newTasks);
//                     setTaskModal(null);
//                     setTaskInput("");
//                   }} className="task-btn-save">Save</button>
//                   <button onClick={() => setTaskModal(null)} className="task-btn-cancel">Cancel</button>
//                 </>
//               ) : (
//                 <button onClick={() => setTaskModal(null)} className="task-btn-cancel">Close</button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Context Menu */}
//       {contextMenu && (
//         <div className="context-menu-inline" style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }} onClick={e => e.stopPropagation()}>
//            <div className="context-menu-item-inline" onClick={() => handleSetDayType('regular')}>Regular Day</div>
//            <div className="context-menu-item-inline" onClick={() => handleSetDayType('leave')}>Leave</div>
//            <div className="context-menu-item-inline" onClick={() => handleSetDayType('holiday')}>Holiday</div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default InternalTimesheet;





import React, { useState, useEffect } from "react";
import "../styles/InternalTimesheet.css";
import axios from 'axios';
import BASE_URL from '../../url';
import Swal from 'sweetalert2';
import { 
  Clock, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Download, 
  Save, 
  Send,
  FileText,
  History,
  Info,
  MoreVertical,
  Plus,
  ClipboardList,
  User,
  PieChart
} from "lucide-react";

// --- Sub-components ---

const StatusDonut = ({ data }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const segments = [
    { key: 'filled', color: '#10b981' },
    { key: 'partial', color: '#f59e0b' },
    { key: 'notFilled', color: '#ef4444' },
    { key: 'leave', color: '#3b82f6' },
  ];

  return (
    <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
      {total === 0 ? (
        <circle cx="0" cy="0" r="1" fill="#f1f5f9" />
      ) : (
        segments.map((s) => {
          const percent = data[s.key] / total;
          if (percent === 0) return null;
          
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += percent;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = percent > 0.5 ? 1 : 0;
          
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ');

          return <path key={s.key} d={pathData} fill={s.color} />;
        })
      )}
      <circle cx="0" cy="0" r="0.7" fill="white" />
    </svg>
  );
};

// --- Main Component ---

const InternalTimesheet = ({ refreshTrigger }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [timesheetData, setTimesheetData] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [savedTimesheetId, setSavedTimesheetId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskModal, setTaskModal] = useState(null);
  const [taskInput, setTaskInput] = useState("");
  const [dailyTasks, setDailyTasks] = useState({});
  const [submittedWeeks, setSubmittedWeeks] = useState(new Set());
  const [allowEditing, setAllowEditing] = useState(false);
  const [hasExplicitPermission, setHasExplicitPermission] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [isTimesheetRequired, setIsTimesheetRequired] = useState(true);
  const [submittingWeekIndex, setSubmittingWeekIndex] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

  const now = new Date();
  const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const isCurrentMonth = selectedMonth === utcToday.getUTCMonth() + 1 && selectedYear === utcToday.getUTCFullYear();

  // ✅ Robust date parser to avoid timezone shifts (UTC/EST issues)
  const parseDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
      return new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate()));
    }
    if (typeof dateInput === 'string') {
      if (dateInput.includes('T') || dateInput.endsWith('Z')) {
        const d = new Date(dateInput);
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      }
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      }
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }
    return null;
  };

  const formatDateKey = (date) => {
    if (!date) return "";
    const d = parseDate(date);
    if (!d) return "";
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  };

  const isDateEditable = (date) => {
    if (!date) return false;
    const d = parseDate(date);
    const localToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (d > localToday) return false;

    // Rule 1: Current month is always editable up to today
    if (isCurrentMonth) return true;

    // Rule 2: Explicit permission from backend overrides everything
    if (allowEditing) return true;

    // Rule 3: Allow editing for the 5 previous weeks (Monday-aligned)
    const currentMonday = getMondayOfDate(localToday);
    const cutoffMonday = new Date(currentMonday);
    cutoffMonday.setUTCDate(cutoffMonday.getUTCDate() - 35); // Exactly 5 weeks back from this Monday
    
    if (d >= cutoffMonday) return true;

    return false;
  };

  const canSubmitMonth = () => {
    // Get last day of the selected month
    const lastDay = new Date(Date.UTC(selectedYear, selectedMonth, 0));
    let lastWorkingDay = new Date(lastDay);
    
    // Find the last weekday (Mon-Fri)
    while (lastWorkingDay.getUTCDay() === 0 || lastWorkingDay.getUTCDay() === 6) {
      lastWorkingDay.setUTCDate(lastWorkingDay.getUTCDate() - 1);
    }

    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const currentViewDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
    const currentActualDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // 1. If viewing a future month, disable
    if (currentViewDate > currentActualDate) return false;

    // 2. If viewing a past month, enable
    if (currentViewDate < currentActualDate) return true;

    // 3. If viewing current month, only enable if today is on or after the last working day
    return today >= lastWorkingDay;
  };

  const isWeekSubmittable = (week) => {
    if (!week || !week.fullDates) return false;
    return week.fullDates.some((date, idx) => date && isDateEditable(date) && week.hours[idx] > 0);
  };

  const isWeekSubmitted = (weekIndex, week) => {
    if (!week) week = timesheetData[weekIndex];
    if (!week || !week.fullDates) return false;
    const firstDate = week.fullDates.find(d => d !== null);
    if (!firstDate) return false;
    const monday = getMondayOfDate(firstDate);
    return submittedWeeks.has(formatDateKey(monday));
  };

  const isCellEditable = (weekIndex, date, dIdx = null) => {
    if (!isDateEditable(date)) return false;
    
    // Check if the cell is locked by Time Punch system
    if (dIdx !== null && timesheetData[weekIndex]?.locked?.[dIdx]) return false;

    if (hasExplicitPermission) return allowEditing;
    return !isWeekSubmitted(weekIndex, timesheetData[weekIndex]);
  };

  useEffect(() => {
    const checkEditingPermission = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}/api/timesheets/check-editing-permission`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setAllowEditing(response.data.allowEditing);
          setHasExplicitPermission(!!response.data.permission);
          setIsTimesheetRequired(response.data.timesheetRequired !== false);
        }
      } catch (error) {
        console.error("Error checking editing permission:", error);
      } finally {
        setPermissionLoading(false);
      }
    };
    checkEditingPermission();
    const interval = setInterval(checkEditingPermission, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        generateTimesheetData();
        await loadTimesheetData();
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
    setValidationError(null);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) loadTimesheetData();
  }, [refreshTrigger]);

  async function loadTimesheetData() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/timesheets`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month: selectedMonth, year: selectedYear }
      });
      if (response.data && response.data.length > 0) {
        setSavedTimesheetId(response.data[0].id);
        let allEntries = [];
        const submittedWeeksSet = new Set();
        for (const weekRecord of response.data) {
          const detail = await axios.get(`${BASE_URL}/api/timesheets/${weekRecord.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (detail.data.entries) allEntries = [...allEntries, ...detail.data.entries];
          const status = (weekRecord.Status || '').trim().toUpperCase();
          if (status !== 'DRAFT' && status !== 'REJECTED') {
            const [y, m, d] = weekRecord.WeekStartDate.split('T')[0].split('-').map(Number);
            submittedWeeksSet.add(formatDateKey(new Date(Date.UTC(y, m - 1, d))));
          }
        }
        populateTimesheetFromEntries(allEntries);
        loadDailyTasks(allEntries);
        setSubmittedWeeks(submittedWeeksSet);
      } else {
        setSavedTimesheetId(null);
        setSubmittedWeeks(new Set());
      }
    } catch (error) {
      console.error("Error loading timesheet:", error);
    }
  }

  function getMondayOfDate(date) {
    const d = parseDate(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
  }

  function loadDailyTasks(entries) {
    const tasks = {};
    entries.forEach(entry => {
      const d = parseDate(entry.date || entry.Date);
      if (!d) return;
      const key = formatDateKey(d);
      const text = entry.description || entry.Description || entry.task || entry.Notes;
      if (text && text.trim() !== '' && text !== 'General Work') tasks[key] = text;
    });
    setDailyTasks(tasks);
  }

  function populateTimesheetFromEntries(entries) {
    const map = {};
    entries.forEach(e => {
      const key = formatDateKey(parseDate(e.date || e.Date));
      const description = e.description || e.Description || e.Notes || "";
      map[key] = { 
        hours: parseFloat(e.hours || e.Hours), 
        type: (e.dayType || e.HourType || 'regular').toLowerCase(),
        isLocked: description.includes('Time Punch')
      };
    });
    setTimesheetData(prev => prev.map(week => ({
      ...week,
      hours: week.fullDates.map((d, idx) => {
        const entry = map[formatDateKey(d)];
        if (!entry) return week.hours[idx];
        // If it's a regular weekday and hours are 0, default to 8h (assumed not filled)
        if (entry.hours === 0 && entry.type === 'regular' && d.getUTCDay() !== 0 && d.getUTCDay() !== 6) {
          return 8;
        }
        return entry.hours;
      }),
      types: week.fullDates.map((d, idx) => map[formatDateKey(d)] ? map[formatDateKey(d)].type : week.types[idx]),
      locked: week.fullDates.map(d => {
        const entry = map[formatDateKey(d)];
        return entry?.isLocked || false;
      })
    })));
  }

  const generateTimesheetData = () => {
    const first = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
    const last = new Date(Date.UTC(selectedYear, selectedMonth, 0));
    let cur = getMondayOfDate(first);
    const weeks = [];
    while (cur <= last) {
      let week = { dates: [], fullDates: [], hours: [], dayNames: [], types: [], locked: [] };
      for (let i = 0; i < 7; i++) {
        const copy = new Date(cur);
        week.dates.push(copy.getUTCDate());
        week.fullDates.push(copy);
        week.dayNames.push(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][copy.getUTCDay()]);
        const dayOfWeek = copy.getUTCDay();
        week.hours.push((dayOfWeek === 0 || dayOfWeek === 6) ? 0 : 8);
        week.types.push('regular');
        week.locked = week.locked || [];
        week.locked.push(false);
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      weeks.push(week);
    }
    setTimesheetData(weeks);
  };

  // --- Logic Helpers ---

  const calculateWeeklyTotal = (week) => {
    const total = week.hours.reduce((sum, hours) => sum + hours, 0);
    return parseFloat(total.toFixed(2));
  };

  const calculateMonthlyTotal = () => {
    let total = 0;
    timesheetData.forEach(w => w.hours.forEach(h => total += h));
    return total;
  };

  const calculateRegularHours = () => {
    let total = 0;
    timesheetData.forEach(w => w.fullDates.forEach((d, i) => {
      if (w.types[i] === 'regular') total += w.hours[i];
    }));
    return total;
  };

  const calculateMonthlyOvertime = () => {
    let total = 0;
    timesheetData.forEach(w => w.hours.forEach(h => {
      total += Math.max(0, h - 8);
    }));
    return total;
  };
  const calculateDaysWorked = () => {
    let c = 0;
    timesheetData.forEach(w => w.hours.forEach((h, i) => { if (h > 0 && w.dates[i] !== null) c++; }));
    return c;
  };
  
  const getHourStatus = (hours, date, type) => {
    if (date === null || type === 'empty') return "empty";
    if (type === 'leave') return "leave";
    if (type === 'holiday') return "holiday";
    if (hours === 8) return "filled";
    if (hours === 0) return "not-filled";
    if (hours > 0 && hours < 8) return "partial";
    return "not-filled";
  };

  const getCellDisplay = (hours, type) => {
    if (type === 'leave') return 'Leave';
    if (type === 'holiday') return 'Holiday';
    return `${hours}h`;
  };
  
  const getStatusBreakdown = () => {
    const stats = { filled: 0, partial: 0, notFilled: 0, leave: 0 };
    timesheetData.forEach(w => w.fullDates.forEach((d, i) => {
      if (!d || d.getUTCMonth() + 1 !== selectedMonth) return;
      const type = w.types[i];
      const hours = w.hours[i];
      if (type === 'leave' || type === 'holiday') stats.leave++;
      else if (hours === 8) stats.filled++;
      else if (hours > 0) stats.partial++;
      else stats.notFilled++;
    }));
    return stats;
  };

  const getWeekDateRange = (week) => {
    const start = week.fullDates[0];
    const end = week.fullDates[6];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Using UTC components to prevent timezone shifts for EST/PST users
    const startStr = `${monthNames[start.getUTCMonth()]} ${start.getUTCDate()}`;
    const endStr = `${monthNames[end.getUTCMonth()]} ${end.getUTCDate()}`;
    
    return `${startStr} - ${endStr}`;
  };

  const getDayTaskCount = (date) => dailyTasks[formatDateKey(date)] ? 1 : 0;

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${String(m).padStart(2, '0')}m`;
  };

  const openTaskModal = (wIdx, date) => {
    const dateKey = formatDateKey(date);
    setTaskInput(dailyTasks[dateKey] || "");
    setTaskModal({ date, wIdx });
    setValidationError(null);
  };

  // --- Interaction Handlers ---

  const handleHourClick = (wIdx, dIdx, hours, date, type) => {
    if (!date || type === 'leave' || type === 'holiday' || !isDateEditable(date) || !isCellEditable(wIdx, date, dIdx)) return;
    setEditingCell({ wIdx, dIdx });
    setEditValue(hours.toString());
  };

  const handleHourChange = (e) => {
    const v = e.target.value;
    if (v === "" || (/^\d*\.?\d*$/.test(v) && parseFloat(v) <= 24)) setEditValue(v);
  };

  const handleHourSave = async () => {
    if (editingCell && editValue !== "") {
      const { wIdx, dIdx } = editingCell;
      const newData = [...timesheetData];
      newData[wIdx].hours[dIdx] = parseFloat(editValue) || 0;
      setTimesheetData(newData);
      await saveWeekData(wIdx);
    }
    setEditingCell(null);
    setEditValue("");
  };

  const handleRightClick = (e, wIdx, dIdx, date) => {
    e.preventDefault();
    if (!date || !isDateEditable(date) || !isCellEditable(wIdx, date, dIdx)) return;
    setContextMenu({ wIdx, dIdx, x: e.clientX, y: e.clientY });
  };

  const handleSetDayType = async (type) => {
    if (contextMenu) {
      const { wIdx, dIdx } = contextMenu;
      const newData = [...timesheetData];
      newData[wIdx].types[dIdx] = type;
      if (type === 'leave' || type === 'holiday') newData[wIdx].hours[dIdx] = 0;
      else {
        const d = newData[wIdx].fullDates[dIdx];
        const isFuture = d > new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        newData[wIdx].hours[dIdx] = (isFuture || d.getUTCDay() === 0 || d.getUTCDay() === 6) ? 0 : 8;
      }
      setTimesheetData(newData);
      await saveWeekData(wIdx);
    }
    setContextMenu(null);
  };

  const saveWeekData = async (wIdx, overrideTasks = null) => {
    try {
      const week = timesheetData[wIdx];
      if (!week) return false;

      const tasksToUse = overrideTasks || dailyTasks;
      const entries = week.fullDates.map((d, i) => {
        const dKey = formatDateKey(d);
        return {
          date: dKey,
          hours: week.hours[i],
          dayType: week.types[i] || 'regular',
          task: tasksToUse[dKey] || "General Work"
        };
      });
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BASE_URL}/api/timesheets/internal`, {
        weekStartDate: formatDateKey(week.fullDates[0]),
        entries,
        month: selectedMonth,
        year: selectedYear
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.success) {
        // Refresh data to get latest IDs and statuses
        await loadTimesheetData();
        return true;
      } else {
        throw new Error(response.data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to persist week data:", error);
      return false;
    }
  };

  const handleWeeklySubmit = async (idx) => {
    if (isSaving || isSubmitting || submittingWeekIndex !== null) return;
    setSubmittingWeekIndex(idx);
    try {
      const week = timesheetData[idx];
      
      // Task Validation: Ensure all days with hours have a task
      const missingTasks = week.fullDates.some((d, i) => week.hours[i] > 0 && !dailyTasks[formatDateKey(d)]);
      if (missingTasks) {
        Swal.fire({
          title: 'Missing Tasks',
          text: `Please enter tasks for all days with hours in Week ${idx + 1} before submitting.`,
          icon: 'warning',
          confirmButtonColor: '#10b981'
        });
        setSubmittingWeekIndex(null);
        return;
      }

      // Ensure latest data is saved first
      const saved = await saveWeekData(idx);
      if (!saved) {
        setSubmittingWeekIndex(null);
        return;
      }

      const token = localStorage.getItem('token');
      const refresh = await axios.get(`${BASE_URL}/api/timesheets`, { headers: { Authorization: `Bearer ${token}` }, params: { month: selectedMonth, year: selectedYear } });
      const savedRecord = refresh.data.find(w => formatDateKey(parseDate(w.WeekStartDate)) === formatDateKey(week.fullDates[0]));
      if (savedRecord) await axios.put(`${BASE_URL}/api/timesheets/${savedRecord.id}/submit`, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      setSubmittedWeeks(p => new Set([...p, formatDateKey(week.fullDates[0])]));
      Swal.fire({
        title: 'Submitted!',
        text: 'Week submitted successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      loadTimesheetData();
    } catch (e) { 
      Swal.fire({
        title: 'Error',
        text: 'Submission failed. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally { setSubmittingWeekIndex(null); }
  };

  const handleMonthlySubmit = async () => {
    if (isSaving || isSubmitting) return;
    
    const result = await Swal.fire({
      title: 'Submit Monthly Timesheet?',
      text: "Are you sure you want to submit all weeks of this month for approval?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, submit all'
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      for (let i = 0; i < timesheetData.length; i++) {
        const week = timesheetData[i];
        if (isWeekSubmitted(i, week)) continue;
        
        // Task Validation for each week
        const missingTasks = week.fullDates.some((d, idx) => week.hours[idx] > 0 && !dailyTasks[formatDateKey(d)]);
        if (missingTasks) {
          Swal.fire({
            title: 'Missing Tasks',
            text: `Please enter tasks for all days with hours in Week ${i + 1} before submitting.`,
            icon: 'warning',
            confirmButtonColor: '#10b981'
          });
          setIsSubmitting(false);
          return;
        }

        const entries = week.fullDates.map((d, idx) => ({
          date: formatDateKey(d), hours: week.hours[idx], dayType: week.types[idx], task: dailyTasks[formatDateKey(d)]
        }));
        
        await axios.post(`${BASE_URL}/api/timesheets/internal`, { weekStartDate: formatDateKey(week.fullDates[0]), entries }, { headers: { Authorization: `Bearer ${token}` } });
        const refresh = await axios.get(`${BASE_URL}/api/timesheets`, { headers: { Authorization: `Bearer ${token}` }, params: { month: selectedMonth, year: selectedYear } });
        const saved = refresh.data.find(w => formatDateKey(parseDate(w.WeekStartDate)) === formatDateKey(week.fullDates[0]));
        if (saved) await axios.put(`${BASE_URL}/api/timesheets/${saved.id}/submit`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      Swal.fire({
        title: 'Success!',
        text: 'Monthly timesheet submitted successfully!',
        icon: 'success',
        timer: 2500,
        showConfirmButton: false
      });
      loadTimesheetData();
    } catch (e) { 
      Swal.fire({
        title: 'Error',
        text: 'Monthly submission failed. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally { setIsSubmitting(false); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let savedAny = false;
      for (let i = 0; i < timesheetData.length; i++) {
        const week = timesheetData[i];
        if (!isWeekSubmittable(week) || isWeekSubmitted(i, week)) continue;
        
        const success = await saveWeekData(i);
        if (success) savedAny = true;
      }

      if (savedAny) {
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'Changes saved successfully' });
      }
    } catch (e) {
      console.error("Global save failed:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!savedTimesheetId) {
      Swal.fire({
        title: 'Save First',
        text: 'Please save your changes before exporting.',
        icon: 'info',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/timesheets/${savedTimesheetId}/export`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `timesheet-${selectedMonth}-${selectedYear}.csv`;
      link.click();
    } catch (e) { 
      Swal.fire({
        title: 'Export Failed',
        text: 'Could not export timesheet. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // --- Render ---

  const statsBreakdown = getStatusBreakdown();

  if (!isTimesheetRequired) return (
    <div className="timesheet-container">
      <div className="timesheet-not-required-message" style={{ padding: '100px', textAlign: 'center', background: 'white', borderRadius: '24px' }}>
        <ClipboardList size={64} color="#94a3b8" />
        <h2 style={{ marginTop: '24px' }}>Timesheet Not Required</h2>
      </div>
    </div>
  );

  return (
    <div className="timesheet-container">
      {/* Header (Removed redundant title) */}
      {/* Header Controls Removed */}

      {/* Stats Grid */}
      {/* <div className="timesheet-stats-grid"> */}
        {/* <div className="stat-card">
          <div className="stat-icon-wrapper teal"><Clock size={18} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Hours</div>
            <div className="stat-value">{timesheetData.length * 40}h 00m</div>
            
          </div>
        </div> */}
        {/* <div className="stat-card">
          <div className="stat-icon-wrapper green"><BarChart3 size={18} /></div>
          <div className="stat-info">
            <div className="stat-label">Regular Hours</div>
            <div className="stat-value">{formatHours(calculateRegularHours())}</div>
            
          </div>
        </div> */}
        {/* <div className="stat-card">
          <div className="stat-icon-wrapper blue"><User size={18} /></div>
          <div className="stat-info">
            <div className="stat-label">Overtime</div>
            <div className="stat-value">{formatHours(calculateMonthlyOvertime())}</div>
            
          </div>
        </div> */}
        {/* <div className="stat-card donut-card">
          <div className="donut-chart-wrapper">
            <StatusDonut data={statsBreakdown} />
          </div>
          <div className="donut-legend">
            <div className="stat-label" style={{ marginBottom: '4px' }}>Status Summary</div>
            <div className="legend-item"><div className="legend-label"><div className="legend-dot dot-filled"></div> Filled</div> <span>{formatHours(statsBreakdown.filled * 8)}</span></div>
            <div className="legend-item"><div className="legend-label"><div className="legend-dot dot-partial"></div> Partial</div> <span>{formatHours(statsBreakdown.partial * 4)}</span></div>
            <div className="legend-item"><div className="legend-label"><div className="legend-dot dot-notfilled"></div> Not Filled</div> <span>{formatHours(statsBreakdown.notFilled * 8)}</span></div>
          </div>
        </div> */}
      {/* </div> */}

      {/* Control Bar */}
      <div className="timesheet-control-bar" style={{ padding: '8px 16px', marginBottom: '16px' }}>
        <div className="control-selectors" style={{ gap: '8px' }}>
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="control-select" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="control-select" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="control-notes" style={{ color: '#ef4444', fontSize: '0.7rem' }}>
          Note: Editable: Last 5 weeks and Current Month. Future dates are frozen.
        </div>
        <div className="control-actions" style={{ gap: '12px' }}>
          <span style={{ fontSize: '0.7rem' }}><PieChart size={12} style={{ verticalAlign: 'middle' }} /> Click on any day to edit hours</span>
          <span style={{ fontSize: '0.7rem' }}><Calendar size={12} style={{ verticalAlign: 'middle' }} /> Mark as Leave or Holiday</span>
          <button 
            className="btn-add-entry" 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', minWidth: '120px' }}
          >
            {isSaving ? (
              <>
                <span className="spinner-inline" style={{ marginRight: '8px' }}></span>
                Saving...
              </>
            ) : (
              <>
                <Plus size={16} /> Save Draft
              </>
            )}
          </button>
          <button 
            className="btn-add-entry" 
            onClick={handleMonthlySubmit} 
            disabled={!canSubmitMonth() || isSubmitting}
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.8rem',
              opacity: (canSubmitMonth() && !isSubmitting) ? 1 : 0.6,
              cursor: (canSubmitMonth() && !isSubmitting) ? 'pointer' : 'not-allowed'
            }}
          >
            <Send size={16} /> Submit Month for Approval
          </button>
        </div>
      </div>

      {/* Weekly Cards */}
      {dataLoading ? <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div> : (
        <div className="timesheet-list">
          {timesheetData.map((week, wIdx) => {
            const submitted = isWeekSubmitted(wIdx, week);
            const isActiveWeek = week.fullDates.some(d => formatDateKey(d) === formatDateKey(utcToday));
            return (
              <div key={wIdx} className={`week-card ${isActiveWeek ? 'active-week' : ''}`}>
                <div className="week-info-aside">
                  <div className="week-label"><Calendar size={16} /> Week {wIdx + 1}</div>
                  <div className="week-dates">{getWeekDateRange(week)}</div>
                  <div className="week-total-box">
                    <div style={{ fontSize: '0.875rem', fontWeight: '800' }}>{calculateWeeklyTotal(week)}h</div>
                    <div style={{ fontSize: '0.625rem', fontWeight: '600' }}>Total Hours</div>
                  </div>
                </div>
                <div className="week-days-row">
                  {week.fullDates.map((date, dIdx) => (
                    <div key={dIdx} className="day-column">
                      <div className="day-header">
                        <div className="day-name">{week.dayNames[dIdx]} {date.getUTCDate()}</div>
                      </div>
                      {editingCell?.wIdx === wIdx && editingCell?.dIdx === dIdx ? (
                        <input type="text" value={editValue} onChange={handleHourChange} onBlur={handleHourSave} autoFocus className="control-select" style={{ width: '40px' }} />
                      ) : (
                        <div 
                          className={`day-hour-pill ${getHourStatus(week.hours[dIdx], date, week.types[dIdx])} ${week.locked?.[dIdx] ? 'locked-pill' : ''}`}
                          onClick={() => handleHourClick(wIdx, dIdx, week.hours[dIdx], date, week.types[dIdx])}
                          onContextMenu={e => handleRightClick(e, wIdx, dIdx, date)}
                          title={week.locked?.[dIdx] ? "Hours locked (Synced from Time Punch)" : ""}
                        >
                          {week.locked?.[dIdx] && <Clock size={10} style={{ marginRight: '4px' }} />}
                          {getCellDisplay(week.hours[dIdx], week.types[dIdx])}
                        </div>
                      )}
                      <div className="day-tasks-count" onClick={() => openTaskModal(wIdx, date)} style={{ cursor: 'pointer' }}>
                        {getDayTaskCount(date) > 0 ? (
                          <><CheckCircle2 size={12} style={{ color: '#10b981' }} /> Tasks</>
                        ) : (
                          <><ClipboardList size={12} /> Tasks</>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="week-status-aside">
                  {submitted ? (
                    <div className="status-badge submitted">
                      <CheckCircle2 size={14} /> Submitted
                    </div>
                  ) : isWeekSubmittable(week) ? (
                    <button 
                      className="status-badge submittable" 
                      onClick={() => handleWeeklySubmit(wIdx)}
                      disabled={submittingWeekIndex === wIdx}
                    >
                      {submittingWeekIndex === wIdx ? '...' : <><Send size={14} /> Submit</>}
                    </button>
                  ) : (
                    <div className="status-badge not-submitted">
                      <Info size={14} /> Draft
                    </div>
                  )}
                  {/* MoreVertical removed */}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Summary */}
      {/* <div className="timesheet-footer-stats">
        <div className="footer-stat-item">
          <div className="footer-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><CheckCircle2 size={18} /></div>
          <div className="footer-stat-info">
            <div className="footer-stat-label">Approved Hours</div>
            <div className="footer-stat-value">{formatHours(calculateMonthlyTotal())}</div>
          </div>
        </div>
        <div className="footer-stat-item">
          <div className="footer-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}><Clock size={18} /></div>
          <div className="footer-stat-info">
            <div className="footer-stat-label">Pending Hours</div>
            <div className="footer-stat-value">4h 00m</div>
          </div>
        </div>
        <div className="footer-stat-item">
          <div className="footer-stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><History size={18} /></div>
          <div className="footer-stat-info">
            <div className="footer-stat-label">Overtime Hours</div>
            <div className="footer-stat-value">{formatHours(calculateMonthlyOvertime())}</div>
          </div>
        </div>
        <div className="footer-stat-item">
          <div className="footer-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><Calendar size={20} /></div>
          <div className="footer-stat-info">
            <div className="footer-stat-label">Days in Month</div>
            <div className="footer-stat-value">31</div>
          </div>
        </div>
      </div> */}

      {/* Task Modal (Keeping existing logic) */}
      {taskModal && (
        <div className="task-modal-overlay" onClick={() => setTaskModal(null)}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <h3>Task for {taskModal.date.getUTCDate()} {months[taskModal.date.getUTCMonth()]}</h3>
            <textarea
              value={taskInput} 
              onChange={e => setTaskInput(e.target.value)}
              placeholder="What did you work on today?"
              rows="5" 
              className="task-textarea"
              readOnly={!isDateEditable(taskModal.date) || !isCellEditable(taskModal.wIdx, taskModal.date)}
            />
            <div className="task-modal-buttons">
              {(isDateEditable(taskModal.date) && isCellEditable(taskModal.wIdx, taskModal.date)) ? (
                <>
                  <button onClick={async () => {
                    const key = formatDateKey(taskModal.date);
                    const newTasks = { ...dailyTasks };
                    const trimmedTask = taskInput.trim();
                    if (trimmedTask) newTasks[key] = trimmedTask;
                    else delete newTasks[key];
                    
                    setDailyTasks(newTasks);
                    const wIdx = taskModal.wIdx;
                    setTaskModal(null);
                    setTaskInput("");

                    const success = await saveWeekData(wIdx, newTasks);
                    if (success) {
                      const Toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true
                      });
                      Toast.fire({ icon: 'success', title: 'Task saved successfully' });
                    }
                  }} className="task-btn-save">Save</button>
                  <button onClick={() => setTaskModal(null)} className="task-btn-cancel">Cancel</button>
                </>
              ) : (
                <button onClick={() => setTaskModal(null)} className="task-btn-cancel">Close</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div className="context-menu-inline" style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }} onClick={e => e.stopPropagation()}>
           <div className="context-menu-item-inline" onClick={() => handleSetDayType('regular')}>Regular Day</div>
           <div className="context-menu-item-inline" onClick={() => handleSetDayType('leave')}>Leave</div>
           <div className="context-menu-item-inline" onClick={() => handleSetDayType('holiday')}>Holiday</div>
        </div>
      )}
    </div>
  );
};

export default InternalTimesheet;