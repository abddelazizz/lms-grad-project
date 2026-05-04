require("dotenv/config");

const baseConfig = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || null,
  database: process.env.DB_NAME || "database_development",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  dialect: "mysql",
  logging: false
};

module.exports = {
  development: {
    ...baseConfig
  },
  test: {
    ...baseConfig,
    database: process.env.DB_TEST_NAME || process.env.DB_NAME || "database_test"
  },
  production: {
    ...baseConfig
  }
};
