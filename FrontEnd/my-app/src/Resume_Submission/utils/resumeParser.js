// import { Text, PDFDocument } from 'pdf-lib';
// import { read, utils, write } from 'xlsx';
// import mammoth from 'mammoth';
// import { saveAs } from 'file-saver';

// export const parseResumesFromFolder = async (files, progressCallback) => {
//   if (!files || files.length === 0) {
//     throw new Error('No files selected');
//   }

//   const candidates = [];
//   let processedCount = 0;

//   for (const file of files) {
//     try {
//       const candidate = await parseResumeFile(file);
//       if (candidate) {
//         candidates.push(candidate);
//       }
//     } catch (error) {
//       console.error(`Error parsing file ${file.name}:`, error);
//     }

//     processedCount++;
//     const progress = (processedCount / files.length) * 100;
//     progressCallback(progress);
//   }

//   return candidates;
// };

// const parseResumeFile = async (file) => {
//   const text = await extractTextFromFile(file);
//   if (!text) return null;

//   // Extract name (first line is often the name)
//   const nameMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m);
//   const [firstName, lastName] = nameMatch ? nameMatch[0].split(' ') : ['', ''];

//   // Extract email
//   const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  
//   // Extract phone numbers (international formats supported)
//   const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g);
  
//   // Extract LinkedIn profile
//   const linkedInMatch = text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)[a-zA-Z0-9-]+/i);
  
//   // Extract location (look for address patterns)
//   const locationMatch = text.match(/(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:,\s*[A-Z]{2})?(?:\s+\d{5})?/);
  
//   // Extract skills (look for common section headers)
//   const skillsSection = extractSection(text, /(?:skills|technical skills|key skills|competencies)\s*:/i);
//   const skills = skillsSection ? 
//     skillsSection.split(/[,;\n•\-]/)
//       .map(s => s.trim())
//       .filter(s => s && s.length > 2 && !s.match(/^\d+$/)) : [];
  
//   // Extract education (look for education section)
//   const educationSection = extractSection(text, /(?:education|academic background|qualifications)\s*:/i);
//   const education = educationSection ? 
//     educationSection.split('\n')
//       .map(e => e.trim())
//       .filter(e => e) : [];
  
//   // Extract certifications
//   const certSection = extractSection(text, /(?:certifications|certificate|licenses)\s*:/i);
//   const certifications = certSection ? 
//     certSection.split('\n')
//       .map(c => c.trim())
//       .filter(c => c) : [];
  
//   // Extract languages
//   const langSection = extractSection(text, /(?:languages|language skills)\s*:/i);
//   const languages = langSection ? 
//     langSection.split(/[,;\n]/)
//       .map(l => l.trim())
//       .filter(l => l) : [];
  
//   // Extract experience (more complex parsing)
//   const experienceSection = extractSection(text, /(?:experience|work history|employment|professional experience)\s*:/i);
//   const experiences = experienceSection ? parseExperience(experienceSection) : [];

//   return {
//     Resume_ID: `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
//     FirstName: firstName,
//     LastName: lastName,
//     EmailID: emailMatch ? emailMatch[0] : '',
//     PhoneNumber1: phoneMatch && phoneMatch[0] ? phoneMatch[0] : '',
//     PhoneNumber2: phoneMatch && phoneMatch[1] ? phoneMatch[1] : '',
//     LinkedInProfile: linkedInMatch ? `https://www.${linkedInMatch[0]}` : '',
//     CurrentLocation: locationMatch ? locationMatch[0] : '',
//     ResumeUpload: file,
//     Status: 'new',
//     CreatedDt: new Date().toISOString(),
//     CreatedBy: 'Resume Parser',
//     Skills: skills,
//     Education: education,
//     Certifications: certifications,
//     Languages: languages,
//     Experiences: experiences,
//     CandidateInfo: extractSummary(text)
//   };
// };

// // Helper function to extract sections
// const extractSection = (text, sectionRegex) => {
//   const sectionMatch = text.match(new RegExp(`${sectionRegex.source}[\\s\\S]*?(?=\\n\\s*\\n|$)`, 'i'));
//   if (!sectionMatch) return null;
  
