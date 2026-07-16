const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number((globalThis.process && process.env && process.env.PORT) || globalThis.MUSIC_LOBBY_PORT || 3000);
const MODERATOR_PASSWORD = rawEnv("MODERATOR_PASSWORD", "Kochamkotki");
const PUBLIC_DIR = path.join(__dirname, "public");
const MUSIC_DIR = path.join(PUBLIC_DIR, "music");
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "rooms.json");
const DATA_BACKUP_FILE = path.join(DATA_DIR, "rooms.backup.json");
const DB_FILE = path.join(DATA_DIR, "anime-opening-quiz.sqlite");
const AUTO_BACKUP_DIR = path.join(DATA_DIR, "backups");
const SEED_DATA_FILE = path.join(__dirname, "data", "rooms.json");
let sqliteDb = null;
let postgresPool = null;
let postgresPendingState = "";
let postgresSavePromise = null;
let persistenceBackend = { type: "json", label: "JSON", file: DATA_FILE };
let lastAutoBackupAt = 0;
const persistedRoomConfigs = {};
const rooms = new Map();
const sockets = new Map();
const soloStreaks = new Map();
const animeTitleLookupCache = new Map();
let globalCatalogRoom = null;
let lastSoloDayKey = "";
const ANSWER_TIME_LIMIT = 15;
const SOLO_CLIP_DURATION = 15;
const SOLO_SEGMENT_SPLIT = 7.5;
const SOLO_MEDIA_LOAD_TIMEOUT = 5;
const SOLO_PREROLL_DURATION = 3;
const DAILY_SOLO_ROUND_COUNT = 10;
const DEFAULT_CLIP_DURATION = 15;
const MAX_AVATAR_LENGTH = 60000;
const MAX_AUDIO_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_AUDIO_UPLOAD_BODY_BYTES = 36 * 1024 * 1024;
const YOUTUBE_INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const YOUTUBE_INNERTUBE_CLIENT = {
  clientName: "WEB",
  clientVersion: "2.20240726.00.00",
  hl: "en",
  gl: "US"
};

const DIFFICULTIES = [
  { key: "very_easy", label: "Very easy" },
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
  { key: "impossible", label: "Impossible" }
];

const QUALITY_STATUSES = [
  { key: "ok", label: "Dziala" },
  { key: "slow", label: "Wolno sie laduje" },
  { key: "reported", label: "Zgloszone" },
  { key: "needs_fix", label: "Do poprawy" },
  { key: "verified", label: "Sprawdzone" }
];

const DEFAULT_DIFFICULTY_SCORES = {
  very_easy: { first: 2, second: 1 },
  easy: { first: 3, second: 2 },
  medium: { first: 5, second: 3 },
  hard: { first: 7, second: 5 },
  impossible: { first: 10, second: 7 }
};

function rawEnv(key, fallback) {
  const value = globalThis.process && process.env ? process.env[key] : "";
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function now() {
  return Date.now() / 1000;
}

function id(prefix) {
  return String(prefix || "") + crypto.randomBytes(6).toString("hex");
}

function cloneScores(scores) {
  const result = {};
  DIFFICULTIES.forEach(function (difficulty) {
    const source = scores && scores[difficulty.key] ? scores[difficulty.key] : DEFAULT_DIFFICULTY_SCORES[difficulty.key];
    result[difficulty.key] = {
      first: Number(source.first) || 0,
      second: Number(source.second) || 0
    };
  });
  return result;
}

function roomCode(value) {
  const clean = String(value || "LOBBY")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 18);
  return clean || "LOBBY";
}

function cleanText(value, fallback, max) {
  const text = String(value || "").trim().replace(/\s+/g, " ").slice(0, max || 60);
  return text || fallback;
}

function rawText(value, max) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max || 120);
}

function cleanAliases(value) {
  const source = Array.isArray(value)
    ? value
    : String(value || "").split(/\n|,|;/);
  const seen = {};
  return source.map(function (item) {
    return rawText(item, 180);
  }).filter(function (item) {
    const key = normalizeAnswer(item);
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  }).slice(0, 20);
}

function hasJapaneseText(value) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(String(value || ""));
}

