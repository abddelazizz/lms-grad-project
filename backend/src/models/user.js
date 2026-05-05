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

    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },

    name: {
      type: DataTypes.STRING,
    },

    picture: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff",
    },

    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },

    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
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

    token_version: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },

    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },

    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    mfa_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },

    mfa_secret: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },

  {
    tableName: "users",
    timestamps: false,
    hooks: {
      beforeUpdate(user) {
        user.updated_at = new Date();
      },
      async afterUpdate(user) {
        // Auto-create Instructor profile when role is changed to "instructor"
        if (user.changed("role") && user.role === "instructor") {
          const { default: Instructor } = await import("./Instructor.js");
          const existing = await Instructor.findByPk(user.user_id);
          if (!existing) {
            await Instructor.create({
              user_id: user.user_id,
              bio: null,
              specialization: null,
            });
          }
        }
      },
    },
  },
);

export default User;
