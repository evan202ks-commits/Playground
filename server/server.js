require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');
const User = require('./models/User');
const { requireAuth } = require('./middleware/auth');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// --- Routes d'authentification (email/mdp + OAuth Google/Discord) ---
app.use('/api/auth', authRoutes);

// --- Profil du joueur connecté : ELO, rang, stats, historique ---
app.get('/api/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('-passwordHash');
  if (!user) return res.status(404).json({ message: 'Compte introuvable.' });
  res.json(user);
});

app.get('/', (req, res) => {
  res.send('Playground Defense API — en ligne.');
});

// Render fournit le port via process.env.PORT : ne jamais le fixer en dur
const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Serveur Playground Defense démarré sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('Connexion MongoDB impossible :', err.message);
    process.exit(1);
  });
