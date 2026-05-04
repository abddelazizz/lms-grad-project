import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { sendContactUsEmail } from "../utils/sendEmails.js";

export const submitContactForm = catchAsync(async (req, res) => {
  const { firstName, lastName, email, phone, subject, message } = req.body;

  if (!firstName || !lastName || !email || !subject || !message) {
    throw new AppError("Please fill out all required fields.", 400);
  }

  // Send the email to the admin
  await sendContactUsEmail({ firstName, lastName, email, phone, subject, message });

  res.status(200).json({
    status: "success",
    message: "Your message has been sent successfully. We will contact you soon!",
  });
});
