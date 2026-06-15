



// OnboardingList.js
import React, { useState } from 'react';
import '../styles/Onboarding.css'
import { LuSearch } from 'react-icons/lu';

const OnboardingList = ({ onEmployeeSelect }) => {
  const employees = [ // Changed from useState to direct array
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      mobile: '9876543210',
      status: 'pending',
      dateAdded: '2024-01-15',
      position: 'Software Developer'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      mobile: '9876543211',
      status: 'completed',
      dateAdded: '2024-01-14',
      position: 'HR Manager'
    },
    {
      id: 3,
      name: 'Robert Johnson',
      email: 'robert@example.com',
      mobile: '9876543212',
      status: 'in-progress',
      dateAdded: '2024-01-13',
      position: 'Team Lead'
    }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.mobile.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { label: 'Pending', className: 'ob-badge-warning' },
      'in-progress': { label: 'In Progress', className: 'ob-badge-info' },
      'completed': { label: 'Completed', className: 'ob-badge-success' }
    };
    
    const config = statusConfig[status] || { label: status, className: 'ob-badge-secondary' };
    
    return <span className={`ob-badge ${config.className}`}>{config.label}</span>;
  };

  return (
    <div className="ob-list">
      <div className="ob-list-header">
        <h2>Onboarding List</h2>
        <div className="ob-list-controls">
          <div className="ob-search-box">
            <LuSearch className="ob-search-icon" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ob-search-input"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ob-status-filter"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="ob-table-container">
        <table className="ob-employee-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Position</th>
              <th>Status</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.id}>
                <td>EMP{employee.id.toString().padStart(3, '0')}</td>
                <td>{employee.name}</td>
                <td>{employee.email}</td>
                <td>{employee.mobile}</td>
                <td>{employee.position}</td>
                <td>{getStatusBadge(employee.status)}</td>
                <td>{employee.dateAdded}</td>
                <td>
                  <button
                    className="ob-btn-view"
                    onClick={() => onEmployeeSelect(employee)}
                  >
                    View Details
                  </button>
                  <button className="ob-btn-edit">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEmployees.length === 0 && (
        <div className="ob-no-results">
          <p>No employees found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default OnboardingList;