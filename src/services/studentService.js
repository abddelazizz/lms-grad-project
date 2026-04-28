import bcrypt from "bcrypt";
import { User, Student, Instructor } from "../models/index.js";
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
      {
        model: Instructor,
        as: "instructorProfile",
        attributes: ["bio", "specialization"],
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
  const allowedFields = ["name", "email", "phone_number", "username", "picture"];
  const updates = {};
  
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  // Handle password update if provided
  if (updateData.currentPassword && updateData.newPassword) {
    const isMatch = await bcrypt.compare(updateData.currentPassword, user.password);
    if (!isMatch) {
      throw new AppError("Incorrect current password.", 401);
    }
    const hashedPassword = await bcrypt.hash(updateData.newPassword, 12);
    updates.password = hashedPassword;
  }

  await user.update(updates);

  // If grade_level is provided, update the Student profile record
  if (user.role === 'student' && updateData.grade_level) {
    const student = await Student.findOne({ where: { user_id: userId } });
    if (student) {
      await student.update({ grade_level: updateData.grade_level });
    }
  } else if (user.role === 'instructor' && (updateData.specialization || updateData.bio)) {
    const instructor = await Instructor.findOne({ where: { user_id: userId } });
    if (instructor) {
      let instUpdates = {};
      if (updateData.specialization) instUpdates.specialization = updateData.specialization;
      if (updateData.bio) instUpdates.bio = updateData.bio;
      await instructor.update(instUpdates);
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
