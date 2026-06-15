import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType, ExternalHyperlink } from "docx";
import { saveAs } from "file-saver";
import BASE_URL from '../../url';

export const generateSubmissionWord = async (submissionId, rowData = null) => {
  const formatWordDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' });
    } catch (e) {
      return dateStr;
    }
  };

  let d = rowData;
  if (!d) {
    const response = await fetch(`${BASE_URL}/api/h1b/submissions/${submissionId}`);
    const result = await response.json();
    if (result.success) {
      d = result.data;
    } else {
      throw new Error("Failed to load full submission details");
    }
  }

  const createFieldRow = (label, value) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: "F8FAFC" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: "64748B", size: 18 })] })],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: String(value || '-'), size: 20, color: "0F172A" })] })],
        }),
      ],
    });
  };

  const createSection = (title, fields) => {
    const validFields = fields.filter(f => f[1] && f[1] !== '-' && String(f[1]).trim() !== '');
    if (validFields.length === 0) return [];

    const sectionTitle = new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({ text: title.toUpperCase(), bold: true, color: "038A77", size: 22 })
      ]
    });

    const rows = validFields.map(f => createFieldRow(f[0], f[1]));
    
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows
    });

    return [sectionTitle, table];
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "H-1B Petition — Submission Details", bold: true, size: 32, color: "038A77" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: `${d.EmployerName || 'Prophecy Technologies'}  |  Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, size: 20, color: "64748B" })
            ]
          }),

          // Submission info
          new Paragraph({
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({ text: "SUBMITTED ON: ", bold: true, size: 18, color: "64748B" }),
              new TextRun({ text: d.CreatedAt ? new Date(d.CreatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-', size: 18, color: "0F172A" })
            ]
          }),

          ...createSection('Personal Information', [
            ['Full Name', `${d.Prefix || ''} ${d.FirstName || ''} ${d.MiddleName || ''} ${d.LastName || ''}`.trim()],
            ['Email Address', d.Email],
            ['Phone Number', d.Phone],
            ['Gender', d.Gender],
            ['Date of Birth (MM/DD/YYYY)', formatWordDate(d.DateOfBirth)],
            ['Nationality', d.Nationality],
            ['Country of Birth', d.CountryOfBirth],
            ['Place of Birth', d.PlaceOfBirth],
          ]),

          ...createSection('Passport & Immigration Status', [
            ['Passport Number', d.PassportNumber],
            ['Passport Expiry (MM/DD/YYYY)', formatWordDate(d.PassportExpiryDate)],
            ['Current Nonimmigrant Status', d.CurrentStatus],
            ['I-94 Expiration (MM/DD/YYYY)', formatWordDate(d.I94Expiration)],
          ]),

          ...createSection('H-1B Filing Details', [
            ['Employer / Petitioner', d.EmployerName],
            ['Filing Type', d.FilingType],
            ['Anticipated Start Date (MM/DD/YYYY)', formatWordDate(d.AnticipatedStartDate)],
            ['Petition Status', (d.PetitionStatus || '').toUpperCase()],
          ]),

          ...createSection('Employment & Position', [
            ['Job Title / Position', d.PositionTitle],
            ['Expected Salary', d.ExpectedSalary],
            ['Worksite Address', d.WorksiteAddress],
            ['Home Address', d.HomeAddress],
            ['Offsite Details', d.OffsiteDetails],
          ]),

          ...(d.JobSummary && d.JobSummary.trim() ? [
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
              children: [
                new TextRun({ text: 'JOB SUMMARY', bold: true, color: "038A77", size: 22 })
              ]
            }),
            new Paragraph({
              spacing: { before: 100, after: 100 },
              children: [
                new TextRun({ text: d.JobSummary, size: 20, color: "0F172A" })
              ]
            })
          ] : []),

          ...(d.ResumeS3Key ? [
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
              children: [
                new TextRun({ text: 'RESUME / DOCUMENTS', bold: true, color: "038A77", size: 22 })
              ]
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "F8FAFC" },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                      },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ children: [new TextRun({ text: 'RESUME FILE', bold: true, color: "64748B", size: 18 })] })],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                      },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [
                        new Paragraph({
                          children: [
                            new ExternalHyperlink({
                              children: [
                                new TextRun({
                                  text: "Click here to download Resume",
                                  color: "2563EB",
                                  size: 20,
                                }),
                              ],
                              link: `${BASE_URL}/api/h1b/download?s3Key=${encodeURIComponent(d.ResumeS3Key)}&fileName=resume-${submissionId}.pdf`,
                            })
                          ]
                        })
                      ],
                    }),
                  ],
                })
              ]
            })
          ] : []),

          ...createSection('Client & Vendor Chain', [
            ['End Client', d.EndClient],
            ['Tier 1 Vendor', d.Tier1Vendor],
            ['Tier 2 Vendor', d.Tier2Vendor],
            ['Tier 3 Vendor', d.Tier3Vendor],
          ]),

          ...createSection('Education', [
            ["Bachelor's Degree", d.BachelorsDegree],
            ["Bachelor's Field", d.BachelorsField],
            ["Master's Degree", d.MastersDegree],
            ["Master's Field", d.MastersField],
            ["Master's Cap Quota Eligible", d.MastersCapQuotaEligible],
          ]),

          ...createSection('Additional Information', [
            ['H-4 Required', d.H4Required],
            ['H-4 Count', d.H4Count || d.H4_Count || d.h4_count || d.h4Count],
            ['Consent Given', d.Consent ? 'Yes' : 'No'],
          ])
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `H1B_${(d.FirstName || 'Submission').replace(/\s+/g, '_')}_${d.LastName || ''}_${submissionId}.docx`;
  saveAs(blob, fileName);
  return fileName;
};
