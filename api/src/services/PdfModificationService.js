const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs").promises;
const path = require("path");

class PdfModificationService {
  constructor() {}

  async generatePdf(pkg) {
    const cleanRelativePath = pkg.fileUrl
      .replace("/Uploads/", "/uploads/")
      .replace("/public/uploads/", "/uploads/")
      .replace(/^\/uploads\//, "uploads/");
    const filePath = path.join(
      process.cwd(),
      "src",
      "public",
      cleanRelativePath
    );
    const existingPdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Embed fonts
    const fonts = {
      helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
      helveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      helveticaOblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };

    // Load company logo
    let logoImage = null;
    try {
      const logoPath = path.join(process.cwd(), "src", "public", "logo.png");
      const logoBytes = await fs.readFile(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch (e) {
      console.warn("Logo not found or could not be embedded. Skipping logo.");
    }

    // Add audit trail page first
    await this.addAuditTrailPage(pdfDoc, pkg, fonts, logoImage);

    // Embed fields based on status
    switch (pkg.status) {
      case "Completed":
        await this.embedCompletedFields(pdfDoc, pkg, fonts);
        break;
      case "Rejected":
        await this.embedRejectedFields(pdfDoc, pkg, fonts);
        break;
      case "Rejected":
        await this.embedRejectedFields(pdfDoc, pkg, fonts);
        break;

      default:
        await this.embedUnsignedFields(pdfDoc, pkg, fonts);
        break;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Embeds final, filled-out values onto the PDF.
   */
  async embedCompletedFields(pdfDoc, pkg, fonts) {
    const pages = pdfDoc.getPages();
    for (const field of pkg.fields) {
      if (!field.value) continue;
      const page = pages[field.page - 1];
      if (!page) continue;

      let textToDraw = "";
      const yOffset = page.getHeight() - field.y - field.height / 2; // Center text vertically

      if (field.type === "signature" && typeof field.value === "object") {
        const sig = field.value;
        const signatureText = `Digitally Signed by SignatureFlow`;
        const detailsText = `${sig.signedBy}\nDate: ${new Date(
          sig.date
        ).toLocaleString()}\nMethod: ${sig.method || "Email OTP"}`;

        // Draw signature text
        page.drawText(signatureText, {
          x: field.x + 5,
          y: yOffset + 10, // Move up to avoid overlap
          font: fonts.helveticaBold,
          size: 11,
          color: rgb(0.11, 0.22, 0.4),
        });
        // Draw details below signature
        page.drawText(detailsText, {
          x: field.x + 5,
          y: yOffset - 10, // Move down for details
          font: fonts.helvetica,
          size: 8,
          color: rgb(0.2, 0.2, 0.2),
          lineHeight: 10,
        });
      } else if (field.type === "checkbox") {
        textToDraw = field.value ? "X" : "";
        page.drawText(textToDraw, {
          x: field.x + field.width / 4,
          y: yOffset,
          font: fonts.helvetica,
          size: 14,
          color: rgb(0, 0, 0),
        });
      } else {
        textToDraw = field.value.toString();
        page.drawText(textToDraw, {
          x: field.x + 5,
          y: yOffset,
          font: fonts.helvetica,
          size: 10,
          color: rgb(0, 0, 0),
        });
      }
    }
  }

  /**
   * Embeds rejection info onto relevant fields.
   */
  async embedRejectedFields(pdfDoc, pkg, fonts) {
    if (!pkg.rejectionDetails?.rejectedBy) return;

    const pages = pdfDoc.getPages();
    const rejecterContactId =
      pkg.rejectionDetails.rejectedBy.contactId.toString();

    for (const field of pkg.fields) {
      const isAssignedToRejecter = field.assignedUsers.some(
        (user) => user.contactId.toString() === rejecterContactId
      );
      if (!isAssignedToRejecter) continue;

      const page = pages[field.page - 1];
      if (!page) continue;

      const yOffset = page.getHeight() - field.y;
      page.drawRectangle({
        x: field.x,
        y: yOffset - field.height,
        width: field.width,
        height: field.height,
        color: rgb(0.98, 0.9, 0.9),
        borderColor: rgb(0.7, 0, 0),
        borderWidth: 1,
      });

      const text = `REJECTED\nReason: ${pkg.rejectionDetails.reason}`;
      page.drawText(text, {
        x: field.x + 5,
        y: yOffset - field.height / 2,
        font: fonts.helveticaBold,
        size: 9,
        lineHeight: 12,
        color: rgb(0.7, 0, 0),
      });
    }
  }

  /**
   * Embeds placeholder boxes for unsigned documents.
   */
  async embedUnsignedFields(pdfDoc, pkg, fonts) {
    const pages = pdfDoc.getPages();
    for (const field of pkg.fields) {
      const page = pages[field.page - 1];
      if (!page) continue;

      const yOffset = page.getHeight() - field.y - field.height;
      page.drawRectangle({
        x: field.x,
        y: yOffset,
        width: field.width,
        height: field.height,
        borderColor: rgb(0, 0, 0.5),
        borderWidth: 1,
        borderDashArray: [3, 3],
        color: rgb(0, 0, 1),
        opacity: 0.05,
      });
      page.drawText(field.label, {
        x: field.x + 4,
        y: yOffset + field.height - 12, // Place label at top of rectangle
        font: fonts.helvetica,
        size: 8,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  /**
   * Creates a structured and professional audit trail.
   */
  createAuditTrail(pkg) {
    const formatDate = (dateString) => new Date(dateString).toLocaleString();

    let audit = `Document Name: ${pkg.name}\n`;
    audit += `Document ID: ${pkg._id}\n`;
    audit += `Status: ${pkg.status}\n\n`;

    audit += `TIMELINE\n`;
    audit += `--------------------------------------------------\n`;
    audit += `- Document created at ${formatDate(pkg.createdAt)} by ${
      pkg.ownerId.firstName
    } ${pkg.ownerId.lastName}\n`;

    const signedEvents = pkg.fields
      .flatMap((f) => f.assignedUsers)
      .filter((au) => au.signed)
      .map((au) => ({ ...au.toObject(), eventType: "signed" }));

    const allEvents = [...signedEvents].sort(
      (a, b) => new Date(a.signedAt) - new Date(b.signedAt)
    );

    allEvents.forEach((event) => {
      audit += `- ${event.contactName} (${event.role}) signed at ${formatDate(
        event.signedAt
      )} (IP: ${event.signedIP})\n`;
    });

    if (pkg.status === "Rejected" && pkg.rejectionDetails?.rejectedBy) {
      audit += `- Document REJECTED by ${
        pkg.rejectionDetails.rejectedBy.contactName
      } at ${formatDate(pkg.rejectionDetails.rejectedAt)}\n`;
      audit += `  Reason: ${pkg.rejectionDetails.reason}\n`;
    }

    if (pkg.status === "Revoked" && pkg.revocationDetails?.revokedBy) {
      audit += `- Document REVOKED by ${
        pkg.revocationDetails.revokedBy.name
      } at ${formatDate(pkg.revocationDetails.revokedAt)}\n`;
      const reason = pkg.revocationDetails.reason || "No reason provided.";
      audit += `  Reason: ${reason}\n`;
    }

    if (pkg.reassignmentHistory?.length > 0) {
      audit += `\nREASSIGNMENTS\n`;
      audit += `--------------------------------------------------\n`;
      pkg.reassignmentHistory.forEach((r) => {
        audit += `- ${formatDate(r.reassignedAt)}: ${
          r.reassignedBy.contactName
        } reassigned to ${r.reassignedTo.contactName}\n`;
      });
    }

    return audit;
  }

  /**
   * Adds a professional, branded audit trail page with proper spacing.
   */
  async addAuditTrailPage(pdfDoc, pkg, fonts, logoImage) {
    const text = this.createAuditTrail(pkg);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    const margin = 50;
    let currentY = height - margin; // Start from top of page

    // Add Logo if available
    if (logoImage) {
      const logoDims = logoImage.scale(0.25);
      page.drawImage(logoImage, {
        x: margin,
        y: currentY - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
      currentY -= logoDims.height + 20; // Add padding below logo
    }

    // Add Header
    const headerText = "Certificate of Completion";
    const headerSize = 22;
    page.drawText(headerText, {
      x: margin,
      y: currentY,
      font: fonts.helveticaBold,
      size: headerSize,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= headerSize + 20; // Add padding below header

    // Add dividing line
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 20; // Add padding below line

    // Split audit text into lines for wrapping
    const auditLines = text.split("\n");
    const fontSize = 10;
    const lineHeight = 15;
    const maxWidth = width - 2 * margin;

    for (const line of auditLines) {
      if (currentY < margin) {
        // Add new page if running out of space
        const newPage = pdfDoc.addPage();
        currentY = height - margin;
        page = newPage;
      }
      page.drawText(line, {
        x: margin,
        y: currentY,
        font: fonts.helvetica,
        size: fontSize,
        color: rgb(0.2, 0.2, 0.2),
        maxWidth: maxWidth,
        lineHeight: lineHeight,
      });
      currentY -= lineHeight;
    }
  }

  /**
   * Adds a prominent "REVOKED" watermark overlay to all pages.
   */
  async embedRevokedOverlay(pdfDoc, pkg, fonts) {
    const pages = pdfDoc.getPages();

    // Watermark settings
    const text = "REVOKED";
    const options = {
      font: fonts.helveticaBold,
      size: 120,
      color: rgb(0.9, 0.2, 0.2), // A strong red color
      opacity: 0.15, // Semi-transparent
    };

    const textWidth = fonts.helveticaBold.widthOfTextAtSize(text, 120);
    const textHeight = fonts.helveticaBold.heightAtSize(120);

    for (const page of pages) {
      // Don't add the watermark to the last (audit trail) page
      if (pages.indexOf(page) === pages.length - 1) {
        continue;
      }

      const { width, height } = page.getSize();

      // Calculate the center of the page
      const centerX = width / 2;
      const centerY = height / 2;

      // Draw the text diagonally across the center
      page.drawText(text, {
        x: centerX - textWidth / 2,
        y: centerY - textHeight / 4, // Adjust for font baseline
        ...options,
      });
    }
  }
}

module.exports = PdfModificationService;
