// routes/packageRoutes.js (Updated)
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

module.exports = (container) => {
  const router = express.Router();
  const packageController = container.resolve("packageController");

  // Public routes for participants
  router.get(
    "/participant/:packageId/:participantId",
    getPackageForParticipantValidation,
    validate,
    packageController.getPackageForParticipant.bind(packageController)
  );

  router.post(
    "/participant/:packageId/:participantId/send-otp",
    sendOtpValidation,
    validate,
    packageController.sendOTP.bind(packageController)
  );

  router.post(
    "/participant/:packageId/:participantId/verify-otp",
    verifyOtpValidation,
    validate,
    packageController.verifyOTP.bind(packageController)
  );

  router.post(
    "/participant/:packageId/:participantId/send-sms-otp",
    sendSmsOtpValidation,
    validate,
    packageController.sendSmsOTP.bind(packageController)
  );

  router.post(
    "/participant/:packageId/:participantId/verify-sms-otp",
    verifySmsOtpValidation,
    validate,
    packageController.verifySmsOTP.bind(packageController)
  );

  router.post(
    "/participant/:packageId/:participantId/submit-fields",
    submitFieldsValidation,
    validate,
    packageController.submitFields.bind(packageController)
  );

  router.post(
    "/participant/:packageId/:participantId/reject",
    rejectPackageValidation,
    validate,
    packageController.rejectPackage.bind(packageController)
  );

  router.post(
    "/participant/:packageId/:participantId/reassignment/register-contact",
    registerReassignmentContactValidation,
    validate,
    packageController.registerReassignmentContact.bind(packageController)
  );

  router.get(
    "/participant/:packageId/:participantId/reassignment/contacts",
    listReassignmentContactsValidation,
    validate,
    packageController.listReassignmentContacts.bind(packageController)
  );

  router.post(
    "/participant/:packageId/:participantId/reassignment/perform",
    performReassignmentValidation,
    validate,
    packageController.performReassignment.bind(packageController)
  );

  router.post(
    "/participant/:packageId/:participantId/add-receiver",
    addReceiverByParticipantValidation,
    validate,
    packageController.addReceiverByParticipant.bind(packageController)
  );

  // Public route for enhanced participant view with reassignment info
  router.get(
    "/participant/:packageId/:participantId/enhanced",
    getPackageForParticipantValidation,
    validate,
    packageController.getPackageForParticipantWithReassignment.bind(
      packageController
    )
  );

  // Public route to check reassignment eligibility
  router.get(
    "/participant/:packageId/:participantId/reassignment/eligibility",
    checkReassignmentEligibilityValidation,
    validate,
    packageController.checkReassignmentEligibility.bind(packageController)
  );

  router.get(
    "/participant/:packageId/:participantId/download",
    getPackageForParticipantValidation, // Use existing validation for params
    validate,
    packageController.downloadPackage.bind(packageController)
  );

  router.use(authenticateUser);

  router.post(
    "/upload",
    uploadPackage,
    packageController.uploadPackage.bind(packageController)
  );

  router
    .route("/")
    .post(
      requireActiveSubscription(container),
      createPackageValidation,
      validate,
      packageController.createPackage.bind(packageController)
    )
    .get(
      getPackagesValidation,
      validate,
      packageController.getPackages.bind(packageController)
    );
  router.get(
    "/:packageId/download",
    packageIdValidation, // Re-use the existing validator for the Mongo ID
    validate,
    packageController.downloadPackageForOwner.bind(packageController)
  );
  router.post(
    "/:packageId/reminder", // A POST request is appropriate for this action
    authenticateUser,
    manualReminderValidation,
    validate,
    packageController.sendManualReminder.bind(packageController)
  );
  router.patch(
    "/:packageId/revoke",
    revokePackageValidation,
    validate,
    packageController.revokePackage.bind(packageController)
  );
  router
    .route("/:packageId")
    .get(
      packageIdValidation,
      validate,
      packageController.getPackageById.bind(packageController)
    )
    .patch(
      updatePackageValidation,
      validate,
      packageController.updatePackage.bind(packageController)
    )
    .delete(
      packageIdValidation,
      validate,
      packageController.deletePackage.bind(packageController)
    );
  router.get(
    "/:packageId/reassignment-history",
    packageIdValidation,
    validate,
    packageController.getReassignmentHistory.bind(packageController)
  );

  return router;
};
