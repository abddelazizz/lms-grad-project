"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "token_version", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });
    await queryInterface.addColumn("users", "failed_login_attempts", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });
    await queryInterface.addColumn("users", "locked_until", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "password_changed_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "mfa_enabled", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn("users", "mfa_secret", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "updated_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "token_version");
    await queryInterface.removeColumn("users", "failed_login_attempts");
    await queryInterface.removeColumn("users", "locked_until");
    await queryInterface.removeColumn("users", "password_changed_at");
    await queryInterface.removeColumn("users", "mfa_enabled");
    await queryInterface.removeColumn("users", "mfa_secret");
    await queryInterface.removeColumn("users", "updated_at");
  },
};
