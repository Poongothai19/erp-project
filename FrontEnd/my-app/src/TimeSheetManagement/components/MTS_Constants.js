export const INVOICE_STATUS = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

export const INVOICE_FORM_INITIAL_STATE = {
  invoiceNumber: '',
  contractorId: '',
  contractorName: '',
  companyName: '',
  email: '',
  amount: '',
  issueDate: '',
  dueDate: '',
  description: '',
  paymentTerms: 'Net 30',
  status: 'Draft',
  notes: ''
};

export const C2C_FORM_INITIAL_STATE = {
  contractorName: '',
  companyName: '',
  email: '',
  phone: '',
  streetAddress: '',
  apartmentSuite: '',
  city: '',
  state: '',
  zipCode: '',
  ein: '',
  stateOfIncorporation: '',
  bankAccountHolder: '',
  bankAccountNumber: '',
  bankRoutingNumber: '',
  bankName: '',
  poStartDate: '',
  poEndDate: '',
  billRate: '',
  c2cBillRate: '',
  paymentMode: 'Bank Transfer',
  paymentTerms: '',
  clientName: '',
  implementationPartner: '',
  jobTitle: '',
  workAuthorization: '',
  linkedInUrl: '',
  vendorWebsite: '',
  vendorIndustry: '',
  hireDate: '',
  status: 'Active',
  notes: ''
};

export const PAYMENT_MODES = ['Bank Transfer', 'Wire Transfer', 'ACH', 'Check'];

export const EMPLOYEE_FORM_INITIAL_STATE = {
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  employmentType: 'Full-time',
  status: 'Active',
  paperless: 'Not enrolled',
  hireDate: '',
  streetAddress: '',
  apartmentSuite: '',
  city: '',
  state: '',
  zipCode: '',
  countryId: '', // Adding IDs for DB-driven selection
  stateId: '',
  cityId: '',
  country: '',
  employeeId: '',
  username: '',
  password: '',
  createAccount: false,
  visaStatus: 'US Citizen',
  visaNumber: '',
  visaIssueDate: '',
  visaExpiryDate: '',
  projectName: '',
  clientName: '',
  projectStartDate: '',
  projectEndDate: '',
  billRate: '',
  projectStatus: 'Active',
  retirement401kEnrolled: false,
  retirement401kPercentage: '',
  medicalInsuranceEnrolled: false,
  medicalInsurancePlan: '',
  medicalInsuranceEffectiveDate: '',
  supervisorEmployeeId: '',
  backupSupervisorEmployeeId: '',
  timesheetRequired: true,
  emergencyContactName: '',
  emergencyContactPhone: '',
  mailingStreetAddress: '',
  mailingApartmentSuite: '',
  mailingCityId: '',
  mailingStateId: '',
  mailingCountryId: '',
  mailingZipCode: '',
  phoneCountryCode: '+1',
  emergencyPhoneCountryCode: '+1'
};

export const PROJECTS = [
  'Alpha Development', 'Beta Optimization', 'Gamma Integration', 'Delta Security',
  'Epsilon Cloud Migration', 'Zeta AI implementation', 'Eta Marketing Campaign',
  'Theta Resource Planning', 'Iota Infrastructure Upgrade'
];

export const CLIENTS = [
  'Tech Solutions Inc.', 'Global Dynamics', 'Innovate Corp', 'Prime Services',
  'Nexus Systems', 'Starlight Industries', 'Crestwood Group', 'Visionary Soft'
];

export const STATES_BY_COUNTRY = {
  'United States': [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ],
  'Canada': [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon'
  ],
  'Australia': [
    'New South Wales', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 
    'Western Australia', 'Australian Capital Territory', 'Northern Territory'
  ],
  'India': [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland'
  ],
  'Germany': [
    'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 
    'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 
    'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
  ],
  'France': [
    'Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 
    'Nouvelle-Aquitaine', 'Occitanie', 'Bourgogne-Franche-Comté', 'Brittany', 
    'Normandy', 'Hauts-de-France', 'Grand Est', 'Centre-Val de Loire', 'Pays de la Loire'
  ],
  'Japan': [
    'Aichi', 'Akita', 'Aomori', 'Chiba', 'Ehime', 'Fukui', 'Fukuoka', 'Fukushima', 
    'Gifu', 'Gunma', 'Hiroshima', 'Hokkaido', 'Hyogo', 'Ibaraki', 'Ishikawa', 'Iwate', 
    'Kagawa', 'Kagoshima', 'Kanagawa', 'Kochi', 'Kumamoto', 'Kyoto', 'Mie', 'Miyagi', 
    'Miyazaki', 'Nagano', 'Nagasaki', 'Nara', 'Niigata', 'Okinawa', 'Osaka', 'Saga', 
    'Saitama', 'Shiga', 'Shimane', 'Shizuoka', 'Tochigi', 'Tokushima', 'Tokyo', 'Tottori', 
    'Toyama', 'Wakayama', 'Yamagata', 'Yamaguchi', 'Yamanashi'
  ]
};

export const POSITIONS = [
  'Software Engineer', 'Senior Software Engineer', 'Software Architect', 'Frontend Developer',
  'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Engineer',
  'Data Scientist', 'Machine Learning Engineer', 'Product Manager', 'Project Manager',
  'Business Analyst', 'QA Engineer', 'QA Manager', 'UX/UI Designer', 'Graphic Designer',
  'Marketing Manager', 'Sales Manager', 'Sales Representative', 'HR Manager',
  'Human Resources Specialist', 'Finance Manager', 'Accountant', 'Operations Manager',
  'Customer Success Manager', 'Technical Support Engineer', 'Support Specialist',
  'IT Manager', 'System Administrator', 'Network Administrator', 'Security Engineer',
  'Technical Writer', 'Solutions Architect'
];

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract'];
export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'On Leave'];
export const TIMESHEET_STATUSES = ['Pending', 'Approved', 'Rejected'];
export const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'IT', 'Customer Support', 'Legal', 'R&D', 'Administration', 'Procurement', 'Logistics', 'Quality Assurance', 'Product Management', 'Design', 'Business Development', 'Public Relations', 'Training', 'Security', 'Maintenance', 'Facilities', 'Compliance', 'Strategy', 'Analytics', 'Content', 'Social Media', 'Events', 'Investor Relations', 'Corporate Communications', 'Sustainability', 'Innovation'];

export const COUNTRY_CODES = [
  { code: '+1', label: '+1 (USA/Canada)' },
  { code: '+91', label: '+91 (India)' },
  { code: '+44', label: '+44 (UK)' },
  { code: '+61', label: '+61 (Australia)' },
  { code: '+49', label: '+49 (Germany)' },
  { code: '+33', label: '+33 (France)' },
  { code: '+81', label: '+81 (Japan)' },
  { code: '+86', label: '+86 (China)' },
  { code: '+7', label: '+7 (Russia)' },
  { code: '+55', label: '+55 (Brazil)' },
  { code: '+27', label: '+27 (South Africa)' },
  { code: '+971', label: '+971 (UAE)' },
  { code: '+65', label: '+65 (Singapore)' },
  { code: '+49', label: '+49 (Germany)' },
  { code: '+39', label: '+39 (Italy)' },
  { code: '+34', label: '+34 (Spain)' },
  { code: '+52', label: '+52 (Mexico)' }
];
