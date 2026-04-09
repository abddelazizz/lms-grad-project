import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import AppError from "../utilis/AppError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "recode_academy_profiles",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }],
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files are allowed (jpg, jpeg, png).", 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

export const uploadProfile = upload.single("profile_picture");

// --- Assignment Upload Middleware ---
const assignmentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "recode_academy_assignments",
    resource_type: "auto", // Allows PDFs, ZIPs, and non-image files
  },
});

const assignmentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf", 
    "application/zip", 
    "application/x-zip-compressed",
    "image/jpeg", 
    "image/png",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Invalid file type. Only PDF, ZIP, Word, and Images are allowed.", 400), false);
  }
};

const uploadAssignmentConfig = multer({
  storage: assignmentStorage,
  fileFilter: assignmentFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max for assignments
});

export const uploadAssignment = uploadAssignmentConfig.single("assignment_file");
