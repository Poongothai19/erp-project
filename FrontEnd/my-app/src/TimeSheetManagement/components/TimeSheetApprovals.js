// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { 
//   CheckCircle, 
//   XCircle, 
//   Clock, 
//   User, 
//   Mail, 
//   Phone, 
//   Calendar, 
//   Check,
//   X,
//   Filter,
//   Search,
//   MoreVertical,
//   ClipboardList,
//   ChevronRight,
//   ChevronLeft,
//   Building,
//   AlertCircle,
//   Trash2
// } from 'lucide-react';
// import BASE_URL from "../../url";
// import Swal from 'sweetalert2';
// import '../styles/ManagerDashboard.css';

// const TimeSheetApprovals = () => {
//     const navigate = useNavigate();
//     const [timesheets, setTimesheets] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [currentUserFullName, setCurrentUserFullName] = useState('');

//     const formatDate = (dateString) => {
//         if (!dateString) return 'N/A';
//         try {
//             const dateStr = String(dateString).split('T')[0];
//             const [y, m, d] = dateStr.split('-').map(Number);
//             return new Date(y, m - 1, d).toLocaleDateString();
//         } catch (error) {
//             return 'Invalid Date';
//         }
//     };
//     const [searchTerm, setSearchTerm] = useState('');
//     const [filterStatus, setFilterStatus] = useState('all');
//     const [selectedCompany, setSelectedCompany] = useState('all');
//     const [companies, setCompanies] = useState([]);

//     // Fetch timesheets for a specific company
//     const fetchTimesheetsByCompany = useCallback(async (companyId) => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await axios.get(`${BASE_URL}/api/timesheets/company/${companyId}`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (response.data.success) {
//                 return response.data.data.map(ts => ({ ...ts, selected: false }));
//             }
//             return [];
//         } catch (error) {
//             console.error(`Error fetching timesheets for company ${companyId}:`, error);
//             return [];
//         }
//     }, []);

//     // Fetch timesheets from ALL companies
//     const fetchAllTimesheets = useCallback(async (allCompanies) => {
//         try {
//             setLoading(true);
//             const results = await Promise.all(
//                 allCompanies.map(c => fetchTimesheetsByCompany(c.id))
//             );
//             const merged = results.flat();
//             setTimesheets(merged);
//         } catch (error) {
//             console.error('Error fetching all timesheets:', error);
//             Swal.fire({ title: 'Error', text: 'Failed to load timesheets', icon: 'error' });
//         } finally {
//             setLoading(false);
//         }
//     }, [fetchTimesheetsByCompany]);

//     // Fetch timesheets for a single selected company
//     const fetchTimesheets = useCallback(async (companyId) => {
//         try {
//             setLoading(true);
//             const data = await fetchTimesheetsByCompany(companyId);
//             setTimesheets(data);
//         } catch (error) {
//             console.error('Error fetching timesheets:', error);
//         } finally {
//             setLoading(false);
//         }
//     }, [fetchTimesheetsByCompany]);

//     // Fetch current user info to get the display name
//     const fetchCurrentUserInfo = useCallback(async () => {
//         try {
//             const token = localStorage.getItem('token');
//             if (!token) return;
//             const response = await axios.get(`${BASE_URL}/api/auth/current-user`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (response.data) {
//                 const { firstName, lastName } = response.data;
//                 const fullName = `${firstName || ''} ${lastName || ''}`.trim();
//                 setCurrentUserFullName(fullName || localStorage.getItem('username') || 'You');
//             }
//         } catch (error) {
//             console.error('Error fetching current user info:', error);
//             setCurrentUserFullName(localStorage.getItem('username') || 'You');
//         }
//     }, []);

//     // Fetch all companies for filtering
//     const fetchCompanies = useCallback(async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await axios.get(`${BASE_URL}/api/companies`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (response.data) {
//                 const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
//                 setCompanies(data);
//                 return data;
//             }
//             return [];
//         } catch (error) {
//             console.error('Error fetching companies:', error);
//             return [];
//         }
//     }, []);

//     // On mount: load all companies then load all timesheets
//     useEffect(() => {
//         const initialize = async () => {
//             fetchCurrentUserInfo();
//             const allCompanies = await fetchCompanies();
//             if (allCompanies.length > 0) {
//                 await fetchAllTimesheets(allCompanies);
//             } else {
//                 setLoading(false);
//             }
//         };
//         initialize();
//     }, [fetchCompanies, fetchAllTimesheets, fetchCurrentUserInfo]);

//     // When company dropdown changes
//     const handleCompanyChange = async (e) => {
//         const value = e.target.value;
//         setSelectedCompany(value);
//         if (value === 'all') {
//             await fetchAllTimesheets(companies);
//         } else {
//             await fetchTimesheets(parseInt(value));
//         }
//     };


//     // Handlers
//     const handleApprove = async (timesheetId, companyId) => {
//         const confirm = await Swal.fire({
//             title: 'Approve Timesheet?',
//             text: 'Are you sure you want to approve this timesheet?',
//             icon: 'question',
//             showCancelButton: true,
//             confirmButtonColor: '#10b981',
//             cancelButtonColor: '#6b7280',
//             confirmButtonText: 'Yes, Approve'
//         });

//         if (confirm.isConfirmed) {
//             try {
//                 const token = localStorage.getItem('token');
//                 const response = await axios.patch(
//                     `${BASE_URL}/api/timesheets/company/${companyId}/${timesheetId}/approve`,
//                     {},
//                     {
//                         headers: { 'Authorization': `Bearer ${token}` }
//                     }
//                 );

//                 if (response.data.success) {
//                     const approverToSet = currentUserFullName || localStorage.getItem('username') || 'You';
//                     setTimesheets(prev => prev.map(ts => 
//                         ts.Id === timesheetId 
//                         ? { ...ts, Status: 'Approved', ApproverName: approverToSet, status: 'Approved' } 
//                         : ts
//                     ));
//                     Swal.fire({
//                         title: 'Approved!',
//                         text: 'Timesheet has been approved.',
//                         icon: 'success',
//                         timer: 1500,
//                         showConfirmButton: false
//                     });
//                 }
//             } catch (error) {
//                 Swal.fire('Error', 'Failed to approve timesheet', 'error');
//             }
//         }
//     };

//     const handleReject = async (timesheetId, companyId) => {
//         const { value: reason } = await Swal.fire({
//             title: 'Reject Timesheet',
//             input: 'textarea',
//             inputLabel: 'Reason for rejection',
//             inputPlaceholder: 'Type your reason here...',
//             inputAttributes: {
//                 'aria-label': 'Type your reason here'
//             },
//             showCancelButton: true,
//             confirmButtonColor: '#ef4444',
//             confirmButtonText: 'Reject'
//         });

//         if (reason) {
//             try {
//                 const token = localStorage.getItem('token');
//                 const response = await axios.patch(
//                     `${BASE_URL}/api/timesheets/company/${companyId}/${timesheetId}/reject`,
//                     { reason },
//                     {
//                         headers: { 'Authorization': `Bearer ${token}` }
//                     }
//                 );

