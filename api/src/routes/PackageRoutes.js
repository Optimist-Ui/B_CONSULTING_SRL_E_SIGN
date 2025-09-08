const express = require("express");
const authenticateUser = require("../middlewares/authenticate");
const requireActiveSubscription = require("../middlewares/requireActiveSubscription");
const validate = require("../middlewares/validate");
const {
  createPackageValidation,
  updatePackageValidation,
  packageIdValidation,
  getPackageForParticipantValidation,
  sendOtpValidation,
  verifyOtpValidation,
  submitFieldsValidation,
  rejectPackageValidation,
  registerReassignmentContactValidation,
  listReassignmentContactsValidation,
  performReassignmentValidation,
  checkReassignmentEligibilityValidation,
  getPackagesValidation,
  revokePackageValidation,
  manualReminderValidation,
  sendSmsOtpValidation,
  verifySmsOtpValidation,
  addReceiverByParticipantValidation,
} = require("../validations/PackageValidations");
const { uploadPackage } = require("../middlewares/upload");

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: The core API for managing and interacting with e-signature packages.
 */
module.exports = (container) => {
  const router = express.Router();
  const packageController = container.resolve("packageController");

  // --- PUBLIC ROUTES FOR PARTICIPANTS ---

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}:
   *   get:
   *     tags: [Packages]
   *     summary: Get package data for a participant (Standard View)
   *     description: A public endpoint for a participant to view a package's details.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}, description: "The Package ID"}
   *       - {in: path, name: participantId, required: true, schema: {type: string}, description: "The participant's unique assignment ID"}
   *     responses:
   *       '200':
   *         description: Package data visible to the participant.
   *         content: {"application/json": {schema: {$ref: '#/components/schemas/Package'}}}
   *       '403':
   *         description: The participant does not have access to this package.
   *       '404':
   *         description: The package or participant was not found.
   */
  router.get(
    "/participant/:packageId/:participantId",
    getPackageForParticipantValidation,
    validate,
    packageController.getPackageForParticipant.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/send-otp:
   *   post:
   *     tags: [Packages]
   *     summary: Send Email OTP for a signature field
   *     description: Generates and sends a 6-digit One-Time Password to a participant's email for verification.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     requestBody:
   *       required: true
   *       content: {"application/json": {schema: {$ref: '#/components/schemas/SendOtpInput'}}}
   *     responses:
   *       '200':
   *         description: OTP sent successfully.
   *       '400':
   *         description: Validation error or OTP could not be sent.
   */
  router.post(
    "/participant/:packageId/:participantId/send-otp",
    sendOtpValidation,
    validate,
    packageController.sendOTP.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/verify-otp:
   *   post:
   *     tags: [Packages]
   *     summary: Verify Email OTP for a signature field
   *     description: Checks if the provided OTP is valid for the specified participant and field.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     requestBody:
   *       required: true
   *       content: {"application/json": {schema: {$ref: '#/components/schemas/VerifyOtpInput'}}}
   *     responses:
   *       '200':
   *         description: OTP verification result.
   *         content: {"application/json": {schema: {type: object, properties: {verified: {type: "boolean", example: true}}}}}
   *       '400':
   *         description: Invalid OTP, expired, or validation error.
   */
  router.post(
    "/participant/:packageId/:participantId/verify-otp",
    verifyOtpValidation,
    validate,
    packageController.verifyOTP.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/send-sms-otp:
   *   post:
   *     tags: [Packages]
   *     summary: Send SMS OTP for a signature field
   *     description: Generates and sends a 6-digit One-Time Password via SMS.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     requestBody:
   *       required: true
   *       content: {"application/json": {schema: {$ref: '#/components/schemas/SendSmsOtpInput'}}}
   *     responses:
   *       '200':
   *         description: SMS OTP sent successfully.
   */
  router.post(
    "/participant/:packageId/:participantId/send-sms-otp",
    sendSmsOtpValidation,
    validate,
    packageController.sendSmsOTP.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/verify-sms-otp:
   *   post:
   *     tags: [Packages]
   *     summary: Verify SMS OTP for a signature field
   *     description: Checks if the provided SMS OTP is valid.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     requestBody:
   *       required: true
   *       content: {"application/json": {schema: {$ref: '#/components/schemas/VerifyOtpInput'}}}
   *     responses:
   *       '200':
   *         description: OTP verification result.
   *         content: {"application/json": {schema: {type: object, properties: {verified: {type: "boolean"}}}}}
   *       '400':
   *         description: Invalid OTP.
   */
  router.post(
    "/participant/:packageId/:participantId/verify-sms-otp",
    verifySmsOtpValidation,
    validate,
    packageController.verifySmsOTP.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/submit-fields:
   *   post:
   *     tags: [Packages]
   *     summary: Submit field values for a participant
   *     description: A participant submits their data (text, signatures, checkboxes) for the fields assigned to them.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     requestBody:
   *       required: true
   *       content: {"application/json": {schema: {$ref: '#/components/schemas/SubmitFieldsInput'}}}
   *     responses:
   *       '200':
   *         description: Fields submitted successfully.
   *       '400':
   *         description: Validation error.
   *       '403':
   *         description: Participant has already completed their actions or the package is not in a submittable state.
   */
  router.post(
    "/participant/:packageId/:participantId/submit-fields",
    submitFieldsValidation,
    validate,
    packageController.submitFields.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/reject:
   *   post:
   *     tags: [Packages]
   *     summary: Reject a package
   *     description: A participant rejects the package, stopping the process for everyone. A reason is required.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     requestBody:
   *       required: true
   *       content: {"application/json": {schema: {$ref: '#/components/schemas/RejectPackageInput'}}}
   *     responses:
   *       '200':
   *         description: Package rejected successfully.
   *       '403':
   *         description: The package cannot be rejected in its current state.
   */
  router.post(
    "/participant/:packageId/:participantId/reject",
    rejectPackageValidation,
    validate,
    packageController.rejectPackage.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/reassignment/register-contact:
   *   post:
   *     tags: [Packages]
   *     summary: Register a new contact for reassignment
   *     description: Creates a new contact in the participant's list to be used for reassignment.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     requestBody:
   *       required: true
   *       content: {"application/json": {schema: {$ref: '#/components/schemas/ContactInput'}}}
   *     responses:
   *       '201':
   *         description: Contact registered successfully.
   *         content: {"application/json": {schema: {$ref: '#/components/schemas/Contact'}}}
   */
  router.post(
    "/participant/:packageId/:participantId/reassignment/register-contact",
    registerReassignmentContactValidation,
    validate,
    packageController.registerReassignmentContact.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/reassignment/contacts:
   *   get:
   *     tags: [Packages]
   *     summary: List contacts available for reassignment
   *     description: Retrieves the list of contacts the participant can reassign their tasks to.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     responses:
   *       '200':
   *         description: An array of available contacts.
   *         content: {"application/json": {schema: {type: 'array', items: {$ref: '#/components/schemas/Contact'}}}}
   */
  router.get(
    "/participant/:packageId/:participantId/reassignment/contacts",
    listReassignmentContactsValidation,
    validate,
    packageController.listReassignmentContacts.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/reassignment/perform:
   *   post:
   *     tags: [Packages]
   *     summary: Perform the reassignment
   *     description: Reassigns all of the current participant's fields to a new contact.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     requestBody:
   *       required: true
   *       content: {"application/json": {schema: {$ref: '#/components/schemas/PerformReassignmentInput'}}}
   *     responses:
   *       '200':
   *         description: Reassignment completed successfully.
   */
  router.post(
    "/participant/:packageId/:participantId/reassignment/perform",
    performReassignmentValidation,
    validate,
    packageController.performReassignment.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/add-receiver:
   *   post:
   *     tags: [Packages]
   *     summary: Add a new receiver to the package
   *     description: Allows a participant with permission to add another contact as a CC/receiver on the package.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     requestBody:
   *       required: true
   *       content: {"application/json": {schema: {type: 'object', properties: { newContactId: {type: 'string', format: 'ObjectId'}}}}}
   *     responses:
   *       '200':
   *         description: Receiver added successfully.
   */
  router.post(
    "/participant/:packageId/:participantId/add-receiver",
    addReceiverByParticipantValidation,
    validate,
    packageController.addReceiverByParticipant.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/enhanced:
   *   get:
   *     tags: [Packages]
   *     summary: Get package data (Enhanced Participant View)
   *     description: An enhanced public view for a participant, including details about reassignments.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     responses:
   *       '200':
   *         description: The package data visible to the participant.
   *         content: {"application/json": {schema: {$ref: '#/components/schemas/Package'}}}
   */
  router.get(
    "/participant/:packageId/:participantId/enhanced",
    getPackageForParticipantValidation,
    validate,
    packageController.getPackageForParticipantWithReassignment.bind(
      packageController
    )
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/reassignment/eligibility:
   *   get:
   *     tags: [Packages]
   *     summary: Check if a participant can reassign
   *     description: Checks if the participant is eligible to use the reassignment feature for this package.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     responses:
   *       '200':
   *         description: The participant's reassignment eligibility status.
   *         content: {"application/json": {schema: {$ref: '#/components/schemas/ReassignmentEligibility'}}}
   */
  router.get(
    "/participant/:packageId/:participantId/reassignment/eligibility",
    checkReassignmentEligibilityValidation,
    validate,
    packageController.checkReassignmentEligibility.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/participant/{packageId}/{participantId}/download:
   *   get:
   *     tags: [Packages]
   *     summary: Download package PDF for participant
   *     description: Allows a participant to download the package PDF, respecting the 'allowDownloadUnsigned' setting.
   *     security: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *       - {in: path, name: participantId, required: true, schema: {type: string}}
   *     responses:
   *       '200':
   *         description: The PDF file is streamed as a download.
   *         content: {"application/pdf": {schema: {type: "string", format: "binary"}}}
   *       '403':
   *         description: Downloading is not allowed for this package or its status.
   */
  router.get(
    "/participant/:packageId/:participantId/download",
    getPackageForParticipantValidation,
    validate,
    packageController.downloadPackage.bind(packageController)
  );

  // --- AUTHENTICATED ROUTES (FOR PACKAGE OWNERS) ---
  router.use(authenticateUser);

  /**
   * @swagger
   * /api/packages/upload:
   *   post:
   *     tags: [Packages]
   *     summary: Upload a package PDF
   *     description: Uploads a PDF file to be used in a new package.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               package: { type: string, format: binary, description: "The PDF file to upload." }
   *     responses:
   *       '200':
   *         description: File uploaded successfully.
   *         content: {"application/json": {schema: {$ref: '#/components/schemas/TemplateUploadResponse'}}}
   */
  router.post(
    "/upload",
    uploadPackage,
    packageController.uploadPackage.bind(packageController)
  );

  router
    .route("/")
    /**
     * @swagger
     * /api/packages:
     *   post:
     *     tags: [Packages]
     *     summary: Create a new package
     *     description: Creates a new package in 'Draft' or 'Sent' status. Requires an active subscription.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content: {"application/json": {schema: {$ref: '#/components/schemas/PackageInput'}}}
     *     responses:
     *       '201':
     *         description: Package created successfully.
     *         content: {"application/json": {schema: {$ref: '#/components/schemas/Package'}}}
     *       '402':
     *         description: Payment Required (No active subscription or document limit exceeded).
     */
    .post(
      requireActiveSubscription(container),
      createPackageValidation,
      validate,
      packageController.createPackage.bind(packageController)
    )
    /**
     * @swagger
     * /api/packages:
     *   get:
     *     tags: [Packages]
     *     summary: Get all user packages (paginated)
     *     description: Retrieves a filterable, sortable, and paginated list of all packages owned by the user.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - {in: query, name: status, schema: {type: string, enum: [All, Draft, Pending, Finished, Rejected, Expired, Revoked]}}
     *       - {in: query, name: name, schema: {type: string}}
     *       - {in: query, name: page, schema: {type: integer, default: 1}}
     *       - {in: query, name: limit, schema: {type: integer, default: 10}}
     *       - {in: query, name: sortKey, schema: {type: string, enum: [name, status, addedOn]}}
     *       - {in: query, name: sortDirection, schema: {type: string, enum: [asc, desc]}}
     *     responses:
     *       '200':
     *         description: A paginated list of packages.
     *         content: {"application/json": {schema: {type: "object", properties: { packages: { type: "array", items: {$ref: '#/components/schemas/Package'}}, total: {type: "integer"}, page: {type: "integer"}, pages: {type: "integer"}}}}}
     */
    .get(
      getPackagesValidation,
      validate,
      packageController.getPackages.bind(packageController)
    );

  /**
   * @swagger
   * /api/packages/{packageId}/download:
   *   get:
   *     tags: [Packages]
   *     summary: Download package PDF for owner
   *     description: Allows the authenticated owner to download their package PDF at any stage.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *     responses:
   *       '200':
   *         description: The PDF file stream.
   *         content: {"application/pdf": {schema: {type: "string", format: "binary"}}}
   */
  router.get(
    "/:packageId/download",
    packageIdValidation,
    validate,
    packageController.downloadPackageForOwner.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/{packageId}/reminder:
   *   post:
   *     tags: [Packages]
   *     summary: Send a manual reminder
   *     description: Manually sends a reminder email to all participants who have not yet completed their actions.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *     responses:
   *       '200':
   *         description: Reminder sent successfully.
   *       '403':
   *         description: Package is not in a state where reminders can be sent.
   */
  router.post(
    "/:packageId/reminder",
    authenticateUser,
    manualReminderValidation,
    validate,
    packageController.sendManualReminder.bind(packageController)
  );

  /**
   * @swagger
   * /api/packages/{packageId}/revoke:
   *   patch:
   *     tags: [Packages]
   *     summary: Revoke a sent package
   *     description: Voids a sent package, preventing any further participant interaction.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *     requestBody:
   *       content: {"application/json": {schema: {$ref: '#/components/schemas/RevokePackageInput'}}}
   *     responses:
   *       '200':
   *         description: Package revoked.
   *         content: {"application/json": {schema: {$ref: '#/components/schemas/Package'}}}
   *       '403':
   *         description: Package is not in a revokable state.
   */
  router.patch(
    "/:packageId/revoke",
    revokePackageValidation,
    validate,
    packageController.revokePackage.bind(packageController)
  );

  router
    .route("/:packageId")
    /**
     * @swagger
     * /api/packages/{packageId}:
     *   get:
     *     tags: [Packages]
     *     summary: Get a single package by ID
     *     description: Retrieves the full details of a package for its owner.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - {in: path, name: packageId, required: true, schema: {type: string}}
     *     responses:
     *       '200':
     *         description: Full package object.
     *         content: {"application/json": {schema: {$ref: '#/components/schemas/Package'}}}
     */
    .get(
      packageIdValidation,
      validate,
      packageController.getPackageById.bind(packageController)
    )
    /**
     * @swagger
     * /api/packages/{packageId}:
     *   patch:
     *     tags: [Packages]
     *     summary: Update a package
     *     description: Updates the properties of a package. Used for saving drafts or sending a prepared package.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - {in: path, name: packageId, required: true, schema: {type: string}}
     *     requestBody:
     *       required: true
     *       content: {"application/json": {schema: {$ref: '#/components/schemas/UpdatePackageInput'}}}
     *     responses:
     *       '200':
     *         description: The updated package object.
     *         content: {"application/json": {schema: {$ref: '#/components/schemas/Package'}}}
     *       '403':
     *         description: Package is not in an editable state.
     */
    .patch(
      updatePackageValidation,
      validate,
      packageController.updatePackage.bind(packageController)
    )
    /**
     * @swagger
     * /api/packages/{packageId}:
     *   delete:
     *     tags: [Packages]
     *     summary: Delete a package
     *     description: Permanently deletes a package, typically only if it's in a 'Draft' state.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - {in: path, name: packageId, required: true, schema: {type: string}}
     *     responses:
     *       '204':
     *         description: No Content - Package successfully deleted.
     *       '403':
     *         description: Package cannot be deleted in its current state.
     */
    .delete(
      packageIdValidation,
      validate,
      packageController.deletePackage.bind(packageController)
    );

  /**
   * @swagger
   * /api/packages/{packageId}/reassignment-history:
   *   get:
   *     tags: [Packages]
   *     summary: Get reassignment history for a package
   *     description: Retrieves an audit trail of all reassignment actions that have occurred on a package.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - {in: path, name: packageId, required: true, schema: {type: string}}
   *     responses:
   *       '200':
   *         description: A list of reassignment history events.
   *         content: {"application/json": {schema: {type: "array", items: {type: "object"}}}} # A detailed schema could be added here
   */
  router.get(
    "/:packageId/reassignment-history",
    packageIdValidation,
    validate,
    packageController.getReassignmentHistory.bind(packageController)
  );

  return router;
};
