import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Admin = sequelize.define("Admin", {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  }
}, { tableName: "admins", timestamps: false });

export default Admin;
