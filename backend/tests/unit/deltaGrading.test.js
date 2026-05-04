// ═══════════════════════════════════════════════════════════════════
//  Delta-Based Cumulative Grading — Test Matrix
//  Proves the ledger logic from the guide's 4 test scenarios
// ═══════════════════════════════════════════════════════════════════
import { jest } from "@jest/globals";

// ── Shared mock state ────────────────────────────────────────────
// We track a running total_points to simulate the DB across all 4 tests
let studentTotalPoints = 0;

// ── Mock factories ───────────────────────────────────────────────
const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

const createMockSubmission = (overrides = {}) => ({
  submission_id: 1,
  content_id: 10,
  student_id: 42,
  grade: null,
  feedback: null,
  status: "pending",
  lessonContent: {
    CourseSection: {
      Course: { course_id: 1, instructor_id: 99 },
    },
  },
  update: jest.fn(async function (data) {
    // Simulate Sequelize instance update
    Object.assign(this, data);
  }),
  reload: jest.fn(async function () {
    return this;
  }),
  ...overrides,
});

// ── Module mocks ─────────────────────────────────────────────────
// We must mock before importing the service
jest.unstable_mockModule("../../src/config/index.js", () => ({
  sequelize: {
    transaction: jest.fn(async () => mockTransaction),
    literal: jest.fn((expr) => ({ val: expr })),
  },
}));

let mockSubmission;

jest.unstable_mockModule("../../src/models/index.js", () => ({
  AssignmentSubmission: {
    findByPk: jest.fn(async () => mockSubmission),
  },
  Notification: {
    create: jest.fn(async () => ({})),
  },
  LessonContent: {
    count: jest.fn(async () => 5),
    findAll: jest.fn(async () => []),
  },
  CourseSection: {
    findAll: jest.fn(async () => []),
  },
  Course: {},
  User: {},
  LessonProgress: {
    findOrCreate: jest.fn(async () => [{ status: "completed", update: jest.fn() }, true]),
  },
  Enrollment: {
    findOne: jest.fn(async () => null),
  },
  Student: {
    update: jest.fn(async (_data, _opts) => {
      // Simulate the DB-level `total_points = total_points + delta`
      // by extracting the delta from the literal expression
      const literal = _data.total_points;
      if (literal && literal.val) {
        const match = literal.val.match(/total_points \+ (-?\d+)/);
        if (match) {
          studentTotalPoints += parseInt(match[1], 10);
        }
      }
      return [1]; // affectedRows
    }),
  },
}));

jest.unstable_mockModule("../../src/utilis/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

// ── Import after mocks ──────────────────────────────────────────
const { reviewSubmission } = await import("../../src/services/assignmentService.js");
const { Student } = await import("../../src/models/index.js");
const { sequelize } = await import("../../src/config/index.js");

// ═══════════════════════════════════════════════════════════════════
//  THE TEST MATRIX — sequential scenario chain
// ═══════════════════════════════════════════════════════════════════
describe("Delta-Based Cumulative Grading System", () => {
  const INSTRUCTOR_ID = 99;
  const SUBMISSION_ID = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.commit.mockClear();
    mockTransaction.rollback.mockClear();
  });

  // ─────────────────────────────────────────────────────────────
  //  Scenario 1: First Grade (Standard Path)
  //  Baseline: 0 (pending) | New: 80 | Delta: +80 | Total: 80
  // ─────────────────────────────────────────────────────────────
  test("Scenario 1 — First grade: delta = +80, total becomes 80", async () => {
    mockSubmission = createMockSubmission({
      status: "pending",
      grade: null,
    });

    await reviewSubmission(SUBMISSION_ID, INSTRUCTOR_ID, {
      grade: 80,
      feedback: "Good work",
    });

    // Verify submission was updated
    expect(mockSubmission.update).toHaveBeenCalledWith(
      { grade: 80, feedback: "Good work", status: "graded" },
      expect.objectContaining({ transaction: mockTransaction })
    );

    // Verify Student.update was called with delta = +80
    expect(Student.update).toHaveBeenCalledWith(
      { total_points: sequelize.literal("total_points + 80") },
      { where: { user_id: 42 }, transaction: mockTransaction }
    );

    // Verify running total
    expect(studentTotalPoints).toBe(80);

    // Transaction committed
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────
  //  Scenario 2: Upward Correction (Regrading Higher)
  //  Baseline: 80 | New: 95 | Delta: +15 | Total: 95
  // ─────────────────────────────────────────────────────────────
  test("Scenario 2 — Upward regrade: delta = +15, total becomes 95", async () => {
    mockSubmission = createMockSubmission({
      status: "graded",
      grade: 80,
    });

    await reviewSubmission(SUBMISSION_ID, INSTRUCTOR_ID, {
      grade: 95,
      feedback: "Missed a page, corrected",
    });

    // Verify delta = 95 - 80 = +15
    expect(Student.update).toHaveBeenCalledWith(
      { total_points: sequelize.literal("total_points + 15") },
      { where: { user_id: 42 }, transaction: mockTransaction }
    );

    // Running total: 80 + 15 = 95
    expect(studentTotalPoints).toBe(95);
  });

  // ─────────────────────────────────────────────────────────────
  //  Scenario 3: Downward Correction (Penalty)
  //  Baseline: 95 | New: 60 | Delta: -35 | Total: 60
  // ─────────────────────────────────────────────────────────────
  test("Scenario 3 — Downward regrade: delta = -35, total becomes 60", async () => {
    mockSubmission = createMockSubmission({
      status: "graded",
      grade: 95,
    });

    await reviewSubmission(SUBMISSION_ID, INSTRUCTOR_ID, {
      grade: 60,
      feedback: "Late submission penalty",
    });

    // Verify delta = 60 - 95 = -35
    expect(Student.update).toHaveBeenCalledWith(
      { total_points: sequelize.literal("total_points + -35") },
      { where: { user_id: 42 }, transaction: mockTransaction }
    );

    // Running total: 95 + (-35) = 60
    expect(studentTotalPoints).toBe(60);
  });

  // ─────────────────────────────────────────────────────────────
  //  Scenario 4: Idempotency Check (Accidental Double-Click)
  //  Baseline: 60 | New: 60 | Delta: 0 | Total: 60
  // ─────────────────────────────────────────────────────────────
  test("Scenario 4 — Idempotent double-click: delta = 0, total stays 60", async () => {
    mockSubmission = createMockSubmission({
      status: "graded",
      grade: 60,
    });

    await reviewSubmission(SUBMISSION_ID, INSTRUCTOR_ID, {
      grade: 60,
      feedback: "Late submission penalty",
    });

    // Verify delta = 60 - 60 = 0
    expect(Student.update).toHaveBeenCalledWith(
      { total_points: sequelize.literal("total_points + 0") },
      { where: { user_id: 42 }, transaction: mockTransaction }
    );

    // Running total unchanged: 60 + 0 = 60
    expect(studentTotalPoints).toBe(60);

    // System is immune to duplicate requests
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
  });
});
