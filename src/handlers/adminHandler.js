import User from "../models/user.js";
import AppError from "../utilis/AppError.js";
import bcrypt from "bcrypt";

// POST /admin/create-instructor — admin creates an instructor account
export const createInstructor = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError("A user with this email already exists", 409));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const instructor = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "instructor",
      is_verified: true, // admin-created accounts are pre-verified
    });

    // Exclude password from response
    const { password: _, ...instructorData } = instructor.toJSON();

    res.status(201).json({
      status: "success",
      data: { instructor: instructorData },
    });
  } catch (error) {
    next(error);
  }
};
