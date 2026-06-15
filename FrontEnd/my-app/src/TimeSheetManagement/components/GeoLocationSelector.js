import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../url';
import FormFieldGroup from './FormFieldGroup';
import SelectField from './SelectField';

const GeoLocationSelector = ({ 
  countryValue, 
  stateValue, 
  cityValue, 
  onCountryChange, 
  onStateChange, 
  onCityChange,
  errors = {}
}) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState({
    countries: false,
    states: false,
    cities: false
  });

  // Fetch Countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoading(prev => ({ ...prev, countries: true }));
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}/api/employees/locations/countries`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data?.success) {
          setCountries(response.data.data.map(c => ({
            value: c.CountryId,
            label: c.Name,
            iso2: c.Iso2
          })));
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setIsLoading(prev => ({ ...prev, countries: false }));
      }
    };
    fetchCountries();
  }, []);

  // Fetch States when country changes
  useEffect(() => {
    if (!countryValue) {
      setStates([]);
      return;
    }

    const fetchStates = async () => {
      setIsLoading(prev => ({ ...prev, states: true }));
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}/api/employees/locations/states`, {
          params: { countryId: countryValue },
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data?.success) {
          setStates(response.data.data.map(s => ({
            value: s.StateId,
            label: s.Code,
            code: s.Code
          })));
        }
      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setIsLoading(prev => ({ ...prev, states: false }));
      }
    };
    fetchStates();
  }, [countryValue]);

  // Fetch Cities when state changes
  useEffect(() => {
    if (!stateValue) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      setIsLoading(prev => ({ ...prev, cities: true }));
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}/api/employees/locations/cities`, {
          params: { stateId: stateValue },
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data?.success) {
          setCities(response.data.data.map(c => ({
            value: c.CityId,
            label: c.Name
          })));
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setIsLoading(prev => ({ ...prev, cities: false }));
      }
    };
    fetchCities();
  }, [stateValue]);

  return (
    <>
      <div className="mts-emp-form-row">
        <FormFieldGroup label="Country" error={errors.country}>
          <SelectField
            value={countryValue}
            onChange={(e) => {
              const val = e.target.value;
              onCountryChange(val);
              onStateChange(''); // Clear dependent fields
              onCityChange('');
            }}
            options={countries}
            placeholder={isLoading.countries ? "Loading countries..." : "Select Country"}
            disabled={isLoading.countries}
          />
        </FormFieldGroup>
      </div>
      <div className="mts-emp-form-row">
        <FormFieldGroup label="State / Province" error={errors.state}>
          <SelectField
            value={stateValue}
            onChange={(e) => {
              const val = e.target.value;
              onStateChange(val);
              onCityChange(''); // Clear dependent field
            }}
            options={states}
            placeholder={!countryValue ? "Select a country first" : (isLoading.states ? "Loading states..." : "Select State")}
            disabled={!countryValue || isLoading.states}
          />
        </FormFieldGroup>
        <FormFieldGroup label="City" error={errors.city}>
          <SelectField
            value={cityValue}
            onChange={(e) => onCityChange(e.target.value)}
            options={cities}
            placeholder={!stateValue ? "Select a state first" : (isLoading.cities ? "Loading cities..." : "Select City")}
            disabled={!stateValue || isLoading.cities}
          />
        </FormFieldGroup>
      </div>
    </>
  );
};

export default React.memo(GeoLocationSelector);