//                 if (response.data.success) {
//                     setTimesheets(prev => prev.map(ts => 
//                         ts.Id === timesheetId 
//                         ? { ...ts, Status: 'Rejected', status: 'Rejected' } 
//                         : ts
//                     ));
//                     Swal.fire({
//                         title: 'Rejected',
//                         text: 'Timesheet has been rejected.',
//                         icon: 'success',
//                         timer: 1500,
//                         showConfirmButton: false
//                     });
//                 }
//             } catch (error) {
//                 Swal.fire('Error', 'Failed to reject timesheet', 'error');
//             }
//         }
//     };

//     const handleSelectAll = (e) => {
//         const checked = e.target.checked;
//         setTimesheets(prev => prev.map(ts => ({ ...ts, selected: checked })));
//     };

//     const handleSelect = (id) => {
//         setTimesheets(prev => prev.map(ts => 
//             ts.Id === id ? { ...ts, selected: !ts.selected } : ts
//         ));
//     };

//     const handleDelete = async (timesheetId) => {
//         const confirm = await Swal.fire({
//             title: 'Delete Timesheet?',
//             text: 'This will permanently remove the timesheet and all its tasks. This action cannot be undone!',
//             icon: 'warning',
//             showCancelButton: true,
//             confirmButtonColor: '#ef4444',
//             cancelButtonColor: '#6b7280',
//             confirmButtonText: 'Yes, Delete'
//         });

//         if (confirm.isConfirmed) {
//             try {
//                 const token = localStorage.getItem('token');
//                 const response = await axios.delete(`${BASE_URL}/api/timesheets/${timesheetId}`, {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (response.data.success) {
//                     setTimesheets(prev => prev.filter(ts => ts.Id !== timesheetId));
//                     Swal.fire({
//                         title: 'Deleted!',
//                         text: 'Timesheet has been removed.',
//                         icon: 'success',
//                         timer: 1500,
//                         showConfirmButton: false
//                     });
//                 }
//             } catch (error) {
//                 console.error('Delete error:', error);
//                 Swal.fire('Error', 'Failed to delete timesheet', 'error');
//             }
//         }
//     };

//     const handleBulkApprove = async () => {
//         const selectedIds = timesheets.filter(ts => ts.selected).map(ts => ts.Id);
//         if (selectedIds.length === 0) return;

//         // Group by company because bulk API currently expects a companyId
//         // Wait, the bulk API in managerTimesheetController.js expects ONE companyId.
//         // If we have timesheets from multiple companies, we need to call it multiple times or modify it.
//         // For simplicity, let's group by company and call multiple times.
//         const byCompany = timesheets.filter(ts => ts.selected).reduce((acc, ts) => {
//             acc[ts.CompanyId] = acc[ts.CompanyId] || [];
//             acc[ts.CompanyId].push(ts.Id);
//             return acc;
//         }, {});

//         const confirm = await Swal.fire({
//             title: 'Bulk Approve?',
//             text: `Approve ${selectedIds.length} selected timesheets?`,
//             icon: 'question',
//             showCancelButton: true,
//             confirmButtonColor: '#10b981',
//             confirmButtonText: 'Yes, Approve All'
//         });

//         if (confirm.isConfirmed) {
//             try {
//                 const token = localStorage.getItem('token');
//                 setLoading(true);

//                 for (const companyId in byCompany) {
//                     await axios.post(
//                         `${BASE_URL}/api/timesheets/bulk/approve`,
//                         { timesheetIds: byCompany[companyId], companyId: parseInt(companyId) },
//                         { headers: { 'Authorization': `Bearer ${token}` } }
//                     );
//                 }

//                 // Refresh list
//                 if (selectedCompany === 'all') {
//                     await fetchAllTimesheets(companies);
//                 } else {
//                     await fetchTimesheets(parseInt(selectedCompany));
//                 }

//                 Swal.fire('Success', 'Selected timesheets approved', 'success');
//             } catch (error) {
//                 Swal.fire('Error', 'Bulk approval failed', 'error');
//             } finally {
//                 setLoading(false);
//             }
//         }
//     };

//     // Export timesheet to CSV
//     const exportTimesheetToCSV = (timesheet, entries) => {
//         const csvRows = [];

//         // Add header information
//         csvRows.push(`Timesheet Tasks - ${timesheet.EmployeeName}`);
//         csvRows.push(`Period:,${formatDate(timesheet.PeriodStart)} - ${formatDate(timesheet.PeriodEnd)}`);
//         csvRows.push(`Total Hours:,${timesheet.TotalHours || 0} hours`);
//         csvRows.push(`Status:,${timesheet.Status}`);
//         if (timesheet.Notes) {
//             csvRows.push(`Notes:,${timesheet.Notes}`);
//         }
//         csvRows.push(''); // Empty row

//         // Add table headers
//         csvRows.push('Date,Day,Hours,Type,Task');

//         // Add entries
//         const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//         entries.forEach(entry => {
//             const dateStr = String(entry.Date).split('T')[0];
//             const [y, m, d] = dateStr.split('-').map(Number);
//             const entryDate = new Date(y, m - 1, d);
//             const dayName = dayNames[entryDate.getDay()];
//             const task = (!entry.Task || entry.Task === 'General Work' ? 'Task cannot be updated' : entry.Task).replace(/,/g, ';'); // Replace commas in task

//             // Format date with tab character to force text format in Excel
//             const formattedDate = `="${formatDate(entry.Date)}"`;

//             csvRows.push(`${formattedDate},${dayName},${entry.Hours || 0},${entry.DayType || 'Regular'},${task}`);
//         });

//         // Create CSV content
//         const csvContent = csvRows.join('\n');
//         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//         const link = document.createElement('a');
//         const url = URL.createObjectURL(blob);

//         link.setAttribute('href', url);
//         link.setAttribute('download', `Timesheet_${timesheet.EmployeeName}_${formatDate(timesheet.PeriodStart).replace(/\//g, '-')}.csv`);
//         link.style.visibility = 'hidden';
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     };

//     const handleViewTasks = async (ts) => {
//         try {
//             const token = localStorage.getItem('token');
//             const timesheetId = ts.Id;

//             // Fetch the entries for this timesheet
//             const entriesResponse = await axios.get(
//                 `${BASE_URL}/api/timesheets/${timesheetId}/entries`,
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     }
//                 }
//             );

//             const entries = entriesResponse.data.entries || entriesResponse.data || [];

//             // Format entries for display
//             let entriesHtml = '<div style="max-height: 400px; overflow-y: auto; padding-bottom: 60px;">';

//             if (entries.length > 0) {
//                 entriesHtml += '<table style="width: 100%; border-collapse: collapse; text-align: left;">';
//                 entriesHtml += '<thead><tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">';
//                 entriesHtml += '<th style="padding: 12px;">Date</th>';
//                 entriesHtml += '<th style="padding: 12px;">Day</th>';
//                 entriesHtml += '<th style="padding: 12px;">Hours</th>';
//                 entriesHtml += '<th style="padding: 12px;">Type</th>';
//                 entriesHtml += '<th style="padding: 12px;">Task</th>';
//                 entriesHtml += '</tr></thead><tbody>';

