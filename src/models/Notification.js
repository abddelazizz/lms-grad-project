import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Notification = sequelize.define(
  "Notification",
  {
    notification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    type: {
      type: DataTypes.ENUM("new_submission", "new_review"),
      allowNull: false,
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "assignment_submissions",
        key: "submission_id",
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
    tableName: "notifications",
    timestamps: false,
    indexes: [
      // Fast lookup: "show me all unread notifications for this user"
      { fields: ["user_id", "is_read"] },
      // Fast lookup by type for inbox filtering
      { fields: ["user_id", "type"] },
    ],
  }
);

export default Notification;