//   // Remove the section header
//   let sectionText = sectionMatch[0].replace(sectionRegex, '').trim();
  
//   // Remove any following section headers that might have been included
//   const nextSectionIndex = sectionText.search(/\n\s*\n\s*[A-Z][A-Za-z ]+:/);
//   if (nextSectionIndex > -1) {
//     sectionText = sectionText.substring(0, nextSectionIndex).trim();
//   }
  
//   return sectionText;
// };

// // Helper function to parse experience section
// const parseExperience = (experienceText) => {
//   const experiences = [];
//   const lines = experienceText.split('\n').filter(line => line.trim());
  
//   let currentExp = {};
//   let isDescription = false;
  
//   for (const line of lines) {
//     // Look for company and title pattern (e.g., "Company Name, Position Title")
//     const companyTitleMatch = line.match(/^([^,]+),\s*(.+)/);
//     if (companyTitleMatch) {
//       if (currentExp.company) {
//         experiences.push(currentExp);
//       }
//       currentExp = {
//         company: companyTitleMatch[1].trim(),
//         title: companyTitleMatch[2].trim(),
//         description: []
//       };
//       isDescription = false;
//       continue;
//     }
    
//     // Look for duration pattern (e.g., "Jan 2020 - Present")
//     const durationMatch = line.match(/([A-Za-z]+\s+\d{4})\s*-\s*([A-Za-z]+\s+\d{4}|Present)/i);
//     if (durationMatch && currentExp.company) {
//       currentExp.duration = line.trim();
//       continue;
//     }
    
//     // Look for bullet points or description lines
//     const bulletMatch = line.match(/^[•\-*]\s*(.+)/);
//     if (bulletMatch && currentExp.company) {
//       currentExp.description.push(bulletMatch[1].trim());
//       continue;
//     }
    
//     // If we have a company, assume the rest is description
//     if (currentExp.company && line.trim()) {
//       currentExp.description.push(line.trim());
//     }
//   }
  
//   if (currentExp.company) {
//     experiences.push(currentExp);
//   }
  
//   return experiences;
// };

// // Helper to extract summary/objective section
// const extractSummary = (text) => {
//   const summarySection = extractSection(text, /(?:summary|profile|objective|about)\s*:/i);
//   if (summarySection) {
//     return summarySection.split('\n')[0].trim();
//   }
  
//   // Fallback to first few lines if no summary section found
//   const lines = text.split('\n').filter(line => line.trim());
//   if (lines.length > 2) {
//     return lines.slice(0, 3).join(' ').substring(0, 200) + '...';
//   }
  
//   return '';
// };

// const extractTextFromFile = async (file) => {
//   if (file.type === 'application/pdf') {
//     const pdfData = await file.arrayBuffer();
//     const pdfDoc = await PDFDocument.load(pdfData);
//     let text = '';
//     for (let i = 0; i < pdfDoc.getPageCount(); i++) {
//       const page = pdfDoc.getPage(i);
//       text += await page.getText();
//     }
//     return text;
//   } else if (file.type.includes('wordprocessingml') || file.name.endsWith('.docx')) {
//     const arrayBuffer = await file.arrayBuffer();
//     const result = await mammoth.extractRawText({ arrayBuffer });
//     return result.value;
//   } else if (file.type === 'text/plain') {
//     return await file.text();
//   } else {
//     console.warn(`Unsupported file type: ${file.type}`);
//     return null;
//   }
// };

// export const exportCandidateData = (candidate, format) => {
//   let content, mimeType, extension;

//   switch (format) {
//     case 'pdf':
//       return generateCandidatePDF(candidate);
//     case 'doc':
//       return generateCandidateDOC(candidate);
//     case 'excel':
//       return generateCandidateExcel(candidate);
//     default:
//       throw new Error('Unsupported export format');
//   }
// };

// const generateCandidatePDF = async (candidate) => {
//   const pdfDoc = await PDFDocument.create();
//   const page = pdfDoc.addPage([600, 800]);
//   const { height } = page.getSize();
  
//   let yPosition = height - 50;
  
