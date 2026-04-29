"use strict";

const TABLE_NAME = "lesson_contents";
const COLUMN_NAME = "parent_content_id";
const FOREIGN_KEY_NAME = "lesson_contents_parent_content_id_fk";

const isMissingTableError = (error) => {
  const code = error?.original?.code;
  return code === "ER_NO_SUCH_TABLE" || /no such table/i.test(error?.message || "");
};

const describeLessonContentsTable = async (queryInterface) => {
  try {
    return await queryInterface.describeTable(TABLE_NAME);
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await describeLessonContentsTable(queryInterface);
    if (!columns) {
      console.log(`Skipped lesson parent migration; ${TABLE_NAME} table does not exist.`);
      return;
    }

    if (!columns[COLUMN_NAME]) {
      await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    const foreignKeys = await queryInterface.getForeignKeyReferencesForTable(TABLE_NAME);
    const hasForeignKey = foreignKeys.some(
      (key) => key.columnName === COLUMN_NAME || key.constraintName === FOREIGN_KEY_NAME
    );

    if (!hasForeignKey) {
      await queryInterface.addConstraint(TABLE_NAME, {
        fields: [COLUMN_NAME],
        type: "foreign key",
        name: FOREIGN_KEY_NAME,
        references: {
          table: TABLE_NAME,
          field: "content_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  },

  async down(queryInterface) {
    const columns = await describeLessonContentsTable(queryInterface);
    if (!columns || !columns[COLUMN_NAME]) {
      console.log(`Skipped rollback for ${COLUMN_NAME}; column does not exist.`);
      return;
    }

    const foreignKeys = await queryInterface.getForeignKeyReferencesForTable(TABLE_NAME);
    const hasForeignKey = foreignKeys.some(
      (key) => key.columnName === COLUMN_NAME || key.constraintName === FOREIGN_KEY_NAME
    );

    if (hasForeignKey) {
      await queryInterface.removeConstraint(TABLE_NAME, FOREIGN_KEY_NAME);
    }

    await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  },
};