//                 entries.forEach(entry => {
//                     const dateStr = String(entry.Date).split('T')[0];
//                     const [y, m, d] = dateStr.split('-').map(Number);
//                     const entryDate = new Date(y, m - 1, d);
//                     const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//                     const dayName = dayNames[entryDate.getDay()];

//                     // Logic for Leave and Holiday display
//                     const rawType = entry.DayType || entry.HourType || 'Regular';
//                     const isLeave = rawType.toLowerCase() === 'leave' || entry.IsLeave === true || entry.IsLeave === 1;
//                     const isHoliday = rawType.toLowerCase() === 'holiday' || entry.IsHoliday === true || entry.IsHoliday === 1;

//                     const displayHours = (isLeave || isHoliday) ? 0 : (entry.Hours || 0);
//                     let rawTask = entry.Task || entry.task || entry.Description || entry.description || entry.Notes;
//                     if (rawTask === 'General Work') rawTask = 'Task cannot be updated';
//                     const taskText = (isLeave || isHoliday) ? 'No task' : (rawTask || 'Task cannot be updated');

//                     entriesHtml += '<tr style="border-bottom: 1px solid #e5e7eb;">';
//                     entriesHtml += `<td style="padding: 10px;">${entryDate.toLocaleDateString()}</td>`;
//                     entriesHtml += `<td style="padding: 10px;">${dayName}</td>`;
//                     entriesHtml += `<td style="padding: 10px; font-weight: 600;">${displayHours} hrs</td>`;
//                     entriesHtml += `<td style="padding: 10px;">${rawType}</td>`;
//                     entriesHtml += `<td style="padding: 10px;" class="mts-task-hover-cell" data-full-task="${taskText.replace(/"/g, '&quot;')}"><span class="mts-task-cell">${taskText}</span></td>`;
//                     entriesHtml += '</tr>';
//                 });

//                 entriesHtml += '</tbody></table>';
//             } else {
//                 entriesHtml += '<p style="text-align: center; padding: 20px; color: #6b7280;">No entries found for this timesheet.</p>';
//             }

//             entriesHtml += '</div>';

//             Swal.fire({
//                 title: `Timesheet Tasks - ${ts.EmployeeName || ts.employeeName || 'Unknown'}`,
//                 html: `
//                     <div style="text-align: left; margin-bottom: 20px;">
//                         <p><strong>Period:</strong> ${formatDate(ts.PeriodStart || ts.periodStart)} - ${formatDate(ts.PeriodEnd || ts.periodEnd)}</p>
//                         <p><strong>Total Hours:</strong> ${ts.TotalHours || 0} hours</p>
//                         <p><strong>Status:</strong> <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #fff3cd; color: #856404;">${ts.Status || ts.status}</span></p>
//                         ${ts.Notes ? `<p><strong>Notes:</strong> ${ts.Notes}</p>` : ''}
//                     </div>
//                     ${entriesHtml}
//                 `,
//                 width: '900px',
//                 showConfirmButton: (ts.Status || ts.status) !== 'Approved',
//                 showDenyButton: (ts.Status || ts.status) !== 'Approved',
//                 showCancelButton: true,
//                 confirmButtonText: 'Approve',
//                 denyButtonText: 'Reject',
//                 cancelButtonText: 'Close',
//                 confirmButtonColor: '#10b981',
//                 denyButtonColor: '#ef4444',
//                 cancelButtonColor: '#6b7280',
//                 didOpen: () => {
//                     const container = Swal.getHtmlContainer();
//                     const hoverCells = container.querySelectorAll('.mts-task-hover-cell');

//                     const tooltip = document.createElement('div');
//                     tooltip.id = 'mts-floating-tooltip-app';
//                     tooltip.style.position = 'fixed';
//                     tooltip.style.display = 'none';
//                     tooltip.style.padding = '12px 16px';
//                     tooltip.style.background = '#0f172a';
//                     tooltip.style.color = '#ffffff';
//                     tooltip.style.borderRadius = '8px';
//                     tooltip.style.zIndex = '9999999';
//                     tooltip.style.pointerEvents = 'none';
//                     tooltip.style.maxWidth = '350px';
//                     tooltip.style.fontSize = '13px';
//                     tooltip.style.lineHeight = '1.5';
//                     tooltip.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.4)';
//                     tooltip.style.border = '1px solid rgba(255, 255, 255, 0.2)';
//                     document.body.appendChild(tooltip);

//                     hoverCells.forEach(cell => {
//                         cell.addEventListener('mousemove', (e) => {
//                             tooltip.innerText = cell.getAttribute('data-full-task');
//                             tooltip.style.display = 'block';
//                             tooltip.style.left = (e.clientX + 15) + 'px';
//                             tooltip.style.top = (e.clientY + 15) + 'px';

//                             const rect = tooltip.getBoundingClientRect();
//                             if (rect.right > window.innerWidth) {
//                                 tooltip.style.left = (e.clientX - rect.width - 15) + 'px';
//                             }
//                             if (rect.bottom > window.innerHeight) {
//                                 tooltip.style.top = (e.clientY - rect.height - 15) + 'px';
//                             }
//                         });
//                         cell.addEventListener('mouseleave', () => {
//                             tooltip.style.display = 'none';
//                         });
//                     });
//                 },
//                 willClose: () => {
//                     const tooltip = document.getElementById('mts-floating-tooltip-app');
//                     if (tooltip) tooltip.remove();
//                 }
//             }).then((result) => {
//                 if (result.isConfirmed) {
//                     handleApprove(ts.Id, ts.CompanyId);
//                 } else if (result.isDenied) {
//                     handleReject(ts.Id, ts.CompanyId);
//                 }
//             });
//         } catch (error) {
//             console.error('Error fetching timesheet tasks:', error);
//             Swal.fire('Error', 'Failed to load timesheet tasks', 'error');
//         }
//     };

//     // Filters
//     const filteredData = useMemo(() => {
//         return timesheets.filter(ts => {
//             const matchesSearch = 
//                 (ts.EmployeeName || ts.employeeName || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 (ts.EmployeeCode || ts.EmployeeId || '')?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 (ts.CompanyName || '')?.toLowerCase().includes(searchTerm.toLowerCase());

//             const matchesCompany = selectedCompany === 'all' || 
//                 String(ts.CompanyId) === String(selectedCompany) ||
//                 String(ts.EntityId) === String(selectedCompany);

//             // Allow display based on status filter
//             const matchesStatus = filterStatus === 'all' || 
//                 (ts.Status || ts.status)?.toLowerCase() === filterStatus.toLowerCase();

//             return matchesSearch && matchesCompany && matchesStatus;
//         });
//     }, [timesheets, searchTerm, selectedCompany, filterStatus]);


//     return (
//         <div className="mts-dashboard-container" style={{ padding: '20px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
//             {/* Header */}
//             <div className="mts-header" style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                         <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
//                             <ClipboardList className="text-teal-600" size={28} />
//                             Timesheet Approvals
//                         </h1>
//                         <p style={{ color: '#6b7280', marginTop: '0px' }}>Review and approve pending timesheets across all companies</p>
//                     </div>
//                 </div>

