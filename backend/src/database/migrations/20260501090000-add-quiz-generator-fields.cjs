'use strict';

const columnExists = async (queryInterface, table, column) => {
  const [rows] = await queryInterface.sequelize.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${table}'
      AND COLUMN_NAME = '${column}'
  `);
  return rows.length > 0;
};

const constraintExists = async (queryInterface, table, constraintName) => {
  const [rows] = await queryInterface.sequelize.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${table}'
      AND CONSTRAINT_NAME = '${constraintName}'
  `);
  return rows.length > 0;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!await columnExists(queryInterface, 'quizzes', 'duration')) {
      await queryInterface.addColumn('quizzes', 'duration', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!await columnExists(queryInterface, 'quizzes', 'num_questions')) {
      await queryInterface.addColumn('quizzes', 'num_questions', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!await columnExists(queryInterface, 'quizzes', 'score_per_question')) {
      await queryInterface.addColumn('quizzes', 'score_per_question', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!await columnExists(queryInterface, 'quizzes', 'total_score')) {
      await queryInterface.addColumn('quizzes', 'total_score', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!await columnExists(queryInterface, 'quizzes', 'material_url')) {
      await queryInterface.addColumn('quizzes', 'material_url', { type: Sequelize.STRING, allowNull: true });
    }
    if (!await columnExists(queryInterface, 'quizzes', 'status')) {
      await queryInterface.addColumn('quizzes', 'status', {
        type: Sequelize.ENUM('draft', 'published'),
        defaultValue: 'draft',
        allowNull: false,
      });
    }
    if (!await columnExists(queryInterface, 'quiz_attempts', 'total_quiz_score')) {
      await queryInterface.addColumn('quiz_attempts', 'total_quiz_score', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!await constraintExists(queryInterface, 'quiz_attempts', 'quiz_attempts_quiz_id_student_id_unique')) {
      await queryInterface.addConstraint('quiz_attempts', {
        fields: ['quiz_id', 'student_id'],
        type: 'unique',
        name: 'quiz_attempts_quiz_id_student_id_unique',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('quizzes', 'duration');
    await queryInterface.removeColumn('quizzes', 'num_questions');
    await queryInterface.removeColumn('quizzes', 'score_per_question');
    await queryInterface.removeColumn('quizzes', 'total_score');
    await queryInterface.removeColumn('quizzes', 'material_url');
    await queryInterface.removeColumn('quizzes', 'status');
    await queryInterface.removeColumn('quiz_attempts', 'total_quiz_score');

    await queryInterface.removeConstraint('quiz_attempts', 'quiz_attempts_quiz_id_student_id_unique');
  },
};
