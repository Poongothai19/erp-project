// ═══════════════════════════════════════════════════════════════════════
//  mockData.js — COMPLETE schema from recruit.docx (all 8 tables)
//
//  TABLE 1 — recruit.Candidate
//    FirstName, LastName, MiddleName, JobTitle, YearsOfExperience,
//    ProfileSummary, LinkedInUrl, GitHubUrl, Gender,
//    CandidateCode (auto: CAN-XXXXXX),
//    CandidateStatus (auto default: 'Available'),
//    RemoteStatus    (auto default: 'OnSite')
//
//  TABLE 2 — recruit.CandidateIdentity
//    IdentityType ('EMAIL' | 'PHONE'), IdentityValue
//
//  TABLE 3 — recruit.CandidateDocument
//    FileNameOriginal, FileExtension, MimeType, FileSizeBytes,
//    StorageLocator, StorageProvider ('S3+DB' | 'DB'), StorageRegion,
//    ParsedText,
//    DocumentType  (auto: 'RESUME'),
//    IsPrimaryResume (auto: 1 / true),
//    ParseStatus   (auto: 'PARSED')
//
//  TABLE 4 — recruit.ResumeParseRun
//    RawPayloadJson, ExtractedEmail, ExtractedPhone,
//    ParserVendor (auto: 'Groq/llama-3.1-8b-instant'),
//    Status       (auto: 'SUCCESS')
//
//  TABLE 5 — recruit.Skill + recruit.CandidateSkill
//    SkillName (matched from KNOWN_SKILLS list),
//    CandidateSkill (link record),
//    SkillType (auto default: 'HARD')
//
//  TABLE 6 — recruit.CandidateEducation
//    Institution, Degree, FieldOfStudy, StartDate, EndDate, GPA
//
//  TABLE 7 — recruit.CandidateCertification
//    CertificationName, IssuingOrganization, IssueDate, ExpiryDate,
//    CredentialId, CredentialUrl
//
//  TABLE 8 — recruit.CandidateWorkExperience
//    Company, JobTitle, StartDate, EndDate, IsCurrent, Description
// ═══════════════════════════════════════════════════════════════════════

// ─── Formatter helpers ─────────────────────────────────────────────────
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
  });
};

export const formatMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  return new Date(Number(year), parseInt(month, 10) - 1)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Convenience helpers to read from Identities array ─────────────────
export const getEmail = (candidate) =>
  candidate?.Identities?.find(i => i.IdentityType === 'EMAIL')?.IdentityValue || '';

export const getPhone = (candidate) =>
  candidate?.Identities?.find(i => i.IdentityType === 'PHONE')?.IdentityValue || '';

// ─── Filter/dropdown constants ──────────────────────────────────────────
export const CANDIDATE_STATUS_OPTIONS = [
  { value: 'all',           label: 'All Statuses' },
  { value: 'Available',     label: 'Available' },
  { value: 'In Process',    label: 'In Process' },
  { value: 'Hired',         label: 'Hired' },
  { value: 'Not Available', label: 'Not Available' },
  { value: 'On Hold',       label: 'On Hold' },
];

export const REMOTE_STATUS_OPTIONS = [
  { value: 'all',    label: 'All Types' },
  { value: 'Remote', label: 'Remote' },
  { value: 'OnSite', label: 'On-Site' },
  { value: 'Hybrid', label: 'Hybrid' },
];

