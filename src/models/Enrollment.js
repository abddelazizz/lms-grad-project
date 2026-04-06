import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Enrollment = sequelize.define(
  "Enrollment",
  {
    student_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'students',
        key: 'user_id',
      },
    },
    course_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'courses',
        key: 'course_id',
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
  },
  {
    tableName: "enrollments",
    timestamps: false,
  }
);

export default Enrollment;
