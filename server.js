import "dotenv/config";
import app from "./src/app.js";
import { sequelize } from "./src/config/index.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL");

    await sequelize.sync({ alter: true });
    console.log('Database "recodeAcademy" is synced');

    app.listen(PORT, () => {
      console.log(`Server running at: ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:");
    console.error(error.message);
  }
}

startServer();
