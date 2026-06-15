// BackEnd/MSA/utils/pdfGenerator.js
const puppeteer = require('puppeteer');

class PDFGenerator {
  static async generatePDF(htmlContent, options = {}) {
    let browser = null;
    try {
      console.log('📄 Generating PDF...');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      const page = await browser.newPage();
      
      await page.setViewport({
        width: options.width || 1200,
        height: options.height || 800
      });
      
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      await page.evaluateHandle('document.fonts.ready');
      await page.emulateMediaType('screen');
      
      const pdfOptions = {
        printBackground: true,
        landscape: options.landscape || false,
        margin: {
          top: options.fullPage ? '0px' : (options.marginTop || '40px'),
          right: options.fullPage ? '0px' : (options.marginRight || '40px'),
          bottom: options.fullPage ? '0px' : (options.marginBottom || '40px'),
          left: options.fullPage ? '0px' : (options.marginLeft || '40px')
        }
      };
      
      if (options.fullPage) {
        // Measure the full height of the rendered HTML
        const bodyHeight = await page.evaluate(() => {
           // Provide a slight buffer just in case
           return Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight) + 10;
        });
        pdfOptions.width = options.pdfWidth || '850px';
        pdfOptions.height = bodyHeight + 'px';
      } else if (options.pdfWidth && options.pdfHeight) {
        pdfOptions.width = options.pdfWidth;
        pdfOptions.height = options.pdfHeight;
      } else {
        pdfOptions.format = options.format || 'A4';
      }
      const pdf = await page.pdf(pdfOptions);
      
      console.log('✅ PDF generated successfully');
      return pdf;
      
    } catch (error) {
      console.error('❌ PDF generation error:', error.message);
      throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = PDFGenerator;