import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const LessonContent = sequelize.define(
  "LessonContent",
  {
    content_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    section_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content_type: {
      type: DataTypes.ENUM("video", "text", "file", "assignment_prompt"),
      allowNull: false,
    },
    position_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    video_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    text_content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "lesson_contents",
    timestamps: false,
  }
);

export default LessonContent;
