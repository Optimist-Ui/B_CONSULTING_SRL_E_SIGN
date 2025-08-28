const axios = require("axios");

class SmsService {
  constructor() {
    if (!process.env.SPRYNG_API_TOKEN) {
      console.warn(
        "SMS Service: SPRYNG_API_TOKEN is not configured. SMS sending will be disabled."
      );
      this.enabled = false;
    } else {
      this.enabled = true;
      this.client = axios.create({
        baseURL: "https://rest.spryngsms.com/v1",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${process.env.SPRYNG_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
    }
  }

  /**
   * Validates phone number format
   * @param {string} phoneNumber
   * @returns {boolean}
   */
  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;

    // Basic validation: should have at least 7 digits, can start with +
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, "");
    return /^\+?[1-9]\d{6,14}$/.test(cleanNumber);
  }

  /**
   * Normalizes phone number for SMS sending
   * @param {string} phoneNumber
   * @returns {string}
   */
  normalizePhoneNumber(phoneNumber) {
    // Remove all non-numeric chars except +
    let normalized = phoneNumber.replace(/[^0-9+]/g, "");

    // If no country code and starts with 0, assume it needs country code
    // This is a basic implementation - you might want to add more sophisticated logic
    if (!normalized.startsWith("+") && normalized.startsWith("0")) {
      // Remove leading 0 and add default country code (adjust as needed)
      normalized = "+92" + normalized.substring(1); // Pakistan country code as example
    }

    return normalized;
  }

  /**
   * Sends an SMS using the Spryng API.
   * @param {string} phoneNumber The recipient's phone number.
   * @param {string} message The text message to send.
   */
  async sendSms(phoneNumber, message) {
    if (!this.enabled) {
      throw new Error(
        "SMS service is not enabled. Please configure SPRYNG_API_TOKEN."
      );
    }

    if (!phoneNumber) {
      throw new Error("Phone number is required.");
    }

    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error("Invalid phone number format.");
    }

    if (!message || message.trim().length === 0) {
      throw new Error("Message content is required.");
    }

    // Normalize and sanitize number
    const sanitizedNumber = this.normalizePhoneNumber(phoneNumber);

    const payload = {
      body: message.trim(),
      encoding: "auto",
      originator: "eSignFlow", // Change this to your registered originator name
      recipients: [sanitizedNumber],
      route: "4667", // As per your requirement
    };

    try {
      console.log(`Attempting to send SMS to: ${sanitizedNumber}`);
      const response = await this.client.post("/messages", payload);

      console.log(
        `Spryng SMS submitted successfully for phone number: ${sanitizedNumber}`
      );

      return {
        success: true,
        messageId: response.data.id || null,
        recipient: sanitizedNumber,
        message: "SMS sent successfully",
      };
    } catch (error) {
      let errorMsg = "Unknown SMS sending error";
      let statusCode = null;

      if (error.response) {
        statusCode = error.response.status;
        errorMsg =
          error.response.data?.message ||
          JSON.stringify(error.response.data) ||
          `HTTP ${statusCode} error`;
      } else if (error.request) {
        errorMsg = "No response from SMS service";
      } else {
        errorMsg = error.message;
      }

      console.error(
        `Spryng SMS failed for ${sanitizedNumber}. Status: ${statusCode}. Error: ${errorMsg}`
      );

      // Throw a more user-friendly error
      if (statusCode === 401) {
        throw new Error(
          "SMS service authentication failed. Please check your API token."
        );
      } else if (statusCode === 400) {
        throw new Error(
          "Invalid SMS request. Please check the phone number format."
        );
      } else if (statusCode === 429) {
        throw new Error("SMS rate limit exceeded. Please try again later.");
      } else if (statusCode >= 500) {
        throw new Error(
          "SMS service is temporarily unavailable. Please try again later."
        );
      } else {
        throw new Error(`SMS sending failed: ${errorMsg}`);
      }
    }
  }

  /**
   * Sends a signature OTP SMS with a standardized format
   * @param {string} phoneNumber
   * @param {string} recipientName
   * @param {string} documentName
   * @param {string} otp
   */
  async sendSignatureOtp(phoneNumber, recipientName, documentName, otp) {
    const message = `Hi ${recipientName}, your signature OTP for document "${documentName}" is: ${otp}. Valid for 1 minute. Do not share this code.`;

    return await this.sendSms(phoneNumber, message);
  }
}

module.exports = SmsService;
