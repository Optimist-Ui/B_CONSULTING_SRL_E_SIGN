// services/EmailService.js
const sgMail = require("@sendgrid/mail");

class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
  }

  // --- WELCOME EMAIL METHOD ---
  async sendWelcomeEmail(user) {
    const loginUrl = `${process.env.CLIENT_URL}/login`; // Link to your login page
    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_WELCOME,
      dynamic_template_data: {
        name: user.firstName, // Pass the user's first name to the template
        login_link: loginUrl, // Pass the login URL to the template's button
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error(
        "Error sending welcome email:",
        error.response?.body || error
      );
    }
  }

  // --- METHOD FOR ACCOUNT VERIFICATION ---
  async sendVerificationEmail(user, verificationToken) {
    // This URL will point to your frontend, which will then make an API call
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_ACCOUNT_VERIFICATION, // Use the correct template ID
      dynamic_template_data: {
        verification_link: verificationUrl,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      console.error(
        "Error sending verification email:",
        error.response?.body || error
      );
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REQ_RESET_PASSWORD,
      dynamic_template_data: {
        name: user.firstName,
        reset_url: resetUrl,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending password reset email:", error.response.body);
    }
  }

  // --- PASSWORD RESET SUCCESS METHOD ---
  async sendPasswordResetSuccessEmail(user) {
    const loginUrl = `${process.env.CLIENT_URL}/login`;
    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_PASSWORD_RESET_SUCCESS, // Correct env variable
      dynamic_template_data: {
        name: user.firstName,
        login_link: loginUrl,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Password reset success email sent to ${user.email}`);
    } catch (error) {
      console.error(
        "Error sending password reset success email:",
        error.response?.body || error
      );
    }
  }

  /**
   * Notifies a RECEIVER that a document package process has started and they will get a final copy.
   * @param {object} recipient - The recipient contact object { contactName, contactEmail }.
   * @param {object} packageDetails - The package object { name }.
   * @param {string} senderName - The name of the user who initiated the package.
   * @param {string} actionUrl - The unique URL for the recipient to access the package.
   */
  async sendReceiverNotification(
    recipient,
    packageDetails,
    senderName,
    actionUrl
  ) {
    const msg = {
      to: recipient.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_RECEIVERS_NOTIFICATION,
      dynamic_template_data: {
        recipient_name: recipient.contactName,
        sender_name: senderName,
        package_name: packageDetails.name,
        action_link: actionUrl,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Receiver notification email sent to ${recipient.contactEmail} for package: ${packageDetails.name}`
      );
    } catch (error) {
      console.error(
        `Error sending receiver notification to ${recipient.contactEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a single, consolidated notification to any participant who must take action.
   * (i.e., Signers, Approvers, and Form Fillers).
   * @param {object} recipient - The recipient contact object { contactName, contactEmail }.
   * @param {object} packageDetails - The package object { name }.
   * @param {string} senderName - The name of the user who initiated the package.
   * @param {string} actionUrl - The unique URL for the recipient to access the package.
   */
  async sendActionRequiredNotification(
    recipient,
    packageDetails,
    senderName,
    actionUrl
  ) {
    const msg = {
      to: recipient.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_ALLPARTIES_NOTIFICATION,
      dynamic_template_data: {
        recipient_name: recipient.contactName,
        sender_name: senderName,
        package_name: packageDetails.name,
        action_link: actionUrl,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Action required email sent to ${recipient.contactEmail} for package: ${packageDetails.name}`
      );
    } catch (error) {
      console.error(
        `Error sending action required email to ${recipient.contactEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a 6-digit OTP for email-based signature verification.
   * @param {string} recipientEmail - The email address of the recipient.
   * @param {string} recipientName - The name of the recipient.
   * @param {string} packageName - The name of the document package.
   * @param {string} otpCode - The 6-digit one-time password.
   */
  async sendSignatureOtp(recipientEmail, recipientName, packageName, otpCode) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_EMAIL_SIX_DIGIST_OTP,
      dynamic_template_data: {
        recipient_name: recipientName,
        package_name: packageName,
        otp_code: otpCode,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Signature OTP email sent to ${recipientEmail}`);
    } catch (error) {
      console.error(
        `Error sending signature OTP to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a notification to all participants that the document is complete.
   * This is intended for all parties (initiator, signers, receivers).
   * @param {string} recipientEmail - The email of the person to notify.
   * @param {string} senderName - The name of the package initiator.
   * @param {string} packageName - The name of the package.
   * @param {string} actionUrl - The URL to view the completed document.
   */
  async sendDocumentCompletedNotification(
    recipientEmail,
    senderName,
    packageName,
    actionUrl
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_INITTIATER_SUCCESS_NOTIFICATION,
      dynamic_template_data: {
        sender_name: senderName,
        package_name: packageName,
        action_link: actionUrl,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Final completion notification sent to ${recipientEmail} for package: ${packageName}`
      );
    } catch (error) {
      console.error(
        `Error sending final completion notification to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a notification to all participants that the document was rejected.
   * @param {string} recipientEmail - The email of the person to notify.
   * @param {string} recipientName - The name of the recipient.
   * @param {string} senderName - The name of the package initiator.
   * @param {string} packageName - The name of the package.
   * @param {string} rejectorName - The name of the person who rejected the package.
   * @param {string} rejectionReason - The reason for rejection.
   * @param {string} actionUrl - The URL to view the rejected document.
   */
  async sendRejectionNotification(
    recipientEmail,
    recipientName,
    senderName,
    packageName,
    rejectorName,
    rejectionReason,
    universalAccessLink
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REJECTION_NOTIFICATION,
      dynamic_template_data: {
        recipient_name: recipientName,
        sender_name: senderName,
        package_name: packageName,
        rejector_name: rejectorName,
        rejection_reason: rejectionReason,
        action_link: universalAccessLink,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Rejection notification sent to ${recipientEmail} for package: ${packageName}`
      );
    } catch (error) {
      console.error(
        `Error sending rejection notification to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }
  /**
   * Notifies the NEW participant that a document has been reassigned to them.
   * Corresponds to SENDGRID_REASSIGNMENT_NOTIFICATION.
   * @param {string} recipientEmail - The new participant's email.
   * @param {string} recipientName - The new participant's name.
   * @param {string} senderName - The name of the original document initiator.
   * @param {string} packageName - The name of the document.
   * @param {string} reassignedByName - The name of the person who reassigned the role.
   * @param {string} actionUrl - The direct URL for the new participant to access the document.
   */
  async sendReassignmentNotification(
    recipientEmail,
    recipientName,
    senderName,
    packageName,
    reassignedByName,
    actionUrl
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REASSIGNMENT_NOTIFICATION,
      dynamic_template_data: {
        recipient_name: recipientName,
        sender_name: senderName,
        package_name: packageName,
        reassigned_by_name: reassignedByName,
        action_link: actionUrl,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Reassignment notification sent to new participant: ${recipientEmail}`
      );
    } catch (error) {
      console.error(
        `Error sending reassignment notification to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Confirms to the OLD participant that their reassignment was successful.
   * Corresponds to SENDGRID_REASSIGNMENT_CONFIRMATION.
   * @param {string} recipientEmail - The old participant's email.
   * @param {string} recipientName - The old participant's name.
   * @param {string} senderName - The name of the original document initiator.
   * @param {string} packageName - The name of the document.
   * @param {string} newParticipantName - The name of the person the document was reassigned to.
   * @param {string} reason - The reason provided for the reassignment.
   */
  async sendReassignmentConfirmation(
    recipientEmail,
    recipientName,
    senderName,
    packageName,
    newParticipantName,
    reason
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REASSIGNMENT_CONFIRMATION,
      dynamic_template_data: {
        recipient_name: recipientName,
        sender_name: senderName,
        package_name: packageName,
        new_participant_name: newParticipantName,
        reassignment_reason: reason,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Reassignment confirmation sent to old participant: ${recipientEmail}`
      );
    } catch (error) {
      console.error(
        `Error sending reassignment confirmation to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Notifies the document OWNER/INITIATOR that a reassignment has occurred.
   * Corresponds to SENDGRID_REASSIGNMENT_OWNER_NOTIFICATION.
   * @param {string} recipientEmail - The owner's email.
   * @param {string} ownerName - The owner's name.
   * @param {string} packageName - The name of the document.
   * @param {string} oldParticipantName - The name of the original participant.
   * @param {string} newParticipantName - The name of the new participant.
   * @param {string} reason - The reason provided for the reassignment.
   */
  async sendReassignmentOwnerNotification(
    recipientEmail,
    ownerName,
    packageName,
    oldParticipantName,
    newParticipantName,
    reason
  ) {
    const documentLink = `${process.env.CLIENT_URL}/package/${packageName}`; // Generic link
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REASSIGNMENT_OWNER_NOTIFICATION,
      dynamic_template_data: {
        initiator_name: ownerName,
        package_name: packageName,
        old_participant_name: oldParticipantName,
        new_participant_name: newParticipantName,
        reassignment_reason: reason,
        document_link: documentLink,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(`Reassignment owner notification sent to: ${recipientEmail}`);
    } catch (error) {
      console.error(
        `Error sending reassignment owner notification to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Send notification when document expires
   */
  async sendDocumentExpiredNotification(
    recipientEmail,
    initiatorName,
    packageName,
    expiredAt
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_DOCUMENT_EXPIRED_TEMPLATE,
      dynamic_template_data: {
        initiator_name: initiatorName,
        package_name: packageName,
        expired_date: expiredAt.toLocaleDateString(),
        expired_time: expiredAt.toLocaleTimeString(),
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Document expired notification sent to: ${recipientEmail}`);
    } catch (error) {
      console.error(
        `Error sending document expired notification to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Send reminder notification before document expires
   */
  async sendExpiryReminderNotification(
    recipientEmail,
    initiatorName,
    packageName,
    timeUntilExpiry,
    expiresAt
  ) {
    const actionUrl = `${process.env.CLIENT_URL}/package/${packageName}`;

    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_EXPIRY_REMINDER_TEMPLATE,
      dynamic_template_data: {
        initiator_name: initiatorName,
        package_name: packageName,
        time_until_expiry: timeUntilExpiry,
        expires_at: expiresAt.toLocaleDateString(),
        action_url: actionUrl,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Expiry reminder sent to: ${recipientEmail}`);
    } catch (error) {
      console.error(
        `Error sending expiry reminder to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Notifies all participants that a document has been revoked by the initiator.
   * Corresponds to SENDGRID_DOCUMENT_REVOKED_TEMPLATE
   * @param {string} recipientEmail - The participant's or owner's email.
   * @param {string} initiatorName - The name of the person who revoked it.
   * @param {string} packageName - The name of the document.
   */
  async sendDocumentRevokedNotification(
    recipientEmail,
    initiatorName,
    packageName
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_DOCUMENT_REVOKED_TEMPLATE,
      dynamic_template_data: {
        initiator_name: initiatorName,
        package_name: packageName,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(`Document revoked notification sent to: ${recipientEmail}`);
    } catch (error) {
      console.error(
        `Error sending document revoked notification to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a manual reminder from the initiator to a specific participant.
   * Corresponds to SENDGRID_MANUAL_REMINDER_TEMPLATE
   */
  async sendManualReminderNotification(
    recipientEmail,
    recipientName,
    initiatorName,
    packageName,
    actionLink
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_MANUAL_REMINDER_TEMPLATE,
      dynamic_template_data: {
        recipient_name: recipientName,
        initiator_name: initiatorName,
        package_name: packageName,
        action_link: actionLink,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(`Manual reminder sent to: ${recipientEmail}`);
    } catch (error) {
      console.error(
        `Error sending manual reminder to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }
}

module.exports = EmailService;
