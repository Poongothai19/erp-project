import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getCurrencySymbol = (currency) => {
  if (currency === 'INR') return '';
  if (currency === 'USD') return '$ ';
  if (currency === 'EUR') return '€ ';
  return '';
};

const formatDateForPDF = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

// Helper function to format numbers without any extra characters
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '0.00';
  const num = parseFloat(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

// Helper to get plain number without any formatting
const getPlainNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Format currency without any symbol prefix (just the number)
const formatCurrency = (value, currency) => {
  const num = getPlainNumber(value);
  return num.toFixed(2);
};

// Format currency with INR suffix for headers
const getUnitPriceHeader = (currency) => {
  if (currency === 'INR') return 'UNIT PRICE (INR)';
  return 'UNIT PRICE';
};

const getTotalHeader = (currency) => {
  if (currency === 'INR') return 'TOTAL (INR)';
  return 'TOTAL';
};

export const generateInvoicePDF = (invoiceData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const currency = invoiceData.currency || 'INR';
  
  // 1. TOP LEFT CORNER: LOGO
  if (invoiceData.logo) {
    try {
      doc.addImage(invoiceData.logo, 'PNG', margin, 10, 40, 20);
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
      doc.setTextColor(1, 157, 136);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROPHECY', margin, 20);
    }
  } else {
    doc.setTextColor(1, 157, 136);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPHECY', margin, 20);
  }
  
  // 2. TOP RIGHT CORNER: INVOICE DETAILS
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let topY = 20;
  
  doc.text(`Invoice No: ${invoiceData.invoiceNo || ''}`, pageWidth - margin, topY, { align: 'right' });
  topY += 6;
  doc.text(`Date: ${formatDateForPDF(invoiceData.invoiceDate)}`, pageWidth - margin, topY, { align: 'right' });
  topY += 6;
  doc.text(`Payment terms: ${invoiceData.terms || ''}`, pageWidth - margin, topY, { align: 'right' });
  topY += 6;
  doc.text(`Due Date: ${formatDateForPDF(invoiceData.dueDate)}`, pageWidth - margin, topY, { align: 'right' });
  
  // 3. COMPANY DETAILS (LEFT) & BILL TO (RIGHT)
  let midY = 55;

  // Left Side: Always Prophecy Tek (OPC) Private Limited
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Prophecy Tek (OPC) Private Limited', margin, midY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  midY += 6;
  doc.text('Plot no.13, Bharathi Nagar 7T', margin, midY);
  midY += 5;
  doc.text('Sangiliyandapuram, Tiruchirapalli, TN 620001', margin, midY);
  midY += 5;
  doc.text('accounts@prophecytechs.com', margin, midY);
  midY += 5;
  doc.text('www.prophecytechs.com', margin, midY);
  midY += 5;
  doc.text(`PAN No: ${invoiceData.companyPan || 'ABCDE1234F'}`, margin, midY);
  midY += 5;
  doc.text(`GST No: ${invoiceData.companyGst || '22AAAAA0000A1Z5'}`, margin, midY);
  
  // Right Side: BILL TO
  let billToY = 55;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', pageWidth - margin, billToY, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  billToY += 6;
  doc.text(invoiceData.customerName || invoiceData.companyName || 'tcs', pageWidth - margin, billToY, { align: 'right' });
  billToY += 5;
  if (invoiceData.billingAddress) {
    const addr = invoiceData.billingAddress;
    if (addr.street1) {
      doc.text(addr.street1, pageWidth - margin, billToY, { align: 'right' });
      billToY += 5;
    }
    const cityStateZip = `${addr.city || ''} ${addr.state || ''} ${addr.zipCode || ''}`.trim();
    if (cityStateZip) {
      doc.text(cityStateZip, pageWidth - margin, billToY, { align: 'right' });
      billToY += 5;
    }
  }
  doc.text(`PAN No: ${invoiceData.customerPan || ''}`, pageWidth - margin, billToY, { align: 'right' });
  billToY += 5;
  doc.text(`GST No: ${invoiceData.customerGst || ''}`, pageWidth - margin, billToY, { align: 'right' });
  
  // 4. TABLE
  const tableY = Math.max(midY, billToY) + 15;
  
  const tableBody = (invoiceData.items || []).map(item => {
    let descriptionContent = '';
    if (item.productService) {
      descriptionContent = item.productService;
    }
    if (item.description) {
      descriptionContent = descriptionContent ? `${descriptionContent}\n${item.description}` : item.description;
    }
    
    const qtyNum = getPlainNumber(item.qty);
    const rateNum = getPlainNumber(item.rate);
    const amountNum = getPlainNumber(item.amount);
    
    return [
      formatDateForPDF(item.serviceDate || invoiceData.invoiceDate),
      descriptionContent || '',
      qtyNum.toString(),
      formatCurrency(rateNum, currency),
      formatCurrency(amountNum, currency)
    ];
  });
  
  try {
    autoTable(doc, {
      startY: tableY,
      head: [['DATE', 'DESCRIPTION', 'QTY', getUnitPriceHeader(currency), getTotalHeader(currency)]],
      body: tableBody,
      theme: 'grid', // 'grid' theme provides horizontal and vertical lines
      headStyles: { 
        fillColor: [1, 157, 136], // #019d88
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 10,
        lineWidth: 0.1,
        lineColor: [1, 139, 120] // Match teal border from preview
      },
      columnStyles: {
        0: { cellWidth: 28, halign: 'left' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 38, halign: 'right' },
        4: { cellWidth: 38, halign: 'right' }
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        valign: 'top',
        overflow: 'linebreak'
      },
      margin: { left: margin, right: margin }
    });
    var finalY = doc.lastAutoTable.finalY + 10;
  } catch (err) {
    console.error('autoTable failed, falling back to manual rendering', err);
    let y = tableY;
    // Improved manual fallback with full grid
    const colWidths = [28, pageWidth - 2*margin - 28 - 15 - 38 - 38, 15, 38, 38];
    const colX = [margin, 
                 margin + colWidths[0], 
                 margin + colWidths[0] + colWidths[1], 
                 margin + colWidths[0] + colWidths[1] + colWidths[2],
                 margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]];
    
    // Header
    doc.setFillColor(1, 157, 136);
    doc.rect(margin, y, pageWidth - 2*margin, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE', colX[0] + 2, y + 8);
    doc.text('DESCRIPTION', colX[1] + 2, y + 8);
    doc.text('QTY', colX[2] + colWidths[2]/2, y + 8, { align: 'center' });
    doc.text(getUnitPriceHeader(currency), colX[3] + colWidths[3] - 2, y + 8, { align: 'right' });
    doc.text(getTotalHeader(currency), colX[4] + colWidths[4] - 2, y + 8, { align: 'right' });
    y += 12;
    
    // Body
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    tableBody.forEach((row) => {
      const dateText = row[0];
      const descContent = row[1];
      const qtyText = row[2];
      const rateText = row[3];
      const amountText = row[4];
      
      const descLines = doc.splitTextToSize(descContent, colWidths[1] - 4);
      const rowHeight = Math.max(5 * descLines.length + 4, 12);
      
      // Draw cell borders
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, margin, y + rowHeight); // Left border
      doc.line(pageWidth - margin, y, pageWidth - margin, y + rowHeight); // Right border
      colX.forEach(x => doc.line(x, y, x, y + rowHeight)); // Vertical separators
      doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight); // Bottom border
      
      doc.text(dateText, colX[0] + 2, y + 6);
      doc.text(descLines, colX[1] + 2, y + 6);
      doc.text(qtyText, colX[2] + colWidths[2]/2, y + 6, { align: 'center' });
      doc.text(rateText, colX[3] + colWidths[3] - 2, y + 6, { align: 'right' });
      doc.text(amountText, colX[4] + colWidths[4] - 2, y + 6, { align: 'right' });
      
      y += rowHeight;
    });
    var finalY = y + 5;
  }
  
  // 5. NOTES AND TOTALS SECTION
  const totalsStartY = finalY + 10;
  const rightAlignX = pageWidth - margin;
  
  // Left side - Notes with box
  const notesBoxWidth = 85;
  const notesBoxHeight = 50;
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, totalsStartY, notesBoxWidth, notesBoxHeight);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('NOTES:', margin + 5, totalsStartY + 8);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const noteText = invoiceData.noteToCustomer || '';
  const noteLines = doc.splitTextToSize(noteText, notesBoxWidth - 10);
  doc.text(noteLines, margin + 5, totalsStartY + 15);
  
  // Right side - Totals (no box)
  let totalsY = totalsStartY;
  const totalsWidth = 80;
  const totalsX = rightAlignX - totalsWidth;
  
  // Extract or calculate subtotal
  let subtotal = getPlainNumber(invoiceData.totals?.subtotal);
  if (subtotal === 0 && invoiceData.items) {
    subtotal = invoiceData.items.reduce((sum, item) => sum + getPlainNumber(item.amount), 0);
  }

  // Extract or calculate IGST
  const igstRate = getPlainNumber(invoiceData.igstRate || invoiceData.totals?.igstRate);
  let igstAmount = getPlainNumber(invoiceData.igstAmount || invoiceData.totals?.igstAmount);
  
  // If igstAmount is 0 but we have a rate, calculate it
  if (igstAmount === 0 && igstRate > 0) {
    igstAmount = (subtotal * igstRate) / 100;
  }

  // Extract or calculate total
  let total = getPlainNumber(invoiceData.totals?.total);
  if (total === 0) {
    total = subtotal + igstAmount;
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  doc.text('SUB TOTAL', totalsX, totalsY);
  doc.text(formatCurrency(subtotal, currency), rightAlignX, totalsY, { align: 'right' });
  totalsY += 6;
  
  // For GST, show the label based on currency
  if (currency === 'INR') {
    doc.text(`IGST (${igstRate}%)`, totalsX, totalsY);
  } else {
    doc.text(`GST (${igstRate}%)`, totalsX, totalsY);
  }
  doc.text(formatCurrency(igstAmount, currency), rightAlignX, totalsY, { align: 'right' });
  totalsY += 6;
  
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, totalsY, rightAlignX, totalsY);
  totalsY += 5;
  
  // TOTAL with INR suffix if needed
  if (currency === 'INR') {
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL (INR)', totalsX, totalsY);
    doc.text(formatCurrency(total, currency), rightAlignX, totalsY, { align: 'right' });
    totalsY += 8;
    
    doc.setTextColor(1, 157, 136);
    doc.setFontSize(10);
    doc.text('GRAND TOTAL (INR)', totalsX, totalsY);
    doc.text(formatCurrency(total, currency), rightAlignX, totalsY, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', totalsX, totalsY);
    doc.text(formatCurrency(total, currency), rightAlignX, totalsY, { align: 'right' });
    totalsY += 8;
    
    doc.setTextColor(1, 157, 136);
    doc.setFontSize(10);
    doc.text('GRAND TOTAL', totalsX, totalsY);
    doc.text(formatCurrency(total, currency), rightAlignX, totalsY, { align: 'right' });
  }
  doc.setTextColor(0, 0, 0);
  
  // 6. BANK DETAILS
  const bankStartY = Math.max(totalsStartY + notesBoxHeight + 10, totalsY + 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('BANK DETAILS', margin, bankStartY);
  
  // Add a small teal underline to match preview
  doc.setDrawColor(1, 157, 136);
  doc.setLineWidth(0.5);
  doc.line(margin, bankStartY + 1.5, margin + 28, bankStartY + 1.5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const bank = invoiceData.bankDetails || {};
  let bankY = bankStartY + 8;
  
  doc.text(`Account Name: ${bank.accountName || ''}`, margin, bankY);
  bankY += 5;
  doc.text(`Bank Name: ${bank.bankName || ''}`, margin, bankY);
  bankY += 5;
  doc.text(`Account No: ${bank.accountNo || ''}`, margin, bankY);
  bankY += 5;
  doc.text(`Branch: ${bank.branch || ''}`, margin, bankY);
  bankY += 5;
  doc.text(`IFSC Code: ${bank.ifscCode || ''}`, margin, bankY);
  
  // 7. THANK YOU (CENTER)
  const thankYouY = Math.max(bankY + 25, totalsStartY + 110);
  doc.setFontSize(16);
  doc.setTextColor(1, 157, 136);
  doc.setFont('helvetica', 'bolditalic');
  doc.text('Thankyou', pageWidth / 2, thankYouY, { align: 'center' });
  
  return doc;
};

export const downloadInvoicePDF = (invoiceData) => {
  try {
    const doc = generateInvoicePDF(invoiceData);
    doc.save(`Invoice-${invoiceData.invoiceNo}.pdf`);
    return true;
  } catch (error) {
    console.error('Error in downloadInvoicePDF:', error);
    throw error;
  }
};

export const previewInvoicePDF = (invoiceData) => {
  const doc = generateInvoicePDF(invoiceData);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  return pdfUrl;
};