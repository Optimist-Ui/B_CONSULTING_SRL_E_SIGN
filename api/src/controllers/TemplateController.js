const { successResponse, errorResponse } = require("../utils/responseHandler");

class TemplateController {
  constructor({ templateService }) {
    this.templateService = templateService;
  }

  async uploadTemplate(req, res) {
    try {
      const userId = req.user.id;
      const file = req.file; // From multer middleware
      const result = await this.templateService.uploadTemplate(userId, file);
      successResponse(res, result, "File uploaded successfully", 201);
    } catch (error) {
      errorResponse(res, error, "Failed to upload file");
    }
  }

  async createTemplate(req, res) {
    try {
      const userId = req.user.id;
      const template = await this.templateService.createTemplate(
        userId,
        req.body
      );
      successResponse(res, template, "Template created successfully", 201);
    } catch (error) {
      errorResponse(res, error, "Failed to create template");
    }
  }

  async getTemplates(req, res) {
    try {
      const userId = req.user.id;
      const templates = await this.templateService.getTemplates(userId);
      successResponse(res, templates, "Templates fetched successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch templates");
    }
  }

  async getTemplateById(req, res) {
    try {
      const userId = req.user.id;
      const { templateId } = req.params;
      const template = await this.templateService.getTemplateById(
        userId,
        templateId
      );
      successResponse(res, template, "Template fetched successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch template");
    }
  }

  async updateTemplate(req, res) {
    try {
      const userId = req.user.id;
      const { templateId } = req.params;
      const template = await this.templateService.updateTemplate(
        userId,
        templateId,
        req.body
      );
      successResponse(res, template, "Template updated successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to update template");
    }
  }

  async deleteTemplate(req, res) {
    try {
      const userId = req.user.id;
      const { templateId } = req.params;
      const result = await this.templateService.deleteTemplate(
        userId,
        templateId
      );
      successResponse(res, result, result.message);
    } catch (error) {
      errorResponse(res, error, "Failed to delete template");
    }
  }
}

module.exports = TemplateController;
