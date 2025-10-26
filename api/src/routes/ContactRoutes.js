const express = require("express");

const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const {
  createContactValidation,
  updateContactValidation,
  contactIdValidation,
  submitContactFormValidation,
} = require("../validations/ContactValidations");

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: API endpoints for managing user contacts. All endpoints require authentication.
 */

module.exports = (container) => {
  const router = express.Router();
  const contactController = container.resolve("contactController");

  /**
   * @swagger
   * /api/contacts/enterprise-inquiry:
   *   post:
   *     tags: [Contact]
   *     summary: Submit enterprise contact form
   *     description: Sends enterprise inquiry details to admin via email
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, company, message]
   *             properties:
   *               name: {type: string, example: "John Doe"}
   *               email: {type: string, example: "john.doe@company.com"}
   *               company: {type: string, example: "Acme Corporation"}
   *               phone: {type: string, example: "+1 (123) 456-7890"}
   *               message: {type: string, example: "We need custom enterprise features..."}
   *     responses:
   *       '200':
   *         description: Contact form submitted successfully
   *       '400':
   *         description: Validation error
   *       '500':
   *         description: Failed to submit inquiry
   */
  router.post(
    "/enterprise-inquiry",
    submitContactFormValidation,
    validate,
    contactController.submitEnterpriseInquiry.bind(contactController)
  );

  // This middleware ensures all routes in this file are protected.
  router.use(authenticateUser);

  // --- DOCUMENTATION ADDED FOR ROUTES ---
  router
    .route("/")
    /**
     * @swagger
     * /api/contacts:
     *   post:
     *     tags: [Contacts]
     *     summary: Create a new contact
     *     description: Adds a new contact to the authenticated user's contact list.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ContactInput'
     *     responses:
     *       '201':
     *         description: Contact created successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Contact'
     *       '400':
     *         description: Bad Request - Validation error (e.g., missing required fields).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       '401':
     *         description: Unauthorized - JWT token is missing or invalid.
     *       '409':
     *         description: Conflict - A contact with this email already exists for the user.
     */
    .post(
      createContactValidation,
      validate,
      contactController.createContact.bind(contactController)
    )
    /**
     * @swagger
     * /api/contacts:
     *   get:
     *     tags: [Contacts]
     *     summary: Retrieve all contacts for the user
     *     description: Returns a list of all contacts associated with the authenticated user.
     *     responses:
     *       '200':
     *         description: A list of the user's contacts.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Contact'
     *       '401':
     *         description: Unauthorized - JWT token is missing or invalid.
     */
    .get(contactController.getContacts.bind(contactController));

  router
    .route("/:contactId")
    /**
     * @swagger
     * /api/contacts/{contactId}:
     *   get:
     *     tags: [Contacts]
     *     summary: Get a specific contact by ID
     *     description: Retrieves the details of a single contact by its unique ID.
     *     parameters:
     *       - in: path
     *         name: contactId
     *         required: true
     *         schema:
     *           type: string
     *         description: The MongoDB ObjectId of the contact.
     *     responses:
     *       '200':
     *         description: The requested contact object.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Contact'
     *       '401':
     *         description: Unauthorized.
     *       '404':
     *         description: Contact not found.
     */
    .get(
      contactIdValidation,
      validate,
      contactController.getContactById.bind(contactController)
    )
    /**
     * @swagger
     * /api/contacts/{contactId}:
     *   patch:
     *     tags: [Contacts]
     *     summary: Update a contact
     *     description: Updates one or more fields of an existing contact.
     *     parameters:
     *       - in: path
     *         name: contactId
     *         required: true
     *         schema:
     *           type: string
     *         description: The MongoDB ObjectId of the contact to update.
     *     requestBody:
     *       description: An object with the fields to update. At least one field is required.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ContactInput'
     *     responses:
     *       '200':
     *         description: The updated contact object.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Contact'
     *       '400':
     *         description: Bad Request - Validation error.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       '401':
     *         description: Unauthorized.
     *       '404':
     *         description: Contact not found.
     */
    .patch(
      contactIdValidation,
      updateContactValidation,
      validate,
      contactController.updateContact.bind(contactController)
    )
    /**
     * @swagger
     * /api/contacts/{contactId}:
     *   delete:
     *     tags: [Contacts]
     *     summary: Delete a contact
     *     description: Permanently removes a contact from the user's list.
     *     parameters:
     *       - in: path
     *         name: contactId
     *         required: true
     *         schema:
     *           type: string
     *         description: The MongoDB ObjectId of the contact to delete.
     *     responses:
     *       '204':
     *         description: No Content - The contact was deleted successfully.
     *       '401':
     *         description: Unauthorized.
     *       '404':
     *         description: Contact not found.
     */
    .delete(
      contactIdValidation,
      validate,
      contactController.deleteContact.bind(contactController)
    );

  return router;
};
