import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Student = sequelize.define(
  "Student",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },
    grade_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parent_id: {
      type: DataTypes.INTEGER, // If we want parents linked, this might be optional for now
      allowNull: true,
    },
    total_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "students",
    timestamps: false,
  }
);

export default Student;
