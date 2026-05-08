The /quiz/generate endpoint throws "Please upload a PDF file" even when uploading a valid PDF.

Root cause:

Quiz upload currently uses CloudinaryStorage.
CloudinaryStorage uploads directly to Cloudinary and does not expose req.file.buffer.
generateQuiz depends on req.file.buffer to parse PDF text and upload manually later.
Required changes
Update quiz upload middleware only
In uploadMiddleware.js, keep all existing upload configs unchanged except quiz upload.
Replace quiz upload storage from CloudinaryStorage to multer.memoryStorage().
Keep quiz file validation
Continue allowing only files with MIME type application/pdf.
Keep field name unchanged
Quiz upload must still use:
single file field name: materials
Do not remove manual Cloudinary upload
Keep uploadToCloudinary(buffer) inside quiz service.
Flow should be:
upload file to memory
read req.file.buffer
parse PDF text
generate quiz with Gemini
upload PDF to Cloudinary manually
return generated quiz data
Improve handler error message
If req.file is missing, return a clearer error like:
"Please upload a PDF file in the 'materials' field."
Testing requirements

Test endpoint:
POST /generate

Use Postman/form-data:

key materials → type File → upload valid PDF
other body fields:
title
section_id
num_questions
score_per_question
duration

Expected result:

valid PDF should return generated quiz successfully
non-PDF should return PDF validation error
missing file should return missing file error
Regression check

Confirm these still work after changes:

profile upload
assignment upload
lesson upload
course thumbnail upload

Only quiz upload behavior should change.

## 3. مشاكل Gemini API (404 & 400 Errors)

واجهنا ثلاث مشاكل متتالية هنا:

1. **Model Not Found (404):** الـ SDK كان يحاول استخدام نسخة `v1beta` من الـ API، والتي أظهرت أن موديل `gemini-1.5-flash` غير موجود أو غير مدعوم في منطقتك/مفتاحك حالياً.
2. **Invalid Field (400):** عند محاولة التحويل لنسخة `v1` المستقرة، ظهر خطأ لأن حقل `responseMimeType: "application/json"` مدعوم فقط في النسخ التجريبية وليس في `v1`.
3. **Model Name:** تم تجربة أسماء موديلات غير موجودة (مثل `gemini-2.5`) مما زاد من تعقيد المشكلة.

---

## 4. مشكلة تكرار طلبات الـ Token (429 Too Many Requests)

### السبب:

عندما تنتهي صلاحية الـ Token وتفشل عدة طلبات API في وقت واحد، يقوم الـ Frontend بإرسال طلب `refreshAccessToken` لكل فشل بشكل متزامن.

### النتيجة:

الـ Backend يكتشف تكراراً سريعاً جداً لنفس العملية فيقوم بحظر المستخدم مؤقتاً (Rate Limiting).

---

## الخلاصة:

العملية كانت تفشل في ثلاث مراحل متتالية:

1. **المرحلة الأولى:** فشل الوصول للملف بسبب إعدادات الـ Multer.
2. **المرحلة الثانية:** فشل قراءة الملف بسبب تغير هيكلية مكتبة الـ PDF.
3. **المرحلة الثالثة:** فشل التواصل مع AI بسبب عدم استقرار نسخة الـ API المختارة.

> [!IMPORTANT]
> تم استعادة جميع ملفات الـ Backend لحالتها الأصلية كما طلبت. إذا كنت ترغب في إصلاح النظام لاحقاً، يجب البدء بتعديل إعدادات الـ Multer في `uploadMiddleware.js` لتسمح بمرور الـ `buffer`.
