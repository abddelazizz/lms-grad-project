import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Enrollment = sequelize.define(
  "Enrollment",
  {
    enrollment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "students",
        key: "user_id",
      },
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "courses",
        key: "course_id",
      },
    },
    enrolled_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("active", "completed", "dropped"),
      defaultValue: "active",
    },
    // 🆕 Cached overall progress (0.00 – 100.00)
    progress_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.0,
    },
  },
  {
    tableName: "enrollments",
    timestamps: false,
    // Ensure a student can only enroll once per course
    indexes: [
      {
        unique: true,
        fields: ["student_id", "course_id"],
      },
    ],
  }
);

export default Enrollment;