export const DATE_OPTIONS = [
  { value: 'all',     label: 'All Time' },
  { value: 'today',   label: 'Today' },
  { value: 'week',    label: 'Last 7 Days' },
  { value: 'month',   label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 3 Months' },
];

export const GENDER_OPTIONS      = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
export const REMOTE_OPTIONS      = ['Remote', 'OnSite', 'Hybrid'];
export const STATUS_OPTIONS_FORM = ['Available', 'In Process', 'Hired', 'Not Available', 'On Hold'];
export const SKILL_TYPE_OPTIONS  = ['HARD', 'SOFT'];
export const STORAGE_PROVIDERS   = ['S3+DB', 'DB'];
export const DOCUMENT_TYPES      = ['RESUME', 'COVER_LETTER', 'PORTFOLIO', 'OTHER'];
export const PARSE_STATUSES      = ['PARSED', 'PENDING', 'FAILED'];
export const PARSER_VENDORS      = ['Groq/llama-3.1-8b-instant'];
export const IDENTITY_TYPES      = ['EMAIL', 'PHONE'];

export const WORK_AUTHORIZATION_OPTIONS = ['US Citizen', 'Green Card', 'H1B', 'H4 EAD', 'L2 EAD', 'OPT/CPT', 'Other'];
export const EMPLOYMENT_TYPE_OPTIONS    = ['Full-Time', 'Part-Time', 'Contract (C2C)', 'Contract (W2)', 'Contract (1099)', 'Freelance', 'Internship'];
export const SECURITY_CLEARANCE_OPTIONS = ['None', 'Public Trust', 'Secret', 'Top Secret', 'TS/SCI'];
export const RATE_TYPE_OPTIONS          = ['Hourly', 'Daily', 'Annually', 'Monthly'];
export const MARITAL_STATUS_OPTIONS     = ['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'];
export const INDUSTRY_OPTIONS           = ['Information Technology', 'Healthcare', 'Finance & Banking', 'Education', 'Manufacturing', 'Retail', 'Telecommunications', 'Other'];

// ─── Mock candidates (every field from all 8 tables) ───────────────────
export const MOCK_CANDIDATES = [

  // ══════════════════════════════════════════════════════════════
  //  Candidate 1
  // ══════════════════════════════════════════════════════════════
  {
    // ── TABLE 1: recruit.Candidate ───────────────────────────────
    CandidateId:       1,
    CandidateCode:     'CAN-000001',         // auto: CAN-XXXXXX
    FirstName:         'Sarah',
    LastName:          'Mitchell',
    MiddleName:        'Anne',
    JobTitle:          'Senior Software Engineer',
    YearsOfExperience: 7,
    ProfileSummary:    'Full-stack engineer with 7 years of experience building scalable SaaS products. Expert in React, Node.js, and AWS infrastructure.',
    LinkedInUrl:       'https://linkedin.com/in/sarahmitchell',
    GitHubUrl:         'https://github.com/sarahmitchell',
    Gender:            'Female',
    CandidateStatus:   'Available',           // auto default
    RemoteStatus:      'Remote',              // auto default: 'OnSite'
    CreatedBy:         'admin',
    CreatedDt:         '2025-01-15T10:30:00Z',
    UpdatedDt:         '2025-01-20T14:00:00Z',

    // ── TABLE 2: recruit.CandidateIdentity ──────────────────────
    // Each identity is a row: IdentityType + IdentityValue
    Identities: [
      { IdentityType: 'EMAIL', IdentityValue: 'sarah.mitchell@email.com' },
      { IdentityType: 'PHONE', IdentityValue: '+1 (415) 555-0192' },
    ],

    // ── TABLE 3: recruit.CandidateDocument ──────────────────────
    Document: {
      FileNameOriginal: 'Sarah_Mitchell_Resume_2025.pdf',
      FileExtension:    '.pdf',
      MimeType:         'application/pdf',
      FileSizeBytes:    245890,
      StorageLocator:   's3://recruit-docs/CAN-000001/Sarah_Mitchell_Resume_2025.pdf',
      StorageProvider:  'S3+DB',
      StorageRegion:    'us-east-1',
      ParsedText:       'Sarah Mitchell | Senior Software Engineer | sarah.mitchell@email.com | +1 (415) 555-0192 | React, Node.js, TypeScript, AWS, PostgreSQL ...',
      DocumentType:     'RESUME',             // auto
      IsPrimaryResume:  true,                 // auto: 1
      ParseStatus:      'PARSED',             // auto
    },

    // ── TABLE 4: recruit.ResumeParseRun ─────────────────────────
    ParseRun: {
      RawPayloadJson: JSON.stringify({
        firstName: 'Sarah', lastName: 'Mitchell',
        email: 'sarah.mitchell@email.com', phone: '+1 (415) 555-0192',
        skills: ['React','Node.js','TypeScript','AWS','PostgreSQL'],
      }),
      ExtractedEmail: 'sarah.mitchell@email.com',
      ExtractedPhone: '+1 (415) 555-0192',
      ParserVendor:   'Groq/llama-3.1-8b-instant',  // auto
      Status:         'SUCCESS',                      // auto
    },

    // ── TABLE 5: recruit.Skill + recruit.CandidateSkill ─────────
    // SkillType defaults to 'HARD'; override to 'SOFT' where needed
    Skills: [
      { SkillName: 'React',           SkillType: 'HARD' },
      { SkillName: 'Node.js',         SkillType: 'HARD' },
      { SkillName: 'TypeScript',      SkillType: 'HARD' },
      { SkillName: 'AWS',             SkillType: 'HARD' },
      { SkillName: 'PostgreSQL',      SkillType: 'HARD' },
      { SkillName: 'Team Leadership', SkillType: 'SOFT' },
    ],

    // ── TABLE 6: recruit.CandidateEducation ─────────────────────
    Education: [
      {
        Institution:  'University of California, Berkeley',
        Degree:       'B.S.',
        FieldOfStudy: 'Computer Science',
        StartDate:    '2014-09',
        EndDate:      '2018-05',
        GPA:          '3.8',
      },
    ],

    // ── TABLE 7: recruit.CandidateCertification ──────────────────
    Certifications: [
      {
        CertificationName:   'AWS Solutions Architect',
        IssuingOrganization: 'Amazon Web Services',
        IssueDate:           '2022-03',
        ExpiryDate:          '2025-03',
        CredentialId:        'AWS-SAA-2022-001',
        CredentialUrl:       'https://aws.amazon.com/verify',
      },
    ],

    // ── TABLE 8: recruit.CandidateWorkExperience ─────────────────
    WorkExperience: [
      {
        Company:     'Stripe',
        JobTitle:    'Senior Software Engineer',
        StartDate:   '2021-06',
        EndDate:     null,
        IsCurrent:   true,
        Description: 'Led development of payment processing microservices serving 50M+ transactions daily.',
      },
      {
        Company:     'Airbnb',
        JobTitle:    'Software Engineer',
        StartDate:   '2018-07',
        EndDate:     '2021-05',
        IsCurrent:   false,
        Description: 'Built search and discovery features for the main consumer platform.',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  Candidate 2
  // ══════════════════════════════════════════════════════════════
  {
    CandidateId:       2,
    CandidateCode:     'CAN-000002',
    FirstName:         'Marcus',
    LastName:          'Chen',
    MiddleName:        '',
    JobTitle:          'Data Scientist',
    YearsOfExperience: 5,
    ProfileSummary:    'Data scientist specialising in NLP and computer vision with strong Python and ML engineering skills.',
    LinkedInUrl:       'https://linkedin.com/in/marcuschen',
    GitHubUrl:         'https://github.com/marcuschen',
    Gender:            'Male',
    CandidateStatus:   'In Process',
    RemoteStatus:      'Hybrid',
    CreatedBy:         'recruiter1',
    CreatedDt:         '2025-01-18T09:00:00Z',
    UpdatedDt:         null,

    Identities: [
      { IdentityType: 'EMAIL', IdentityValue: 'marcus.chen@email.com' },
      { IdentityType: 'PHONE', IdentityValue: '+1 (650) 555-0234' },
    ],

    Document: {
      FileNameOriginal: 'Marcus_Chen_CV.docx',
      FileExtension:    '.docx',
      MimeType:         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      FileSizeBytes:    128000,
      StorageLocator:   's3://recruit-docs/CAN-000002/Marcus_Chen_CV.docx',
      StorageProvider:  'S3+DB',
      StorageRegion:    'us-east-1',
      ParsedText:       'Marcus Chen | Data Scientist | marcus.chen@email.com | Python, TensorFlow, PyTorch, SQL, Spark ...',
      DocumentType:     'RESUME',
      IsPrimaryResume:  true,
      ParseStatus:      'PARSED',
    },

    ParseRun: {
      RawPayloadJson: JSON.stringify({
        firstName: 'Marcus', lastName: 'Chen',
        email: 'marcus.chen@email.com', phone: '+1 (650) 555-0234',
        skills: ['Python','TensorFlow','PyTorch','SQL','Spark'],
      }),
      ExtractedEmail: 'marcus.chen@email.com',
      ExtractedPhone: '+1 (650) 555-0234',
      ParserVendor:   'Groq/llama-3.1-8b-instant',
      Status:         'SUCCESS',
    },

    Skills: [
      { SkillName: 'Python',     SkillType: 'HARD' },
      { SkillName: 'TensorFlow', SkillType: 'HARD' },
      { SkillName: 'PyTorch',    SkillType: 'HARD' },
      { SkillName: 'SQL',        SkillType: 'HARD' },
      { SkillName: 'Spark',      SkillType: 'HARD' },
    ],

    Education: [
      { Institution: 'Stanford University', Degree: 'M.S.', FieldOfStudy: 'Statistics',  StartDate: '2018-09', EndDate: '2020-06', GPA: '3.9' },
      { Institution: 'UCLA',                Degree: 'B.S.', FieldOfStudy: 'Mathematics', StartDate: '2014-09', EndDate: '2018-06', GPA: '3.7' },
    ],

    Certifications: [],

    WorkExperience: [
      { Company: 'Netflix', JobTitle: 'Data Scientist', StartDate: '2020-08', EndDate: null, IsCurrent: true, Description: 'Developed recommendation algorithms improving engagement by 18%.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  Candidate 3
  // ══════════════════════════════════════════════════════════════
  {
    CandidateId:       3,
    CandidateCode:     'CAN-000003',
    FirstName:         'Priya',
    LastName:          'Nair',
    MiddleName:        'R.',
    JobTitle:          'Product Manager',
    YearsOfExperience: 9,
    ProfileSummary:    'Strategic product leader with 9 years of experience shipping consumer and enterprise products in fintech and healthtech.',
    LinkedInUrl:       'https://linkedin.com/in/priyanair',
    GitHubUrl:         '',
    Gender:            'Female',
    CandidateStatus:   'Available',
    RemoteStatus:      'OnSite',
    CreatedBy:         'recruiter2',
    CreatedDt:         '2025-01-20T11:00:00Z',
    UpdatedDt:         '2025-01-22T16:30:00Z',

    Identities: [
      { IdentityType: 'EMAIL', IdentityValue: 'priya.nair@email.com' },
      { IdentityType: 'PHONE', IdentityValue: '+44 7700 900321' },
    ],

    Document: {
      FileNameOriginal: 'Priya_Nair_Resume.pdf',
      FileExtension:    '.pdf',
      MimeType:         'application/pdf',
      FileSizeBytes:    312000,
      StorageLocator:   's3://recruit-docs/CAN-000003/Priya_Nair_Resume.pdf',
      StorageProvider:  'S3+DB',
      StorageRegion:    'eu-west-1',
      ParsedText:       'Priya Nair | Product Manager | priya.nair@email.com | Roadmapping, Agile, User Research, Figma, SQL ...',
      DocumentType:     'RESUME',
      IsPrimaryResume:  true,
      ParseStatus:      'PARSED',
    },

    ParseRun: {
      RawPayloadJson: JSON.stringify({
        firstName: 'Priya', lastName: 'Nair',
        email: 'priya.nair@email.com', phone: '+44 7700 900321',
        skills: ['Roadmapping','Agile','User Research','Figma','SQL'],
      }),
      ExtractedEmail: 'priya.nair@email.com',
      ExtractedPhone: '+44 7700 900321',
      ParserVendor:   'Groq/llama-3.1-8b-instant',
      Status:         'SUCCESS',
    },

    Skills: [
      { SkillName: 'Product Strategy',       SkillType: 'SOFT' },
      { SkillName: 'Roadmapping',            SkillType: 'HARD' },
      { SkillName: 'Agile / Scrum',          SkillType: 'HARD' },
      { SkillName: 'User Research',          SkillType: 'HARD' },
      { SkillName: 'Stakeholder Management', SkillType: 'SOFT' },
      { SkillName: 'Figma',                  SkillType: 'HARD' },
      { SkillName: 'SQL',                    SkillType: 'HARD' },
    ],

    Education: [
      { Institution: 'London Business School', Degree: 'MBA', FieldOfStudy: 'Technology Management', StartDate: '2016-09', EndDate: '2018-07', GPA: '' },
    ],

    Certifications: [
      { CertificationName: 'Certified Scrum Product Owner', IssuingOrganization: 'Scrum Alliance', IssueDate: '2020-04', ExpiryDate: '2026-04', CredentialId: 'CSPO-2020-4821', CredentialUrl: '' },
    ],

    WorkExperience: [
      { Company: 'Revolut', JobTitle: 'Senior Product Manager', StartDate: '2022-01', EndDate: null, IsCurrent: true, Description: 'Owned the savings and investments product line, 3M+ active users.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  Candidate 4
  // ══════════════════════════════════════════════════════════════
  {
    CandidateId:       4,
    CandidateCode:     'CAN-000004',
    FirstName:         'James',
    LastName:          'Torres',
    MiddleName:        '',
    JobTitle:          'DevOps Engineer',
    YearsOfExperience: 6,
    ProfileSummary:    'DevOps engineer with deep expertise in Kubernetes, Terraform, and CI/CD pipeline automation at scale.',
    LinkedInUrl:       'https://linkedin.com/in/jamestorres',
    GitHubUrl:         'https://github.com/jamestorres',
    Gender:            'Male',
    CandidateStatus:   'Hired',
    RemoteStatus:      'Remote',
    CreatedBy:         'admin',
    CreatedDt:         '2025-01-10T08:00:00Z',
    UpdatedDt:         '2025-01-25T12:00:00Z',

    Identities: [
      { IdentityType: 'EMAIL', IdentityValue: 'james.torres@email.com' },
      { IdentityType: 'PHONE', IdentityValue: '+1 (512) 555-0387' },
    ],

    Document: {
      FileNameOriginal: 'JTorres_DevOps_Resume.pdf',
      FileExtension:    '.pdf',
      MimeType:         'application/pdf',
      FileSizeBytes:    198000,
      StorageLocator:   's3://recruit-docs/CAN-000004/JTorres_DevOps_Resume.pdf',
      StorageProvider:  'S3+DB',
      StorageRegion:    'us-east-1',
      ParsedText:       'James Torres | DevOps Engineer | james.torres@email.com | Kubernetes, Terraform, Docker, Jenkins, GCP ...',
      DocumentType:     'RESUME',
      IsPrimaryResume:  true,
      ParseStatus:      'PARSED',
    },

    ParseRun: {
      RawPayloadJson: JSON.stringify({
        firstName: 'James', lastName: 'Torres',
        email: 'james.torres@email.com', phone: '+1 (512) 555-0387',
        skills: ['Kubernetes','Terraform','Docker','Jenkins','GCP'],
      }),
      ExtractedEmail: 'james.torres@email.com',
      ExtractedPhone: '+1 (512) 555-0387',
      ParserVendor:   'Groq/llama-3.1-8b-instant',
      Status:         'SUCCESS',
    },

    Skills: [
      { SkillName: 'Kubernetes', SkillType: 'HARD' },
      { SkillName: 'Terraform',  SkillType: 'HARD' },
      { SkillName: 'Docker',     SkillType: 'HARD' },
      { SkillName: 'Jenkins',    SkillType: 'HARD' },
      { SkillName: 'GCP',        SkillType: 'HARD' },
      { SkillName: 'Python',     SkillType: 'HARD' },
    ],

    Education: [
      { Institution: 'University of Texas at Austin', Degree: 'B.S.', FieldOfStudy: 'Information Systems', StartDate: '2013-09', EndDate: '2017-05', GPA: '3.5' },
    ],

    Certifications: [
      { CertificationName: 'Certified Kubernetes Administrator', IssuingOrganization: 'CNCF', IssueDate: '2023-01', ExpiryDate: '2026-01', CredentialId: 'CKA-2023-0091', CredentialUrl: 'https://cncf.io/verify' },
    ],

    WorkExperience: [
      { Company: 'Cloudflare', JobTitle: 'DevOps Engineer', StartDate: '2020-03', EndDate: null, IsCurrent: true, Description: 'Manages multi-region Kubernetes clusters across 200+ edge nodes.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  Candidate 5
  // ══════════════════════════════════════════════════════════════
  {
    CandidateId:       5,
    CandidateCode:     'CAN-000005',
    FirstName:         'Aisha',
    LastName:          'Okonkwo',
    MiddleName:        '',
    JobTitle:          'UX Designer',
    YearsOfExperience: 4,
    ProfileSummary:    'UX designer focused on accessibility and inclusive design, with a proven track record in B2B SaaS products.',
    LinkedInUrl:       'https://linkedin.com/in/aishaokonkwo',
    GitHubUrl:         '',
    Gender:            'Female',
    CandidateStatus:   'Available',
    RemoteStatus:      'Hybrid',
    CreatedBy:         'recruiter1',
    CreatedDt:         '2025-01-22T14:00:00Z',
    UpdatedDt:         null,

    Identities: [
      { IdentityType: 'EMAIL', IdentityValue: 'aisha.okonkwo@email.com' },
      { IdentityType: 'PHONE', IdentityValue: '+234 803 555 0041' },
    ],

    Document: {
      FileNameOriginal: 'Aisha_Okonkwo_Portfolio_Resume.pdf',
      FileExtension:    '.pdf',
      MimeType:         'application/pdf',
      FileSizeBytes:    520000,
      StorageLocator:   's3://recruit-docs/CAN-000005/Aisha_Okonkwo_Portfolio_Resume.pdf',
      StorageProvider:  'S3+DB',
      StorageRegion:    'eu-west-1',
      ParsedText:       'Aisha Okonkwo | UX Designer | aisha.okonkwo@email.com | Figma, User Research, Prototyping, WCAG, Design Systems ...',
      DocumentType:     'RESUME',
      IsPrimaryResume:  true,
      ParseStatus:      'PARSED',
    },

    ParseRun: {
      RawPayloadJson: JSON.stringify({
        firstName: 'Aisha', lastName: 'Okonkwo',
        email: 'aisha.okonkwo@email.com', phone: '+234 803 555 0041',
        skills: ['Figma','User Research','Prototyping','Accessibility (WCAG)','Design Systems'],
      }),
      ExtractedEmail: 'aisha.okonkwo@email.com',
      ExtractedPhone: '+234 803 555 0041',
      ParserVendor:   'Groq/llama-3.1-8b-instant',
      Status:         'SUCCESS',
    },

    Skills: [
      { SkillName: 'Figma',                SkillType: 'HARD' },
      { SkillName: 'User Research',        SkillType: 'HARD' },
      { SkillName: 'Prototyping',          SkillType: 'HARD' },
      { SkillName: 'Accessibility (WCAG)', SkillType: 'HARD' },
      { SkillName: 'Design Systems',       SkillType: 'HARD' },
    ],

    Education: [
      { Institution: 'RISD', Degree: 'B.F.A.', FieldOfStudy: 'Graphic Design', StartDate: '2017-09', EndDate: '2021-05', GPA: '3.9' },
    ],

    Certifications: [],

    WorkExperience: [
      { Company: 'HubSpot', JobTitle: 'UX Designer', StartDate: '2021-07', EndDate: null, IsCurrent: true, Description: 'Redesigned core CRM workflows, reducing task completion time by 34%.' },
    ],
  },
];

// ── Legacy alias keeps old  import { mockCandidates }  working ──────────
export const mockCandidates = MOCK_CANDIDATES;