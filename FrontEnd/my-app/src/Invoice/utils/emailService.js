// Mock email service for UI development
export const sendInvoiceEmail = async (invoiceData, attachments = []) => {
  try {
    // Prepare email data
    const emailData = {
      to: invoiceData.email,
      cc: invoiceData.ccEmail,
      bcc: invoiceData.bccEmail,
      subject: `Invoice ${invoiceData.invoiceNo} - ${invoiceData.companyName}`,
      templateId: 'invoice-template-id',
      dynamicTemplateData: {
        invoiceNumber: invoiceData.invoiceNo,
        customerName: invoiceData.customerName,
        companyName: invoiceData.companyName,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate,
        totalAmount: invoiceData.totals.total,
        currency: invoiceData.currency,
        items: invoiceData.items,
        note: invoiceData.noteToCustomer,
        companyAddress: {
          street: '7545 Irvine Ctr, Dr Ste 200',
          city: 'Irvine, CA 92618',
          email: 'accounts@prophecytechs.com',
          website: 'www.prophecytechs.com'
        }
      },
      attachments: await prepareAttachments(attachments)
    };

    // Mock API call - replace with actual SendGrid API in production
    console.log('Mock sending email:', emailData);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Email sent to ${invoiceData.email}`,
          details: {
            recipient: invoiceData.email,
            invoiceNumber: invoiceData.invoiceNo,
            timestamp: new Date().toISOString(),
            attachments: attachments.length
          }
        });
      }, 1500);
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};

export const prepareAttachments = async (attachments) => {
  return attachments.map(attachment => {
    return {
      filename: attachment.name,
      type: attachment.type || 'application/octet-stream',
      size: attachment.size,
      disposition: 'attachment'
    };
  });
};

// Mock function to check SendGrid configuration
export const checkSendGridConfig = () => {
  return {
    apiKey: process.env.REACT_APP_SENDGRID_API_KEY || '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',
    fromEmail: process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'praveen@prophecytechs.com',
    fromName: process.env.REACT_APP_SENDGRID_FROM_NAME || 'No Reply',
    isConfigured: true
  };
};