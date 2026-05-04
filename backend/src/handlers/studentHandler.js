import { AppError, catchAsync } from "../utils/index.js";
import { updateProfilePicture, getStudentProfile, updateStudentProfile } from "../services/index.js";
import { generateToken } from "../utils/index.js";

export const getProfile = catchAsync(async (req, res, next) => {
  const userId = req.user?.id || req.user?.user_id;
  const profile = await getStudentProfile(userId);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const userId = req.user?.id || req.user?.user_id;
  const updatedUser = await updateStudentProfile(userId, req.body);
  const token = generateToken(updatedUser);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    data: updatedUser,
    token, // Send new token reflecting changes
  });
});

export const uploadProfilePicture = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No image file provided.", 400));
  }

  const cloudImageUrl = req.file.path;
  const userId = req.user?.id || req.user?.user_id || req.params.id;

  const updatedUser = await updateProfilePicture(userId, cloudImageUrl);
  const token = generateToken(updatedUser);

  res.status(200).json({
    success: true,
    message: "Profile picture uploaded successfully.",
    profile_picture: cloudImageUrl,
    data: updatedUser,
    token,
  });
});
