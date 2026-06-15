import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

const SidebarFilter = React.memo(({ 
  isOpen,
  onClose,
  employees, 
  onStatusFilter, 
  onStateFilter,
  activeFilters = { statuses: [], states: [] }
}) => {
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    state: true
  });

  const uniqueStatuses = [...new Set(employees.map(emp => emp.status))].filter(Boolean).sort();
  const uniqueStates = [...new Set(employees.map(emp => emp.state))].filter(Boolean).sort();

  const handleStatusToggle = (status) => {
    const newStatuses = activeFilters.statuses.includes(status)
      ? activeFilters.statuses.filter(s => s !== status)
      : [...activeFilters.statuses, status];
    onStatusFilter(newStatuses);
  };

  const handleStateToggle = (state) => {
    const newStates = activeFilters.states.includes(state)
      ? activeFilters.states.filter(s => s !== state)
      : [...activeFilters.states, state];
    onStateFilter(newStates);
  };

  const clearAllFilters = () => {
    onStatusFilter([]);
    onStateFilter([]);
  };

  const hasActiveFilters = activeFilters.statuses.length > 0 || activeFilters.states.length > 0;
  const totalFiltersActive = activeFilters.statuses.length + activeFilters.states.length;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 999,
            transition: 'opacity 0.3s ease'
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '320px',
          backgroundColor: '#ffffff',
          boxShadow: isOpen ? '-2px 0 8px rgba(0, 0, 0, 0.15)' : 'none',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
          flexShrink: 0
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Filter size={20} style={{ color: '#10b981' }} />
            Filters
            {hasActiveFilters && (
              <span style={{
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                marginLeft: '4px'
              }}>
                {totalFiltersActive}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Content */}
        <div style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto'
        }}>
          {/* STATUS FILTER */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => toggleSection('status')}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '0.75rem 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: '0.75rem',
                color: '#1f2937',
                fontWeight: '600',
                fontSize: '0.9375rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
            >
              <span>Status</span>
              <ChevronDown
                size={18}
                style={{
                  transform: expandedSections.status ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s'
                }}
              />
            </button>

            {expandedSections.status && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                paddingLeft: '0.5rem'
              }}>
                {uniqueStatuses.length > 0 ? (
                  uniqueStatuses.map(status => (
                    <label
                      key={status}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#374151',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
                    >
                      <input
                        type="checkbox"
                        checked={activeFilters.statuses.includes(status)}
                        onChange={() => handleStatusToggle(status)}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: '#10b981'
                        }}
                      />
                      <span style={{ flex: 1 }}>{status}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        fontWeight: '500'
                      }}>
                        ({employees.filter(e => e.status === status).length})
                      </span>
                    </label>
                  ))
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                    No statuses available
                  </p>
                )}
              </div>
            )}
          </div>

          {/* STATE FILTER */}
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => toggleSection('state')}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '0.75rem 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: '0.75rem',
                color: '#1f2937',
                fontWeight: '600',
                fontSize: '0.9375rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
            >
              <span>State/Province</span>
              <ChevronDown
                size={18}
                style={{
                  transform: expandedSections.state ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s'
                }}
              />
            </button>

            {expandedSections.state && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                paddingLeft: '0.5rem',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {uniqueStates.length > 0 ? (
                  uniqueStates.map(state => (
                    <label
                      key={state}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#374151',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
                    >
                      <input
                        type="checkbox"
                        checked={activeFilters.states.includes(state)}
                        onChange={() => handleStateToggle(state)}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: '#10b981'
                        }}
                      />
                      <span style={{ flex: 1 }}>{state}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        fontWeight: '500'
                      }}>
                        ({employees.filter(e => e.state === state).length})
                      </span>
                    </label>
                  ))
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                    No states available
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {hasActiveFilters && (
          <div style={{
            padding: '1rem',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            flexShrink: 0
          }}>
            <button
              onClick={clearAllFilters}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </>
  );
});

SidebarFilter.displayName = 'SidebarFilter';

export default SidebarFilter;
