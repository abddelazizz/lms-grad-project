import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import AppError from "../utils/AppError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Profile Picture Upload ────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "recode_academy_profiles",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [
      { width: 500, height: 500, crop: "fill", gravity: "face" },
    ],
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new AppError("Only image files are allowed (jpg, jpeg, png).", 400),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

export const uploadProfile = upload.single("profile_picture");

// ─── Assignment Upload ─────────────────────────────────────────
const assignmentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "recode_academy_assignments",
    resource_type: "auto",
  },
});

const assignmentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only PDF, ZIP, Word, and Images are allowed.",
        400,
      ),
      false,
    );
  }
};

const uploadAssignmentConfig = multer({
  storage: assignmentStorage,
  fileFilter: assignmentFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});

export const uploadAssignment =
  uploadAssignmentConfig.single("assignment_file");

// ─── Course Thumbnail Upload ───────────────────────────────────
const thumbnailStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "recode_academy_thumbnails",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1280, height: 720, crop: "fill" }],
  },
});

const thumbnailFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new AppError("Only image files are allowed for thumbnails.", 400),
      false,
    );
  }
};

const uploadThumbnailConfig = multer({
  storage: thumbnailStorage,
  fileFilter: thumbnailFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max for thumbnails
});

export const uploadCourseThumbnail = uploadThumbnailConfig.single("thumbnail");

// ─── Unified Lesson Material Upload ────────────────────────────
// Uses resource_type: "auto" so Cloudinary auto-detects video vs document
const lessonStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "recode_academy_lessons",
    resource_type: "auto",
  },
});

const lessonFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "video/mp4",
    "video/quicktime", // .mov
    "video/x-msvideo", // .avi
    "video/webm",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only MP4, PDF, and ZIP files are allowed.",
        400,
      ),
      false,
    );
  }
};

const uploadLessonConfig = multer({
  storage: lessonStorage,
  fileFilter: lessonFileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
});

export const uploadLessonMaterial = uploadLessonConfig.single("lesson_file");

// ─── Quiz Material Upload ────────────────────────────────────
const quizMaterialStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "recode_academy_quiz_materials",
    resource_type: "auto",
  },
});

const quizFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new AppError("Only PDF files are allowed for quiz generation.", 400),
      false,
    );
  }
};
const quizStorage = multer.memoryStorage();

const uploadQuizConfig = multer({
  storage: quizStorage,
  fileFilter: quizFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadQuizMaterial = uploadQuizConfig.single("materials");
