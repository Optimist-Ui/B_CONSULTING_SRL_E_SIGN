const express = require("express");
const authenticateUser = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const { uploadTemplate } = require("../middlewares/upload");
const {
  createTemplateValidation,
  updateTemplateValidation,
  templateIdValidation,
} = require("../validations/TemplateValidations");

module.exports = (container) => {
  const router = express.Router();
  const templateController = container.resolve("templateController");

  router.use(authenticateUser);

  router.post(
    "/upload",
    uploadTemplate,
    templateController.uploadTemplate.bind(templateController)
  );

  router
    .route("/")
    .post(
      createTemplateValidation,
      validate,
      templateController.createTemplate.bind(templateController)
    )
    .get(templateController.getTemplates.bind(templateController));

  router
    .route("/:templateId")
    .get(
      templateIdValidation,
      validate,
      templateController.getTemplateById.bind(templateController)
    )
    .patch(
      templateIdValidation,
      updateTemplateValidation,
      validate,
      templateController.updateTemplate.bind(templateController)
    )
    .delete(
      templateIdValidation,
      validate,
      templateController.deleteTemplate.bind(templateController)
    );

  return router;
};
