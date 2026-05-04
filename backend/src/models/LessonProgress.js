import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const LessonProgress = sequelize.define(
  "LessonProgress",
  {
    progress_id: {
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
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "lesson_contents",
        key: "content_id",
      },
    },
    // completed or still in progress
    status: {
      type: DataTypes.ENUM("in_progress", "completed"),
      defaultValue: "in_progress",
    },
    // Last position (in seconds) so the video resumes from where the student left off
    last_watched_at: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "lesson_progress",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["student_id", "lesson_id"],
      },
    ],
  }
);

export default LessonProgress;
