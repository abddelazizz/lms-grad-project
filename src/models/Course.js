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
        model: 'instructors',
        key: 'user_id',
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    tableName: "courses",
    timestamps: false,
  }
);

export default Course;
