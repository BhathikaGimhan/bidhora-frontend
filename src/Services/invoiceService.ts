import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  paymentType: 'deposit' | 'final';
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  
  // Buyer details
  buyerName: string;
  buyerEmail: string;
  
  // Payment details
  amount: number;
  currency: string;
  transactionId: string;
  paymentMethod: string;
  
  // Project details
  totalProjectAmount?: number;
  depositPercentage?: number;
  finalPercentage?: number;
}

export class InvoiceService {
  private static readonly COMPANY_NAME = 'Bidhora';
  private static readonly COMPANY_ADDRESS = 'Colombo, Sri Lanka';
  private static readonly COMPANY_EMAIL = 'contact@bidhora.com';
  private static readonly COMPANY_WEBSITE = 'https://bidhora.com';

  /**
   * Generate invoice PDF using html2canvas for perfect Unicode rendering
   */
  static async generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
    // Create a temporary container for the invoice HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.style.minHeight = '297mm'; // A4 height
    container.style.backgroundColor = 'white';
    // Use the font that is already loaded in index.html
    container.style.fontFamily = '"Noto Sans Sinhala", "Poppins", sans-serif';
    
    // Construct the HTML structure
    // We use inline styles to ensure html2canvas captures everything correctly
    // Recreating the exact design from the original jsPDF implementation
    container.innerHTML = `
      <div style="padding: 0; color: #333; font-family: 'Noto Sans Sinhala', 'Poppins', sans-serif; width: 210mm; min-height: 297mm; position: relative; box-sizing: border-box;">
        
        <!-- Header Background -->
        <div style="background-color: #10b981; height: 45mm; width: 100%; position: absolute; top: 0; left: 0; z-index: 0;"></div>
        
        <!-- Header Content -->
        <div style="position: relative; z-index: 1; padding: 8mm 15mm; display: flex; justify-content: space-between; align-items: flex-start;">
           <div style="display: flex; align-items: center; gap: 15px;">
             <!-- Logo Placeholder - In frontend we can use an img tag if available, or just text -->
             <div style="width: 30mm; height: 30mm; display: flex; align-items: center; justify-content: center;">
                <img src="/bidhora-logo.png" alt="Bidhora" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'"/>
             </div>
             <div style="color: white;">
               <h1 style="font-size: 28pt; font-weight: bold; margin: 0; line-height: 1;">${this.COMPANY_NAME}</h1>
               <p style="margin: 5px 0 0 0; font-size: 10pt;">Professional Digital Solution Platform</p>
             </div>
           </div>
           <div style="text-align: right; padding-top: 10mm;">
             <h2 style="font-size: 24pt; font-weight: bold; margin: 0; color: white;">INVOICE</h2>
           </div>
        </div>

        <div style="padding: 10mm 20mm;">
          <!-- Info Box -->
          <div style="background-color: #f3f4f6; padding: 5mm; border-radius: 3mm; margin-bottom: 10mm; display: flex; flex-direction: column; gap: 2mm;">
            <div style="font-size: 10pt; font-weight: bold; color: #1f2937;">Invoice Number: ${data.invoiceNumber}</div>
            <div style="font-size: 10pt; font-weight: bold; color: #1f2937;">Date: ${data.invoiceDate}</div>
            <div style="font-size: 10pt; font-weight: bold; color: #1f2937;">Transaction ID: ${data.transactionId}</div>
          </div>

          <!-- Bill To -->
          <div style="margin-bottom: 15mm;">
            <h3 style="color: #10b981; font-size: 12pt; font-weight: bold; margin-bottom: 3mm;">BILL TO:</h3>
            <p style="margin: 0; font-weight: bold; font-size: 11pt; color: #1f2937;">${data.buyerName}</p>
            <p style="margin: 2mm 0 0 0; font-size: 10pt; color: #374151;">${data.buyerEmail}</p>
          </div>

          <!-- Project Details -->
          <div style="margin-bottom: 10mm;">
            <h3 style="color: #10b981; font-size: 12pt; font-weight: bold; margin-bottom: 3mm;">PROJECT DETAILS:</h3>
            
            <div style="margin-bottom: 2mm; display: flex; align-items: flex-start;">
              <span style="font-size: 10pt; font-weight: bold; color: #1f2937; width: 35mm; flex-shrink: 0;">Project Title:</span>
              <span style="font-size: 10pt; color: #374151;">${data.projectTitle}</span>
            </div>
            
            <div style="margin-bottom: 2mm; display: flex; align-items: flex-start;">
              <span style="font-size: 10pt; font-weight: bold; color: #1f2937; width: 35mm; flex-shrink: 0;">Project ID:</span>
              <span style="font-size: 10pt; color: #374151;">${data.projectId}</span>
            </div>
            
            ${data.projectDescription ? `
              <div style="margin-bottom: 2mm; display: flex; align-items: flex-start;">
                <span style="font-size: 10pt; font-weight: bold; color: #1f2937; width: 35mm; flex-shrink: 0;">Description:</span>
                <span style="font-size: 10pt; color: #374151; white-space: pre-wrap;">${data.projectDescription}</span>
              </div>
            ` : ''}
          </div>

          <!-- Payment Details Table -->
          <div style="margin-bottom: 10mm;">
            <h3 style="color: #10b981; font-size: 12pt; font-weight: bold; margin-bottom: 5mm;">PAYMENT DETAILS:</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #10b981; color: white;">
                  <th style="padding: 3mm 5mm; text-align: left; font-size: 10pt; font-weight: bold;">Description</th>
                  <th style="padding: 3mm 5mm; text-align: right; font-size: 10pt; font-weight: bold;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background-color: white;">
                  <td style="padding: 3mm 5mm; border-bottom: 1px solid #e5e7eb; font-size: 10pt; color: #1f2937;">
                    ${data.paymentType === 'deposit' 
                      ? `Deposit Payment (${data.depositPercentage || 10}%)` 
                      : `Final Payment (${data.finalPercentage || 90}%)`}
                  </td>
                  <td style="padding: 3mm 5mm; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10pt; color: #1f2937;">
                    ${data.currency} ${data.amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            ${data.totalProjectAmount ? `
              <div style="background-color: #f3f4f6; padding: 2mm 5mm; margin-top: 0; font-size: 9pt; color: #374151;">
                Total Project Value: ${data.currency} ${data.totalProjectAmount.toFixed(2)}
              </div>
            ` : ''}

            <!-- Total Paid Bar -->
            <div style="background-color: #1f2937; color: white; padding: 3mm 5mm; margin-top: 0; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12pt; font-weight: bold;">TOTAL PAID</span>
              <span style="font-size: 12pt; font-weight: bold;">${data.currency} ${data.amount.toFixed(2)}</span>
            </div>
          </div>

          <!-- Payment Method & Status -->
          <div style="display: flex; justify-content: space-between; font-size: 10pt; color: #1f2937; margin-bottom: 40mm;">
            <div>Payment Method: ${data.paymentMethod}</div>
            <div style="text-align: right;">Status: PAID</div>
          </div>

        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 15mm; left: 0; width: 100%; padding: 0 20mm; box-sizing: border-box;">
          <div style="border-top: 0.5px solid #10b981; margin-bottom: 5mm;"></div>
          <div style="text-align: center; color: #1f2937; font-size: 9pt;">
            <div>${this.COMPANY_NAME}</div>
            <div>${this.COMPANY_ADDRESS}</div>
            <div>${this.COMPANY_EMAIL} | ${this.COMPANY_WEBSITE}</div>
            <div style="margin-top: 3mm; font-size: 8pt; color: #808080;">Thank you for your business!</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      // Wait for fonts to load (optional but recommended)
      await document.fonts.ready;

      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      return pdf;
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      throw error;
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  }

  /**
   * Generate invoice number
   */
  static generateInvoiceNumber(paymentType: 'deposit' | 'final', projectId: string): string {
    const prefix = paymentType === 'deposit' ? 'INV-DEP' : 'INV-FIN';
    const timestamp = Date.now();
    const shortProjectId = projectId.substring(0, 6).toUpperCase();
    return `${prefix}-${shortProjectId}-${timestamp}`;
  }

  /**
   * Download invoice PDF
   */
  static async downloadInvoice(data: InvoiceData): Promise<void> {
    const doc = await this.generateInvoicePDF(data);
    const fileName = `Bidhora_Invoice_${data.invoiceNumber}.pdf`;
    doc.save(fileName);
  }

  /**
   * Get invoice as blob for email attachment
   */
  static async getInvoiceBlob(data: InvoiceData): Promise<Blob> {
    const doc = await this.generateInvoicePDF(data);
    return doc.output('blob');
  }

  /**
   * Get invoice as base64 string for email attachment
   */
  static async getInvoiceBase64(data: InvoiceData): Promise<string> {
    const doc = await this.generateInvoicePDF(data);
    return doc.output('datauristring').split(',')[1];
  }
}
