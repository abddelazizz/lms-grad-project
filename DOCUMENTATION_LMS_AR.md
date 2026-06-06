# توثيق منصة LMS (النسخة العربية)

ملخص: هذه وثيقة شاملة تحدد مميزات منصة التعليم الإلكتروني (LMS) الموجودة في المستودع، تدفقات الاستخدام لكل دور، أمثلة نقاط نهاية API توضيحية، وصف للواجهات الأمامية والمكونات، ونقاط تشغيلية وأمنية.

فهرس المحتويات
- مقدمة
- الأدوار
- نظرة عامة على الميزات
- تدفقات الاستخدام الرئيسية
- نقاط نهاية API توضيحية (مختارة)
- النماذج والكيانات الأساسية (Models)
- الأمان والوسيطات
- الواجهة الأمامية: صفحات ومكونات رئيسية
- متطلبات التشغيل والمتغيرات البيئية
- ملاحق: ملفات مرجعية

---

## مقدمة

منصة LMS هذه مبنية على Node.js وExpress للـ backend، وReact مع Vite للـ frontend. توفر نظامًا متكاملًا لإدارة الدورات التعليمية، المحتوى، التقييمات، التقدّم، والتواصل الزمني-الحقيقي مع طبقات أمان متقدمة (JWT، MFA، CSRF، rate-limiting).

## الأدوار
- Admin: إدارة المستخدمين، إحصاءات النظام، سجلات التدقيق.
- Instructor: إنشاء وإدارة الدورات، رفع المحتوى، تصحيح الواجبات والاختبارات.
- Student: التسجيل في الدورات، متابعة الدروس، أداء الاختبارات، رفع الواجبات.
- Parent: (اختياري) متابعة تقدم الأبناء.

## نظرة عامة على الميزات
- المصادقة والتفويض: تسجيل عبر البريد/كلمة مرور، Google OAuth، JWT، دعم MFA (TOTP) واسترداد.
- الأمان: CSRF protection، Helmet، CORS، rate-limiter متعدد المستويات، RBAC.
- إدارة الدورات: CRUD للدورات، حالات (draft/published/archived)، صور مصغّرة، رفع وسائط عبر Cloudinary.
- تنظيم المحتوى: فصول وأقسام ودروس بأنواع متعددة (video, pdf_lecture, pdf_assignment).
- تتبّع التقدّم: VideoProgress وLessonProgress ونسب اكتمال الدورات.
- الاختبارات (Quizzes): إنشاء، محاولات، احتساب درجات، وقت محدود.
- الواجبات (Assignments): رفع، حالة، تصحيح، ملاحظات.
- الدردشة والزمن-الحقيقي: Socket.IO مع تشفير رسائل per-conversation.
- الإشعارات: إشعارات حسب المستخدم مع حالة مقروء/غير مقروء.
- سجلات وسلامة البيانات: AuditLog وسلوك حذف آمن (soft delete) لبعض النماذج.

## تدفقات الاستخدام الرئيسية

1) التسجيل وتفعيل الحساب
- المستخدم يملأ استمارة التسجيل (`POST /auth/signup`).
- يُرسل رمز/رابط تفعيل عبر البريد.
- بعد التحقق يمكن للمستخدم تفعيل MFA عبر `POST /api/mfa/setup` (إن رغِب).

2) تسجيل الدخول ومصادقة MFA
- المستخدم يرسل بياناته إلى `POST /auth/login`.
- إذا كان MFA مُفعلًا، يُطلب رمز TOTP قبل إصدار الـ tokens.
- استجابة الناجح تُعيد `accessToken` و`refreshToken` ومعلومات المستخدم.

3) إنشاء وإدارة دورة (Instructor)
- Instructor ينشئ دورة أساسية عبر `POST /api/courses` مع بيانات العنوان والوصف.
- يضيف أقسامًا (`POST /api/courses/:id/sections`) ودروسًا ضمن كل قسم.
- للوسائط (فيديو/ملف) يستخدم الواجهة التي ترفع الملف إلى Cloudinary، ويخزن الروابط في `LessonContent`.
- ينشر الدورة بتغيير الحالة إلى `published`.

