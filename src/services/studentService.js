import { User, Student } from "../models/index.js";
import { AppError } from "../utilis/index.js";

/**
 * Fetches common user and student-specific profile info
 */
export const getStudentProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Student,
        as: "studentProfile",
        attributes: ["grade_level"],
      },
    ],
    attributes: { exclude: ["password", "verification_token", "reset_password_token"] },
  });

  if (!user) {
    throw new AppError("Student not found.", 404);
  }

  return user;
};

/**
 * Updates core user fields and profile-specific fields
 */
export const updateStudentProfile = async (userId, updateData) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("Student not found.", 404);
  }

  // Fields allowed for direct update on the User table
  const allowedFields = ["name", "email", "phone_number", "username"];
  const updates = {};
  
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  await user.update(updates);

  // If grade_level is provided, update the Student profile record
  if (updateData.grade_level) {
    const student = await Student.findOne({ where: { user_id: userId } });
    if (student) {
      await student.update({ grade_level: updateData.grade_level });
    }
  }

  return user;
};

export const updateProfilePicture = async (userId, fileUrl) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("Student not found.", 404);
  }

  await user.update({ picture: fileUrl });

  return user;
};
