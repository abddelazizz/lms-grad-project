import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const CourseSection = sequelize.define(
  "CourseSection",
  {
    section_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order_index: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "course_sections",
    timestamps: true,
    createdAt: false,
    updatedAt: false,
    paranoid: true,
    deletedAt: "deleted_at",
  }
);

export default CourseSection;