4) التحاق ومتابعة (Student)
- Student يطلب `POST /api/courses/:id/enroll`.
- يبدأ في مشاهدة الدروس؛ العميل يرسل تحديثات التقدم إلى `PATCH /api/progress/lessons/:lessonId` مع `watched_seconds` و`completed`.
- عند اكتمال كل الدروس تُحدّث `Enrollment.progress_percentage` تلقائيًا.

5) أداء اختبار
- Student يفتح صفحة الاختبار ويستدعي `GET /api/quizzes/:id`.
- يبدأ محاولته عبر `POST /api/quizzes/:id/attempt` ويُرسل الإجابات عبر `POST /api/quizzes/:id/submit`.
- النظام يخزن سجل `QuizAttempt` ويُعيد النتيجة.

6) تقديم واجب
- Student يرفع ملف عبر `POST /api/assignments/:contentId/upload`.
- يتم تخزين `AssignmentSubmission` مع رابط الملف وحالة `pending`.
- Instructor يصحح عبر `PATCH /api/assignments/:submissionId/grade`.

7) دردشة زمن-حقيقي
- العميل يفتح اتصال Socket.IO مع إرسال JWT.
- الخادم يتحقق من الـ JWT وينضم المستخدم لغرفته/محادثاته.
- الرسائل تُرسل وتُخزن مشفّرة.

## نقاط نهاية API توضيحية (مختارة)

> ملاحظة: الأمثلة أدناه توضيحية وغير مأخوذة من تشغيل الخادم.

- تسجيل دخول
  - Method: POST
  - Path: `/auth/login`
  - Body:

```json
{ "email": "user@example.com", "password": "secret" }
```

  - Response:

```json
{ "accessToken": "eyJ...", "refreshToken": "rft...", "user": { "id": 12, "role": "student" } }
```

- الحصول على دورة
  - Method: GET
  - Path: `/api/courses/:id`
  - Response (partial):

```json
{
  "id": 42,
  "title": "Intro to Security",
  "instructor": { "id": 5, "name": "Dr. A" },
  "sections": [ { "id": 7, "title": "Basics", "lessons": [ /* ... */ ] } ]
}
```

- الالتحاق بدورة
  - Method: POST
  - Path: `/api/courses/:id/enroll`
  - Auth: Bearer token
  - Response:

```json
{ "enrollmentId": 101, "courseId": 42, "studentId": 12, "status": "active" }
```

- تحديث تقدم درس
  - Method: PATCH
  - Path: `/api/progress/lessons/:lessonId`
  - Body:

```json
{ "watched_seconds": 120, "completed": false }
```

  - Response:

```json
{ "lessonId": 87, "watched_seconds": 120, "completed": false }
```

- رفع واجب (مثال)
  - Method: POST
  - Path: `/api/assignments/:contentId/upload`
  - Auth: Bearer token
  - Body: form-data مع ملف
  - Response:

```json
{ "submissionId": 201, "status": "pending", "fileUrl": "https://res.cloudinary.com/..." }
```

## النماذج والكيانات الأساسية (Models)
- `User`: الحقول الأساسية للمصادقة، `role`, `mfa_enabled`, `mfa_secret`, `token_version`.
- `Course`: `title`, `description`, `instructorId`, `price`, `status`, `thumbnail`.
- `CourseSection`: `courseId`, `title`, `position`.
- `LessonContent`: `sectionId`, `title`, `contentType` (video/pdf), `mediaUrl`, `duration`.
- `Enrollment`: `studentId`, `courseId`, `status`, `progress_percentage`.
- `LessonProgress`, `VideoProgress`: تخزين `watched_seconds`, `completed`, `last_accessed_at`.
- `Quiz`, `QuizAttempt`: تخزين الأسئلة كـ JSON ونتائج المحاولات.
- `AssignmentSubmission`: `studentId`, `contentId`, `fileUrl`, `grade`, `feedback`.
- `Conversation`, `ChatMessage`: تخزين الرسائل مشفّرة مع مؤشرات قراءة.
- `Notification`, `AuditLog`.

