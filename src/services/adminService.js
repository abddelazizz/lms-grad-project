import { Op } from "sequelize";
import bcrypt from "bcrypt";
import { User, Instructor, Student } from "../models/index.js";
import AppError from "../utilis/AppError.js";
import { auditLog } from "../utilis/logger.js";

const SALT_ROUNDS = 12;

// ─── Helper ───────────────────────────────────────────────────
const buildSearchWhere = (search) =>
  search
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

// ═══════════════════════════════════════════════════════════════
// INSTRUCTOR MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// createInstructor — POST /api/admin/instructors
export const createInstructor = async (name, email, password, bio, specialization) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "instructor",
    is_verified: true,
  });

  await Instructor.create({ user_id: user.user_id, bio, specialization });

  auditLog("CREATE_INSTRUCTOR", "admin", "user", user.user_id, { email });

  const { password: _, ...userData } = user.toJSON();
  return { ...userData, bio, specialization };
};

// getAllInstructors — GET /api/admin/instructors
export const getAllInstructors = async (page, limit, search) => {
  const offset = (page - 1) * limit;
  const searchWhere = buildSearchWhere(search);

  const { count, rows } = await User.findAndCountAll({
    where: { role: "instructor", ...searchWhere },
    include: [{ model: Instructor, as: "Instructor", attributes: ["bio", "specialization"] }],
    attributes: { exclude: ["password", "verification_token", "verification_token_expires", "reset_password_token", "reset_password_expires"] },
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows,
  };
};

// getInstructorById — GET /api/admin/instructors/:id
export const getInstructorById = async (id) => {
  const user = await User.findOne({
    where: { user_id: id, role: "instructor" },
    include: [{ model: Instructor, as: "Instructor", attributes: ["bio", "specialization"] }],
    attributes: { exclude: ["password", "verification_token", "verification_token_expires", "reset_password_token", "reset_password_expires"] },
  });

  if (!user) {
    throw new AppError("Instructor not found", 404);
  }

  return user;
};

// removeInstructor — DELETE /api/admin/instructors/:id
export const removeInstructor = async (id) => {
  const user = await User.findOne({ where: { user_id: id, role: "instructor" } });

  if (!user) {
    throw new AppError("Instructor not found", 404);
  }

  await user.destroy();
  auditLog("REMOVE_INSTRUCTOR", "admin", "user", id);

  return { message: "Instructor removed successfully", removedInstructorId: Number(id) };
};

// ═══════════════════════════════════════════════════════════════
// STUDENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// createStudent — POST /api/admin/students
export const createStudent = async (name, email, password, gradeLevel, parentId) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "student",
    is_verified: true,
  });

  await Student.create({
    user_id: user.user_id,
    grade_level: gradeLevel,
    parent_id: parentId || null,
  });

  auditLog("CREATE_STUDENT", "admin", "user", user.user_id, { email });

  const { password: _, ...userData } = user.toJSON();
  return { ...userData, grade_level: gradeLevel, parent_id: parentId || null };
};

// getAllStudents — GET /api/admin/students
export const getAllStudents = async (page, limit, search) => {
  const offset = (page - 1) * limit;
  const searchWhere = buildSearchWhere(search);

  const { count, rows } = await User.findAndCountAll({
    where: { role: "student", ...searchWhere },
    include: [{ model: Student, as: "Student", attributes: ["grade_level", "parent_id"] }],
    attributes: { exclude: ["password", "verification_token", "verification_token_expires", "reset_password_token", "reset_password_expires"] },
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows,
  };
};

// getStudentById — GET /api/admin/students/:id
export const getStudentById = async (id) => {
  const user = await User.findOne({
    where: { user_id: id, role: "student" },
    include: [{ model: Student, as: "Student", attributes: ["grade_level", "parent_id"] }],
    attributes: { exclude: ["password", "verification_token", "verification_token_expires", "reset_password_token", "reset_password_expires"] },
  });

  if (!user) {
    throw new AppError("Student not found", 404);
  }

  return user;
};

// removeStudent — DELETE /api/admin/students/:id
export const removeStudent = async (id) => {
  const user = await User.findOne({ where: { user_id: id, role: "student" } });

  if (!user) {
    throw new AppError("Student not found", 404);
  }

  await user.destroy();
  auditLog("REMOVE_STUDENT", "admin", "user", id);

  return { message: "Student removed successfully", removedStudentId: Number(id) };
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════

// getAdminDashboardStats — GET /api/admin/dashboard/stats
export const getAdminDashboardStats = async () => {
  const [totalUsers, totalInstructors, totalStudents, verifiedUsers] = await Promise.all([
    User.count(),
    User.count({ where: { role: "instructor" } }),
    User.count({ where: { role: "student" } }),
    User.count({ where: { is_verified: true } }),
  ]);

  const unverifiedUsers = totalUsers - verifiedUsers;

  return {
    totalUsers,
    totalInstructors,
    totalStudents,
    verifiedUsers,
    unverifiedUsers,
    stats: {
      instructorPercentage: totalUsers ? ((totalInstructors / totalUsers) * 100).toFixed(2) : "0.00",
      studentPercentage: totalUsers ? ((totalStudents / totalUsers) * 100).toFixed(2) : "0.00",
      verificationRate: totalUsers ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : "0.00",
    },
  };
};
