import "dotenv/config";
import app from "./src/app.js";
import { sequelize } from "./src/config/index.js";

const PORT = process.env.PORT || 5000;

process.on("uncaughtException", (err) => {
  console.error(err.name, err.message);
  process.exit(1);
});

let server;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL");

    await sequelize.sync({ alter: true });
    console.log("Database synced");

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
    process.exit(1);
  }
}

process.on("unhandledRejection", (err) => {
  console.error(err.name, err.message);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

startServer();