function cleanAnimeTitlePart(value) {
  return rawText(value, 180)
    .replace(/^TV\s+Anime\s+/i, "")
    .replace(/^Anime\s+/i, "")
    .replace(/[ă€Śă€Ťă€Žă€Źă€ă€‘]/g, "")
    .replace(/\s+[-|]\s*(?:Opening|OP|NCOP|Creditless).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitCombinedAnimeTitle(value) {
  const text = cleanAnimeTitlePart(value);
  const parts = text.split(/\s+\/\s+/).map(cleanAnimeTitlePart).filter(Boolean);
  if (parts.length >= 2) return { englishTitle: parts[0], romajiTitle: parts.slice(1).join(" / ") };
  return { englishTitle: text, romajiTitle: text };
}

function combinedAnimeTitle(englishTitle, romajiTitle, fallback) {
  const fallbackParts = splitCombinedAnimeTitle(fallback);
  const english = cleanAnimeTitlePart(englishTitle) || fallbackParts.englishTitle;
  const romaji = cleanAnimeTitlePart(romajiTitle) || fallbackParts.romajiTitle || english;
  const safeEnglish = english || romaji || "Anime bez nazwy";
  const safeRomaji = romaji || safeEnglish;
  return safeEnglish + " / " + safeRomaji;
}

function cleanImageUrl(value, fallback) {
  const text = rawText(value || fallback, 700);
  if (!text) return "";
  try {
    const url = new URL(text);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString().slice(0, 700);
  } catch (error) {}
  return "";
}

function youtubeThumbnailUrl(videoId) {
  const clean = rawText(videoId, 40);
  return /^[A-Za-z0-9_-]{11}$/.test(clean) ? "https://i.ytimg.com/vi/" + clean + "/hqdefault.jpg" : "";
}

function cleanAudioUrl(value, fallback) {
  const text = rawText(value || fallback, 700);
  if (!text) return "";
  if (text.startsWith("/music/")) return text;
  try {
    const url = new URL(text);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString().slice(0, 700);
  } catch (error) {}
  return "";
}

function qualityExists(key) {
  return QUALITY_STATUSES.some(function (status) {
    return status.key === key;
  });
}

function qualityLabel(key) {
  const match = QUALITY_STATUSES.find(function (status) {
    return status.key === key;
  });
  return match ? match.label : "Dziala";
}

function normalizeQualityStatus(value, fallback) {
  const key = rawText(value || fallback || "ok", 40);
  return qualityExists(key) ? key : "ok";
}

function cleanAvatar(value) {
  const text = String(value || "").trim();
  if (text.length > MAX_AVATAR_LENGTH) return "";
  if (!/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(text)) return "";
  return text;
}

function audioExtensionForUpload(fileName, mimeType) {
  const extension = path.extname(rawText(fileName, 160)).toLowerCase();
  if ([".mp3", ".wav", ".ogg", ".m4a"].includes(extension)) return extension;
  const mime = rawText(mimeType, 80).toLowerCase();
  if (mime === "audio/mpeg" || mime === "audio/mp3") return ".mp3";
  if (mime === "audio/wav" || mime === "audio/x-wav") return ".wav";
  if (mime === "audio/ogg") return ".ogg";
  if (mime === "audio/mp4" || mime === "audio/x-m4a") return ".m4a";
  return "";
}

function cleanAudioFileName(fileName, extension) {
  const base = path.basename(rawText(fileName, 160), path.extname(rawText(fileName, 160)))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "opening";
  return base + "-" + crypto.randomBytes(4).toString("hex") + extension;
}

function listLocalAudioFiles() {
  try {
    fs.mkdirSync(MUSIC_DIR, { recursive: true });
    return fs.readdirSync(MUSIC_DIR)
      .filter(function (fileName) {
        return [".mp3", ".wav", ".ogg", ".m4a"].includes(path.extname(fileName).toLowerCase());
      })
      .sort(function (a, b) { return a.localeCompare(b); })
      .map(function (fileName) {
        const filePath = path.join(MUSIC_DIR, fileName);
        const stat = fs.statSync(filePath);
        return {
          name: fileName,
          url: "/music/" + encodeURIComponent(fileName),
          size: stat.size
        };
      });
  } catch (error) {
    return [];
  }
}

function saveUploadedAudio(payload) {
  const dataUrl = String(payload.dataUrl || "");
  const match = dataUrl.match(/^data:([^;,]+)?;base64,([a-z0-9+/=]+)$/i);
  if (!match) return { error: "Wybierz poprawny plik audio." };

  const extension = audioExtensionForUpload(payload.fileName, payload.mimeType || match[1]);
  if (!extension) return { error: "Dozwolone sa pliki mp3, wav, ogg albo m4a." };

  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) return { error: "Plik audio jest pusty." };
  if (buffer.length > MAX_AUDIO_UPLOAD_BYTES) return { error: "Plik audio jest za duzy. Limit to 25 MB." };

  fs.mkdirSync(MUSIC_DIR, { recursive: true });
  const fileName = cleanAudioFileName(payload.fileName || "opening" + extension, extension);
  const filePath = path.join(MUSIC_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return {
    file: {
      name: fileName,
      url: "/music/" + encodeURIComponent(fileName),
      size: buffer.length
    }
  };
}

function normalizeIp(value) {
  let ip = rawText(value, 80);
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (ip === "::1") ip = "127.0.0.1";
  return ip;
}

function blockIdForIp(ip) {
  return crypto.createHash("sha256").update("blocked-ip:" + normalizeIp(ip)).digest("hex").slice(0, 18);
}

function clientIp(req, raw) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const realIp = String(req.headers["x-real-ip"] || "").trim();
  return normalizeIp(forwarded || realIp || raw.remoteAddress || "");
}

function numberInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function parseDurationText(value) {
  const parts = String(value || "").trim().split(":").map(function (part) {
    return Number(part);
  });
  if (!parts.length || parts.length > 3 || parts.some(function (part) { return !Number.isFinite(part); })) return 0;
  return parts.reduce(function (total, part) {
    return total * 60 + part;
  }, 0);
}

function formatDurationSeconds(value) {
  const total = Math.floor(Number(value) || 0);
  if (!total) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours) return hours + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  return minutes + ":" + String(seconds).padStart(2, "0");
}

