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
  async sendPasswordResetSuccessEmail(user, resetPasswordUrl) {
    const loginUrl = `${process.env.CLIENT_URL}/login`;

    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_PASSWORD_RESET_SUCCESS,
      dynamic_template_data: {
        name: user.firstName,
        login_link: loginUrl,
        forgot_password_link: resetPasswordUrl, // Direct reset link passed from UserService
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
    actionUrl,
    customMessage
  ) {
    console.log(customMessage);
    const msg = {
      to: recipient.contactEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_ALLPARTIES_NOTIFICATION,
      dynamic_template_data: {
        recipient_name: recipient.contactName,
        sender_name: senderName,
        package_name: packageDetails.name,
        action_link: actionUrl,
        custom_message: customMessage,
        has_custom_message: !!customMessage,
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

  /**
   * Notifies a NEWLY ADDED RECEIVER that they have been given access to a document by another participant.
   * Corresponds to SENDGRID_NEW_RECEIVER_NOTIFICATION.
   * @param {string} recipientEmail - The new receiver's email.
   * @param {string} recipientName - The new receiver's name.
   * @param {string} senderName - The name of the original document initiator.
   * @param {string} addedByName - The name of the participant who added them.
   * @param {string} packageName - The name of the document.
   * @param {string} actionUrl - The direct URL for the new receiver to view the document.
   */
  async sendNewReceiverNotification(
    recipientEmail,
    recipientName,
    senderName,
    addedByName,
    packageName,
    actionUrl
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_NEW_RECEIVER_NOTIFICATION, // You will need to create this template in SendGrid
      dynamic_template_data: {
        recipient_name: recipientName,
        sender_name: senderName,
        package_name: packageName,
        added_by_name: addedByName,
        action_link: actionUrl,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(`New receiver notification sent to: ${recipientEmail}`);
    } catch (error) {
      console.error(
        `Error sending new receiver notification to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Notifies the document OWNER that a participant has added a new receiver.
   * Corresponds to SENDGRID_NEW_RECEIVER_OWNER_NOTIFICATION.
   * @param {string} recipientEmail - The owner's email.
   * @param {string} ownerName - The owner's name.
   * @param {string} newReceiverName - The name of the new receiver who was added.
   * @param {string} addedByName - The name of the participant who added the new receiver.
   * @param {string} packageName - The name of the document.
   */
  async sendNewReceiverOwnerNotification(
    recipientEmail,
    ownerName,
    newReceiverName,
    addedByName,
    packageName
  ) {
    const documentLink = `${process.env.CLIENT_URL}/dashboard`; // A general link for the owner
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_NEW_RECEIVER_OWNER_NOTIFICATION, // You will need to create this template in SendGrid
      dynamic_template_data: {
        initiator_name: ownerName,
        package_name: packageName,
        new_receiver_name: newReceiverName,
        added_by_name: addedByName,
        document_link: documentLink,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `'Receiver Added' owner notification sent to: ${recipientEmail}`
      );
    } catch (error) {
      console.error(
        `Error sending 'Receiver Added' owner notification to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a confirmation email when a user's subscription is successfully activated.
   * @param {string} recipientEmail - The user's email.
   * @param {string} userName - The user's first name.
   * @param {string} planName - The name of the subscribed plan (e.g., "Pro").
   * @param {number} amount - The amount charged (e.g., 19.99).
   * @param {string} renewalDate - The date the subscription will renew.
   * @param {string} invoiceUrl - The direct URL to the Stripe invoice.
   */
  async sendSubscriptionConfirmation(
    recipientEmail,
    userName,
    planName,
    amount,
    renewalDate,
    invoiceUrl
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_SUBSCRIPTION_SUCCESS_TEMPLATE_ID, // Add this to your .env
      dynamic_template_data: {
        user_name: userName,
        plan_name: planName,
        plan_price: `$${amount}`,
        renewal_date: renewalDate,
        invoice_link: invoiceUrl,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`, // A link to your new billing page
      },
    };
    try {
      await sgMail.send(msg);
      console.log(`Subscription confirmation sent to: ${recipientEmail}`);
    } catch (error) {
      console.error(
        `Error sending subscription confirmation to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an email confirming that auto-renewal has been turned off.
   * @param {string} recipientEmail - The user's email.
   * @param {string} userName - The user's first name.
   * @param {string} planName - The name of the plan being cancelled.
   * @param {string} expiryDate - The date the subscription will expire.
   */
  async sendCancellationConfirmation(
    recipientEmail,
    userName,
    planName,
    expiryDate
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      // ❗ ACTION: Add this new template ID to your .env file
      templateId: process.env.SENDGRID_SUBSCRIPTION_CANCEL_TEMPLATE_ID,
      dynamic_template_data: {
        user_name: userName,
        plan_name: planName,
        expiry_date: expiryDate,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Subscription cancellation confirmation sent to: ${recipientEmail}`
      );
    } catch (error) {
      console.error(
        `Error sending cancellation confirmation to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an email confirming that auto-renewal has been turned back on.
   * @param {string} recipientEmail - The user's email.
   * @param {string} userName - The user's first name.
   * @param {string} planName - The name of the reactivated plan.
   * @param {string} renewalDate - The next renewal date.
   */
  async sendReactivationConfirmation(
    recipientEmail,
    userName,
    planName,
    renewalDate
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      // ❗ ACTION: Add this new template ID to your .env file
      templateId: process.env.SENDGRID_SUBSCRIPTION_REACTIVATE_TEMPLATE_ID,
      dynamic_template_data: {
        user_name: userName,
        plan_name: planName,
        renewal_date: renewalDate,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Subscription reactivation confirmation sent to: ${recipientEmail}`
      );
    } catch (error) {
      console.error(
        `Error sending reactivation confirmation to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an email confirming that a free trial has been activated.
   * @param {string} recipientEmail - The user's email.
   * @param {string} userName - The user's first name.
   * @param {string} planName - The name of the trial plan.
   * @param {string} trialEndDate - When the trial expires.
   * @param {number} documentLimit - Number of documents they can create during trial.
   */
  async sendTrialActivationEmail(
    recipientEmail,
    userName,
    planName,
    trialEndDate,
    documentLimit
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      // ❗ ACTION: Add this template ID to your .env file
      templateId: process.env.SENDGRID_TRIAL_ACTIVATION_TEMPLATE_ID,
      dynamic_template_data: {
        user_name: userName,
        plan_name: planName,
        trial_end_date: trialEndDate,
        document_limit: documentLimit,
        dashboard_link: `${process.env.CLIENT_URL}/dashboard`,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(`Trial activation email sent to: ${recipientEmail}`);
    } catch (error) {
      console.error(
        `Error sending trial activation email to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an email confirming that the trial has ended and the subscription is now active.
   * @param {string} recipientEmail - The user's email.
   * @param {string} userName - The user's first name.
   * @param {string} planName - The name of the now-active plan.
   * @param {string} firstBillingDate - When they were first charged.
   * @param {string} nextBillingDate - When the next charge will occur.
   * @param {string} amount - The amount charged.
   * @param {string} invoiceUrl - Link to the Stripe invoice.
   */
  async sendTrialToActiveTransitionEmail(
    recipientEmail,
    userName,
    planName,
    firstBillingDate,
    nextBillingDate,
    amount,
    invoiceUrl
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      // ❗ ACTION: Add this template ID to your .env file
      templateId: process.env.SENDGRID_TRIAL_TO_ACTIVE_TEMPLATE_ID,
      dynamic_template_data: {
        user_name: userName,
        plan_name: planName,
        first_billing_date: firstBillingDate,
        next_billing_date: nextBillingDate,
        amount: amount,
        invoice_url: invoiceUrl,
        billing_portal_link: `${process.env.CLIENT_URL}/subscriptions`,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(
        `Trial to active transition email sent to: ${recipientEmail}`
      );
    } catch (error) {
      console.error(
        `Error sending trial to active transition email to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an email to a participant inviting them to review a completed package.
   * @param {string} recipientEmail - The participant's email.
   * @param {string} participantName - The participant's name.
   * @param {string} packageName - The name of the package.
   * @param {string} reviewLink - The direct URL to leave a review.
   */
  async sendRequestForReviewEmail(
    recipientEmail,
    participantName,
    packageName,
    reviewLink
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      // ❗ ACTION: Create this template and add its ID to your .env file
      templateId: process.env.SENDGRID_REVIEW_REQUEST_TEMPLATE_ID,
      dynamic_template_data: {
        participant_name: participantName,
        package_name: packageName,
        review_link: reviewLink,
      },
    };
    try {
      await sgMail.send(msg);
      console.log(`Review request email sent to: ${recipientEmail}`);
    } catch (error) {
      console.error(
        `Error sending review request email to ${recipientEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a "Thank you, your feedback helps us improve" email for low ratings.
   * @param {string} recipientEmail - The reviewer's email.
   * @param {string} reviewerName - The reviewer's name.
   */
  async sendReviewImprovementEmail(recipientEmail, reviewerName) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      // ❗ ACTION: Create this template and add its ID to your .env file
      templateId: process.env.SENDGRID_REVIEW_IMPROVEMENT_TEMPLATE_ID,
      dynamic_template_data: {
        reviewer_name: reviewerName,
      },
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error(
        "Error sending review improvement email:",
        error.response?.body || error
      );
    }
  }

  /**
   * Sends an appreciation email for positive feedback.
   * @param {string} recipientEmail - The reviewer's email.
   * @param {string} reviewerName - The reviewer's name.
   */
  async sendReviewAppreciationEmail(recipientEmail, reviewerName) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      // ❗ ACTION: Create this template and add its ID to your .env file
      templateId: process.env.SENDGRID_REVIEW_APPRECIATION_TEMPLATE_ID,
      dynamic_template_data: {
        reviewer_name: reviewerName,
      },
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error(
        "Error sending review appreciation email:",
        error.response?.body || error
      );
    }
  }

  /**
   * Sends a notification to the initiator about a participant's action.
   */
  async sendParticipantActionNotification(
    recipientEmail,
    initiatorName,
    packageName,
    actorName,
    completedListHtml,
    pendingListHtml,
    actionLink
  ) {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_PARTICIPANT_ACTION_TEMPLATE_ID,
      dynamic_template_data: {
        initiator_name: initiatorName,
        package_name: packageName,
        actor_name: actorName,
        completed_list: completedListHtml, // Pass the generated HTML list
        pending_list: pendingListHtml, // Pass the generated HTML list
        action_link: actionLink,
      },
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error(
        "Error sending participant action notification email:",
        error.response?.body || error
      );
    }
  }

  /**
   * NEW: Sends final completion notification to the INITIATOR with dashboard link.
   * @param {string} initiatorEmail - The initiator's email
   * @param {string} initiatorName - The initiator's name
   * @param {string} packageName - The package name
   * @param {string} dashboardLink - Link to the dashboard
   */
  async sendInitiatorCompletionNotification(
    initiatorEmail,
    initiatorName,
    packageName,
    dashboardLink
  ) {
    const msg = {
      to: initiatorEmail,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_INITIATOR_COMPLETION_NOTIFICATION,
      dynamic_template_data: {
        initiator_name: initiatorName,
        package_name: packageName,
        dashboard_link: dashboardLink,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(
        `Completion notification sent to initiator ${initiatorEmail} for package: ${packageName}`
      );
    } catch (error) {
      console.error(
        `Error sending completion notification to ${initiatorEmail}:`,
        error.response?.body || error
      );
    }
  }

  /**
   * Sends account deactivation confirmation email with reactivation link.
   */
  async sendDeactivationEmail(user, reactivationUrl) {
    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_DEACTIVATION_TEMPLATE_ID, // Add this to .env
      dynamic_template_data: {
        name: `${user.firstName} ${user.lastName}`,
        reactivation_link: reactivationUrl,
        grace_period_days: 14,
      },
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error(
        "Error sending deactivation email:",
        error.response?.body || error
      );
    }
  }

  /**
   * Sends account reactivation confirmation email.
   */
  async sendReactivationConfirmationEmail(user) {
    const msg = {
      to: user.email,
      from: this.fromEmail,
      templateId: process.env.SENDGRID_REACTIVATION_CONFIRM_TEMPLATE_ID, // Optional new template
      dynamic_template_data: {
        name: `${user.firstName} ${user.lastName}`,
        login_link: `${process.env.CLIENT_URL}/login`,
      },
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error(
        "Error sending reactivation confirmation email:",
        error.response?.body || error
      );
    }
  }
}

module.exports = EmailService;
