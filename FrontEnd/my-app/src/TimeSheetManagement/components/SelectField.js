import React from 'react';

const SelectField = React.memo(({ 
  value, 
  onChange, 
  options = [],
  placeholder = '',
  disabled = false
}) => {
  // Check if options are objects with value/label or simple arrays
  const isObjectOptions = options.length > 0 && typeof options[0] === 'object' && options[0].value !== undefined;

  return (
    <select
      value={value}
      onChange={onChange}
      className={`mts-emp-form-input ${disabled ? 'mts-emp-form-input-disabled' : ''}`}
      disabled={disabled}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {isObjectOptions ? (
        options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))
      ) : (
        options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))
      )}
    </select>
  );
});

SelectField.displayName = 'SelectField';

export default SelectField;
