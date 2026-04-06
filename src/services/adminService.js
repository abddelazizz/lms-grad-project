import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import AppError from "../utilis/AppError.js";

// ─── Create Instructor ──────────────────────────────────────────
export const createInstructor = async (name, email, password) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const instructor = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "instructor",
    is_verified: true, // admin-created accounts are pre-verified
  });

  // Exclude sensitive data before returning
  const { password: _, ...instructorData } = instructor.toJSON();

  return instructorData;
};
