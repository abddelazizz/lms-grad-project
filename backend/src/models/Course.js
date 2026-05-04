import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Course = sequelize.define(
  "Course",
  {
    course_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    instructor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "instructors",
        key: "user_id",
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      defaultValue: "draft",
    },
    level: {
      type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
      allowNull: true,
    },
    thumbnail_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cloudinary_thumbnail_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // ✅ Soft-delete: paranoid adds deleted_at column managed by Sequelize
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "courses",
    timestamps: true,
    createdAt: false,
    updatedAt: false,
    // ✅ paranoid: true makes destroy() set deleted_at instead of hard deleting
    paranoid: true,
    deletedAt: "deleted_at",
    // ✅ Indexes for high-frequency query patterns
    indexes: [
      { fields: ["instructor_id"] },
      { fields: ["status"] },
      { fields: ["instructor_id", "status"] },
    ],
  }
);

export default Course;
