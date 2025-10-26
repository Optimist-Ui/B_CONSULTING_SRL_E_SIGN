const express = require("express");
const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const {
  createTemplateValidation,
  updateTemplateValidation,
  templateIdValidation,
} = require("../validations/TemplateValidations");
const requireActiveSubscription = require("../middlewares/requireActiveSubscription");
const { uploadAndStoreTemplate } = require("../middlewares/upload");

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: API for managing reusable document templates. Requires authentication.
 */
module.exports = (container) => {
  const router = express.Router();
  const templateController = container.resolve("templateController");

  router.use(authenticateUser);

  /**
   * @swagger
   * /api/templates/upload:
   *   post:
   *     tags: [Templates]
   *     summary: Upload a template PDF
   *     description: Uploads a PDF file to the server. The response will contain the URL and a UUID needed to create a full template object later.
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               template: # This name 'template' must match the one in your upload middleware
   *                 type: string
   *                 format: binary
   *                 description: The PDF file to upload.
   *     responses:
   *       '200':
   *         description: File uploaded successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TemplateUploadResponse'
   *       '400':
   *         description: No file was uploaded or file type is invalid.
   *       '401':
   *         description: Unauthorized.
   */
  router.post(
    "/upload",
    uploadAndStoreTemplate,
    templateController.uploadTemplate.bind(templateController)
  );

  router
    .route("/")
    /**
     * @swagger
     * /api/templates:
     *   post:
     *     tags: [Templates]
     *     summary: Create a new template
     *     description: Creates a new template record with its fields and links it to an uploaded PDF.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/TemplateInput'
     *     responses:
     *       '201':
     *         description: Template created successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Template'
     *       '400':
     *         description: Validation error.
     *       '401':
     *         description: Unauthorized.
     */
    .post(
      createTemplateValidation,
      validate,
      templateController.createTemplate.bind(templateController)
    )
    /**
     * @swagger
     * /api/templates:
     *   get:
     *     tags: [Templates]
     *     summary: Get all user templates
     *     description: Retrieves a list of all templates created by the authenticated user.
     *     responses:
     *       '200':
     *         description: An array of user's templates.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Template'
     *       '401':
     *         description: Unauthorized.
     */
    .get(templateController.getTemplates.bind(templateController));

  router
    .route("/:templateId")
    /**
     * @swagger
     * /api/templates/{templateId}:
     *   get:
     *     tags: [Templates]
     *     summary: Get a single template by ID
     *     description: Retrieves the full details of a specific template.
     *     parameters:
     *       - in: path
     *         name: templateId
     *         required: true
     *         schema:
     *           type: string
     *         description: The MongoDB ObjectId of the template.
     *     responses:
     *       '200':
     *         description: The requested template object.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Template'
     *       '401':
     *         description: Unauthorized.
     *       '404':
     *         description: Template not found.
     */
    .get(
      templateIdValidation,
      validate,
      templateController.getTemplateById.bind(templateController)
    )
    /**
     * @swagger
     * /api/templates/{templateId}:
     *   patch:
     *     tags: [Templates]
     *     summary: Update a template
     *     description: Updates the name and/or fields of an existing template.
     *     parameters:
     *       - in: path
     *         name: templateId
     *         required: true
     *         schema:
     *           type: string
     *         description: The MongoDB ObjectId of the template to update.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateTemplateInput'
     *     responses:
     *       '200':
     *         description: The updated template object.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Template'
     *       '400':
     *         description: Validation error.
     *       '401':
     *         description: Unauthorized.
     *       '404':
     *         description: Template not found.
     */
    .patch(
      templateIdValidation,
      updateTemplateValidation,
      validate,
      templateController.updateTemplate.bind(templateController)
    )
    /**
     * @swagger
     * /api/templates/{templateId}:
     *   delete:
     *     tags: [Templates]
     *     summary: Delete a template
     *     description: Permanently deletes a user's template.
     *     parameters:
     *       - in: path
     *         name: templateId
     *         required: true
     *         schema:
     *           type: string
     *         description: The MongoDB ObjectId of the template to delete.
     *     responses:
     *       '204':
     *         description: No Content - Template deleted successfully.
     *       '401':
     *         description: Unauthorized.
     *       '404':
     *         description: Template not found.
     */
    .delete(
      templateIdValidation,
      validate,
      templateController.deleteTemplate.bind(templateController)
    );

  return router;
};