function openSqlitePersistence() {
  if (sqliteDb) return sqliteDb;
  if (rawEnv("DISABLE_SQLITE", "") === "1") return null;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const sqlite = require("node:sqlite");
    sqliteDb = new sqlite.DatabaseSync(DB_FILE);
    sqliteDb.exec("CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at REAL NOT NULL)");
    persistenceBackend = { type: "sqlite", label: "SQLite", file: DB_FILE };
    return sqliteDb;
  } catch (error) {
    sqliteDb = null;
    persistenceBackend = { type: "json", label: "JSON", file: DATA_FILE, warning: rawText(error && error.message, 160) };
    return null;
  }
}

async function openPostgresPersistence() {
  const connectionString = rawEnv("DATABASE_URL", "");
  if (!connectionString) return null;
  if (postgresPool) return postgresPool;

  const { Pool } = require("pg");
  postgresPool = new Pool({
    connectionString: connectionString,
    max: 2,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: true
  });
  postgresPool.on("error", function (error) {
    persistenceBackend.warning = rawText(error && error.message, 160);
    console.warn("Blad polaczenia PostgreSQL:", error.message);
  });
  await postgresPool.query(
    "CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
  );
  persistenceBackend = { type: "postgres", label: "PostgreSQL", file: "" };
  return postgresPool;
}

function parsePersistedJson(text) {
  return JSON.parse(String(text || "{}").replace(/^\uFEFF/, "")) || {};
}

function readPersistedJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return parsePersistedJson(fs.readFileSync(filePath, "utf8"));
}

