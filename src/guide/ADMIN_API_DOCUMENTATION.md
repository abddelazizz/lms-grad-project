# LMS Admin Management API Documentation

## Overview
This document describes the Admin management endpoints for the LMS system. All admin endpoints require:
- Authentication (JWT token)
- Admin role authorization
- Rate limiting protection

---

## Authentication & Authorization

### Required Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Role Requirements
- **All admin endpoints** require `role: "admin"`
- Authentication is validated via `protect` middleware
- Authorization is validated via `restrictTo("admin")` middleware

### Rate Limiting
- Admin endpoints use `adminLimiter`: 5 requests per 15 minutes per IP
- Helps prevent abuse and unauthorized access attempts

---

## Instructor Management Endpoints

### 1. Create Instructor
**Endpoint:** `POST /api/admin/instructors`

**Authorization:** Admin only

**Description:** Create a new instructor account. The instructor account is automatically verified by the admin.

**Request Body:**
```json
{
  "name": "Dr. John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "bio": "Experienced software engineer with 10+ years",
  "specialization": "Web Development"
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format, must be unique
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, and number
- `bio`: Optional, max 500 characters
- `specialization`: Optional, max 100 characters

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Instructor created successfully",
  "data": {
    "instructor": {
      "user_id": 5,
      "name": "Dr. John Doe",
      "email": "john.doe@example.com",
      "role": "instructor",
      "is_verified": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "bio": "Experienced software engineer with 10+ years",
      "specialization": "Web Development"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed (missing fields, weak password, etc.)
- `409 Conflict`: Email already exists
- `401 Unauthorized`: Not authenticated or invalid token
- `403 Forbidden`: User is not an admin

---

### 2. Get All Instructors
**Endpoint:** `GET /api/admin/instructors`

**Authorization:** Admin only

**Description:** Retrieve all instructors with pagination and optional search functionality.

**Query Parameters:**
```
page: integer (default: 1, min: 1)
limit: integer (default: 10, min: 1, max: 100)
search: string (optional, search by name or email)
```

**Example Request:**
```
GET /api/admin/instructors?page=1&limit=10&search=john
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Instructors retrieved successfully",
  "data": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "data": [
      {
        "user_id": 5,
        "name": "Dr. John Doe",
        "email": "john.doe@example.com",
        "is_verified": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "Instructor": {
          "bio": "Experienced software engineer with 10+ years",
          "specialization": "Web Development"
        }
      },
      {
        "user_id": 6,
        "name": "Dr. Jane Smith",
        "email": "jane.smith@example.com",
        "is_verified": true,
        "createdAt": "2024-01-16T09:15:00Z",
        "Instructor": {
          "bio": "Data science expert",
          "specialization": "Machine Learning"
        }
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated or invalid token
- `403 Forbidden`: User is not an admin

---

### 3. Get Instructor by ID
**Endpoint:** `GET /api/admin/instructors/:id`

**Authorization:** Admin only

**Description:** Retrieve details of a specific instructor.

**Path Parameters:**
```
id: integer (instructor user_id)
```

**Example Request:**
```
GET /api/admin/instructors/5
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Instructor retrieved successfully",
  "data": {
    "instructor": {
      "user_id": 5,
      "name": "Dr. John Doe",
      "email": "john.doe@example.com",
      "is_verified": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "Instructor": {
        "bio": "Experienced software engineer with 10+ years",
        "specialization": "Web Development"
      }
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid instructor ID format
- `404 Not Found`: Instructor does not exist
- `401 Unauthorized`: Not authenticated or invalid token
- `403 Forbidden`: User is not an admin

---

### 4. Remove Instructor
**Endpoint:** `DELETE /api/admin/instructors/:id`

**Authorization:** Admin only

**Description:** Remove (soft delete) an instructor and their associated data.

**Path Parameters:**
```
id: integer (instructor user_id)
```

**Example Request:**
```
DELETE /api/admin/instructors/5
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Instructor removed successfully",
  "data": {
    "message": "Instructor removed successfully",
    "removedInstructorId": 5
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid instructor ID format
- `404 Not Found`: Instructor does not exist
- `401 Unauthorized`: Not authenticated or invalid token
- `403 Forbidden`: User is not an admin

---

## Student Management Endpoints

### 1. Create Student
**Endpoint:** `POST /api/admin/students`

**Authorization:** Admin only

**Description:** Create a new student account. The student account is automatically verified by the admin.

**Request Body:**
```json
{
  "name": "Alice Johnson",
  "email": "alice.johnson@example.com",
  "password": "SecurePass456",
  "gradeLevel": "Grade 10",
  "parentId": null
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format, must be unique
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, and number
- `gradeLevel`: Optional, max 50 characters
- `parentId`: Optional, must be a valid integer

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Student created successfully",
  "data": {
    "student": {
      "user_id": 10,
      "name": "Alice Johnson",
      "email": "alice.johnson@example.com",
      "role": "student",
      "is_verified": true,
      "createdAt": "2024-01-20T14:45:00Z",
      "grade_level": "Grade 10",
      "parent_id": null
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed (missing fields, weak password, etc.)
- `409 Conflict`: Email already exists
- `401 Unauthorized`: Not authenticated or invalid token
- `403 Forbidden`: User is not an admin

---

### 2. Get All Students
**Endpoint:** `GET /api/admin/students`

**Authorization:** Admin only

**Description:** Retrieve all students with pagination and optional search functionality.

**Query Parameters:**
```
page: integer (default: 1, min: 1)
limit: integer (default: 10, min: 1, max: 100)
search: string (optional, search by name or email)
```

**Example Request:**
```
GET /api/admin/students?page=1&limit=10&search=alice
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Students retrieved successfully",
  "data": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15,
    "data": [
      {
        "user_id": 10,
        "name": "Alice Johnson",
        "email": "alice.johnson@example.com",
        "is_verified": true,
        "createdAt": "2024-01-20T14:45:00Z",
        "Student": {
          "grade_level": "Grade 10",
          "parent_id": null
        }
      },
      {
        "user_id": 11,
        "name": "Bob Wilson",
        "email": "bob.wilson@example.com",
        "is_verified": true,
        "createdAt": "2024-01-21T11:20:00Z",
        "Student": {
          "grade_level": "Grade 11",
          "parent_id": null
        }
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated or invalid token
- `403 Forbidden`: User is not an admin

---

### 3. Get Student by ID
**Endpoint:** `GET /api/admin/students/:id`

**Authorization:** Admin only

**Description:** Retrieve details of a specific student.

**Path Parameters:**
```
id: integer (student user_id)
```

**Example Request:**
```
GET /api/admin/students/10
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Student retrieved successfully",
  "data": {
    "student": {
      "user_id": 10,
      "name": "Alice Johnson",
      "email": "alice.johnson@example.com",
      "is_verified": true,
      "createdAt": "2024-01-20T14:45:00Z",
      "Student": {
        "grade_level": "Grade 10",
        "parent_id": null
      }
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid student ID format
- `404 Not Found`: Student does not exist
- `401 Unauthorized`: Not authenticated or invalid token
- `403 Forbidden`: User is not an admin

---

### 4. Remove Student
**Endpoint:** `DELETE /api/admin/students/:id`

**Authorization:** Admin only

**Description:** Remove (soft delete) a student and their associated enrollment data.

**Path Parameters:**
```
id: integer (student user_id)
```

**Example Request:**
```
DELETE /api/admin/students/10
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Student removed successfully",
  "data": {
    "message": "Student removed successfully",
    "removedStudentId": 10
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid student ID format
- `404 Not Found`: Student does not exist
- `401 Unauthorized`: Not authenticated or invalid token
- `403 Forbidden`: User is not an admin

---

## Admin Dashboard Endpoints

### 1. Get Dashboard Statistics
**Endpoint:** `GET /api/admin/dashboard/stats`

**Authorization:** Admin only

**Description:** Retrieve overall system statistics and metrics for the admin dashboard.

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "totalUsers": 200,
    "totalInstructors": 25,
    "totalStudents": 170,
    "verifiedUsers": 190,
    "unverifiedUsers": 10,
    "stats": {
      "instructorPercentage": "12.50",
      "studentPercentage": "85.00",
      "verificationRate": "95.00"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated or invalid token
- `403 Forbidden`: User is not an admin

---

## Error Handling

### Common Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Validation error or invalid request format |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User lacks required permissions (not admin) |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Email already exists in system |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation error message(s)"
}
```

---

## Implementation Notes

### Security Features
1. **Rate Limiting**: Admin endpoints limit to 5 requests per 15 minutes
2. **Role-Based Access**: Only admins can access these endpoints
3. **Soft Deletes**: Removed users are soft-deleted (not permanently removed)
4. **Password Hashing**: All passwords are hashed with bcrypt (salt rounds: 12)
5. **Input Validation**: All inputs are validated using Joi schemas

### Database Operations
1. **Create**: User + role-specific profile (Instructor/Student)
2. **Read**: Optimized queries with association loading
3. **Search**: Case-insensitive search by name and email
4. **Delete**: Soft delete to preserve data integrity

### Pagination
- Default page: 1
- Default limit: 10
- Maximum limit: 100 results per page
- Returns total count, current page, and total pages

---

## Integration with Main App

### Adding to Express App
```javascript
import adminRoutes from "./routes/adminRoutes.js";

app.use("/api/admin", adminRoutes);
```

### Required Middleware (already included in routes)
- `protect`: JWT authentication
- `restrictTo("admin")`: Role-based authorization
- `adminLimiter`: Rate limiting
- `validate()`: Request validation

---

## Examples

### Example 1: Create Instructor
```bash
curl -X POST http://localhost:3000/api/admin/instructors \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "specialization": "Web Development"
  }'
```

### Example 2: Get All Students with Search
```bash
curl -X GET "http://localhost:3000/api/admin/students?page=1&limit=10&search=alice" \
  -H "Authorization: Bearer <jwt_token>"
```

### Example 3: Delete Student
```bash
curl -X DELETE http://localhost:3000/api/admin/students/10 \
  -H "Authorization: Bearer <jwt_token>"
```

---

## Testing with Postman

1. **Authentication**: Add Bearer token to Authorization tab
2. **Content-Type**: Set to `application/json`
3. **Request Body**: Use raw JSON format
4. **Tests**: Validate status codes and response structure

---

## Future Enhancements

- [ ] Bulk user creation (CSV upload)
- [ ] User status management (active/inactive)
- [ ] Password reset functionality
- [ ] User activity audit logs
- [ ] Export user data (CSV/Excel)
- [ ] Advanced search filters
- [ ] User role transfer/modification
