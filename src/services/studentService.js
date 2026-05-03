import bcrypt from "bcrypt";
import { User, Student, Instructor } from "../models/index.js";
import { AppError } from "../utilis/index.js";
import { auditLog } from "../utilis/logger.js";
import { revokeAllRefreshTokens, publishTokenRevocation } from "./tokenService.js";
import { sendPasswordChangeNotification } from "../utilis/sendEmails.js";
import redis from "../config/redis.js";

const getStudentProfile = async (userId) => {
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
    attributes: { exclude: ["password", "verification_token", "reset_password_token", "mfa_secret"] },
  });

  if (!user) {
    throw new AppError("Student not found.", 404);
  }

  return user;
};

const updateStudentProfile = async (userId, updateData) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("Student not found.", 404);
  }

  const allowedFields = ["name", "phone_number", "username", "picture"];
  const updates = {};
  
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  if (updateData.currentPassword && updateData.newPassword) {
    if (!user.password) {
      throw new AppError("This account was created via social login. Please reset your password to set one.", 401);
    }
    const isMatch = await bcrypt.compare(updateData.currentPassword, user.password);
    if (!isMatch) {
      throw new AppError("Incorrect current password.", 401);
    }
    const hashedPassword = await bcrypt.hash(updateData.newPassword, 12);
    updates.password = hashedPassword;
    updates.token_version = user.token_version + 1;
    updates.password_changed_at = new Date();

    await revokeAllRefreshTokens(userId);
    await publishTokenRevocation(userId);
    await redis.del(`user_cache:${userId}`);

    await sendPasswordChangeNotification(user.email);

    auditLog("PASSWORD_CHANGE", userId, "user", userId);
  }

  await user.update(updates);

  if (user.role === "student" && updateData.grade_level) {
    const student = await Student.findOne({ where: { user_id: userId } });
    if (student) {
      await student.update({ grade_level: updateData.grade_level });
    }
  } else if (user.role === "instructor" && (updateData.specialization || updateData.bio)) {
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

export { getStudentProfile, updateStudentProfile };
