import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import '../styles/CandidateFilterSidebar.css';
import { 
  countriesData, 
  getStatesForCountry 
} from '../../erprecruitment/config/locationConfig';

const CandidateFilterSidebar = ({
  totalCount,
  overallTotal,
  filters,
  setFilters,
  onClearAll,
  availableLocations = [],
  availableStatuses = [],
  availableWorkTypes = [],
  availableSources = [],
  availableEmploymentTypes = [],
  availableIndustries = [],
  availableWorkAuths = [],
  onClose,
  visibleColumns = [],
  setVisibleColumns
}) => {
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const stateDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) {
        setIsStateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckboxChange = (category, value) => {
    const current = filters[category] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];

    setFilters({ ...filters, [category]: updated });
  };

  const handleRadioChange = (category, value) => {
    setFilters({ ...filters, [category]: value });
  };

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleLocationChange = (field, value) => {
    if (field === 'country') {
      setFilters({
        ...filters,
        country: value,
        states: [],
        cities: [],
      });
      setStateSearchQuery('');
    } else {
      const category = field === 'state' ? 'states' : 'cities';
      const current = filters[category] || [];
      if (value && !current.includes(value)) {
        setFilters({ ...filters, [category]: [...current, value] });
      }
    }
  };

  const handleRemoveLocation = (category, value) => {
    const updated = (filters[category] || []).filter(item => item !== value);
    setFilters({ ...filters, [category]: updated });
  };

  const handleSkillAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const skill = e.target.value.trim();
      const current = filters.skills || [];
      if (!current.includes(skill)) {
        setFilters({ ...filters, skills: [...current, skill] });
      }
      e.target.value = '';
    }
  };

  const handleRemoveSkill = (skill) => {
    const updated = (filters.skills || []).filter(item => item !== skill);
    setFilters({ ...filters, skills: updated });
  };

  // Filter states based on search query
  const filteredStates = filters.country 
    ? getStatesForCountry(countriesData.find(c => c.name === filters.country)?.code).filter(s => 
        s.toLowerCase().includes(stateSearchQuery.toLowerCase())
      )
    : [];

  const [isLocationExpanded, setIsLocationExpanded] = useState(true);

  return (
    <aside className="candidate-filter-sidebar">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          title="Close Sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Total Count Card */}
      <div className="filter-stats-card">
        <div className="filter-stats-label">Results Found</div>
        <div className="filter-stats-value">{totalCount}</div>
        <div className="filter-stats-subtext">out of {overallTotal || totalCount} total records</div>
      </div>

      {/* Search Input */}
      <div className="filter-search-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search name, job, skills..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (filters.search || '').trim()) {
                const tag = filters.search.trim();
                const current = filters.skills || [];
                if (!current.includes(tag)) {
                  setFilters({ ...filters, search: '', skills: [...current, tag] });
                } else {
                  setFilters({ ...filters, search: '' });
                }
              }
            }}
          />
        </div>
        
        {/* Keyword Tags */}
        {(filters.skills || []).length > 0 && (
          <div className="filter-tags-container" style={{ marginTop: 0 }}>
            {(filters.skills || []).map(tag => (
              <span key={tag} className="filter-tag">
                {tag}
                <X 
                  size={12} 
                  className="filter-tag-close" 
                  onClick={() => handleRemoveSkill(tag)}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status Filter */}
      {availableStatuses.length > 0 && visibleColumns.includes('CandidateStatus') && (
        <div className="filter-section">
          <h4 className="filter-section-title">Status</h4>
          <div className="filter-options-list">
            {availableStatuses.map(status => (
              <label key={status} className="filter-option-item">
                <input
                  type="checkbox"
                  checked={(filters.status || []).includes(status)}
                  onChange={() => handleCheckboxChange('status', status)}
                />
                <span className="filter-option-label">{status}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Person Type Filter */}
      {visibleColumns.includes('PersonType') && (
        <div className="filter-section">
          <h4 className="filter-section-title">Type</h4>
          <div className="filter-options-list">
            {[
              { label: 'All', value: 'all' },
              { label: 'Candidates', value: 'candidates' },
              { label: 'Employees', value: 'employees' }
            ].map(opt => (
              <label key={opt.value} className="filter-option-item">
                <input
                  type="radio"
                  name="personType"
                  checked={(filters.personType || 'all') === opt.value}
                  onChange={() => handleRadioChange('personType', opt.value)}
                />
                <span className="filter-option-label">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Bench Status Filter */}
      {visibleColumns.includes('IsBench') && (
        <div className="filter-section">
          <h4 className="filter-section-title">Bench Status</h4>
          <div className="filter-options-list">
            {[
              { label: 'All', value: 'all' },
              { label: 'Bench Only', value: 'bench' },
              { label: 'Non-Bench', value: 'non-bench' }
            ].map(opt => (
              <label key={opt.value} className="filter-option-item">
                <input
                  type="radio"
                  name="isBench"
                  checked={(filters.isBench || 'all') === opt.value}
                  onChange={() => handleRadioChange('isBench', opt.value)}
                />
                <span className="filter-option-label">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Work Type Filter */}
      {availableWorkTypes.length > 0 && visibleColumns.includes('RemoteStatus') && (
        <div className="filter-section">
          <h4 className="filter-section-title">Work Type</h4>
          <div className="filter-options-list">
            {availableWorkTypes.map(type => (
              <label key={type} className="filter-option-item">
                <input
                  type="checkbox"
                  checked={(filters.workType || []).includes(type)}
                  onChange={() => handleCheckboxChange('workType', type)}
                />
                <span className="filter-option-label">{type}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Experience Filter */}
      {visibleColumns.includes('Experience') && (
        <div className="filter-section">
          <h4 className="filter-section-title">Experience</h4>
          <div className="filter-options-list">
            {[
              { label: 'All', value: 'all' },
              { label: 'Entry (0-2y)', value: '0-2' },
              { label: 'Mid (3-5y)', value: '3-5' },
              { label: 'Senior (5-10y)', value: '5-10' },
              { label: 'Expert (10y+)', value: '10+' }
            ].map(opt => (
              <label key={opt.value} className="filter-option-item">
                <input
                  type="radio"
                  name="experience"
                  checked={(filters.experience || 'all') === opt.value}
                  onChange={() => handleRadioChange('experience', opt.value)}
                />
                <span className="filter-option-label">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}


      {/* Work Authorization Filter */}
      {availableWorkAuths.length > 0 && visibleColumns.includes('WorkAuthorization') && (
        <div className="filter-section">
          <h4 className="filter-section-title">Work Auth</h4>
          <div className="filter-options-list">
            {availableWorkAuths.map(auth => (
              <label key={auth} className="filter-option-item">
                <input
                  type="checkbox"
                  checked={(filters.workAuth || []).includes(auth)}
                  onChange={() => handleCheckboxChange('workAuth', auth)}
                />
                <span className="filter-option-label">{auth}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Employment Type Filter */}
      {availableEmploymentTypes.length > 0 && visibleColumns.includes('EmploymentType') && (
        <div className="filter-section">
          <h4 className="filter-section-title">Emp Type</h4>
          <div className="filter-options-list">
            {availableEmploymentTypes.map(type => (
              <label key={type} className="filter-option-item">
                <input
                  type="checkbox"
                  checked={(filters.employmentTypes || []).includes(type)}
                  onChange={() => handleCheckboxChange('employmentTypes', type)}
                />
                <span className="filter-option-label">{type}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Industry Filter */}
      {availableIndustries.length > 0 && visibleColumns.includes('Industry') && (
        <div className="filter-section">
          <h4 className="filter-section-title">Industry</h4>
          <div className="filter-options-list">
            {availableIndustries.map(ind => (
              <label key={ind} className="filter-option-item">
                <input
                  type="checkbox"
                  checked={(filters.industries || []).includes(ind)}
                  onChange={() => handleCheckboxChange('industries', ind)}
                />
                <span className="filter-option-label">{ind}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Relocation Filter */}
      {visibleColumns.includes('Relocation') && (
        <div className="filter-section">
          <h4 className="filter-section-title">Relocation</h4>
          <div className="filter-options-list">
            {[
              { label: 'All', value: 'all' },
              { label: 'Willing', value: 'yes' },
              { label: 'Not Willing', value: 'no' }
            ].map(opt => (
              <label key={opt.value} className="filter-option-item">
                <input
                  type="radio"
                  name="relocate"
                  checked={(filters.relocate || 'all') === opt.value}
                  onChange={() => handleRadioChange('relocate', opt.value)}
                />
                <span className="filter-option-label">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Location Filter */}
      {visibleColumns.includes('CurrentLocation') && (
        <div className="filter-section">
          <div 
            className="filter-section-title" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setIsLocationExpanded(!isLocationExpanded)}
          >
            Location
            <ChevronDown 
              size={14} 
              style={{ 
                transform: isLocationExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: '#94a3b8'
              }} 
            />
          </div>
          {isLocationExpanded && (
            <div className="filter-location-container">
            {/* Country Dropdown */}
            <div className="filter-location-group">
              <label className="filter-location-label">Country</label>
              <select 
                className="filter-select"
                value={filters.country || ''}
                onChange={(e) => handleLocationChange('country', e.target.value)}
              >
                <option value="">Select Country</option>
                {countriesData.map(c => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* State Searchable Input (Multi-select) */}
            <div className="filter-location-group" ref={stateDropdownRef}>
              <label className="filter-location-label">State</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text"
                  className={`filter-location-input ${!filters.country ? 'disabled' : ''}`}
                  style={{ 
                    borderColor: isStateDropdownOpen ? '#229C8B' : '#e2e8f0',
                    boxShadow: isStateDropdownOpen ? '0 0 0 2px rgba(34, 156, 139, 0.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder={filters.country ? "Search states" : "Select country first"}
                  value={stateSearchQuery}
                  onChange={(e) => {
                    if (filters.country) {
                      setStateSearchQuery(e.target.value);
                      setIsStateDropdownOpen(true);
                    }
                  }}
                  onFocus={() => {
                    if (filters.country) {
                      setIsStateDropdownOpen(true);
                    }
                  }}
                  disabled={!filters.country}
                />
                <ChevronDown 
                  size={14} 
                  style={{ 
                    position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) ${isStateDropdownOpen ? 'rotate(180deg)' : ''}`,
                    color: '#94a3b8', transition: 'transform 0.2s ease', cursor: 'pointer'
                  }}
                  onClick={() => filters.country && setIsStateDropdownOpen(!isStateDropdownOpen)}
                />

                {isStateDropdownOpen && filters.country && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: '#fff', border: '1px solid #229C8B',
                    borderRadius: '4px', maxHeight: '180px', overflowY: 'auto',
                    zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    marginTop: '4px'
                  }}>
                    {filteredStates.map(s => (
                      <div 
                        key={s} 
                        className={`filter-dropdown-option ${(filters.states || []).includes(s) ? 'selected' : ''}`}
                        onClick={() => {
                          handleLocationChange('state', s);
                          setIsStateDropdownOpen(false);
                          setStateSearchQuery('');
                        }}
                        style={{
                          padding: '7px 12px', cursor: 'pointer', fontSize: '13px',
                          borderBottom: '1px solid #f3f4f6',
                          background: (filters.states || []).includes(s) ? '#e6f7f5' : '#fff',
                          color: '#374151'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0faf9'}
                        onMouseLeave={e => e.currentTarget.style.background = (filters.states || []).includes(s) ? '#e6f7f5' : '#fff'}
                      >
                        {s}
                      </div>
                    ))}
                    {filteredStates.length === 0 && (
                      <div style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>No states found</div>
                    )}
                  </div>
                )}
              </div>

              {/* State Tags */}
              <div className="filter-tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {(filters.states || []).map(s => (
                  <span key={s} className="filter-tag" style={{ background: '#e6f7f5', color: '#229C8B', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(34, 156, 139, 0.2)' }}>
                    {s}
                    <X 
                      size={12} 
                      style={{ cursor: 'pointer', opacity: 0.7 }}
                      onClick={() => handleRemoveLocation('states', s)}
                    />
                  </span>
                ))}
              </div>
            </div>



            {/* City Input (Multi-select) */}
            <div className="filter-location-group">
              <label className="filter-location-label">City</label>
              <input 
                type="text"
                className="filter-location-input"
                placeholder="Type city & press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleLocationChange('city', e.target.value.trim());
                    e.target.value = '';
                  }
                }}
              />
              <div className="filter-tags-container">
                {(filters.cities || []).map(city => (
                  <span key={city} className="filter-tag">
                    {city}
                    <X 
                      size={12} 
                      className="filter-tag-close" 
                      onClick={() => handleRemoveLocation('cities', city)}
                    />
                  </span>
                ))}
              </div>
            </div>
            </div>
          )}
        </div>
      )}

      <button className="clear-filters-btn" onClick={() => {
        onClearAll();
        setStateSearchQuery('');
      }}>
        Clear all filters
      </button>
    </aside>
  );
};

export default CandidateFilterSidebar;
