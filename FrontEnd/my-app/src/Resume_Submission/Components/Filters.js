import React from 'react';
import { STATUS_OPTIONS, ROLE_OPTIONS, DATE_OPTIONS } from '../utils/constants';

const Filters = ({
  searchTerm = '',
  onSearchChange = () => {},
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  roleFilter = 'all',
  onRoleFilterChange = () => {},
  dateFilter = 'all',
  onDateFilterChange = () => {},
  onResetFilters = () => {}
}) => {
  return (
    <div className="controls-section">
      <div className="search-box">
        <i className="fas fa-search"></i>
        <input
          type="text"
          id="searchInput"
          placeholder="Search candidates..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="statusFilter"><i className="fas fa-filter"></i> Status</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            {STATUS_OPTIONS?.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="roleFilter"><i className="fas fa-briefcase"></i> Role</label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
          >
            {ROLE_OPTIONS?.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="dateFilter"><i className="fas fa-calendar"></i> Date</label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
          >
            {DATE_OPTIONS?.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <button id="resetFilters" className="btn btn-link" onClick={onResetFilters}>
          <i className="fas fa-undo"></i> Reset
        </button>
      </div>
    </div>
  );
};

export default Filters;