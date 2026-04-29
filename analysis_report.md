# EvolveSight LMS — Full Project Audit Report
> **Last Updated:** April 29, 2026  
> **Scope:** Every file in both Frontend (32 files) and Backend (62 files)

---

## Part 1: Frontend Status

### 1.1 Files Reviewed (32 total)
- **Pages (24):** Login, Signup, ForgotPassword, VerifyEmail, ResetPassword, GoogleAuthSuccess, Dashboard, StudentDashboardContent, InstructorDashboard, AdminDashboard, Courses, CourseDetails, CoursePlayer, CourseBuilder, InstructorUpload, QuizGenerator, QuizDetails, Assignment, Assignments, Chat, Inbox, Settings, Contact, About
- **Components (5):** Navbar, Sidebar, ProfileSidebar, Footer, Banner
- **Sections (3):** Hero, Benefits, Courses (landing)

### 1.2 Frontend Pages — Full Status

| Page | API Connection | الحالة |
|------|---------------|--------|
| `Login.jsx` | `POST /api/auth/login` + Google OAuth | ✅ مربوط وشغال |
| `Signup.jsx` | `POST /api/auth/signup` + resend verification | ✅ مربوط وشغال |
| `ForgotPassword.jsx` | `POST /api/auth/forgot-password` | ✅ مربوط وشغال |
| `VerifyEmail.jsx` | `POST /api/auth/verify-reset-otp` | ✅ مربوط وشغال |
| `ResetPassword.jsx` | `POST /api/auth/reset-password` | ✅ مربوط وشغال |
| `GoogleAuthSuccess.jsx` | Token handling from Google callback | ✅ مربوط وشغال |
| `Dashboard.jsx` | Role-based routing (student/instructor/admin) | ✅ مربوط وشغال |
| `StudentDashboardContent.jsx` | `GET /api/courses/my-courses` | ✅ مربوط وشغال |
| `InstructorDashboard.jsx` | `GET /api/instructor/dashboard-stats` + `GET /api/instructor/courses/:id/details` | ✅ مربوط وشغال |
| `AdminDashboard.jsx` | `GET /api/admin/dashboard/stats` + CRUD instructors/students | ✅ مربوط وشغال |
| `Courses.jsx` (page) | `GET /api/courses?page=&limit=` | ✅ مربوط وشغال |
| `CourseDetails.jsx` | `GET /api/courses/:id` + `POST /api/enrollments` | ⚠️ Enroll path mismatch |
| `CoursePlayer.jsx` | `GET /api/courses/:id` + `GET /api/lessons/:id/watch` | ✅ مربوط وشغال |
| `CourseBuilder.jsx` | `POST /api/courses` + `POST /api/courses/:id/sections` | ✅ مربوط وشغال |
| `InstructorUpload.jsx` | `POST /api/sections/:id/lessons` | ✅ مربوط وشغال |
| `QuizDetails.jsx` | `GET /api/quizzes/:id` + `POST /api/quizzes/:id/submit` | ✅ مربوط وشغال |
| `QuizGenerator.jsx` | `POST /api/quizzes/generate` | ❌ Backend endpoint مش موجود |
| `Assignment.jsx` (detail) | `GET /api/assignments/:id` + `POST /api/assignments/:id/upload` | ⚠️ GET مش موجود في Backend |
| `Assignments.jsx` (list) | `GET /api/assignments` | ❌ Backend endpoint مش موجود |
| `Chat.jsx` | `GET /api/chat` + `POST /api/chat` | ❌ Backend endpoint مش موجود |
| `Inbox.jsx` | `GET /api/inbox` | ❌ Backend endpoint مش موجود |
| `Settings.jsx` | `GET/PATCH /api/students/profile` + photo upload | ✅ مربوط وشغال |
| `Contact.jsx` | `POST /api/contact` | ✅ مربوط وشغال |
| `About.jsx` | Static page — no API needed | ✅ تمام |