function loadPersistedRooms() {
  const db = openSqlitePersistence();
  if (db) {
    try {
      const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get("rooms");
      if (row && row.value) return parsePersistedJson(row.value);
    } catch (error) {
      console.warn("Nie udalo sie wczytac SQLite:", error.message);
    }
  }

  const candidates = [DATA_FILE, DATA_BACKUP_FILE];
  if (path.resolve(SEED_DATA_FILE) !== path.resolve(DATA_FILE)) candidates.push(SEED_DATA_FILE);
  for (const filePath of candidates) {
    try {
      const loaded = readPersistedJsonFile(filePath);
      if (!loaded) continue;
      if (db) {
        try {
          db.prepare("INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
            .run("rooms", JSON.stringify(loaded), now());
        } catch (error) {
          console.warn("Nie udalo sie przeniesc JSON do SQLite:", error.message);
        }
      }
      return loaded;
    } catch (error) {
      console.warn("Nie udalo sie wczytac zapisanych openingow z " + filePath + ":", error.message);
    }
  }
  return {};
}

async function initializePersistence() {
  let loaded = null;
  try {
    const pool = await openPostgresPersistence();
    if (pool) {
      const result = await pool.query("SELECT value FROM app_state WHERE key = $1", ["rooms"]);
      if (result.rows[0] && result.rows[0].value) {
        loaded = typeof result.rows[0].value === "string"
          ? parsePersistedJson(result.rows[0].value)
          : result.rows[0].value;
      }
    }
  } catch (error) {
    console.warn("Nie udalo sie uruchomic PostgreSQL:", error.message);
    if (postgresPool) {
      try { await postgresPool.end(); } catch (closeError) {}
    }
    postgresPool = null;
    persistenceBackend = {
      type: "json",
      label: "JSON (tryb awaryjny)",
      file: DATA_FILE,
      warning: rawText(error && error.message, 160)
    };
    if (rawEnv("DATABASE_URL", "")) throw error;
  }

  if (!loaded) {
    loaded = loadPersistedRooms();
    if (postgresPool) persistenceBackend = { type: "postgres", label: "PostgreSQL", file: "" };
  }
  Object.keys(loaded || {}).forEach(function (key) {
    persistedRoomConfigs[key] = loaded[key];
  });

  if (postgresPool && !(await postgresPool.query("SELECT 1 FROM app_state WHERE key = $1", ["rooms"])).rowCount) {
    await postgresPool.query(
      "INSERT INTO app_state (key, value, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
      ["rooms", JSON.stringify(persistedRoomConfigs)]
    );
  }

  globalCatalogRoom = null;
  saveGlobalCatalog(getGlobalCatalogRoom());
}

function queuePostgresSave(jsonText) {
  if (!postgresPool) return;
  postgresPendingState = jsonText;
  if (postgresSavePromise) return;

  let failedState = "";
  postgresSavePromise = (async function () {
    while (postgresPendingState) {
      const nextState = postgresPendingState;
      failedState = nextState;
      postgresPendingState = "";
      await postgresPool.query(
        "INSERT INTO app_state (key, value, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
        ["rooms", nextState]
      );
    }
    persistenceBackend.warning = "";
  })().catch(function (error) {
    if (!postgresPendingState) postgresPendingState = failedState || jsonText;
    persistenceBackend.warning = rawText(error && error.message, 160);
    console.warn("Nie udalo sie zapisac PostgreSQL:", error.message);
    setTimeout(function () {
      if (postgresPendingState && !postgresSavePromise) queuePostgresSave(postgresPendingState);
    }, 2000);
  }).finally(function () {
    postgresSavePromise = null;
  });
}

function writeAutoBackup(jsonText) {
  const current = now();
  if (current - lastAutoBackupAt < 600) return;
  lastAutoBackupAt = current;
  try {
    fs.mkdirSync(AUTO_BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.writeFileSync(path.join(AUTO_BACKUP_DIR, "backup-" + stamp + ".json"), jsonText, "utf8");
    const backups = fs.readdirSync(AUTO_BACKUP_DIR)
      .filter((name) => /^backup-.*\.json$/.test(name))
      .sort();
    while (backups.length > 20) {
      fs.unlinkSync(path.join(AUTO_BACKUP_DIR, backups.shift()));
    }
  } catch (error) {
    console.warn("Nie udalo sie zapisac automatycznego backupu:", error.message);
  }
}

function savePersistedRooms() {
  try {
    const jsonText = JSON.stringify(persistedRoomConfigs, null, 2);
    if (postgresPool) {
      queuePostgresSave(jsonText);
      if (rawEnv("WRITE_LOCAL_BACKUP", "") !== "1") return "";
    }

    fs.mkdirSync(DATA_DIR, { recursive: true });
    const db = openSqlitePersistence();
    if (db) {
      db.prepare("INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
        .run("rooms", JSON.stringify(persistedRoomConfigs), now());
    }
    const tempFile = DATA_FILE + ".tmp";
    fs.writeFileSync(tempFile, jsonText, "utf8");
    if (fs.existsSync(DATA_FILE)) fs.copyFileSync(DATA_FILE, DATA_BACKUP_FILE);
    fs.renameSync(tempFile, DATA_FILE);
    writeAutoBackup(jsonText);
    return "";
  } catch (error) {
    console.warn("Nie udalo sie zapisac openingow:", error.message);
    return error.message || "Nie udalo sie trwale zapisac danych.";
  }
}

function publicPersistenceInfo() {
  return {
    type: persistenceBackend.type,
    label: persistenceBackend.label,
    file: persistenceBackend.file,
    warning: persistenceBackend.warning || "",
    autoBackups: !postgresPool || rawEnv("WRITE_LOCAL_BACKUP", "") === "1"
  };
}

function restoreTracks(tracks) {
  if (!Array.isArray(tracks)) return [];
  return tracks
    .filter(function (track) {
      return track && track.audioUrl;
    })
    .map(function (track) {
      const startAtFirst = numberInRange(track.startAtFirst, numberInRange(track.startAt, 0, 0, 36000), 0, 36000);
      const startAtSecond = numberInRange(track.startAtSecond, startAtFirst + 5, 0, 36000);
      const titleParts = splitCombinedAnimeTitle(track.anime || track.title);
      const englishTitle = cleanAnimeTitlePart(track.englishTitle || track.animeEnglish || track.titleEnglish || titleParts.englishTitle);
      const romajiTitle = cleanAnimeTitlePart(track.romajiTitle || track.animeRomaji || track.titleRomaji || titleParts.romajiTitle);
      const sourceTitle = rawText(track.sourceTitle || track.rawTitle, 180);
      const anime = combinedAnimeTitle(englishTitle, romajiTitle, track.anime || track.title);
      const opening = rawText(track.opening || track.artist, 120);
      const videoId = detectYouTubeVideoId(track.audioUrl);
      const source = videoId ? "youtube" : "audio";
      const difficulty = difficultyExists(track.difficulty) ? track.difficulty : "medium";
      const result = normalizeTrackResult(track.result);
      const durationSeconds = numberInRange(track.durationSeconds, parseDurationText(track.durationText), 0, 86400);
      const durationText = rawText(track.durationText, 20) || formatDurationSeconds(durationSeconds);
      const coverUrl = cleanImageUrl(track.coverUrl || track.cover || track.thumbnailUrl || track.imageUrl, youtubeThumbnailUrl(videoId));
      const descript…34232 tokens truncated…wardPlayer(room, payload.playerId, groupName, points);
  }

  if (action === "setScore") {
    const groupName = cleanText(payload.team, "", 32);
    const value = numberInRange(payload.value, 0, -999, 999);
    if (groupName) {
      if (!room.groups[groupName]) room.groups[groupName] = { score: 0, password: "" };
      room.groups[groupName].score = value;
    }
  }

  if (action === "resetScores") {
    Object.keys(room.groups).forEach(function (groupName) {
      room.groups[groupName].score = 0;
    });
    roomClients(room).forEach(function (client) {
      client.personalScore = 0;
    });
    room.playerScores = {};
  }

  if (action === "updateSettings") {
    const settings = payload.settings || {};
    room.settings = {
      clipDuration: DEFAULT_CLIP_DURATION,
      segmentSplit: 5,
      difficultyScores: normalizeDifficultySettings(settings.difficultyScores || room.settings.difficultyScores)
    };
    room.offset = numberInRange(room.offset, 0, 0, room.settings.clipDuration);
  }

  if (action === "resetRoom") {
    room.tracks = [];
    room.libraryTracks = [];
    room.currentTrackId = null;
    room.currentBuzzer = null;
    room.phase = "idle";
    room.offset = 0;
    room.startedAt = 0;
    room.revealed = false;
    room.lockedGroups = {};
    room.groups = {};
    room.playerScores = {};
    room.blockedIps = {};
    roomClients(room).forEach(function (client) {
      client.personalScore = 0;
    });
  }

  let persistenceError = "";
  if (action === "resetRoom") {
    persistenceError = clearRoomConfig(room) || "";
  } else if (globalCatalogAction) {
    persistenceError = saveGlobalCatalog(room) || "";
  } else if (["addTrack", "addLibraryTrack", "addLibraryToMain", "removeLibraryTrack", "updateLibraryTrack", "updateLibraryDifficulty", "importPlaylist", "updateTrack", "removeTrack", "selectTrack", "clearTrackResult", "updateSettings", "play", "guessed", "awardBuzz", "revealTitle", "blockIp", "unblockIp"].includes(action)) {
    persistenceError = saveRoomConfig(room) || "";
  }

  touch(room);
  if (globalCatalogAction) {
    broadcastModeratorStats();
  } else {
    broadcast(room);
  }
  if (persistenceError && auditedEdit) {
    recordAdminEdit(socket, room, action, "failed", persistenceError, editBefore, findTrackForAdminEdit(room, action, payload || {}), payload || {});
  }
  if (persistenceError && payload.requestId) return sendError(socket, persistenceError, payload.requestId);
  if (auditedEdit) {
    const successMessage = action === "updateLibraryTrack" ? "Zapisano opening w bibliotece." : "Zapisano opening.";
    const auditResult = recordAdminEdit(socket, room, action, "success", successMessage, editBefore, findTrackForAdminEdit(room, action, payload || {}), payload || {});
    if (auditResult.persistenceError && payload.requestId) return sendError(socket, auditResult.persistenceError, payload.requestId);
  }
  if (action === "updateLibraryTrack") {
    sendModeratorActionResult(socket, payload, "Zapisano opening w bibliotece i historie zmian.");
  }
  if (action === "updateTrack") {
    sendModeratorActionResult(socket, payload, "Zapisano opening i historie zmian.");
  }
}

function updateProfile(socket, payload) {
  if (!socket.roomCode) return;
  const room = getRoom(socket.roomCode);
  socket.nickname = cleanText(payload.nickname, socket.nickname || "Gracz");
  touch(room);
  broadcast(room);
}

function handleMessage(socket, text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    return sendError(socket, "Niepoprawna wiadomoĹ›Ä‡.");
  }

  if (payload.type === "join") return joinRoom(socket, payload);
  if (payload.type === "soloJoin") return handleSoloJoin(socket, payload);
  if (payload.type === "buzz") return handleBuzz(socket);
  if (payload.type === "soloAction") return handleSoloAction(socket, payload);
  if (payload.type === "profile") return updateProfile(socket, payload);
  if (payload.type === "moderator") {
    Promise.resolve(handleModerator(socket, payload)).catch(function () {
      sendError(socket, "Nie udalo sie wykonac akcji administratora.", payload.requestId);
    });
  }
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4"
  }[extension] || "application/octet-stream";
}

function cacheControl(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".html" || path.basename(filePath).toLowerCase() === "sw.js") {
    return "no-store";
  }
  if ([".css", ".js", ".webmanifest"].includes(extension)) {
    return "public, max-age=3600, stale-while-revalidate=86400";
  }
  if ([".png", ".jpg", ".jpeg", ".webp", ".svg", ".mp3", ".wav", ".ogg", ".m4a"].includes(extension)) {
    return "public, max-age=604800, stale-while-revalidate=86400";
  }
  return "public, max-age=3600, stale-while-revalidate=86400";
}

function isAudioFile(filePath) {
  return [".mp3", ".wav", ".ogg", ".m4a"].includes(path.extname(filePath).toLowerCase());
}

function parseByteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(value || "").trim());
  if (!match) return null;

  let start = match[1] ? Number(match[1]) : null;
  let end = match[2] ? Number(match[2]) : null;
  if (start === null && end === null) return null;

  if (start === null) {
    const suffixLength = Math.min(size, end);
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    end = end === null ? size - 1 : Math.min(end, size - 1);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= size) return null;
  return { start: Math.floor(start), end: Math.floor(end) };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req, res, maxBytes, callback) {
  let size = 0;
  const chunks = [];
  req.on("data", function (chunk) {
    size += chunk.length;
    if (size > maxBytes) {
      res.writeHead(413, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Plik jest za duzy." }));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", function () {
    try {
      callback(JSON.parse((Buffer.concat(chunks).toString("utf8") || "{}").replace(/^\uFEFF/, "")));
    } catch (error) {
      sendJson(res, 400, { error: "Niepoprawny JSON." });
    }
  });
}

function dataBackupPayload() {
  return {
    app: "anime-opening-quiz",
    version: 3,
    exportedAt: now(),
    persistence: publicPersistenceInfo(),
    rooms: persistedRoomConfigs
  };
}

function handleDataExportRequest(req, res, requestUrl) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Niepoprawna metoda." });
  if (rawText(requestUrl.searchParams.get("moderatorPassword"), 120) !== MODERATOR_PASSWORD) {
    return sendJson(res, 403, { error: "Nieprawidlowe haslo moderatora." });
  }

  const body = JSON.stringify(dataBackupPayload(), null, 2);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Disposition": "attachment; filename=\"anime-opening-quiz-backup-" + stamp + ".json\""
  });
  res.end(body);
}

