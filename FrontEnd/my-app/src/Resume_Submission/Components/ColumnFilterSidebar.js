import React from "react";
import { IoClose } from "react-icons/io5";
import "../styles/ColumnFilterSidebar.css";

const ColumnFilterSidebar = ({
  availableColumns,
  selectedColumns,
  setSelectedColumns,
  availableFilters,
  selectedFilters,
  setSelectedFilters,
  onClose,
  isOpen,
}) => {
  const allColumnsSelected = availableColumns.length > 0 && selectedColumns.length === availableColumns.length;
  const allFiltersSelected = availableFilters.length > 0 && selectedFilters.length === availableFilters.length;

  const handleSelectAllColumns = () => {
    if (allColumnsSelected) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(availableColumns.map(col => col.key));
    }
  };

  const handleSelectAllFilters = () => {
    if (allFiltersSelected) {
      setSelectedFilters([]);
    } else {
      setSelectedFilters(availableFilters.map(f => f.key));
    }
  };

  const handleColumnChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedColumns([...selectedColumns, value]);
    } else {
      setSelectedColumns(selectedColumns.filter(col => col !== value));
    }
  };

  const handleFilterChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedFilters([...selectedFilters, value]);
    } else {
      setSelectedFilters(selectedFilters.filter(f => f !== value));
    }
  };

  return (
    <div className={`column-filter-sidebar-wrapper ${isOpen ? "open" : ""}`}>
      <div className="column-filter-sidebar-header">
        <h3>Manage Columns & Sidebar Filters</h3>
        <IoClose className="column-filter-sidebar-close-btn" onClick={onClose} />
      </div>

      <div className="column-filter-sidebar-section">
        <h4 className="column-filter-sidebar-section-title">Table Columns</h4>
        <label className="column-filter-sidebar-item">
          <input type="checkbox" checked={allColumnsSelected} onChange={handleSelectAllColumns} />
          Select All
        </label>
        {availableColumns.map((col) => (
          <label key={col.key} className="column-filter-sidebar-item">
            <input
              type="checkbox"
              value={col.key}
              checked={selectedColumns.includes(col.key)}
              onChange={handleColumnChange}
            />
            {col.label}
          </label>
        ))}
      </div>

      <div className="column-filter-sidebar-section" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
        <h4 className="column-filter-sidebar-section-title">Sidebar Filters</h4>
        <label className="column-filter-sidebar-item">
          <input type="checkbox" checked={allFiltersSelected} onChange={handleSelectAllFilters} />
          Select All
        </label>
        {availableFilters.map((f) => (
          <label key={f.key} className="column-filter-sidebar-item">
            <input
              type="checkbox"
              value={f.key}
              checked={selectedFilters.includes(f.key)}
              onChange={handleFilterChange}
            />
            {f.label}
          </label>
        ))}
      </div>
    </div>
  );
};

export default ColumnFilterSidebar;