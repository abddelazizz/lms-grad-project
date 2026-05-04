import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const VideoProgress = sequelize.define("VideoProgress", {
  student_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  content_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  watched_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  last_accessed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, { tableName: "video_progress", timestamps: false });

export default VideoProgress;
