import { jsPDF } from 'jspdf';
import BASE_URL from '../../url';

export const generateSubmissionPDF = async (submissionId, rowData = null) => {
  const formatPdfDate = (dateStr) => {
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

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = 0;

  const addPage = () => { doc.addPage(); y = 28; };
  const checkY = (needed = 10) => { if (y + needed > pageH - 18) addPage(); };

  // 🟦 Header Banner 🟦
  doc.setFillColor(3, 138, 119);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('H-1B Petition — Submission Details', pageW / 2, 12, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${d.EmployerName || 'Prophecy Technologies'}  |  Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 21, { align: 'center' });

  y = 36;
  doc.setTextColor(30, 41, 59);

  // 🟦 Submission ID bar 🟦
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageW - margin * 2, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('SUBMITTED ON', margin + 3, y + 6);
  doc.setTextColor(30, 41, 59);
  doc.text(d.CreatedAt ? new Date(d.CreatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-', margin + 30, y + 6);
  y += 15;

  const drawSection = (title, fields) => {
    checkY(30);
    doc.setFillColor(3, 138, 119);
    doc.rect(margin, y, 3, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(3, 138, 119);
    doc.text(title.toUpperCase(), margin + 6, y + 5.5);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin + 6 + doc.getTextWidth(title.toUpperCase()) + 3, y + 3, pageW - margin, y + 3);
    y += 11;

    const validFields = fields.filter(f => f[1] && f[1] !== '-' && String(f[1]).trim() !== '');
    const col1 = validFields.filter((_, i) => i % 2 === 0);
    const col2 = validFields.filter((_, i) => i % 2 === 1);
    const maxRows = Math.max(col1.length, col2.length);
    const colW = (pageW - margin * 2) / 2;

    for (let i = 0; i < maxRows; i++) {
      checkY(14);
      const rowBg = i % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...rowBg);
      doc.rect(margin, y, pageW - margin * 2, 13, 'F');

      if (col1[i]) {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text(col1[i][0], margin + 3, y + 4.5);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        const val = String(col1[i][1]);
        const lines = doc.splitTextToSize(val, colW - 8);
        doc.text(lines[0], margin + 3, y + 10);
      }
      if (col2[i]) {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text(col2[i][0], margin + colW + 3, y + 4.5);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        const val = String(col2[i][1]);
        const lines = doc.splitTextToSize(val, colW - 8);
        doc.text(lines[0], margin + colW + 3, y + 10);
      }
      y += 13;
    }
    if (validFields.length === 0) {
      doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(148, 163, 184);
      doc.text('No information provided', margin + 3, y + 5);
      y += 10;
    }
    y += 4;
  };

  drawSection('Personal Information', [
    ['Full Name', `${d.Prefix || ''} ${d.FirstName || ''} ${d.MiddleName || ''} ${d.LastName || ''}`.trim()],
    ['Email Address', d.Email],
    ['Phone Number', d.Phone],
    ['Gender', d.Gender],
    ['Date of Birth (MM/DD/YYYY)', formatPdfDate(d.DateOfBirth)],
    ['Nationality', d.Nationality],
    ['Country of Birth', d.CountryOfBirth],
    ['Place of Birth', d.PlaceOfBirth],
  ]);

  drawSection('Passport & Immigration Status', [
    ['Passport Number', d.PassportNumber],
    ['Passport Expiry (MM/DD/YYYY)', formatPdfDate(d.PassportExpiryDate)],
    ['Current Nonimmigrant Status', d.CurrentStatus],
    ['I-94 Expiration (MM/DD/YYYY)', formatPdfDate(d.I94Expiration)],
  ]);

  drawSection('H-1B Filing Details', [
    ['Employer / Petitioner', d.EmployerName],
    ['Filing Type', d.FilingType],
    ['Anticipated Start Date (MM/DD/YYYY)', formatPdfDate(d.AnticipatedStartDate)],
    ['Petition Status', (d.PetitionStatus || '').toUpperCase()],
  ]);

  drawSection('Employment & Position', [
    ['Job Title / Position', d.PositionTitle],
    ['Expected Salary', d.ExpectedSalary],
    ['Worksite Address', d.WorksiteAddress],
    ['Home Address', d.HomeAddress],
    ['Offsite Details', d.OffsiteDetails],
  ]);

  // Job Summary full-width block
  if (d.JobSummary && d.JobSummary.trim()) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const innerPad = 5;
    const textWidth = pageW - margin * 2 - innerPad * 2;
    const summaryLines = doc.splitTextToSize(d.JobSummary, textWidth);
    const lineH = 5.5;
    const summaryH = summaryLines.length * lineH + innerPad * 2;
    const totalNeeded = 12 + summaryH + 6;
    checkY(totalNeeded);

    doc.setFillColor(3, 138, 119);
    doc.rect(margin, y, 3, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(3, 138, 119);
    doc.text('JOB SUMMARY', margin + 6, y + 5.5);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin + 6 + doc.getTextWidth('JOB SUMMARY') + 3, y + 3, pageW - margin, y + 3);
    y += 12;

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, pageW - margin * 2, summaryH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, pageW - margin * 2, summaryH, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(summaryLines, margin + innerPad, y + innerPad + 3, { lineHeightFactor: 1.3 });
    y += summaryH + 6;
  }

  // Resume Download Link section
  if (d.ResumeS3Key) {
    checkY(28);
    doc.setFillColor(3, 138, 119);
    doc.rect(margin, y, 3, 7, 'F');
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(3, 138, 119);
    doc.text('RESUME / DOCUMENTS', margin + 6, y + 5.5);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin + 6 + doc.getTextWidth('RESUME / DOCUMENTS') + 3, y + 3, pageW - margin, y + 3);
    y += 11;

    doc.setFillColor(239, 246, 255);
    doc.rect(margin, y, pageW - margin * 2, 14, 'F');
    doc.setDrawColor(147, 197, 253);
    doc.rect(margin, y, pageW - margin * 2, 14, 'S');

    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
    doc.text('RESUME FILE', margin + 3, y + 4.5);

    const resumeUrl = `${BASE_URL}/api/h1b/download?s3Key=${encodeURIComponent(d.ResumeS3Key)}&fileName=resume-${submissionId}.pdf`;
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(37, 99, 235);
    doc.textWithLink('Click here to download Resume', margin + 3, y + 11, { url: resumeUrl });
    const linkText = 'Click here to download Resume';
    const linkW = doc.getTextWidth(linkText);
    doc.setDrawColor(37, 99, 235);
    doc.line(margin + 3, y + 11.5, margin + 3 + linkW, y + 11.5);
    y += 18;
  }

  drawSection('Client & Vendor Chain', [
    ['End Client', d.EndClient],
    ['Tier 1 Vendor', d.Tier1Vendor],
    ['Tier 2 Vendor', d.Tier2Vendor],
    ['Tier 3 Vendor', d.Tier3Vendor],
  ]);

  drawSection('Education', [
    ["Bachelor's Degree", d.BachelorsDegree],
    ["Bachelor's Field", d.BachelorsField],
    ["Master's Degree", d.MastersDegree],
    ["Master's Field", d.MastersField],
    ["Master's Cap Quota Eligible", d.MastersCapQuotaEligible],
  ]);

  drawSection('Additional Information', [
    ['H-4 Required', d.H4Required],
    ['H-4 Count', d.H4Count || d.H4_Count || d.h4_count || d.h4Count],
    ['Consent Given', d.Consent ? 'Yes' : 'No'],
  ]);

  // ── Footer on every page ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
    doc.text(`${d.EmployerName || 'Prophecy Technologies'} — H-1B Petition Management System`, margin, pageH - 9);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 9, { align: 'right' });
    doc.text('CONFIDENTIAL', pageW / 2, pageH - 9, { align: 'center' });
  }

  const fileName = `H1B_${(d.FirstName || 'Submission').replace(/\s+/g, '_')}_${d.LastName || ''}_${submissionId}.pdf`;
  doc.save(fileName);
  return fileName;
};