//   // Add candidate name
//   page.drawText(`${candidate.FirstName} ${candidate.LastName}`, {
//     x: 50,
//     y: yPosition,
//     size: 18,
//   });
//   yPosition -= 30;
  
//   // Add contact info
//   page.drawText(`Email: ${candidate.EmailID} | Phone: ${candidate.PhoneNumber1}`, {
//     x: 50,
//     y: yPosition,
//     size: 12,
//   });
//   yPosition -= 20;
  
//   if (candidate.LinkedInProfile) {
//     page.drawText(`LinkedIn: ${candidate.LinkedInProfile}`, {
//       x: 50,
//       y: yPosition,
//       size: 12,
//     });
//     yPosition -= 20;
//   }
  
//   // Add summary
//   if (candidate.CandidateInfo) {
//     page.drawText('Summary:', {
//       x: 50,
//       y: yPosition,
//       size: 14,
//     });
//     yPosition -= 20;
    
//     const summaryLines = splitTextToLines(candidate.CandidateInfo, 80);
//     summaryLines.forEach(line => {
//       page.drawText(line, {
//         x: 50,
//         y: yPosition,
//         size: 10,
//       });
//       yPosition -= 15;
//     });
//     yPosition -= 10;
//   }
  
//   // Add skills
//   if (candidate.Skills && candidate.Skills.length > 0) {
//     page.drawText('Skills:', {
//       x: 50,
//       y: yPosition,
//       size: 14,
//     });
//     yPosition -= 20;
    
//     const skillsText = candidate.Skills.join(', ');
//     const skillsLines = splitTextToLines(skillsText, 80);
//     skillsLines.forEach(line => {
//       page.drawText(line, {
//         x: 50,
//         y: yPosition,
//         size: 10,
//       });
//       yPosition -= 15;
//     });
//     yPosition -= 10;
//   }
  
//   // Add experience
//   if (candidate.Experiences && candidate.Experiences.length > 0) {
//     page.drawText('Experience:', {
//       x: 50,
//       y: yPosition,
//       size: 14,
//     });
//     yPosition -= 20;
    
//     candidate.Experiences.forEach(exp => {
//       // Company and title
//       page.drawText(`${exp.company}, ${exp.title}`, {
//         x: 50,
//         y: yPosition,
//         size: 12,
//       });
//       yPosition -= 15;
      
//       // Duration
//       if (exp.duration) {
//         page.drawText(exp.duration, {
//           x: 50,
//           y: yPosition,
//           size: 10,
//         });
//         yPosition -= 15;
//       }
      
//       // Description
//       exp.description.forEach(desc => {
//         const descLines = splitTextToLines(desc, 100);
//         descLines.forEach(line => {
//           page.drawText(`• ${line}`, {
//             x: 55,
//             y: yPosition,
//             size: 10,
//           });
//           yPosition -= 15;
//         });
//       });
      
//       yPosition -= 10;
//     });
//   }
  
//   // Add education
//   if (candidate.Education && candidate.Education.length > 0) {
//     page.drawText('Education:', {
//       x: 50,
//       y: yPosition,
//       size: 14,
//     });
//     yPosition -= 20;
    
//     candidate.Education.forEach(edu => {
//       const eduLines = splitTextToLines(edu, 100);
//       eduLines.forEach(line => {
//         page.drawText(`• ${line}`, {
//           x: 55,
//           y: yPosition,
//           size: 10,
//         });
//         yPosition -= 15;
//       });
//     });
//     yPosition -= 10;
//   }
  
//   const pdfBytes = await pdfDoc.save();
//   saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), 
//     `${candidate.FirstName}_${candidate.LastName}_profile.pdf`);
// };

// const splitTextToLines = (text, maxLength) => {
//   const words = text.split(' ');
//   const lines = [];
//   let currentLine = '';
  
//   words.forEach(word => {
//     if (currentLine.length + word.length + 1 <= maxLength) {
//       currentLine += (currentLine ? ' ' : '') + word;
//     } else {
//       lines.push(currentLine);
//       currentLine = word;
//     }
//   });
  
//   if (currentLine) {
//     lines.push(currentLine);
//   }
  
//   return lines;
// };

