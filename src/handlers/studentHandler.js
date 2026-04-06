import {AppError,catchAsync }from "../utilis/index.js";
import { updateProfilePicture } from "../services/index.js";

export const uploadProfilePicture = catchAsync(async (req, res, next) => {

  if (!req.file) {
    return next(new AppError("No image file provided.", 400));
  }
 

  const cloudImageUrl = req.file.path;
 
  await updateProfilePicture(req.params.id, cloudImageUrl);
 
  res.status(200).json({
    success: true,
    message: "Profile picture uploaded successfully.",
    profile_picture: cloudImageUrl,
  });
});