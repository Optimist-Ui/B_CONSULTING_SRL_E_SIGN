const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs").promises;
const path = require("path");

class PdfModificationService {
  constructor() {}

  async generatePdf(pkg, pdfBuffer = null) {
    // If buffer is not provided, fall back to reading from filesystem (backward compatibility)
    let existingPdfBytes;

    if (pdfBuffer) {
      existingPdfBytes = pdfBuffer;
    } else {
      // Legacy fallback - reading from local filesystem
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
      existingPdfBytes = await fs.readFile(filePath);
    }

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
        const signatureDate =
          new Date(sig.date).toLocaleString("en-GB", {
            timeZone: "UTC",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }) + " UTC";
        const signatureMethod = sig.method || "Email OTP";
        const otpCode = sig.otpCode || "N/A";
        const certificationText = "Digitally Signed by I-Sign.eu";

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

        // Find who filled this field
        const filledBy = field.assignedUsers.find((au) => au.signed);

        if (filledBy) {
          // Draw the value
          page.drawText(textToDraw, {
            x: adjustedX + horizontalPadding,
            y: fieldCenterY - textHeight / 2,
            font: fonts.helvetica,
            size: fontSize,
            color: rgb(0, 0, 0),
            maxWidth: originalWidth - 2 * horizontalPadding,
          });

          // Draw a small "filled by" indicator below the value if there's space
          const indicatorFontSize = 6;
          const indicatorText = `Filled by: ${filledBy.contactName}`;
          const indicatorY = page.getHeight() - originalY - originalHeight + 3;

          page.drawText(indicatorText, {
            x: adjustedX + horizontalPadding,
            y: indicatorY,
            font: fonts.helveticaOblique,
            size: indicatorFontSize,
            color: rgb(0.5, 0.5, 0.5),
            maxWidth: originalWidth - 2 * horizontalPadding,
          });
        } else {
          // Fallback if no filled by info (shouldn't happen in completed status)
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
  }

  /**
   * Embeds rejection info onto relevant fields with proper spacing.
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
      const rejectedByName = rejectedBy.contactName || "Unknown";
      const rejectedByEmail = rejectedBy.contactEmail || "N/A";
      const rejectionDate = new Date(
        pkg.rejectionDetails.rejectedAt
      ).toLocaleString();
      const rejectionReason =
        pkg.rejectionDetails.reason || "No reason provided";

      // Calculate vertical positioning from the top of the field area
      const fieldTop = page.getHeight() - originalY;

      // ✅ IMPROVED: Dynamic spacing based on field height
      const lineHeight = Math.max(8, Math.min(11, originalHeight / 7));

      // Start from the top with proper padding
      let currentY = fieldTop - lineHeight;

      // Draw "REJECTED" header (bold and prominent)
      page.drawText("REJECTED", {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helveticaBold,
        size: 9,
        color: rgb(0.7, 0, 0),
        maxWidth: originalWidth - 2 * horizontalPadding,
      });
      currentY -= lineHeight + 2;

      // Draw rejected by name
      const byText = `By: ${rejectedByName}`;
      page.drawText(byText, {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helvetica,
        size: 7,
        color: rgb(0.4, 0, 0),
        maxWidth: originalWidth - 2 * horizontalPadding,
      });
      currentY -= lineHeight;

      // Draw email (truncate if too long)
      const maxEmailLength = Math.floor(
        (originalWidth - 2 * horizontalPadding) / 3
      );
      let emailText = rejectedByEmail;
      if (emailText.length > maxEmailLength) {
        emailText = emailText.substring(0, maxEmailLength - 3) + "...";
      }
      page.drawText(`Email: ${emailText}`, {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helvetica,
        size: 6,
        color: rgb(0.4, 0, 0),
        maxWidth: originalWidth - 2 * horizontalPadding,
      });
      currentY -= lineHeight;

      // Draw date
      page.drawText(`Date: ${rejectionDate}`, {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helvetica,
        size: 6,
        color: rgb(0.4, 0, 0),
        maxWidth: originalWidth - 2 * horizontalPadding,
      });
      currentY -= lineHeight;

      // Draw reason (truncate if too long)
      const maxReasonLength = Math.floor(
        (originalWidth - 2 * horizontalPadding) / 3
      );
      let reasonText = rejectionReason;
      if (reasonText.length > maxReasonLength) {
        reasonText = reasonText.substring(0, maxReasonLength - 3) + "...";
      }
      page.drawText(`Reason: ${reasonText}`, {
        x: adjustedX + horizontalPadding,
        y: currentY,
        font: fonts.helvetica,
        size: 6,
        color: rgb(0.4, 0, 0),
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
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      const d = new Date(dateString);
      return (
        d.toLocaleString("en-GB", {
          timeZone: "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " UTC"
      );
    };

    let audit = {
      header: {
        documentName: pkg.name,
        documentId: pkg._id,
        status: pkg.status,
        createdAt: formatDate(pkg.createdAt),
        createdBy: `${pkg.ownerId.firstName} ${pkg.ownerId.lastName}`,
      },
      timeline: [],
      reassignments: [],
    };

    // Collect signed events with OTP codes - ONLY FOR SIGNATURE FIELDS
    const signedEvents = pkg.fields
      .filter((f) => f.type === "signature") // Only include signature fields
      .flatMap((f) => f.assignedUsers)
      .filter((au) => au.signed)
      .map((au) => {
        const fieldData = pkg.fields.find((field) =>
          field.assignedUsers.some(
            (u) => u._id.toString() === au._id.toString()
          )
        );
        const otpCode = fieldData?.value?.otpCode || au.otpCode || "N/A";
        const method = fieldData?.value?.method || au.method || "Email OTP";

        return {
          type: "signed",
          contactName: au.contactName,
          role: au.role,
          signedAt: au.signedAt,
          signedIP: au.signedIP,
          method: method,
          otpCode: otpCode,
        };
      });

    // NEW: Collect form filled events - ONLY FOR NON-SIGNATURE FIELDS
    const formFilledEvents = pkg.fields
      .filter((f) => f.type !== "signature" && f.value) // Exclude signature fields
      .flatMap((f) =>
        f.assignedUsers
          .filter((au) => au.signed)
          .map((au) => ({
            type: "formFilled",
            contactName: au.contactName,
            role: au.role,
            fieldLabel: f.label,
            fieldType: f.type,
            fieldValue: f.value,
            filledAt: au.signedAt,
            filledIP: au.signedIP,
          }))
      );

    // Sort all events chronologically
    const allEvents = [...signedEvents].sort(
      (a, b) => new Date(a.signedAt) - new Date(b.signedAt)
    );

    const allFormEvents = [...formFilledEvents].sort(
      (a, b) => new Date(a.filledAt) - new Date(b.filledAt)
    );

    audit.timeline = allEvents;
    audit.formTimeline = allFormEvents; // Add form timeline

    // Add rejection details if applicable
    if (pkg.status === "Rejected" && pkg.rejectionDetails?.rejectedBy) {
      audit.rejection = {
        rejectedBy: pkg.rejectionDetails.rejectedBy.contactName,
        rejectedAt: formatDate(pkg.rejectionDetails.rejectedAt),
        reason: pkg.rejectionDetails.reason,
        rejectedIP: pkg.rejectionDetails.rejectedIP,
      };
    }

    // Add revocation details if applicable
    if (pkg.status === "Revoked" && pkg.revocationDetails?.revokedBy) {
      audit.revocation = {
        revokedBy: pkg.revocationDetails.revokedBy.name,
        revokedAt: formatDate(pkg.revocationDetails.revokedAt),
        reason: pkg.revocationDetails.reason || "No reason provided.",
      };
    }

    // Add reassignment history
    if (pkg.reassignmentHistory?.length > 0) {
      audit.reassignments = pkg.reassignmentHistory.map((r) => ({
        reassignedAt: formatDate(r.reassignedAt),
        reassignedBy: r.reassignedBy.contactName,
        reassignedTo: r.reassignedTo.contactName,
      }));
    }

    return audit;
  }

  async addAuditTrailPage(pdfDoc, pkg, fonts, logoImage) {
    const audit = this.createAuditTrail(pkg);
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let currentY = height - margin;

    // Add Logo centered at the top
    if (logoImage) {
      const logoDims = logoImage.scale(0.3);
      const logoX = (width - logoDims.width) / 2;
      page.drawImage(logoImage, {
        x: logoX,
        y: currentY - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
      currentY -= logoDims.height + 30;
    }

    // Add Header - Centered
    const headerText = "Audit Certificate of Completion";
    const headerSize = 24;
    const headerWidth = fonts.helveticaBold.widthOfTextAtSize(
      headerText,
      headerSize
    );
    page.drawText(headerText, {
      x: (width - headerWidth) / 2,
      y: currentY,
      font: fonts.helveticaBold,
      size: headerSize,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= headerSize + 10;

    // Add subtitle
    const subtitleText = "Complete Transaction History";
    const subtitleSize = 11;
    const subtitleWidth = fonts.helvetica.widthOfTextAtSize(
      subtitleText,
      subtitleSize
    );
    page.drawText(subtitleText, {
      x: (width - subtitleWidth) / 2,
      y: currentY,
      font: fonts.helvetica,
      size: subtitleSize,
      color: rgb(0.4, 0.4, 0.4),
    });
    currentY -= 30;

    // Add dividing line
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentY -= 25;

    // Document Information Section
    page.drawText("DOCUMENT INFORMATION", {
      x: margin,
      y: currentY,
      font: fonts.helveticaBold,
      size: 12,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 20;

    const infoLines = [
      `Document Name: ${audit.header.documentName}`,
      `Document ID: ${audit.header.documentId}`,
      `Status: ${audit.header.status}`,
      `Created: ${audit.header.createdAt}`,
      `Created By: ${audit.header.createdBy}`,
    ];

    for (const line of infoLines) {
      page.drawText(line, {
        x: margin + 10,
        y: currentY,
        font: fonts.helvetica,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
      });
      currentY -= 15;
    }

    currentY -= 15;

    // Timeline Section
    page.drawText("SIGNATURE TIMELINE", {
      x: margin,
      y: currentY,
      font: fonts.helveticaBold,
      size: 12,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 5;

    // Draw section underline
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: margin + 150, y: currentY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    currentY -= 20;

    // Timeline entries with icons
    for (const event of audit.timeline) {
      if (currentY < margin + 80) {
        // Add new page if running out of space
        const newPage = pdfDoc.addPage();
        currentY = height - margin;
        page = newPage;
      }

      // Draw checkmark icon (using filled circle)
      page.drawCircle({
        x: margin + 6,
        y: currentY + 4,
        size: 5,
        color: rgb(0.2, 0.7, 0.2),
      });

      // Draw signer name and role
      const signerText = `${event.contactName} (${event.role})`;
      page.drawText(signerText, {
        x: margin + 20,
        y: currentY,
        font: fonts.helveticaBold,
        size: 10,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 14;

      // Draw date and IP
      const dateText = `Signed: ${new Date(event.signedAt).toLocaleString(
        "en-GB",
        {
          timeZone: "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      )} UTC`;
      page.drawText(dateText, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 9,
        color: rgb(0.4, 0.4, 0.4),
      });
      currentY -= 13;

      page.drawText(`IP Address: ${event.signedIP}`, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 9,
        color: rgb(0.4, 0.4, 0.4),
      });
      currentY -= 13;

      // Draw method and OTP
      page.drawText(`Method: ${event.method}`, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 9,
        color: rgb(0.4, 0.4, 0.4),
      });
      currentY -= 13;

      page.drawText(`OTP Code: ${event.otpCode}`, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 9,
        color: rgb(0.4, 0.4, 0.4),
      });
      currentY -= 20;
    }

    if (audit.formTimeline && audit.formTimeline.length > 0) {
      if (currentY < margin + 80) {
        const newPage = pdfDoc.addPage();
        currentY = height - margin;
        page = newPage;
      }

      currentY -= 10;
      page.drawText("FORM FIELDS COMPLETED", {
        x: margin,
        y: currentY,
        font: fonts.helveticaBold,
        size: 12,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 5;

      // Draw section underline
      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin + 180, y: currentY },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
      currentY -= 20;

      // Form field entries
      for (const event of audit.formTimeline) {
        if (currentY < margin + 80) {
          // Add new page if running out of space
          const newPage = pdfDoc.addPage();
          currentY = height - margin;
          page = newPage;
        }

        // Draw checkmark icon (using filled circle)
        page.drawCircle({
          x: margin + 6,
          y: currentY + 4,
          size: 5,
          color: rgb(0.2, 0.5, 0.7),
        });

        // Draw field label and filler name
        const fieldText = `${event.fieldLabel} - by ${event.contactName} (${event.role})`;
        page.drawText(fieldText, {
          x: margin + 20,
          y: currentY,
          font: fonts.helveticaBold,
          size: 10,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= 14;

        // Draw value (truncate if too long)
        let displayValue = String(event.fieldValue);
        if (displayValue.length > 50) {
          displayValue = displayValue.substring(0, 50) + "...";
        }
        page.drawText(`Value: ${displayValue}`, {
          x: margin + 20,
          y: currentY,
          font: fonts.helvetica,
          size: 9,
          color: rgb(0.4, 0.4, 0.4),
        });
        currentY -= 13;

        // Draw date
        const dateText = `Filled: ${new Date(event.filledAt).toLocaleString(
          "en-GB",
          {
            timeZone: "UTC",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }
        )} UTC`;
        page.drawText(dateText, {
          x: margin + 20,
          y: currentY,
          font: fonts.helvetica,
          size: 9,
          color: rgb(0.4, 0.4, 0.4),
        });
        currentY -= 13;

        // Draw IP
        page.drawText(`IP Address: ${event.filledIP}`, {
          x: margin + 20,
          y: currentY,
          font: fonts.helvetica,
          size: 9,
          color: rgb(0.4, 0.4, 0.4),
        });
        currentY -= 20;
      }
    }

    // Rejection Section (if applicable)
    if (audit.rejection) {
      if (currentY < margin + 80) {
        const newPage = pdfDoc.addPage();
        currentY = height - margin;
        page = newPage;
      }

      currentY -= 10;
      page.drawText("REJECTION DETAILS", {
        x: margin,
        y: currentY,
        font: fonts.helveticaBold,
        size: 12,
        color: rgb(0.8, 0, 0),
      });
      currentY -= 5;

      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin + 150, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0, 0),
      });
      currentY -= 20;

      // Draw X icon (using filled circle)
      page.drawCircle({
        x: margin + 6,
        y: currentY + 4,
        size: 5,
        color: rgb(0.8, 0, 0),
      });

      page.drawText(`Rejected by: ${audit.rejection.rejectedBy}`, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 10,
        color: rgb(0.6, 0, 0),
      });
      currentY -= 14;

      page.drawText(`Date: ${audit.rejection.rejectedAt}`, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 9,
        color: rgb(0.6, 0, 0),
      });
      currentY -= 13;

      page.drawText(`IP Address: ${audit.rejection.rejectedIP}`, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 9,
        color: rgb(0.6, 0, 0),
      });
      currentY -= 13;

      page.drawText(`Reason: ${audit.rejection.reason}`, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 9,
        color: rgb(0.6, 0, 0),
      });
      currentY -= 20;
    }

    // Revocation Section (if applicable)
    if (audit.revocation) {
      if (currentY < margin + 80) {
        const newPage = pdfDoc.addPage();
        currentY = height - margin;
        page = newPage;
      }

      currentY -= 10;
      page.drawText("REVOCATION DETAILS", {
        x: margin,
        y: currentY,
        font: fonts.helveticaBold,
        size: 12,
        color: rgb(0.8, 0, 0),
      });
      currentY -= 5;

      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin + 150, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0, 0),
      });
      currentY -= 20;

      // Draw prohibition icon (circle with diagonal line)
      page.drawCircle({
        x: margin + 6,
        y: currentY + 4,
        size: 6,
        borderColor: rgb(0.8, 0, 0),
        borderWidth: 1.5,
      });
      page.drawLine({
        start: { x: margin + 1, y: currentY + 9 },
        end: { x: margin + 11, y: currentY - 1 },
        thickness: 1.5,
        color: rgb(0.8, 0, 0),
      });

      page.drawText(`Revoked by: ${audit.revocation.revokedBy}`, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 10,
        color: rgb(0.6, 0, 0),
      });
      currentY -= 14;

      page.drawText(`Date: ${audit.revocation.revokedAt}`, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 9,
        color: rgb(0.6, 0, 0),
      });
      currentY -= 13;

      page.drawText(`Reason: ${audit.revocation.reason}`, {
        x: margin + 20,
        y: currentY,
        font: fonts.helvetica,
        size: 9,
        color: rgb(0.6, 0, 0),
      });
      currentY -= 20;
    }

    // Reassignment Section (if applicable)
    if (audit.reassignments.length > 0) {
      if (currentY < margin + 80) {
        const newPage = pdfDoc.addPage();
        currentY = height - margin;
        page = newPage;
      }

      currentY -= 10;
      page.drawText("REASSIGNMENT HISTORY", {
        x: margin,
        y: currentY,
        font: fonts.helveticaBold,
        size: 12,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 5;

      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin + 170, y: currentY },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
      currentY -= 20;

      for (const reassignment of audit.reassignments) {
        if (currentY < margin + 60) {
          const newPage = pdfDoc.addPage();
          currentY = height - margin;
          page = newPage;
        }

        // Draw arrow icon (using lines)
        page.drawLine({
          start: { x: margin, y: currentY + 4 },
          end: { x: margin + 12, y: currentY + 4 },
          thickness: 2,
          color: rgb(0.3, 0.5, 0.8),
        });
        // Arrow head
        page.drawLine({
          start: { x: margin + 12, y: currentY + 4 },
          end: { x: margin + 8, y: currentY + 7 },
          thickness: 2,
          color: rgb(0.3, 0.5, 0.8),
        });
        page.drawLine({
          start: { x: margin + 12, y: currentY + 4 },
          end: { x: margin + 8, y: currentY + 1 },
          thickness: 2,
          color: rgb(0.3, 0.5, 0.8),
        });

        const reassignText = `${reassignment.reassignedBy} to ${reassignment.reassignedTo}`;
        page.drawText(reassignText, {
          x: margin + 20,
          y: currentY,
          font: fonts.helvetica,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
        });
        currentY -= 14;

        page.drawText(`Date: ${reassignment.reassignedAt}`, {
          x: margin + 20,
          y: currentY,
          font: fonts.helvetica,
          size: 9,
          color: rgb(0.4, 0.4, 0.4),
        });
        currentY -= 20;
      }
    }

    // Add footer with certification
    currentY = margin + 30;
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 15;

    const certText =
      "This document has been digitally signed and is legally binding.";
    const certWidth = fonts.helveticaOblique.widthOfTextAtSize(certText, 9);
    page.drawText(certText, {
      x: (width - certWidth) / 2,
      y: currentY,
      font: fonts.helveticaOblique,
      size: 9,
      color: rgb(0.5, 0.5, 0.5),
    });
    currentY -= 12;

    const poweredText = "Powered by I-Sign.eu";
    const poweredWidth = fonts.helvetica.widthOfTextAtSize(poweredText, 8);
    page.drawText(poweredText, {
      x: (width - poweredWidth) / 2,
      y: currentY,
      font: fonts.helvetica,
      size: 8,
      color: rgb(0.6, 0.6, 0.6),
    });
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
