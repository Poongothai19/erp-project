import React, { useState, useCallback, useEffect } from 'react';
import { UserCheck, Lock, Eye, EyeOff } from 'lucide-react';
import FormFieldGroup from './FormFieldGroup';
import InputField from './InputField';
import SelectField from './SelectField';
import DepartmentField from './DepartmentField';
import PositionField from './PositionField';
import CountryStateField from './CountryStateField';
import { 
  DEPARTMENTS, 
  POSITIONS, 
  EMPLOYMENT_TYPES, 
  EMPLOYEE_STATUSES 
} from './MTS_Constants';

const EmployeeFormBody = React.memo(({ 
  formData, 
  onUpdateField, 
  errors = {},
  isAddMode = true,
  selectedCompany
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleFieldChange = useCallback((field) => (e) => {
    onUpdateField(field, e.target.value);
  }, [onUpdateField]);

  const generateRandomId = useCallback(() => {
    let prefix = 'EMP';
    const companyName = selectedCompany?.name || '';
    
    if (companyName.includes('Prophecy Consulting INC')) {
      prefix = 'PC';
    } else if (companyName.includes('Prophecy Offshore')) {
      prefix = 'PT';
    } else if (companyName.includes('Cognifyar Technologies')) {
      prefix = 'CT';
    }
    
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${randomNum}`;
  }, [selectedCompany]);

  useEffect(() => {
    if (isAddMode && !formData.employeeId) {
      onUpdateField('employeeId', generateRandomId());
    }
  }, [isAddMode, formData.employeeId, generateRandomId, onUpdateField]);

  return (
    <div className="mts-emp-modal-body">
      <div className="mts-emp-form-grid">
        {/* Employee ID and Full Name Row */}
        <div className="mts-emp-form-row">
          <FormFieldGroup label="Employee ID" required error={errors.employeeId}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <InputField
                value={formData.employeeId}
                onChange={handleFieldChange('employeeId')}
                placeholder="Enter employee ID"
                disabled={!isAddMode}
                style={{ flex: 1 }}
              />
              {isAddMode && (
                <button
                  type="button"
                  onClick={() => onUpdateField('employeeId', generateRandomId())}
                  className="mts-generate-id-btn"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  Generate ID
                </button>
              )}
            </div>
          </FormFieldGroup>
          
          <FormFieldGroup label="Full Name" required error={errors.name}>
            <InputField
              value={formData.name}
              onChange={handleFieldChange('name')}
              placeholder="Enter full name"
            />
          </FormFieldGroup>
        </div>

        {/* Email and Phone Row */}
        <div className="mts-emp-form-row">
          <FormFieldGroup label="Email Address" required error={errors.email}>
            <InputField
              type="email"
              value={formData.email}
              onChange={handleFieldChange('email')}
              placeholder="Enter email address"
            />
          </FormFieldGroup>
          <FormFieldGroup label="Phone Number" error={errors.phone}>
            <InputField
              type="tel"
              value={formData.phone}
              onChange={handleFieldChange('phone')}
              placeholder="Enter phone number"
            />
          </FormFieldGroup>
        </div>

        {/* Department and Position Row */}
        <div className="mts-emp-form-row">
            <DepartmentField
              value={formData.department}
              onChange={(value) => onUpdateField('department', value)}
              error={errors.department}
              departments={DEPARTMENTS}
            />
            
            <PositionField
              value={formData.position}
              onChange={(value) => onUpdateField('position', value)}
              error={errors.position}
              positions={POSITIONS}
            />
          </div>

        {/* Employment Type and Status Row */}
        <div className="mts-emp-form-row">
          <FormFieldGroup label="Employment Type" error={errors.employmentType}>
            <SelectField
              value={formData.employmentType}
              onChange={handleFieldChange('employmentType')}
              options={EMPLOYMENT_TYPES}
            />
          </FormFieldGroup>
          <FormFieldGroup label="Status" error={errors.status}>
            <SelectField
              value={formData.status}
              onChange={handleFieldChange('status')}
              options={EMPLOYEE_STATUSES}
            />
          </FormFieldGroup>
        </div>

        {/* Hire Date and Time Punch Row */}
        <div className="mts-emp-form-row">
          <FormFieldGroup label="Hire Date" error={errors.hireDate}>
            <InputField
              type="date"
              value={formData.hireDate}
              onChange={handleFieldChange('hireDate')}
            />
          </FormFieldGroup>
          <FormFieldGroup label="Attendance Settings">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <input
                type="checkbox"
                id="timePunchEnabled"
                checked={formData.timePunchEnabled}
                onChange={(e) => onUpdateField('timePunchEnabled', e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="timePunchEnabled" style={{ fontSize: '14px', cursor: 'pointer' }}>
                Enable Time Punch (Clock In/Out)
              </label>
            </div>
          </FormFieldGroup>
        </div>

        {/* HOME ADDRESS SECTION */}
        <div style={{
          borderTop: '2px solid #e5e7eb',
          paddingTop: '20px',
          marginTop: '8px',
          gridColumn: '1 / -1'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '16px',
            marginTop: 0
          }}>
            Home Address
          </h4>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            marginBottom: '16px',
            marginTop: 0
          }}>
            This is the address that will be included on pay stubs and W-2s. Make sure the address is correct in case you need to mail one of these documents to the employee.
          </p>
        </div>

        {/* Street Address and Apartment Row */}
        <div className="mts-emp-form-row">
          <FormFieldGroup label="Street Address" required error={errors.streetAddress}>
            <InputField
              value={formData.streetAddress}
              onChange={handleFieldChange('streetAddress')}
              placeholder="Enter street address"
            />
          </FormFieldGroup>
          <FormFieldGroup label="Apartment, Suite, Unit, Building, or Floor" error={errors.apartmentSuite}>
            <InputField
              value={formData.apartmentSuite}
              onChange={handleFieldChange('apartmentSuite')}
              placeholder="Enter apartment/suite details (optional)"
            />
          </FormFieldGroup>
        </div>

        {/* City, State, and Zip Code Row */}
        <div className="mts-emp-form-row">
          <FormFieldGroup label="City" required error={errors.city}>
              <InputField
                value={formData.city}
                onChange={handleFieldChange('city')}
                placeholder="Enter city"
              />
            </FormFieldGroup>
            <CountryStateField
              value={formData.state}
              onChange={(value) => onUpdateField('state', value)}
              error={errors.state}
            />
            <FormFieldGroup label="Zip Code" required error={errors.zipCode}>
              <InputField
                value={formData.zipCode}
                onChange={handleFieldChange('zipCode')}
                placeholder="Enter zip code"
              />
            </FormFieldGroup>
        </div>

        {/* AUTHENTICATION SECTION */}
        {isAddMode && (
          <>
            <div style={{
              borderTop: '2px solid #e5e7eb',
              paddingTop: '20px',
              marginTop: '8px',
              gridColumn: '1 / -1'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '16px'
              }}>
                <input
                  type="checkbox"
                  id="createAccount"
                  checked={formData.createAccount}
                  onChange={(e) => onUpdateField('createAccount', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label 
                  htmlFor="createAccount" 
                  style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <UserCheck size={20} style={{ color: '#10b981' }} />
                  Create Login Account for Employee
                </label>
              </div>

              {formData.createAccount && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '16px',
                  marginTop: '12px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <Lock size={16} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                      Login Credentials (will be sent via email)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <FormFieldGroup label="Username" required error={errors.username}>
                      <InputField
                        value={formData.username}
                        onChange={handleFieldChange('username')}
                        placeholder="Enter username"
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="Password" required error={errors.password}>
                      <div style={{ position: 'relative' }}>
                        <InputField
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleFieldChange('password')}
                          placeholder="Enter password (min 6 chars)"
                          style={{ paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280'
                          }}
                        >
                          {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                    </FormFieldGroup>
                  </div>

                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#92400e'
                  }}>
                    ℹ️ <strong>Note:</strong> The username and password will be sent to the employee's email address. 
                    They should change their password after first login.
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

EmployeeFormBody.displayName = 'EmployeeFormBody';

export default EmployeeFormBody;
