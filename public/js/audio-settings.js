/**
 * Playground Defense — Système de paramètres audio.
 * Gère la musique, les effets sonores (bruitages), les volumes et le "muet total".
 * Les préférences sont sauvegardées dans localStorage et partagées entre toutes
 * les pages du site (login, home, futur écran de jeu).
 */
(function () {
  const STORAGE_KEY = 'pd_settings';

  const DEFAULTS = {
    masterVolume: 80,   // volume général, 0-100
    musicVolume: 60,    // volume de la musique, 0-100
    sfxVolume: 80,      // volume des effets sonores / bruitages, 0-100
    musicEnabled: true, // musique activée/désactivée
    sfxEnabled: true,   // effets sonores activés/désactivés
    muteAll: false,     // coupe tout (musique + effets), prioritaire sur le reste
  };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function saveSettings(s) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      // stockage indisponible (navigation privée, quota...) : on continue sans persister
    }
  }

  let settings = loadSettings();
  let musicEl = null;

  function clamp01(v) {
    return Math.min(1, Math.max(0, v));
  }

  function effectiveMusicVolume() {
    if (settings.muteAll || !settings.musicEnabled) return 0;
    return clamp01((settings.masterVolume / 100) * (settings.musicVolume / 100));
  }

  function effectiveSfxVolume() {
    if (settings.muteAll || !settings.sfxEnabled) return 0;
    return clamp01((settings.masterVolume / 100) * (settings.sfxVolume / 100));
  }

  function applyMusicVolume() {
    if (!musicEl) return;
    musicEl.volume = effectiveMusicVolume();
  }

  function updateMusicPlayback() {
    if (!musicEl) return;
    if (effectiveMusicVolume() <= 0) {
      musicEl.pause();
    } else {
      tryStartMusic();
    }
  }

  /** À appeler une fois avec l'élément <audio> de fond de la page. */
  function registerMusic(audioEl) {
    musicEl = audioEl;
    applyMusicVolume();
  }

  /** Tente de lancer la musique. Les navigateurs bloquent l'autoplay sans interaction. */
  function tryStartMusic() {
    if (!musicEl) return;
    if (effectiveMusicVolume() <= 0) return;
    if (!musicEl.paused) return;
    musicEl.play().catch(() => {
      // Autoplay refusé par le navigateur : armFirstInteraction() relancera la lecture.
    });
  }

  /** Joue un effet sonore ponctuel (clic, notification...). */
  function playSfx(name) {
    const vol = effectiveSfxVolume();
    if (vol <= 0) return;
    const file = name === 'click' ? 'sfx-click.mp3' : 'sfx-notification.mp3';
    try {
      const a = new Audio(`audio/${file}`);
      a.volume = vol;
      a.play().catch(() => {});
    } catch (e) {
      // lecture audio indisponible : on ignore silencieusement
    }
  }

  function get() {
    return { ...settings };
  }

  function update(patch) {
    settings = { ...settings, ...patch };
    saveSettings(settings);
    applyMusicVolume();
    updateMusicPlayback();
  }

  function reset() {
    settings = { ...DEFAULTS };
    saveSettings(settings);
    applyMusicVolume();
    updateMusicPlayback();
  }

  /** Démarre (ou relance) la musique dès le premier clic/touche, requis par les navigateurs. */
  function armFirstInteraction() {
    const start = () => {
      tryStartMusic();
      document.removeEventListener('click', start);
      document.removeEventListener('keydown', start);
    };
    document.addEventListener('click', start, { once: true });
    document.addEventListener('keydown', start, { once: true });
  }

  window.PDAudio = {
    get,
    update,
    reset,
    registerMusic,
    tryStartMusic,
    playSfx,
    armFirstInteraction,
    DEFAULTS,
  };
})();
