import { AppError, catchAsync } from "../utilis/index.js";
import { updateProfilePicture, getStudentProfile, updateStudentProfile } from "../services/index.js";

export const getProfile = catchAsync(async (req, res, next) => {
  const profile = await getStudentProfile(req.user.user_id);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const updatedUser = await updateStudentProfile(req.user.user_id, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    data: updatedUser,
  });
});

export const uploadProfilePicture = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No image file provided.", 400));
  }

  const cloudImageUrl = req.file.path;
  const userId = req.user?.user_id || req.params.id; // prefer authenticated user id

  await updateProfilePicture(userId, cloudImageUrl);

  res.status(200).json({
    success: true,
    message: "Profile picture uploaded successfully.",
    profile_picture: cloudImageUrl,
  });
});