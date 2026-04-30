# Quiz Generator Feature

## Overview

An instructor-only feature that generates multiple-choice quizzes from uploaded PDF material using Google Gemini 2.5 Flash AI. Students can attempt each quiz once, receive an auto-graded score, and review their answers against correct answers after submission.

---

## Logical Flow

```
INSTRUCTOR                                    STUDENT
──────────                                    ───────
1. Upload 1 PDF + quiz metadata
2. POST /quizzes/generate
   → PDF uploaded to Cloudinary
   → Text extracted from PDF (pdf-parse)
   → Text sent to Gemini 2.5 Flash
   → AI returns MCQs (preview only, NOT saved)
3. Reviews/edits questions on frontend
4. POST /quizzes/save
   → Quiz saved with status='draft'
5. POST /quizzes/:id/publish
   → status changes to 'published'
                                              6. GET /quizzes/:id
                                                 → Questions WITHOUT correctAnswer
                                                 → Shows if already attempted
                                              7. POST /quizzes/:id/submit
                                                 → One attempt only (enforced)
                                                 → Auto-grade using score_per_question
                                                 → Save QuizAttempt (score + total_quiz_score)
                                                 → Add earned score to Student.total_points
                                              8. GET /quizzes/:id/review
                                                 → Questions WITH correctAnswer
                                                 → Student's submitted answers side by side
                                                 → Score breakdown
```

---

## Number of Questions — Preset Dropdown

The instructor selects from a fixed set of options:

| Option | Description              |
|--------|--------------------------|
| 5      | Quick check              |
| 10     | Standard quiz            |
| 15     | Thorough quiz            |
| 20     | Comprehensive quiz       |

This value is sent as `num_questions` in the generate request and passed to the Gemini prompt. It's also stored as a column on the Quiz model for quick listing without parsing `questions_json`.

---

## Tech Stack Additions

| Package                | Purpose                                              |
|------------------------|------------------------------------------------------|
| `@google/generative-ai` | Official Google Gemini SDK — calls `gemini-2.5-flash` |
| `pdf-parse`            | Extracts text content from PDF buffers server-side    |

Both work with existing infrastructure:
- `GEMINI_API_KEY` already in `.env`
- Cloudinary already configured for file uploads
- `Student.total_points` already exists for score tracking

---

## API Design

| Method | Endpoint                   | Auth              | Middleware Chain                                                    | Description                                    |
|--------|----------------------------|-------------------|---------------------------------------------------------------------|------------------------------------------------|
| POST   | `/api/quizzes/generate`    | instructor/admin  | auth → restrictTo → uploadQuizMaterial → validate(generateSchema)  | Upload PDF, get AI-generated MCQs (preview)    |
| POST   | `/api/quizzes/save`       | instructor/admin  | auth → restrictTo → validate(saveSchema)                           | Save reviewed/edited quiz as draft             |
| POST   | `/api/quizzes/:id/publish` | instructor/admin  | auth → restrictTo                                                   | Publish draft quiz for students                |
| GET    | `/api/quizzes/:id`         | any auth          | auth                                                                | Get quiz questions (correctAnswer stripped)    |
| POST   | `/api/quizzes/:id/submit`  | any auth          | auth                                                                | Submit answers (one attempt only), auto-grade |
| GET    | `/api/quizzes/:id/review`  | any auth          | auth                                                                | Review: correct answers vs student answers    |

Route order: `/generate` and `/save` must be declared **before** `/:id` to avoid Express treating them as ID params.

---

## Request/Response Specs

### POST `/api/quizzes/generate`

**Request**: `multipart/form-data`

```
materials: <PDF file>
title: "Chapter 5 Quiz"
section_id: 12
num_questions: 10
score_per_question: 5
duration: 30
```