### 1.3 Components & Sections Status

| Component/Section | الحالة | ملاحظات |
|-------------------|--------|---------|
| `Navbar.jsx` | ✅ تمام | Dynamic avatar from `ui-avatars.com` or user picture |
| `Sidebar.jsx` | ✅ تمام | Role-based nav items |
| `ProfileSidebar.jsx` | ✅ تمام | Dynamic user data, empty states for students/mentors |
| `Footer.jsx` | ✅ تمام | Branded contact info (Recode Academy) |
| `Banner.jsx` | ✅ تمام | Static promotional banner |
| `sections/Hero.jsx` | ✅ تمام | Static hero with local image |
| `sections/Benefits.jsx` | ✅ تمام | Static content, no dummy text |
| `sections/Courses.jsx` | ✅ تمام | Fetches from `GET /api/courses` |

### 1.4 Frontend Cleanup Done (This Session)

- ✅ Removed all Unsplash external images (CoursePlayer, About)
- ✅ Removed all Lorem Ipsum text (Benefits, Courses sections)
- ✅ Removed all dummy date/time placeholders (`00/00/0000`, `00:00`)
- ✅ Removed hardcoded titles ("UI UX Assignment One", "quiz one")
- ✅ Removed fake contact info ("skillbridge.com", "+91...", "Somewhere in the World")
- ✅ Removed hardcoded bar chart data and fake Student/Mentor names from ProfileSidebar
- ✅ Downloaded Google logo SVG locally → reverted back to Wikimedia per user preference
- ✅ Removed stale "dummy removed" comments
- ✅ All pages now use API data or proper empty states

---

## Part 2: Backend Status

### 2.1 Files Reviewed (62 total)
- **Models (17):** User, Course, CourseSection, LessonContent, Enrollment, LessonProgress, Review, Instructor, Student, Quiz, QuizAttempt, AssignmentSubmission, VideoProgress, Admin, Parent, test, index
- **Handlers (13):** auth, course, admin, student, instructor, section, lesson, enrollment, quiz, assignment, contact, test, index
- **Routes (13):** auth, course, admin, student, instructor, section, lesson, enrollment, quiz, assignment, contact, test, index
- **Services (9):** auth, course, admin, student, section, lesson, enrollment, test, index
- **Middlewares (10):** auth, restrictTo, checkOwnership, upload, validation, error, notFound, rateLimiter, roleMiddlewares, index
- **Config (3):** database, passport, index
- **Utilities (9):** AppError, catchAsync, hashpassword, jwt, logger, scrubUser, sendEmails, userDefaults, index
- **Validations (4):** auth, course, admin, index

### 2.2 Backend Endpoints — Full Status

#### Auth (`/api/auth`) — ✅ كامل
| Method | Endpoint | Handler | الحالة |
|--------|----------|---------|--------|
| POST | `/signup` | `signup` | ✅ مربوط بـ `Signup.jsx` |
| POST | `/login` | `login` | ✅ مربوط بـ `Login.jsx` |
| GET | `/verify-email` | `verifyEmail` | ✅ مربوط (link-based) |
| POST | `/forgot-password` | `forgotPassword` | ✅ مربوط بـ `ForgotPassword.jsx` |
| POST | `/resend-verification` | `resendVerification` | ✅ مربوط بـ `Signup.jsx` |
| POST | `/verify-reset-otp` | `verifyResetOTP` | ✅ مربوط بـ `VerifyEmail.jsx` |
| POST | `/reset-password` | `resetPassword` | ✅ مربوط بـ `ResetPassword.jsx` |
| GET | `/google` | Passport Google | ✅ مربوط بـ `Login.jsx` + `Signup.jsx` |
| GET | `/google/callback` | `googleAuthCallback` | ✅ مربوط بـ `GoogleAuthSuccess.jsx` |

