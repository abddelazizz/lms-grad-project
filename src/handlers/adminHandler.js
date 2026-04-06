import { catchAsync } from "../utilis/index.js";
import * as adminService from "../services/adminService.js";

// POST /admin/create-instructor — admin creates an instructor account
export const createInstructor = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  // Delegate all business logic to the service layer
  const instructor = await adminService.createInstructor(name, email, password);

  res.status(201).json({
    status: "success",
    data: { instructor },
  });
});
