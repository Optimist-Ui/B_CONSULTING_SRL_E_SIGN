// services/s3Service.js
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

class S3Service {
  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET;
  }

  /**
   * Upload a file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} folder - S3 folder (avatars/templates/packages)
   * @param {string} mimeType - File MIME type
   * @param {string} userId - Optional user ID for avatar naming
   * @returns {Promise<Object>} Upload result with key and URL
   */
  async uploadFile(fileBuffer, originalName, folder, mimeType, userId = null) {
    try {
      const fileExtension = path.extname(originalName);
      let key;
      let attachment_uuid;

      // Generate appropriate key based on folder
      switch (folder) {
        case "avatars":
          const timestamp = Date.now();
          const random = Math.round(Math.random() * 1e9);
          key = `${folder}/${userId}-profile-${timestamp}-${random}${fileExtension}`;
          attachment_uuid = null;
          break;

        case "templates":
          attachment_uuid = `cs_test_${uuidv4()}`;
          key = `${folder}/${attachment_uuid}${fileExtension}`;
          break;

        case "packages":
          attachment_uuid = `cs_pkg_${uuidv4()}`;
          key = `${folder}/${attachment_uuid}${fileExtension}`;
          break;

        default:
          attachment_uuid = uuidv4();
          key = `${folder}/${attachment_uuid}${fileExtension}`;
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        // Make files private by default - access via signed URLs
        ACL: "private",
        // Optional: Add metadata
        Metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3.send(command);

      return {
        success: true,
        key: key,
        attachment_uuid: attachment_uuid,
        bucket: this.bucket,
        url: `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      };
    } catch (error) {
      console.error("S3 Upload Error:", error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Get a signed URL for secure file access
   * @param {string} key - S3 object key
   * @param {number} expiresIn - URL expiration in seconds (default: 1 hour)
   * @returns {Promise<string>} Signed URL
   */
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3, command, { expiresIn });
    } catch (error) {
      console.error("S3 Get Signed URL Error:", error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param {string} key - S3 object key
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3.send(command);
      return true;
    } catch (error) {
      console.error("S3 Delete Error:", error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in S3
   * @param {string} key - S3 object key
   * @returns {Promise<boolean>} File exists status
   */
  async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3.send(command);
      return true;
    } catch (error) {
      if (error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   * @param {string} key - S3 object key
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error("S3 Get Metadata Error:", error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}

module.exports = S3Service;
