/**
 * Integration tests for /api/courses endpoints.
 * Uses Supertest to fire real HTTP requests against the Express app.
 * DB is NOT mocked here — runs against the test database configured via NODE_ENV=test.
 *
 * Setup required: .env.test with a separate TEST database.
 */
import request from "supertest";
import app from "../../src/app.js";

// ─── Auth Helpers ─────────────────────────────────────────────
// In real tests, these would call /auth/login to get valid tokens.
// Replace with real test credentials from your test DB seed.
const INSTRUCTOR_TOKEN = process.env.TEST_INSTRUCTOR_TOKEN || "instructor_test_token";
const STUDENT_TOKEN = process.env.TEST_STUDENT_TOKEN || "student_test_token";
const INVALID_TOKEN = "this.is.invalid";

// ─────────────────────────────────────────────────────────────
describe("GET /api/courses", () => {
  it("should return paginated published courses for authenticated user", async () => {
    const res = await request(app)
      .get("/api/courses")
      .set("Authorization", `Bearer ${INSTRUCTOR_TOKEN}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("page");
    expect(res.body).toHaveProperty("total");
  });

  it("should return 401 for unauthenticated request", async () => {
    const res = await request(app).get("/api/courses");
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
describe("POST /api/courses", () => {
  it("should return 403 if student tries to create a course", async () => {
    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${STUDENT_TOKEN}`)
      .send({ title: "Hacked course", price: 0 });

    expect(res.statusCode).toBe(403);
  });

  it("should return 400 if title is missing", async () => {
    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${INSTRUCTOR_TOKEN}`)
      .send({ price: 10 }); // missing title

    expect(res.statusCode).toBe(400);
  });

  it("should return 401 for unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/courses")
      .send({ title: "Test Course", price: 10 });

    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
describe("PATCH /api/courses/:id", () => {
  it("should return 400 if price is negative", async () => {
    const res = await request(app)
      .patch("/api/courses/1")
      .set("Authorization", `Bearer ${INSTRUCTOR_TOKEN}`)
      .send({ price: -50 });

    expect([400, 404]).toContain(res.statusCode); // 404 if course not in test DB
  });

  it("should return 401 without token", async () => {
    const res = await request(app).patch("/api/courses/1").send({ title: "X" });
    expect(res.statusCode).toBe(401);
  });

  it("should not allow mass assignment of instructor_id", async () => {
    const res = await request(app)
      .patch("/api/courses/1")
      .set("Authorization", `Bearer ${INSTRUCTOR_TOKEN}`)
      .send({ instructor_id: 999, title: "Hijack" });

    // instructor_id should be silently ignored, not cause failure
    expect([200, 403, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.data.course.instructor_id).not.toBe(999);
    }
  });
});
