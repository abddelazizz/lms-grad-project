import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Conversation = sequelize.define(
  "Conversation",
  {
    conversation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "students",
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    instructor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "instructors",
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "conversations",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["student_id", "instructor_id"],
      },
      { fields: ["student_id"] },
      { fields: ["instructor_id"] },
    ],
  }
);

export default Conversation;