function importPersistedRooms(imported) {
  const source = imported && imported.rooms && typeof imported.rooms === "object" && !Array.isArray(imported.rooms)
    ? imported.rooms
    : imported;
  if (!source || typeof source !== "object" || Array.isArray(source)) return "Niepoprawny plik backupu.";

  Object.keys(persistedRoomConfigs).forEach(function (key) {
    delete persistedRoomConfigs[key];
  });

  Object.keys(source).forEach(function (key) {
    const code = isMetaConfigKey(key) ? key : roomCode(key);
    if (code === "__soloStats") {
      persistedRoomConfigs[code] = source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) ? source[key] : {};
    } else if (code === "__soloReports") {
      persistedRoomConfigs[code] = Array.isArray(source[key]) ? source[key] : [];
    } else if (code === "__soloPlayers") {
      persistedRoomConfigs[code] = source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) ? source[key] : {};
    } else if (code === "__dailySolo") {
      persistedRoomConfigs[code] = source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) ? source[key] : { days: {} };
    } else if (source[key] && typeof source[key] === "object") {
      persistedRoomConfigs[code] = source[key];
    }
  });

  rooms.clear();
  globalCatalogRoom = null;
  saveGlobalCatalog(getGlobalCatalogRoom());
  savePersistedRooms();
  return "";
}

