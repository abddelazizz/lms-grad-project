import catchAsync from "../utils/catchAsync.js";
import * as adminService from "../services/adminService.js";

// ─── Instructor Controllers ────────────────────────────────────

export const createInstructor = catchAsync(async (req, res) => {
  const { name, email, password, bio, specialization } = req.body;
  const instructor = await adminService.createInstructor(name, email, password, bio, specialization);
  res.status(201).json({
    status: "success",
    message: "Instructor created successfully",
    data: { instructor },
  });
});

export const getAllInstructors = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const search = req.query.search || "";
  const result = await adminService.getAllInstructors(page, limit, search);
  res.status(200).json({
    status: "success",
    message: "Instructors retrieved successfully",
    data: result,
  });
});

export const getInstructorById = catchAsync(async (req, res) => {
  const instructor = await adminService.getInstructorById(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Instructor retrieved successfully",
    data: { instructor },
  });
});

export const removeInstructor = catchAsync(async (req, res) => {
  const result = await adminService.removeInstructor(req.params.id);
  res.status(200).json({ status: "success", data: result });
});

// ─── Student Controllers ───────────────────────────────────────

export const createStudent = catchAsync(async (req, res) => {
  const { name, email, password, gradeLevel, parentId } = req.body;
  const student = await adminService.createStudent(name, email, password, gradeLevel, parentId);
  res.status(201).json({
    status: "success",
    message: "Student created successfully",
    data: { student },
  });
});

export const getAllStudents = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const search = req.query.search || "";
  const result = await adminService.getAllStudents(page, limit, search);
  res.status(200).json({
    status: "success",
    message: "Students retrieved successfully",
    data: result,
  });
});

export const getStudentById = catchAsync(async (req, res) => {
  const student = await adminService.getStudentById(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Student retrieved successfully",
    data: { student },
  });
});

export const removeStudent = catchAsync(async (req, res) => {
  const result = await adminService.removeStudent(req.params.id);
  res.status(200).json({ status: "success", data: result });
});

// ─── Dashboard ────────────────────────────────────────────────

export const getAdminDashboardStats = catchAsync(async (req, res) => {
  const stats = await adminService.getAdminDashboardStats();
  res.status(200).json({
    status: "success",
    message: "Dashboard statistics retrieved successfully",
    data: stats,
  });
});
