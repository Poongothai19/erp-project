import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import BASE_URL from '../../url';
import '../styles/erprecruitment.css'; // Assume we reuse some styles
import { Calendar, Search, Users, Download, Filter } from 'lucide-react';

const RecruiterPerformanceReport = () => {
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('All Time');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recruitersList, setRecruitersList] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState('');
  const [error, setError] = useState('');

  // Fetch all recruiters to populate the dropdown
  useEffect(() => {
    const fetchRecruiters = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/api/recruitment/recruiters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecruitersList(res.data || []);
      } catch (err) {
        console.error("Failed to fetch recruiters list", err);
      }
    };
    fetchRecruiters();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      let url = `${BASE_URL}/api/recruitment/roles/performance-report?timeframe=${timeframe}`;
      
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      if (selectedRecruiter) {
        url += `&recruiter=${selectedRecruiter}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.success) {
        setReportData(res.data.data);
      } else {
        setReportData([]);
      }
    } catch (err) {
      console.error("Failed to fetch performance report", err);
      setError('Failed to fetch performance report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line
  }, [timeframe, selectedRecruiter, startDate, endDate]);

  const handleClearFilters = () => {
    setTimeframe('All Time');
    setStartDate('');
    setEndDate('');
    setSelectedRecruiter('');
  };

  // Calculate totals for summary cards
  const summaryTotals = reportData.reduce((acc, row) => {
    acc.totalProfiles += row.totalProfiles || 0;
    acc.screened += row.screenedCount || 0;
    acc.rejected += row.rejectedCount || 0;
    acc.clientSubmit += row.clientSubmitCount || 0;
    acc.l1 += row.l1Count || 0;
    acc.l2 += row.l2Count || 0;
    acc.closure += row.closureCount || 0;
    return acc;
  }, { totalProfiles: 0, screened: 0, rejected: 0, clientSubmit: 0, l1: 0, l2: 0, closure: 0 });

  const formatTimePeriod = (period, tf) => {
    if (!period) return 'N/A';
    if (tf === 'Daily') {
      try {
        const d = new Date(period);
        return d.toLocaleDateString(); // e.g., 10/2/2025
      } catch (e) {
        return period;
      }
    }
    if (tf === 'Weekly') {
      return `Week ${period}`;
    }
    return period; // Monthly already returns 'yyyy-MM'
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) return;

    // Prepare data for export
    const exportData = reportData.map(row => {
      const exportRow = {};
      if (timeframe !== 'All Time') {
        exportRow['Time Period'] = formatTimePeriod(row.timePeriod, timeframe);
      }
      exportRow['Recruiter'] = row.recruiterName;
      exportRow['Total Profiles'] = row.totalProfiles || 0;
      exportRow['Screened'] = row.screenedCount || 0;
      exportRow['Client Submit'] = row.clientSubmitCount || 0;
      exportRow['L1 Interview'] = row.l1Count || 0;
      exportRow['L2 Interview'] = row.l2Count || 0;
      exportRow['Closure/Hired'] = row.closureCount || 0;
      exportRow['Rejected'] = row.rejectedCount || 0;
      
      return exportRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Report");
    
    XLSX.writeFile(workbook, `Recruiter_Performance_${timeframe}.xlsx`);
  };

  return (
    <div className="recruiter-performance-report" style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a6f66ff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={28} />
          Recruiter Performance Report
        </h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleExportExcel}
            disabled={isLoading || reportData.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (isLoading || reportData.length === 0) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500',
              opacity: (isLoading || reportData.length === 0) ? 0.7 : 1
            }}
          >
            <Download size={16} />
            Export Excel
          </button>
          <button 
            onClick={fetchReportData}
            disabled={isLoading}
            style={{
              backgroundColor: '#1a6f66ff', color: '#fff', border: 'none', padding: '10px 20px',
              borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isLoading ? 0.7 : 1
            }}
          >
            <Search size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              <Calendar size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Timeframe Grouping
            </label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="All Time">All Time</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              <Filter size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Recruiter Filter
            </label>
            <select 
              value={selectedRecruiter} 
              onChange={(e) => setSelectedRecruiter(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All Recruiters</option>
              {recruitersList.map((r, i) => (
                <option key={i} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleClearFilters}
            style={{ padding: '10px 15px', backgroundColor: '#e9ecef', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', height: '42px' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

      {/* Summary Cards */}
      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          {[
            { label: 'Total Profiles', value: summaryTotals.totalProfiles, color: '#4a90e2' },
            { label: 'Screened', value: summaryTotals.screened, color: '#f39c12' },
            { label: 'Client Submit', value: summaryTotals.clientSubmit, color: '#8e44ad' },
            { label: 'L1 Interview', value: summaryTotals.l1, color: '#3498db' },
            { label: 'L2 Interview', value: summaryTotals.l2, color: '#2980b9' },
            { label: 'Closure/Hired', value: summaryTotals.closure, color: '#2ecc71' },
            { label: 'Rejected', value: summaryTotals.rejected, color: '#e74c3c' },
          ].map((stat, idx) => (
            <div key={idx} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center', borderBottom: `4px solid ${stat.color}` }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stat.value}</div>
              <div style={{ fontSize: '14px', color: '#777', marginTop: '5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading report data...</div>
        ) : reportData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No records found for the selected criteria.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f1f4f6', color: '#333' }}>
                <tr>
                  {timeframe !== 'All Time' && <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Time Period</th>}
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Recruiter</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Total Profiles</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Screened</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Client Submit</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>L1 Interview</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>L2 Interview</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Closure</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    {timeframe !== 'All Time' && <td style={{ padding: '15px' }}>{formatTimePeriod(row.timePeriod, timeframe)}</td>}
                    <td style={{ padding: '15px', fontWeight: '500', color: '#1a6f66ff' }}>{row.recruiterName}</td>
                    <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{row.totalProfiles}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>{row.screenedCount}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>{row.clientSubmitCount}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>{row.l1Count}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>{row.l2Count}</td>
                    <td style={{ padding: '15px', textAlign: 'center', color: '#2ecc71', fontWeight: 'bold' }}>{row.closureCount}</td>
                    <td style={{ padding: '15px', textAlign: 'center', color: '#e74c3c' }}>{row.rejectedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterPerformanceReport;
