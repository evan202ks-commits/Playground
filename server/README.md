# Playground Defense — Backend de compte

API d'authentification (email/mot de passe + OAuth Google/Discord) et de profil
joueur (ELO 1V1 / 2V2, rang, stats, historique).

## Déploiement sur Render

1. Pousse ce dossier `server/` dans un dépôt Git (GitHub/GitLab).
2. Sur [Render](https://dashboard.render.com/), crée un **New Web Service** et
   connecte le dépôt.
3. Configuration du service :
   - **Root Directory** : `server` (si le repo contient aussi le frontend)
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance Type** : Free suffit pour commencer
4. Ajoute les variables d'environnement (onglet *Environment*), à partir de
   `.env.example` :
   - `MONGODB_URI` — crée un cluster gratuit sur MongoDB Atlas et colle l'URI
     de connexion
   - `JWT_SECRET`, `SESSION_SECRET` — génère des chaînes aléatoires
     (`openssl rand -hex 32`)
   - `CLIENT_URL` — l'URL où sera hébergé le frontend (`home.html`, `login.html`)
   - `SERVER_URL` — l'URL Render de ce service une fois créé, ex.
     `https://playground-defense-api.onrender.com`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`
5. Déploie. Render assigne le port automatiquement via `process.env.PORT` —
   c'est déjà géré dans `server.js`.

## Configurer les fournisseurs OAuth

**Google** ([console.cloud.google.com](https://console.cloud.google.com/) →
APIs & Services → Identifiants → Créer des identifiants → ID client OAuth) :
- Type d'application : Application Web
- URI de redirection autorisée : `https://<ton-service>.onrender.com/api/auth/google/callback`

**Discord** ([discord.com/developers/applications](https://discord.com/developers/applications)) :
- Crée une application → OAuth2 → Redirects
- Ajoute : `https://<ton-service>.onrender.com/api/auth/discord/callback`

## Côté frontend

Dans `login.html` et `home.html`, remplace la constante `API_BASE` par l'URL
Render réelle du service une fois déployé.

## Endpoints

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Crée un compte (pseudo, email, mot de passe) |
| POST | `/api/auth/login` | Connexion, renvoie un token JWT |
| GET | `/api/auth/google` | Démarre le flux OAuth Google |
| GET | `/api/auth/discord` | Démarre le flux OAuth Discord |
| GET | `/api/me` | Profil du joueur connecté (ELO, rang, stats) — nécessite `Authorization: Bearer <token>` |

## Système de paramètres (audio)

Le bouton ⚙ (page d'accueil et page de connexion) ouvre une modale de paramètres
qui gère :
- Un volume général.
- La musique de fond du menu (activer/désactiver + volume).
- Les effets sonores / bruitages (clics, notifications) (activer/désactiver + volume).
- Un interrupteur « couper tous les sons ».

Les réglages sont sauvegardés dans `localStorage` (clé `pd_settings`) et
s'appliquent immédiatement, sans backend. La logique est centralisée dans
`public/js/audio-settings.js` (objet `window.PDAudio`), réutilisable telle
quelle pour un futur écran de jeu. Les fichiers audio de démonstration se
trouvent dans `public/audio/` (`menu-music.mp3`, `sfx-click.mp3`,
`sfx-notification.mp3`) — à remplacer par tes propres pistes/bruitages quand
tu en auras.

## Étapes suivantes suggérées

- Ajouter la mise à jour de l'ELO après chaque partie (calcul basé sur
  l'écart d'ELO entre les deux joueurs, comme décrit dans le concept du jeu).
- Ajouter un serveur de matchmaking/temps réel (ex. via WebSocket) — peut être
  déployé comme un second Web Service Render.
- Brancher de vrais effets sonores de jeu (construction de tour, vague
  d'ennemis, victoire/défaite) sur `PDAudio.playSfx(...)`.
