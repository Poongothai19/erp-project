import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, Plus, ChevronDown } from 'lucide-react';
import '../styles/FilterModal.css';

const FIELD_OPTIONS = [
  { value: 'FirstName',         label: 'Name' },
  { value: 'Email',             label: 'Email' },
  { value: 'Phone',             label: 'Phone' },
  { value: 'JobTitle',          label: 'Job Title' },
  { value: 'CandidateCode',     label: 'Candidate ID' },
  { value: 'YearsOfExperience', label: 'Years of Exp.' },
  { value: 'CandidateStatus',   label: 'Status' },
  { value: 'IsBench',           label: 'Bench' },
  { value: 'RemoteStatus',      label: 'Work Type' },
  { value: 'Skills',            label: 'Skills' },
  { value: 'CurrentLocation',   label: 'Location' },
  { value: 'Gender',            label: 'Gender' },
  { value: 'LinkedInUrl',       label: 'LinkedIn' },
  { value: 'GitHubUrl',         label: 'GitHub' },
  { value: 'ProfileSummary',    label: 'Profile Summary' },
  { value: 'CreatedDt',         label: 'Created Date' },
];

const CONDITION_OPTIONS = [
  { value: 'contains',      label: 'Contains' },
  { value: 'equals',        label: 'Equals' },
  { value: 'not_equals',    label: 'Does not equal' },
  { value: 'starts_with',   label: 'Starts with' },
  { value: 'ends_with',     label: 'Ends with' },
  { value: 'is_empty',      label: 'Is empty' },
  { value: 'is_not_empty',  label: 'Is not empty' },
  { value: 'greater_than',  label: 'Greater than' },
  { value: 'less_than',     label: 'Less than' },
  { value: 'not_contains',  label: 'Does not contain' },
];

const STATUS_VALUES = ['Available', 'In Process', 'Hired', 'Not Available', 'On Hold'];
const REMOTE_VALUES = ['Remote', 'OnSite', 'Hybrid'];
const GENDER_VALUES = ['Male', 'Female', 'Other'];

const emptyRow = () => ({ field: '', condition: '', value: '', operator: 'AND' });