#### Courses (`/api/courses`) — ✅ كامل
| Method | Endpoint | Handler | الحالة |
|--------|----------|---------|--------|
| GET | `/` | `getAllCourses` | ✅ مربوط بـ `Courses.jsx` + `sections/Courses.jsx` |
| GET | `/my-courses` | `getMyCourses` | ✅ مربوط بـ `StudentDashboardContent.jsx` + `InstructorDashboard.jsx` |
| GET | `/:id` | `getCourseDetails` | ✅ مربوط بـ `CourseDetails.jsx` + `CoursePlayer.jsx` |
| GET | `/:id/details` | `getCourseDetails` | ✅ مربوط بـ `CourseDetails.jsx` |
| POST | `/` | `createCourse` | ✅ مربوط بـ `CourseBuilder.jsx` |
| PATCH | `/:id` | `updateCourse` | ✅ مربوط بـ Frontend service |
| PATCH | `/:id/publish` | `publishCourse` | ✅ مربوط بـ Frontend service |
| DELETE | `/:id` | `deleteCourse` | ✅ مربوط بـ Frontend service |

#### Admin (`/api/admin`) — ✅ كامل
| Method | Endpoint | Handler | الحالة |
|--------|----------|---------|--------|
| GET | `/dashboard/stats` | `getAdminDashboardStats` | ✅ مربوط بـ `AdminDashboard.jsx` |
| POST | `/instructors` | `createInstructor` | ✅ مربوط بـ `AdminDashboard.jsx` |
| GET | `/instructors` | `getAllInstructors` | ✅ مربوط بـ `AdminDashboard.jsx` |
| GET | `/instructors/:id` | `getInstructorById` | ✅ موجود بس مش مستخدم في Frontend |
| DELETE | `/instructors/:id` | `removeInstructor` | ✅ مربوط بـ `AdminDashboard.jsx` |
| POST | `/students` | `createStudent` | ✅ مربوط بـ `AdminDashboard.jsx` |
| GET | `/students` | `getAllStudents` | ✅ مربوط بـ `AdminDashboard.jsx` |
| GET | `/students/:id` | `getStudentById` | ✅ موجود بس مش مستخدم في Frontend |
| DELETE | `/students/:id` | `removeStudent` | ✅ مربوط بـ `AdminDashboard.jsx` |

#### Student (`/api/students`) — ✅ كامل
| Method | Endpoint | Handler | الحالة |
|--------|----------|---------|--------|
| GET | `/profile` | `getProfile` | ✅ مربوط بـ `Settings.jsx` |
| PATCH | `/profile` | `updateProfile` | ✅ مربوط بـ `Settings.jsx` |
| PATCH | `/profile/photo` | `uploadProfilePicture` | ✅ مربوط بـ `Settings.jsx` |
| PATCH | `/:id/profile-picture` | `uploadProfilePicture` | ✅ Legacy route |

#### Instructor (`/api/instructor`) — ✅ كامل
| Method | Endpoint | Handler | الحالة |
|--------|----------|---------|--------|
| GET | `/dashboard-stats` | `getDashboardStats` | ✅ مربوط بـ `InstructorDashboard.jsx` |
| GET | `/courses/:id/details` | `getCourseDetails` | ✅ مربوط بـ `InstructorDashboard.jsx` modal |

#### Sections (`/api/courses/:courseId/sections`) — ✅ كامل
| Method | Endpoint | Handler | الحالة |
|--------|----------|---------|--------|
| POST | `/courses/:courseId/sections` | `createSection` | ✅ مربوط بـ `CourseBuilder.jsx` |

#### Lessons — ✅ كامل
| Method | Endpoint | Handler | الحالة |
|--------|----------|---------|--------|
| POST | `/api/sections/:sectionId/lessons` | `createUnifiedLesson` | ✅ مربوط بـ `InstructorUpload.jsx` |
| PATCH | `/api/courses/:courseId/thumbnail` | `uploadThumbnail` | ✅ مربوط بـ Frontend service |
| DELETE | `/api/lessons/:lessonId` | `deleteLesson` | ✅ مربوط بـ `InstructorDashboard.jsx` |

