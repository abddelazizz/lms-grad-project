import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { googleAuth } from "../services/index.js";

const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const name = profile.displayName;
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("No email returned from Google."), null);
          }

          const user = await googleAuth(googleId, name, email);
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
};

export default configurePassport;
