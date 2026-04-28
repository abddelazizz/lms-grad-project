"use strict";

const TABLE_NAME = "users";
const INDEX_NAME = "users_username_unique";
const MAX_USERNAME_LENGTH = 255;

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

const hasUniqueUsernameIndex = (indexes) =>
  indexes.some(
    (index) =>
      index.unique &&
      (index.name === INDEX_NAME ||
        (Array.isArray(index.fields) &&
          index.fields.some((field) => field.attribute === "username" || field.name === "username")))
  );

const fetchDuplicateUsernames = async (queryInterface) => {
  const [rows] = await queryInterface.sequelize.query(
    `
      SELECT username
      FROM users
      WHERE username IS NOT NULL AND username <> ''
      GROUP BY username
      HAVING COUNT(*) > 1
    `
  );

  return rows.map((row) => row.username);
};

const fetchUsersByUsername = async (queryInterface, username) => {
  const [rows] = await queryInterface.sequelize.query(
    `
      SELECT user_id, username
      FROM users
      WHERE username = :username
      ORDER BY user_id ASC
    `,
    {
      replacements: { username }
    }
  );

  return rows;
};

const usernameExists = async (queryInterface, username) => {
  const [rows] = await queryInterface.sequelize.query(
    `
      SELECT user_id
      FROM users
      WHERE username = :username
      LIMIT 1
    `,
    {
      replacements: { username }
    }
  );

  return rows.length > 0;
};

const buildCandidate = (username, counter) => {
  const suffix = String(counter);
  const baseUsername = String(username || "user").trim() || "user";
  const maxBaseLength = Math.max(1, MAX_USERNAME_LENGTH - suffix.length);
  const truncatedBase = baseUsername.slice(0, maxBaseLength);
  return `${truncatedBase}${suffix}`;
};

const generateUniqueUsername = async (queryInterface, username, startCounter = 1) => {
  let counter = startCounter;
  let candidate = buildCandidate(username, counter);

  while (await usernameExists(queryInterface, candidate)) {
    counter += 1;
    candidate = buildCandidate(username, counter);
  }

  return candidate;
};

const fixDuplicateGroup = async (queryInterface, username) => {
  const users = await fetchUsersByUsername(queryInterface, username);

  if (users.length <= 1) {
    return;
  }

  let counter = 1;
  for (let index = 1; index < users.length; index += 1) {
    const user = users[index];
    const nextUsername = await generateUniqueUsername(queryInterface, username, counter);

    await queryInterface.sequelize.query(
      `
        UPDATE users
        SET username = :nextUsername
        WHERE user_id = :userId
      `,
      {
        replacements: {
          nextUsername,
          userId: user.user_id
        }
      }
    );

    console.log(`Updated duplicate username for user_id=${user.user_id}: ${username} -> ${nextUsername}`);

    counter += 1;
  }
};

module.exports = {
  async up(queryInterface) {
    const columns = await describeUsersTable(queryInterface);
    if (!columns) {
      console.log(`Skipped username index migration; ${TABLE_NAME} table does not exist.`);
      return;
    }

    if (!hasColumn(columns, "username")) {
      console.log("Skipped username index migration; users.username column does not exist.");
      return;
    }

    const indexes = await queryInterface.showIndex(TABLE_NAME);
    if (hasUniqueUsernameIndex(indexes)) {
      console.log(`Skipped adding ${INDEX_NAME}; unique username index already exists.`);
      return;
    }

    const duplicateUsernames = await fetchDuplicateUsernames(queryInterface);
    for (const username of duplicateUsernames) {
      await fixDuplicateGroup(queryInterface, username);
    }

    await queryInterface.addIndex(TABLE_NAME, ["username"], {
      name: INDEX_NAME,
      unique: true
    });

    console.log(`Added unique index ${INDEX_NAME} on users.username.`);
  },

  async down(queryInterface) {
    const columns = await describeUsersTable(queryInterface);
    if (!columns) {
      console.log(`Skipped removing ${INDEX_NAME}; ${TABLE_NAME} table does not exist.`);
      return;
    }

    const indexes = await queryInterface.showIndex(TABLE_NAME);
    const targetIndex = indexes.find((index) => index.name === INDEX_NAME);

    if (!targetIndex) {
      console.log(`Skipped removing ${INDEX_NAME}; index does not exist.`);
      return;
    }

    await queryInterface.removeIndex(TABLE_NAME, INDEX_NAME);
    console.log(`Removed index ${INDEX_NAME}.`);
  }
};
