import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Parent = sequelize.define("Parent", {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  }
}, { tableName: "parents", timestamps: false });

export default Parent;
