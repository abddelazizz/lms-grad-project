import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { googleAuth } from "../services/index.js";
import logger from "../utils/logger.js";

const configurePassport = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    logger.warn({
      event: "GOOGLE_OAUTH_DISABLED",
      message: "Google OAuth strategy was not configured because required environment variables are missing.",
    });
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const name = profile.displayName;
          const email = profile.emails?.[0]?.value;
          const picture = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email returned from Google."), null);
          }

          const user = await googleAuth(googleId, name, email, picture);
          return done(null, user);
        } catch (err) {
          logger.error({
            event: "GOOGLE_OAUTH_FAILURE",
            message: err.message,
            stack: err.stack,
          });
          return done(err, null);
        }
      }
    )
  );
};

export default configurePassport;
