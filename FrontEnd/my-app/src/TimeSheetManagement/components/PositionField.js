import React, { useState, useEffect } from 'react';
import InputField from './InputField';
import SelectField from './SelectField';

const PositionField = React.memo(({ 
  value, 
  onChange, 
  error = null,
  positions = []
}) => {
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [customPosition, setCustomPosition] = useState('');

  useEffect(() => {
    if (value && !positions.includes(value)) {
      setIsCustomPosition(true);
      setCustomPosition(value);
    }
  }, [value, positions]);

  const handlePositionTypeChange = (e) => {
    const isCustom = e.target.value === 'custom';
    setIsCustomPosition(isCustom);
    
    if (!isCustom) {
      setCustomPosition('');
      onChange(value);
    } else {
      onChange(customPosition);
    }
  };

  const handlePredefinedChange = (e) => {
    onChange(e.target.value);
  };

  const handleCustomChange = (e) => {
    const newValue = e.target.value;
    setCustomPosition(newValue);
    onChange(newValue);
  };

  return (
    <div className="mts-emp-form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ margin: 0, padding: 0 }}>
          Position
          <span style={{ color: 'var(--mts-danger-red)' }}> </span>
        </label>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', margin: 0, fontWeight: 'normal', color: 'var(--mts-gray-600)' }}>
            <input
              type="radio"
              value="predefined"
              checked={!isCustomPosition}
              onChange={handlePositionTypeChange}
            />
            List
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', margin: 0, fontWeight: 'normal', color: 'var(--mts-gray-600)' }}>
            <input
              type="radio"
              value="custom"
              checked={isCustomPosition}
              onChange={handlePositionTypeChange}
            />
            Custom
          </label>
        </div>
      </div>

      {isCustomPosition ? (
        <InputField
          value={customPosition}
          onChange={handleCustomChange}
          placeholder="Enter position title"
        />
      ) : (
        <SelectField
          value={value}
          onChange={handlePredefinedChange}
          options={positions}
          placeholder="Select Position"
        />
      )}
      
      {error && <div className="mts-error">{error}</div>}
    </div>
  );
});

PositionField.displayName = 'PositionField';

export default PositionField;