//                 {/* Filters */}
//                 <div style={{ display: 'flex', gap: '16px', marginTop: '5px', flexWrap: 'wrap' }}>
//                     <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
//                         <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
//                         <input 
//                             type="text" 
//                             placeholder="Search by employee, ID or company..." 
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                             style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
//                         />
//                     </div>

//                     <select 
//                         value={selectedCompany}
//                         onChange={handleCompanyChange}
//                         style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', minWidth: '180px' }}
//                     >
//                         <option value="all">All Companies</option>
//                         {companies.map(c => (
//                             <option key={c.id} value={c.id}>{c.name}</option>
//                         ))}
//                     </select>

//                     <select 
//                         value={filterStatus}
//                         onChange={(e) => setFilterStatus(e.target.value)}
//                         style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', minWidth: '150px' }}
//                     >
//                         <option value="all">All Statuses</option>
//                         <option value="Pending">Pending</option>
//                         <option value="Approved">Approved</option>
//                         <option value="Rejected">Rejected</option>
//                     </select>

//                     <button 
//                         onClick={handleBulkApprove}
//                         disabled={!timesheets.some(ts => ts.selected)}
//                         className="mts-bulk-approve-btn"
//                         style={{ 
//                             display: 'flex', 
//                             alignItems: 'center', 
//                             gap: '8px', 
//                             padding: '10px 20px', 
//                             borderRadius: '8px', 
//                             backgroundColor: timesheets.some(ts => ts.selected) ? '#10b981' : '#d1d5db',
//                             color: 'white', 
//                             border: 'none', 
//                             fontWeight: '600',
//                             cursor: timesheets.some(ts => ts.selected) ? 'pointer' : 'not-allowed'
//                         }}
//                     >
//                         <Check size={18} />
//                         Approve Selected ({timesheets.filter(ts => ts.selected).length})
//                     </button>
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="mts-employee-table" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
//                 <div className="mts-employee-table-table-header" style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1.5fr 1.2fr 1.5fr 1fr 1fr 1fr 1.2fr', padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>
//                     <div>
//                         <input type="checkbox" onChange={handleSelectAll} checked={timesheets.length > 0 && timesheets.every(ts => ts.selected)} />
//                     </div>
//                     <div>Employee & Id</div>
//                     <div>Email</div>
//                     <div>Phone</div>
//                     <div>Period</div>
//                     <div>Hours</div>
//                     <div>Status</div>
//                     <div>Approver</div>
//                     <div>Action</div>
//                 </div>

//                 {loading ? (
//                     <div style={{ padding: '40px', textAlign: 'center' }}>
//                         <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
//                         <p style={{ marginTop: '12px', color: '#6b7280' }}>Loading pending timesheets...</p>
//                     </div>
//                 ) : filteredData.length > 0 ? (
//                     <div className="mts-employee-table-table-rows">
//                         {filteredData.map(ts => (
//                             <div 
//                                 key={ts.Id} 
//                                 className="mts-employee-table-table-row" 
//                                 onClick={() => handleViewTasks(ts)}
//                                 style={{ 
//                                     display: 'grid', 
//                                     gridTemplateColumns: '50px 2fr 1.5fr 1.2fr 1.5fr 1fr 1fr 1fr 1.2fr', 
//                                     // padding: '16px', 
//                                     borderBottom: '1px solid #f3f4f6', 
//                                     alignItems: 'center',
//                                     cursor: 'pointer',
//                                     transition: 'background-color 0.2s'
//                                 }}
//                                 onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
//                                 onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
//                             >
//                                 <div onClick={(e) => e.stopPropagation()}>
//                                     <input type="checkbox" checked={ts.selected} onChange={() => handleSelect(ts.Id)} />
//                                 </div>
//                                 <div>
//                                     <div 
//                                         style={{ 
//                                             fontWeight: '600', 
//                                             color: '#10b981'
//                                         }}
//                                     >
//                                         {ts.EmployeeName || ts.employeeName || 'Unknown'}
//                                     </div>
//                                     <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {ts.EmployeeCode || ts.EmployeeId}</div>
//                                     <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>{ts.CompanyName}</div>
//                                 </div>
//                                 <div style={{ fontSize: '14px', color: '#4b5563', wordBreak: 'break-all' }}>
//                                     {ts.EmployeeEmail || ts.employeeEmail || ts.EmployeeEmail || 'N/A'}
//                                 </div>
//                                 <div style={{ fontSize: '14px', color: '#4b5563' }}>
//                                     {ts.EmployeePhone || ts.employeePhone || 'N/A'}
//                                 </div>
//                                 <div style={{ fontSize: '14px', color: '#4b5563' }}>
//                                     <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
//                                         <Calendar size={14} className="text-gray-400" />
//                                         <span>{formatDate(ts.PeriodStart || ts.periodStart)} - {formatDate(ts.PeriodEnd || ts.periodEnd)}</span>
//                                     </div>
//                                 </div>
//                                 <div>
//                                     <div style={{ fontWeight: '600', color: '#111827' }}>{ts.TotalHours}h</div>
//                                     {ts.OvertimeHours > 0 && <div style={{ fontSize: '11px', color: '#ef4444' }}>OT: {ts.OvertimeHours}h</div>}
//                                 </div>
//                                 <div>
//                                     <span style={{ 
//                                         padding: '4px 10px', 
//                                         borderRadius: '9999px', 
//                                         fontSize: '12px', 
//                                         fontWeight: '600',
//                                         backgroundColor: (ts.Status || ts.status) === 'Approved' ? '#ecfdf5' : (ts.Status || ts.status) === 'Rejected' ? '#fef2f2' : '#fef3c7',
//                                         color: (ts.Status || ts.status) === 'Approved' ? '#10b981' : (ts.Status || ts.status) === 'Rejected' ? '#ef4444' : '#d97706'
//                                     }}>
//                                         {ts.Status || ts.status}
//                                     </span>
//                                 </div>
//                                 <div style={{ fontSize: '13px', color: '#6b7280' }}>
//                                     {ts.ApproverName || ts.Approver || '—'}
//                                 </div>
//                                 <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
//                                     {(ts.Status || ts.status) === 'Pending' && (
//                                         <>
//                                             <button 
//                                                 onClick={(e) => { e.stopPropagation(); handleApprove(ts.Id, ts.CompanyId); }}
//                                                 style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#10b981', border: '1px solid #d1fae5', cursor: 'pointer' }}
//                                                 title="Approve"
//                                             >
//                                                 <Check size={16} />
//                                             </button>
//                                             <button 
//                                                 onClick={(e) => { e.stopPropagation(); handleReject(ts.Id, ts.CompanyId); }}
//                                                 style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', cursor: 'pointer' }}
//                                                 title="Reject"
//                                             >
//                                                 <X size={16} />
//                                             </button>
//                                         </>
//                                     )}
//                                     <button 
//                                         onClick={(e) => { e.stopPropagation(); handleDelete(ts.Id); }}
//                                         style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', cursor: 'pointer' }}
//                                         title="Delete"
//                                     >
//                                         <Trash2 size={16} />
//                                     </button>
//                                     {(ts.Status || ts.status) !== 'Pending' && (ts.Status || ts.status) !== 'Rejected' && (ts.Status || ts.status) !== 'Approved' && (
//                                         <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Processed</span>
//                                     )}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div style={{ padding: '60px', textAlign: 'center' }}>
//                         <div style={{ backgroundColor: '#f3f4f6', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
//                             <ClipboardList size={32} style={{ color: '#9ca3af' }} />
//                         </div>
//                         <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>No pending timesheets</h3>
//                         <p style={{ color: '#6b7280', marginTop: '4px' }}>Everything is up to date!</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default TimeSheetApprovals;



