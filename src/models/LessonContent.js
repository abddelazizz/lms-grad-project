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
    parent_content_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "lesson_contents",
        key: "content_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content_type: {
      type: DataTypes.ENUM("video", "pdf_lecture", "pdf_assignment"),
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
    // Lesson duration in seconds (populated by Cloudinary for videos)
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    // Whether non-enrolled users can view this lesson as a free preview
    is_free_preview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Cloudinary public ID for asset management (delete old files)
    cloudinary_public_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Soft-delete support
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "lesson_contents",
    timestamps: true,
    createdAt: false,
    updatedAt: false,
    paranoid: true,
    deletedAt: "deleted_at",
  }
);

export default LessonContent;