function handleDataImportRequest(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Niepoprawna metoda." });
  parseJsonBody(req, res, 12 * 1024 * 1024, function (payload) {
    if (rawText(payload.moderatorPassword, 120) !== MODERATOR_PASSWORD) {
      return sendJson(res, 403, { error: "Nieprawidlowe haslo moderatora." });
    }
    const error = importPersistedRooms(payload.data || payload.backup || payload.rooms || payload);
    if (error) return sendJson(res, 400, { error: error });
    sockets.forEach(function (socket) {
      if (socket.role === "moderator" && socket.joined) {
        socket.adminRoomCode = roomCode(socket.adminRoomCode || "LOBBY");
        socket.stateFieldSignatures = Object.create(null);
        send(socket, publicRoom(getRoom(socket.adminRoomCode), socket));
      } else if (socket.roomCode) {
        send(socket, publicRoom(getRoom(socket.roomCode), socket));
      }
    });
    return sendJson(res, 200, { message: "Backup wczytany.", rooms: Object.keys(persistedRoomConfigs).length });
  });
}

function handleAudioUploadRequest(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Niepoprawna metoda." });

  let size = 0;
  const chunks = [];
  req.on("data", function (chunk) {
    size += chunk.length;
    if (size > MAX_AUDIO_UPLOAD_BODY_BYTES) {
      res.writeHead(413, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Plik audio jest za duzy. Limit to 25 MB." }));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on("end", function () {
    let payload;
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString("utf8").replace(/^\uFEFF/, ""));
    } catch (error) {
      return sendJson(res, 400, { error: "Niepoprawny upload audio." });
    }

    if (rawText(payload.moderatorPassword, 120) !== MODERATOR_PASSWORD) {
      return sendJson(res, 403, { error: "Nieprawidlowe haslo moderatora." });
    }

    const result = saveUploadedAudio(payload || {});
    if (result.error) return sendJson(res, 400, { error: result.error });
    return sendJson(res, 200, {
      file: result.file,
      localAudioFiles: listLocalAudioFiles(),
      message: "Wgrano audio: " + result.file.name
    });
  });
}