## الأمان والوسيطات
- **JWT**: استخدام access/refresh tokens، مع `token_version` لإبطال الجلسات عند الحاجة.
- **MFA (TOTP)**: إعداد secret وتخزين `mfa_enabled` في `User`، مع أكواد الاسترداد.
- **CSRF**: middleware للطلبات القادمة من المتصفح.
- **Rate limiting**: تطبيق حدود عامة وقيود خاصة لمسارات المصادقة والـ OTP.
- **RBAC**: middleware `restrictTo('instructor')` أو `restrictTo('admin')` للتحكم في الوصول.
- **رفع الملفات**: تحقق من النوع/الحجم، رفع إلى Cloudinary، تنظيف الموارد عند الحذف.
- **دردشة مشفّرة**: AES-256-GCM per-conversation keys لحماية محتوى الرسائل.

## الواجهة الأمامية: صفحات ومكونات رئيسية
- صفحات:
  - `Login`, `Signup`, `ForgotPassword`, `ResetPassword`.
  - `Dashboard` (عام)، `StudentDashboardContent`, `InstructorDashboard`, `AdminDashboard`.
  - `Courses`, `CourseDetails`, `CoursePlayer`, `CourseBuilder`.
  - `Assignments`, `AssignmentDetail`, `Quizzes`, `QuizAttempt`.
  - `Chat` (زمن-حقيقي).
- مكونات:
  - `Navbar`, `Sidebar`, `ProtectedRoute`, `ProfileSidebar`, `NotificationsPanel`.
- سياق المصادقة: `AuthContext` يدير حالة المستخدم، التجديد التلقائي للـ tokens، وتخزين الجلسة.

## متطلبات التشغيل والمتغيرات البيئية
- متطلبات عامة: Node.js (مُوصى به v16+), MySQL أو MariaDB، Redis، مفاتيح Cloudinary، إعدادات OAuth (Google)، و`JWT_SECRET`.
- متغيرات شائعة في `.env`:
  - `DATABASE_URL` أو معلومات الاتصال بـ MySQL
  - `REDIS_URL`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `FRONTEND_URL`, `BACKEND_URL`

- أوامر تشغيل محلي (مثال):

```bash
# backend
cd backend
npm install
npm run dev

# frontend
cd frontend
npm install
npm run dev
```

## ملاحق: ملفات مرجعية (مختارة)
- إعداد الخادم: `backend/server.js`, `backend/src/app.js`
- مصادقة وMFA: `backend/src/routes/authRoutes.js`, `backend/src/routes/mfaRoutes.js`, `backend/src/handlers/authHandler.js`, `backend/src/handlers/mfaHandler.js`, `backend/src/models/user.js`, `backend/src/config/passport.js`
- دورات ومحتوى: `backend/src/routes/courseRoutes.js`, `backend/src/handlers/courseHandler.js`, `backend/src/models/Course.js`, `backend/src/models/CourseSection.js`, `backend/src/models/LessonContent.js`
- تقدّم ومتابعة: `backend/src/models/LessonProgress.js`, `backend/src/models/VideoProgress.js`, `backend/src/handlers/progressHandler.js`
- اختبارات وواجبات: `backend/src/routes/quizRoutes.js`, `backend/src/handlers/quizHandler.js`, `backend/src/models/Quiz.js`, `backend/src/models/QuizAttempt.js`, `backend/src/models/AssignmentSubmission.js`
- دردشة: `backend/src/socketManager.js`, `backend/src/models/ChatMessage.js`, `backend/src/models/Conversation.js`
- الواجهة الأمامية: `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/contexts/AuthContext.jsx`

---

## ملاحظات ختامية
- هذه الوثيقة توضيحية وتعتمد على تحليل الملفات في المستودع؛ إذا رغبت أمكنني توسيع جدول نقاط النهاية ليشمل كل الـ endpoints أو إضافة أمثلة JSON أكثر تفصيلاً.
- الخطوة التالية: أراجع معك الأقسام المطلوبة للتفصيل الإضافي (إن رغبت). 


<!-- Document generated by assistant -->