**Response**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "quiz": {
      "title": "Chapter 5 Quiz",
      "section_id": 12,
      "duration": 30,
      "num_questions": 10,
      "score_per_question": 5,
      "total_score": 50,
      "material_url": "https://res.cloudinary.com/.../abc.pdf",
      "questions": [
        {
          "id": "q1",
          "question": "What is the main purpose of...?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option B",
          "difficulty": "medium"
        }
      ]
    }
  }
}
```

### POST `/api/quizzes/save`

**Request**: `application/json`

```json
{
  "title": "Chapter 5 Quiz",
  "section_id": 12,
  "duration": 30,
  "num_questions": 10,
  "score_per_question": 5,
  "material_url": "https://res.cloudinary.com/.../abc.pdf",
  "questions": [
    { "id": "q1", "question": "...", "options": ["A","B","C","D"], "correctAnswer": "B", "difficulty": "medium" }
  ]
}
```

**Response**: `201 Created`

```json
{
  "status": "success",
  "data": {
    "quiz": {
      "quiz_id": 45,
      "title": "Chapter 5 Quiz",
      "section_id": 12,
      "created_by": 7,
      "duration": 30,
      "num_questions": 10,
      "score_per_question": 5,
      "total_score": 50,
      "material_url": "https://res.cloudinary.com/.../abc.pdf",
      "questions_json": [...],
      "status": "draft",
      "created_at": "2026-05-01T09:00:00.000Z"
    }
  }
}
```

### POST `/api/quizzes/:id/publish`

**Response**: `200 OK`

```json
{
  "status": "success",
  "message": "Quiz published successfully",
  "data": {
    "quiz": { "quiz_id": 45, "status": "published" }
  }
}
```

### GET `/api/quizzes/:id`

**Response** (student view — correctAnswer stripped):

```json
{
  "status": "success",
  "data": {
    "quiz": {
      "quiz_id": 45,
      "title": "Chapter 5 Quiz",
      "duration": 30,
      "num_questions": 10,
      "score_per_question": 5,
      "total_score": 50,
      "status": "published",
      "attempted": false,
      "questions": [
        {
          "id": "q1",
          "question": "What is the main purpose of...?",
          "options": ["Option A", "Option B", "Option C", "Option D"]
        }
      ]
    }
  }
}
```

### POST `/api/quizzes/:id/submit`

**Request**:

```json
{ "answers": { "q1": "Option B", "q2": "Option A" } }
```

**Response** (first attempt):

```json
{
  "status": "success",
  "message": "Quiz submitted successfully",
  "data": {
    "score": 8,
    "total_quiz_score": 50,
    "attempt_id": 22
  }
}
```

**Response** (second attempt — rejected):

```json
{
  "success": false,
  "statusCode": 403,
  "message": "You have already attempted this quiz"
}
```

### GET `/api/quizzes/:id/review`

**Response**:

```json
{
  "status": "success",
  "data": {
    "quiz": {
      "title": "Chapter 5 Quiz",
      "total_score": 50
    },
    "review": [
      {
        "id": "q1",
        "question": "What is the main purpose of...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "studentAnswer": "Option B",
        "isCorrect": true
      },
      {
        "id": "q2",
        "question": "Which of the following is...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option C",
        "studentAnswer": "Option A",
        "isCorrect": false
      }
    ],
    "score": 8,
    "total_quiz_score": 50
  }
}
```

---

## Database Schema Changes

### `quizzes` table — new columns

| Column             | Type                          | Default   | Notes                                           |
|--------------------|-------------------------------|-----------|-------------------------------------------------|
| `duration`         | INT                           | NULL      | Quiz duration in minutes                        |
| `num_questions`    | INT                           | NULL      | Preset: 5, 10, 15, or 20                        |
| `score_per_question` | INT                         | NULL      | Points per correct answer                       |
| `total_score`      | INT                           | NULL      | `num_questions * score_per_question`            |
| `material_url`     | VARCHAR                       | NULL      | Cloudinary URL of source PDF                    |
| `status`           | ENUM('draft','published')     | 'draft'   | Draft = instructor editing, Published = visible |

### `quiz_attempts` table — new column + constraint

| Column             | Type | Default | Notes                   |
|--------------------|------|---------|-------------------------|
| `total_quiz_score` | INT  | NULL    | Max possible score      |

**New unique constraint**: `UNIQUE(quiz_id, student_id)` — enforces one attempt per student at DB level.

---

## Files Modified/Created

| #  | File                                                  | Action   | Details                                                                                                 |
|----|-------------------------------------------------------|----------|---------------------------------------------------------------------------------------------------------|
| 1  | `package.json`                                        | Modify   | Add `@google/generative-ai`, `pdf-parse`                                                                |
| 2  | `src/middlewares/uploadMiddleware.js`                  | Modify   | Append `uploadQuizMaterial` — single PDF, 50MB max, Cloudinary `recode_academy_quiz_materials`          |
| 3  | `src/validations/quizValidation.js`                   | Create   | `generateQuizSchema`, `saveQuizSchema`                                                                  |
| 4  | `src/validations/index.js`                            | Modify   | Add quiz schema exports                                                                                  |
| 5  | `src/services/quizService.js`                         | Create   | 9 functions: extractTextFromPDF, buildQuizPrompt, callGemini, generateQuiz, saveQuiz, publishQuiz, getQuizForStudent, submitQuizAttempt, reviewQuiz |
| 6  | `src/services/index.js`                                | Modify   | Add `export * as quizService`                                                                            |
| 7  | `src/models/Quiz.js`                                  | Modify   | Add: duration, num_questions, score_per_question, total_score, material_url, status                      |
| 8  | `src/models/QuizAttempt.js`                           | Modify   | Add: total_quiz_score, unique constraint on (quiz_id, student_id)                                       |
| 9  | `src/models/index.js`                                  | Modify   | Add Quiz ↔ CourseSection, Quiz ↔ QuizAttempt associations                                                |
| 10 | `src/database/migrations/20260501090000-add-quiz-generator-fields.cjs` | Create   | Add columns to quizzes + quiz_attempts + unique index                                                    |
| 11 | `src/handlers/quizHandler.js`                          | Rewrite  | 6 handlers: generateQuiz, saveQuiz, publishQuiz, getQuiz, submitQuizAttempt, reviewQuiz                  |
| 12 | `src/routes/quizRoutes.js`                            | Rewrite  | 6 routes with proper middleware chains                                                                   |

---

## Service Functions — Detailed Logic

### `extractTextFromPDF(pdfUrl)`
- Fetch PDF from Cloudinary URL using native `fetch`
- Get buffer from response
- Pass buffer to `pdf-parse`
- Truncate to 30,000 characters (token efficiency)
- If no text → throw `AppError("Could not extract text from the PDF. Please ensure it contains selectable text.", 400)`
- Return text string

### `buildQuizPrompt(text, numQuestions)`
Prompt template:

```
You are an educational quiz generator. Based on the following course material,
generate exactly {numQuestions} multiple-choice questions.

