import axios from 'axios';
import BASE_URL from '../../url';

const API_PATH = `${BASE_URL}/api/erp-invoices`;

/**
 * Service to handle unique Invoice module backend operations
 */
const invoiceService = {
  /**
   * Helper to get common headers
   */
  getHeaders(isMultipart = false) {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    if (isMultipart) headers['Content-Type'] = 'multipart/form-data';
    return { headers };
  },

  /**
   * Helper to create FormData
   */
  createFormData(invoiceData) {
    const formData = new FormData();
    const { timesheets, ...rest } = invoiceData;
    formData.append('invoiceData', JSON.stringify(rest));
    if (timesheets && Array.isArray(timesheets)) {
      timesheets.forEach(item => { if (item.file) formData.append('timesheets', item.file); });
    }
    return formData;
  },

  async getInvoices() {
    const response = await axios.get(API_PATH, this.getHeaders());
    return response.data;
  },

  async getInvoiceById(id) {
    const response = await axios.get(`${API_PATH}/${id}`, this.getHeaders());
    return response.data;
  },

  async getNextInvoiceNumber() {
    const response = await axios.get(`${API_PATH}/next-number`, this.getHeaders());
    return response.data;
  },

  async getInvoiceMetadata() {
    const response = await axios.get(`${API_PATH}/metadata`, this.getHeaders());
    return response.data;
  },

  async createInvoice(invoiceData) {
    const hasFiles = invoiceData.timesheets?.some(t => t.file);
    let payload = invoiceData;
    let config = this.getHeaders(hasFiles);
    if (hasFiles) payload = this.createFormData(invoiceData);
    const response = await axios.post(API_PATH, payload, config);
    return response.data;
  },

  async updateInvoice(id, invoiceData) {
    const hasFiles = invoiceData.timesheets?.some(t => t.file);
    let payload = invoiceData;
    let config = this.getHeaders(hasFiles);
    if (hasFiles) payload = this.createFormData(invoiceData);
    const response = await axios.put(`${API_PATH}/${id}`, payload, config);
    return response.data;
  },

  async updateInvoiceStatus(id, status) {
    const response = await axios.patch(`${API_PATH}/status/${id}`, { status }, this.getHeaders());
    return response.data;
  },

  async sendInvoiceEmail(id, pdfData = null) {
    const payload = pdfData ? {
      pdfBase64: pdfData.base64,
      pdfFilename: pdfData.filename,
      extraAttachments: pdfData.extraAttachments || []
    } : {};
    const response = await axios.post(`${API_PATH}/send/${id}`, payload, this.getHeaders());
    return response.data;
  },

  async deleteInvoice(id) {
    const response = await axios.delete(`${API_PATH}/${id}`, this.getHeaders());
    return response.data;
  },

  async deleteAttachment(invoiceId, attachmentId) {
    const response = await axios.delete(`${API_PATH}/${invoiceId}/attachments/${attachmentId}`, this.getHeaders());
    return response.data;
  }
};

export default invoiceService;