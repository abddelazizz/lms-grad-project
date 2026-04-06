import { User } from "../models/index.js";
import {AppError}from "../utilis/index.js";

export const updateProfilePicture = async (userId, fileUrl) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("Student not found.", 404);
  }

  await user.update({ profile_picture: fileUrl });

  return user;
};