#### Enrollment & Progress — ⚠️ مسار مختلف
| Method | Endpoint (Backend) | Handler | مشكلة |
|--------|-------------------|---------|-------|
| POST | `/api/courses/:courseId/enroll` | `enrollStudent` | ⚠️ Frontend يستدعي `POST /api/enrollments` |
| GET | `/api/lessons/:lessonId/watch` | `watchLesson` | ✅ مربوط بـ `CoursePlayer.jsx` |
| PATCH | `/api/progress/lessons/:lessonId` | `updateProgress` | ✅ مربوط |
| — | — | — | ❌ مفيش `GET /api/enrollments` |

#### Quiz (`/api/quizzes`) — ⚠️ جزئي
| Method | Endpoint | Handler | الحالة |
|--------|----------|---------|--------|
| GET | `/:id` | `getQuiz` | ✅ مربوط بـ `QuizDetails.jsx` |
| POST | `/:id/submit` | `submitQuizAttempt` | ✅ مربوط بـ `QuizDetails.jsx` |
| POST | `/generate` | — | ❌ **مش موجود** — `QuizGenerator.jsx` محتاجه |

#### Assignments (`/api/assignments`) — ⚠️ جزئي
| Method | Endpoint | Handler | الحالة |
|--------|----------|---------|--------|
| POST | `/:contentId/upload` | `submitAssignment` | ✅ مربوط بـ `Assignment.jsx` |
| GET | `/` | — | ❌ **مش موجود** — `Assignments.jsx` محتاجه |
| GET | `/:id` | — | ❌ **مش موجود** — `Assignment.jsx` محتاجه |

#### Contact (`/api/contact`) — ✅ كامل
| Method | Endpoint | Handler | الحالة |
|--------|----------|---------|--------|
| POST | `/` | `submitContactForm` | ✅ مربوط بـ `Contact.jsx` |

---

## Part 3: Models Database

### 3.1 Active Models (مستخدمة وشغالة)
| Model | Table | مستخدم في |
|-------|-------|----------|
| `User` | `users` | Auth, Profile, Admin, everywhere |
| `Course` | `courses` | Course CRUD, Dashboard, Details |
| `CourseSection` | `course_sections` | CourseBuilder, CourseDetails |
| `LessonContent` | `lesson_contents` | InstructorUpload, CoursePlayer |
| `Enrollment` | `enrollments` | Enrollment, Progress tracking |
| `LessonProgress` | `lesson_progress` | Progress tracking |
| `Instructor` | `instructors` | Admin, Settings (instructor profile) |
| `Student` | `students` | Admin, Settings (student profile) |
| `Quiz` | `quizzes` | QuizDetails |
| `QuizAttempt` | `quiz_attempts` | Quiz submission |
| `AssignmentSubmission` | `assignment_submissions` | Assignment upload |

### 3.2 Partially Used Models
| Model | Table | المشكلة |
|-------|-------|---------|
| `Review` | `reviews` | Model + Associations defined. Used in `instructorHandler.js` for avg_rating calculation. **But no CRUD routes/handlers exist, and no frontend page** |

### 3.3 Orphan Models (مش مستخدمة خالص)
| Model | Table | المشكلة |
|-------|-------|---------|
| `VideoProgress` | `video_progress` | Not imported in `models/index.js`, no associations, no handlers, no routes |
| `Admin` | `admins` | Not imported in `models/index.js`, admin role lives in `users` table |
| `Parent` | `parents` | Empty model (user_id only), not imported, no logic anywhere |

---

## Part 4: Summary of Issues

