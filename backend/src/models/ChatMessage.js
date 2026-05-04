import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const ChatMessage = sequelize.define(
  "ChatMessage",
  {
    message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "conversations",
        key: "conversation_id",
      },
      onDelete: "CASCADE",
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000],
      },
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "chat_messages",
    timestamps: false,
    indexes: [
      { fields: ["conversation_id", "created_at"] },
      { fields: ["sender_id"] },
    ],
  }
);

export default ChatMessage;