// const generateCandidateDOC = async (candidate) => {
//   // Create HTML content for the Word document
//   let htmlContent = `
//     <h1>${candidate.FirstName} ${candidate.LastName}</h1>
//     <p>Email: ${candidate.EmailID}</p>
//     <p>Phone: ${candidate.PhoneNumber1}</p>
//     ${candidate.LinkedInProfile ? `<p>LinkedIn: ${candidate.LinkedInProfile}</p>` : ''}
//     ${candidate.CurrentLocation ? `<p>Location: ${candidate.CurrentLocation}</p>` : ''}
    
//     ${candidate.CandidateInfo ? `<h2>Summary</h2><p>${candidate.CandidateInfo}</p>` : ''}
    
//     ${candidate.Skills && candidate.Skills.length > 0 ? 
//       `<h2>Skills</h2><ul>${
//         candidate.Skills.map(skill => `<li>${skill}</li>`).join('')
//       }</ul>` : ''}
    
//     ${candidate.Experiences && candidate.Experiences.length > 0 ? `
//       <h2>Experience</h2>
//       ${candidate.Experiences.map(exp => `
//         <h3>${exp.company}, ${exp.title}</h3>
//         ${exp.duration ? `<p>${exp.duration}</p>` : ''}
//         <ul>${exp.description.map(desc => `<li>${desc}</li>`).join('')}</ul>
//       `).join('')}
//     ` : ''}
    
//     ${candidate.Education && candidate.Education.length > 0 ? `
//       <h2>Education</h2>
//       <ul>${candidate.Education.map(edu => `<li>${edu}</li>`).join('')}</ul>
//     ` : ''}
    
//     ${candidate.Certifications && candidate.Certifications.length > 0 ? `
//       <h2>Certifications</h2>
//       <ul>${candidate.Certifications.map(cert => `<li>${cert}</li>`).join('')}</ul>
//     ` : ''}
    
//     ${candidate.Languages && candidate.Languages.length > 0 ? `
//       <h2>Languages</h2>
//       <ul>${candidate.Languages.map(lang => `<li>${lang}</li>`).join('')}</ul>
//     ` : ''}
//   `;
  
//   // Convert HTML to Word document
//   const result = await mammoth.extractRawText({ value: htmlContent });
//   saveAs(
//     new Blob([result.value], { type: 'application/msword' }), 
//     `${candidate.FirstName}_${candidate.LastName}_profile.doc`
//   );
// };

// const generateCandidateExcel = (candidate) => {
//   // Flatten the candidate data for Excel
//   const excelData = {
//     'First Name': candidate.FirstName,
//     'Last Name': candidate.LastName,
//     'Email': candidate.EmailID,
//     'Phone': candidate.PhoneNumber1,
//     'LinkedIn': candidate.LinkedInProfile || '',
//     'Location': candidate.CurrentLocation || '',
//     'Summary': candidate.CandidateInfo || '',
//     'Skills': candidate.Skills ? candidate.Skills.join(', ') : '',
//     'Education': candidate.Education ? candidate.Education.join('\n') : '',
//     'Certifications': candidate.Certifications ? candidate.Certifications.join('\n') : '',
//     'Languages': candidate.Languages ? candidate.Languages.join(', ') : '',
//   };
  
//   // Add experiences
//   if (candidate.Experiences && candidate.Experiences.length > 0) {
//     candidate.Experiences.forEach((exp, index) => {
//       excelData[`Experience ${index + 1} - Company`] = exp.company;
//       excelData[`Experience ${index + 1} - Title`] = exp.title;
//       excelData[`Experience ${index + 1} - Duration`] = exp.duration || '';
//       excelData[`Experience ${index + 1} - Description`] = exp.description.join('\n');
//     });
//   }
  
//   const worksheet = utils.json_to_sheet([excelData]);
//   const workbook = utils.book_new();
//   utils.book_append_sheet(workbook, worksheet, "Candidate");
//   const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
//   saveAs(
//     new Blob([excelBuffer], { type: 'application/octet-stream' }), 
//     `${candidate.FirstName}_${candidate.LastName}_data.xlsx`
//   );
// };