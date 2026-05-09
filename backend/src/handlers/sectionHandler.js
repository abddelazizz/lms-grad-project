import * as sectionService from "../services/sectionService.js";
import catchAsync from "../utils/catchAsync.js";

// POST /api/courses/:courseId/sections — create a section
export const createSection = catchAsync(async (req, res) => {
  const { title } = req.body;

  const section = await sectionService.createSection(
    req.params.courseId,
    req.user.user_id,
    req.user.role,
    title
  );

  res.status(201).json({ status: "success", data: { section } });
});

// DELETE /api/courses/:courseId/sections/:sectionId
export const deleteSection = catchAsync(async (req, res) => {
  await sectionService.deleteSection(
    req.params.sectionId,
    req.user.user_id,
    req.user.role
  );

  res.status(204).json({ status: "success", data: null });
});
