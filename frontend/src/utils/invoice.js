import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const VENDOR_BILLING_INFO = {
  companyName: 'pdfbundles Technologies LLC',
  address: '100 Pine Street, Suite 1200',
  cityStateZip: 'San Francisco, CA 94111',
  country: 'United States',
  email: 'finance@pdfbundles.com'
};

// Client-Side Dynamic A4 Invoice PDF Generator
export async function downloadInvoicePDF(invoiceId, date, period, amount, currentUser) {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions (Points)

    // Embed default Helvetica fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Retrieve saved corporate details
    let bizProfile = {};
    const localBizProfile = localStorage.getItem('pdfbundles_business_profile');
    if (localBizProfile) {
      try {
        bizProfile = JSON.parse(localBizProfile);
      } catch (e) {
        console.error(e);
      }
    }

    const companyName = bizProfile.companyName || 'pdfbundles Customer';
    const taxId = bizProfile.taxId || 'N/A';
    const billingEmail = bizProfile.billingEmail || (currentUser ? currentUser.email : 'customer@pdfbundles.com');
    const address1 = bizProfile.address1 || '123 Main Street';
    const city = bizProfile.city || 'New York';
    const zip = bizProfile.zip || '10001';
    const state = bizProfile.state || 'NY';
    const country = bizProfile.country || 'United States';

    const cityStateZip = `${city}, ${state} ${zip}`;

    // Draw header background band (violet/indigo theme)
    page.drawRectangle({
      x: 0,
      y: 730,
      width: 595.28,
      height: 112,
      color: rgb(0.12, 0.11, 0.29) // Theme Dark Violet/Indigo
    });

    // Draw Header Text
    page.drawText('PDFBUNDLES', { x: 50, y: 785, size: 24, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Free Online PDF Tools', { x: 50, y: 765, size: 10, font: fontRegular, color: rgb(0.7, 0.7, 0.8) });

    page.drawText('INVOICE', { x: 450, y: 785, size: 24, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText(invoiceId, { x: 450, y: 765, size: 12, font: fontBold, color: rgb(0.39, 0.4, 0.95) });

    // Customer / Billed To details
    let yPos = 690;
    page.drawText('BILLED TO:', { x: 50, y: yPos, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) });

    yPos -= 20;
    const userName = currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'Customer';
    const clientHeaderName = companyName !== 'pdfbundles Customer' ? companyName : (userName || 'Customer');
    page.drawText(clientHeaderName, { x: 50, y: yPos, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    yPos -= 15;
    page.drawText(billingEmail, { x: 50, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPos -= 15;
    page.drawText(address1, { x: 50, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPos -= 15;
    page.drawText(cityStateZip, { x: 50, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPos -= 15;
    page.drawText(country, { x: 50, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    if (taxId && taxId !== 'N/A') {
      yPos -= 15;
      page.drawText(`VAT / Tax ID: ${taxId}`, { x: 50, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    }

    // Provider / Billed From details
    let yPosFrom = 690;
    page.drawText('BILLED FROM:', { x: 350, y: yPosFrom, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) });

    yPosFrom -= 20;
    page.drawText(VENDOR_BILLING_INFO.companyName, { x: 350, y: yPosFrom, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    yPosFrom -= 15;
    page.drawText(VENDOR_BILLING_INFO.address, { x: 350, y: yPosFrom, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPosFrom -= 15;
    page.drawText(VENDOR_BILLING_INFO.cityStateZip, { x: 350, y: yPosFrom, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPosFrom -= 15;
    page.drawText(VENDOR_BILLING_INFO.country, { x: 350, y: yPosFrom, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPosFrom -= 15;
    page.drawText(VENDOR_BILLING_INFO.email, { x: 350, y: yPosFrom, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    // Invoice Metadata Block
    let midY = Math.min(yPos, yPosFrom) - 30;
    page.drawRectangle({
      x: 50,
      y: midY - 35,
      width: 495.28,
      height: 30,
      color: rgb(0.97, 0.97, 0.99)
    });
    page.drawText(`Date of Issue: ${date}`, { x: 60, y: midY - 23, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Billing Period: ${period}`, { x: 220, y: midY - 23, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Payment Method: Credit Card`, { x: 400, y: midY - 23, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    midY -= 55;

    // Items table header
    page.drawRectangle({
      x: 50,
      y: midY,
      width: 495.28,
      height: 25,
      color: rgb(0.94, 0.94, 0.96)
    });

    page.drawText('Description', { x: 60, y: midY + 8, size: 9, font: fontBold, color: rgb(0.12, 0.11, 0.29) });
    page.drawText('Period', { x: 260, y: midY + 8, size: 9, font: fontBold, color: rgb(0.12, 0.11, 0.29) });
    page.drawText('Qty', { x: 390, y: midY + 8, size: 9, font: fontBold, color: rgb(0.12, 0.11, 0.29) });
    page.drawText('Unit Price', { x: 430, y: midY + 8, size: 9, font: fontBold, color: rgb(0.12, 0.11, 0.29) });
    page.drawText('Total', { x: 500, y: midY + 8, size: 9, font: fontBold, color: rgb(0.12, 0.11, 0.29) });

    // Item line
    midY -= 30;
    const planName = amount === '$9.00' ? 'Starter' : 'Premium';
    page.drawText(`pdfbundles ${planName} Plan Subscription`, { x: 60, y: midY + 8, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(period, { x: 260, y: midY + 8, size: 8, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('1', { x: 395, y: midY + 8, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(amount, { x: 430, y: midY + 8, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(amount, { x: 500, y: midY + 8, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    // Divider line
    midY -= 15;
    page.drawLine({
      start: { x: 50, y: midY },
      end: { x: 545.28, y: midY },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9)
    });

    // Summary calculation blocks
    midY -= 30;
    page.drawText('Subtotal:', { x: 390, y: midY, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(amount, { x: 500, y: midY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

    midY -= 15;
    page.drawText('Tax (0.0%):', { x: 390, y: midY, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('$0.00', { x: 500, y: midY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

    midY -= 20;
    page.drawText('Total Paid:', { x: 390, y: midY, size: 11, font: fontBold, color: rgb(0.12, 0.11, 0.29) });
    page.drawText(amount, { x: 500, y: midY, size: 11, font: fontBold, color: rgb(0.12, 0.11, 0.29) });

    // Paid status badge
    let badgeY = midY + 10;
    page.drawRectangle({
      x: 50,
      y: badgeY - 15,
      width: 70,
      height: 22,
      color: rgb(0.88, 0.96, 0.91),
      borderColor: rgb(0.3, 0.7, 0.4),
      borderWidth: 1
    });
    page.drawText('PAID', { x: 74, y: badgeY - 8, size: 9, font: fontBold, color: rgb(0.1, 0.5, 0.2) });
    page.drawText('This invoice is fully paid and settled.', { x: 50, y: badgeY - 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

    // Footer lines
    page.drawLine({
      start: { x: 50, y: 120 },
      end: { x: 545.28, y: 120 },
      thickness: 1,
      color: rgb(0.95, 0.95, 0.95)
    });
    page.drawText('Terms & Conditions: Service is active for the duration of the billing period. All fees are in USD.', { x: 50, y: 100, size: 8, font: fontRegular, color: rgb(0.6, 0.6, 0.6) });
    page.drawText('pdfbundles - Thank you for your subscription. For support, contact support@pdfbundles.com.', { x: 50, y: 85, size: 8, font: fontRegular, color: rgb(0.6, 0.6, 0.6) });

    // Compile & Download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdfbundles_Invoice_${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
