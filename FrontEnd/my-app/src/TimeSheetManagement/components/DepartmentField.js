import React, { useState, useEffect } from 'react';
import InputField from './InputField';
import SelectField from './SelectField';

const DepartmentField = React.memo(({ 
  value, 
  onChange, 
  error = null,
  departments = []
}) => {
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);
  const [customDepartment, setCustomDepartment] = useState('');

  useEffect(() => {
    if (value && !departments.includes(value)) {
      setIsCustomDepartment(true);
      setCustomDepartment(value);
    }
  }, [value, departments]);

  const handleDepartmentTypeChange = (e) => {
    const isCustom = e.target.value === 'custom';
    setIsCustomDepartment(isCustom);
    
    if (!isCustom) {
      setCustomDepartment('');
      onChange(value);
    } else {
      onChange(customDepartment);
    }
  };

  const handlePredefinedChange = (e) => {
    onChange(e.target.value);
  };

  const handleCustomChange = (e) => {
    const newValue = e.target.value;
    setCustomDepartment(newValue);
    onChange(newValue);
  };

  return (
    <div className="mts-emp-form-group">
      <label>
        Department
      </label>
      
      <div style={{ marginBottom: '8px' }}>
        <label style={{ marginRight: '16px', fontSize: '14px' }}>
          <input
            type="radio"
            value="predefined"
            checked={!isCustomDepartment}
            onChange={handleDepartmentTypeChange}
            style={{ marginRight: '4px' }}
          />
          Select from list
        </label>
        <label style={{ fontSize: '14px' }}>
          <input
            type="radio"
            value="custom"
            checked={isCustomDepartment}
            onChange={handleDepartmentTypeChange}
            style={{ marginRight: '4px' }}
          />
          Enter custom department
        </label>
      </div>

      {isCustomDepartment ? (
        <InputField
          value={customDepartment}
          onChange={handleCustomChange}
          placeholder="Enter department name"
        />
      ) : (
        <SelectField
          value={value}
          onChange={handlePredefinedChange}
          options={departments}
          placeholder="Select Department"
        />
      )}
      
      {error && <div className="mts-error">{error}</div>}
    </div>
  );
});

DepartmentField.displayName = 'DepartmentField';

export default DepartmentField;
