const { v4: uuidv4 } = require("uuid");

class TemplateService {
  constructor({ Template, User }) {
    this.Template = Template;
    this.User = User;
  }

  async createTemplate(userId, templateData) {
    const { attachment_uuid, name, fileUrl, fields } = templateData;

    // Check if attachment_uuid is unique for this user
    // This check is good, but the database index provides the ultimate enforcement.
    const existingTemplate = await this.Template.findOne({
      ownerId: userId,
      attachment_uuid,
    });
    if (existingTemplate) {
      throw new Error("A template with this attachment UUID already exists.");
    }

    // --- THIS IS THE FIX ---
    // The database has a unique index on a field called `docuTemplateId`.
    // We must provide a unique value for it. The `attachment_uuid` is the perfect candidate
    // as it's already a unique identifier for the uploaded document.
    const newTemplate = await this.Template.create({
      ownerId: userId,
      docuTemplateId: attachment_uuid, // Set the required unique field
      attachment_uuid,
      name,
      fileUrl,
      fields,
    });
    return newTemplate;
  }

  async getTemplates(userId) {
    const templates = await this.Template.find({ ownerId: userId }).sort({
      name: 1,
    });
    return templates;
  }

  async getTemplateById(userId, templateId) {
    const template = await this.Template.findOne({
      _id: templateId,
      ownerId: userId,
    });
    if (!template) {
      throw new Error(
        "Template not found or you do not have permission to view it."
      );
    }
    return template;
  }

  async updateTemplate(userId, templateId, updateData) {
    // --- THIS IS THE FIX ---
    // Defend the API by ensuring immutable fields cannot be changed.
    // We create a copy of the incoming data to avoid side effects.
    const safeUpdateData = { ...updateData };

    // Explicitly delete any fields that should never change via an update.
    delete safeUpdateData.docuTemplateId;
    delete safeUpdateData.attachment_uuid;
    delete safeUpdateData.ownerId;
    delete safeUpdateData._id;

    const template = await this.Template.findOneAndUpdate(
      { _id: templateId, ownerId: userId },
      { $set: safeUpdateData }, // Use the sanitized data object
      { new: true, runValidators: true }
    );

    if (!template) {
      throw new Error(
        "Template not found or you do not have permission to edit it."
      );
    }
    return template;
  }

  async deleteTemplate(userId, templateId) {
    const template = await this.Template.findOne({
      _id: templateId,
      ownerId: userId,
    });
    if (!template) {
      throw new Error(
        "Template not found or you do not have permission to delete it."
      );
    }

    // Optionally, delete the associated PDF file
    const fs = require("fs").promises;
    const path = require("path");
    const filePath = path.join(__dirname, "../..", template.fileUrl);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error("Failed to delete file:", err);
    }

    const result = await this.Template.deleteOne({
      _id: templateId,
      ownerId: userId,
    });

    return { message: "Template deleted successfully." };
  }

  async uploadTemplate(userId, file) {
    if (!file) {
      throw new Error("No file uploaded.");
    }

    const attachment_uuid = `cs_test_${uuidv4()}`;
    const fileUrl = `/Uploads/templates/${file.filename}`;

    return {
      attachment_uuid,
      originalFileName: file.originalname,
      fileUrl,
    };
  }
}

module.exports = TemplateService;
