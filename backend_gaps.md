# Backend Development Gaps & Required Updates

This document outlines the missing functionalities in the backend. These are currently being handled by **Front-end Placeholders** to maintain the premium UI design.

## 1. Quiz Performance Tracking
- **Gap**: The `QuizAttempt` model lacks a field for `time_taken_seconds`.
- **Requirement**: Add `time_taken_seconds` to the database, update submission API to save it, and review API to return it.
- **Frontend Workaround**: Using a helper function to calculate time on submit and displaying it locally, but it won't persist across sessions.

## 2. Instructor Dashboard & Course List
- **Gap**: The `getDashboardStats` endpoint does not return `total_sections`, `total_lessons`, or the course `thumbnail`.
- **Requirement**: Update the query to include counts for sections and lessons associated with each course, and ensure the thumbnail URL is returned.
- **Frontend Workaround**: Using static values like "4 Sections" and "10 Lessons" and default icons to match the design screenshot.

## 3. Instructor Profile Integrity
- **Gap**: Users assigned the `instructor` role do not always have a corresponding entry in the `instructors` table.
- **Requirement**: Implement auto-creation of instructor profile records upon role change and provide a utility to fix existing data.

## 4. Quiz Review Data Consistency
- **Gap**: AI-generated questions do not consistently include an `explanation` field.
- **Requirement**: Standardize the generation prompt and ensure the review API returns this field.
