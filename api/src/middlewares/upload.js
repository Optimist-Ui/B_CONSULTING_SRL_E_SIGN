// middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");

// Create a function to ensure a directory exists
const ensureExists = async (path, mask = 0o755) => {
  try {
    await fs.mkdir(path, { mode: mask, recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") {
      console.error("Could not create upload directory.", err);
      throw err;
    }
  }
};

// Define storage configuration for profile images
const profileImageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/uploads/avatars");
    try {
      await ensureExists(uploadPath);
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${req.user.id}-${
      file.fieldname
    }-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});

// Define storage configuration for template PDFs
const templateStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/uploads/templates");
    try {
      await ensureExists(uploadPath);
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const attachment_uuid = `cs_test_${uuidv4()}`;
    const filename = `${attachment_uuid}${path.extname(file.originalname)}`;
    req.attachment_uuid = attachment_uuid;
    req.fileUrl = `/public/uploads/templates/${filename}`;
    cb(null, filename);
  },
});

// Define storage configuration for package PDFs
const packageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/uploads/packages");
    try {
      await ensureExists(uploadPath);
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const attachment_uuid = `cs_pkg_${uuidv4()}`;
    const filename = `${attachment_uuid}${path.extname(file.originalname)}`;
    req.attachment_uuid = attachment_uuid;
    req.fileUrl = `/public/uploads/packages/${filename}`;
    cb(null, filename);
  },
});

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
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB file size limit
  },
}).single("profileImage");

// Create Multer upload instance for template PDFs
const uploadTemplate = multer({
  storage: templateStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB file size limit for PDFs
  },
}).single("file");

// Create Multer upload instance for package PDFs
const uploadPackage = multer({
  storage: packageStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB file size limit for PDFs
  },
}).single("file");

module.exports = {
  uploadProfileImage,
  uploadTemplate,
  uploadPackage,
};
