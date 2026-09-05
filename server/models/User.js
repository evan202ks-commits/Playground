const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  mode: { type: String, enum: ['1v1', '2v2'], required: true },
  opponent: { type: String, required: true },
  result: { type: String, enum: ['win', 'loss'], required: true },
  eloChange: { type: Number, required: true },
  playedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  // Optionnel : un compte créé via OAuth n'a pas forcément de mot de passe
  passwordHash: { type: String },

  // Identifiants liés aux fournisseurs OAuth
  googleId: { type: String, unique: true, sparse: true },
  discordId: { type: String, unique: true, sparse: true },

  // Système Ranked / ELO — un classement séparé par mode
  eloSolo: { type: Number, default: 1000 }, // ELO 1V1
  eloDuo: { type: Number, default: 1000 },  // ELO 2V2

  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    maxElo: { type: Number, default: 1000 }
  },

  recentMatches: { type: [matchSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
