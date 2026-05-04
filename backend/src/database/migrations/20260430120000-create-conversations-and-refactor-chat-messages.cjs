'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [tables] = await queryInterface.sequelize.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'conversations'
    `);

    if (tables.length === 0) {
      await queryInterface.createTable('conversations', {
        conversation_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        student_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'students',
            key: 'user_id',
          },
          onDelete: 'CASCADE',
        },
        instructor_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'instructors',
            key: 'user_id',
          },
          onDelete: 'CASCADE',
        },
        last_message_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      await queryInterface.addIndex('conversations', ['student_id', 'instructor_id'], {
        name: 'conversations_student_instructor_unique',
        unique: true,
      });
      await queryInterface.addIndex('conversations', ['student_id']);
      await queryInterface.addIndex('conversations', ['instructor_id']);
    }

    const [receiverCol] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_messages'
        AND COLUMN_NAME = 'receiver_id'
    `);

    if (receiverCol.length > 0) {
      const [existingPairs] = await queryInterface.sequelize.query(`
        SELECT
          sender_id AS user_a,
          receiver_id AS user_b
        FROM chat_messages
        UNION
        SELECT
          receiver_id AS user_a,
          sender_id AS user_b
        FROM chat_messages
      `);

      if (existingPairs.length > 0) {
        for (const pair of existingPairs) {
          const userA = pair.user_a;
          const userB = pair.user_b;

          const [rolesA] = await queryInterface.sequelize.query(
            `SELECT role FROM users WHERE user_id = ?`,
            { replacements: [userA] }
          );
          const [rolesB] = await queryInterface.sequelize.query(
            `SELECT role FROM users WHERE user_id = ?`,
            { replacements: [userB] }
          );

          const roleA = rolesA?.[0]?.role;
          const roleB = rolesB?.[0]?.role;

          const studentId = roleA === 'student' ? userA : roleB === 'student' ? userB : null;
          const instructorId = roleA === 'instructor' ? userA : roleB === 'instructor' ? userB : null;

          if (studentId && instructorId) {
            await queryInterface.sequelize.query(
              `INSERT IGNORE INTO conversations (student_id, instructor_id, created_at) VALUES (?, ?, NOW())`,
              { replacements: [studentId, instructorId] }
            );
          }
        }

        await queryInterface.sequelize.query(`
          UPDATE chat_messages cm
          INNER JOIN (
            SELECT
              cm2.message_id,
              c.conversation_id,
              cm2.sender_id,
              cm2.receiver_id
            FROM chat_messages cm2
            INNER JOIN conversations c ON (
              (c.student_id = cm2.sender_id AND c.instructor_id = cm2.receiver_id)
              OR
              (c.student_id = cm2.receiver_id AND c.instructor_id = cm2.sender_id)
            )
          ) AS mapping ON cm.message_id = mapping.message_id
          SET cm.conversation_id = mapping.conversation_id
        `);

        await queryInterface.sequelize.query(`
          UPDATE conversations c
          INNER JOIN (
            SELECT conversation_id, MAX(created_at) AS last_msg
            FROM chat_messages
            WHERE conversation_id IS NOT NULL
            GROUP BY conversation_id
          ) lm ON c.conversation_id = lm.conversation_id
          SET c.last_message_at = lm.last_msg
        `);
      }
    }

    // Add conversation_id column to chat_messages (if not already added by migration above)
    // The column might already exist if data was migrated; check first
    const [cols] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_messages'
        AND COLUMN_NAME = 'conversation_id'
    `);

    if (cols.length === 0) {
      await queryInterface.addColumn('chat_messages', 'conversation_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'conversations',
          key: 'conversation_id',
        },
        onDelete: 'CASCADE',
      });
    }

    // Now make conversation_id NOT NULL after data migration
    // (Only if all rows have been migrated successfully)
    const [nullRows] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) AS cnt FROM chat_messages WHERE conversation_id IS NULL`
    );

    if (Number(nullRows[0].cnt) === 0) {
      await queryInterface.changeColumn('chat_messages', 'conversation_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'conversation_id',
        },
        onDelete: 'CASCADE',
      });
    }

    // Add new column: content (migrate from message column)
    const [contentCol] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_messages'
        AND COLUMN_NAME = 'content'
    `);

    if (contentCol.length === 0) {
      await queryInterface.addColumn('chat_messages', 'content', {
        type: Sequelize.TEXT,
        allowNull: true,
      });

      // Copy data from 'message' to 'content'
      await queryInterface.sequelize.query(
        `UPDATE chat_messages SET content = message WHERE content IS NULL`
      );

      // Make content NOT NULL
      await queryInterface.changeColumn('chat_messages', 'content', {
        type: Sequelize.TEXT,
        allowNull: false,
      });
    }

    const [convMsgIdx] = await queryInterface.sequelize.query(`
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_messages'
        AND INDEX_NAME = 'chat_messages_conversation_created_at_idx'
    `);
    if (convMsgIdx.length === 0) {
      await queryInterface.addIndex('chat_messages', ['conversation_id', 'created_at'], {
        name: 'chat_messages_conversation_created_at_idx',
      });
    }

    const [senderIdx] = await queryInterface.sequelize.query(`
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_messages'
        AND INDEX_NAME = 'chat_messages_sender_id_idx'
    `);
    if (senderIdx.length === 0) {
      await queryInterface.addIndex('chat_messages', ['sender_id'], {
        name: 'chat_messages_sender_id_idx',
      });
    }

    // Drop old columns that are no longer needed
    const [messageCol] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_messages'
        AND COLUMN_NAME = 'message'
    `);
    if (messageCol.length > 0) {
      await queryInterface.removeColumn('chat_messages', 'message');
    }

    // Drop old underscored columns if they exist (updatedAt, createdAt from previous schema)
    const [updatedAtCol] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_messages'
        AND COLUMN_NAME = 'updatedAt'
    `);
    if (updatedAtCol.length > 0) {
      await queryInterface.removeColumn('chat_messages', 'updatedAt');
    }

    // Add created_at if missing
    const [createdAtCol] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_messages'
        AND COLUMN_NAME = 'created_at'
    `);
    if (createdAtCol.length === 0) {
      await queryInterface.addColumn('chat_messages', 'created_at', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Re-add receiver_id and message columns
    await queryInterface.addColumn('chat_messages', 'receiver_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
    });

    await queryInterface.addColumn('chat_messages', 'message', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Migrate data back: copy content to message, figure out receiver_id from conversation
    await queryInterface.sequelize.query(`
      UPDATE chat_messages cm
      INNER JOIN conversations c ON cm.conversation_id = c.conversation_id
      SET cm.receiver_id = CASE
        WHEN cm.sender_id = c.student_id THEN c.instructor_id
        ELSE c.student_id
      END,
      cm.message = cm.content
    `);

    // Remove new columns
    await queryInterface.removeColumn('chat_messages', 'content');
    await queryInterface.removeColumn('chat_messages', 'conversation_id');

    // Drop conversations table
    await queryInterface.dropTable('conversations');
  },
};