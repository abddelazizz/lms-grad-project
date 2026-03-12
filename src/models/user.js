import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    google_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },

    name: {
      type: DataTypes.STRING,
    },

    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },

    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    role: {
      type: DataTypes.ENUM("student", "instructor", "admin", "parent"),
      defaultValue: "student",
    },

    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    verification_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },

  {
    tableName: "users",
    timestamps: false,
  }
);

export default User;
