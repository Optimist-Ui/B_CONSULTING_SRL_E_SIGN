const { v4: uuidv4 } = require("uuid");

class TemplateService {
  constructor({ Template, User, s3Service }) {
    this.Template = Template;
    this.User = User;
    this.s3Service = s3Service;
  }

  async createTemplate(userId, templateData) {
    const { attachment_uuid, name, fileUrl, fields, s3Key } = templateData;

    // Check if attachment_uuid is unique for this user
    const existingTemplate = await this.Template.findOne({
      ownerId: userId,
      attachment_uuid,
    });
    if (existingTemplate) {
      throw new Error("A template with this attachment UUID already exists.");
    }

    // Validate s3Key is provided
    if (!s3Key) {
      throw new Error("S3 key is required to create a template.");
    }

    const newTemplate = await this.Template.create({
      ownerId: userId,
      docuTemplateId: attachment_uuid,
      attachment_uuid,
      name,
      fileUrl,
      s3Key, // 👈 Store S3 key
      fields,
    });

    return newTemplate;
  }

  // --- GET ALL TEMPLATES (WITH SIGNED URLS) ---
  async getTemplates(userId) {
    const templates = await this.Template.find({ ownerId: userId }).sort({
      name: 1,
    });

    // Generate signed URLs for all templates
    const templatesWithSignedUrls = await Promise.all(
      templates.map(async (template) => {
        const templateObj = template.toObject();

        if (template.s3Key) {
          try {
            templateObj.downloadUrl = await this.s3Service.getSignedUrl(
              template.s3Key,
              3600 // 1 hour
            );
          } catch (error) {
            console.error(
              `Failed to generate signed URL for template ${template._id}:`,
              error
            );
            templateObj.downloadUrl = template.fileUrl; // Fallback
          }
        }

        return templateObj;
      })
    );

    return templatesWithSignedUrls;
  }

  // --- GET TEMPLATE BY ID (WITH SIGNED URL) ---
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

    const templateObj = template.toObject();

    // Generate signed URL for downloading
    if (template.s3Key) {
      try {
        templateObj.downloadUrl = await this.s3Service.getSignedUrl(
          template.s3Key,
          3600 // 1 hour
        );
      } catch (error) {
        console.error(
          `Failed to generate signed URL for template ${template._id}:`,
          error
        );
        templateObj.downloadUrl = template.fileUrl; // Fallback
      }
    }

    return templateObj;
  }

  async updateTemplate(userId, templateId, updateData) {
    // Sanitize - prevent updating immutable fields
    const safeUpdateData = { ...updateData };
    delete safeUpdateData.docuTemplateId;
    delete safeUpdateData.attachment_uuid;
    delete safeUpdateData.ownerId;
    delete safeUpdateData._id;
    delete safeUpdateData.s3Key; // 👈 Don't allow S3 key updates
    delete safeUpdateData.fileUrl; // 👈 Don't allow file URL updates

    const template = await this.Template.findOneAndUpdate(
      { _id: templateId, ownerId: userId },
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    );

    if (!template) {
      throw new Error(
        "Template not found or you do not have permission to edit it."
      );
    }

    // Return with signed URL
    const templateObj = template.toObject();
    if (template.s3Key) {
      try {
        templateObj.downloadUrl = await this.s3Service.getSignedUrl(
          template.s3Key,
          3600
        );
      } catch (error) {
        console.error("Failed to generate signed URL:", error);
      }
    }

    return templateObj;
  }

  // --- DELETE TEMPLATE (DELETE FROM S3 TOO) ---
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

    // Delete file from S3
    if (template.s3Key) {
      try {
        await this.s3Service.deleteFile(template.s3Key);
        console.log(`Deleted template file from S3: ${template.s3Key}`);
      } catch (error) {
        console.error("Failed to delete template file from S3:", error);
        // Continue with DB deletion even if S3 deletion fails
      }
    }

    // Delete from database
    await this.Template.deleteOne({
      _id: templateId,
      ownerId: userId,
    });

    return { message: "Template deleted successfully." };
  }

  async uploadTemplate(userId, s3File) {
    if (!s3File) {
      throw new Error("No file uploaded.");
    }

    return {
      attachment_uuid: s3File.attachment_uuid,
      originalFileName: s3File.originalName,
      fileUrl: s3File.url, // S3 URL
      s3Key: s3File.key, // S3 key for future operations
    };
  }
}

module.exports = TemplateService;
