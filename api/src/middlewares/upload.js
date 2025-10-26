// middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");

// Use memory storage instead of disk storage for S3 uploads
const memoryStorage = multer.memoryStorage();

// Define file filter for images
const imageFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(
      new Error("Only image files (jpg, jpeg, png, gif) are allowed!"),
      false
    );
  }
  cb(null, true);
};

// Define file filter for PDFs
const pdfFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(pdf)$/i)) {
    return cb(new Error("Only PDF files are allowed!"), false);
  }
  cb(null, true);
};

// Create Multer upload instance for profile images
const uploadProfileImage = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB file size limit
  },
}).single("profileImage");

// Create Multer upload instance for template PDFs
const uploadTemplate = multer({
  storage: memoryStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB file size limit for PDFs
  },
}).single("file");

// Create Multer upload instance for package PDFs
const uploadPackage = multer({
  storage: memoryStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB file size limit for PDFs
  },
}).single("file");

/**
 * Middleware to handle S3 upload after multer processes the file
 * This should be used after the multer middleware
 */
const handleS3Upload = (folder) => {
  return async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    try {
      const s3Service = req.container.resolve("s3Service");

      // Upload to S3
      const result = await s3Service.uploadFile(
        req.file.buffer,
        req.file.originalname,
        folder,
        req.file.mimetype,
        req.user?.id || null
      );

      // Attach S3 info to request for use in controllers
      req.s3File = {
        key: result.key,
        url: result.url,
        attachment_uuid: result.attachment_uuid,
        bucket: result.bucket,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };

      // For backward compatibility with existing code
      if (result.attachment_uuid) {
        req.attachment_uuid = result.attachment_uuid;
      }
      req.fileUrl = result.url;
      req.s3Key = result.key;

      next();
    } catch (error) {
      console.error("S3 Upload Middleware Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file to cloud storage",
        error: error.message,
      });
    }
  };
};

/**
 * Combined middleware for profile image upload
 */
const uploadAndStoreProfileImage = [
  uploadProfileImage,
  handleS3Upload("avatars"),
];

/**
 * Combined middleware for template PDF upload
 */
const uploadAndStoreTemplate = [uploadTemplate, handleS3Upload("templates")];

/**
 * Combined middleware for package PDF upload
 */
const uploadAndStorePackage = [uploadPackage, handleS3Upload("packages")];

module.exports = {
  // Original multer middleware (for backward compatibility)
  uploadProfileImage,
  uploadTemplate,
  uploadPackage,

  // New S3-enabled middleware (use these)
  uploadAndStoreProfileImage,
  uploadAndStoreTemplate,
  uploadAndStorePackage,

  // Individual S3 handler (for custom use)
  handleS3Upload,
};
