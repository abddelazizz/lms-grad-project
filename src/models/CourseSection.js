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
  },
  {
    tableName: "course_sections",
    timestamps: false,
  }
);

export default CourseSection;
