'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('quizzes', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('quizzes', 'num_questions', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('quizzes', 'score_per_question', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('quizzes', 'total_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('quizzes', 'material_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('quizzes', 'status', {
      type: Sequelize.ENUM('draft', 'published'),
      defaultValue: 'draft',
      allowNull: false,
    });

    await queryInterface.addColumn('quiz_attempts', 'total_quiz_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addConstraint('quiz_attempts', {
      fields: ['quiz_id', 'student_id'],
      type: 'unique',
      name: 'quiz_attempts_quiz_id_student_id_unique',
    });
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