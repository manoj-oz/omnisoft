const PDFDocument = require('pdfkit');

function generatePayslip(res, userData) {
  const doc = new PDFDocument();

  // Set headers for download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=payslip_${userData.month}.pdf`);

  doc.pipe(res);

  // Header
  doc.fontSize(20).text('OMNISOFT SYSTEMS', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Payslip for ${userData.name}`);
  doc.text(`Month: ${userData.month}`);
  doc.text(`Email: ${userData.email}`);
  doc.moveDown();

  // Salary Details
  doc.fontSize(16).text('Salary Breakdown', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(14).text(`Basic: ₹${userData.basic}`);
  doc.text(`HRA: ₹${userData.hra}`);
  doc.text(`Allowances: ₹${userData.allowances}`);
  doc.text(`Deductions: ₹${userData.deductions}`);
  doc.moveDown();

  // Net Pay (highlighted)
  doc.fontSize(16).fillColor('#0a0').text(`Net Pay: ₹${userData.net}`);

  // Finish PDF
  doc.end();
}

module.exports = generatePayslip;
