// OnboardingModule/utils/stepTemplates.js
export const getStepTemplates = (type = 'c2c') => {
  const templates = {
    c2c: [
      {
        id: 1,
        title: "Candidate Accepts Offer",
        description: "Candidate accepts the employment offer",
        icon: "LuCheckCircle",
        order: 1,
        type: "document",
        isRequired: true,
        instructions: "Formal acceptance of the employment offer",
        documents: ["Offer Letter Acceptance"]
      },
      {
        id: 2,
        title: "Send Compliance Documents",
        description: "System sends 3 compliance documents to candidate's email",
        icon: "LuMail",
        order: 2,
        type: "email",
        isRequired: true,
        instructions: "Dear {candidate_name},\n\nPlease find attached the compliance documents for your onboarding process.\n\n1. Compliance Document 1\n2. Compliance Document 2\n3. Compliance Document 3\n\nPlease review and sign.",
        documents: ["Compliance Doc 1", "Compliance Doc 2", "Compliance Doc 3"]
      },
      {
        id: 3,
        title: "Employer Login & Company Info",
        description: "Employer enters company information",
        icon: "LuBuilding",
        order: 3,
        type: "document",
        isRequired: true,
        instructions: "Employer completes company information form",
        documents: ["Company Information Form"]
      },
      {
        id: 4,
        title: "Sign MSA",
        description: "Master Service Agreement with TCS details",
        icon: "LuFileSignature",
        order: 4,
        type: "signature",
        isRequired: true,
        instructions: "Digital signing of Master Service Agreement",
        documents: ["MSA Document", "TCS Details Sheet"]
      },
      {
        id: 5,
        title: "Upload Company Documents",
        description: "COI, I-9, ID, and other required documents",
        icon: "LuUpload",
        order: 5,
        type: "document",
        isRequired: true,
        instructions: "Upload all required company documents",
        documents: ["Certificate of Insurance", "I-9 Form", "Company ID", "Business License", "W-9 Form"]
      },
      {
        id: 6,
        title: "Get PO (Purchase Order)",
        description: "Obtain purchase order for services",
        icon: "LuFileText",
        order: 6,
        type: "document",
        isRequired: true,
        instructions: "Purchase order generation and approval",
        documents: ["Purchase Order"]
      },
      {
        id: 7,
        title: "ACH Payment Setup",
        description: "Set up direct deposit for payments",
        icon: "LuCreditCard",
        order: 7,
        type: "payment",
        isRequired: true,
        instructions: "Complete ACH authorization form",
        documents: ["ACH Authorization Form", "Voided Check", "Bank Letter"]
      },
      {
        id: 8,
        title: "Additional Documents",
        description: "Upload any additional requested documents",
        icon: "LuUpload",
        order: 8,
        type: "document",
        isRequired: false,
        instructions: "Optional document upload",
        documents: []
      }
    ],
    
    w2: [
      {
        id: 1,
        title: "Background Check Initiation",
        description: "Start background verification process",
        icon: "LuShield",
        order: 1,
        type: "verification",
        isRequired: true,
        instructions: "Background check authorization and initiation",
        documents: ["Background Check Authorization"]
      },
      {
        id: 2,
        title: "Send Compliance Documents",
        description: "System emails compliance documents to candidate",
        icon: "LuMail",
        order: 2,
        type: "email",
        isRequired: true,
        instructions: "Dear {candidate_name},\n\nPlease find your onboarding documents attached.\n\n1. I-9 Form\n2. W-4 Form\n3. Work Authorization Documents\n\nPlease complete and return.",
        documents: ["I-9 Form", "W-4 Form", "Work Authorization"]
      },
      {
        id: 3,
        title: "Candidate Document Upload",
        description: "Candidate uploads completed documents",
        icon: "LuUpload",
        order: 3,
        type: "document",
        isRequired: true,
        instructions: "Upload completed forms and identification",
        documents: ["I-9 Form (completed)", "W-4 Form (completed)", "Driver's License", "Work Authorization"]
      },
      {
        id: 4,
        title: "Onboarding Completion",
        description: "All onboarding steps completed",
        icon: "LuCheckCircle",
        order: 4,
        type: "document",
        isRequired: true,
        instructions: "Final review and completion",
        documents: ["Onboarding Completion Certificate"]
      }
    ],
    
    other: [
      {
        id: 1,
        title: "Company Details Collection",
        description: "Collect basic company information",
        icon: "LuBuilding",
        order: 1,
        type: "document",
        isRequired: true,
        instructions: "Complete company information form",
        documents: ["Company Details Form"]
      },
      {
        id: 2,
        title: "MSA Signing",
        description: "Sign Master Service Agreement",
        icon: "LuFileSignature",
        order: 2,
        type: "signature",
        isRequired: true,
        instructions: "Digital signing of agreement",
        documents: ["Master Service Agreement", "TCS Details"]
      },
      {
        id: 3,
        title: "Document Upload",
        description: "Upload all required documents",
        icon: "LuUpload",
        order: 3,
        type: "document",
        isRequired: true,
        instructions: "Upload company documents",
        documents: ["COI", "Business License", "Tax Documents", "Company IDs"]
      },
      {
        id: 4,
        title: "Purchase Order",
        description: "Generate and approve PO",
        icon: "LuFileText",
        order: 4,
        type: "document",
        isRequired: true,
        instructions: "PO generation process",
        documents: ["Purchase Order"]
      },
      {
        id: 5,
        title: "Payment Setup",
        description: "Set up payment methods",
        icon: "LuCreditCard",
        order: 5,
        type: "payment",
        isRequired: true,
        instructions: "Complete payment authorization",
        documents: ["ACH Form", "Payment Terms"]
      },
      {
        id: 6,
        title: "Additional Requirements",
        description: "Any additional requirements",
        icon: "LuFileText",
        order: 6,
        type: "document",
        isRequired: false,
        instructions: "Optional additional steps",
        documents: []
      }
    ]
  };

  return templates[type] || templates.c2c;
};

export const getWorkflowTemplates = (type = 'c2c') => {
  const templates = {
    c2c: {
      name: "C2C Candidate Flow",
      description: "For contractors and consultants",
      steps: getStepTemplates('c2c'),
      estimatedTime: "7-14 days",
      requirements: ["MSA", "PO", "ACH Setup"]
    },
    w2: {
      name: "W2 Candidate Flow",
      description: "For full-time employees",
      steps: getStepTemplates('w2'),
      estimatedTime: "3-7 days",
      requirements: ["Background Check", "I-9", "W-4"]
    },
    other: {
      name: "Other Onboarding Flow",
      description: "For other types of onboarding",
      steps: getStepTemplates('other'),
      estimatedTime: "5-10 days",
      requirements: ["Company Info", "MSA", "Documents"]
    }
  };

  return templates[type] || templates.c2c;
};

export const defaultStep = {
  id: Date.now(),
  title: "New Step",
  description: "Step description",
  icon: "LuFileText",
  order: 1,
  type: "document",
  isRequired: true,
  instructions: "",
  documents: []
};