import 'dotenv/config';
import { sequelize } from '../src/config/index.js';

async function syncDb() {
  try {
    await sequelize.query("ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0;");
    console.log("Column token_version added successfully.");
    process.exit(0);
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
       console.log("Column already exists.");
       process.exit(0);
    }
    console.error("Sync failed:", error);
    process.exit(1);
  }
}

syncDb();
