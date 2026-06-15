import React from 'react';

const FormFieldGroup = React.memo(({ 
  label, 
  required = false, 
  error = null, 
  children 
}) => (
  <div className="mts-emp-form-group">
    <label>
      {label}
      {required && <span style={{ color: 'var(--mts-danger-red)' }}> *</span>}
    </label>
    {children}
    {error && <div className="mts-error">{error}</div>}
  </div>
));

FormFieldGroup.displayName = 'FormFieldGroup';

export default FormFieldGroup;
