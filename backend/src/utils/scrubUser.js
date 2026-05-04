/**
 * Centralized utility to remove sensitive data from user objects before returning to the client.
 * Add any new sensitive database columns to the destruction list here.
 */
export const scrubUser = (userRecord) => {
  // Check if it's a Sequelize model instance that needs toJSON()
  const userData = userRecord.toJSON ? userRecord.toJSON() : userRecord;
  
  const {
    password,
    verification_token,
    verification_token_expires,
    reset_password_token,
    reset_password_expires,
    ...safeUser
  } = userData;

  return safeUser;
};
