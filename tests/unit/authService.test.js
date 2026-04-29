/**
 * Unit tests for critical utility functions.
 * DB and email services are mocked — no real DB connection needed.
 */
import { jest } from "@jest/globals";

// ─── Mock DB models before importing service ──────────────────
const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn();
const mockCreateStudentAccount = jest.fn();
const mockEnsureStudentProfile = jest.fn();

jest.unstable_mockModule("../../src/models/index.js", () => ({
  User: {
    findOne: mockUserFindOne,
    create: mockUserCreate,
  },
}));

jest.unstable_mockModule("../../src/services/adminService.js", () => ({
  createStudentAccount: mockCreateStudentAccount,
  ensureStudentProfile: mockEnsureStudentProfile,
}));

// ─── Mock Email sending ───────────────────────────────────────
const mockSendVerificationEmail = jest.fn().mockResolvedValue(undefined);
const mockSendPasswordResetEmail = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule("../../src/utilis/index.js", () => ({
  hashPassword: jest.fn().mockResolvedValue("$hashed"),
  comparePassword: jest.fn().mockResolvedValue(true),
  generateToken: jest.fn().mockReturnValue("mock.jwt.token"),
  sendVerificationEmail: mockSendVerificationEmail,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
    }
  },
}));

// ─── Mock Logger ─────────────────────────────────────────────
jest.unstable_mockModule("../../src/utilis/logger.js", () => ({
  securityLog: jest.fn(),
  auditLog: jest.fn(),
}));

const { login, signup } = await import("../../src/services/authService.js");

// ─────────────────────────────────────────────────────────────
describe("authService.login()", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should throw 401 if user is not found", async () => {
    mockUserFindOne.mockResolvedValue(null);
    await expect(login("nouser@test.com", "pass")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid credentials.",
    });
  });

  it("should throw 403 if user is not verified", async () => {
    mockUserFindOne.mockResolvedValue({
      user_id: 1,
      email: "user@test.com",
      is_verified: false,
      password: "$hashed",
    });
    await expect(login("user@test.com", "pass")).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("should return { user, token } on successful login", async () => {
    mockUserFindOne.mockResolvedValue({
      user_id: 1,
      name: "Test User",
      email: "user@test.com",
      role: "student",
      is_verified: true,
      password: "$hashed",
      toJSON: function () { return { ...this }; },
    });

    const { comparePassword } = await import("../../src/utilis/index.js");
    comparePassword.mockResolvedValue(true);

    const result = await login("user@test.com", "password123");
    expect(result).toHaveProperty("token", "mock.jwt.token");
    expect(result.user).not.toHaveProperty("password");
  });
});

// ─────────────────────────────────────────────────────────────
describe("authService.signup()", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should throw 409 if email already exists", async () => {
    mockUserFindOne.mockResolvedValue({ user_id: 1 });
    await expect(signup({ name: "Test", email: "existing@test.com", password: "Pass1!", role: "student" }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it("should create user and send verification email on success", async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockCreateStudentAccount.mockResolvedValue({
      user: { user_id: 2, email: "new@test.com" },
      studentProfile: { user_id: 2, grade_level: "Grade 10", parent_id: null },
    });

    const result = await signup({
      name: "New User",
      email: "new@test.com",
      password: "Pass1!",
      role: "student",
      gradeLevel: "Grade 10",
    });
    expect(mockCreateStudentAccount).toHaveBeenCalledTimes(1);
    expect(mockCreateStudentAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New User",
        email: "new@test.com",
        password: "Pass1!",
        gradeLevel: "Grade 10",
        isVerified: false,
      })
    );
    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty("user_id", 2);
  });

  it("should create only a user row for instructor signup", async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ user_id: 3, email: "teacher@test.com" });

    const result = await signup({
      name: "Teacher",
      email: "teacher@test.com",
      password: "Pass1!",
      role: "instructor",
    });

    expect(mockCreateStudentAccount).not.toHaveBeenCalled();
    expect(mockUserCreate).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty("user_id", 3);
  });
});
