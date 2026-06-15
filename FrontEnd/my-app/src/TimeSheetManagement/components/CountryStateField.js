import React, { useState, useEffect } from 'react';
import { STATES_BY_COUNTRY } from './MTS_Constants';

const CountryStateField = React.memo(({ 
  value, 
  onChange, 
  error = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const allStatesWithCountry = [];
  Object.entries(STATES_BY_COUNTRY).forEach(([country, states]) => {
    states.forEach(state => {
      allStatesWithCountry.push({
        label: `${state} (${country})`,
        value: state,
        country: country,
        state: state
      });
    });
  });

  const filteredStates = allStatesWithCountry.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStateSelect = (item) => {
    onChange(item.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getCountryForState = (stateValue) => {
    if (!stateValue) return '';
    const item = allStatesWithCountry.find(s => s.value === stateValue);
    return item ? item.country : '';
  };

  const selectedDisplay = value ? `${value} (${getCountryForState(value)})` : '';

  return (
    <div className="mts-emp-form-group">
      <label>
        State/Province
        <span style={{ color: 'var(--mts-danger-red)' }}> *</span>
      </label>
      
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchTerm || selectedDisplay}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search states/provinces by name or country..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: isOpen ? '2px solid #10b981' : '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box',
            fontFamily: 'inherit'
          }}
        />

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #d1d5db',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            maxHeight: '250px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            {filteredStates.length > 0 ? (
              filteredStates.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleStateSelect(item)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    backgroundColor: value === item.value ? '#e0f2fe' : '#fff',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: '14px',
                    color: value === item.value ? '#0369a1' : '#1f2937',
                    fontWeight: value === item.value ? '600' : '400',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (value !== item.value) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== item.value) {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.state}</span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#9ca3af',
                      marginLeft: '12px'
                    }}>
                      {item.country}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: '10px 12px',
                color: '#9ca3af',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                No states found
              </div>
            )}
          </div>
        )}

        {isOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {error && <div className="mts-error">{error}</div>}
    </div>
  );
});

CountryStateField.displayName = 'CountryStateField';

export default CountryStateField;
