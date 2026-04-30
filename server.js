import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import { sequelize } from "./src/config/index.js";
import initializeSocket from "./src/socket/index.js";

const PORT = process.env.PORT || 5000;

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

let server;
let httpServer;
let io;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL");

    await sequelize.sync();
    console.log("Database synced");

    httpServer = http.createServer(app);

    io = initializeSocket(httpServer);

    server = httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

export { io };
export default startServer;