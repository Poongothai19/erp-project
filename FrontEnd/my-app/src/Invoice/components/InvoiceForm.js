import React, { useState, useEffect } from 'react';
import { 
  LuX, 
  LuPlus, 
  LuTrash2, 
  LuUpload, 
  LuPaperclip, 
  LuFile, 
  LuCalendar, 
  LuArrowRight, 
  LuArrowLeft,
  LuDownload,
  LuEye
} from 'react-icons/lu';
import TimesheetAttachment from './TimesheetAttachment';
import { downloadInvoicePDF, generateInvoicePDF } from '../utils/pdfGenerator';
import invoiceService from '../utils/invoiceService';
import prophecyLogo from '../../Recruitment/Assets/images/PROPHECY-LOGO-DARK.png';

const InvoiceForm = ({ invoice, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    ccEmail: '',
    
    billingAddress: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    shippingAddress: {
      sameAsBilling: true,
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    
    invoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    terms: 'Net 30',
    currency: 'INR',
    
    companyPan: 'ABCDE1234F',
    companyGst: '22AAAAA0000A1Z5',
    customerPan: '',
    customerGst: '',
    igstRate: 0,
    igstAmount: 0,
    
    bankDetails: {
      accountName: 'Prophecy Tek (OPC)Private Limited',
      bankName: 'ICICI Bank',
      accountNo: '613205039650',
      branch: 'Trichy',
      ifscCode: 'ICIC0006132'
    },
    
    items: [{
      productService: '',
      description: '',
      serviceDate: '',
      qty: 1,
      rate: 0,
      amount: 0,
      productType: 'Service',
      sku: '',
      category: '',
      incomeAccount: '',
      purchaseFromVendor: false
    }],
    
    noteToCustomer: '',
    memoOnStatement: '',
    timesheets: [],
  });

  const [activeTab, setActiveTab] = useState('customer');
  const [formErrors, setFormErrors] = useState({});
  const [showCompanyPopup, setShowCompanyPopup] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [productDetails, setProductDetails] = useState({
    name: '',
    type: 'Service',
    sku: '',
    category: '',
    description: '',
    price: 0,
    incomeAccount: '',
    purchaseFromVendor: false
  });

  const [existingCustomers, setExistingCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const tabs = [
    { id: 'customer', label: 'Customer', next: 'items' },
    { id: 'items', label: 'Invoice Items', prev: 'customer', next: 'attachments' },
    { id: 'attachments', label: 'Attachments', prev: 'items', next: 'preview' },
    { id: 'preview', label: 'Preview', prev: 'attachments' }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const currentTab = tabs[currentTabIndex];
  const isLastTab = currentTabIndex === tabs.length - 1;

  const getCurrencySymbol = (currency) => {
    if (currency === 'INR') return '₹';
    if (currency === 'USD') return '$';
    if (currency === 'EUR') return '€';
    return currency;
  };

  useEffect(() => {
    // Fetch unique customers and products from existing invoices
    invoiceService.getInvoiceMetadata()
      .then(res => {
        if (res.success) {
          setExistingCustomers(res.customers || []);
          setProducts(res.products || []);
        }
      })
      .catch(err => console.error("Error fetching metadata:", err));
  }, []);

  const truncateSelectionText = (text, maxLength = 20) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    if (!showProductPopup && currentItemIndex >= 0) {
      const currentItem = formData.items[currentItemIndex];
      if (currentItem && currentItem.productService) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`item_${currentItemIndex}_productService`];
          return newErrors;
        });
      }
    }
  }, [showProductPopup, currentItemIndex, formData.items]);

  useEffect(() => {
    if (formData.invoiceDate && formData.terms) {
      const dueDate = new Date(formData.invoiceDate);
      
      let daysToAdd = 30;
      if (formData.terms === 'Net 15') daysToAdd = 15;
      else if (formData.terms === 'Net 45') daysToAdd = 45;
      else if (formData.terms === 'Net 60') daysToAdd = 60;
      else if (formData.terms === 'Net 90') daysToAdd = 90;
      else if (formData.terms === 'Due on receipt') daysToAdd = 0;
      
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      
      setFormData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.terms, formData.invoiceDate]);

  const calculateDefaultDueDate = () => {
    const dueDate = new Date(formData.invoiceDate);
    if (formData.terms === 'Net 30') {
      dueDate.setDate(dueDate.getDate() + 30);
    } else if (formData.terms === 'Net 15') {
      dueDate.setDate(dueDate.getDate() + 15);
    } else if (formData.terms === 'Net 45') {
      dueDate.setDate(dueDate.getDate() + 45);
    } else if (formData.terms === 'Net 60') {
      dueDate.setDate(dueDate.getDate() + 60);
    } else if (formData.terms === 'Net 90') {
      dueDate.setDate(dueDate.getDate() + 90);
    } else if (formData.terms === 'Due on receipt') {
      dueDate.setDate(dueDate.getDate() + 0);
    }
    return dueDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (invoice) {
      // Convert existing timesheets from backend to the format expected by the component
      const existingTimesheets = (invoice.timesheets || []).map(ts => ({
        id: ts.id,
        _id: ts.id,
        name: ts.name,
        size: ts.size,
        type: 'existing',
        path: ts.path,
        url: ts.url,
        isExisting: true
      }));
      
      setFormData({
        ...formData,
        ...invoice,
        invoiceNo: invoice.invoiceNo || '',
        companyName: invoice.companyName || '',
        email: invoice.email || '',
        phone: invoice.phone || '',
        ccEmail: invoice.ccEmail || '',
        invoiceDate: invoice.invoiceDate || invoice.date || new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate || calculateDefaultDueDate(),
        companyPan: invoice.companyPan || 'ABCDE1234F',
        companyGst: invoice.companyGst || '22AAAAA0000A1Z5',
        customerPan: invoice.customerPan || '',
        customerGst: invoice.customerGst || '',
        igstRate: invoice.igstRate !== undefined ? invoice.igstRate : 0,
        igstAmount: invoice.igstAmount || 0,
        terms: invoice.terms || 'Net 30',
        bankDetails: invoice.bankDetails || {
          accountName: 'Prophecy Tek (OPC)Private Limited',
          bankName: 'ICICI Bank',
          accountNo: '613205039650',
          branch: 'Trichy',
          ifscCode: 'ICIC0006132'
        },
        items: invoice.items || [{
          productService: '',
          description: '',
          serviceDate: '',
          qty: 1,
          rate: 0,
          amount: 0,
          productType: 'Service',
          sku: '',
          category: '',
          incomeAccount: '',
          purchaseFromVendor: false
        }],
        timesheets: existingTimesheets,
        noteToCustomer: invoice.noteToCustomer || '',
        memoOnStatement: invoice.memoOnStatement || ''
      });
    } else {
      // NEW: Fetch sequential invoice number from backend for new invoices
      invoiceService.getNextInvoiceNumber()
        .then(res => {
          if (res.success) {
            setFormData(prev => ({
              ...prev,
              invoiceNo: res.nextInvoiceNo,
              dueDate: calculateDefaultDueDate()
            }));
          }
        })
        .catch(err => {
          console.error("Failed to fetch next invoice number, using timestamp fallback", err);
          const newInvoiceNo = `INV-${Date.now().toString().slice(-6)}`;
          setFormData(prev => ({
            ...prev,
            invoiceNo: newInvoiceNo,
            dueDate: calculateDefaultDueDate()
          }));
        });
    }
  }, [invoice]);

  const validateCurrentTab = () => {
    const errors = {};
    
    switch(activeTab) {
      case 'customer':
        if (formData.email) {
          const emails = formData.email.split(',').map(e => e.trim());
          const invalidEmail = emails.find(e => e && !/\S+@\S+\.\S+/.test(e));
          if (invalidEmail) errors.email = `Invalid email: ${invalidEmail}`;
        }
        if (formData.ccEmail) {
          const emails = formData.ccEmail.split(',').map(e => e.trim());
          const invalidEmail = emails.find(e => e && !/\S+@\S+\.\S+/.test(e));
          if (invalidEmail) errors.ccEmail = `Invalid CC email: ${invalidEmail}`;
        }
        break;
      
      case 'items':
        formData.items.forEach((item, index) => {
          if (item.qty !== undefined && item.qty !== '' && parseFloat(item.qty) < 0) {
            errors[`item_${index}_qty`] = 'Quantity cannot be negative';
          }
          if (item.rate !== undefined && item.rate !== '' && parseFloat(item.rate) < 0) {
            errors[`item_${index}_rate`] = 'Rate cannot be negative';
          }
        });
        break;
      
      default:
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentTab()) {
      return;
    }
    
    if (currentTab.next) {
      setActiveTab(currentTab.next);
    }
  };

  const handlePrevious = () => {
    if (currentTab.prev) {
      setActiveTab(currentTab.prev);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleAddressChange = (type, field, value) => {
    if (type === 'billing') {
      handleNestedChange('billingAddress', field, value);
      if (formData.shippingAddress.sameAsBilling) {
        handleNestedChange('shippingAddress', field, value);
      }
    } else {
      handleNestedChange('shippingAddress', field, value);
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      // Convert to number for qty and rate if they are being updated individually
      let finalUpdates = {};
      if (typeof field === 'object') {
        finalUpdates = { ...field };
      } else {
        finalUpdates[field] = value;
      }

      // Process numeric fields
      const numericFields = ['qty', 'rate', 'amount'];
      numericFields.forEach(f => {
        if (finalUpdates[f] !== undefined && finalUpdates[f] !== '') {
          finalUpdates[f] = parseFloat(finalUpdates[f]);
        }
      });

      updatedItems[index] = {
        ...updatedItems[index],
        ...finalUpdates
      };

      // Recalculate amount if qty or rate changed
      if (finalUpdates.qty !== undefined || finalUpdates.rate !== undefined) {
        const qty = updatedItems[index].qty || 0;
        const rate = updatedItems[index].rate || 0;
        updatedItems[index].amount = qty * rate;
      }

      return {
        ...prev,
        items: updatedItems
      };
    });

    // Clear errors for the modified fields
    if (typeof field === 'object') {
      Object.keys(field).forEach(f => {
        const errorKey = `item_${index}_${f}`;
        if (formErrors[errorKey]) {
          setFormErrors(prevErrors => ({
            ...prevErrors,
            [errorKey]: undefined
          }));
        }
      });
    } else {
      const errorKey = `item_${index}_${field}`;
      if (formErrors[errorKey]) {
        setFormErrors(prevErrors => ({
          ...prevErrors,
          [errorKey]: undefined
        }));
      }
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { 
          productService: '', 
          description: '', 
          serviceDate: '', 
          qty: 1, 
          rate: 0, 
          amount: 0,
          productType: 'Service',
          sku: '',
          category: '',
          incomeAccount: '',
          purchaseFromVendor: false
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleTimesheetUpload = (files) => {
    const newTimesheets = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: 'new',
      file,
      isExisting: false
    }));
    
    setFormData(prev => ({
      ...prev,
      timesheets: [...prev.timesheets, ...newTimesheets]
    }));
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      timesheets: prev.timesheets.filter((_, index) => index !== indexToRemove)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
    
    // Auto-calculate GST amount from rate
    const rate = parseFloat(formData.igstRate) !== undefined && !isNaN(parseFloat(formData.igstRate)) ? parseFloat(formData.igstRate) : 0;
    const igstAmount = subtotal * (rate / 100);
    const total = subtotal + igstAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      igstRate: rate,
      igstAmount: igstAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      setFormData(prev => ({
        ...prev,
        companyName: newCompanyName
      }));
      setNewCompanyName('');
      setShowCompanyPopup(false);
    }
  };

  const handleAddProduct = (index) => {
    setCurrentItemIndex(index);
    const currentItem = formData.items[index];
    setProductDetails({
      name: currentItem.productService || '',
      type: 'Service',
      sku: '',
      category: '',
      description: currentItem.description || '',
      price: currentItem.rate || 0,
      incomeAccount: '',
      purchaseFromVendor: false
    });
    setShowProductPopup(true);
  };

  const handleSaveProduct = () => {
    if (productDetails.name && !products.find(p => p.name === productDetails.name)) {
      const newProduct = {
        id: products.length + 1,
        name: productDetails.name,
        type: productDetails.type,
        rate: productDetails.price,
        description: productDetails.description,
        category: productDetails.category,
        sku: productDetails.sku,
        qty: 1, // Default qty for new products
        serviceDate: formData.invoiceDate // Default service date
      };
      setProducts(prev => [...prev, newProduct]);
    }
    
    // Auto-fill all details for the current items
    handleItemChange(currentItemIndex, {
      productService: productDetails.name,
      productType: productDetails.type,
      sku: productDetails.sku,
      category: productDetails.category,
      description: productDetails.description,
      rate: productDetails.price,
      incomeAccount: productDetails.incomeAccount,
      purchaseFromVendor: productDetails.purchaseFromVendor,
      qty: 1, // Default qty
      serviceDate: formData.invoiceDate // Default service date
    });
    
    setShowProductPopup(false);
  };

  const handleSave = async () => {
    let allValid = true;
    const allErrors = {};
    
    tabs.forEach(tab => {
      switch(tab.id) {
        case 'customer':
          if (formData.email) {
            const emails = formData.email.split(',').map(e => e.trim());
            const invalidEmail = emails.find(e => e && !/\S+@\S+\.\S+/.test(e));
            if (invalidEmail) {
              allErrors.email = `Invalid email: ${invalidEmail}`;
              allValid = false;
            }
          }
          break;
        
        case 'items':
          formData.items.forEach((item, index) => {
            if (item.qty !== '' && parseFloat(item.qty) < 0) {
              allErrors[`item_${index}_qty`] = 'Quantity cannot be negative';
              allValid = false;
            }
            if (item.rate !== '' && parseFloat(item.rate) < 0) {
              allErrors[`item_${index}_rate`] = 'Rate cannot be negative';
              allValid = false;
            }
          });
          break;
      }
    });
    
    if (!allValid) {
      setFormErrors(allErrors);
      alert('Please fix any errors before saving.');
      return;
    }
    
    try {
      const totals = calculateTotals();
      const invoiceData = {
        ...formData,
        totals,
        status: formData.status || 'Draft',
        updatedAt: new Date().toISOString()
      };
      
      // Map timesheets to include file objects for new files, metadata for existing
      // invoiceService will handle FormData conversion for files
      const saveData = {
        ...invoiceData,
        timesheets: invoiceData.timesheets.map(ts => {
          // If it has a file object, keep it (new upload)
          if (ts.file) {
            return {
              name: ts.name,
              size: ts.size,
              type: ts.type,
              file: ts.file,
              isNew: true
            };
          }
          // Otherwise it's existing, send metadata only
          return {
            id: ts.id,
            _id: ts._id,
            name: ts.name,
            size: ts.size,
            type: ts.type,
            isExisting: ts.isExisting || ts.type === 'existing'
          };
        })
      };
      
      await onSave(saveData);
      alert('Invoice saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('Error: ' + error.message);
    }
  };

  const getLogoBase64 = async () => {
    try {
      const res = await fetch(prophecyLogo);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return prophecyLogo;
    }
  };

  const buildPdfInvoiceData = async () => {
    const totals = calculateTotals();
    const logoBase64 = await getLogoBase64();
    return {
      ...formData,
      totals,
      logo: logoBase64,
      customerName: formData.companyName,
      billingAddress: formData.billingAddress
    };
  };

  const handleDownloadPDF = async () => {
    try {
      const invoiceData = await buildPdfInvoiceData();
      downloadInvoicePDF(invoiceData);
      console.log('PDF downloaded for:', invoiceData.invoiceNo);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleSaveAndSend = async () => {
    // 1. Run the same full validation as handleSave
    let allValid = true;
    const allErrors = {};
    tabs.forEach(tab => {
      switch(tab.id) {
        case 'customer':
          if (formData.email) {
            const emails = formData.email.split(',').map(e => e.trim());
            const invalidEmail = emails.find(e => e && !/\S+@\S+\.\S+/.test(e));
            if (invalidEmail) {
              allErrors.email = `Invalid email: ${invalidEmail}`;
              allValid = false;
            }
          }
          break;
        case 'items':
          formData.items.forEach((item, index) => {
            if (item.qty !== '' && parseFloat(item.qty) < 0) {
              allErrors[`item_${index}_qty`] = 'Quantity cannot be negative';
              allValid = false;
            }
            if (item.rate !== '' && parseFloat(item.rate) < 0) {
              allErrors[`item_${index}_rate`] = 'Rate cannot be negative';
              allValid = false;
            }
          });
          break;
      }
    });
    if (!allValid) {
      setFormErrors(allErrors);
      alert('Please fix any errors before sending.');
      return;
    }

    if (!formData.email) {
      alert('Please enter a client email address before sending.');
      return;
    }

    try {
      // 2. Save the invoice first
      const totals = calculateTotals();
      const saveData = {
        ...formData,
        totals,
        status: formData.status || 'Draft',
        updatedAt: new Date().toISOString()
      };
      
      // Map timesheets to include file objects for new files, metadata for existing
      // invoiceService will handle FormData conversion for files
      const cleanSaveData = {
        ...saveData,
        timesheets: saveData.timesheets.map(ts => {
          // If it has a file object, keep it (new upload)
          if (ts.file) {
            return {
              name: ts.name,
              size: ts.size,
              type: ts.type,
              file: ts.file,
              isNew: true
            };
          }
          // Otherwise it's existing, send metadata only
          return {
            id: ts.id,
            _id: ts._id,
            name: ts.name,
            size: ts.size,
            type: ts.type,
            isExisting: ts.isExisting || ts.type === 'existing'
          };
        })
      };
      
      const saveResult = await onSave(cleanSaveData);

      // 3. Determine the invoice ID (from save result or existing invoice)
      const invoiceId = saveResult?.id || invoice?.id;
      if (!invoiceId) {
        alert('Invoice saved, but could not determine ID to send email. Please send from the list.');
        return;
      }

      // 4. Generate the PDF in the browser
      const pdfInvoiceData = await buildPdfInvoiceData();
      const doc = generateInvoicePDF(pdfInvoiceData);
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // 5. Convert all timesheets (including existing ones) to base64 for email
      const allAttachments = [];
      
      for (const ts of formData.timesheets) {
        if (ts.isExisting && ts.url) {
          // For existing attachments, fetch from server
          try {
            const response = await fetch(ts.url);
            const blob = await response.blob();
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(blob);
            });
            allAttachments.push({
              content: base64,
              filename: ts.name,
              type: 'application/octet-stream'
            });
          } catch (err) {
            console.error(`Failed to fetch existing attachment ${ts.name}:`, err);
          }
        } else if (ts.file) {
          // For new attachments
          const fileBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(ts.file);
          });
          allAttachments.push({
            content: fileBase64,
            filename: ts.name,
            type: ts.file.type || 'application/octet-stream'
          });
        }
      }

      // 6. Send the email with the PDF + all attachments
      const emailResult = await invoiceService.sendInvoiceEmail(invoiceId, {
        base64: pdfBase64,
        filename: `Invoice-${formData.invoiceNo}.pdf`,
        extraAttachments: allAttachments
      });

      if (emailResult.success) {
        alert('Invoice saved and PDF sent to client successfully!');
        onClose();
      } else {
        alert('Invoice saved, but email failed: ' + (emailResult.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in save and send:', error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const renderCustomerTab = () => (
    <div className="inv-module-customer-section">
      <div className="inv-module-section-header">
        Client Information (Bill To)
      </div>
      
      <div className="inv-module-currency-selector">
        <label className="inv-module-form-label">Currency:</label>
        <select 
          className="inv-module-form-select"
          value={formData.currency}
          onChange={(e) => handleInputChange('currency', e.target.value)}
        >
          <option value="INR">INR - Indian Rupee</option>
          <option value="USD">USD - United States Dollar</option>
          <option value="EUR">EUR - Euro</option>
        </select>
      </div>

      <div className="inv-module-form-grid">
        <div className="inv-module-form-group">
          <label className="inv-module-form-label">Client / Customer Name</label>
          <input
            type="text"
            list="existing-customers"
            className={`inv-module-form-input ${formErrors.companyName ? 'inv-module-input-error' : ''}`}
            value={formData.companyName}
            onChange={(e) => {
              const name = e.target.value;
              handleInputChange('companyName', name);
              
              // Auto-fill if it matches an existing customer exactly
              const customer = existingCustomers.find(c => c.name === name);
              if (customer) {
                setFormData(prev => ({
                  ...prev,
                  email: customer.email || prev.email,
                  phone: customer.phone || prev.phone,
                  ccEmail: customer.ccEmail || prev.ccEmail,
                  companyPan: customer.companyPan || prev.companyPan,
                  companyGst: customer.companyGst || prev.companyGst,
                  customerPan: customer.customerPan || prev.customerPan,
                  customerGst: customer.customerGst || prev.customerGst,
                  billingAddress: customer.billingAddress || prev.billingAddress,
                  shippingAddress: customer.shippingAddress || prev.shippingAddress,
                  bankDetails: customer.bankDetails || prev.bankDetails
                }));
              }
            }}
            placeholder="Search or enter client name..."
          />
          <datalist id="existing-customers">
            {existingCustomers.map((customer, idx) => (
              <option key={idx} value={customer.name} />
            ))}
          </datalist>
          {formErrors.companyName && (
            <span className="inv-module-error-message">{formErrors.companyName}</span>
          )}
        </div>

        <div className="inv-module-form-group">
          <label className="inv-module-form-label">Client Email(s) (separated by commas)</label>
          <input
            type="text"
            className={`inv-module-form-input ${formErrors.email ? 'inv-module-input-error' : ''}`}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="e.g. client1@example.com, client2@example.com"
          />
          {formErrors.email && (
            <span className="inv-module-error-message">{formErrors.email}</span>
          )}
        </div>

        <div className="inv-module-form-group">
          <label className="inv-module-form-label">CC Email(s) (separated by commas)</label>
          <input
            type="text"
            className="inv-module-form-input"
            value={formData.ccEmail}
            onChange={(e) => handleInputChange('ccEmail', e.target.value)}
            placeholder="e.g. boss@example.com, manager@example.com"
          />
        </div>

        <div className="inv-module-form-group">
          <label className="inv-module-form-label">Prophecy PAN No</label>
          <input
            type="text"
            className="inv-module-form-input"
            value={formData.companyPan}
            onChange={(e) => handleInputChange('companyPan', e.target.value)}
          />
        </div>

        <div className="inv-module-form-group">
          <label className="inv-module-form-label">Prophecy GST No</label>
          <input
            type="text"
            className="inv-module-form-input"
            value={formData.companyGst}
            onChange={(e) => handleInputChange('companyGst', e.target.value)}
          />
        </div>

        <div className="inv-module-form-group">
          <label className="inv-module-form-label">Client PAN No</label>
          <input
            type="text"
            className="inv-module-form-input"
            value={formData.customerPan}
            onChange={(e) => handleInputChange('customerPan', e.target.value)}
          />
        </div>

        <div className="inv-module-form-group">
          <label className="inv-module-form-label">Client GST No</label>
          <input
            type="text"
            className="inv-module-form-input"
            value={formData.customerGst}
            onChange={(e) => handleInputChange('customerGst', e.target.value)}
          />
        </div>

        <div className="inv-module-form-group">
          <label className="inv-module-form-label">GST Rate (%)</label>
          <input
            type="number"
            className="inv-module-form-input"
            value={formData.igstRate}
            onChange={(e) => handleInputChange('igstRate', e.target.value === '' ? 0 : parseFloat(e.target.value) ?? 0)}
            placeholder="e.g., 18"
            min="0"
            step="0.01"
          />
        </div>

        <div className="inv-module-form-group">
          <label className="inv-module-form-label">GST Amount (Auto-calculated)</label>
          <input
            type="number"
            className="inv-module-form-input"
            value={calculateTotals().igstAmount}
            readOnly
            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
          />
        </div>
      </div>

      <div className="inv-module-address-section">
        <h3 className="inv-module-section-header">Client Billing Address (Bill To)</h3>
        <div className="inv-module-form-grid">
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">Street Address 1</label>
            <input
              type="text"
              className="inv-module-form-input"
              value={formData.billingAddress.street1}
              onChange={(e) => handleAddressChange('billing', 'street1', e.target.value)}
            />
          </div>
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">Street Address 2</label>
            <input
              type="text"
              className="inv-module-form-input"
              value={formData.billingAddress.street2}
              onChange={(e) => handleAddressChange('billing', 'street2', e.target.value)}
            />
          </div>
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">City</label>
            <input
              type="text"
              className="inv-module-form-input"
              value={formData.billingAddress.city}
              onChange={(e) => handleAddressChange('billing', 'city', e.target.value)}
            />
          </div>
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">State</label>
            <input
              type="text"
              className="inv-module-form-input"
              value={formData.billingAddress.state}
              onChange={(e) => handleAddressChange('billing', 'state', e.target.value)}
            />
          </div>
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">ZIP Code</label>
            <input
              type="text"
              className="inv-module-form-input"
              value={formData.billingAddress.zipCode}
              onChange={(e) => handleAddressChange('billing', 'zipCode', e.target.value)}
            />
          </div>
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">Country</label>
            <select
              className="inv-module-form-select"
              value={formData.billingAddress.country}
              onChange={(e) => handleAddressChange('billing', 'country', e.target.value)}
            >
              <option value="USA">United States</option>
              <option value="India">India</option>
              <option value="UK">United Kingdom</option>
            </select>
          </div>
        </div>

        <div className="inv-module-shipping-address">
          <div className="inv-module-checkbox-group">
            <input
              type="checkbox"
              id="sameAsBilling"
              checked={formData.shippingAddress.sameAsBilling}
              onChange={(e) => handleNestedChange('shippingAddress', 'sameAsBilling', e.target.checked)}
            />
            <label htmlFor="sameAsBilling">Same as billing address</label>
          </div>

          {!formData.shippingAddress.sameAsBilling && (
            <>
              <h3 className="inv-module-section-header">Shipping Address</h3>
              <div className="inv-module-form-grid">
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">Street Address 1</label>
                  <input
                    type="text"
                    className="inv-module-form-input"
                    value={formData.shippingAddress.street1}
                    onChange={(e) => handleAddressChange('shipping', 'street1', e.target.value)}
                  />
                </div>
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">Street Address 2</label>
                  <input
                    type="text"
                    className="inv-module-form-input"
                    value={formData.shippingAddress.street2}
                    onChange={(e) => handleAddressChange('shipping', 'street2', e.target.value)}
                  />
                </div>
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">City</label>
                  <input
                    type="text"
                    className="inv-module-form-input"
                    value={formData.shippingAddress.city}
                    onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)}
                  />
                </div>
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">State</label>
                  <input
                    type="text"
                    className="inv-module-form-input"
                    value={formData.shippingAddress.state}
                    onChange={(e) => handleAddressChange('shipping', 'state', e.target.value)}
                  />
                </div>
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">ZIP Code</label>
                  <input
                    type="text"
                    className="inv-module-form-input"
                    value={formData.shippingAddress.zipCode}
                    onChange={(e) => handleAddressChange('shipping', 'zipCode', e.target.value)}
                  />
                </div>
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">Country</label>
                  <select
                    className="inv-module-form-select"
                    value={formData.shippingAddress.country}
                    onChange={(e) => handleAddressChange('shipping', 'country', e.target.value)}
                  >
                    <option value="USA">United States</option>
                    <option value="India">India</option>
                    <option value="UK">United Kingdom</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="inv-module-bank-details" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h3 className="inv-module-section-header" style={{ marginBottom: '15px', color: '#019d88' }}>Bank Details</h3>
        <div className="inv-module-form-grid">
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">Account Name</label>
            <input
              type="text"
              className="inv-module-form-input"
              value={formData.bankDetails.accountName}
              onChange={(e) => handleNestedChange('bankDetails', 'accountName', e.target.value)}
            />
          </div>
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">Bank Name</label>
            <input
              type="text"
              className="inv-module-form-input"
              value={formData.bankDetails.bankName}
              onChange={(e) => handleNestedChange('bankDetails', 'bankName', e.target.value)}
            />
          </div>
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">Account No</label>
            <input
              type="text"
              className="inv-module-form-input"
              value={formData.bankDetails.accountNo}
              onChange={(e) => handleNestedChange('bankDetails', 'accountNo', e.target.value)}
            />
          </div>
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">Branch</label>
            <input
              type="text"
              className="inv-module-form-input"
              value={formData.bankDetails.branch}
              onChange={(e) => handleNestedChange('bankDetails', 'branch', e.target.value)}
            />
          </div>
          <div className="inv-module-form-group">
            <label className="inv-module-form-label">IFSC Code</label>
            <input
              type="text"
              className="inv-module-form-input"
              value={formData.bankDetails.ifscCode}
              onChange={(e) => handleNestedChange('bankDetails', 'ifscCode', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderItemsTab = () => {
    const totals = calculateTotals();
    const currencySymbol = getCurrencySymbol(formData.currency);
    
    return (
      <div className="inv-module-items-section">
        <div className="inv-module-section-header">
          <span>Invoice Items</span>
          <button type="button" className="inv-module-btn-add-item" onClick={addItem}>
            <LuPlus size={16} /> Add Item
          </button>
        </div>

        <div className="inv-module-invoice-details">
          <div className="inv-module-form-grid">
            <div className="inv-module-form-group">
              <label className="inv-module-form-label">Invoice No.</label>
              <input
                type="text"
                className="inv-module-form-input"
                value={formData.invoiceNo}
                onChange={(e) => handleInputChange('invoiceNo', e.target.value)}
              />
            </div>
            <div className="inv-module-form-group">
              <label className="inv-module-form-label">Terms</label>
              <select
                className="inv-module-form-select"
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Net 90">Net 90</option>
                <option value="Due on receipt">Due on receipt</option>
              </select>
            </div>
            <div className="inv-module-form-group">
              <label className="inv-module-form-label">Invoice Date</label>
              <div className="inv-module-date-input">
                <LuCalendar className="inv-module-date-icon" />
                <input
                  type="date"
                  className="inv-module-form-input"
                  value={formData.invoiceDate}
                  onChange={(e) => {
                    handleInputChange('invoiceDate', e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="inv-module-form-group">
              <label className="inv-module-form-label">Due Date</label>
              <div className="inv-module-date-input">
                <LuCalendar className="inv-module-date-icon" />
                <input
                  type="date"
                  className="inv-module-form-input"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="inv-module-items-table-container">
          <table className="inv-module-items-table">
            <thead>
              <tr>
                <th>Product/Service</th>
                <th>Service Date</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="inv-module-dropdown-container">
                      <select
                        className={`inv-module-form-select ${formErrors[`item_${index}_productService`] ? 'inv-module-input-error' : ''}`}
                        value={item.productService}
                        title={item.productService || 'Select Product/Service'}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            handleAddProduct(index);
                            if (formErrors[`item_${index}_productService`]) {
                              setFormErrors(prev => ({
                                ...prev,
                                [`item_${index}_productService`]: undefined
                              }));
                            }
                          } else {
                            const selectedProduct = products.find(p => p.name === e.target.value);
                            if (selectedProduct) {
                              // Auto-fill all details from metadata
                              handleItemChange(index, {
                                productService: selectedProduct.name,
                                rate: selectedProduct.rate || 0,
                                qty: selectedProduct.qty || 1,
                                description: selectedProduct.description || '',
                                serviceDate: selectedProduct.serviceDate ? 
                                  new Date(selectedProduct.serviceDate).toISOString().split('T')[0] : 
                                  formData.invoiceDate
                              });
                            } else {
                              handleItemChange(index, 'productService', e.target.value);
                            }
                            
                            if (formErrors[`item_${index}_productService`]) {
                              setFormErrors(prev => ({
                                ...prev,
                                [`item_${index}_productService`]: undefined
                              }));
                            }
                          }
                        }}
                      >
                        <option value="">Select Product/Service</option>
                        {products.map((product, idx) => (
                          <option key={idx} value={product.name} title={product.name}>
                            {truncateSelectionText(product.name)} {product.rate ? `- ${currencySymbol} ${parseFloat(product.rate).toFixed(2)}` : ''}
                            {product.type === 'Service' ? '/hr' : ''}
                          </option>
                        ))}
                        <option value="custom">+ Add Custom...</option>
                      </select>
                      <button 
                        type="button" 
                        className="inv-module-btn-add-company"
                        onClick={() => handleAddProduct(index)}
                      >
                        <LuPlus size={12} /> Add New
                      </button>
                    </div>
                    {formErrors[`item_${index}_productService`] && (
                      <span className="inv-module-error-message-small">{formErrors[`item_${index}_productService`]}</span>
                    )}
                  </td>
                  <td>
                    <div className="inv-module-date-input">
                      <LuCalendar className="inv-module-date-icon" />
                      <input
                        type="date"
                        className="inv-module-form-input"
                        value={item.serviceDate}
                        onChange={(e) => handleItemChange(index, 'serviceDate', e.target.value)}
                      />
                    </div>
                  </td>
                  <td>
                    <textarea
                      className="inv-module-form-textarea"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      rows="2"
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      className={`inv-module-form-input ${formErrors[`item_${index}_qty`] ? 'inv-module-input-error' : ''}`}
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      min="1"
                      step="1"
                    />
                    {formErrors[`item_${index}_qty`] && (
                      <span className="inv-module-error-message-small">{formErrors[`item_${index}_qty`]}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      className={`inv-module-form-input ${formErrors[`item_${index}_rate`] ? 'inv-module-input-error' : ''}`}
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      step="0.01"
                    />
                    {formErrors[`item_${index}_rate`] && (
                      <span className="inv-module-error-message-small">{formErrors[`item_${index}_rate`]}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <input
                      type="text"
                      className="inv-module-form-input inv-module-amount-display"
                      value={`${currencySymbol} ${(parseFloat(item.amount) || 0).toFixed(2)}`}
                      readOnly
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        className="inv-module-btn-remove-item"
                        onClick={() => removeItem(index)}
                      >
                        <LuTrash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="inv-module-totals-section" style={{ marginTop: '20px', padding: '0' }}>
          <div className="inv-module-total-row" style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
            <span style={{ width: '150px', textAlign: 'right' }}>Subtotal:</span>
            <span style={{ width: '120px', textAlign: 'right', fontWeight: 'bold' }}>{currencySymbol} {totals.subtotal}</span>
          </div>
          <div className="inv-module-total-row" style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
            <span style={{ width: '150px', textAlign: 'right' }}>GST ({formData.igstRate}%):</span>
            <span style={{ width: '120px', textAlign: 'right', fontWeight: 'bold' }}>{currencySymbol} {totals.igstAmount}</span>
          </div>
          <div className="inv-module-total-row inv-module-grand-total" style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0', borderTop: '2px solid #019d88', marginTop: '5px' }}>
            <span style={{ width: '150px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>Total Due:</span>
            <span style={{ width: '120px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>{currencySymbol} {totals.total}</span>
          </div>
        </div>

        {showCompanyPopup && (
          <div className="inv-module-popup-overlay">
            <div className="inv-module-popup-content">
              <div className="inv-module-popup-header">
                <h2 className="inv-module-popup-title">Add New Company</h2>
                <button className="inv-module-popup-close" onClick={() => setShowCompanyPopup(false)}>
                  <LuX size={24} />
                </button>
              </div>
              <div className="inv-module-popup-body">
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">Company Name</label>
                  <input
                    type="text"
                    className="inv-module-form-input"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="inv-module-popup-actions">
                  <button 
                    className="inv-module-btn-secondary" 
                    onClick={() => setShowCompanyPopup(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="inv-module-btn-primary" 
                    onClick={handleAddCompany}
                  >
                    Add Company
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showProductPopup && (
          <div className="inv-module-popup-overlay">
            <div className="inv-module-popup-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="inv-module-popup-header">
                <h2 className="inv-module-popup-title">Add Product/Service</h2>
                <button className="inv-module-popup-close" onClick={() => setShowProductPopup(false)}>
                  <LuX size={24} />
                </button>
              </div>
              <div className="inv-module-popup-body">
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">Name</label>
                  <input
                    type="text"
                    className="inv-module-form-input"
                    value={productDetails.name}
                    onChange={(e) => setProductDetails(prev => ({...prev, name: e.target.value}))}
                    placeholder="Add a service name"
                  />
                </div>
                
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">Item type</label>
                  <select
                    className="inv-module-form-select"
                    value={productDetails.type}
                    onChange={(e) => setProductDetails(prev => ({...prev, type: e.target.value}))}
                  >
                    <option value="Service">Service</option>
                    <option value="Product">Product</option>
                    <option value="Discount">Discount</option>
                  </select>
                </div>
                
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">Sales</label>
                  <textarea
                    className="inv-module-form-textarea"
                    value={productDetails.description}
                    onChange={(e) => setProductDetails(prev => ({...prev, description: e.target.value}))}
                    placeholder="Description"
                    rows="3"
                  />
                </div>
                
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">Price/rate</label>
                  <input
                    type="number"
                    className="inv-module-form-input"
                    value={productDetails.price}
                    onChange={(e) => setProductDetails(prev => ({...prev, price: parseFloat(e.target.value) || 0}))}
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div className="inv-module-form-group">
                  <label className="inv-module-form-label">Income account</label>
                  <select
                    className="inv-module-form-select"
                    value={productDetails.incomeAccount}
                    onChange={(e) => setProductDetails(prev => ({...prev, incomeAccount: e.target.value}))}
                  >
                    <option value="">Select income account</option>
                    <option value="Consulting Revenue">Consulting Revenue</option>
                    <option value="Service Revenue">Service Revenue</option>
                    <option value="Product Sales">Product Sales</option>
                    <option value="Other Income">Other Income</option>
                  </select>
                </div>
                
                <div className="inv-module-checkbox-group">
                  <input
                    type="checkbox"
                    id="purchaseFromVendor"
                    checked={productDetails.purchaseFromVendor || false}
                    onChange={(e) => setProductDetails(prev => ({...prev, purchaseFromVendor: e.target.checked}))}
                  />
                  <label htmlFor="purchaseFromVendor">I purchase this service from a vendor</label>
                </div>
                
                <div className="inv-module-popup-actions">
                  <button 
                    className="inv-module-btn-secondary" 
                    onClick={() => setShowProductPopup(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="inv-module-btn-primary" 
                    onClick={handleSaveProduct}
                  >
                    Save and close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAttachmentsTab = () => (
    <div className="inv-module-attachments-section">
      <h3 className="inv-module-section-header">Attachments</h3>
      
      <div className="inv-module-notes-section">
        <div className="inv-module-form-group">
          <label className="inv-module-form-label">Note to Customer</label>
          <textarea
            className="inv-module-form-textarea"
            value={formData.noteToCustomer}
            onChange={(e) => handleInputChange('noteToCustomer', e.target.value)}
            placeholder="Add a note for your customer"
            rows="3"
          />
        </div>
        <div className="inv-module-form-group">
          <label className="inv-module-form-label">Memo on Statement</label>
          <input
            type="text"
            className="inv-module-form-input"
            value={formData.memoOnStatement}
            onChange={(e) => handleInputChange('memoOnStatement', e.target.value)}
            placeholder="This memo will appear on statements"
          />
        </div>
      </div>

      <TimesheetAttachment
        timesheets={formData.timesheets}
        onUpload={handleTimesheetUpload}
        onRemove={handleRemoveAttachment}
      />
    </div>
  );

 const renderPreviewTab = () => {
  const totals = calculateTotals();
  const currencySymbol = getCurrencySymbol(formData.currency);
  
  // Get header labels based on currency
  const getUnitPriceHeader = () => {
    if (formData.currency === 'INR') return 'UNIT PRICE (INR)';
    return 'UNIT PRICE';
  };
  
  const getTotalHeader = () => {
    if (formData.currency === 'INR') return 'TOTAL (INR)';
    return 'TOTAL';
  };
  
  // Format amount without currency symbol for INR
  const formatAmount = (value, currency) => {
    const num = parseFloat(value) || 0;
    if (currency === 'INR') {
      return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return `${currencySymbol} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  return (
    <div className="inv-module-preview-section">
      <h3 className="inv-module-section-header">Invoice Preview</h3>
      
      <div className="inv-module-preview-content" style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        color: '#333',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '850px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', minHeight: '80px' }}>
          <div className="inv-module-preview-logo" style={{ maxWidth: '200px' }}>
            <img src={prophecyLogo} alt="Prophecy" style={{ display: 'block', maxHeight: '70px', maxWidth: '100%', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div><strong>Invoice No:</strong> {formData.invoiceNo}</div>
              <div><strong>Date:</strong> {formatDate(formData.invoiceDate)}</div>
              <div><strong>Payment terms:</strong> {formData.terms}</div>
              <div><strong>Due Date:</strong> {formatDate(formData.dueDate)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', color: '#000', fontWeight: 'bold' }}>Prophecy Tek (OPC) Private Limited</h2>
            <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#444' }}>
              <p style={{ margin: '0 0 4px 0' }}>Plot no.13, Bharathi Nagar 7T</p>
              <p style={{ margin: '0 0 4px 0' }}>Sangiliyandapuram, Tiruchirapalli, TN 620001</p>
              <p style={{ margin: '0 0 4px 0' }}>accounts@prophecytechs.com</p>
              <p style={{ margin: '0 0 4px 0' }}>www.prophecytechs.com</p>
              <p style={{ margin: '10px 0 4px 0' }}><strong>PAN No:</strong> {formData.companyPan}</p>
              <p style={{ margin: '0 0 4px 0' }}><strong>GST No:</strong> {formData.companyGst}</p>
            </div>
          </div>
          
          <div style={{ flex: 1, textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#000', fontWeight: 'bold' }}>BILL TO</h3>
            <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#444' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '15px', color: '#000' }}>{formData.companyName || 'tcs'}</p>
              {formData.billingAddress?.street1 && <p style={{ margin: '0 0 4px 0' }}>{formData.billingAddress.street1}</p>}
              <p style={{ margin: '0 0 4px 0' }}>
                {formData.billingAddress?.city && `${formData.billingAddress.city}, `}
                {formData.billingAddress?.state} {formData.billingAddress?.zipCode}
              </p>
              <p style={{ margin: '10px 0 4px 0' }}><strong>PAN No:</strong> {formData.customerPan}</p>
              <p style={{ margin: '0 0 4px 0' }}><strong>GST No:</strong> {formData.customerGst}</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#019d88', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', border: '1px solid #018b78' }}>DATE</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', border: '1px solid #018b78' }}>DESCRIPTION</th>
                <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', border: '1px solid #018b78' }}>QTY</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', border: '1px solid #018b78' }}>{getUnitPriceHeader()}</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', border: '1px solid #018b78' }}>{getTotalHeader()}</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '10px', fontSize: '12px', border: '1px solid #eee' }}>{formatDate(item.serviceDate || formData.invoiceDate)}</td>
                  <td style={{ padding: '10px', fontSize: '12px', border: '1px solid #eee' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.productService}</div>
                    {item.description && <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{item.description}</div>}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px', border: '1px solid #eee' }}>{item.qty}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', border: '1px solid #eee' }}>{formatAmount(item.rate, formData.currency)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', border: '1px solid #eee' }}>{formatAmount(item.amount, formData.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '20px', gap: '40px' }}>
           <div style={{ flex: 1.5 }}>
             <div style={{ border: '1px solid #ddd', padding: '12px', minHeight: '80px', borderRadius: '4px' }}>
               <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>NOTES:</div>
               <div style={{ fontSize: '12px' }}>{formData.noteToCustomer}</div>
             </div>
             
             <div style={{ marginTop: '30px' }}>
               <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#000', borderBottom: '1px solid #019d88', paddingBottom: '3px', display: 'inline-block' }}>BANK DETAILS</h4>
               <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#444' }}>
                 <p style={{ margin: '0' }}><strong>ACCOUNT NAME:</strong> {formData.bankDetails?.accountName}</p>
                 <p style={{ margin: '0' }}><strong>Bank Name:</strong> {formData.bankDetails?.bankName}</p>
                 <p style={{ margin: '0' }}><strong>ACCOUNT No:</strong> {formData.bankDetails?.accountNo}</p>
                 <p style={{ margin: '0' }}><strong>Branch:</strong> {formData.bankDetails?.branch}</p>
                 <p style={{ margin: '0' }}><strong>IFSC Code:</strong> {formData.bankDetails?.ifscCode}</p>
               </div>
             </div>
           </div>

           <div style={{ width: '250px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}>
               <span>SUB TOTAL</span>
               <span style={{ fontWeight: 'bold' }}>{formatAmount(totals.subtotal, formData.currency)}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}>
               <span>{formData.currency === 'INR' ? `IGST (${formData.igstRate}%)` : `GST (${formData.igstRate}%)`}</span>
               <span style={{ fontWeight: 'bold' }}>{formatAmount(totals.igstAmount, formData.currency)}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #019d88', marginTop: '5px' }}>
               <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{formData.currency === 'INR' ? 'TOTAL (INR)' : 'TOTAL'}</span>
               <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{formatAmount(totals.total, formData.currency)}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
               <span style={{ fontWeight: 'bold', color: '#019d88', fontSize: '16px' }}>{formData.currency === 'INR' ? 'GRAND TOTAL (INR)' : 'GRAND TOTAL'}</span>
               <span style={{ fontWeight: 'bold', color: '#019d88', fontSize: '16px' }}>{formatAmount(totals.total, formData.currency)}</span>
             </div>
           </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <div style={{ marginBottom: '20px', fontSize: '20px', color: '#019d88', fontWeight: 'bold', fontStyle: 'italic' }}>
            Thankyou
          </div>
        </div>
      </div>
      <div className="inv-module-download-preview" style={{ marginTop: '30px', textAlign: 'center' }}>
        <button 
          className="inv-module-btn-primary"
          onClick={handleDownloadPDF}
          style={{ padding: '12px 30px', fontSize: '16px' }}
        >
          <LuDownload size={18} /> Download Invoice PDF
        </button>
      </div>
    </div>
  );
};

  const renderTabContent = () => {
    switch(activeTab) {
      case 'customer': return renderCustomerTab();
      case 'items': return renderItemsTab();
      case 'attachments': return renderAttachmentsTab();
      case 'preview': return renderPreviewTab();
      default: return null;
    }
  };

  return (
    <div className="inv-module-modal-content">
      <div className="inv-module-modal-header">
        <h2 className="inv-module-modal-title">
          {invoice ? 'Edit Invoice' : 'Create New Invoice'}
        </h2>
        <button className="inv-module-modal-close" onClick={onClose}>
          <LuX size={24} />
        </button>
      </div>

      <div className="inv-module-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`inv-module-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="inv-module-tab-content">
        {renderTabContent()}
      </div>

      <div className="inv-module-form-actions">
        <div className="inv-module-navigation-info">
          Step {currentTabIndex + 1} of {tabs.length}: {currentTab.label}
        </div>
        
        <div className="inv-module-navigation-buttons">
          <button 
            type="button" 
            className="inv-module-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          
          <div className="inv-module-step-buttons">
            {currentTab.prev && (
              <button 
                type="button" 
                className="inv-module-btn-secondary"
                onClick={handlePrevious}
              >
                <LuArrowLeft size={16} /> Previous
              </button>
            )}
            
            {!isLastTab ? (
              <button 
                type="button" 
                className="inv-module-btn-primary"
                onClick={handleNext}
              >
                Next <LuArrowRight size={16} />
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  className="inv-module-btn-secondary"
                  onClick={handleSave}
                >
                  Save
                </button>
                <button 
                  type="button" 
                  className="inv-module-btn-primary"
                  onClick={handleSaveAndSend}
                >
                  Review & Send
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;