const { successResponse, errorResponse } = require("../utils/responseHandler");

class PackageController {
  constructor({ packageService, userService }) {
    this.packageService = packageService;
    this.userService = userService;
  }

  async uploadPackage(req, res) {
    try {
      const userId = req.user.id;
      const { attachment_uuid, fileUrl } = req;
      const packageData = await this.packageService.uploadPackage(userId, {
        attachment_uuid,
        fileUrl,
      });
      successResponse(
        res,
        packageData,
        "Package file uploaded successfully",
        201
      );
    } catch (error) {
      errorResponse(res, error, "Failed to upload package file");
    }
  }

  async createPackage(req, res) {
    try {
      const userId = req.user.id;
      const user = req.userWithSubscription;
      const packageData = await this.packageService.createPackage(
        userId,
        req.body
      );

      if (user.subscription.planId.documentLimit !== -1) {
        const newCount = user.documentsCreatedThisMonth + 1;
        await this.userService.updateUser(user.id, {
          documentsCreatedThisMonth: newCount,
        });
      }

      successResponse(res, packageData, "Package created successfully", 201);
    } catch (error) {
      errorResponse(res, error, "Failed to create package");
    }
  }

  async getPackages(req, res) {
    try {
      const userId = req.user.id;

      // Extract validated query parameters with defaults
      const filters = {
        name: req.query.name || "",
        status: req.query.status || "All",
      };
      const pagination = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
      };
      const sort = {
        sortKey: req.query.sortKey || "addedOn",
        sortDirection: req.query.sortDirection || "desc",
      };

      const result = await this.packageService.getPackages(
        userId,
        filters,
        pagination,
        sort
      );

      successResponse(res, result, "Packages fetched successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch packages");
    }
  }

  async getPackageById(req, res) {
    try {
      const userId = req.user.id;
      const { packageId } = req.params;
      const packageData = await this.packageService.getPackageById(
        userId,
        packageId
      );
      successResponse(res, packageData, "Package fetched successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch package");
    }
  }

  async updatePackage(req, res) {
    try {
      const userId = req.user.id;
      const { packageId } = req.params;
      const packageData = await this.packageService.updatePackage(
        userId,
        packageId,
        req.body
      );
      successResponse(res, packageData, "Package updated successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to update package");
    }
  }

  async deletePackage(req, res) {
    try {
      const userId = req.user.id;
      const { packageId } = req.params;
      const result = await this.packageService.deletePackage(userId, packageId);
      successResponse(res, result, result.message);
    } catch (error) {
      errorResponse(res, error, "Failed to delete package");
    }
  }

  async getPackageForParticipant(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const packageData = await this.packageService.getPackageForParticipant(
        packageId,
        participantId
      );
      successResponse(
        res,
        packageData,
        "Package data fetched successfully for participant"
      );
    } catch (error) {
      errorResponse(res, error, "Failed to fetch package for participant");
    }
  }

  async sendOTP(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const { fieldId, email } = req.body;
      const result = await this.packageService.sendOTP(
        packageId,
        participantId,
        fieldId,
        email
      );
      successResponse(res, result, "OTP sent successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to send OTP");
    }
  }

  async verifyOTP(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const { fieldId, otp } = req.body;
      const ip = req.ip; // For audit
      const result = await this.packageService.verifyOTP(
        packageId,
        participantId,
        fieldId,
        otp,
        ip
      );
      successResponse(res, result, "Signature completed successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to verify OTP");
    }
  }

  // SMS OTP Methods (new)
  async sendSmsOTP(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const { fieldId, phone } = req.body;

      const result = await this.packageService.sendSmsOTP(
        packageId,
        participantId,
        fieldId,
        phone
      );
      successResponse(res, result, "SMS OTP sent successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to send SMS OTP");
    }
  }

  async verifySmsOTP(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const { fieldId, otp } = req.body;
      const ip = req.ip;

      const result = await this.packageService.verifySmsOTP(
        packageId,
        participantId,
        fieldId,
        otp,
        ip
      );
      successResponse(res, result, "SMS OTP signature completed successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to verify SMS OTP");
    }
  }

  async submitFields(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const { fieldValues } = req.body;
      const ip = req.ip; // For the audit trail

      const result = await this.packageService.submitFields(
        packageId,
        participantId,
        fieldValues,
        ip
      );

      successResponse(
        res,
        result,
        "Your responses have been submitted successfully"
      );
    } catch (error) {
      errorResponse(res, error, "Failed to submit your responses");
    }
  }

  async rejectPackage(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const { reason } = req.body;
      const ip = req.ip;

      const result = await this.packageService.rejectPackage(
        packageId,
        participantId,
        reason,
        ip
      );

      successResponse(res, result, "Package rejected successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to reject package");
    }
  }

  /**
   * Register a new contact that can be used for reassignment
   * This contact will belong to the package owner (initiator)
   */
  async registerReassignmentContact(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const contactData = req.body;
      const ip = req.ip;

      const result = await this.packageService.registerReassignmentContact(
        packageId,
        participantId,
        contactData,
        ip
      );

      successResponse(
        res,
        result,
        "Reassignment contact registered successfully",
        201
      );
    } catch (error) {
      errorResponse(res, error, "Failed to register reassignment contact");
    }
  }

  /**
   * List all contacts that can be used for reassignment by the current participant
   */
  async listReassignmentContacts(req, res) {
    try {
      const { packageId, participantId } = req.params;

      const contacts = await this.packageService.listReassignmentContacts(
        packageId,
        participantId
      );

      successResponse(
        res,
        contacts,
        "Reassignment contacts fetched successfully"
      );
    } catch (error) {
      errorResponse(res, error, "Failed to fetch reassignment contacts");
    }
  }

  /**
   * Perform the actual reassignment of fields from one contact to another
   */
  async performReassignment(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const { newContactId, reason } = req.body;
      const ip = req.ip;

      const result = await this.packageService.performReassignment(
        packageId,
        participantId,
        newContactId,
        reason,
        ip
      );

      successResponse(res, result, "Reassignment completed successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to perform reassignment");
    }
  }
  /**
   * Enhanced Get Package method that includes reassignment eligibility info.
   */
  async getPackageForParticipantWithReassignment(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const packageData =
        await this.packageService.getPackageForParticipantWithReassignmentInfo(
          packageId,
          participantId
        );
      successResponse(
        res,
        packageData,
        "Enhanced package data fetched successfully for participant"
      );
    } catch (error) {
      errorResponse(
        res,
        error,
        "Failed to fetch enhanced package data for participant"
      );
    }
  }

  /**
   * Checks if a participant is eligible to perform a reassignment.
   */
  async checkReassignmentEligibility(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const pkg = await this.packageService.Package.findById(packageId); // Need a quick way to get the package
      if (!pkg) throw new Error("Package not found.");

      const result = this.packageService.canParticipantReassign(
        pkg,
        participantId
      );
      successResponse(
        res,
        result,
        "Reassignment eligibility checked successfully"
      );
    } catch (error) {
      errorResponse(res, error, "Failed to check reassignment eligibility");
    }
  }

  /**
   * Retrieves the reassignment history for a specific package (owner-only).
   */
  async getReassignmentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { packageId } = req.params;
      const history = await this.packageService.getReassignmentHistory(
        userId,
        packageId
      );
      successResponse(
        res,
        history,
        "Reassignment history fetched successfully"
      );
    } catch (error) {
      errorResponse(res, error, "Failed to fetch reassignment history");
    }
  }
  async downloadPackage(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const { pdfBuffer, fileName } =
        await this.packageService.downloadPackageForParticipant(
          packageId,
          participantId
        );

      // Set headers for file download
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfBuffer);
    } catch (error) {
      // Send a JSON error if something goes wrong
      errorResponse(res, error, "Failed to download package");
    }
  }

  async downloadPackageForOwner(req, res) {
    try {
      const { packageId } = req.params;
      const userId = req.user.id; // From the authenticateUser middleware

      // ✅ Call the *same service method* as the participant, but pass the owner's ID
      const { pdfBuffer, fileName } =
        await this.packageService.downloadPackageForParticipant(
          packageId,
          userId // Pass userId as the identifier
        );

      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfBuffer);
    } catch (error) {
      errorResponse(res, error, "Failed to download package.");
    }
  }

  async revokePackage(req, res) {
    try {
      const userId = req.user.id; // From authenticate middleware
      const { packageId } = req.params;
      const { reason } = req.body;
      const ip = req.ip;

      const updatedPackage = await this.packageService.revokePackage(
        packageId,
        userId,
        reason,
        ip
      );

      successResponse(
        res,
        { id: updatedPackage._id, status: updatedPackage.status },
        "Package has been successfully revoked."
      );
    } catch (error) {
      errorResponse(res, error, "Failed to revoke the package.");
    }
  }

  async sendManualReminder(req, res) {
    try {
      const userId = req.user.id;
      const { packageId } = req.params;

      const result = await this.packageService.sendManualReminder(
        packageId,
        userId
      );

      successResponse(res, result, result.message);
    } catch (error) {
      errorResponse(res, error, "Failed to send reminders.");
    }
  }

  async addReceiverByParticipant(req, res) {
    try {
      const { packageId, participantId } = req.params;
      const { newContactId } = req.body;
      const ip = req.ip;

      const result = await this.packageService.addReceiverByParticipant(
        packageId,
        participantId,
        newContactId,
        ip
      );

      successResponse(res, result, "New receiver added successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to add new receiver");
    }
  }
}

module.exports = PackageController;
