"use strict";

const TABLE_NAME = "users";

const isMissingTableError = (error) => {
  const code = error?.original?.code;
  return code === "ER_NO_SUCH_TABLE" || /no such table/i.test(error?.message || "");
};

const tableExists = async (queryInterface, tableName) => {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch (error) {
    if (isMissingTableError(error)) {
      return false;
    }
    throw error;
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await tableExists(queryInterface, TABLE_NAME)) {
      console.log(`Skipped creating ${TABLE_NAME}; table already exists.`);
      return;
    }

    await queryInterface.createTable(
      TABLE_NAME,
      {
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        google_id: {
          type: Sequelize.STRING,
          allowNull: true,
          unique: true
        },
        name: {
          type: Sequelize.STRING,
          allowNull: true
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING,
          allowNull: true
        },
        role: {
          type: Sequelize.ENUM("student", "instructor", "admin", "parent"),
          allowNull: false,
          defaultValue: "student"
        },
        is_verified: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        email_verified_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        verification_token: {
          type: Sequelize.STRING,
          allowNull: true
        },
        verification_token_expires: {
          type: Sequelize.DATE,
          allowNull: true
        },
        reset_password_token: {
          type: Sequelize.STRING,
          allowNull: true
        },
        reset_password_expires: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
        }
      },
      {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci"
      }
    );

    console.log(`Created ${TABLE_NAME} table.`);
  },

  async down(queryInterface) {
    if (!(await tableExists(queryInterface, TABLE_NAME))) {
      console.log(`Skipped dropping ${TABLE_NAME}; table does not exist.`);
      return;
    }

    await queryInterface.dropTable(TABLE_NAME);
    console.log(`Dropped ${TABLE_NAME} table.`);
  }
};
