import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Quiz = sequelize.define("Quiz", {
  quiz_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  section_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  created_by: {
    type: DataTypes.INTEGER,
  },
  title: {
    type: DataTypes.STRING,
  },
  duration: {
    type: DataTypes.INTEGER,
  },
  num_questions: {
    type: DataTypes.INTEGER,
  },
  score_per_question: {
    type: DataTypes.INTEGER,
  },
  total_score: {
    type: DataTypes.INTEGER,
  },
  material_url: {
    type: DataTypes.STRING,
  },
  questions_json: {
    type: DataTypes.JSON,
  },
  status: {
    type: DataTypes.ENUM("draft", "published"),
    defaultValue: "draft",
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, { tableName: "quizzes", timestamps: false });

export default Quiz;