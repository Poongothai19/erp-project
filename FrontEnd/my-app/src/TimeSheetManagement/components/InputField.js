import React from 'react';

const InputField = React.memo(({ 
  type = 'text',
  value, 
  onChange, 
  placeholder = '', 
  disabled = false,
  className = '',
  list = '',
  style = {}
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    className={`mts-emp-form-input ${disabled ? 'mts-emp-form-input-disabled' : ''} ${className}`}
    placeholder={placeholder}
    disabled={disabled}
    list={list}
    style={style}
  />
));

InputField.displayName = 'InputField';

export default InputField;
