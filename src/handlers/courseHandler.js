import Course from "../models/Course.js";
import AppError from "../utilis/AppError.js";

// POST /api/courses — instructor creates a new course
export const createCourse = async (req, res, next) => {
  try {
    // ✅ WHITELIST: only accept fields the instructor is allowed to set on creation
    const { title, description, price, level, category_id, thumbnail_url } =
      req.body;

    if (!title) {
      return next(new AppError("Title is required", 400));
    }

    const course = await Course.create({
      title,
      description,
      price,
      level,
      category_id,
      thumbnail_url,
      instructor_id: req.user.user_id, // always from token — never from body
      status: "draft",                 // new courses always start as draft
    });

    res.status(201).json({
      status: "success",
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/courses — paginated list of published courses
export const getAllCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // cap at 50
    const offset = (page - 1) * limit;

    const { count, rows: courses } = await Course.findAndCountAll({
      where: { status: "published" },
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      data: { courses },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/courses/my-courses — instructor's own courses
export const getMyCourses = async (req, res, next) => {
  try {
    const courses = await Course.findAll({
      where: { instructor_id: req.user.user_id },
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      results: courses.length,
      data: { courses },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/courses/:id — update a course (ownership enforced)
export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    // 🔥 Ownership check — only the owning instructor (or admin) may update
    if (
      req.user.role !== "admin" &&
      course.instructor_id !== req.user.user_id
    ) {
      return next(
        new AppError("You are not allowed to modify this course", 403)
      );
    }

    // ✅ FIX: Strict whitelist — only these fields can be updated via API.
    // instructor_id, status transitions are intentionally excluded from here.
    const {
      title,
      description,
      price,
      level,
      thumbnail_url,
      category_id,
    } = req.body;

    // Validate: price cannot be negative
    if (price !== undefined && price < 0) {
      return next(new AppError("Price cannot be negative", 400));
    }

    // Business Rule: instructors cannot change price once there are active enrollments
    // (admins are exempt from this rule)
    // TODO: implement enrollment check when Enrollment service is active

    await course.update({
      title,
      description,
      price,
      level,
      thumbnail_url,
      category_id,
    });

    res.status(200).json({
      status: "success",
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/courses/:id/publish — publish a course (ownership enforced)
export const publishCourse = async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [{ association: "sections", include: [{ association: "lessons" }] }],
    });

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    if (
      req.user.role !== "admin" &&
      course.instructor_id !== req.user.user_id
    ) {
      return next(
        new AppError("You are not allowed to publish this course", 403)
      );
    }

    // 🧠 Business Logic: enforce publishing rules
    if (!course.sections || course.sections.length === 0) {
      return next(
        new AppError(
          "A course must have at least one section before publishing",
          422
        )
      );
    }

    const hasLesson = course.sections.some(
      (s) => s.lessons && s.lessons.length > 0
    );
    if (!hasLesson) {
      return next(
        new AppError(
          "Each section must have at least one lesson before publishing",
          422
        )
      );
    }

    await course.update({ status: "published" });

    res.status(200).json({
      status: "success",
      message: "Course published successfully",
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/courses/:id — soft-delete a course (ownership enforced)
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    // 🔥 Ownership check
    if (
      req.user.role !== "admin" &&
      course.instructor_id !== req.user.user_id
    ) {
      return next(
        new AppError("You are not allowed to delete this course", 403)
      );
    }

    await course.destroy(); // paranoid: true makes this a soft-delete

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
