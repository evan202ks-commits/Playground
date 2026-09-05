const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5500';

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// --- Inscription par email/mot de passe ---
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Pseudo, email et mot de passe sont requis.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères.' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: 'Ce pseudo ou cet email est déjà utilisé.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });

    res.status(201).json({ token: signToken(user) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
});

// --- Connexion par email/mot de passe ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    res.json({ token: signToken(user) });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

// Empêche d'utiliser une stratégie OAuth qui n'a pas été configurée sur Render
function requireStrategy(name) {
  return (req, res, next) => {
    if (!passport._strategy(name)) {
      return res.status(503).json({ message: `Connexion ${name} pas encore configurée sur le serveur.` });
    }
    next();
  };
}

// --- OAuth Google ---
router.get('/google', requireStrategy('google'), passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
  requireStrategy('google'),
  passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_URL}/login.html` }),
  (req, res) => {
    const token = signToken(req.user);
    res.redirect(`${CLIENT_URL}/oauth-callback.html?token=${token}`);
  }
);

// --- OAuth Discord ---
router.get('/discord', requireStrategy('discord'), passport.authenticate('discord', { session: false }));
router.get('/discord/callback',
  requireStrategy('discord'),
  passport.authenticate('discord', { session: false, failureRedirect: `${CLIENT_URL}/login.html` }),
  (req, res) => {
    const token = signToken(req.user);
    res.redirect(`${CLIENT_URL}/oauth-callback.html?token=${token}`);
  }
);

module.exports = router;
