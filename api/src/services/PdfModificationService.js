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
      case "Revoked":
        await this.embedRevokedOverlay(pdfDoc, pkg, fonts);
        await this.embedUnsignedFields(pdfDoc, pkg, fonts);
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
    const uiScale = 1.5;
    const horizontalPadding = 5 / uiScale;

    console.log("=== embedCompletedFields DEBUG ===");
    console.log("Total fields:", pkg.fields.length);

    for (const field of pkg.fields) {
      console.log(
        `Field ${field.id}: type=${
          field.type
        }, hasValue=${!!field.value}, value=`,
        field.value
      );

      if (!field.value) {
        console.log(`Skipping field ${field.id} - no value`);
        continue;
      }

      const page = pages[field.page - 1];
      if (!page) {
        console.log(
          `Skipping field ${field.id} - page ${field.page} not found`
        );
        continue;
      }

      const originalX = field.x / uiScale;
      const originalY = field.y / uiScale;
      const originalWidth = field.width / uiScale;
      const originalHeight = field.height / uiScale;

      console.log(`Processing field ${field.id} on page ${field.page}`);

      let adjustedX = originalX;
      const pageWidth = page.getWidth();
      if (originalX + originalWidth > pageWidth) {
        adjustedX = pageWidth - originalWidth;
        console.log(
          `Adjusted x for field ${field.id} from ${originalX} to ${adjustedX}`
        );
      }

      if (field.type === "signature" && typeof field.value === "object") {
        console.log(`Drawing signature for field ${field.id}`);
        console.log(
          `Field position: x=${adjustedX}, y=${originalY}, width=${originalWidth}, height=${originalHeight}`
        );

        const sig = field.value;
        const signerName = sig.signedBy;
        const signerEmail = sig.email || sig.signedByEmail || "N/A";
        const signatureDate = new Date(sig.date).toLocaleString();
        const signatureMethod = sig.method || "Email OTP";
        const otpCode = sig.otpCode || "N/A";
        const certificationText = "Digitally Signed by E-Sign.eu";

        // Calculate vertical positioning from the top of the field area
        const fieldTop = page.getHeight() - originalY;
        const fieldBottom = fieldTop - originalHeight;

        // Define line spacing
        const lineSpacing = 12;
        const smallLineSpacing = 10;

        // Start from the top of the field and work downward
        let currentY = fieldTop - 8; // Small padding from top

        console.log(`Drawing signer name at y=${currentY}`);
        // Draw signer name (most prominent)
        page.drawText(signerName, {
          x: adjustedX + horizontalPadding,
          y: currentY,
          font: fonts.helveticaBold,
          size: 11,
          color: rgb(0.1, 0.1, 0.1),
          maxWidth: originalWidth - 2 * horizontalPadding,
        });
        currentY -= lineSpacing;

        console.log(`Drawing email at y=${currentY}`);
        // Draw email with smaller font size to fit long emails
        page.drawText(`Email: ${signerEmail}`, {
          x: adjustedX + horizontalPadding,
          y: currentY,
          font: fonts.helvetica,
          size: 7,
          color: rgb(0.3, 0.3, 0.3),
          maxWidth: originalWidth - 2 * horizontalPadding,
        });
        currentY -= lineSpacing;

        console.log(`Drawing date at y=${currentY}`);
        // Draw date
        page.drawText(`Date: ${signatureDate}`, {
          x: adjustedX + horizontalPadding,
          y: currentY,
          font: fonts.helvetica,
          size: 9,
          color: rgb(0.3, 0.3, 0.3),
          maxWidth: originalWidth - 2 * horizontalPadding,
        });
        currentY -= smallLineSpacing;

        console.log(`Drawing method at y=${currentY}`);
        // Draw method
        page.drawText(`Method: ${signatureMethod}`, {
          x: adjustedX + horizontalPadding,
          y: currentY,
          font: fonts.helvetica,
          size: 9,
          color: rgb(0.3, 0.3, 0.3),
          maxWidth: originalWidth - 2 * horizontalPadding,
        });
        currentY -= smallLineSpacing;

        console.log(`Drawing OTP code at y=${currentY}`);
        // Draw OTP code
        page.drawText(`OTP: ${otpCode}`, {
          x: adjustedX + horizontalPadding,
          y: currentY,
          font: fonts.helvetica,
          size: 9,
          color: rgb(0.3, 0.3, 0.3),
          maxWidth: originalWidth - 2 * horizontalPadding,
        });
        currentY -= smallLineSpacing + 3;

        console.log(`Drawing certification text at y=${currentY}`);
        // Draw certification text at the bottom
        page.drawText(certificationText, {
          x: adjustedX + horizontalPadding,
          y: currentY,
          font: fonts.helveticaOblique,
          size: 7,
          color: rgb(0.5, 0.5, 0.5),
          maxWidth: originalWidth - 2 * horizontalPadding,
        });

        console.log(`Signature drawing completed for field ${field.id}`);
      } else if (field.type === "checkbox") {
        // Center the checkbox both horizontally and vertically
        const fieldCenterY = page.getHeight() - originalY - originalHeight / 2;
        const checkboxSize = 14;
        const textToDraw = field.value ? "X" : "";

        page.drawText(textToDraw, {
          x: adjustedX + (originalWidth - checkboxSize) / 2,
          y: fieldCenterY - checkboxSize / 2,
          font: fonts.helveticaBold,
          size: checkboxSize,
          color: rgb(0, 0, 0),
        });
      } else {
        // Center text vertically in the field
        const fontSize = 10;
        const textHeight = fonts.helvetica.heightAtSize(fontSize);
        const fieldCenterY = page.getHeight() - originalY - originalHeight / 2;
        const textToDraw = field.value.toString();

        page.drawText(textToDraw, {
          x: adjustedX + horizontalPadding,
          y: fieldCenterY - textHeight / 2,
          font: fonts.helvetica,
          size: fontSize,
          color: rgb(0, 0, 0),
          maxWidth: originalWidth - 2 * horizontalPadding,
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
    const uiScale = 1.5;
    const horizontalPadding = 5 / uiScale;
    const rejecterContactId =
      pkg.rejectionDetails.rejectedBy.contactId.toString();

    for (const field of pkg.fields) {
      const isAssignedToRejecter = field.assignedUsers.some(
        (user) => user.contactId.toString() === rejecterContactId
      );

      if (!isAssignedToRejecter) continue;

      const page = pages[field.page - 1];
      if (!page) continue;

      const originalX = field.x / uiScale;
      const originalY = field.y / uiScale;
      const originalWidth = field.width / uiScale;
      const originalHeight = field.height / uiScale;

      let adjustedX = originalX;
      const pageWidth = page.getWidth();
      if (originalX + originalWidth > pageWidth) {
        adjustedX = pageWidth - originalWidth;
      }

      // Draw background rectangle for rejection
      const yOffset = page.getHeight() - originalY;
      page.drawRectangle({
        x: adjustedX,
        y: yOffset - originalHeight,
        width: originalWidth,
        height: originalHeight,
        color: rgb(0.98, 0.9, 0.9),
        borderColor: rgb(0.7, 0, 0),
        borderWidth: 1,
      });

      // Get rejection details
      const rejectedBy = pkg.rejectionDetails.rejectedBy;
      const rejectedByName =
        rejectedBy.contactName || rejectedBy.name || "Unknown";
      const rejectedByEmail =
        rejectedBy.email || rejectedBy.contactEmail || "N/A";
      const rejectionDate = new Date(
        pkg.rejectionDetails.rejectedAt
      ).toLocaleString();
      const rejectionIP = pkg.rejectionDetails.rejectedIP || "N/A";
      const rejectionReason =
        pkg.rejectionDetails.reason || "No reason provided";

      // Calculate vertical positioning from the top of the field area
      const fieldTop = page.getHeight() - originalY;

      // Define line spacing for rejection
      const lineSpacing = 11;
      const smallLineSpacing = 9;

      // Start from the top of the field and work downward
      let currentY = fieldTop - 6;

      // Draw "REJECTED" header
      page.drawText("REJECTED", {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helveticaBold,
        size: 10,
        color: rgb(0.7, 0, 0),
        maxWidth: originalWidth - 2 * horizontalPadding,
      });
      currentY -= lineSpacing;

      // Draw rejected by name
      page.drawText(`By: ${rejectedByName}`, {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helvetica,
        size: 8,
        color: rgb(0.6, 0, 0),
        maxWidth: originalWidth - 2 * horizontalPadding,
      });
      currentY -= smallLineSpacing;

      // Draw rejected by email
      page.drawText(`Email: ${rejectedByEmail}`, {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helvetica,
        size: 8,
        color: rgb(0.6, 0, 0),
        maxWidth: originalWidth - 2 * horizontalPadding,
      });
      currentY -= smallLineSpacing;

      page.drawText(`IP: ${rejectionIP}`, {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helvetica,
        size: 8,
        color: rgb(0.6, 0, 0),
        maxWidth: originalWidth - 2 * horizontalPadding,
      });
      currentY -= smallLineSpacing;

      // Draw rejection date
      page.drawText(`Date: ${rejectionDate}`, {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helvetica,
        size: 8,
        color: rgb(0.6, 0, 0),
        maxWidth: originalWidth - 2 * horizontalPadding,
      });
      currentY -= smallLineSpacing;

      // Draw rejection reason
      page.drawText(`Reason: ${rejectionReason}`, {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helvetica,
        size: 8,
        color: rgb(0.6, 0, 0),
        maxWidth: originalWidth - 2 * horizontalPadding,
      });
    }
  }

  /**
   * Embeds placeholder boxes for unsigned documents.
   */
  async embedUnsignedFields(pdfDoc, pkg, fonts) {
    const pages = pdfDoc.getPages();
    const uiScale = 1.5;
    const horizontalPadding = 4 / uiScale;

    for (const field of pkg.fields) {
      const page = pages[field.page - 1];
      if (!page) continue;

      const originalX = field.x / uiScale;
      const originalY = field.y / uiScale;
      const originalWidth = field.width / uiScale;
      const originalHeight = field.height / uiScale;

      const yOffset = page.getHeight() - originalY - originalHeight;

      page.drawRectangle({
        x: originalX,
        y: yOffset,
        width: originalWidth,
        height: originalHeight,
        borderColor: rgb(0, 0, 0.5),
        borderWidth: 1,
        borderDashArray: [3, 3],
        color: rgb(0, 0, 1),
        opacity: 0.05,
      });

      // Center the label text vertically in the field
      const fontSize = 8;
      const textHeight = fonts.helvetica.heightAtSize(fontSize);
      const fieldCenterY = yOffset + originalHeight / 2;

      page.drawText(field.label, {
        x: originalX + horizontalPadding,
        y: fieldCenterY - textHeight / 2,
        font: fonts.helvetica,
        size: fontSize,
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
      audit += `  Reason: ${pkg.rejectionDetails.reason} (IP: ${pkg.rejectionDetails.rejectedIP})\n`;
    }

    if (pkg.status === "Revoked" && pkg.revocationDetails?.revokedBy) {
      audit += `- Document REVOKED by ${
        pkg.revocationDetails.revokedBy.name
      } at ${formatDate(pkg.revocationDetails.revokedAt)}\n`;
      const reason = pkg.revocationDetails.reason || "No reason provided.";
      audit += ` Reason: ${reason}\n`;
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
    let currentY = height - margin;

    // Add Logo if available
    if (logoImage) {
      const logoDims = logoImage.scale(0.25);
      page.drawImage(logoImage, {
        x: margin,
        y: currentY - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
      currentY -= logoDims.height + 20;
    }

    // Add Header
    const headerText = "Audit Certificate of Completion";
    const headerSize = 22;
    page.drawText(headerText, {
      x: margin,
      y: currentY,
      font: fonts.helveticaBold,
      size: headerSize,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= headerSize + 20;

    // Add dividing line
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 20;

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
      color: rgb(0.9, 0.2, 0.2),
      opacity: 0.15,
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
        y: centerY - textHeight / 4,
        ...options,
      });
    }
  }
}

module.exports = PdfModificationService;