RULES:
- Each question must have exactly 4 options
- Only ONE option is correct
- Test understanding, not memorization
- Mix difficulty levels: ~30% easy, ~40% medium, ~30% hard
- The correctAnswer must be the exact text of one of the options
- Each question ID must be unique (q1, q2, q3, ...)

Return your response as a JSON array with this exact structure:
[
  {
    "id": "q1",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "difficulty": "easy"
  }
]

COURSE MATERIAL:
{text}
```

### `callGemini(prompt)`
- Initialize `new GoogleGenerativeAI(process.env.GEMINI_API_KEY)`
- Model: `gemini-2.5-flash`
- `generationConfig: { responseMimeType: "application/json" }`
- Parse response as JSON, validate structure
- If parsing fails → throw `AppError("AI failed to generate valid questions. Please try again.", 502)`
- Return question array

### `generateQuiz({ title, section_id, num_questions, score_per_question, duration, material_url })`
- `extractTextFromPDF(material_url)`
- `buildQuizPrompt(text, num_questions)`
- `callGemini(prompt)`
- Return preview (NOT saved to DB)

### `saveQuiz(quizData, instructorId)`
- Verify `CourseSection.findByPk(section_id)` exists
- Create Quiz row: status='draft'

### `publishQuiz(quizId, instructorId)`
- Verify ownership + status is 'draft'
- Update status to 'published'

### `getQuizForStudent(quizId, studentId)`
- Verify quiz is 'published'
- Strip correctAnswer from questions
- Check if student already attempted

### `submitQuizAttempt(quizId, studentId, answers)`
- Verify published, check no existing attempt
- Auto-grade using `score_per_question`
- Create QuizAttempt
- Add score to `Student.total_points`

### `reviewQuiz(quizId, studentId)`
- Verify student has attempted
- Return questions + correctAnswer + studentAnswer + isCorrect

---

## Error Handling

| Scenario                           | Status | Message                                                                  |
|------------------------------------|--------|--------------------------------------------------------------------------|
| No PDF uploaded                    | 400    | Please upload a PDF file                                                 |
| PDF has no extractable text        | 400    | Could not extract text from the PDF. Please ensure it contains selectable text |
| Invalid num_questions value        | 400    | Joi validation error                                                     |
| Section not found                   | 404    | Course section not found                                                 |
| Quiz not found                     | 404    | Quiz not found                                                           |
| Quiz not published (student)       | 404    | Quiz not found                                                           |
| Quiz already published             | 400    | Quiz is already published                                                |
| Not quiz owner (publish)           | 403    | You do not have permission to perform this action                        |
| Student already attempted          | 403    | You have already attempted this quiz                                     |
| Student hasn't attempted (review)  | 403    | You must attempt the quiz first                                          |
| Gemini API failure                  | 502    | AI failed to generate valid questions. Please try again                  |

---

## Implementation Order

1. Install dependencies
2. Create migration file
3. Update models (Quiz, QuizAttempt, associations)
4. Add upload middleware
5. Create validation schemas
6. Create quiz service
7. Rewrite quiz handler
8. Rewrite quiz routes
9. Run migration
10. Test all endpoints