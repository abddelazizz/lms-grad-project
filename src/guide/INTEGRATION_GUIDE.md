# Admin Management Features - Integration Guide

## Overview
This guide explains how to integrate the complete admin management system into your existing LMS backend application.

---

## 📋 Files Structure

```
your-lms-backend/
├── controllers/
│   └── adminHandler.js          (NEW) Admin endpoints
├── services/
│   ├── adminService.js          (ENHANCED) Admin business logic
│   └── index.js                 (UPDATE) Export adminService
├── routes/
│   └── adminRoutes.js           (NEW) Admin route definitions
├── models/
│   ├── User.js                  (EXISTING)
│   ├── Admin.js                 (EXISTING)
│   ├── Instructor.js            (EXISTING)
│   ├── Student.js               (EXISTING)
│   └── index.js                 (ENSURE exports)
├── middlewares/
│   ├── restrictTo.js            (EXISTING)
│   ├── auth.js                  (EXISTING - must export `protect`)
│   ├── rateLimiter.js           (EXISTING)
│   └── validationMiddleware.js  (EXISTING)
├── utils/
│   ├── AppError.js              (EXISTING)
│   ├── catchAsync.js            (EXISTING)
│   └── index.js                 (ENSURE exports)
├── validators/
│   └── adminValidators.js       (NEW) Joi validation schemas
├── tests/
│   └── admin/
│       └── admin.test.js        (NEW) Complete test suite
├── app.js                       (UPDATE) Register admin routes
├── .env                         (UPDATE) Ensure required variables
└── ADMIN_API_DOCUMENTATION.md   (NEW) API reference
```

---

## 🔧 Step-by-Step Integration

### Step 1: Update Your Express App (`app.js`)

Add the admin routes to your main Express application:

```javascript
// ═══ In your app.js or main server file ═══

import express from "express";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

// ─── Middleware ──────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(globalLimiter); // Global rate limiter

// ─── Routes ──────────────────────────────
app.use("/api/admin", adminRoutes); // Add this line

// ─── Error Handling ──────────────────────
import globalErrorHandler from "./middlewares/errorHandler.js";
app.use(globalErrorHandler);

export default app;
```

### Step 2: Ensure Model Associations

Update your models to have proper relationships. Here's how your `User.js` should be configured:

```javascript
// models/User.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "instructor", "student"),
      defaultValue: "student",
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { tableName: "users" }
);

// ─── Define Associations ──────────────────
User.hasOne(Admin, { foreignKey: "user_id" });
User.hasOne(Instructor, { foreignKey: "user_id" });
User.hasOne(Student, { foreignKey: "user_id" });

export default User;
```

### Step 3: Create Required Files

Copy the following files to your project:

**New Files:**
- `controllers/adminHandler.js`
- `routes/adminRoutes.js`
- `validators/adminValidators.js`
- `tests/admin/admin.test.js`

**Updated Files:**
- `services/adminService.js` (replaces old one)

### Step 4: Update Service Exports (`services/index.js`)

Ensure your service index file exports admin service:

```javascript
// services/index.js
export { default as authService } from "./authService.js";
export * as adminService from "./adminService.js";
// ... other service exports
```

### Step 5: Configure Environment Variables (`.env`)

Ensure your `.env` file has:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Server
NODE_ENV=development
PORT=3000

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### Step 6: Install Required Dependencies

```bash
npm install joi bcrypt express-rate-limit
```

---

## ✅ Verification Checklist

After integration, verify:

- [ ] Express app imports and mounts admin routes
- [ ] Models have correct associations
- [ ] `protect` middleware exists and validates JWT
- [ ] `restrictTo` middleware exists and checks roles
- [ ] AppError utility class is available
- [ ] catchAsync utility function is available
- [ ] Rate limiter middleware is configured
- [ ] Joi validator is installed
- [ ] Database is seeded with an admin user
- [ ] Tests pass: `npm test -- admin.test.js`

---

## 🗄️ Database Setup

### Create Admin User (Seed Script)

Create `scripts/seedAdmin.js`:

```javascript
import { sequelize } from "../config/index.js";
import { User, Admin } from "../models/index.js";
import bcrypt from "bcrypt";

const seedAdmin = async () => {
  try {
    await sequelize.sync();

    const adminEmail = "admin@lms.com";
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("AdminPass123", 12);

    const admin = await User.create({
      name: "System Administrator",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      is_verified: true,
    });

    await Admin.create({ user_id: admin.user_id });

    console.log("✓ Admin user created successfully");
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: AdminPass123`);
    console.log(`  ID: ${admin.user_id}`);

    await sequelize.close();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