const FilterModal = ({ isOpen, onClose, onApply, initialFilters = null }) => {
  const [rows, setRows] = useState([emptyRow()]);
  const [openLogicIndex, setOpenLogicIndex] = useState(null);
  const logicRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialFilters?.rows?.length > 0) {
        setRows(initialFilters.rows.map(r => ({
          ...r,
          operator: r.operator || initialFilters.logic || 'AND'
        })));
      } else {
        setRows([emptyRow()]);
      }
    }
  }, [isOpen, initialFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close logic dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (logicRef.current && !logicRef.current.contains(e.target)) {
        setOpenLogicIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const updateRow = (index, key, val) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [key]: val } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, emptyRow()]);
  };

  const removeRow = (index) => {
    setRows(prev => prev.length <= 1 ? [emptyRow()] : prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setRows([emptyRow()]);
  };

  const handleApply = () => {
    // Only keep rows with field + condition filled
    const validRows = rows.filter(r => r.field && r.condition);
    // Note: We send logic: 'MIXED' or something, or just use the per-row logic in the parent
    onApply({ rows: validRows, logic: 'MIXED' });
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Determine value input type based on field
  const getValueInput = (row, index) => {
    if (row.condition === 'is_empty' || row.condition === 'is_not_empty') {
      return null; // No value needed
    }

    if (row.field === 'IsBench') {
      return (
        <select
          className="fm-select"
          value={row.value}
          onChange={e => updateRow(index, 'value', e.target.value)}
        >
          <option value="">Select</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    if (row.field === 'CandidateStatus') {
      return (
        <select
          className="fm-select"
          value={row.value}
          onChange={e => updateRow(index, 'value', e.target.value)}
        >
          <option value="">Select</option>
          {STATUS_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      );
    }


    if (row.field === 'RemoteStatus') {
      return (
        <select
          className="fm-select"
          value={row.value}
          onChange={e => updateRow(index, 'value', e.target.value)}
        >
          <option value="">Select</option>
          {REMOTE_VALUES.map(v => <option key={v} value={v}>{v === 'OnSite' ? 'On-Site' : v}</option>)}
        </select>
      );
    }

    if (row.field === 'Gender') {
      return (
        <select
          className="fm-select"
          value={row.value}
          onChange={e => updateRow(index, 'value', e.target.value)}
        >
          <option value="">Select</option>
          {GENDER_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      );
    }

    if (row.field === 'CreatedDt') {
      return (
        <input
          type="date"
          className="fm-input"
          value={row.value}
          onChange={e => updateRow(index, 'value', e.target.value)}
        />
      );
    }

    if (row.field === 'YearsOfExperience') {
      return (
        <input
          type="number"
          className="fm-input"
          placeholder="e.g. 5"
          min="0"
          step="0.5"
          value={row.value}
          onChange={e => updateRow(index, 'value', e.target.value)}
        />
      );
    }

    return (
      <input
        type="text"
        className="fm-input"
        placeholder="Value"
        value={row.value}
        onChange={e => updateRow(index, 'value', e.target.value)}
      />
    );
  };

  const activeCount = rows.filter(r => r.field && r.condition).length;

  if (!isOpen) return null;

  return (
    <div className="fm-overlay" onClick={handleCancel}>
      <div className="fm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="fm-header">
          <h2 className="fm-title">
            Filter{activeCount > 0 ? ` (${activeCount})` : ''}
          </h2>
          <div className="fm-header-actions">
            <button className="fm-clear-btn" onClick={clearAll}>Clear All</button>
            <button className="fm-close-btn" onClick={handleCancel}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Rows */}
        <div className="fm-body">
          {rows.map((row, index) => (
            <React.Fragment key={index}>
              {/* AND/OR connector between rows */}
              {index > 0 && (
                <div className="fm-logic-row">
                  <div className="fm-logic-wrapper" ref={openLogicIndex === index ? logicRef : null}>
                    <button
                      className="fm-logic-btn"
                      onClick={() => setOpenLogicIndex(openLogicIndex === index ? null : index)}
                    >
                      {row.operator || 'AND'}
                      <ChevronDown size={14} />
                    </button>
                    {openLogicIndex === index && (
                      <div className="fm-logic-dropdown">
                        <div
                          className={`fm-logic-option ${(row.operator || 'AND') === 'AND' ? 'active' : ''}`}
                          onClick={() => { updateRow(index, 'operator', 'AND'); setOpenLogicIndex(null); }}
                        >
                          AND
                        </div>
                        <div
                          className={`fm-logic-option ${row.operator === 'OR' ? 'active' : ''}`}
                          onClick={() => { updateRow(index, 'operator', 'OR'); setOpenLogicIndex(null); }}
                        >
                          OR
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Filter row */}
              <div className="fm-row">
                {/* Field */}
                <div className="fm-field-group">
                  <label className="fm-label">Field*</label>
                  <select
                    className="fm-select"
                    value={row.field}
                    onChange={e => updateRow(index, 'field', e.target.value)}
                  >
                    <option value="">Field*</option>
                    {FIELD_OPTIONS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Condition */}
                <div className="fm-field-group">
                  <label className="fm-label">Condition*</label>
                  <select
                    className="fm-select"
                    value={row.condition}
                    onChange={e => updateRow(index, 'condition', e.target.value)}
                  >
                    <option value="">Select</option>
                    {CONDITION_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                {row.condition !== 'is_empty' && row.condition !== 'is_not_empty' && (
                  <div className="fm-field-group">
                    <label className="fm-label">Value</label>
                    {getValueInput(row, index)}
                  </div>
                )}

                {/* Delete */}
                {rows.length > 1 && (
                  <button className="fm-delete-btn" onClick={() => removeRow(index)} title="Remove filter">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}

          {/* Add Filter */}
          <button className="fm-add-btn" onClick={addRow}>
            <Plus size={14} /> ADD FILTER
          </button>
        </div>

        {/* Footer */}
        <div className="fm-footer">
          <button className="fm-cancel-btn" onClick={handleCancel}>Cancel</button>
          <button className="fm-apply-btn" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
