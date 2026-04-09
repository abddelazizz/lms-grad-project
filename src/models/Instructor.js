import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Instructor = sequelize.define(
  "Instructor",
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
    bio: {
      type: DataTypes.TEXT,
    },
    specialization: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "instructors",
    timestamps: false,
  }
);

export default Instructor;