function serve(req, res) {
  const requestUrl = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  if (requestUrl.pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      persistence: persistenceBackend.type,
      uptime: Math.floor(process.uptime())
    });
  }
  if (requestUrl.pathname === "/api/upload-audio") return handleAudioUploadRequest(req, res);
  if (requestUrl.pathname === "/api/export-data") return handleDataExportRequest(req, res, requestUrl);
  if (requestUrl.pathname === "/api/import-data") return handleDataImportRequest(req, res);

  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  const relative = path.relative(PUBLIC_DIR, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, function (error, stat) {
    if (error || !stat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const etag = 'W/"' + stat.size + "-" + Math.floor(stat.mtimeMs) + '"';
    const headers = {
      "Content-Type": contentType(filePath),
      "Cache-Control": cacheControl(filePath),
      "ETag": etag,
      "Last-Modified": stat.mtime.toUTCString()
    };

    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, headers);
      res.end();
      return;
    }

    const requestedRange = isAudioFile(filePath) ? parseByteRange(req.headers.range, stat.size) : null;
    if (req.headers.range && isAudioFile(filePath) && !requestedRange) {
      res.writeHead(416, Object.assign(headers, { "Content-Range": "bytes */" + stat.size }));
      res.end();
      return;
    }

    if (isAudioFile(filePath)) headers["Accept-Ranges"] = "bytes";
    if (requestedRange) {
      headers["Content-Range"] = "bytes " + requestedRange.start + "-" + requestedRange.end + "/" + stat.size;
      headers["Content-Length"] = requestedRange.end - requestedRange.start + 1;
      res.writeHead(206, headers);
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(filePath, requestedRange).pipe(res);
      return;
    }

    headers["Content-Length"] = stat.size;
    res.writeHead(200, headers);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}

function encodeFrame(payload) {
  const length = payload.length;
  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  header[0] = 0x81;
  return Buffer.concat([header, payload]);
}

function encodePong(payload) {
  return Buffer.concat([Buffer.from([0x8a, payload.length]), payload]);
}

function parseFrames(socket, chunk) {
  socket.buffer = Buffer.concat([socket.buffer, chunk]);

  while (socket.buffer.length >= 2) {
    const first = socket.buffer[0];
    const second = socket.buffer[1];
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let length = second & 0x7f;
    let offset = 2;

    if (length === 126) {
      if (socket.buffer.length < offset + 2) return;
      length = socket.buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      if (socket.buffer.length < offset + 8) return;
      length = Number(socket.buffer.readBigUInt64BE(offset));
      offset += 8;
    }

    const maskOffset = masked ? 4 : 0;
    if (socket.buffer.length < offset + maskOffset + length) return;

    const mask = masked ? socket.buffer.subarray(offset, offset + 4) : null;
    offset += maskOffset;
    const payload = Buffer.from(socket.buffer.subarray(offset, offset + length));
    socket.buffer = socket.buffer.subarray(offset + length);

    if (masked) {
      for (let index = 0; index < payload.length; index += 1) {
        payload[index] ^= mask[index % 4];
      }
    }

    if (opcode === 0x8) {
      socket.raw.end();
      return;
    }
    if (opcode === 0x9) {
      socket.raw.write(encodePong(payload));
      continue;
    }
    if (opcode === 0x1) handleMessage(socket, payload.toString("utf8"));
  }
}

