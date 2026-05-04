import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const AssignmentSubmission = sequelize.define("AssignmentSubmission", {
  submission_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  file_url: {
    type: DataTypes.STRING,
  },
  grade: {
    type: DataTypes.INTEGER,
  },
  feedback: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM("pending", "graded", "resubmit"),
    defaultValue: "pending",
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, { tableName: "assignment_submissions", timestamps: false });

export default AssignmentSubmission;
