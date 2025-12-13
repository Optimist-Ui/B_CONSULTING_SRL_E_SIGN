// services/EmailService.js
const sgMail = require("@sendgrid/mail");
const { getEmailContent } = require("../config/emailContent");

class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
    this.adminEmail = process.env.ADMIN_EMAIL;
  }

  /**
   * Helper method to replace placeholders in text
   * @param {string} text - Text with placeholders like {{name}}
   * @param {object} data - Data object with values to replace
   * @returns {string} Text with replaced placeholders
   */
  _replacePlaceholders(text, data) {
    let result = text;
    Object.keys(data).forEach((key) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, "g"), data[key]);
    });
    return result;
  }

  // --- WELCOME EMAIL METHOD ---
  async sendWelcomeEmail(user) {
    const language = user.language || "en";
    const content = getEmailContent("welcome", language);
    const loginUrl = `${process.env.CLIENT_URL}/login`;

    // Replace placeholders in greeting text
    const greetingText = this._replacePlaceholders(content.greeting, {
      name: user.firstName,
    });

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_WELCOME, // Single template for all languages
      dynamic_template_data: {
        // Subject
        subject: content.subject,

        // Main content
        heading: content.heading,
        greeting: greetingText,
        login_link: loginUrl,
        button_text: content.buttonText,
        closing_text: content.closingText,

        // Footer content
        support_text: content.supportText,
        support_email: this.fromEmail,
        company_info: content.companyInfo,
        unsubscribe_text: content.unsubscribe,
        preferences_text: content.preferences,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Welcome email sent to ${user.email} in ${language}`);
    } catch (error) {
      console.error(
        "Error sending welcome email:",
        error.response?.body || error
      );
      throw error;
    }
  }

  // --- METHOD FOR ACCOUNT VERIFICATION ---
  async sendVerificationEmail(user, verificationToken) {
    const language = user.language || "en";
    const content = getEmailContent("verification", language);
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_ACCOUNT_VERIFICATION,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        message: content.message,
        verification_link: verificationUrl,
        button_text: content.buttonText,
        expiry_text: content.expiryText,
        alternative_text: content.alternativeText,
        support_text: content.supportText,
        support_email: this.fromEmail,
        company_info: content.companyInfo,
        unsubscribe_text: content.unsubscribe,
        preferences_text: content.preferences,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Verification email sent to ${user.email} in ${language}`);
    } catch (error) {
      console.error(
        "Error sending verification email:",
        error.response?.body || error
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    const language = user.language || "en";
    const content = getEmailContent("passwordReset", language);
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const greetingText = this._replacePlaceholders(content.greeting, {
      name: user.firstName,
    });

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REQ_RESET_PASSWORD,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: content.message,
        reset_url: resetUrl,
        button_text: content.buttonText,
        ignore_text: content.ignoreText,
        alternative_text: content.alternativeText,
        support_text: content.supportText,
        support_email: this.fromEmail,
        company_info: content.companyInfo,
        unsubscribe_text: content.unsubscribe,
        preferences_text: content.preferences,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Password reset email sent to ${user.email} in ${language}`);
    } catch (error) {
      console.error(
        "Error sending password reset email:",
        error.response?.body || error
      );
      throw error;
    }
  }

  // --- PASSWORD RESET SUCCESS METHOD ---
  async sendPasswordResetSuccessEmail(user, resetPasswordUrl) {
    const language = user.language || "en";
    const content = getEmailContent("passwordResetSuccess", language);
    const loginUrl = `${process.env.CLIENT_URL}/login`;

    const greetingText = this._replacePlaceholders(content.greeting, {
      name: user.firstName,
    });

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_PASSWORD_RESET_SUCCESS,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: content.message,
        login_link: loginUrl,
        login_button_text: content.loginButtonText,
        security_heading: content.securityHeading,
        security_message: content.securityMessage,
        forgot_password_link: resetPasswordUrl,
        security_button_text: content.securityButtonText,
        support_follow_up_text: content.supportFollowUpText,
        support_text: content.supportText,
        support_email: this.fromEmail,
        company_info: content.companyInfo,
        unsubscribe_text: content.unsubscribe,
        preferences_text: content.preferences,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Password reset success email sent to ${user.email} in ${language}`
      );
    } catch (error) {
      console.error(
        "Error sending password reset success email:",
        error.response?.body || error
      );
    }
  }

  /**
   * Sends OTP for email change verification
   * @param {object} user - The user object
   * @param {string} newEmail - The new email they want to change to
   * @param {string} otpCode - The 6-digit OTP
   */
  async sendEmailChangeOtp(user, newEmail, otpCode) {
    const language = user.language || "en";
    const content = getEmailContent("emailChangeOtp", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      name: user.firstName,
    });

    const msg = {
      to: user.email, // Send to CURRENT email
      from: this.fromEmail,
      templateId: process.env.SENDGRID_EMAIL_CHANGE_OTP_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        request_message: content.requestMessage,
        new_email: newEmail,
        confirmation_instruction: content.confirmationInstruction,
        otp_code: otpCode,
        expiry_text: content.expiryText,
        security_heading: content.securityHeading,
        security_message: content.securityMessage,
        ignore_text: content.ignoreText,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Email change OTP sent to ${user.email} in ${language}`);
    } catch (error) {
      console.error(
        `Error sending email change OTP:`,
        error.response?.body || error
      );
      throw error;
    }
  }

  /**
   * Sends confirmation after email change
   * @param {Object} user - User object with new email
   */
  async sendEmailChangeConfirmation(user) {
    const language = user.language || "en";
    const content = getEmailContent("emailChangeConfirmation", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      name: user.firstName,
    });

    const msg = {
      to: user.email, // Send to NEW email
      from: this.fromEmail,
      templateId: process.env.SENDGRID_EMAIL_CHANGE_CONFIRMATION_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: content.message,
        new_email: user.email,
        login_instruction: content.loginInstruction,
        note_heading: content.noteHeading,
        note_message: content.noteMessage,
        footer_text: content.footerText,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Email change confirmation sent to ${user.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending email change confirmation:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends notification to old email after email change
   * @param {object} user - The user object containing language preference and new email
   * @param {string} oldEmail - The old email address to send the notification to
   */
  async sendEmailChangeNotification(user, oldEmail) {
    const language = user.language || "en";
    const content = getEmailContent("emailChangeNotification", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      name: user.firstName,
    });

    const msg = {
      to: oldEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_EMAIL_CHANGE_NOTIFICATION_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: content.message,
        new_email: user.email, // The new email is on the user object now
        security_heading: content.securityHeading,
        security_message: content.securityMessage,
        support_email: this.fromEmail,
        automated_message: content.automatedMessage,
        footer_text: content.footerText,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Email change notification sent to ${oldEmail} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending email change notification:`,
        error.response?.body || error
      );
      // Don't throw - this is a courtesy notification
    }
  }

  /**
   * Sends account deactivation confirmation email with reactivation link.
   * @param {object} user - The full user object
   * @param {string} reactivationUrl - The unique URL to reactivate the account
   */
  async sendDeactivationEmail(user, reactivationUrl) {
    const language = user.language || "en";
    const content = getEmailContent("accountDeactivation", language);

    // Replace placeholders for name and grace period
    const greetingText = this._replacePlaceholders(content.greeting, {
      name: user.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      grace_period_days: 14,
    });

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_DEACTIVATION_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        reactivation_link: reactivationUrl,
        button_text: content.buttonText,
        security_text: content.securityText,
        closing_text: content.closingText,
        support_text: content.supportText,
        support_email: this.fromEmail,
        company_info: content.companyInfo,
        unsubscribe_text: content.unsubscribe,
        preferences_text: content.preferences,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Deactivation email sent to ${user.email} in ${language}`);
    } catch (error) {
      console.error(
        "Error sending deactivation email:",
        error.response?.body || error
      );
    }
  }

  /**
   * Sends account reactivation confirmation email.
   * @param {object} user - The full user object
   */
  async sendReactivationConfirmationEmail(user) {
    const language = user.language || "en";
    const content = getEmailContent("accountReactivation", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      name: user.firstName,
    });

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REACTIVATION_CONFIRM_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: content.message,
        login_link: `${process.env.CLIENT_URL}/login`,
        button_text: content.buttonText,
        closing_text: content.closingText,
        support_text: content.supportText,
        support_email: this.fromEmail,
        company_info: content.companyInfo,
        unsubscribe_text: content.unsubscribe,
        preferences_text: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Reactivation confirmation email sent to ${user.email} in ${language}`
      );
    } catch (error) {
      console.error(
        "Error sending reactivation confirmation email:",
        error.response?.body || error
      );
    }
  }

  /**
   * Notifies a RECEIVER that a document package process has started and they will get a final copy.
   * @param {object} recipient - The recipient contact object { contactName, contactEmail, language }.
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
    // The language is now available on the recipient object, passed from PackageService.
    const language = recipient.language || "en";
    const content = getEmailContent("receiverNotification", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      recipient_name: recipient.contactName,
    });

    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageDetails.name,
      sender_name: senderName,
    });

    const msg = {
      to: recipient.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_RECEIVERS_NOTIFICATION,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        no_action_required: content.noActionRequired,
        action_link: actionUrl,
        button_text: content.buttonText,
        footer_text: content.footerText,
        unsubscribe_text: content.unsubscribe,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Receiver notification email sent to ${recipient.contactEmail} in ${language} for package: ${packageDetails.name}`
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
   * Includes both app deep link and web fallback options.
   * @param {object} recipient - The recipient contact object { contactName, contactEmail, language }.
   * @param {object} packageDetails - The package object { name, _id }.
   * @param {string} senderName - The name of the user who initiated the package.
   * @param {string} actionUrl - The unique URL for the recipient to access the package (web).
   * @param {string} customMessage - The optional custom message from the sender.
   */
  async sendActionRequiredNotification(
    recipient,
    packageDetails,
    senderName,
    actionUrl,
    customMessage
  ) {
    const language = recipient.language || "en";
    const content = getEmailContent("actionRequiredNotification", language);

    // Prepare dynamic content strings
    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageDetails.name,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      recipient_name: recipient.contactName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      sender_name: senderName,
      package_name: packageDetails.name,
    });
    const customMessageHeaderText = this._replacePlaceholders(
      content.customMessageHeader,
      { sender_name: senderName }
    );

    // Generate deep link for the app using the package ID and recipient ID
    // actionUrl format: ${CLIENT_URL}/package/${pkg._id}/participant/${user.id}
    // Extract participant ID from actionUrl for the deep link
    const participantId = recipient.id;
    const appDeepLink = `esign://package/${packageDetails._id}/participant/${participantId}?action=sign`;

    console.log(appDeepLink);

    const msg = {
      to: recipient.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_ALLPARTIES_NOTIFICATION,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        custom_message_header: customMessageHeaderText,
        custom_message: customMessage,
        has_custom_message: !!customMessage,

        // App deep link (primary action)
        app_deep_link: actionUrl,
        app_button_text: content.appButtonText,

        // Web link (fallback/secondary action) - using the actionUrl passed in
        web_action_link: actionUrl,
        web_button_text: content.webButtonText,

        // Divider text
        or_text: content.orText,

        instruction_text: content.instructionText,
        footer_text: content.footerText,
        unsubscribe_text: content.unsubscribe,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Action required email sent to ${recipient.contactEmail} in ${language} for package: ${packageDetails.name}`
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
   * @param {object} recipient - The recipient object { contactEmail, contactName, language }.
   * @param {string} packageName - The name of the document package.
   * @param {string} otpCode - The 6-digit one-time password.
   */
  async sendSignatureOtp(recipient, packageName, otpCode) {
    const language = recipient.language || "en";
    const content = getEmailContent("signatureOtp", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      recipient_name: recipient.contactName,
    });

    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
    });

    const msg = {
      to: recipient.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_EMAIL_SIX_DIGIST_OTP,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        otp_code: otpCode,
        expiry_text: content.expiryText,
        ignore_text: content.ignoreText,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Signature OTP email sent to ${recipient.contactEmail} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending signature OTP to ${recipient.contactEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a notification to a participant that the document is complete.
   * @param {object} recipient - The recipient object { email, name, language }.
   * @param {string} senderName - The name of the package initiator.
   * @param {string} packageName - The name of the package.
   * @param {string} actionUrl - The URL to view the completed document.
   */
  async sendDocumentCompletedNotification(
    recipient,
    senderName,
    packageName,
    actionUrl
  ) {
    const language = recipient.language || "en";
    const content = getEmailContent("documentCompleted", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      recipient_name: recipient.name,
    });
    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
      sender_name: senderName,
    });

    const msg = {
      to: recipient.email,
      from: this.fromEmail,
      // NOTE: The template ID seems to be for the initiator. You may want to create a separate one for participants.
      // Using the provided one for now: SENDGRID_INITTIATER_SUCCESS_NOTIFICATION
      templateId: process.env.SENDGRID_INITTIATER_SUCCESS_NOTIFICATION,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        action_link: actionUrl,
        button_text: content.buttonText,
        closing_message: content.closingMessage,
        footer_text: content.footerText,
        unsubscribe_text: content.unsubscribe,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Final completion notification sent to ${recipient.email} in ${language} for package: ${packageName}`
      );
    } catch (error) {
      console.error(
        `Error sending final completion notification to ${recipient.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a notification to all participants that the document was rejected.
   * @param {object} recipient - The recipient object { email, name, language }.
   * @param {string} senderName - The name of the package initiator.
   * @param {string} packageName - The name of the package.
   * @param {string} rejectorName - The name of the person who rejected the package.
   * @param {string} rejectionReason - The reason for rejection.
   * @param {string} actionUrl - The URL to view the rejected document.
   */
  async sendRejectionNotification(
    recipient,
    senderName,
    packageName,
    rejectorName,
    rejectionReason,
    actionUrl
  ) {
    const language = recipient.language || "en";
    const content = getEmailContent("rejectionNotification", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      recipient_name: recipient.name,
    });
    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
      sender_name: senderName,
      rejector_name: rejectorName,
    });

    const msg = {
      to: recipient.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REJECTION_NOTIFICATION,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        rejection_reason_header: content.reasonHeader,
        rejection_reason: rejectionReason,
        action_link: actionUrl,
        button_text: content.buttonText,
        no_action_required: content.noActionRequired,
        footer_text: content.footerText,
        unsubscribe_text: content.unsubscribe,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Rejection notification sent to ${recipient.email} in ${language} for package: ${packageName}`
      );
    } catch (error) {
      console.error(
        `Error sending rejection notification to ${recipient.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Notifies the NEW participant that a document has been reassigned to them.
   * @param {object} newParticipant - The new participant's full Contact object.
   * @param {string} senderName - The name of the original document initiator.
   * @param {string} packageName - The name of the document.
   * @param {string} reassignedByName - The name of the person who reassigned the role.
   * @param {string} actionUrl - The direct URL for the new participant to access the document.
   */
  async sendReassignmentNotification(
    newParticipant,
    senderName,
    packageName,
    reassignedByName,
    actionUrl
  ) {
    const language = newParticipant.language || "en";
    const content = getEmailContent("reassignmentNotification", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      recipient_name: `${newParticipant.firstName} ${newParticipant.lastName}`,
    });
    const messageText = this._replacePlaceholders(content.message, {
      reassigned_by_name: reassignedByName,
      package_name: packageName,
    });
    const originalSenderInfoText = this._replacePlaceholders(
      content.originalSenderInfo,
      { sender_name: senderName }
    );

    const msg = {
      to: newParticipant.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REASSIGNMENT_NOTIFICATION,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        original_sender_info: originalSenderInfoText,
        action_link: actionUrl,
        button_text: content.buttonText,
        instruction_text: content.instructionText,
        unsubscribe: content.unsubscribe, // For the footer
        unsubscribe_preferences: content.preferences, // For the footer
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Reassignment notification sent to new participant: ${newParticipant.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending reassignment notification to ${newParticipant.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Confirms to the OLD participant that their reassignment was successful.
   * @param {object} originalParticipant - The old participant's object { contactEmail, contactName, language }.
   * @param {string} senderName - The name of the original document initiator.
   * @param {string} packageName - The name of the document.
   * @param {string} newParticipantName - The name of the person the document was reassigned to.
   * @param {string} reason - The reason provided for the reassignment (not used in this template but kept for consistency).
   */
  async sendReassignmentConfirmation(
    originalParticipant,
    senderName,
    packageName,
    newParticipantName,
    reason
  ) {
    const language = originalParticipant.language || "en";
    const content = getEmailContent("reassignmentConfirmation", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      recipient_name: originalParticipant.contactName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
    });

    const msg = {
      to: originalParticipant.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REASSIGNMENT_CONFIRMATION,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        tasks_transferred_to: content.tasksTransferredTo,
        new_participant_name: newParticipantName,
        no_action_required: content.noActionRequired,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Reassignment confirmation sent to old participant: ${originalParticipant.contactEmail} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending reassignment confirmation to ${originalParticipant.contactEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Notifies the document OWNER that a reassignment has occurred.
   * @param {object} packageOwner - The full User object of the owner.
   * @param {string} packageName - The name of the document.
   * @param {string} oldParticipantName - The name of the original participant.
   * @param {string} newParticipantName - The name of the new participant.
   * @param {string} reason - The reason provided for the reassignment.
   * @param {string} packageId - The ID of the package for link generation.
   */
  async sendReassignmentOwnerNotification(
    packageOwner,
    packageName,
    oldParticipantName,
    newParticipantName,
    reason,
    packageId
  ) {
    const language = packageOwner.language || "en";
    const content = getEmailContent("reassignmentOwnerNotification", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      owner_name: packageOwner.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
    });

    // The link for the owner does not need a participant ID
    const documentLink = `${process.env.CLIENT_URL}/package/${packageId}`;

    const msg = {
      to: packageOwner.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REASSIGNMENT_OWNER_NOTIFICATION,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        original_participant_header: content.originalParticipantHeader,
        old_participant_name: oldParticipantName,
        new_participant_header: content.newParticipantHeader,
        new_participant_name: newParticipantName,
        reason_header: content.reasonHeader,
        reassignment_reason: reason,
        document_link: documentLink,
        button_text: content.buttonText,
        no_action_required: content.noActionRequired,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Reassignment owner notification sent to: ${packageOwner.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending reassignment owner notification to ${packageOwner.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Send notification when document expires
   * @param {object} recipient - The recipient object { email, name, language }.
   * @param {string} initiatorName - The name of the package initiator.
   * @param {string} packageName - The name of the package.
   * @param {Date} expiredAt - The date object of when the package expired.
   */
  async sendDocumentExpiredNotification(
    recipient,
    initiatorName,
    packageName,
    expiredAt
  ) {
    const language = recipient.language || "en";
    const content = getEmailContent("documentExpired", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
      initiator_name: initiatorName,
    });

    // Format date and time using the recipient's locale for better readability
    const expiredDate = new Intl.DateTimeFormat(language, {
      dateStyle: "long",
    }).format(expiredAt);
    const expiredTime = new Intl.DateTimeFormat(language, {
      timeStyle: "short",
    }).format(expiredAt);

    const msg = {
      to: recipient.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_DOCUMENT_EXPIRED_TEMPLATE,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        message: messageText,
        expired_on_label: content.expiredOnLabel,
        expired_date: expiredDate,
        at_label: content.atLabel,
        expired_time: expiredTime,
        no_action_required: content.noActionRequired,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Document expired notification sent to: ${recipient.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending document expired notification to ${recipient.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Send reminder notification before document expires
   * @param {object} recipient - The recipient object { email, name, language }.
   * @param {string} initiatorName - The name of the package initiator.
   * @param {string} packageName - The name of the package.
   * @param {string} timeUntilExpiry - The human-readable string (e.g., "24 hours").
   * @param {Date} expiresAt - The exact date of expiry.
   * @param {string} actionUrl - The direct URL for the participant to take action.
   */
  async sendExpiryReminderNotification(
    recipient,
    initiatorName,
    packageName,
    timeUntilExpiry,
    expiresAt,
    actionUrl
  ) {
    const language = recipient.language || "en";
    const content = getEmailContent("expiryReminder", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
      initiator_name: initiatorName,
    });

    // Format expiry date using recipient's locale
    const expiresAtFormatted = new Intl.DateTimeFormat(language, {
      dateStyle: "long",
    }).format(expiresAt);

    const expiryInfoText = this._replacePlaceholders(content.expiryInfo, {
      time_until_expiry: timeUntilExpiry,
      expires_at: expiresAtFormatted,
    });

    const msg = {
      to: recipient.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_EXPIRY_REMINDER_TEMPLATE,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        message: messageText,
        expiry_info: expiryInfoText,
        action_url: actionUrl,
        button_text: content.buttonText,
        instruction_text: content.instructionText,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Expiry reminder sent to: ${recipient.email} in ${language}`);
    } catch (error) {
      console.error(
        `Error sending expiry reminder to ${recipient.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Notifies a participant that a document has been revoked by the initiator.
   * @param {object} recipient - The recipient object { email, name, language }.
   * @param {string} initiatorName - The name of the person who revoked it.
   * @param {string} packageName - The name of the document.
   */
  async sendDocumentRevokedNotification(recipient, initiatorName, packageName) {
    const language = recipient.language || "en";
    const content = getEmailContent("documentRevoked", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      recipient_name: recipient.name,
    });
    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
      initiator_name: initiatorName,
    });

    const msg = {
      to: recipient.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_DOCUMENT_REVOKED_TEMPLATE,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        no_action_required: content.noActionRequired,
        contact_sender_info: content.contactSenderInfo,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Document revoked notification sent to: ${recipient.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending document revoked notification to ${recipient.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a manual reminder from the initiator to a specific participant.
   * @param {object} recipient - The participant object { contactEmail, contactName, language }.
   * @param {string} initiatorName - The name of the person sending the reminder.
   * @param {string} packageName - The name of the document.
   * @param {string} actionLink - The direct URL for the participant to take action.
   */
  async sendManualReminderNotification(
    recipient,
    initiatorName,
    packageName,
    actionLink
  ) {
    const language = recipient.language || "en";
    const content = getEmailContent("manualReminder", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      recipient_name: recipient.contactName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      initiator_name: initiatorName,
      package_name: packageName,
    });

    const msg = {
      to: recipient.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_MANUAL_REMINDER_TEMPLATE,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        prompt: content.prompt,
        action_link: actionLink,
        button_text: content.buttonText,
        instruction_text: content.instructionText,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Manual reminder sent to: ${recipient.contactEmail} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending manual reminder to ${recipient.contactEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Notifies a NEWLY ADDED RECEIVER that they have been given access.
   * @param {object} recipient - The new receiver's object { contactEmail, contactName, language }.
   * @param {string} senderName - The name of the original document initiator.
   * @param {string} addedByName - The name of the participant who added them.
   * @param {string} packageName - The name of the document.
   * @param {string} actionUrl - The direct URL for the new receiver to view the document.
   */
  async sendNewReceiverNotification(
    recipient,
    senderName,
    addedByName,
    packageName,
    actionUrl
  ) {
    const language = recipient.language || "en";
    const content = getEmailContent("newReceiverNotification", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      recipient_name: recipient.contactName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      added_by_name: addedByName,
      package_name: packageName,
    });
    const originalSenderInfoText = this._replacePlaceholders(
      content.originalSenderInfo,
      { sender_name: senderName }
    );

    const msg = {
      to: recipient.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_NEW_RECEIVER_NOTIFICATION,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        original_sender_info: originalSenderInfoText,
        action_link: actionUrl,
        button_text: content.buttonText,
        no_action_required: content.noActionRequired,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `New receiver notification sent to: ${recipient.contactEmail} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending new receiver notification to ${recipient.contactEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Notifies the document OWNER that a participant has added a new receiver.
   * @param {object} packageOwner - The full User object of the owner.
   * @param {string} newReceiverName - The name of the new receiver who was added.
   * @param {string} addedByName - The name of the participant who added the new receiver.
   * @param {string} packageName - The name of the document.
   */
  async sendNewReceiverOwnerNotification(
    packageOwner,
    newReceiverName,
    addedByName,
    packageName
  ) {
    const language = packageOwner.language || "en";
    const content = getEmailContent("newReceiverOwnerNotification", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      owner_name: packageOwner.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
    });

    const dashboardLink = `${process.env.CLIENT_URL}/dashboard`;

    const msg = {
      to: packageOwner.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_NEW_RECEIVER_OWNER_NOTIFICATION,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        added_by_header: content.addedByHeader,
        added_by_name: addedByName,
        new_receiver_header: content.newReceiverHeader,
        new_receiver_name: newReceiverName,
        dashboard_link: dashboardLink,
        button_text: content.buttonText,
        no_action_required: content.noActionRequired,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `'Receiver Added' owner notification sent to: ${packageOwner.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending 'Receiver Added' owner notification to ${packageOwner.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a confirmation email when a user's subscription is successfully activated.
   * @param {object} user - The full user object.
   * @param {string} planName - The name of the subscribed plan (e.g., "Pro").
   * @param {number} amount - The numeric amount charged (e.g., 19.99).
   * @param {Date} renewalDateObject - The Date object for when the subscription will renew.
   * @param {string} invoiceUrl - The direct URL to the  invoice.
   */
  async sendSubscriptionConfirmation(
    user,
    planName,
    amount,
    renewalDateObject,
    invoiceUrl
  ) {
    const language = user.language || "en";
    const content = getEmailContent("subscriptionConfirmation", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      user_name: user.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      plan_name: planName,
    });

    // Format currency and date based on the user's language
    const formattedAmount = new Intl.NumberFormat(language, {
      style: "currency",
      currency: "EUR",
    }).format(amount);
    const formattedRenewalDate = renewalDateObject
      ? new Intl.DateTimeFormat(language, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(renewalDateObject)
      : "N/A";

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_SUBSCRIPTION_SUCCESS_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        plan_label: content.planLabel,
        plan_name: planName,
        amount_label: content.amountLabel,
        plan_price: formattedAmount,
        renewal_label: content.renewalLabel,
        renewal_date: formattedRenewalDate,
        invoice_link: invoiceUrl,
        button_text: content.buttonText,
        manage_subscription_text: content.manageSubscriptionText,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
        billing_portal_link_text: content.billingPortalLinkText,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Subscription confirmation sent to: ${user.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending subscription confirmation to ${user.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an email confirming that auto-renewal has been turned off.
   * @param {object} user - The full user object.
   * @param {string} planName - The name of the plan being cancelled.
   * @param {Date} expiryDateObject - The Date object for when the subscription will expire.
   */
  async sendCancellationConfirmation(user, planName, expiryDateObject) {
    const language = user.language || "en";
    const content = getEmailContent("subscriptionCancellation", language);

    // Format the expiry date based on the user's locale
    const formattedExpiryDate = new Intl.DateTimeFormat(language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(expiryDateObject);

    const greetingText = this._replacePlaceholders(content.greeting, {
      user_name: user.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      plan_name: planName,
      expiry_date: formattedExpiryDate,
    });

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_SUBSCRIPTION_CANCEL_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        reactivate_prompt: content.reactivatePrompt,
        button_text: content.buttonText,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Subscription cancellation confirmation sent to: ${user.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending cancellation confirmation to ${user.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an email confirming that auto-renewal has been turned back on.
   * @param {object} user - The full user object.
   * @param {string} planName - The name of the reactivated plan.
   * @param {Date} renewalDateObject - The next renewal date as a Date object.
   */
  async sendSubscriptionReactivation(user, planName, renewalDateObject) {
    const language = user.language || "en";
    // Use the new content key
    const content = getEmailContent("subscriptionReactivation", language);

    // Format the renewal date based on the user's locale
    const formattedRenewalDate = new Intl.DateTimeFormat(language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(renewalDateObject);

    const greetingText = this._replacePlaceholders(content.greeting, {
      user_name: user.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      plan_name: planName,
      renewal_date: formattedRenewalDate,
    });

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_SUBSCRIPTION_REACTIVATE_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        button_text: content.buttonText,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Subscription reactivation confirmation sent to: ${user.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending reactivation confirmation to ${user.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an email confirming that a free trial has been activated.
   * @param {object} user - The full user object.
   * @param {string} planName - The name of the trial plan.
   * @param {Date} trialEndDateObject - When the trial expires as a Date object.
   * @param {number} documentLimit - Number of documents they can create during trial.
   */
  async sendTrialActivationEmail(
    user,
    planName,
    trialEndDateObject,
    documentLimit
  ) {
    const language = user.language || "en";
    const content = getEmailContent("trialActivation", language);

    // Format the trial end date based on the user's locale
    const formattedTrialEndDate = new Intl.DateTimeFormat(language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(trialEndDateObject);

    const greetingText = this._replacePlaceholders(content.greeting, {
      user_name: user.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      plan_name: planName,
    });

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_TRIAL_ACTIVATION_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        plan_label: content.planLabel,
        plan_name: planName,
        end_date_label: content.endDateLabel,
        trial_end_date: formattedTrialEndDate,
        doc_limit_label: content.docLimitLabel,
        document_limit: documentLimit,
        doc_limit_unit: content.docLimitUnit,
        dashboard_link: `${process.env.CLIENT_URL}/dashboard`,
        button_text: content.buttonText,
        manage_subscription_text: content.manageSubscriptionText,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
        billing_portal_link_text: content.billingPortalLinkText,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Trial activation email sent to: ${user.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending trial activation email to ${user.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an email confirming that the trial has ended and the subscription is now active.
   * @param {object} user - The full user object.
   * @param {string} planName - The name of the now-active plan.
   * @param {Date} firstBillingDateObject - When they were first charged.
   * @param {Date} nextBillingDateObject - When the next charge will occur.
   * @param {number} amount - The numeric amount charged.
   * @param {string} invoiceUrl - Link to the  invoice.
   */
  async sendTrialToActiveTransitionEmail(
    user,
    planName,
    firstBillingDateObject,
    nextBillingDateObject,
    amount,
    invoiceUrl
  ) {
    const language = user.language || "en";
    const content = getEmailContent("trialToActive", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      user_name: user.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      plan_name: planName,
    });

    // Format currency and dates based on the user's language
    const formattedAmount = new Intl.NumberFormat(language, {
      style: "currency",
      currency: "EUR",
    }).format(amount);
    const dateFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedFirstBillingDate = new Intl.DateTimeFormat(
      language,
      dateFormatOptions
    ).format(firstBillingDateObject);
    const formattedNextBillingDate = nextBillingDateObject
      ? new Intl.DateTimeFormat(language, dateFormatOptions).format(
          nextBillingDateObject
        )
      : "N/A";

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_TRIAL_TO_ACTIVE_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        plan_label: content.planLabel,
        plan_name: planName,
        amount_label: content.amountLabel,
        amount: formattedAmount,
        billed_on_label: content.billedOnLabel,
        first_billing_date: formattedFirstBillingDate,
        renewal_label: content.renewalLabel,
        next_billing_date: formattedNextBillingDate,
        invoice_url: invoiceUrl,
        button_text: content.buttonText,
        manage_subscription_text: content.manageSubscriptionText,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
        billing_portal_link_text: content.billingPortalLinkText,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Trial to active transition email sent to: ${user.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending trial to active transition email to ${user.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a reminder email 1 day before subscription expiry
   * @param {object} user - The full user object
   * @param {string} planName - The name of the expiring plan
   * @param {Date} expiryDateObject - The Date object when subscription expires
   * @param {number} documentsUsed - Number of documents used
   * @param {number} documentLimit - Total document limit
   */
  async sendSubscriptionExpiryReminder(
    user,
    planName,
    expiryDateObject,
    documentsUsed,
    documentLimit
  ) {
    const language = user.language || "en";
    const content = getEmailContent("subscriptionExpiryReminder", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      user_name: user.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      plan_name: planName,
      expiry_date: new Intl.DateTimeFormat(language, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(expiryDateObject),
    });

    const formattedExpiryDate = new Intl.DateTimeFormat(language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(expiryDateObject);

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_SUBSCRIPTION_EXPIRY_REMINDER_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        plan_label: content.planLabel,
        plan_name: planName,
        expiry_label: content.expiryLabel,
        expiry_date: formattedExpiryDate,
        documents_label: content.documentsLabel,
        documents_used: `${documentsUsed} / ${documentLimit}`,
        button_text: content.buttonText,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
        manage_subscription_text: content.manageSubscriptionText,
        billing_portal_link_text: content.billingPortalLinkText,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Subscription expiry reminder sent to: ${user.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending subscription expiry reminder to ${user.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a confirmation email when subscription has expired
   * @param {object} user - The full user object
   * @param {string} planName - The name of the expired plan
   * @param {Date} expiryDateObject - The Date object when subscription expired
   * @param {number} documentsUsed - Number of documents used
   * @param {number} documentLimit - Total document limit
   */
  async sendSubscriptionExpiredEmail(
    user,
    planName,
    expiryDateObject,
    documentsUsed,
    documentLimit
  ) {
    const language = user.language || "en";
    const content = getEmailContent("subscriptionExpired", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      user_name: user.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      plan_name: planName,
      expiry_date: new Intl.DateTimeFormat(language, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(expiryDateObject),
    });

    const formattedExpiryDate = new Intl.DateTimeFormat(language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(expiryDateObject);

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_SUBSCRIPTION_EXPIRED_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        plan_label: content.planLabel,
        plan_name: planName,
        expiry_label: content.expiryLabel,
        expiry_date: formattedExpiryDate,
        documents_label: content.documentsLabel,
        documents_used: `${documentsUsed} / ${documentLimit}`,
        button_text: content.buttonText,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
        manage_subscription_text: content.manageSubscriptionText,
        billing_portal_link_text: content.billingPortalLinkText,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Subscription expired notification sent to: ${user.email} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending subscription expired email to ${user.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an email to a participant inviting them to review a completed package.
   * @param {object} participant - The full participant object { contactEmail, contactName, language }.
   * @param {string} packageName - The name of the package.
   * @param {string} reviewLink - The direct URL to leave a review.
   */
  async sendRequestForReviewEmail(participant, packageName, reviewLink) {
    const language = participant.language || "en";
    const content = getEmailContent("reviewRequest", language);

    // Replace placeholders in greeting and message
    const greetingText = this._replacePlaceholders(content.greeting, {
      participant_name: participant.contactName,
    });

    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
    });

    const msg = {
      to: participant.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REVIEW_REQUEST_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        button_text: content.buttonText,
        closing_message: content.closingMessage,
        review_link: reviewLink,
        unsubscribe_text: content.unsubscribe,
        preferences_text: content.preferences,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Review request email sent to: ${participant.contactEmail} in ${language}`
      );
    } catch (error) {
      console.error(
        `Error sending review request email to ${participant.contactEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a "Thank you, your feedback helps us improve" email for low ratings.
   * @param {object} reviewer - The full participant object { contactEmail, contactName, language }.
   */
  async sendReviewImprovementEmail(reviewer) {
    const language = reviewer.language || "en";
    const content = getEmailContent("reviewImprovement", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      reviewer_name: reviewer.contactName,
    });

    const msg = {
      to: reviewer.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REVIEW_IMPROVEMENT_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: content.message,
        closing_message: content.closingMessage,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Review improvement email sent to: ${reviewer.contactEmail} in ${language}`
      );
    } catch (error) {
      console.error(
        "Error sending review improvement email:",
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an appreciation email for positive feedback.
   * @param {object} reviewer - The full participant object { contactEmail, contactName, language }.
   */
  async sendReviewAppreciationEmail(reviewer) {
    const language = reviewer.language || "en";
    const content = getEmailContent("reviewAppreciation", language);

    const greetingText = this._replacePlaceholders(content.greeting, {
      reviewer_name: reviewer.contactName,
    });

    const msg = {
      to: reviewer.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REVIEW_APPRECIATION_TEMPLATE_ID,
      dynamic_template_data: {
        subject: content.subject,
        heading: content.heading,
        greeting: greetingText,
        message: content.message,
        closing_message: content.closingMessage,
        unsubscribe: content.unsubscribe,
        unsubscribe_preferences: content.preferences,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Review appreciation email sent to: ${reviewer.contactEmail} in ${language}`
      );
    } catch (error) {
      console.error(
        "Error sending review appreciation email:",
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a notification to the initiator about a participant's action.
   * @param {object} initiator - The full User object of the initiator.
   * @param {string} packageName - The name of the document package.
   * @param {string} actorName - The name of the participant who acted.
   * @param {string[]} completedNames - An array of names of completed participants.
   * @param {string[]} pendingNames - An array of names of pending participants.
   * @param {string} actionLink - The URL for the initiator to view progress.
   */
  async sendParticipantActionNotification(
    initiator,
    packageName,
    actorName,
    completedNames,
    pendingNames,
    actionLink
  ) {
    const language = initiator.language || "en";
    const content = getEmailContent("participantAction", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      initiator_name: initiator.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      actor_name: actorName,
      package_name: packageName,
    });

    // Build HTML lists inside the EmailService
    const completedListHtml = `<ul>${completedNames
      .map((name) => `<li>✔️ ${name}</li>`)
      .join("")}</ul>`;
    const pendingListHtml =
      pendingNames.length > 0
        ? `<ul>${pendingNames
            .map((name) => `<li>... ${name}</li>`)
            .join("")}</ul>`
        : content.allCompleteMessage;

    const msg = {
      to: initiator.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_PARTICIPANT_ACTION_TEMPLATE_ID,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        completed_header: content.completedHeader,
        completed_list: completedListHtml,
        pending_header: content.pendingHeader,
        pending_list: pendingListHtml,
        action_link: actionLink,
        button_text: content.buttonText,
        closing_message: content.closingMessage,
        footer_text: content.footerText,
        unsubscribe: content.unsubscribe,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Participant action notification sent to: ${initiator.email} in ${language}`
      );
    } catch (error) {
      console.error(
        "Error sending participant action notification email:",
        error.response?.body || error
      );
    }
  }

  /**
   * Sends final completion notification to the INITIATOR with a dashboard link.
   * @param {object} initiator - The full User object of the initiator.
   * @param {string} packageName - The package name.
   * @param {string} dashboardLink - Link to the dashboard.
   */
  async sendInitiatorCompletionNotification(
    initiator,
    packageName,
    dashboardLink
  ) {
    const language = initiator.language || "en";
    const content = getEmailContent("initiatorCompletion", language);

    const subjectText = this._replacePlaceholders(content.subject, {
      package_name: packageName,
    });
    const greetingText = this._replacePlaceholders(content.greeting, {
      initiator_name: initiator.firstName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
    });

    const msg = {
      to: initiator.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_INITIATOR_COMPLETION_NOTIFICATION,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        dashboard_link: dashboardLink,
        button_text: content.buttonText,
        closing_message: content.closingMessage,
        footer_text: content.footerText,
        unsubscribe: content.unsubscribe,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Completion notification sent to initiator ${initiator.email} in ${language} for package: ${packageName}`
      );
    } catch (error) {
      console.error(
        `Error sending completion notification to ${initiator.email}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends enterprise inquiry details to admin.
   * @param {Object} inquiryData - The inquiry details.
   * @param {string} inquiryData.language - The language for the notification (e.g., 'en').
   */
  async sendEnterpriseInquiry({
    contactName,
    contactEmail,
    companyName,
    phoneNumber,
    message,
    language, // The new language parameter
  }) {
    const lang = language || "en"; // Default to English if not provided
    const content = getEmailContent("enterpriseInquiry", lang);

    const subjectText = this._replacePlaceholders(content.subject, {
      companyName: companyName,
    });

    const submissionDate = new Date().toLocaleString(lang, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const submittedOnText = this._replacePlaceholders(content.submittedOn, {
      submission_date: submissionDate,
    });

    const msg = {
      to: this.adminEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_ENTERPRISE_INQUIRY_TEMPLATE_ID,
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        subheading: content.subheading,
        name_label: content.nameLabel,
        contact_name: contactName,
        email_label: content.emailLabel,
        contact_email: contactEmail,
        company_label: content.companyLabel,
        company_name: companyName,
        phone_label: content.phoneLabel,
        phone_number: phoneNumber,
        message_label: content.messageLabel,
        message: message,
        not_provided: content.notProvided,
        reply_button_text: content.replyButton,
        submitted_on_text: submittedOnText,
        footer_text: content.footerText,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Enterprise inquiry email sent to admin for ${companyName} in ${lang}`
      );
    } catch (error) {
      console.error(
        `Error sending enterprise inquiry email:`,
        error.response?.body || error
      );
      throw error;
    }
  }

  /**
   * Sends a notification to the user when they've reached their document limit
   * @param {object} user - User object { firstName, lastName, email, language }
   * @param {string} packageName - Name of the package that was just created
   */
  async sendCreditLimitReachedNotification(user, packageName) {
    const language = user.language || "en";
    const content = getEmailContent("creditLimitReached", language);

    const userName = `${user.firstName} ${user.lastName}`;

    // Prepare dynamic content strings
    const subjectText = this._replacePlaceholders(content.subject, {});
    const greetingText = this._replacePlaceholders(content.greeting, {
      user_name: userName,
    });
    const messageText = this._replacePlaceholders(content.message, {
      package_name: packageName,
    });

    // Generate links
    const upgradePlanLink = `${process.env.CLIENT_URL}/subscriptions`;
    const dashboardLink = `${process.env.CLIENT_URL}/dashboard`;

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_CREDIT_LIMIT_TEMPLATE_ID, // You'll need to create this template
      dynamic_template_data: {
        subject: subjectText,
        heading: content.heading,
        greeting: greetingText,
        message: messageText,
        warning_text: content.warningText,

        // Primary action (upgrade plan)
        action_link: upgradePlanLink,
        action_button_text: content.actionButtonText,

        // Secondary action (dashboard)
        secondary_link: dashboardLink,
        secondary_button_text: content.secondaryButtonText,

        // Divider text
        or_text: content.orText,

        footer_text: content.footerText,
        unsubscribe_text: content.unsubscribe,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Credit limit reached email sent to ${user.email} in ${language} for package: ${packageName}`
      );
    } catch (error) {
      console.error(
        `Error sending credit limit reached email to ${user.email}:`,
        error.response?.body || error
      );
    }
  }
}

module.exports = EmailService;
