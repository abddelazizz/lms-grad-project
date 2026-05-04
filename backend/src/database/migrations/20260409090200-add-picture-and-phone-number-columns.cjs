"use strict";

const TABLE_NAME = "users";

const isMissingTableError = (error) => {
  const code = error?.original?.code;
  return code === "ER_NO_SUCH_TABLE" || /no such table/i.test(error?.message || "");
};

const describeUsersTable = async (queryInterface) => {
  try {
    return await queryInterface.describeTable(TABLE_NAME);
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
};

const hasColumn = (columns, columnName) =>
  Boolean(columns && Object.prototype.hasOwnProperty.call(columns, columnName));

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await describeUsersTable(queryInterface);
    if (!columns) {
      console.log(`Skipped profile columns migration; ${TABLE_NAME} table does not exist.`);
      return;
    }

    if (!hasColumn(columns, "picture")) {
      await queryInterface.addColumn(TABLE_NAME, "picture", {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log("Added users.picture column.");
    } else {
      console.log("Skipped users.picture creation; column already exists.");
    }

    if (!hasColumn(columns, "phone_number")) {
      await queryInterface.addColumn(TABLE_NAME, "phone_number", {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log("Added users.phone_number column.");
    } else {
      console.log("Skipped users.phone_number creation; column already exists.");
    }
  },

  async down(queryInterface) {
    const columns = await describeUsersTable(queryInterface);
    if (!columns) {
      console.log(`Skipped rollback for profile columns; ${TABLE_NAME} does not exist.`);
      return;
    }

    if (hasColumn(columns, "picture")) {
      await queryInterface.removeColumn(TABLE_NAME, "picture");
      console.log("Removed users.picture column.");
    } else {
      console.log("Skipped removing users.picture; column does not exist.");
    }

    if (hasColumn(columns, "phone_number")) {
      await queryInterface.removeColumn(TABLE_NAME, "phone_number");
      console.log("Removed users.phone_number column.");
    } else {
      console.log("Skipped removing users.phone_number; column does not exist.");
    }
  }
};
