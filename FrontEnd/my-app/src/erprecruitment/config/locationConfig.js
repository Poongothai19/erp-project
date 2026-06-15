
export const countriesData = [
  { name: "India", code: "IN" },
  { name: "United States", code: "US" },
  { name: "United Kingdom", code: "GB" },
  { name: "Canada", code: "CA" },
  { name: "Australia", code: "AU" }
];

export const stateMapping = {
  "IN": {
    // States (28)
    "Andhra Pradesh": "AP",
    "Arunachal Pradesh": "AR",
    "Assam": "AS",
    "Bihar": "BR",
    "Chhattisgarh": "CG",
    "Goa": "GA",
    "Gujarat": "GJ",
    "Haryana": "HR",
    "Himachal Pradesh": "HP",
    "Jharkhand": "JH",
    "Karnataka": "KA",
    "Kerala": "KL",
    "Madhya Pradesh": "MP",
    "Maharashtra": "MH",
    "Manipur": "MN",
    "Meghalaya": "ML",
    "Mizoram": "MZ",
    "Nagaland": "NL",
    "Odisha": "OD",
    "Punjab": "PB",
    "Rajasthan": "RJ",
    "Sikkim": "SK",
    "Tamil Nadu": "TN",
    "Telangana": "TG",
    "Tripura": "TR",
    "Uttar Pradesh": "UP",
    "Uttarakhand": "UK",
    "West Bengal": "WB",
    // Union Territories (8)
    "Andaman and Nicobar Islands": "AN",
    "Chandigarh": "CH",
    "Dadra and Nagar Haveli and Daman and Diu": "DH",
    "Delhi": "DL",
    "Jammu and Kashmir": "JK",
    "Ladakh": "LA",
    "Lakshadweep": "LD",
    "Puducherry": "PY"
  },
  "US": {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY"
  },
  "GB": {
    "England": "ENG",
    "Scotland": "SCT",
    "Wales": "WLS",
    "Northern Ireland": "NIR"
  },
  "CA": {
    "Alberta": "AB",
    "British Columbia": "BC",
    "Manitoba": "MB",
    "New Brunswick": "NB",
    "Newfoundland and Labrador": "NL",
    "Northwest Territories": "NT",
    "Nova Scotia": "NS",
    "Nunavut": "NU",
    "Ontario": "ON",
    "Prince Edward Island": "PE",
    "Quebec": "QC",
    "Saskatchewan": "SK",
    "Yukon": "YT"
  },
  "AU": {
    "Australian Capital Territory": "ACT",
    "New South Wales": "NSW",
    "Northern Territory": "NT",
    "Queensland": "QLD",
    "South Australia": "SA",
    "Tasmania": "TAS",
    "Victoria": "VIC",
    "Western Australia": "WA"
  }
};

// Helper function to get country code from name
export const getCountryCode = (countryName) => {
  const country = countriesData.find(c => c.name === countryName);
  return country ? country.code : countryName;
};

// Helper function to get country name from code
export const getCountryName = (countryCode) => {
  const country = countriesData.find(c => c.code === countryCode);
  return country ? country.name : countryCode;
};

// Helper function to get state code from state name
export const getStateCode = (countryCode, stateName) => {
  return stateMapping[countryCode]?.[stateName] || stateName;
};

// Helper function to get state name from state code
export const getStateName = (countryCode, stateCode) => {
  const states = stateMapping[countryCode];
  if (!states) return stateCode;
  
  const entry = Object.entries(states).find(([name, code]) => code === stateCode);
  return entry ? entry[0] : stateCode;
};

// Helper function to get all state names for a country
export const getStatesForCountry = (countryCode) => {
  const states = stateMapping[countryCode];
  return states ? Object.keys(states) : [];
};

// Helper function to get states by country name (for backward compatibility)
export const getStatesByCountryName = (countryName) => {
  const countryCode = getCountryCode(countryName);
  return getStatesForCountry(countryCode);
};

// Format location for display (handles both codes and full names)
export const formatLocation = (role) => {
  if (!role.city && !role.state && !role.country) {
    return 'N/A';
  }

  const countryCode = role.country; // Use code directly
  
  try {
    const cities = role.city ? role.city.split(',').map(c => c.trim()).filter(c => c) : [];
    const stateValues = role.state ? role.state.split(',').map(s => s.trim()).filter(s => s) : [];
    
    // Convert state names to codes if they are full names
    const stateCodes = stateValues.map(stateValue => {
      // Check if it's already a code (2-3 characters) or a full name
      if (stateValue.length <= 3) {
        return stateValue; // Already a code
      }
      // Convert full name to code
      return getStateCode(countryCode, stateValue);
    });
   
    if (cities.length > 0 && stateCodes.length > 0 && cities.length === stateCodes.length) {
      return cities.map((city, index) =>
        `${city}, ${stateCodes[index]}, ${countryCode}`
      ).join(' | ');
    }
   
    if (cities.length > 0) {
      const cityStatePairs = cities.map(city => {
        const matchingState = stateCodes.length > 0 ? stateCodes[0] : '';
        return matchingState ? `${city}, ${matchingState}, ${countryCode}` : `${city}, ${countryCode}`;
      });
      return cityStatePairs.join(' | ');
    }
    
    const parts = [
      role.city,
      stateCodes.join(', '),
      countryCode
    ].filter(part => part && part.trim());
    
    return parts.join(', ');
  } catch (error) {
    console.error('Error formatting location:', error);
    return `${role.city || ''}, ${role.state || ''}, ${countryCode}`.replace(/^,\s*|\s*,/g, '').trim();
  }
};