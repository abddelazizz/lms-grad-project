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
    let columns = await describeUsersTable(queryInterface);
    if (!columns) {
      console.log(`Skipped ${TABLE_NAME}.username migration; table does not exist.`);
      return;
    }

    if (hasColumn(columns, "user_name") && !hasColumn(columns, "username")) {
      await queryInterface.renameColumn(TABLE_NAME, "user_name", "username");
      console.log("Renamed users.user_name to users.username.");
      columns = await describeUsersTable(queryInterface);
    }

    if (!hasColumn(columns, "username")) {
      await queryInterface.addColumn(TABLE_NAME, "username", {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log("Added users.username column.");
    } else {
      console.log("Skipped users.username creation; column already exists.");
    }
  },

  async down(queryInterface) {
    const columns = await describeUsersTable(queryInterface);
    if (!columns) {
      console.log(`Skipped rollback for ${TABLE_NAME}.username; table does not exist.`);
      return;
    }

    if (hasColumn(columns, "username")) {
      await queryInterface.removeColumn(TABLE_NAME, "username");
      console.log("Removed users.username column.");
    } else {
      console.log("Skipped removing users.username; column does not exist.");
    }
  }
};
