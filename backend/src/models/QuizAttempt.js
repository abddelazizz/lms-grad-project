import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const QuizAttempt = sequelize.define("QuizAttempt", {
  attempt_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quiz_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  answers_json: {
    type: DataTypes.JSON,
  },
  score: {
    type: DataTypes.INTEGER,
  },
  total_quiz_score: {
    type: DataTypes.INTEGER,
  },
  attempted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "quiz_attempts",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ["quiz_id", "student_id"],
    },
  ],
});

export default QuizAttempt;
