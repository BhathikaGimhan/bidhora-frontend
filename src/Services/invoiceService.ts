import { jsPDF } from 'jspdf';

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
   * Generate invoice PDF
   */
  static async generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald-500
    const darkColor: [number, number, number] = [31, 41, 55]; // Gray-800
    const lightGray: [number, number, number] = [243, 244, 246]; // Gray-100
    
    let yPos = 20;

    // Header with company logo/name
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Add Bidhora logo - load from public folder
    try {
      const logoUrl = '/bidhora-logo.png';
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            // Convert image to canvas to get base64
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const imgData = canvas.toDataURL('image/png');
              doc.addImage(imgData, 'PNG', 15, 8, 30, 30);
              console.log('Bidhora logo added successfully to invoice');
            }
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error('Failed to load logo image'));
        img.src = logoUrl;
      });
    } catch (e) {
      // If logo fails to load, continue without it
      console.warn('Failed to add Bidhora logo to invoice:', e);
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(this.COMPANY_NAME, 50, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Digital Solution Platform', 50, 30);
    
    // Invoice title on the right
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - 20, 25, { align: 'right' });
    
    yPos = 55;

    // Invoice details box
    doc.setFillColor(...lightGray);
    doc.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'F');
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice Number: ${data.invoiceNumber}`, 25, yPos + 8);
    doc.text(`Date: ${data.invoiceDate}`, 25, yPos + 15);
    doc.text(`Transaction ID: ${data.transactionId}`, 25, yPos + 22);
    
    yPos += 35;

    // Bill To section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('BILL TO:', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text(data.buyerName, 20, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(data.buyerEmail, 20, yPos);
    
    yPos += 15;

    // Project Details section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('PROJECT DETAILS:', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text('Project Title:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    const titleLines = doc.splitTextToSize(data.projectTitle, pageWidth - 80);
    doc.text(titleLines, 60, yPos);
    yPos += titleLines.length * 5;
    
    yPos += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Project ID:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.projectId, 60, yPos);
    
    if (data.projectDescription) {
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Description:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(data.projectDescription, pageWidth - 80);
      doc.text(descLines, 60, yPos);
      yPos += descLines.length * 5;
    }
    
    yPos += 15;

    // Payment Details Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('PAYMENT DETAILS:', 20, yPos);
    
    yPos += 10;

    // Table header
    doc.setFillColor(...primaryColor);
    doc.rect(20, yPos, pageWidth - 40, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, yPos + 7);
    doc.text('Amount', pageWidth - 25, yPos + 7, { align: 'right' });
    
    yPos += 10;

    // Table rows
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'normal');
    
    const paymentTypeLabel = data.paymentType === 'deposit' 
      ? `Deposit Payment (${data.depositPercentage || 10}%)`
      : `Final Payment (${data.finalPercentage || 90}%)`;
    
    doc.setFillColor(255, 255, 255);
    doc.rect(20, yPos, pageWidth - 40, 10, 'FD');
    doc.text(paymentTypeLabel, 25, yPos + 7);
    doc.text(`${data.currency} ${data.amount.toFixed(2)}`, pageWidth - 25, yPos + 7, { align: 'right' });
    
    yPos += 10;

    if (data.totalProjectAmount) {
      doc.setFillColor(...lightGray);
      doc.rect(20, yPos, pageWidth - 40, 8, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text(`Total Project Value: ${data.currency} ${data.totalProjectAmount.toFixed(2)}`, 25, yPos + 5.5);
      yPos += 8;
    }

    // Total section
    doc.setFillColor(...darkColor);
    doc.rect(20, yPos, pageWidth - 40, 12, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PAID', 25, yPos + 8);
    doc.text(`${data.currency} ${data.amount.toFixed(2)}`, pageWidth - 25, yPos + 8, { align: 'right' });
    
    yPos += 20;

    // Payment Method
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${data.paymentMethod}`, 20, yPos);
    doc.text('Status: PAID', pageWidth - 20, yPos, { align: 'right' });
    
    // Footer
    const footerY = pageHeight - 30;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, footerY, pageWidth - 20, footerY);
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_NAME, pageWidth / 2, footerY + 5, { align: 'center' });
    doc.text(this.COMPANY_ADDRESS, pageWidth / 2, footerY + 10, { align: 'center' });
    doc.text(`${this.COMPANY_EMAIL} | ${this.COMPANY_WEBSITE}`, pageWidth / 2, footerY + 15, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your business!', pageWidth / 2, footerY + 22, { align: 'center' });

    return doc;
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