```

Run seeding:
```bash
node scripts/seedAdmin.js
```

---

## 🧪 Testing

### Setup Test Database

Create `tests/setup.js`:

```javascript
import { sequelize } from "../config/index.js";

beforeAll(async () => {
  // Use test database
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
```

### Run Tests

```bash
# Install test dependencies
npm install --save-dev jest supertest

# Run all tests
npm test

# Run only admin tests
npm test -- admin.test.js

# Run with coverage
npm test -- --coverage
```

---

## 🔐 Security Implementation

### Authentication Flow
```
1. Admin logs in → Receives JWT token
2. Admin makes request with token in header
3. `protect` middleware validates token
4. `restrictTo("admin")` checks user role
5. Request processed if authorized
6. All sensitive data (passwords) excluded from responses
```

### Password Security
- Hashed with bcrypt (12 salt rounds)
- Minimum 8 characters
- Must contain uppercase, lowercase, and numbers
- Never returned in API responses

### Rate Limiting
- Global: 100 requests per 15 minutes per IP
- Admin endpoints: 5 requests per 15 minutes per IP
- Prevents brute force attacks

---

## 📝 API Usage Examples

### 1. Create Instructor

```bash
curl -X POST http://localhost:3000/api/admin/instructors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Smith",
    "email": "smith@example.com",
    "password": "SecurePass123",
    "specialization": "Computer Science"
  }'
```

### 2. Get All Students

```bash
curl -X GET "http://localhost:3000/api/admin/students?page=1&limit=10&search=john" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Remove Student

```bash
curl -X DELETE http://localhost:3000/api/admin/students/15 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. View Dashboard Stats

```bash
curl -X GET http://localhost:3000/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### Issue: "protect is not defined"
**Solution**: Ensure you have `protect` middleware exported from `middlewares/auth.js`

```javascript
// middlewares/auth.js should have:
export const protect = asyncHandler(async (req, res, next) => {
  // JWT validation logic
});
```

### Issue: "restrictTo is not a function"
**Solution**: Check that `restrictTo` is properly imported and exported

```javascript
// restrictTo.js should have:
const restrictTo = (...roles) => { /* ... */ };
export default restrictTo;
```

### Issue: Tests failing with database errors
**Solution**: Ensure test database is configured in `.env.test`

```env
# .env.test
DB_HOST=localhost
DB_NAME=lms_test_db
DB_USER=postgres
DB_PASSWORD=password
```

### Issue: "Email already exists" error on duplicate
**Solution**: This is expected behavior. The system prevents duplicate emails for data integrity.

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Rate limiting configured
- [ ] Error logging enabled
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Request body size limits set
- [ ] Password hashing enabled

### Deployment Steps

```bash
# 1. Run migrations
npm run migrate

# 2. Seed admin user
npm run seed:admin

# 3. Run tests
npm test

# 4. Build (if applicable)
npm run build

# 5. Start production server
NODE_ENV=production npm start
```

---

## 📊 Monitoring & Logging

### Enable Admin Logs

Create `logs/admin.log` and update logging configuration:

```javascript
// config/logger.js
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/admin.log" }),
    new winston.transports.Console(),
  ],
});

export default logger;
```

### Log Critical Admin Actions

```javascript
// In adminService.js
import logger from "../config/logger.js";

export const createInstructor = async (name, email, password, ...) => {
  try {
    // ... create instructor
    logger.info(`Admin created instructor: ${email}`);
  } catch (error) {
    logger.error(`Failed to create instructor: ${error.message}`);
    throw error;
  }
};
```

---

## 🎯 Next Steps

After successful integration:

1. **Test in Postman** - Import API collection
2. **Create Frontend** - Dashboard to manage users
3. **Add Email Notifications** - Notify new instructors/students
4. **Implement Audit Logs** - Track all admin actions
5. **Add Bulk Operations** - CSV import for users
6. **Setup Monitoring** - Track system metrics

---

## 📚 Additional Resources

- Full API Documentation: `ADMIN_API_DOCUMENTATION.md`
- Test Suite: `tests/admin/admin.test.js`
- Service Layer: `services/adminService.js`
- Controllers: `controllers/adminHandler.js`

---

## 💬 Support

For issues or questions:
1. Check `ADMIN_API_DOCUMENTATION.md` for endpoint details
2. Review test cases for usage examples
3. Check error messages in API responses
4. Enable debug logging in development

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Production Ready ✅
