const express = require("express");

const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate"); // Middleware to check validation results
const {
  createContactValidation,
  updateContactValidation,
  contactIdValidation,
} = require("../validations/ContactValidations"); // Your new validation rules

module.exports = (container) => {
  const router = express.Router();
  const contactController = container.resolve("contactController");

  router.use(authenticateUser);

  // --- ROUTES WITH VALIDATION ADDED ---
  router
    .route("/")
    .post(
      createContactValidation, // 1. Apply creation rules
      validate, // 2. Check for errors
      contactController.createContact.bind(contactController) // 3. Proceed if valid
    )
    .get(contactController.getContacts.bind(contactController)); // GET has no body, so no validation needed

  router
    .route("/:contactId")
    .get(
      contactIdValidation, // 1. Validate the URL parameter
      validate,
      contactController.getContactById.bind(contactController)
    )
    .patch(
      contactIdValidation, // 1. Validate the URL parameter
      updateContactValidation, // 2. Apply flexible update rules for the body
      validate,
      contactController.updateContact.bind(contactController)
    )
    .delete(
      contactIdValidation, // 1. Validate the URL parameter
      validate,
      contactController.deleteContact.bind(contactController)
    );

  return router;
};