import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    CheckCircle,
    XCircle,
    Clock,
    User,
    Mail,
    Phone,
    Calendar,
    Check,
    X,
    Filter,
    Search,
    MoreVertical,
    ClipboardList,
    ChevronRight,
    ChevronLeft,
    Building,
    AlertCircle,
    Trash2
} from 'lucide-react';
import BASE_URL from "../../url";
import Swal from 'sweetalert2';
import '../styles/ManagerDashboard.css';

const TimeSheetApprovals = () => {
    const navigate = useNavigate();
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserFullName, setCurrentUserFullName] = useState('');
    const [currentUserEmployeeId, setCurrentUserEmployeeId] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const dateStr = String(dateString).split('T')[0];
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString();
        } catch (error) {
            return 'Invalid Date';
        }
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending'); // Changed from 'all' to 'pending'
    const [selectedCompany, setSelectedCompany] = useState('all');
    const [companies, setCompanies] = useState([]);

    // Fetch timesheets for a specific company
    const fetchTimesheetsByCompany = useCallback(async (companyId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/api/timesheets/company/${companyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                return response.data.data.map(ts => ({ ...ts, selected: false }));
            }
            return [];
        } catch (error) {
            console.error(`Error fetching timesheets for company ${companyId}:`, error);
            return [];
        }
    }, []);

    // Fetch timesheets from ALL companies
    const fetchAllTimesheets = useCallback(async (allCompanies) => {
        try {
            setLoading(true);
            const results = await Promise.all(
                allCompanies.map(c => fetchTimesheetsByCompany(c.id))
            );
            const merged = results.flat();
            setTimesheets(merged);
        } catch (error) {
            console.error('Error fetching all timesheets:', error);
            Swal.fire({ title: 'Error', text: 'Failed to load timesheets', icon: 'error' });
        } finally {
            setLoading(false);
        }
    }, [fetchTimesheetsByCompany]);

    // Fetch timesheets for a single selected company
    const fetchTimesheets = useCallback(async (companyId) => {
        try {
            setLoading(true);
            const data = await fetchTimesheetsByCompany(companyId);
            setTimesheets(data);
        } catch (error) {
            console.error('Error fetching timesheets:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchTimesheetsByCompany]);

    // Fetch current user info to get the display name
    const fetchCurrentUserInfo = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await axios.get(`${BASE_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data) {
                const { firstName, lastName, EmployeeId, role } = response.data;
                const fullName = `${firstName || ''} ${lastName || ''}`.trim();
                setCurrentUserFullName(fullName || localStorage.getItem('username') || 'You');
                setCurrentUserEmployeeId(EmployeeId);
                setCurrentUserRole(role);
            }
        } catch (error) {
            console.error('Error fetching current user info:', error);
            setCurrentUserFullName(localStorage.getItem('username') || 'You');
        }
    }, []);

    // Fetch all companies for filtering
    const fetchCompanies = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/api/companies`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data) {
                const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
                setCompanies(data);
                return data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching companies:', error);
            return [];
        }
    }, []);

    // On mount: load all companies then load all timesheets
    useEffect(() => {
        const initialize = async () => {
            fetchCurrentUserInfo();
            const allCompanies = await fetchCompanies();
            if (allCompanies.length > 0) {
                await fetchAllTimesheets(allCompanies);
            } else {
                setLoading(false);
            }
        };
        initialize();
    }, [fetchCompanies, fetchAllTimesheets, fetchCurrentUserInfo]);

    // When company dropdown changes
    const handleCompanyChange = async (e) => {
        const value = e.target.value;
        setSelectedCompany(value);
        if (value === 'all') {
            await fetchAllTimesheets(companies);
        } else {
            await fetchTimesheets(parseInt(value));
        }
    };


    // Handlers
    const handleApprove = async (timesheetId, companyId) => {
        const confirm = await Swal.fire({
            title: 'Approve Timesheet?',
            text: 'Are you sure you want to approve this timesheet?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Approve'
        });

        if (confirm.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.patch(
                    `${BASE_URL}/api/timesheets/company/${companyId}/${timesheetId}/approve`,
                    {},
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );

                if (response.data.success) {
                    const approverToSet = currentUserFullName || localStorage.getItem('username') || 'You';
                    setTimesheets(prev => prev.map(ts =>
                        ts.Id === timesheetId
                            ? { ...ts, Status: 'Approved', ApproverName: approverToSet, status: 'Approved' }
                            : ts
                    ));
                    Swal.fire({
                        title: 'Approved!',
                        text: 'Timesheet has been approved.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to approve timesheet', 'error');
            }
        }
    };

    const handleReject = async (timesheetId, companyId) => {
        const { value: reason } = await Swal.fire({
            title: 'Reject Timesheet',
            input: 'textarea',
            inputLabel: 'Reason for rejection',
            inputPlaceholder: 'Type your reason here...',
            inputAttributes: {
                'aria-label': 'Type your reason here'
            },
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Reject'
        });

        if (reason) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.patch(
                    `${BASE_URL}/api/timesheets/company/${companyId}/${timesheetId}/reject`,
                    { reason },
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );

                if (response.data.success) {
                    setTimesheets(prev => prev.map(ts =>
                        ts.Id === timesheetId
                            ? { ...ts, Status: 'Rejected', status: 'Rejected' }
                            : ts
                    ));
                    Swal.fire({
                        title: 'Rejected',
                        text: 'Timesheet has been rejected.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to reject timesheet', 'error');
            }
        }
    };

    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setTimesheets(prev => prev.map(ts => ({ ...ts, selected: checked })));
    };

    const handleSelect = (id) => {
        setTimesheets(prev => prev.map(ts =>
            ts.Id === id ? { ...ts, selected: !ts.selected } : ts
        ));
    };

    const handleDelete = async (timesheetId) => {
        const confirm = await Swal.fire({
            title: 'Delete Timesheet?',
            text: 'This will permanently remove the timesheet and all its tasks. This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete'
        });

        if (confirm.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.delete(`${BASE_URL}/api/timesheets/${timesheetId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data.success) {
                    setTimesheets(prev => prev.filter(ts => ts.Id !== timesheetId));
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Timesheet has been removed.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            } catch (error) {
                console.error('Delete error:', error);
                Swal.fire('Error', 'Failed to delete timesheet', 'error');
            }
        }
    };

    const handleBulkApprove = async () => {
        const selectedIds = timesheets.filter(ts => ts.selected).map(ts => ts.Id);
        if (selectedIds.length === 0) return;

        // Group by company because bulk API currently expects a companyId
        // Wait, the bulk API in managerTimesheetController.js expects ONE companyId.
        // If we have timesheets from multiple companies, we need to call it multiple times or modify it.
        // For simplicity, let's group by company and call multiple times.
        const byCompany = timesheets.filter(ts => ts.selected).reduce((acc, ts) => {
            acc[ts.CompanyId] = acc[ts.CompanyId] || [];
            acc[ts.CompanyId].push(ts.Id);
            return acc;
        }, {});

        const confirm = await Swal.fire({
            title: 'Bulk Approve?',
            text: `Approve ${selectedIds.length} selected timesheets?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Yes, Approve All'
        });

        if (confirm.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                setLoading(true);

                for (const companyId in byCompany) {
                    await axios.post(
                        `${BASE_URL}/api/timesheets/bulk/approve`,
                        { timesheetIds: byCompany[companyId], companyId: parseInt(companyId) },
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                }

                // Refresh list
                if (selectedCompany === 'all') {
                    await fetchAllTimesheets(companies);
                } else {
                    await fetchTimesheets(parseInt(selectedCompany));
                }

                Swal.fire('Success', 'Selected timesheets approved', 'success');
            } catch (error) {
                Swal.fire('Error', 'Bulk approval failed', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    // Export timesheet to CSV
    const exportTimesheetToCSV = (timesheet, entries) => {
        const csvRows = [];

        // Add header information
        csvRows.push(`Timesheet Tasks - ${timesheet.EmployeeName}`);
        csvRows.push(`Period:,${formatDate(timesheet.PeriodStart)} - ${formatDate(timesheet.PeriodEnd)}`);
        csvRows.push(`Total Hours:,${timesheet.TotalHours || 0} hours`);
        csvRows.push(`Status:,${timesheet.Status}`);
        if (timesheet.Notes) {
            csvRows.push(`Notes:,${timesheet.Notes}`);
        }
        csvRows.push(''); // Empty row

        // Add table headers
        csvRows.push('Date,Day,Hours,Type,Task');

        // Add entries
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        entries.forEach(entry => {
            const dateStr = String(entry.Date).split('T')[0];
            const [y, m, d] = dateStr.split('-').map(Number);
            const entryDate = new Date(y, m - 1, d);
            const dayName = dayNames[entryDate.getDay()];
            const task = (!entry.Task || entry.Task === 'General Work' ? 'Task cannot be updated' : entry.Task).replace(/,/g, ';'); // Replace commas in task

            // Format date with tab character to force text format in Excel
            const formattedDate = `="${formatDate(entry.Date)}"`;

            csvRows.push(`${formattedDate},${dayName},${entry.Hours || 0},${entry.DayType || 'Regular'},${task}`);
        });

        // Create CSV content
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `Timesheet_${timesheet.EmployeeName}_${formatDate(timesheet.PeriodStart).replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveEntries = async (ts, updatedEntries) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${BASE_URL}/api/timesheets/company/${ts.CompanyId}/${ts.Id}/entries`,
                { entries: updatedEntries },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                // Update local state for total hours and OT
                setTimesheets(prev => prev.map(item =>
                    item.Id === ts.Id ? {
                        ...item,
                        TotalHours: response.data.totalHours,
                        OvertimeHours: response.data.overtimeHours
                    } : item
                ));

                Swal.fire({
                    title: 'Saved!',
                    text: 'Timesheet entries updated successfully.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving timesheet entries:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to save entries', 'error');
            return false;
        }
    };

    const handleViewTasks = async (ts) => {
        try {
            const token = localStorage.getItem('token');
            const timesheetId = ts.Id;

            // Fetch the entries for this timesheet
            const entriesResponse = await axios.get(
                `${BASE_URL}/api/timesheets/${timesheetId}/entries`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const entries = entriesResponse.data.entries || entriesResponse.data || [];

            // Permission Check
            const isSupervisor = currentUserEmployeeId &&
                (parseInt(ts.SupervisorEmployeeId) === parseInt(currentUserEmployeeId) ||
                    parseInt(ts.BackupSupervisorEmployeeId) === parseInt(currentUserEmployeeId));
            const isAdmin = ['super_admin', 'admin', 'manager'].includes(currentUserRole?.toLowerCase());
            const canEditPermission = (isSupervisor || isAdmin) && (ts.Status || ts.status)?.toLowerCase() !== 'approved';

            const getTableHtml = (isEditMode) => {
                if (entries.length === 0) {
                    return '<p style="text-align: center; padding: 20px; color: #6b7280;">No entries found for this timesheet.</p>';
                }

                let html = '<table style="width: 100%; border-collapse: collapse; text-align: left;">';
                html += '<thead><tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">';
                html += '<th style="padding: 12px;">Date</th>';
                html += '<th style="padding: 12px;">Day</th>';
                html += `<th style="padding: 12px;">Hours${isEditMode ? ' (Edit)' : ''}</th>`;
                html += '<th style="padding: 12px;">Type</th>';
                html += `<th style="padding: 12px;">Task${isEditMode ? ' (Edit)' : ''}</th>`;
                html += '</tr></thead><tbody>';

                entries.forEach(entry => {
                    const dateStr = String(entry.Date).split('T')[0];
                    const [y, m, d] = dateStr.split('-').map(Number);
                    const entryDate = new Date(y, m - 1, d);
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayName = dayNames[entryDate.getDay()];

                    const rawType = entry.DayType || entry.HourType || 'Regular';
                    const isLeave = rawType.toLowerCase() === 'leave' || entry.IsLeave === true || entry.IsLeave === 1;
                    const isHoliday = rawType.toLowerCase() === 'holiday' || entry.IsHoliday === true || entry.IsHoliday === 1;

                    const displayHours = (isLeave || isHoliday) ? 0 : (entry.Hours || 0);
                    let rawTask = entry.Task || entry.task || entry.Description || entry.description || entry.Notes;
                    if (rawTask === 'General Work') rawTask = 'Task cannot be updated';
                    const taskText = (isLeave || isHoliday) ? 'No task' : (rawTask || 'Task cannot be updated');

                    html += `<tr style="border-bottom: 1px solid #e5e7eb;" class="mts-entry-row" data-id="${entry.Id || entry.TimesheetEntryId || entry.id}">`;
                    html += `<td style="padding: 10px;">${entryDate.toLocaleDateString()}</td>`;
                    html += `<td style="padding: 10px;">${dayName}</td>`;

                    if (isEditMode) {
                        html += `<td style="padding: 10px;"><input type="number" step="0.5" class="mts-hours-input" value="${displayHours}" style="width: 60px; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px;"></td>`;
                        html += `<td style="padding: 10px;">
                            <select class="mts-type-input" style="padding: 4px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <option value="REGULAR" ${rawType.toUpperCase() === 'REGULAR' ? 'selected' : ''}>REGULAR</option>
                                <option value="LEAVE" ${rawType.toUpperCase() === 'LEAVE' ? 'selected' : ''}>LEAVE</option>
                                <option value="HOLIDAY" ${rawType.toUpperCase() === 'HOLIDAY' ? 'selected' : ''}>HOLIDAY</option>
                                <option value="PTO" ${rawType.toUpperCase() === 'PTO' ? 'selected' : ''}>PTO</option>
                                <option value="SICK" ${rawType.toUpperCase() === 'SICK' ? 'selected' : ''}>SICK</option>
                            </select>
                        </td>`;
                        html += `<td style="padding: 10px;"><input type="text" class="mts-task-input" value="${taskText.replace(/"/g, '&quot;')}" style="width: 100%; min-width: 200px; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px;"></td>`;
                    } else {
                        html += `<td style="padding: 10px; font-weight: 600;">${displayHours} hrs</td>`;
                        html += `<td style="padding: 10px;">${rawType}</td>`;
                        html += `<td style="padding: 10px;" class="mts-task-hover-cell" data-full-task="${taskText.replace(/"/g, '&quot;')}"><span class="mts-task-cell">${taskText}</span></td>`;
                    }
                    html += '</tr>';
                });
                html += '</tbody></table>';
                return html;
            };

            Swal.fire({
                title: `Timesheet Tasks - ${ts.EmployeeName || ts.employeeName || 'Unknown'}`,
                html: `
                    <div style="text-align: left; margin-bottom: 20px;">
                        <p><strong>Period:</strong> ${formatDate(ts.PeriodStart || ts.periodStart)} - ${formatDate(ts.PeriodEnd || ts.periodEnd)}</p>
                        <p><strong>Total Hours:</strong> <span id="mts-modal-total-hours">${ts.TotalHours || 0}</span> hours</p>
                        <p><strong>Status:</strong> <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #fff3cd; color: #856404;">${ts.Status || ts.status}</span></p>
                        ${ts.Notes ? `<p><strong>Notes:</strong> ${ts.Notes}</p>` : ''}
                    </div>
                    <div id="mts-table-container" style="max-height: 400px; overflow-y: auto; padding-bottom: 20px;">
                        ${getTableHtml(false)}
                    </div>
                `,
                width: '950px',
                showConfirmButton: (ts.Status || ts.status)?.toLowerCase() === 'pending',
                showDenyButton: (ts.Status || ts.status)?.toLowerCase() === 'pending',
                showCancelButton: true,
                confirmButtonText: 'Approve',
                denyButtonText: 'Reject',
                cancelButtonText: 'Close',
                confirmButtonColor: '#10b981',
                denyButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                didOpen: () => {
                    const container = Swal.getHtmlContainer();
                    const actions = container.closest('.swal2-popup').querySelector('.swal2-actions');
                    let isEditMode = false;

                    if (canEditPermission) {
                        const editBtn = document.createElement('button');
                        editBtn.type = 'button';
                        editBtn.id = 'mts-edit-toggle-btn';
                        editBtn.innerText = 'Edit';
                        editBtn.className = 'swal2-confirm swal2-styled';
                        editBtn.style.backgroundColor = '#3b82f6';
                        editBtn.style.marginRight = '10px';

                        // Insert before Approve button (confirmButton)
                        const confirmBtn = actions.querySelector('.swal2-confirm');
                        actions.insertBefore(editBtn, confirmBtn);

                        editBtn.onclick = async () => {
                            if (!isEditMode) {
                                // Switch to Edit Mode
                                isEditMode = true;
                                editBtn.innerText = 'Save Changes';
                                editBtn.style.backgroundColor = '#10b981'; // Green for Save
                                const tableContainer = container.querySelector('#mts-table-container');
                                if (tableContainer) tableContainer.innerHTML = getTableHtml(true);
                            } else {
                                // Handle Save
                                const rows = Array.from(container.querySelectorAll('.mts-entry-row'));
                                const updatedEntries = rows.map(row => {
                                    const hoursInput = row.querySelector('.mts-hours-input');
                                    const taskInput = row.querySelector('.mts-task-input');
                                    const typeInput = row.querySelector('.mts-type-input');
                                    if (hoursInput && taskInput && typeInput) {
                                        return {
                                            id: row.dataset.id,
                                            hours: hoursInput.value,
                                            task: taskInput.value,
                                            hourType: typeInput.value
                                        };
                                    }
                                    return null;
                                }).filter(Boolean);

                                if (updatedEntries.length > 0) {
                                    editBtn.disabled = true;
                                    editBtn.innerText = 'Saving...';
                                    const success = await handleSaveEntries(ts, updatedEntries);
                                    if (success) {
                                        const newTotal = updatedEntries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0);
                                        const totalDisplay = container.querySelector('#mts-modal-total-hours');
                                        if (totalDisplay) totalDisplay.innerText = newTotal;

                                        // Update local entries array so switching back to read mode shows new values
                                        updatedEntries.forEach(upd => {
                                            const entry = entries.find(e => String(e.Id || e.TimesheetEntryId || e.id) === String(upd.id));
                                            if (entry) {
                                                entry.Hours = parseFloat(upd.hours);
                                                entry.Task = upd.task;
                                                entry.HourType = upd.hourType;
                                                entry.DayType = upd.hourType; // Sync both for safety
                                            }
                                        });

                                        // Switch back to Read-Only Mode
                                        isEditMode = false;
                                        editBtn.innerText = 'Edit';
                                        editBtn.style.backgroundColor = '#3b82f6';
                                        const tableContainer = container.querySelector('#mts-table-container');
                                        if (tableContainer) tableContainer.innerHTML = getTableHtml(false);
                                    }
                                    editBtn.disabled = false;
                                }
                            }
                        };
                    }

                    // Tooltip logic (needs to be reapplied when table changes)
                    const attachTooltips = () => {
                        const hoverCells = container.querySelectorAll('.mts-task-hover-cell');
                        let tooltip = document.getElementById('mts-floating-tooltip-app');
                        if (!tooltip) {
                            tooltip = document.createElement('div');
                            tooltip.id = 'mts-floating-tooltip-app';
                            tooltip.style.position = 'fixed';
                            tooltip.style.display = 'none';
                            tooltip.style.padding = '12px 16px';
                            tooltip.style.background = '#0f172a';
                            tooltip.style.color = '#ffffff';
                            tooltip.style.borderRadius = '8px';
                            tooltip.style.zIndex = '9999999';
                            tooltip.style.pointerEvents = 'none';
                            tooltip.style.maxWidth = '350px';
                            tooltip.style.fontSize = '13px';
                            tooltip.style.lineHeight = '1.5';
                            tooltip.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.4)';
                            tooltip.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                            document.body.appendChild(tooltip);
                        }

                        hoverCells.forEach(cell => {
                            cell.addEventListener('mousemove', (e) => {
                                tooltip.innerText = cell.getAttribute('data-full-task');
                                tooltip.style.display = 'block';
                                tooltip.style.left = (e.clientX + 15) + 'px';
                                tooltip.style.top = (e.clientY + 15) + 'px';

                                const rect = tooltip.getBoundingClientRect();
                                if (rect.right > window.innerWidth) {
                                    tooltip.style.left = (e.clientX - rect.width - 15) + 'px';
                                }
                                if (rect.bottom > window.innerHeight) {
                                    tooltip.style.top = (e.clientY - rect.height - 15) + 'px';
                                }
                            });
                            cell.addEventListener('mouseleave', () => {
                                tooltip.style.display = 'none';
                            });
                        });
                    };

                    attachTooltips();

                    // Observe table changes to reattach tooltips if needed
                    const observer = new MutationObserver(attachTooltips);
                    const tableContainer = container.querySelector('#mts-table-container');
                    if (tableContainer) observer.observe(tableContainer, { childList: true });
                },
                willClose: () => {
                    const tooltip = document.getElementById('mts-floating-tooltip-app');
                    if (tooltip) tooltip.remove();
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    handleApprove(ts.Id, ts.CompanyId);
                } else if (result.isDenied) {
                    handleReject(ts.Id, ts.CompanyId);
                }
            });
        } catch (error) {
            console.error('Error fetching timesheet tasks:', error);
            Swal.fire('Error', 'Failed to load timesheet tasks', 'error');
        }
    };

    // Filters
    const filteredData = useMemo(() => {
        return timesheets.filter(ts => {
            const matchesSearch =
                (ts.EmployeeName || ts.employeeName || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ts.EmployeeCode || ts.EmployeeId || '')?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ts.CompanyName || '')?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCompany = selectedCompany === 'all' ||
                String(ts.CompanyId) === String(selectedCompany) ||
                String(ts.EntityId) === String(selectedCompany);

            // Allow display based on status filter
            const matchesStatus = filterStatus === 'all' ||
                (ts.Status || ts.status)?.toLowerCase() === filterStatus.toLowerCase();

            return matchesSearch && matchesCompany && matchesStatus;
        });
    }, [timesheets, searchTerm, selectedCompany, filterStatus]);


    return (
        <div className="mts-dashboard-container" style={{ padding: '20px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            {/* Header */}
            <div className="mts-header" style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ClipboardList className="text-teal-600" size={28} />
                            Timesheet Approvals
                        </h1>
                        <p style={{ color: '#6b7280', marginTop: '0px' }}>Review and approve pending timesheets across all companies</p>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '5px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search by employee, ID or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                        />
                    </div>

                    <select
                        value={selectedCompany}
                        onChange={handleCompanyChange}
                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', minWidth: '180px' }}
                    >
                        <option value="all">All Companies</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', minWidth: '150px' }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <button
                        onClick={handleBulkApprove}
                        disabled={!timesheets.some(ts => ts.selected)}
                        className="mts-bulk-approve-btn"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            backgroundColor: timesheets.some(ts => ts.selected) ? '#10b981' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            fontWeight: '600',
                            cursor: timesheets.some(ts => ts.selected) ? 'pointer' : 'not-allowed'
                        }}
                    >
                        <Check size={18} />
                        Approve Selected ({timesheets.filter(ts => ts.selected).length})
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="mts-employee-table" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div className="mts-employee-table-table-header" style={{ display: 'grid', gridTemplateColumns: '50px 1.5fr 2.5fr 1.2fr 1.6fr 0.7fr 1fr 1.2fr 1.2fr', padding: '12px 24px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', gap: '12px', alignItems: 'center' }}>
                    <div>
                        <input type="checkbox" onChange={handleSelectAll} checked={timesheets.length > 0 && timesheets.every(ts => ts.selected)} />
                    </div>
                    <div>Employee and Id</div>
                    <div>Email</div>
                    <div>Phone</div>
                    <div>Period</div>
                    <div>Hours</div>
                    <div>Status</div>
                    <div>Approver</div>
                    <div>Action</div>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: '12px', color: '#6b7280' }}>Loading pending timesheets...</p>
                    </div>
                ) : filteredData.length > 0 ? (
                    <div className="mts-employee-table-table-rows">
                        {filteredData.map(ts => (
                            <div
                                key={ts.Id}
                                className="mts-employee-table-table-row"
                                onClick={() => handleViewTasks(ts)}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '50px 1.5fr 2.5fr 1.2fr 1.6fr 0.7fr 1fr 1.2fr 1.2fr',
                                    padding: '12px 24px',
                                    borderBottom: '1px solid #f3f4f6',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    gap: '12px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" checked={ts.selected} onChange={() => handleSelect(ts.Id)} />
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontWeight: '600',
                                            color: '#10b981'
                                        }}
                                    >
                                        {ts.EmployeeName || ts.employeeName || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {ts.EmployeeCode || ts.EmployeeId}</div>
                                    <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>{ts.CompanyName}</div>
                                </div>
                                <div style={{ fontSize: '14px', color: '#4b5563', wordBreak: 'break-word' }}>
                                    {ts.EmployeeEmail || ts.employeeEmail || ts.EmployeeEmail || 'N/A'}
                                </div>
                                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                                    {ts.EmployeePhone || ts.employeePhone || 'N/A'}
                                </div>
                                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={14} className="text-gray-400" />
                                        <span>{formatDate(ts.PeriodStart || ts.periodStart)} - {formatDate(ts.PeriodEnd || ts.periodEnd)}</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#111827' }}>{ts.TotalHours}h</div>
                                    {ts.OvertimeHours > 0 && <div style={{ fontSize: '11px', color: '#ef4444' }}>OT: {ts.OvertimeHours}h</div>}
                                </div>
                                <div>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '9999px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        backgroundColor: (ts.Status || ts.status) === 'Approved' ? '#ecfdf5' : (ts.Status || ts.status) === 'Rejected' ? '#fef2f2' : '#fef3c7',
                                        color: (ts.Status || ts.status) === 'Approved' ? '#10b981' : (ts.Status || ts.status) === 'Rejected' ? '#ef4444' : '#d97706'
                                    }}>
                                        {ts.Status || ts.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                    {ts.ApproverName && ts.ApproverName !== '—' ? (
                                        <span style={{ color: '#374151', fontWeight: '500' }}>{ts.ApproverName}</span>
                                    ) : ts.Approver && ts.Approver !== '—' ? (
                                        <span style={{ color: '#374151', fontWeight: '500' }}>{ts.Approver}</span>
                                    ) : (
                                        <span style={{
                                            color: (ts.Status || ts.status) === 'Pending' ? '#9ca3af' : '#374151',
                                            fontStyle: (ts.Status || ts.status) === 'Pending' ? 'italic' : 'normal',
                                            opacity: (ts.Status || ts.status) === 'Pending' ? 0.7 : 1,
                                            fontWeight: (ts.Status || ts.status) === 'Pending' ? 'normal' : '500'
                                        }}>
                                            {ts.PrimarySupervisorName || '—'}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                                    {(ts.Status || ts.status) === 'Pending' && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleApprove(ts.Id, ts.CompanyId); }}
                                                style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#10b981', border: '1px solid #d1fae5', cursor: 'pointer' }}
                                                title="Approve"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleReject(ts.Id, ts.CompanyId); }}
                                                style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', cursor: 'pointer' }}
                                                title="Reject"
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(ts.Id); }}
                                        style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', cursor: 'pointer' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    {(ts.Status || ts.status) !== 'Pending' && (ts.Status || ts.status) !== 'Rejected' && (ts.Status || ts.status) !== 'Approved' && (
                                        <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Processed</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ backgroundColor: '#f3f4f6', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <ClipboardList size={32} style={{ color: '#9ca3af' }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>No pending timesheets</h3>
                        <p style={{ color: '#6b7280', marginTop: '4px' }}>Everything is up to date!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeSheetApprovals;