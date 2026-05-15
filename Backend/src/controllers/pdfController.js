const PDFDocument = require('pdfkit');
const S18 = require('../models/S18');

// GET /api/s18/:id/pdf — Student downloads approval letter
const generateApprovalPDF = async (req, res) => {
  try {
    const form = await S18.findById(req.params.id)
      .populate('student', 'name email')
      .populate('tutorApproval.approvedBy', 'name')
      .populate('hodApproval.approvedBy', 'name')
      .populate('deanApproval.approvedBy', 'name');

    if (!form) return res.status(404).json({ message: 'Form not found' });

    // Only student who owns the form can download
    if (form.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to download this document' });
    }

    if (form.status !== 'approved') {
      return res.status(400).json({ message: 'PDF is only available for fully approved forms' });
    }

    // ── Build PDF ──
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="S18_Approval_${form.registrationNo}_${form._id}.pdf"`
    );
    doc.pipe(res);

    const PU_PURPLE = '#3C3489';
    const LIGHT_GRAY = '#F5F5F5';
    const pageW = doc.page.width;
    const margin = 50;
    const contentW = pageW - margin * 2;

    // ── HEADER BANNER ──
    doc.rect(0, 0, pageW, 90).fill(PU_PURPLE);

    // University name
    doc
      .fillColor('#FFFFFF')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('POORNIMA UNIVERSITY', margin, 20, { align: 'center', width: contentW });

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#C8C5F0')
      .text('Approved by UGC | NAAC Accredited | Jaipur, Rajasthan', margin, 44, { align: 'center', width: contentW });

    // Document title ribbon
    doc.rect(0, 90, pageW, 28).fill('#2A2362');
    doc
      .fillColor('#FFFFFF')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('S-18 ACTIVITY PERMISSION — APPROVAL LETTER', margin, 98, { align: 'center', width: contentW });

    doc.moveDown(0.5);

    // ── REF & DATE block ──
    const approvedDate = form.deanApproval?.approvedAt
      ? new Date(form.deanApproval.approvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const refNo = `PU/S18/${form.registrationNo}/${form._id.toString().slice(-6).toUpperCase()}`;

    doc.y = 134;
    doc
      .fillColor('#555555')
      .fontSize(9)
      .font('Helvetica')
      .text(`Ref No: ${refNo}`, margin, doc.y)
      .text(`Date: ${approvedDate}`, margin, doc.y, { align: 'right', width: contentW });

    doc.moveDown(0.8);

    // ── Salutation ──
    doc
      .fillColor('#111111')
      .fontSize(10.5)
      .font('Helvetica')
      .text('To,', margin)
      .font('Helvetica-Bold')
      .text(form.studentName)
      .font('Helvetica')
      .text(`Registration No.: ${form.registrationNo}`)
      .text(`${form.course} — ${form.year} | ${form.branch}`)
      .text(`Campus: ${form.campus}`);

    doc.moveDown(0.8);

    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .text('Subject: ', { continued: true })
      .font('Helvetica')
      .text(`Grant of Permission for Outside Activity under S-18 Scheme`);

    doc.moveDown(0.6);

    // ── Body ──
    const fromDateStr = form.fromDate
      ? new Date(form.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';
    const toDateStr = form.toDate
      ? new Date(form.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';

    doc
      .fontSize(10.5)
      .font('Helvetica')
      .fillColor('#222222')
      .text(
        `This is to certify that the above-mentioned student has been granted permission to participate in the following activity under the S-18 Attendance Incentive Scheme of Poornima University. The application has been duly verified and approved through the prescribed approval chain.`,
        margin,
        doc.y,
        { align: 'justify', width: contentW }
      );

    doc.moveDown(1);

    // ── Activity Details Table ──
    sectionHeader(doc, 'ACTIVITY DETAILS', margin, PU_PURPLE, contentW);
    doc.moveDown(0.4);

    const activityRows = [
      ['Activity Name', form.activityName],
      ['Organizing Institution', form.organizingInstitution],
      ['Activity Type', form.activityTypeOther ? `${form.activityType} (${form.activityTypeOther})` : form.activityType],
      ['From Date', fromDateStr],
      ['To Date', toDateStr],
      ['Team Members', form.teamMembers?.length
        ? form.teamMembers.map(m => `${m.name} (${m.registrationNo})`).join(', ')
        : 'Individual Participation'],
    ];

    drawTable(doc, activityRows, margin, contentW, LIGHT_GRAY);

    doc.moveDown(0.8);

    // ── Bonus Attendance Box ──
    const bonus = form.deanApproval?.bonusAttendanceGranted || 0;
    const bonusBoxY = doc.y;
    doc.rect(margin, bonusBoxY, contentW, 44).fill('#EAF3DE').stroke('#7BBD3E');
    doc
      .fillColor('#2D5A0E')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('BONUS ATTENDANCE GRANTED', margin + 14, bonusBoxY + 8, { width: contentW - 28 });
    doc
      .fillColor('#3B6D11')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(`${bonus} Days`, margin + 14, bonusBoxY + 20, { continued: true })
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#3B6D11')
      .text(`   (as approved by the Dean — maximum 5 days per activity day)`, { baseline: 'bottom' });

    doc.y = bonusBoxY + 52;
    doc.moveDown(0.8);

    // ── Approval Chain ──
    sectionHeader(doc, 'APPROVAL CHAIN', margin, PU_PURPLE, contentW);
    doc.moveDown(0.4);

    const approvalRows = [
      ['Tutor', form.tutorApproval?.approvedBy?.name || '—',
        form.tutorApproval?.approvedAt ? new Date(form.tutorApproval.approvedAt).toLocaleDateString('en-IN') : '—',
        form.tutorApproval?.remarks || '—'],
      ['HOD', form.hodApproval?.approvedBy?.name || '—',
        form.hodApproval?.approvedAt ? new Date(form.hodApproval.approvedAt).toLocaleDateString('en-IN') : '—',
        form.hodApproval?.remarks || '—'],
      ['Dean', form.deanApproval?.approvedBy?.name || '—',
        form.deanApproval?.approvedAt ? new Date(form.deanApproval.approvedAt).toLocaleDateString('en-IN') : '—',
        form.deanApproval?.remarks || '—'],
    ];

    // Header row
    const colW = [70, 110, 80, contentW - 70 - 110 - 80];
    const colX = [margin, margin + 70, margin + 180, margin + 260];
    const rowH = 18;
    let ty = doc.y;

    doc.rect(margin, ty, contentW, rowH).fill(PU_PURPLE);
    ['Role', 'Approved By', 'Date', 'Remarks'].forEach((h, i) => {
      doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
        .text(h, colX[i] + 4, ty + 4, { width: colW[i] - 8, lineBreak: false });
    });
    ty += rowH;

    approvalRows.forEach((row, ri) => {
      const rowColor = ri % 2 === 0 ? '#FFFFFF' : LIGHT_GRAY;
      doc.rect(margin, ty, contentW, rowH).fill(rowColor);
      row.forEach((cell, ci) => {
        doc.fillColor('#222222').fontSize(8.5).font('Helvetica')
          .text(String(cell), colX[ci] + 4, ty + 4, { width: colW[ci] - 8, lineBreak: false });
      });
      ty += rowH;
    });
    doc.rect(margin, doc.y, contentW, ty - doc.y).stroke('#DDDDDD');
    doc.y = ty;

    doc.moveDown(1);

    // ── Terms ──
    sectionHeader(doc, 'CONDITIONS & UNDERTAKING', margin, PU_PURPLE, contentW);
    doc.moveDown(0.4);

    const conditions = [
      'The student must carry this approval letter to the activity venue.',
      'The bonus attendance will be credited only upon submission of the hard copy of this letter along with participation proof to the Academic Office within 7 days of return.',
      'The student is responsible for any disciplinary matter arising during the activity.',
      'This permission does not apply to any other student or any other activity.',
      `Validity: This document is valid only for the activity dated ${fromDateStr} to ${toDateStr}.`,
    ];

    conditions.forEach((cond, i) => {
      doc
        .fillColor('#333333')
        .fontSize(9.5)
        .font('Helvetica')
        .text(`${i + 1}.  ${cond}`, margin, doc.y, { width: contentW, align: 'justify' });
      doc.moveDown(0.3);
    });

    doc.moveDown(0.6);

    // ── Signature Block ──
    const sigY = doc.y;
    // Left — Student acknowledgement
    doc.rect(margin, sigY, contentW / 2 - 10, 60).stroke('#DDDDDD');
    doc
      .fillColor('#555555').fontSize(8.5).font('Helvetica')
      .text("Student's Signature & Date", margin + 10, sigY + 8)
      .fillColor('#111111').font('Helvetica-Bold').fontSize(9)
      .text(form.studentName, margin + 10, sigY + 22)
      .fillColor('#555555').font('Helvetica').fontSize(8.5)
      .text(form.registrationNo, margin + 10, sigY + 34);

    // Right — Dean signature
    const sigRX = margin + contentW / 2 + 10;
    doc.rect(sigRX, sigY, contentW / 2 - 10, 60).stroke('#DDDDDD');
    doc
      .fillColor('#555555').fontSize(8.5).font('Helvetica')
      .text("Dean's Signature (Digitally Authorized)", sigRX + 10, sigY + 8, { width: contentW / 2 - 20 })
      .fillColor('#111111').font('Helvetica-Bold').fontSize(9)
      .text(form.deanApproval?.approvedBy?.name || 'Dean', sigRX + 10, sigY + 22)
      .fillColor('#555555').font('Helvetica').fontSize(8.5)
      .text(`Approved on: ${approvedDate}`, sigRX + 10, sigY + 34);

    doc.y = sigY + 68;
    doc.moveDown(0.5);

    // ── Footer ──
    doc.rect(0, doc.page.height - 38, pageW, 38).fill(PU_PURPLE);
    doc
      .fillColor('#FFFFFF').fontSize(8).font('Helvetica')
      .text(
        `This is a system-generated document from the S-18 Portal — Poornima University  |  Ref: ${refNo}`,
        margin, doc.page.height - 26,
        { align: 'center', width: contentW }
      );

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'PDF generation failed', error: error.message });
    }
  }
};

// ── Helpers ──

function sectionHeader(doc, title, margin, color, contentW) {
  const y = doc.y;
  doc.rect(margin, y, contentW, 18).fill(color);
  doc
    .fillColor('#FFFFFF')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(title, margin + 8, y + 4, { width: contentW - 16, lineBreak: false });
  doc.y = y + 18;
}

function drawTable(doc, rows, margin, contentW, stripeColor) {
  const col1W = 170;
  const col2W = contentW - col1W;
  const rowH = 18;
  let y = doc.y;

  rows.forEach((row, i) => {
    const bg = i % 2 === 0 ? '#FFFFFF' : stripeColor;
    doc.rect(margin, y, contentW, rowH).fill(bg);
    doc.rect(margin, y, contentW, rowH).stroke('#E0E0E0');

    doc.fillColor('#555555').fontSize(8.5).font('Helvetica-Bold')
      .text(row[0], margin + 6, y + 4, { width: col1W - 10, lineBreak: false });
    doc.fillColor('#111111').fontSize(8.5).font('Helvetica')
      .text(row[1], margin + col1W + 6, y + 4, { width: col2W - 10, lineBreak: false });

    y += rowH;
  });
  doc.y = y;
}

module.exports = { generateApprovalPDF };
