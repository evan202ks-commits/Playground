const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/User');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';

// --- Google ---
// N'active la stratégie que si les identifiants sont configurés sur Render.
// Sans ça, le serveur plantait au démarrage dès que GOOGLE_CLIENT_ID manquait.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        const email = profile.emails?.[0]?.value || `${profile.id}@google.playground-defense`;
        user = await User.create({
          username: sanitizeUsername(profile.displayName || `Joueur${profile.id.slice(-5)}`),
          email,
          googleId: profile.id
        });
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));
} else {
  console.warn('Connexion Google désactivée : GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants.');
}

// --- Discord ---
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/api/auth/discord/callback`,
    scope: ['identify', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ discordId: profile.id });
      if (!user) {
        const email = profile.email || `${profile.id}@discord.playground-defense`;
        user = await User.create({
          username: sanitizeUsername(profile.username || `Joueur${profile.id.slice(-5)}`),
          email,
          discordId: profile.id
        });
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));
} else {
  console.warn('Connexion Discord désactivée : DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET manquants.');
}

// Rend un pseudo unique compatible avec le schéma (3-20 caractères)
function sanitizeUsername(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || `Joueur${Date.now().toString().slice(-6)}`;
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
