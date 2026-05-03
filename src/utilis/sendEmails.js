import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const url = `${process.env.BASE_URL}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Email Verification</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${url}">Verify Email</a>
    `,
  });
};

const sendPasswordResetEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2c3e50;">Password Reset Code</h2>
        <p>You requested a password reset. Use the code below to set a new password:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border: 1px solid #ddd; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

const sendContactUsEmail = async (contactDetails) => {
  const { firstName, lastName, email, phone, subject, message } = contactDetails;
  
  await transporter.sendMail({
    from: email,
    to: process.env.EMAIL_USER,
    subject: `New Contact Inquiry: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2c3e50;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <hr />
        <h3>Message:</h3>
        <p style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
          ${message}
        </p>
      </div>
    `,
  });
};

const sendPasswordChangeNotification = async (email) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your password was changed",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2c3e50;">Password Changed</h2>
        <p>Your account password was recently changed. If you did not make this change, please contact support immediately and reset your password.</p>
      </div>
    `,
  });
};

export { sendVerificationEmail, sendPasswordResetEmail, sendContactUsEmail, sendPasswordChangeNotification };