const server = http.createServer(serve);

server.on("upgrade", function (req, raw) {
  if (!req.headers.upgrade || req.headers.upgrade.toLowerCase() !== "websocket") {
    raw.destroy();
    return;
  }

  const key = req.headers["sec-websocket-key"];
  if (!key) {
    raw.destroy();
    return;
  }

  const accept = crypto
    .createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");

  raw.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    "Sec-WebSocket-Accept: " + accept,
    "",
    ""
  ].join("\r\n"));

  const socket = {
    id: id("user_"),
    raw: raw,
    buffer: Buffer.alloc(0),
    closed: false,
    joined: false,
    roomCode: null,
    clientId: "",
    nickname: "Gracz",
    team: "",
    role: "player",
    avatar: "",
    ip: clientIp(req, raw),
    personalScore: 0
  };

  sockets.set(socket.id, socket);
  send(socket, { type: "hello", id: socket.id, serverNow: now() });

  raw.on("data", function (chunk) {
    parseFrames(socket, chunk);
  });
  raw.on("close", function () {
    socket.closed = true;
    sockets.delete(socket.id);
    if (socket.roomCode) broadcast(getRoom(socket.roomCode));
  });
  raw.on("error", function () {
    socket.closed = true;
    sockets.delete(socket.id);
  });
});

setInterval(function () {
  rooms.forEach(function (room) {
    if (room.phase === "playing" && elapsed(room) >= room.settings.clipDuration) {
      room.offset = room.settings.clipDuration;
      room.phase = "ended";
      room.revealed = true;
      room.currentBuzzer = null;
      const resultChanged = markCurrentTrackMissed(room);
      if (resultChanged) saveRoomConfig(room);
      touch(room);
      broadcast(room);
    }
  });

  sockets.forEach(function (socket) {
    const session = socket.soloSession;
    if (socket.role === "solo" && session && (session.phase === "loading" || session.phase === "countdown") && !session.answered) {
      if (session.phase === "countdown" && session.mediaReady && now() >= Number(session.countdownEndsAt || 0)) {
        startSoloPlayback(socket);
        return;
      }
      const loadingStartedAt = Number(session.loadingStartedAt || 0);
      if (!session.mediaReady && loadingStartedAt > 0 && now() - loadingStartedAt >= SOLO_MEDIA_LOAD_TIMEOUT) {
        const failed = failSoloMedia(socket, "Opening nie zaladowal sie w 5 sekund.");
        if (failed === "fallback") return;
        startSoloRound(socket, true);
        return;
      }
    }
    if (socket.role === "solo" && session && session.phase === "playing" && !session.answered && soloElapsed(socket) >= SOLO_CLIP_DURATION) {
      session.offset = SOLO_CLIP_DURATION;
      session.phase = "ended";
      sendSoloState(socket);
    }
  });
}, 250);

setInterval(function () {
  const currentDayKey = dayKey(now());
  if (currentDayKey !== lastSoloDayKey) {
    lastSoloDayKey = currentDayKey;
    broadcastSoloStates();
  }
  rooms.forEach(function (room) {
    if (hasJoinedClients(room)) broadcast(room);
  });
}, 1000);

const serverReady = initializePersistence().then(function () {
  return new Promise(function (resolve, reject) {
    server.once("error", reject);
    server.listen(PORT, function () {
  console.log("Anime Opening Quiz dziaĹ‚a na http://localhost:" + PORT);
      resolve(server);
    });
  });
}).catch(function (error) {
  console.error("Nie udalo sie uruchomic serwera:", error);
  process.exitCode = 1;
  throw error;
});

async function closeServer() {
  await new Promise(function (resolve) {
    if (!server.listening) return resolve();
    server.close(resolve);
  });
  if (postgresSavePromise) {
    try { await postgresSavePromise; } catch (error) {}
  }
  if (postgresPool) {
    try { await postgresPool.end(); } catch (error) {}
  }
}

process.once("SIGTERM", function () {
  closeServer().finally(function () { process.exit(0); });
});
process.once("SIGINT", function () {
  closeServer().finally(function () { process.exit(0); });
});

module.exports = server;
module.exports.ready = serverReady;