### 🔴 Missing Backend Endpoints (Frontend ready, Backend not)
| # | Feature | Frontend Page | Missing Backend |
|---|---------|---------------|----------------|
| 1 | **Chat** | `Chat.jsx` | No Model, Handler, Route, or Service for `/api/chat` |
| 2 | **Inbox** | `Inbox.jsx` | No Model, Handler, Route, or Service for `/api/inbox` |
| 3 | **Assignments List** | `Assignments.jsx` | No `GET /api/assignments` handler |
| 4 | **Assignment Details** | `Assignment.jsx` | No `GET /api/assignments/:id` handler |
| 5 | **Quiz Generation** | `QuizGenerator.jsx` | No `POST /api/quizzes/generate` handler |

### 🟡 Path Mismatch (Frontend ↔ Backend)
| # | Issue | Frontend Calls | Backend Expects |
|---|-------|---------------|----------------|
| 1 | Enrollment Create | `POST /api/enrollments` with `{ course_id }` | `POST /api/courses/:courseId/enroll` |
| 2 | Enrollment List | `GET /api/enrollments` | Route does not exist |
| 3 | Enrollment Update | `PATCH /api/enrollments/:id` | Route does not exist |

### 🟠 Orphan/Unused Code
| # | File | Type | Issue |
|---|------|------|-------|
| 1 | `VideoProgress.js` | Model | Not imported, not used anywhere |
| 2 | `Admin.js` | Model | Not imported, redundant (role in users table) |
| 3 | `Parent.js` | Model | Not imported, empty shell |
| 4 | `Review.js` | Model | Has associations but no CRUD API or frontend page |

---

## Part 5: What's Fully Working (End-to-End)

| # | Feature | Frontend | Backend | Status |
|---|---------|----------|---------|--------|
| 1 | User Registration (Email + Google) | ✅ | ✅ | 🟢 Complete |
| 2 | User Login (Email + Google) | ✅ | ✅ | 🟢 Complete |
| 3 | Email Verification (Link-based) | ✅ | ✅ | 🟢 Complete |
| 4 | Forgot Password → OTP → Reset | ✅ | ✅ | 🟢 Complete |
| 5 | Profile Management (View/Edit/Photo) | ✅ | ✅ | 🟢 Complete |
| 6 | Browse Published Courses | ✅ | ✅ | 🟢 Complete |
| 7 | View Course Details + Curriculum | ✅ | ✅ | 🟢 Complete |
| 8 | Course Player (Video/PDF streaming) | ✅ | ✅ | 🟢 Complete |
| 9 | Create Course + Add Sections | ✅ | ✅ | 🟢 Complete |
| 10 | Upload Lessons (Video/PDF/Assignment) | ✅ | ✅ | 🟢 Complete |
| 11 | Upload Course Thumbnail | ✅ | ✅ | 🟢 Complete |
| 12 | Delete Lesson | ✅ | ✅ | 🟢 Complete |
| 13 | Publish Course | ✅ | ✅ | 🟢 Complete |
| 14 | Student Dashboard (My Courses) | ✅ | ✅ | 🟢 Complete |
| 15 | Instructor Dashboard (Stats + Course Management) | ✅ | ✅ | 🟢 Complete |
| 16 | Admin Dashboard (Stats + CRUD Teachers/Students) | ✅ | ✅ | 🟢 Complete |
| 17 | Quiz View + Submit (Auto-Grading) | ✅ | ✅ | 🟢 Complete |
| 18 | Assignment Upload | ✅ | ✅ | 🟢 Complete |
| 19 | Contact Form (Email Sending) | ✅ | ✅ | 🟢 Complete |
| 20 | Lesson Progress Tracking | ✅ | ✅ | 🟢 Complete |
| 21 | Enrollment (Watch Lesson Access Control) | ✅ | ✅ | 🟢 Complete |
| 22 | Landing Page (Hero + Benefits + Courses) | ✅ | ✅ | 🟢 Complete |
| 23 | About Page | ✅ | N/A | 🟢 Complete |

**Total: 23 features fully end-to-end working**
