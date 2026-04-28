import { jest } from "@jest/globals";

const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn();
const mockStudentFindByPk = jest.fn();
const mockStudentCreate = jest.fn();
const mockTransaction = jest.fn();

jest.unstable_mockModule("../../src/models/index.js", () => ({
  User: {
    findOne: mockUserFindOne,
    create: mockUserCreate,
  },
  Instructor: {},
  Student: {
    findByPk: mockStudentFindByPk,
    create: mockStudentCreate,
  },
  Course: {},
  Enrollment: {},
}));

jest.unstable_mockModule("../../src/config/index.js", () => ({
  sequelize: {
    transaction: mockTransaction,
  },
}));

jest.unstable_mockModule("../../src/utilis/logger.js", () => ({
  auditLog: jest.fn(),
}));

const mockHash = jest.fn();
jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: mockHash,
  },
}));

const { createStudent, createStudentAccount } = await import("../../src/services/adminService.js");

describe("adminService.createStudentAccount()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindOne.mockResolvedValue(null);
    mockHash.mockResolvedValue("$hashed");
    mockUserCreate.mockResolvedValue({
      user_id: 10,
      email: "student@test.com",
      toJSON() {
        return { user_id: 10, email: "student@test.com", role: "student" };
      },
    });
    mockStudentFindByPk.mockResolvedValue(null);
    mockStudentCreate.mockResolvedValue({
      user_id: 10,
      grade_level: "Grade 11",
      parent_id: 4,
    });
    mockTransaction.mockImplementation(async (callback) => callback("tx"));
  });

  it("creates both the user and student rows inside one transaction", async () => {
    const result = await createStudentAccount({
      name: "Student",
      email: "student@test.com",
      password: "Pass1!",
      gradeLevel: "Grade 11",
      parentId: 4,
    });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Student",
        email: "student@test.com",
        password: "$hashed",
        role: "student",
      }),
      { transaction: "tx" }
    );
    expect(mockStudentCreate).toHaveBeenCalledWith(
      {
        user_id: 10,
        grade_level: "Grade 11",
        parent_id: 4,
      },
      { transaction: "tx" }
    );
    expect(result.user.user_id).toBe(10);
  });

  it("does not create a duplicate account when email already exists", async () => {
    mockUserFindOne.mockResolvedValue({ user_id: 1 });

    await expect(
      createStudentAccount({
        name: "Student",
        email: "student@test.com",
        password: "Pass1!",
      })
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

describe("adminService.createStudent()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindOne.mockResolvedValue(null);
    mockHash.mockResolvedValue("$hashed");
    mockUserCreate.mockResolvedValue({
      user_id: 15,
      email: "admin-created@test.com",
      toJSON() {
        return {
          user_id: 15,
          email: "admin-created@test.com",
          role: "student",
          password: "$hashed",
        };
      },
    });
    mockStudentFindByPk.mockResolvedValue(null);
    mockStudentCreate.mockResolvedValue({
      user_id: 15,
      grade_level: "Grade 12",
      parent_id: null,
    });
    mockTransaction.mockImplementation(async (callback) => callback("tx"));
  });

  it("returns a student response that includes the student profile fields", async () => {
    const result = await createStudent(
      "Admin Student",
      "admin-created@test.com",
      "Pass1!",
      "Grade 12",
      null
    );

    expect(result).toEqual(
      expect.objectContaining({
        user_id: 15,
        email: "admin-created@test.com",
        studentProfile: {
          grade_level: "Grade 12",
          parent_id: null,
        },
      })
    );
  });
});
