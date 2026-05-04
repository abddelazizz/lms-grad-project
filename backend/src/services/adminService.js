import { Op } from "sequelize";
import bcrypt from "bcrypt";
import { User, Instructor, Student, Course, Enrollment } from "../models/index.js";
import { sequelize } from "../config/index.js";
import AppError from "../utils/AppError.js";
import { auditLog } from "../utils/logger.js";
import { buildBaseUsername, ensureUniqueUsername, defaultProfilePictureUrl } from "../utils/userDefaults.js";

const SALT_ROUNDS = 12;

// ─── Helper ───────────────────────────────────────────────────
const escapeLikeWildcards = (str) => str.replace(/[%_]/g, "\\$&");

const buildSearchWhere = (search) =>
  search
    ? {
      [Op.or]: [
        { name: { [Op.like]: `%${escapeLikeWildcards(search)}%` } },
        { email: { [Op.like]: `%${escapeLikeWildcards(search)}%` } },
      ],
    }
    : {};

const sanitizeStudentProfileData = ({ gradeLevel, parentId }) => ({
  grade_level: gradeLevel || null,
  parent_id: parentId || null,
});

export const ensureStudentProfile = async (userId, { gradeLevel = null, parentId = null } = {}, transaction = null) => {
  const existingProfile = await Student.findByPk(userId, { transaction });

  if (existingProfile) {
    return existingProfile;
  }

  return Student.create(
    {
      user_id: userId,
      ...sanitizeStudentProfileData({ gradeLevel, parentId }),
    },
    { transaction }
  );
};

export const createStudentAccount = async ({
  name,
  email,
  password,
  username = null,
  picture = null,
  gradeLevel = null,
  parentId = null,
  isVerified = true,
  verificationToken = null,
  verificationTokenExpires = null,
  emailVerifiedAt = null,
  googleId = null,
}) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  return sequelize.transaction(async (transaction) => {
    const hashedPassword = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;
    const finalUsername = await ensureUniqueUsername(buildBaseUsername({ username, email, name }));
    const finalPicture = picture || defaultProfilePictureUrl(email);

    const user = await User.create(
      {
        google_id: googleId,
        username: finalUsername,
        name,
        email,
        picture: finalPicture,
        password: hashedPassword,
        role: "student",
        is_verified: isVerified,
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires,
        email_verified_at: emailVerifiedAt,
      },
      { transaction }
    );

    const studentProfile = await ensureStudentProfile(
      user.user_id,
      { gradeLevel, parentId },
      transaction
    );

    return { user, studentProfile };
  });
};

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
  const finalUsername = await ensureUniqueUsername(buildBaseUsername({ email, name }));
  const finalPicture = defaultProfilePictureUrl(email);

  const user = await User.create({
    username: finalUsername,
    name,
    email,
    picture: finalPicture,
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
    include: [{ model: Instructor, as: "instructorProfile", attributes: ["bio", "specialization"] }],
    attributes: { exclude: ["password", "verification_token", "verification_token_expires", "reset_password_token", "reset_password_expires"] },
    limit,
    offset,
    order: [["created_at", "DESC"]],
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
    include: [{ model: Instructor, as: "instructorProfile", attributes: ["bio", "specialization"] }],
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
  const { user, studentProfile } = await createStudentAccount({
    name,
    email,
    password,
    gradeLevel,
    parentId,
    isVerified: true,
    emailVerifiedAt: new Date(),
  });

  auditLog("CREATE_STUDENT", "admin", "user", user.user_id, { email });

  const { password: _, ...userData } = user.toJSON();
  return {
    ...userData,
    studentProfile: {
      grade_level: studentProfile.grade_level,
      parent_id: studentProfile.parent_id,
    },
  };
};

// getAllStudents — GET /api/admin/students
export const getAllStudents = async (page, limit, search) => {
  const offset = (page - 1) * limit;
  const searchWhere = buildSearchWhere(search);

  const { count, rows } = await User.findAndCountAll({
    where: { role: "student", ...searchWhere },
    include: [{ model: Student, as: "studentProfile", attributes: ["grade_level", "parent_id"] }],
    attributes: { exclude: ["password", "verification_token", "verification_token_expires", "reset_password_token", "reset_password_expires"] },
    limit,
    offset,
    order: [["created_at", "DESC"]],
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
    include: [{ model: Student, as: "studentProfile", attributes: ["grade_level", "parent_id"] }],
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
  const [totalUsers, totalInstructors, totalStudents, verifiedUsers, totalCourses, enrollments] = await Promise.all([
    User.count(),
    User.count({ where: { role: "instructor" } }),
    User.count({ where: { role: "student" } }),
    User.count({ where: { is_verified: true } }),
    Course.count(),
    Enrollment.findAll({
      attributes: ['status'],
      include: [{ model: Course, as: 'course', attributes: ['price'] }]
    })
  ]);

  const verifiedCount = verifiedUsers;
  const unverifiedUsers = totalUsers - verifiedCount;

  // Calculate total revenue from enrollments
  const totalRevenue = enrollments.reduce((sum, e) => sum + parseFloat(e.course.price || 0), 0);

  return {
    totalUsers,
    totalInstructors,
    totalStudents,
    totalCourses,
    totalRevenue: totalRevenue.toFixed(2),
    verifiedUsers: verifiedCount,
    unverifiedUsers,
    stats: {
      instructorPercentage: totalUsers ? ((totalInstructors / totalUsers) * 100).toFixed(2) : "0.00",
      studentPercentage: totalUsers ? ((totalStudents / totalUsers) * 100).toFixed(2) : "0.00",
      verificationRate: totalUsers ? ((verifiedCount / totalUsers) * 100).toFixed(2) : "0.00",
    },
  };
};
