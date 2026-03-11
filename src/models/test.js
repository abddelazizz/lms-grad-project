import { DataTypes } from "sequelize";
import { sequelize } from "../config/index.js";

const Test = sequelize.define("Test", {
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default Test;
