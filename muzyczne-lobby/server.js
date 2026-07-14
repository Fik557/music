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
    .replace(/[「」『』【】]/g, "")
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
      if (rawEnv("WRITE_LOCAL_BACKUP", "") !== "1") return;
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
  } catch (error) {
    console.warn("Nie udalo sie zapisac openingow:", error.message);
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
      const description = rawText(track.description || track.animeDescription || track.summary, 420);
      const fallbackAudioUrl = cleanAudioUrl(track.fallbackAudioUrl || track.localAudioUrl || track.backupAudioUrl, "");
      const qualityStatus = normalizeQualityStatus(track.qualityStatus, "ok");
      const aliases = cleanAliases(track.aliases || track.answerAliases || track.altTitles);
      return {
        id: rawText(track.id, 80) || id("track_"),
        anime: anime,
        opening: opening,
        coverUrl: coverUrl,
        description: description,
        aliases: aliases,
        fallbackAudioUrl: fallbackAudioUrl,
        qualityStatus: qualityStatus,
        englishTitle: englishTitle,
        romajiTitle: romajiTitle,
        title: anime,
        artist: opening,
        difficulty: difficulty,
        audioUrl: cleanText(track.audioUrl, "", 700),
        source: source,
        videoId: videoId,
        sourceTitle: sourceTitle,
        durationText: durationText,
        durationSeconds: durationSeconds,
        startAtFirst: startAtFirst,
        startAtSecond: startAtSecond,
        startAt: startAtFirst,
        result: result
      };
    });
}

function cloneTrackForMain(track) {
  const normalized = normalizeTrack(track || {}, null);
  if (normalized.error) return null;
  normalized.track.id = id("track_");
  normalized.track.result = null;
  return normalized.track;
}

function normalizeBlockedIps(blockedIps) {
  const result = {};

  function add(entry, fallbackIp) {
    const source = entry && typeof entry === "object" ? entry : {};
    const ip = normalizeIp(source.ip || fallbackIp || entry);
    if (!ip) return;
    result[ip] = {
      ip: ip,
      nickname: cleanText(source.nickname, "Gracz", 60),
      team: cleanText(source.team, "Druzyna", 32),
      by: cleanText(source.by, "Administrator", 60),
      at: numberInRange(source.at, now(), 0, 9999999999)
    };
  }

  if (Array.isArray(blockedIps)) {
    blockedIps.forEach(function (entry) {
      add(entry);
    });
  } else if (blockedIps && typeof blockedIps === "object") {
    Object.keys(blockedIps).forEach(function (ip) {
      add(blockedIps[ip], ip);
    });
  }

  return result;
}

function saveRoomConfig(room) {
  persistedRoomConfigs[room.code] = {
    tracks: room.tracks,
    libraryTracks: room.libraryTracks,
    currentTrackId: room.currentTrackId,
    blockedIps: room.blockedIps,
    updatedAt: room.updatedAt,
    settings: {
      difficultyScores: cloneScores(room.settings.difficultyScores)
    }
  };
  savePersistedRooms();
}

function clearRoomConfig(room) {
  delete persistedRoomConfigs[room.code];
  savePersistedRooms();
}

function createRoom(code) {
  const saved = persistedRoomConfigs[code] || {};
  const base = code !== "LOBBY" ? (persistedRoomConfigs.LOBBY || {}) : {};
  const savedHasTracks = Array.isArray(saved.tracks) && saved.tracks.length;
  const baseHasTracks = Array.isArray(base.tracks) && base.tracks.length;
  const sourceTracks = savedHasTracks ? saved.tracks : (baseHasTracks ? base.tracks : []);
  const sourceLibraryTracks = Array.isArray(saved.libraryTracks) && saved.libraryTracks.length
    ? saved.libraryTracks
    : (savedHasTracks ? saved.tracks : (Array.isArray(base.libraryTracks) && base.libraryTracks.length ? base.libraryTracks : sourceTracks));
  const sourceSettings = saved.settings || base.settings || {};
  const sourceCurrentTrackId = saved.currentTrackId || (!savedHasTracks ? base.currentTrackId : "");
  const tracks = restoreTracks(sourceTracks);
  const libraryTracks = restoreTracks(sourceLibraryTracks);
  const selectedTrackId = tracks.some(function (track) {
    return track.id === sourceCurrentTrackId;
  }) ? sourceCurrentTrackId : (tracks[0] ? tracks[0].id : null);

  return {
    code: code,
    phase: "idle",
    startedAt: 0,
    offset: 0,
    revealed: false,
    lockedGroups: {},
    tracks: tracks,
    libraryTracks: libraryTracks,
    currentTrackId: selectedTrackId,
    currentBuzzer: null,
    groups: {},
    playerScores: {},
    blockedIps: normalizeBlockedIps(saved.blockedIps),
    settings: {
      clipDuration: DEFAULT_CLIP_DURATION,
      segmentSplit: 5,
      difficultyScores: cloneScores(sourceSettings && sourceSettings.difficultyScores)
    },
    updatedAt: now()
  };
}

function getRoom(code) {
  const normalized = roomCode(code);
  if (!rooms.has(normalized)) rooms.set(normalized, createRoom(normalized));
  return rooms.get(normalized);
}

function roomClients(room) {
  return Array.from(sockets.values()).filter(function (socket) {
    return socket.roomCode === room.code;
  });
}

function isMetaConfigKey(code) {
  return code === "__soloStats" || code === "__soloReports" || code === "__soloPlayers" || code === "__dailySolo";
}

function soloStatsStore() {
  if (!persistedRoomConfigs.__soloStats || typeof persistedRoomConfigs.__soloStats !== "object" || Array.isArray(persistedRoomConfigs.__soloStats)) {
    persistedRoomConfigs.__soloStats = {};
  }
  return persistedRoomConfigs.__soloStats;
}

function soloReportsStore() {
  if (!Array.isArray(persistedRoomConfigs.__soloReports)) {
    persistedRoomConfigs.__soloReports = [];
  }
  return persistedRoomConfigs.__soloReports;
}

function soloPlayersStore() {
  if (!persistedRoomConfigs.__soloPlayers || typeof persistedRoomConfigs.__soloPlayers !== "object" || Array.isArray(persistedRoomConfigs.__soloPlayers)) {
    persistedRoomConfigs.__soloPlayers = {};
  }
  return persistedRoomConfigs.__soloPlayers;
}

function dailySoloStore() {
  if (!persistedRoomConfigs.__dailySolo || typeof persistedRoomConfigs.__dailySolo !== "object" || Array.isArray(persistedRoomConfigs.__dailySolo)) {
    persistedRoomConfigs.__dailySolo = { days: {} };
  }
  if (!persistedRoomConfigs.__dailySolo.days || typeof persistedRoomConfigs.__dailySolo.days !== "object" || Array.isArray(persistedRoomConfigs.__dailySolo.days)) {
    persistedRoomConfigs.__dailySolo.days = {};
  }
  return persistedRoomConfigs.__dailySolo;
}

function dayKey(timestamp) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Warsaw",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date((timestamp || now()) * 1000));
  } catch (error) {
    return new Date((timestamp || now()) * 1000).toISOString().slice(0, 10);
  }
}

function soloPlayerEntry(socket) {
  const clientId = rawText(socket && socket.clientId, 80) || (socket && socket.id) || "solo";
  const store = soloPlayersStore();
  if (!store[clientId]) {
    store[clientId] = {
      clientId: clientId,
      nickname: cleanText(socket && socket.nickname, "Solo", 60),
      avatar: cleanAvatar(socket && socket.avatar),
      streak: 0,
      bestStreak: 0,
      attempts: 0,
      guessed: 0,
      todayAttempts: 0,
      todayGuessed: 0,
      todayStreak: 0,
      todayBestStreak: 0,
      todayKey: dayKey(now()),
      randomSeenKeys: [],
      history: []
    };
  }
  const entry = store[clientId];
  entry.clientId = clientId;
  entry.nickname = cleanText((socket && socket.nickname) || entry.nickname, "Solo", 60);
  entry.avatar = cleanAvatar((socket && socket.avatar) || entry.avatar);
  if (entry.todayKey !== dayKey(now())) {
    entry.todayKey = dayKey(now());
    entry.todayAttempts = 0;
    entry.todayGuessed = 0;
    entry.todayStreak = 0;
    entry.todayBestStreak = 0;
  }
  if (!Array.isArray(entry.history)) entry.history = [];
  const missingTodayStreak = !Number.isFinite(Number(entry.todayStreak));
  const missingTodayBest = !Number.isFinite(Number(entry.todayBestStreak));
  if (missingTodayStreak || missingTodayBest) {
    let running = 0;
    let best = 0;
    entry.history.forEach(function (item) {
      if (!item || dayKey(item.at) !== entry.todayKey) return;
      running = item.guessed ? running + 1 : 0;
      best = Math.max(best, running);
    });
    if (missingTodayStreak) entry.todayStreak = running;
    if (missingTodayBest) entry.todayBestStreak = best;
  }
  entry.streak = Math.max(0, Number(entry.streak || 0));
  entry.bestStreak = Math.max(0, Number(entry.bestStreak || 0));
  entry.attempts = Math.max(0, Number(entry.attempts || 0));
  entry.guessed = Math.max(0, Number(entry.guessed || 0));
  entry.todayAttempts = Math.max(0, Number(entry.todayAttempts || 0));
  entry.todayGuessed = Math.max(0, Number(entry.todayGuessed || 0));
  entry.todayStreak = Math.max(0, Number(entry.todayStreak || 0));
  entry.todayBestStreak = Math.max(0, Number(entry.todayBestStreak || 0));
  if (!Array.isArray(entry.randomSeenKeys)) entry.randomSeenKeys = [];
  entry.randomSeenKeys = Array.from(new Set(entry.randomSeenKeys.map(function (key) {
    return rawText(key, 120);
  }).filter(Boolean))).slice(-1000);
  return entry;
}

function publicSoloProfile(socket) {
  if (!socket || socket.role !== "solo") return null;
  const entry = soloPlayerEntry(socket);
  return {
    nickname: cleanText(entry.nickname, "Solo", 60),
    avatar: cleanAvatar(entry.avatar),
    streak: Math.max(0, Number(entry.streak || 0)),
    bestStreak: Math.max(0, Number(entry.bestStreak || 0)),
    attempts: Math.max(0, Number(entry.attempts || 0)),
    guessed: Math.max(0, Number(entry.guessed || 0)),
    percent: entry.attempts ? Math.round((entry.guessed / entry.attempts) * 100) : 0,
    todayAttempts: Math.max(0, Number(entry.todayAttempts || 0)),
    todayGuessed: Math.max(0, Number(entry.todayGuessed || 0)),
    todayStreak: Math.max(0, Number(entry.todayStreak || 0)),
    todayBestStreak: Math.max(0, Number(entry.todayBestStreak || 0)),
    history: entry.history.slice(-12).reverse().map(function (item) {
      return {
        at: numberInRange(item.at, 0, 0, 9999999999),
        anime: rawText(item.anime, 180),
        opening: rawText(item.opening, 120),
        answerText: rawText(item.answerText, 180),
        guessed: Boolean(item.guessed),
        streakAfter: Math.max(0, Number(item.streakAfter || 0))
      };
    })
  };
}

function publicSoloLeaderboard() {
  return Object.keys(soloPlayersStore()).map(function (clientId) {
    const entry = soloPlayersStore()[clientId] || {};
    const attempts = Math.max(0, Number(entry.attempts || 0));
    const guessed = Math.max(0, Number(entry.guessed || 0));
    return {
      nickname: cleanText(entry.nickname, "Solo", 60),
      avatar: cleanAvatar(entry.avatar),
      streak: Math.max(0, Number(entry.streak || 0)),
      bestStreak: Math.max(0, Number(entry.bestStreak || 0)),
      attempts: attempts,
      guessed: guessed,
      percent: attempts ? Math.round((guessed / attempts) * 100) : 0,
      todayAttempts: Math.max(0, Number(entry.todayAttempts || 0)),
      todayGuessed: Math.max(0, Number(entry.todayGuessed || 0))
    };
  }).sort(function (a, b) {
    if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
    if (b.streak !== a.streak) return b.streak - a.streak;
    if (b.guessed !== a.guessed) return b.guessed - a.guessed;
    return a.nickname.localeCompare(b.nickname);
  }).slice(0, 30);
}

function soloTrackKey(track) {
  const videoId = rawText((track && track.videoId) || detectYouTubeVideoId(track && track.audioUrl), 40);
  if (videoId) return "yt:" + videoId;
  return "track:" + crypto
    .createHash("sha1")
    .update([track && track.audioUrl, track && track.anime, track && track.opening].join("|"))
    .digest("hex");
}

function addSoloTrack(pool, seen, track) {
  const normalized = normalizeTrack(track || {}, null);
  if (normalized.error) return;
  const result = normalized.track;
  result.id = rawText(track.id, 80) || result.id;
  const key = soloTrackKey(result);
  if (seen[key]) return;
  seen[key] = true;
  result.soloKey = key;
  pool.push(result);
}

function allSoloTracks() {
  const pool = [];
  const seen = {};

  Object.keys(persistedRoomConfigs).forEach(function (code) {
    const config = persistedRoomConfigs[code];
    if (!config || typeof config !== "object" || isMetaConfigKey(code)) return;
    (config.tracks || []).forEach((track) => addSoloTrack(pool, seen, track));
    (config.libraryTracks || []).forEach((track) => addSoloTrack(pool, seen, track));
  });

  rooms.forEach(function (room) {
    (room.tracks || []).forEach((track) => addSoloTrack(pool, seen, track));
    (room.libraryTracks || []).forEach((track) => addSoloTrack(pool, seen, track));
  });

  return pool;
}

function shuffleSoloTrackKeys(keys) {
  const shuffled = keys.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }
  return shuffled;
}

function availableSoloTracks(socket, tracks) {
  const skipped = socket.soloLoadFailures || {};
  const stats = soloStatsStore();
  let availableTracks = tracks.filter(function (track) {
    const key = soloTrackKey(track);
    const stat = stats[key] || {};
    return !skipped[key]
      && !stat.disabled
      && stat.qualityStatus !== "needs_fix"
      && !(stat.mediaError && stat.qualityStatus !== "verified");
  });
  if (!availableTracks.length) {
    availableTracks = tracks.filter(function (track) {
      return !skipped[soloTrackKey(track)];
    });
  }
  return availableTracks.length ? availableTracks : tracks;
}

function nextRandomSoloTrack(socket, tracks) {
  const availableTracks = availableSoloTracks(socket, tracks);
  const byKey = {};
  availableTracks.forEach(function (track) {
    byKey[soloTrackKey(track)] = track;
  });

  const player = soloPlayerEntry(socket);
  const allKeys = new Set((tracks || []).map(soloTrackKey));
  player.randomSeenKeys = player.randomSeenKeys.filter(function (key) {
    return allKeys.has(key);
  });

  let seen = new Set(player.randomSeenKeys);
  const previousKey = socket.soloSession && socket.soloSession.track ? soloTrackKey(socket.soloSession.track) : "";
  let candidates = availableTracks.filter(function (track) {
    return !seen.has(soloTrackKey(track));
  });

  if (!candidates.length) {
    player.randomSeenKeys = [];
    seen = new Set();
    candidates = availableTracks.slice();
  }

  const withoutPrevious = candidates.filter(function (track) {
    return soloTrackKey(track) !== previousKey;
  });
  if (withoutPrevious.length) candidates = withoutPrevious;

  const selected = candidates[crypto.randomInt(candidates.length)];
  if (selected) {
    player.randomSeenKeys.push(soloTrackKey(selected));
    savePersistedRooms();
  }

  return selected;
}

function dailySoloDay(day) {
  const store = dailySoloStore();
  const key = rawText(day || dayKey(now()), 20);
  if (!store.days[key] || typeof store.days[key] !== "object" || Array.isArray(store.days[key])) {
    store.days[key] = { day: key, players: {}, trackKeys: [], createdAt: now() };
  }
  if (!store.days[key].players || typeof store.days[key].players !== "object" || Array.isArray(store.days[key].players)) {
    store.days[key].players = {};
  }
  if (!Array.isArray(store.days[key].trackKeys)) {
    store.days[key].trackKeys = [];
  }
  return store.days[key];
}

function dailySoloTracks(socket, tracks) {
  const day = dayKey(now());
  const daily = dailySoloDay(day);
  const byKey = {};
  (tracks || []).forEach(function (track) {
    byKey[soloTrackKey(track)] = track;
  });
  if (daily.trackKeys.length) {
    const storedTracks = daily.trackKeys.map(function (key) {
      return byKey[key];
    }).filter(Boolean);
    if (storedTracks.length) return storedTracks;
  }

  const stats = soloStatsStore();
  let available = (tracks || []).filter(function (track) {
    const stat = stats[soloTrackKey(track)] || {};
    return !stat.disabled
      && stat.qualityStatus !== "needs_fix"
      && !(stat.mediaError && stat.qualityStatus !== "verified");
  });
  if (!available.length) available = tracks || [];
  const selected = available.slice().sort(function (a, b) {
    const ak = crypto.createHash("sha1").update(day + "|" + soloTrackKey(a)).digest("hex");
    const bk = crypto.createHash("sha1").update(day + "|" + soloTrackKey(b)).digest("hex");
    return ak.localeCompare(bk);
  }).slice(0, Math.min(DAILY_SOLO_ROUND_COUNT, available.length));
  if (selected.length) {
    daily.trackKeys = selected.map(soloTrackKey);
    daily.tracksCreatedAt = now();
    savePersistedRooms();
  }
  return selected;
}

function dailyPlayerEntry(socket, day) {
  const daily = dailySoloDay(day);
  const clientId = rawText(socket && socket.clientId, 80) || (socket && socket.id) || "solo";
  if (!daily.players[clientId] || typeof daily.players[clientId] !== "object" || Array.isArray(daily.players[clientId])) {
    daily.players[clientId] = {
      clientId: clientId,
      nickname: cleanText(socket && socket.nickname, "Solo", 60),
      avatar: cleanAvatar(socket && socket.avatar),
      attempts: 0,
      guessed: 0,
      streak: 0,
      bestStreak: 0,
      completed: false,
      skippedKeys: {},
      history: []
    };
  }
  daily.players[clientId].nickname = cleanText((socket && socket.nickname) || daily.players[clientId].nickname, "Solo", 60);
  daily.players[clientId].avatar = cleanAvatar((socket && socket.avatar) || daily.players[clientId].avatar);
  if (!Array.isArray(daily.players[clientId].history)) daily.players[clientId].history = [];
  if (!daily.players[clientId].skippedKeys || typeof daily.players[clientId].skippedKeys !== "object" || Array.isArray(daily.players[clientId].skippedKeys)) {
    daily.players[clientId].skippedKeys = {};
  }
  return daily.players[clientId];
}

function publicDailySoloLeaderboard(day) {
  const currentDay = rawText(day || dayKey(now()), 20);
  const daily = dailySoloDay(currentDay);
  return Object.keys(daily.players).map(function (clientId) {
    const player = daily.players[clientId] || {};
    const attempts = Math.max(0, Number(player.attempts || 0));
    const guessed = Math.max(0, Number(player.guessed || 0));
    return {
      nickname: cleanText(player.nickname, "Solo", 60),
      avatar: cleanAvatar(player.avatar),
      attempts: attempts,
      guessed: guessed,
      percent: attempts ? Math.round((guessed / attempts) * 100) : 0,
      streak: Math.max(0, Number(player.streak || 0)),
      bestStreak: Math.max(0, Number(player.bestStreak || 0)),
      completed: Boolean(player.completed)
    };
  }).sort(function (a, b) {
    if (b.guessed !== a.guessed) return b.guessed - a.guessed;
    if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
    if (a.attempts !== b.attempts) return a.attempts - b.attempts;
    return a.nickname.localeCompare(b.nickname);
  }).slice(0, 30);
}

function publicDailySoloForSocket(socket) {
  const day = dayKey(now());
  const tracks = dailySoloTracks(socket, allSoloTracks());
  const daily = dailySoloDay(day);
  const clientId = rawText(socket && socket.clientId, 80) || (socket && socket.id) || "solo";
  const player = socket && socket.soloMode === "daily"
    ? dailyPlayerEntry(socket, day)
    : (daily.players[clientId] || { attempts: 0, guessed: 0, history: [], skippedKeys: {} });
  const answeredKeys = {};
  (Array.isArray(player.history) ? player.history : []).forEach(function (item) {
    if (item && item.trackKey) answeredKeys[item.trackKey] = true;
  });
  Object.keys(player.skippedKeys || {}).forEach(function (key) {
    answeredKeys[key] = true;
  });
  const remaining = tracks.filter(function (track) {
    return !answeredKeys[soloTrackKey(track)];
  }).length;
  return {
    active: socket && socket.soloMode === "daily",
    day: day,
    total: tracks.length,
    attempts: Math.max(0, Number(player.attempts || 0)),
    guessed: Math.max(0, Number(player.guessed || 0)),
    remaining: remaining,
    completed: Boolean(player.completed) || (tracks.length > 0 && remaining === 0),
    leaderboard: publicDailySoloLeaderboard(day)
  };
}

function nextDailySoloTrack(socket, tracks) {
  const day = dayKey(now());
  const dailyTracks = dailySoloTracks(socket, tracks);
  const player = dailyPlayerEntry(socket, day);
  const answeredKeys = {};
  player.history.forEach(function (item) {
    if (item && item.trackKey) answeredKeys[item.trackKey] = true;
  });
  Object.keys(player.skippedKeys || {}).forEach(function (key) {
    answeredKeys[key] = true;
  });
  const nextTrack = dailyTracks.find(function (track) {
    return !answeredKeys[soloTrackKey(track)];
  });
  if (!nextTrack) {
    player.completed = dailyTracks.length > 0;
    return null;
  }
  return nextTrack;
}

function updateSoloStatMeta(track, entry) {
  entry.anime = combinedAnimeTitle(track.englishTitle, track.romajiTitle, track.anime);
  entry.opening = rawText(track.opening, 120);
  entry.coverUrl = rawText(track.coverUrl, 700);
  entry.audioUrl = rawText(track.audioUrl, 700);
  entry.aliases = cleanAliases(track.aliases);
  entry.fallbackAudioUrl = cleanAudioUrl(track.fallbackAudioUrl, "");
  entry.videoId = rawText(track.videoId, 40);
  entry.englishTitle = cleanAnimeTitlePart(track.englishTitle);
  entry.romajiTitle = cleanAnimeTitlePart(track.romajiTitle);
  entry.difficulty = difficultyExists(track.difficulty) ? track.difficulty : "medium";
  entry.qualityStatus = normalizeQualityStatus(entry.qualityStatus || track.qualityStatus, "ok");
  entry.disabled = Boolean(entry.disabled);
}

function soloStatForTrack(track) {
  const store = soloStatsStore();
  const key = soloTrackKey(track);
  if (!store[key]) store[key] = { attempts: 0, guessed: 0 };
  updateSoloStatMeta(track, store[key]);
  return store[key];
}

function markSoloTrackLoadError(track, reason) {
  const stat = soloStatForTrack(track);
  if (!stat) return null;
  stat.mediaError = true;
  stat.mediaErrorAt = now();
  stat.mediaErrorReason = rawText(reason, 160) || "Nie zaladowano openingu";
  stat.loadFailures = Math.max(0, Number(stat.loadFailures || 0)) + 1;
  stat.qualityStatus = "needs_fix";
  savePersistedRooms();
  broadcastModeratorStats();
  return stat;
}

function clearSoloTrackLoadError(track) {
  const stat = soloStatForTrack(track);
  if (!stat) return null;
  if (!stat.mediaError && !stat.mediaErrorReason && !stat.mediaErrorAt) return stat;
  delete stat.mediaError;
  delete stat.mediaErrorReason;
  delete stat.mediaErrorAt;
  if (stat.qualityStatus === "needs_fix") stat.qualityStatus = "ok";
  savePersistedRooms();
  broadcastModeratorStats();
  return stat;
}

function publicSoloStats(currentKey) {
  const store = soloStatsStore();
  const rowsByKey = {};

  function ensureRow(track, explicitKey) {
    const key = explicitKey || soloTrackKey(track);
    const entry = store[key] || {};
    if (!rowsByKey[key]) {
      rowsByKey[key] = {
        key: key,
        anime: combinedAnimeTitle(entry.englishTitle || (track && track.englishTitle), entry.romajiTitle || (track && track.romajiTitle), entry.anime || (track && track.anime)),
        opening: rawText(entry.opening || (track && track.opening), 120),
        coverUrl: rawText(entry.coverUrl || (track && track.coverUrl), 700),
        audioUrl: rawText(entry.audioUrl || (track && track.audioUrl), 700),
        aliases: cleanAliases(entry.aliases || (track && track.aliases)),
        fallbackAudioUrl: cleanAudioUrl(entry.fallbackAudioUrl || (track && track.fallbackAudioUrl), ""),
        videoId: rawText(entry.videoId || (track && track.videoId), 40),
        englishTitle: cleanAnimeTitlePart(entry.englishTitle || (track && track.englishTitle)),
        romajiTitle: cleanAnimeTitlePart(entry.romajiTitle || (track && track.romajiTitle)),
        difficulty: difficultyExists(entry.difficulty) ? entry.difficulty : (difficultyExists(track && track.difficulty) ? track.difficulty : "medium"),
        difficultyLabel: difficultyLabel(difficultyExists(entry.difficulty) ? entry.difficulty : (difficultyExists(track && track.difficulty) ? track.difficulty : "medium")),
        qualityStatus: normalizeQualityStatus(entry.qualityStatus || (track && track.qualityStatus), "ok"),
        qualityLabel: qualityLabel(entry.qualityStatus || (track && track.qualityStatus)),
        disabled: Boolean(entry.disabled),
        reportsCount: 0,
        attempts: 0,
        guessed: 0,
        missed: 0,
        soloAttempts: 0,
        gameAttempts: 0,
        soloGameAttempts: 0,
        mediaError: Boolean(entry.mediaError),
        mediaErrorReason: rawText(entry.mediaErrorReason, 160),
        mediaErrorAt: numberInRange(entry.mediaErrorAt, 0, 0, 9999999999),
        loadFailures: Math.max(0, Number(entry.loadFailures || 0)),
        verifiedAt: numberInRange(entry.verifiedAt, 0, 0, 9999999999),
        current: key === currentKey
      };
    } else if (difficultyExists(track && track.difficulty)) {
      rowsByKey[key].difficulty = track.difficulty;
      rowsByKey[key].difficultyLabel = difficultyLabel(track.difficulty);
    }
    return rowsByKey[key];
  }

  allSoloTracks().forEach(function (track) {
    const key = soloTrackKey(track);
    const entry = store[key] || {};
    const row = ensureRow(track);
    const attempts = Math.max(0, Number(entry.attempts || 0));
    const guessed = Math.max(0, Number(entry.guessed || 0));
    row.attempts += attempts;
    row.guessed += guessed;
    row.missed += Math.max(0, attempts - guessed);
    row.soloAttempts += attempts;
    if (entry.mediaError) {
      row.mediaError = true;
      row.mediaErrorReason = rawText(entry.mediaErrorReason, 160);
      row.mediaErrorAt = numberInRange(entry.mediaErrorAt, 0, 0, 9999999999);
    }
  });

  Object.keys(store).forEach(function (key) {
    if (rowsByKey[key]) return;
    const entry = store[key] || {};
    const row = ensureRow({
      anime: entry.anime,
      opening: entry.opening,
      coverUrl: entry.coverUrl
    }, key);
    const attempts = Math.max(0, Number(entry.attempts || 0));
    const guessed = Math.max(0, Number(entry.guessed || 0));
    row.attempts += attempts;
    row.guessed += guessed;
    row.missed += Math.max(0, attempts - guessed);
    row.soloAttempts += attempts;
    if (entry.mediaError) {
      row.mediaError = true;
      row.mediaErrorReason = rawText(entry.mediaErrorReason, 160);
      row.mediaErrorAt = numberInRange(entry.mediaErrorAt, 0, 0, 9999999999);
    }
  });

  collectRoomTrackResults().forEach(function (result) {
    const track = result.track;
    const row = ensureRow(track);
    row.attempts += 1;
    if (!(track.result && track.result.status === "guessed")) row.missed += 1;
    if (result.soloGame) {
      row.soloAttempts += 1;
      row.soloGameAttempts += 1;
    } else {
      row.gameAttempts += 1;
    }
    if (track.result && track.result.status === "guessed") row.guessed += 1;
  });

  soloReportsStore().forEach(function (report) {
    const key = rawText(report.trackKey, 140);
    if (!key || !rowsByKey[key]) return;
    rowsByKey[key].reportsCount += 1;
    if (rowsByKey[key].qualityStatus === "ok") {
      rowsByKey[key].qualityStatus = "reported";
      rowsByKey[key].qualityLabel = qualityLabel("reported");
    }
  });

  const rows = Object.keys(rowsByKey).map(function (key) {
    const row = rowsByKey[key];
    row.percent = row.attempts ? Math.round((row.guessed / row.attempts) * 100) : 0;
    row.qualityLabel = qualityLabel(row.qualityStatus);
    return row;
  });

  return rows.sort(function (a, b) {
    if (a.current !== b.current) return a.current ? -1 : 1;
    if (a.attempts !== b.attempts) return b.attempts - a.attempts;
    if (a.percent !== b.percent) return b.percent - a.percent;
    return a.anime.localeCompare(b.anime);
  });
}

function publicSoloReports() {
  return soloReportsStore()
    .slice()
    .sort(function (a, b) {
      return numberInRange(b.at, 0, 0, 9999999999) - numberInRange(a.at, 0, 0, 9999999999);
    })
    .map(function (report) {
      return {
        id: rawText(report.id, 80),
        at: numberInRange(report.at, 0, 0, 9999999999),
        nickname: cleanText(report.nickname, "Solo", 60),
        message: rawText(report.message, 700),
        trackKey: rawText(report.trackKey, 140),
        trackId: rawText(report.trackId, 80),
        anime: combinedAnimeTitle(report.englishTitle, report.romajiTitle, report.anime),
        opening: rawText(report.opening, 120),
        aliases: cleanAliases(report.aliases),
        englishTitle: cleanAnimeTitlePart(report.englishTitle),
        romajiTitle: cleanAnimeTitlePart(report.romajiTitle),
        difficulty: difficultyExists(report.difficulty) ? report.difficulty : "medium",
        difficultyLabel: difficultyLabel(report.difficulty),
        qualityStatus: normalizeQualityStatus(report.qualityStatus, "reported"),
        fallbackAudioUrl: cleanAudioUrl(report.fallbackAudioUrl, ""),
        coverUrl: rawText(report.coverUrl, 700),
        description: rawText(report.description, 420),
        audioUrl: rawText(report.audioUrl, 700),
        videoId: rawText(report.videoId, 40),
        sourceTitle: rawText(report.sourceTitle, 180),
        durationText: rawText(report.durationText, 20),
        durationSeconds: numberInRange(report.durationSeconds, 0, 0, 86400),
        startAtFirst: numberInRange(report.startAtFirst, 0, 0, 36000),
        startAtSecond: numberInRange(report.startAtSecond, 5, 0, 36000)
      };
    });
}

function roomStatsSources() {
  const sources = [];
  const seen = {};

  rooms.forEach(function (room, code) {
    seen[code] = true;
    sources.push({
      code: code,
      active: true,
      room: room,
      config: null
    });
  });

  Object.keys(persistedRoomConfigs).forEach(function (code) {
    if (isMetaConfigKey(code) || seen[code]) return;
    const config = persistedRoomConfigs[code];
    if (!config || typeof config !== "object") return;
    sources.push({
      code: code,
      active: false,
      room: null,
      config: config
    });
  });

  if (!sources.length) {
    sources.push({
      code: "LOBBY",
      active: false,
      room: null,
      config: { tracks: [], libraryTracks: [], currentTrackId: null, updatedAt: 0 }
    });
  }

  return sources.sort(function (a, b) {
    if (a.code === "LOBBY") return -1;
    if (b.code === "LOBBY") return 1;
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.code.localeCompare(b.code);
  });
}

function sourceTracks(source) {
  if (source.room) return source.room.tracks || [];
  return restoreTracks(source.config && source.config.tracks);
}

function sourceLibraryTracks(source) {
  if (source.room) return source.room.libraryTracks || [];
  return restoreTracks(source.config && source.config.libraryTracks);
}

function collectRoomTrackResults() {
  const resultTracks = [];
  roomStatsSources().forEach(function (source) {
    sourceTracks(source).forEach(function (track) {
      if (track && track.result && (track.result.status === "guessed" || track.result.status === "missed")) {
        resultTracks.push({
          track: track,
          sourceCode: source.code,
          soloGame: source.code === "SOLO"
        });
      }
    });
  });
  return resultTracks;
}

function publicAdminRooms(currentCode) {
  return roomStatsSources().map(function (source) {
    const tracks = sourceTracks(source);
    const libraryTracks = sourceLibraryTracks(source);
    const activeClients = source.room ? roomClients(source.room).filter(function (client) {
      return client.joined;
    }) : [];
    const activePlayers = activeClients.filter(function (client) {
      return client.role === "player";
    });
    const currentTrackId = source.room ? source.room.currentTrackId : rawText(source.config && source.config.currentTrackId, 80);
    const selectedTrack = tracks.find(function (track) {
      return track.id === currentTrackId;
    }) || tracks[0] || null;

    return {
      code: source.code,
      active: source.active,
      current: source.code === currentCode,
      people: activeClients.length,
      players: activePlayers.length,
      groups: source.room ? Object.keys(source.room.groups || {}).length : 0,
      tracks: tracks.length,
      libraryTracks: libraryTracks.length,
      results: tracks.filter(function (track) { return track.result; }).length,
      currentAnime: selectedTrack ? rawText(selectedTrack.anime, 180) : "",
      updatedAt: source.room ? source.room.updatedAt : numberInRange(source.config && source.config.updatedAt, 0, 0, 9999999999)
    };
  });
}

function fallbackRoomCodeAfterRemoval(targetCode) {
  const codes = [];
  rooms.forEach(function (_room, code) {
    if (code !== targetCode) codes.push(code);
  });
  Object.keys(persistedRoomConfigs).forEach(function (code) {
    if (isMetaConfigKey(code) || code === targetCode || codes.includes(code)) return;
    const config = persistedRoomConfigs[code];
    if (!config || typeof config !== "object") return;
    codes.push(code);
  });
  codes.sort(function (a, b) {
    if (a === "LOBBY") return -1;
    if (b === "LOBBY") return 1;
    if (a === "SOLO" && b !== "SOLO") return 1;
    if (b === "SOLO" && a !== "SOLO") return -1;
    return a.localeCompare(b);
  });
  return codes[0] || targetCode;
}

function normalizeAnswer(value) {
  return rawText(value, 180)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compactAnswer(value) {
  return normalizeAnswer(value).replace(/\s+/g, "");
}

function levenshteinDistance(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  let previous = Array.from({ length: right.length + 1 }, function (_value, index) { return index; });
  for (let i = 0; i < left.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < right.length; j += 1) {
      const cost = left[i] === right[j] ? 0 : 1;
      current[j + 1] = Math.min(
        current[j] + 1,
        previous[j + 1] + 1,
        previous[j] + cost
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function tokenOverlapScore(a, b) {
  const answerTokens = normalizeAnswer(a).split(/\s+/).filter(function (token) { return token.length >= 3; });
  const titleTokens = normalizeAnswer(b).split(/\s+/).filter(function (token) { return token.length >= 3; });
  if (!answerTokens.length || !titleTokens.length) return 0;
  const titleSet = new Set(titleTokens);
  const hits = answerTokens.filter(function (token) { return titleSet.has(token); }).length;
  return hits / Math.max(answerTokens.length, titleTokens.length);
}

function fuzzyTitleMatches(answerText, title) {
  const answer = normalizeAnswer(answerText);
  const normalizedTitle = normalizeAnswer(title);
  if (!answer || !normalizedTitle) return false;
  if (answer === normalizedTitle) return true;
  if (answer.length >= 6 && normalizedTitle.includes(answer)) return true;
  if (normalizedTitle.length >= 6 && answer.includes(normalizedTitle)) return true;

  const compactA = compactAnswer(answer);
  const compactB = compactAnswer(normalizedTitle);
  const maxLength = Math.max(compactA.length, compactB.length);
  if (maxLength >= 8) {
    const distance = levenshteinDistance(compactA, compactB);
    const ratio = distance / maxLength;
    if (distance <= 2 || ratio <= 0.18) return true;
  }

  return answer.length >= 8 && tokenOverlapScore(answer, normalizedTitle) >= 0.72;
}

function soloTrackTitles(track) {
  const titles = [
    track && track.anime,
    track && track.title,
    track && track.englishTitle,
    track && track.romajiTitle
  ].map(function (value) {
    return rawText(value, 180);
  }).filter(Boolean);

  cleanAliases(track && track.aliases).forEach(function (alias) {
    titles.push(alias);
  });

  return Array.from(new Set(titles));
}

function publicSoloTitleOptions() {
  const seen = {};
  const options = [];
  allSoloTracks().forEach(function (track) {
    soloTrackTitles(track).forEach(function (title) {
      const key = normalizeAnswer(title);
      if (!key || seen[key]) return;
      seen[key] = true;
      options.push(title);
    });
  });
  return options.sort(function (a, b) {
    return a.localeCompare(b);
  });
}

function soloAnswerMatches(track, answerText) {
  if (!normalizeAnswer(answerText)) return false;
  return soloTrackTitles(track).some(function (title) {
    return fuzzyTitleMatches(answerText, title);
  });
}

function currentTrack(room) {
  return room.tracks.find(function (track) {
    return track.id === room.currentTrackId;
  }) || null;
}

function isRoundClosed(room) {
  const track = currentTrack(room);
  return Boolean(room.revealed || room.phase === "ended" || (track && track.result));
}

function elapsed(room) {
  if (room.phase === "playing") {
    return numberInRange(room.offset + now() - room.startedAt, 0, 0, room.settings.clipDuration);
  }
  return numberInRange(room.offset, 0, 0, room.settings.clipDuration);
}

function difficultyExists(key) {
  return DIFFICULTIES.some(function (difficulty) {
    return difficulty.key === key;
  });
}

function isHintCharacter(char) {
  return /[\p{L}\p{N}]/u.test(char);
}

function maskAnimeTitle(title, visibleLetters) {
  let left = numberInRange(visibleLetters, 0, 0, 99);
  return Array.from(rawText(title, 180) || "Anime").map(function (char) {
    if (!isHintCharacter(char)) return char;
    if (left > 0) {
      left -= 1;
      return char;
    }
    return "_";
  }).join("");
}

function animeHintSteps(title) {
  return [maskAnimeTitle(rawText(title, 180) || "Anime", 1)];
}

function soloAnimeHintSteps(title) {
  const first = Array.from(rawText(title, 180) || "Anime").find(isHintCharacter);
  return first ? [first] : [];
}

function difficultyLabel(key) {
  const match = DIFFICULTIES.find(function (difficulty) {
    return difficulty.key === key;
  });
  return match ? match.label : "Medium";
}

function scoreFor(room, seconds) {
  const track = currentTrack(room);
  const difficulty = track && difficultyExists(track.difficulty) ? track.difficulty : "medium";
  const scores = room.settings.difficultyScores[difficulty] || DEFAULT_DIFFICULTY_SCORES.medium;
  if (seconds <= room.settings.segmentSplit) return scores.first;
  if (seconds <= room.settings.clipDuration) return scores.second;
  return 0;
}

function scoringLabel(room, points, seconds) {
  const track = currentTrack(room);
  const difficulty = track ? difficultyLabel(track.difficulty) : "Medium";
  if (seconds <= room.settings.segmentSplit) return difficulty + " · 0-5 s";
  if (seconds <= room.settings.clipDuration) return difficulty + " · 5-" + room.settings.clipDuration + " s";
  return difficulty + " · poza czasem";
}

function groupScores(room) {
  const scores = {};
  Object.keys(room.groups).forEach(function (name) {
    scores[name] = room.groups[name].score;
  });
  return scores;
}

function publicGroups(room) {
  return Object.keys(room.groups)
    .sort(function (a, b) {
      return a.localeCompare(b);
    })
    .map(function (name) {
      return {
        name: name,
        score: room.groups[name].score,
        locked: Boolean(room.groups[name].password),
        blockedThisRound: Boolean(room.lockedGroups[name])
      };
    });
}

function publicBlockedIps(room) {
  return Object.keys(room.blockedIps || {})
    .sort(function (a, b) {
      const left = room.blockedIps[a] || {};
      const right = room.blockedIps[b] || {};
      return cleanText(left.nickname, "Gracz", 60).localeCompare(cleanText(right.nickname, "Gracz", 60));
    })
    .map(function (ip) {
      const entry = room.blockedIps[ip] || {};
      return {
        id: blockIdForIp(ip),
        nickname: cleanText(entry.nickname, "Gracz", 60),
        team: cleanText(entry.team, "Druzyna", 32),
        by: cleanText(entry.by, "Administrator", 60),
        at: numberInRange(entry.at, now(), 0, 9999999999)
      };
    });
}

function isIpBlocked(room, ip) {
  const normalized = normalizeIp(ip);
  return Boolean(normalized && room.blockedIps && room.blockedIps[normalized]);
}

function detectYouTubeVideoId(value) {
  let text = String(value || "").trim();
  if (/^(www\.)?(youtube\.com|m\.youtube\.com|music\.youtube\.com|youtu\.be)\//i.test(text)) {
    text = "https://" + text;
  }
  if (!/^https?:\/\//i.test(text)) return "";

  try {
    const url = new URL(text);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.searchParams.get("v")) return url.searchParams.get("v").slice(0, 40);
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0]) && parts[1]) return parts[1].slice(0, 40);
    }
  } catch (error) {
    return "";
  }

  return "";
}

function cleanPlaylistId(value) {
  return String(value || "").trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 120);
}

function detectYouTubePlaylistId(value) {
  let text = String(value || "").trim();
  if (/^(www\.)?(youtube\.com|m\.youtube\.com|music\.youtube\.com)\//i.test(text)) {
    text = "https://" + text;
  }

  try {
    const url = new URL(text);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const list = cleanPlaylistId(url.searchParams.get("list"));
      if (list) return list;
    }
    return "";
  } catch (error) {
    const raw = cleanPlaylistId(text);
    if (raw.length >= 8) return raw;
  }

  const raw = cleanPlaylistId(text);
  return raw.length >= 8 ? raw : "";
}

function extractBalancedJson(text, marker) {
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return "";

  const start = text.indexOf("{", markerIndex);
  if (start < 0) return "";

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") inString = true;
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }

  return "";
}

function youtubeText(value) {
  if (!value || typeof value !== "object") return "";
  if (value.simpleText) return rawText(value.simpleText, 140);
  if (Array.isArray(value.runs)) {
    return rawText(value.runs.map(function (run) {
      return run && run.text ? run.text : "";
    }).join(""), 140);
  }
  return "";
}

function youtubeContentText(value) {
  return rawText(value && value.content, 140);
}

function durationFromAccessibilityLabel(value) {
  const text = String(value || "").toLowerCase();
  let match = text.match(/(\d+)\s+hours?,\s*(\d+)\s+minutes?,\s*(\d+)\s+seconds?/);
  if (match) return Number(match[1]) + ":" + String(Number(match[2])).padStart(2, "0") + ":" + String(Number(match[3])).padStart(2, "0");
  match = text.match(/(\d+)\s+minutes?,\s*(\d+)\s+seconds?/);
  if (match) return Number(match[1]) + ":" + String(Number(match[2])).padStart(2, "0");
  match = text.match(/(\d+)\s+seconds?/);
  if (match) return "0:" + String(Number(match[1])).padStart(2, "0");
  return "";
}

function decodeJsonString(value) {
  try {
    return JSON.parse("\"" + String(value || "").replace(/"/g, "\\\"") + "\"");
  } catch (error) {
    return String(value || "");
  }
}

function cleanYouTubeTitle(title) {
  return rawText(String(title || "")
    .replace(/\s*\[[^\]]*\]\s*/g, " ")
    .replace(/\s*\((?:official|creditless|tv size|full|lyrics?|audio|hd|uhd|4k|60\s*fps|subbed|subtitles|dvd-rip)[^)]*\)\s*/gi, " ")
    .replace(/\b(?:creditless|official|lyrics?|full version|tv size|hd|uhd|4k|60\s*fps|subbed|subtitles|dvd-rip|opening movie)\b/gi, " "), 140);
}

function parseOpeningTitle(title) {
  const clean = cleanYouTubeTitle(title);
  const japaneseQuoted = clean.match(/^TVアニメ[「『]([^」』]+)[」』].*?(?:OP|オープニング)/i);
  if (japaneseQuoted) {
    return {
      anime: rawText(japaneseQuoted[1], 90) || clean || "Anime z YouTube",
      opening: "Opening 1"
    };
  }

  const match = clean.match(/^(.*?)\s*(?:-|:)?\s*(?:OP|Opening)\s*([0-9]+|[IVXLC]+)?\b/i);
  if (!match) {
    return {
      anime: clean || "Anime z YouTube",
      opening: "Opening 1"
    };
  }

  return {
    anime: rawText(match[1], 90) || clean || "Anime z YouTube",
    opening: rawText("Opening " + (match[2] || ""), 90)
  };
}

function trackFromYouTubeVideo(video, difficulty) {
  const meta = parseOpeningTitle(video.title || "");
  const titleParts = splitCombinedAnimeTitle(meta.anime);
  return {
    anime: combinedAnimeTitle(titleParts.englishTitle, titleParts.romajiTitle, meta.anime),
    opening: meta.opening,
    englishTitle: titleParts.englishTitle,
    romajiTitle: titleParts.romajiTitle,
    coverUrl: youtubeThumbnailUrl(video.videoId),
    description: "",
    difficulty: difficultyExists(difficulty) ? difficulty : "medium",
    audioUrl: "https://www.youtube.com/watch?v=" + video.videoId,
    sourceTitle: rawText(video.title, 180),
    durationText: rawText(video.durationText, 20),
    durationSeconds: numberInRange(video.durationSeconds, parseDurationText(video.durationText), 0, 86400),
    startAtFirst: 0,
    startAtSecond: 5
  };
}

function animeLookupQuery(track) {
  const candidates = [
    track && track.englishTitle,
    track && track.romajiTitle,
    track && track.anime,
    track && track.sourceTitle
  ].map(cleanAnimeTitlePart).filter(Boolean);
  const value = candidates.find(function (candidate) {
    return !/^youtube opening/i.test(candidate) && !hasJapaneseText(candidate);
  }) || candidates[0] || "";
  return rawText(value.replace(/\s+\/\s+.*$/, ""), 100);
}

async function fetchAnimeTitleMeta(query) {
  const cleanQuery = cleanAnimeTitlePart(query);
  if (!cleanQuery) return null;
  const cacheKey = normalizeAnswer(cleanQuery);
  if (animeTitleLookupCache.has(cacheKey)) return animeTitleLookupCache.get(cacheKey);

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "user-agent": "AnimeOpeningQuiz"
      },
      body: JSON.stringify({
        query: "query ($search: String) { Media(search: $search, type: ANIME) { title { english romaji } } }",
        variables: { search: cleanQuery }
      })
    });
    if (!response.ok) throw new Error("AniList error");
    const payload = await response.json();
    const title = payload && payload.data && payload.data.Media && payload.data.Media.title;
    const meta = title ? {
      englishTitle: cleanAnimeTitlePart(title.english || title.romaji),
      romajiTitle: cleanAnimeTitlePart(title.romaji || title.english)
    } : null;
    animeTitleLookupCache.set(cacheKey, meta);
    return meta;
  } catch (error) {
    animeTitleLookupCache.set(cacheKey, null);
    return null;
  }
}

async function trackFromYouTubeVideoWithTitles(video, difficulty) {
  const track = trackFromYouTubeVideo(video, difficulty);
  const needsLookup = !track.englishTitle
    || !track.romajiTitle
    || hasJapaneseText(track.englishTitle)
    || hasJapaneseText(track.romajiTitle)
    || normalizeAnswer(track.englishTitle) === normalizeAnswer(track.sourceTitle)
    || normalizeAnswer(track.romajiTitle) === normalizeAnswer(track.sourceTitle);
  const meta = needsLookup ? await fetchAnimeTitleMeta(animeLookupQuery(track)) : null;
  if (meta) {
    track.englishTitle = meta.englishTitle || track.englishTitle;
    track.romajiTitle = meta.romajiTitle || track.romajiTitle;
  }
  track.anime = combinedAnimeTitle(track.englishTitle, track.romajiTitle, track.anime);
  return track;
}

function titleNearVideoId(html, videoId) {
  const index = html.indexOf("\"videoId\":\"" + videoId + "\"");
  if (index < 0) return "";
  const segment = html.slice(Math.max(0, index - 2200), index + 3600);
  const runMatch = segment.match(/"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/);
  if (runMatch) return rawText(decodeJsonString(runMatch[1]), 140);
  const simpleMatch = segment.match(/"title"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/);
  if (simpleMatch) return rawText(decodeJsonString(simpleMatch[1]), 140);
  return "";
}

function durationNearVideoId(html, videoId) {
  const index = html.indexOf("\"videoId\":\"" + videoId + "\"");
  if (index < 0) return "";
  const segment = html.slice(Math.max(0, index - 1200), index + 3600);
  const match = segment.match(/"lengthText"\s*:\s*\{\s*(?:"accessibility"\s*:\s*\{[^}]*\}\s*,\s*)?"simpleText"\s*:\s*"([^"]+)"/);
  return match ? rawText(decodeJsonString(match[1]), 20) : "";
}

function findRendererJsonForVideo(html, videoId) {
  const marker = "\"videoId\":\"" + videoId + "\"";
  const index = html.indexOf(marker);
  if (index < 0) return "";

  const rendererStart = Math.max(
    html.lastIndexOf("\"playlistVideoRenderer\"", index),
    html.lastIndexOf("\"videoRenderer\"", index),
    html.lastIndexOf("\"compactVideoRenderer\"", index)
  );
  if (rendererStart < 0) return "";

  const braceStart = html.indexOf("{", rendererStart);
  if (braceStart < 0 || braceStart > index) return "";

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let position = braceStart; position < html.length; position += 1) {
    const character = html[position];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") inString = true;
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(braceStart, position + 1);
    }
  }

  return "";
}

function videoFromRendererHtml(html, videoId) {
  const rendererJson = findRendererJsonForVideo(html, videoId);
  if (!rendererJson) return null;

  try {
    const item = JSON.parse(rendererJson);
    const durationText = youtubeText(item.lengthText);
    return {
      videoId: videoId,
      title: youtubeText(item.title),
      durationText: durationText,
      durationSeconds: parseDurationText(durationText)
    };
  } catch (error) {
    return null;
  }
}

function needsVideoTitleFetch(video) {
  const title = rawText(video && video.title, 140);
  return !title || /^YouTube opening(?:\s+\d+)?$/i.test(title);
}

function videoTitleFromWatchHtml(html) {
  const initialData = extractBalancedJson(html, "ytInitialData");
  if (initialData) {
    try {
      const data = JSON.parse(initialData);
      const contents = data && data.contents && data.contents.twoColumnWatchNextResults && data.contents.twoColumnWatchNextResults.results;
      const primary = contents && contents.results && Array.isArray(contents.results.contents) ? contents.results.contents : [];
      for (const entry of primary) {
        const title = youtubeText(entry && entry.videoPrimaryInfoRenderer && entry.videoPrimaryInfoRenderer.title);
        if (title) return title;
      }
    } catch (error) {}
  }

  const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogMatch) return rawText(decodeJsonString(ogMatch[1].replace(/&quot;/g, "\\\"").replace(/&amp;/g, "&")), 140);

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) return rawText(titleMatch[1].replace(/\s*-\s*YouTube\s*$/i, ""), 140);

  return "";
}

async function fillMissingVideoTitle(video) {
  if (!video || !needsVideoTitleFetch(video)) return video;

  try {
    const response = await fetch("https://www.youtube.com/watch?v=" + encodeURIComponent(video.videoId) + "&hl=pl", {
      headers: {
        "accept-language": "pl,en;q=0.8",
        "user-agent": "Mozilla/5.0 AnimeOpeningQuiz"
      }
    });
    if (!response.ok) return video;
    const html = await response.text();
    const title = videoTitleFromWatchHtml(html);
    if (title) video.title = title;
  } catch (error) {}

  return video;
}

function videoFromLockupViewModel(item) {
  if (!item || typeof item !== "object") return null;
  if (item.contentType && item.contentType !== "LOCKUP_CONTENT_TYPE_VIDEO") return null;

  const command = item.rendererContext && item.rendererContext.commandContext && item.rendererContext.commandContext.onTap && item.rendererContext.commandContext.onTap.innertubeCommand;
  const endpoint = command && command.watchEndpoint;
  const videoId = rawText(item.contentId || (endpoint && endpoint.videoId), 40);
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;

  const metadata = item.metadata && item.metadata.lockupMetadataViewModel;
  const durationText = durationFromAccessibilityLabel(item.rendererContext && item.rendererContext.accessibilityContext && item.rendererContext.accessibilityContext.label);
  return {
    videoId: videoId,
    title: youtubeContentText(metadata && metadata.title) || "YouTube opening",
    durationText: durationText,
    durationSeconds: parseDurationText(durationText)
  };
}

function collectYouTubeVideos(node, videos, seen) {
  if (!node || typeof node !== "object" || videos.length >= 300) return;

  const item = node.playlistVideoRenderer || node.videoRenderer || node.compactVideoRenderer;
  if (item) {
    const videoId = rawText(item.videoId, 40);
    if (/^[A-Za-z0-9_-]{11}$/.test(videoId) && !seen[videoId]) {
      const durationText = youtubeText(item.lengthText);
      seen[videoId] = true;
      videos.push({
        videoId: videoId,
        title: youtubeText(item.title) || "YouTube opening",
        durationText: durationText,
        durationSeconds: parseDurationText(durationText)
      });
    }
  }

  const lockupVideo = videoFromLockupViewModel(node.lockupViewModel);
  if (lockupVideo && !seen[lockupVideo.videoId]) {
    seen[lockupVideo.videoId] = true;
    videos.push(lockupVideo);
  }

  Object.keys(node).forEach(function (key) {
    collectYouTubeVideos(node[key], videos, seen);
  });
}

function collectYouTubeContinuationTokens(node, tokens, queued) {
  if (!node || typeof node !== "object") return;
  const command = node.continuationCommand;
  const token = command && rawText(command.token, 4000);
  if (token && !queued[token]) {
    queued[token] = true;
    tokens.push(token);
  }
  Object.keys(node).forEach(function (key) {
    collectYouTubeContinuationTokens(node[key], tokens, queued);
  });
}

async function fetchYouTubeBrowse(payload) {
  const body = Object.assign({
    context: { client: YOUTUBE_INNERTUBE_CLIENT }
  }, payload);
  const response = await fetch("https://www.youtube.com/youtubei/v1/browse?key=" + encodeURIComponent(YOUTUBE_INNERTUBE_API_KEY), {
    method: "POST",
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 AnimeOpeningQuiz"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error("YouTube Innertube error");
  return response.json();
}

async function fetchPlaylistVideosFromInnertube(playlistId) {
  const videos = [];
  const seen = {};
  const queued = {};
  const processed = {};
  const pending = [];

  const first = await fetchYouTubeBrowse({ browseId: "VL" + playlistId });
  collectYouTubeVideos(first, videos, seen);
  collectYouTubeContinuationTokens(first, pending, queued);

  while (pending.length && videos.length < 300) {
    const token = pending.shift();
    if (processed[token]) continue;
    processed[token] = true;
    const page = await fetchYouTubeBrowse({ continuation: token });
    collectYouTubeVideos(page, videos, seen);
    collectYouTubeContinuationTokens(page, pending, queued);
  }

  return videos;
}

function extractPlaylistVideosFromHtml(html) {
  const videos = [];
  const seen = {};
  const initialData = extractBalancedJson(html, "ytInitialData");

  if (initialData) {
    try {
      collectYouTubeVideos(JSON.parse(initialData), videos, seen);
    } catch (error) {
      videos.length = 0;
      Object.keys(seen).forEach(function (key) {
        delete seen[key];
      });
    }
  }

  if (videos.length) return videos;

  const matches = html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g);
  for (const match of matches) {
    const videoId = match[1];
    if (!seen[videoId]) {
      const rendererVideo = videoFromRendererHtml(html, videoId);
      const durationText = (rendererVideo && rendererVideo.durationText) || durationNearVideoId(html, videoId);
      seen[videoId] = true;
      videos.push({
        videoId: videoId,
        title: (rendererVideo && rendererVideo.title) || titleNearVideoId(html, videoId) || "YouTube opening " + (videos.length + 1),
        durationText: durationText,
        durationSeconds: (rendererVideo && rendererVideo.durationSeconds) || parseDurationText(durationText)
      });
      if (videos.length >= 100) break;
    }
  }

  return videos;
}

async function searchYouTubeTracks(payload) {
  const query = rawText(payload.query, 120);
  if (!query) return { error: "Wpisz czego szukasz na YouTube." };

  const difficulty = difficultyExists(payload.difficulty) ? payload.difficulty : "medium";
  const url = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query + " anime opening") + "&hl=pl";
  let response;

  try {
    response = await fetch(url, {
      headers: {
        "accept-language": "pl,en;q=0.8",
        "user-agent": "Mozilla/5.0 AnimeOpeningQuiz"
      }
    });
  } catch (error) {
    return { error: "Nie udalo sie wyszukac na YouTube." };
  }

  if (!response.ok) return { error: "YouTube nie zwrocil wynikow wyszukiwania." };

  const html = await response.text();
  const videos = extractPlaylistVideosFromHtml(html).slice(0, 30);
  if (!videos.length) return { error: "Nie znaleziono wynikow dla tego openingu." };

  const results = [];
  for (const video of videos) {
    const track = await trackFromYouTubeVideoWithTitles(video, difficulty);
    results.push(Object.assign(track, {
      id: id("search_"),
      videoId: video.videoId,
      source: "youtube",
      rawTitle: video.title
    }));
  }

  return {
    results: results
  };
}

async function importPlaylistTracks(room, payload) {
  const playlistId = detectYouTubePlaylistId(payload.playlistUrl || payload.url);
  if (!playlistId) return { error: "Wklej poprawny link do playlisty YouTube." };

  const difficulty = difficultyExists(payload.difficulty) ? payload.difficulty : "medium";
  let videos = [];

  try {
    videos = await fetchPlaylistVideosFromInnertube(playlistId);
  } catch (error) {
    videos = [];
  }

  if (!videos.length) {
    const url = "https://www.youtube.com/playlist?list=" + encodeURIComponent(playlistId) + "&hl=pl";
    let response;

    try {
      response = await fetch(url, {
        headers: {
          "accept-language": "pl,en;q=0.8",
          "user-agent": "Mozilla/5.0 AnimeOpeningQuiz"
        }
      });
    } catch (error) {
      return { error: "Nie udalo sie pobrac playlisty z YouTube." };
    }

    if (!response.ok) return { error: "YouTube nie zwrocil playlisty." };

    const html = await response.text();
    videos = extractPlaylistVideosFromHtml(html);
  }

  if (!videos.length) return { error: "Nie znaleziono filmow na tej playliscie." };

  let added = 0;
  let skipped = 0;
  const existingVideoIds = {};
  function rememberExisting(track) {
    const videoId = rawText(track.videoId || detectYouTubeVideoId(track.audioUrl), 40);
    if (videoId) existingVideoIds[videoId] = true;
  }
  Object.keys(persistedRoomConfigs).forEach(function (code) {
    const config = persistedRoomConfigs[code];
    if (!config || typeof config !== "object" || isMetaConfigKey(code)) return;
    (config.tracks || []).forEach(rememberExisting);
    (config.libraryTracks || []).forEach(rememberExisting);
  });
  rooms.forEach(function (savedRoom) {
    (savedRoom.tracks || []).forEach(rememberExisting);
    (savedRoom.libraryTracks || []).forEach(rememberExisting);
  });

  for (const video of videos) {
    const preparedVideo = await fillMissingVideoTitle(video);
    const normalized = normalizeTrack(await trackFromYouTubeVideoWithTitles(preparedVideo, difficulty), null);

    if (!normalized.error && !existingVideoIds[normalized.track.videoId]) {
      normalized.track.id = id("library_");
      room.libraryTracks.push(normalized.track);
      existingVideoIds[normalized.track.videoId] = true;
      added += 1;
    } else {
      skipped += 1;
    }
  }

  return { added: added, skipped: skipped, total: videos.length };
}

function normalizeTrackResult(result) {
  if (!result || typeof result !== "object") return null;
  if (result.status === "guessed") {
    return {
      status: "guessed",
      nickname: cleanText(result.nickname, "Gracz", 60),
      team: cleanText(result.team, "Druzyna", 32),
      points: numberInRange(result.points, 0, -99, 99),
      buzzedAt: numberInRange(result.buzzedAt, 0, 0, 36000),
      at: numberInRange(result.at, now(), 0, 9999999999)
    };
  }
  if (result.status === "missed") {
    return {
      status: "missed",
      at: numberInRange(result.at, now(), 0, 9999999999)
    };
  }
  return null;
}

function numericTrackTime(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeTrack(payload, existing) {
  const audioUrl = cleanText(payload.audioUrl, existing ? existing.audioUrl : "", 700);
  if (!audioUrl) return { error: "Brakuje linku do audio albo YouTube." };

  const videoId = detectYouTubeVideoId(audioUrl);
  const source = videoId ? "youtube" : "audio";
  const difficulty = difficultyExists(payload.difficulty) ? payload.difficulty : (existing ? existing.difficulty : "medium");
  const firstStartFallback = existing ? existing.startAtFirst : 0;
  const startAtFirst = numberInRange(payload.startAtFirst, numberInRange(payload.startAt, firstStartFallback, 0, 36000), 0, 36000);
  const startAtSecond = numberInRange(payload.startAtSecond, existing ? existing.startAtSecond : startAtFirst + 5, 0, 36000);
  const titleParts = splitCombinedAnimeTitle(payload.anime || payload.title || (existing && existing.anime));
  const englishTitle = cleanAnimeTitlePart(payload.englishTitle || payload.animeEnglish || payload.titleEnglish || (existing && existing.englishTitle) || titleParts.englishTitle);
  const romajiTitle = cleanAnimeTitlePart(payload.romajiTitle || payload.animeRomaji || payload.titleRomaji || (existing && existing.romajiTitle) || titleParts.romajiTitle);
  const sourceTitle = rawText(payload.sourceTitle || payload.rawTitle || (existing && existing.sourceTitle), 180);
  const anime = combinedAnimeTitle(englishTitle, romajiTitle, payload.anime || payload.title || (existing && existing.anime) || (source === "youtube" ? "Anime z YouTube" : "Anime bez nazwy"));
  const opening = rawText(payload.opening || payload.artist, 120);
  const coverUrl = cleanImageUrl(payload.coverUrl || payload.cover || payload.thumbnailUrl, existing ? existing.coverUrl : youtubeThumbnailUrl(videoId));
  const description = rawText(payload.description || payload.animeDescription || payload.summary || (existing && existing.description), 420);
  const aliases = cleanAliases(payload.aliases || payload.answerAliases || payload.altTitles || (existing && existing.aliases));
  const fallbackAudioUrl = cleanAudioUrl(payload.fallbackAudioUrl || payload.localAudioUrl || payload.backupAudioUrl, existing ? existing.fallbackAudioUrl : "");
  const qualityStatus = normalizeQualityStatus(payload.qualityStatus, existing ? existing.qualityStatus : "ok");
  const durationSeconds = numberInRange(payload.durationSeconds, existing ? existing.durationSeconds : parseDurationText(payload.durationText), 0, 86400);
  const durationText = rawText(payload.durationText, 20) || (existing ? existing.durationText : "") || formatDurationSeconds(durationSeconds);

  return {
    track: {
      id: existing ? existing.id : id("track_"),
      anime: anime,
      opening: opening,
      coverUrl: coverUrl,
      description: description,
      aliases: aliases,
      fallbackAudioUrl: fallbackAudioUrl,
      qualityStatus: qualityStatus,
      englishTitle: englishTitle,
      romajiTitle: romajiTitle,
      title: anime,
      artist: opening,
      difficulty: difficulty,
      audioUrl: audioUrl,
      source: source,
      videoId: videoId,
      sourceTitle: sourceTitle,
      durationText: durationText,
      durationSeconds: durationSeconds,
      startAtFirst: startAtFirst,
      startAtSecond: startAtSecond,
      startAt: startAtFirst,
      result: existing ? normalizeTrackResult(existing.result) : null
    }
  };
}

function visibleTrack(track, socket, room) {
  if (!track) return null;
  const canSeeTitle = socket.role === "moderator" || isRoundClosed(room);
  const canSeeAdminMeta = socket.role === "moderator";
  const anime = canSeeTitle ? track.anime : "Anime ukryte";
  const opening = canSeeTitle ? track.opening : "";
  return {
    id: track.id,
    anime: anime,
    opening: opening,
    coverUrl: canSeeAdminMeta ? (track.coverUrl || "") : "",
    description: canSeeAdminMeta ? (track.description || "") : "",
    aliases: canSeeAdminMeta ? cleanAliases(track.aliases) : [],
    englishTitle: canSeeTitle ? (track.englishTitle || "") : "",
    romajiTitle: canSeeTitle ? (track.romajiTitle || "") : "",
    animeHintSteps: canSeeTitle ? [] : animeHintSteps(track.anime),
    animeHintStartAt: Math.max(0, room.settings.clipDuration - 3),
    title: anime,
    artist: opening,
    difficulty: track.difficulty || "medium",
    audioUrl: track.audioUrl,
    fallbackAudioUrl: track.fallbackAudioUrl || "",
    source: track.source || "audio",
    videoId: track.videoId || "",
    qualityStatus: track.qualityStatus || "ok",
    qualityLabel: qualityLabel(track.qualityStatus),
    durationText: track.durationText || "",
    durationSeconds: numberInRange(track.durationSeconds, 0, 0, 86400),
    startAtFirst: numericTrackTime(track.startAtFirst, 0),
    startAtSecond: numericTrackTime(track.startAtSecond, numericTrackTime(track.startAtFirst, 0) + 5),
    startAt: numericTrackTime(track.startAtFirst, 0),
    revealed: canSeeTitle,
    result: normalizeTrackResult(track.result)
  };
}

function soloTrackSecondStart(track) {
  const startAtFirst = numericTrackTime(track && track.startAtFirst, 0);
  const startAtSecond = numericTrackTime(track && track.startAtSecond, startAtFirst + SOLO_SEGMENT_SPLIT);
  return Math.abs(startAtSecond - 5) < 0.001 ? SOLO_SEGMENT_SPLIT : startAtSecond;
}

function peopleForRoom(room, isModerator) {
  const clients = roomClients(room).filter(function (client) {
    return client.joined && client.role === "player";
  });
  const maxByTeam = {};
  let maxSoloScore = 0;

  clients.forEach(function (client) {
    if (client.role !== "player") return;
    const score = Number(client.personalScore || 0);
    if (client.playMode === "solo") {
      if (score > maxSoloScore) maxSoloScore = score;
    } else if (maxByTeam[client.team] == null || score > maxByTeam[client.team]) {
      maxByTeam[client.team] = score;
    }
  });

  return clients
    .map(function (client) {
      const personalScore = Number(client.personalScore || 0);
      const mvpScore = client.playMode === "solo" ? maxSoloScore : (maxByTeam[client.team] || 0);
      return {
        id: client.id,
        nickname: client.nickname,
        team: client.team,
        role: client.role,
        playMode: client.playMode || "group",
        avatar: client.avatar || "",
        personalScore: personalScore,
        isMvp: client.role === "player" && personalScore > 0 && personalScore === mvpScore,
        blockedThisRound: client.role === "player" && Boolean(room.lockedGroups[client.team]),
        ip: "",
        connected: true
      };
    })
    .sort(function (a, b) {
      return a.team.localeCompare(b.team) || b.personalScore - a.personalScore || a.nickname.localeCompare(b.nickname);
    });
}

function publicBuzzer(room) {
  const buzzer = room.currentBuzzer;
  if (!buzzer) return null;

  const startedAt = numberInRange(buzzer.answerStartedAt, now(), 0, 9999999999);
  const deadline = numberInRange(buzzer.answerDeadline, startedAt + ANSWER_TIME_LIMIT, 0, 9999999999);
  const timeLeft = Math.max(0, deadline - now());

  return Object.assign({}, buzzer, {
    answerStartedAt: startedAt,
    answerDeadline: deadline,
    answerLimit: ANSWER_TIME_LIMIT,
    answerTimeLeft: timeLeft,
    answerExpired: timeLeft <= 0
  });
}

function addChangedStateField(target, socket, scope, key, value) {
  if (String(scope || "").startsWith("solo:")) {
    target[key] = value;
    return;
  }
  if (!socket.stateFieldSignatures) socket.stateFieldSignatures = Object.create(null);
  const serialized = JSON.stringify(value);
  const signature = crypto.createHash("sha1").update(serialized === undefined ? "undefined" : serialized).digest("base64");
  const cacheKey = scope + "|" + key;
  if (socket.stateFieldSignatures[cacheKey] === signature) return;
  socket.stateFieldSignatures[cacheKey] = signature;
  target[key] = value;
}

function publicRoom(room, socket) {
  const isModerator = socket.role === "moderator";
  const roundClosed = isRoundClosed(room);
  const scope = "room:" + room.code + ":" + socket.role;
  const roomState = {
    code: room.code,
    phase: room.phase,
    startedAt: room.startedAt,
    offset: elapsed(room),
    revealed: roundClosed,
    roundClosed: roundClosed,
    currentTrackId: room.currentTrackId
  };

  addChangedStateField(roomState, socket, scope, "lockedGroups", Object.keys(room.lockedGroups).filter(function (groupName) {
    return room.lockedGroups[groupName];
  }));
  addChangedStateField(roomState, socket, scope, "tracks", isModerator ? room.tracks : []);
  addChangedStateField(roomState, socket, scope, "libraryTracks", isModerator ? room.libraryTracks : []);
  addChangedStateField(roomState, socket, scope, "currentTrack", visibleTrack(currentTrack(room), socket, room));
  addChangedStateField(roomState, socket, scope, "currentBuzzer", publicBuzzer(room));
  addChangedStateField(roomState, socket, scope, "teams", groupScores(room));
  addChangedStateField(roomState, socket, scope, "groups", publicGroups(room));
  addChangedStateField(roomState, socket, scope, "settings", room.settings);
  addChangedStateField(roomState, socket, scope, "difficulties", DIFFICULTIES);
  addChangedStateField(roomState, socket, scope, "qualityStatuses", QUALITY_STATUSES);
  addChangedStateField(roomState, socket, scope, "people", peopleForRoom(room, isModerator));
  addChangedStateField(roomState, socket, scope, "blockedIps", isModerator ? publicBlockedIps(room) : []);
  addChangedStateField(roomState, socket, scope, "localAudioFiles", isModerator ? listLocalAudioFiles() : []);
  addChangedStateField(roomState, socket, scope, "soloStats", isModerator ? publicSoloStats(room.currentTrackId ? soloTrackKey(currentTrack(room) || {}) : "") : []);
  addChangedStateField(roomState, socket, scope, "soloReports", isModerator ? publicSoloReports() : []);
  addChangedStateField(roomState, socket, scope, "soloLeaderboard", isModerator ? publicSoloLeaderboard() : []);
  addChangedStateField(roomState, socket, scope, "dailySoloLeaderboard", isModerator ? publicDailySoloLeaderboard(dayKey(now())) : []);
  addChangedStateField(roomState, socket, scope, "persistence", isModerator ? publicPersistenceInfo() : null);
  addChangedStateField(roomState, socket, scope, "adminRooms", isModerator ? publicAdminRooms(room.code) : []);

  return {
    type: "state",
    serverNow: now(),
    room: roomState
  };
}

function touch(room) {
  room.updatedAt = now();
}

function broadcast(room) {
  roomClients(room).forEach(function (socket) {
    send(socket, publicRoom(room, socket));
  });
}

function broadcastModeratorStats() {
  sockets.forEach(function (socket) {
    if (socket.role === "moderator" && socket.roomCode) {
      send(socket, publicRoom(getRoom(socket.roomCode), socket));
    }
  });
}

function hasJoinedClients(room) {
  return roomClients(room).some(function (socket) {
    return socket.joined;
  });
}

function send(socket, message) {
  sendRaw(socket, JSON.stringify(message));
}

function sendRaw(socket, text) {
  if (socket.closed || socket.raw.destroyed) return;
  socket.raw.write(encodeFrame(Buffer.from(text, "utf8")));
}

function sendError(socket, message) {
  send(socket, { type: "error", message: message });
}

function rejectJoin(socket, message) {
  send(socket, { type: "joinRejected", message: message });
}

function soloElapsed(socket) {
  const session = socket.soloSession;
  if (!session) return 0;
  const limit = SOLO_CLIP_DURATION;
  if (session.phase === "playing") {
    return numberInRange(session.offset + now() - session.startedAt, 0, 0, limit);
  }
  return numberInRange(session.offset, 0, 0, limit);
}

function visibleSoloTrack(session) {
  if (!session || !session.track) return null;
  const track = session.track;
  const revealed = Boolean(session.revealed || session.answered);
  return {
    id: track.id,
    anime: revealed ? track.anime : "Anime ukryte",
    opening: revealed ? track.opening : "",
    coverUrl: revealed ? (track.coverUrl || "") : "",
    description: revealed ? (track.description || "") : "",
    title: revealed ? track.anime : "Anime ukryte",
    artist: revealed ? track.opening : "",
    difficulty: "",
    audioUrl: track.audioUrl,
    fallbackAudioUrl: track.fallbackAudioUrl || "",
    source: track.source || "audio",
    videoId: track.videoId || "",
    qualityStatus: track.qualityStatus || "ok",
    qualityLabel: qualityLabel(track.qualityStatus),
    durationText: track.durationText || "",
    durationSeconds: numberInRange(track.durationSeconds, 0, 0, 86400),
    startAtFirst: numericTrackTime(track.startAtFirst, 0),
    startAtSecond: soloTrackSecondStart(track),
    startAt: numericTrackTime(track.startAtFirst, 0),
    animeHintSteps: revealed ? [] : soloAnimeHintSteps(track.anime),
    animeHintStartAt: Math.max(0, SOLO_CLIP_DURATION - 3),
    revealed: revealed,
    result: null
  };
}

function publicSoloState(socket) {
  const session = socket.soloSession;
  const trackKey = session && session.track ? soloTrackKey(session.track) : "";
  const soloProfile = publicSoloProfile(socket);
  const dailySolo = publicDailySoloForSocket(socket);
  const dailyLeaderboard = dailySolo.leaderboard;
  const dailySummary = Object.assign({}, dailySolo);
  delete dailySummary.leaderboard;
  const scope = "solo:" + rawText(socket.clientId || socket.id, 100);
  const roomState = {
    code: "SOLO",
    phase: session ? session.phase : "idle",
    startedAt: session ? session.startedAt : 0,
    offset: soloElapsed(socket),
    countdownLeft: session && session.phase === "countdown"
      ? Math.max(0, Number(session.countdownEndsAt || 0) - now())
      : 0,
    revealed: Boolean(session && (session.revealed || session.answered)),
    roundClosed: Boolean(session && session.answered),
    currentTrackId: trackKey,
    mediaToken: session ? trackKey + "|" + String(session.loadingStartedAt || session.startedAt || 0) : "",
    solo: {
      answered: Boolean(session && session.answered),
      guessed: session && session.answered ? Boolean(session.guessed) : null,
      answerText: session && session.answered ? rawText(session.answerText, 180) : "",
      streak: soloProfile ? soloProfile.streak : Math.max(0, Number(socket.soloStreak || 0)),
      bestStreak: soloProfile ? soloProfile.bestStreak : Math.max(0, Number(socket.soloStreak || 0)),
      todayAttempts: soloProfile ? soloProfile.todayAttempts : 0,
      todayGuessed: soloProfile ? soloProfile.todayGuessed : 0,
      mediaError: Boolean(session && session.mediaError),
      mediaErrorReason: session && session.mediaError ? rawText(session.mediaErrorReason, 160) : "",
      mediaReady: Boolean(session && session.mediaReady)
    }
  };

  addChangedStateField(roomState, socket, scope, "lockedGroups", []);
  addChangedStateField(roomState, socket, scope, "tracks", []);
  addChangedStateField(roomState, socket, scope, "libraryTracks", []);
  addChangedStateField(roomState, socket, scope, "currentTrack", visibleSoloTrack(session));
  addChangedStateField(roomState, socket, scope, "currentBuzzer", null);
  addChangedStateField(roomState, socket, scope, "teams", {});
  addChangedStateField(roomState, socket, scope, "groups", []);
  addChangedStateField(roomState, socket, scope, "settings", {
    clipDuration: SOLO_CLIP_DURATION,
    segmentSplit: SOLO_SEGMENT_SPLIT,
    difficultyScores: cloneScores(DEFAULT_DIFFICULTY_SCORES)
  });
  addChangedStateField(roomState, socket, scope, "difficulties", DIFFICULTIES);
  addChangedStateField(roomState, socket, scope, "qualityStatuses", QUALITY_STATUSES);
  addChangedStateField(roomState, socket, scope, "people", []);
  addChangedStateField(roomState, socket, scope, "blockedIps", []);
  addChangedStateField(roomState, socket, scope, "soloDaily", dailySummary);
  addChangedStateField(roomState, socket, scope, "soloProfile", soloProfile);
  addChangedStateField(roomState, socket, scope, "soloLeaderboard", publicSoloLeaderboard());
  addChangedStateField(roomState, socket, scope, "dailySoloLeaderboard", dailyLeaderboard);
  addChangedStateField(roomState, socket, scope, "soloStats", []);
  addChangedStateField(roomState, socket, scope, "soloTitleOptions", publicSoloTitleOptions());

  return {
    type: "soloState",
    room: roomState
  };
}

function sendSoloState(socket) {
  send(socket, publicSoloState(socket));
}

function startSoloRound(socket, autoplay) {
  const tracks = allSoloTracks();
  if (!tracks.length) {
    sendError(socket, "Brak openingow do trybu solo.");
    return;
  }

  const isDaily = socket.soloMode === "daily";
  const track = isDaily ? nextDailySoloTrack(socket, tracks) : nextRandomSoloTrack(socket, tracks);

  if (!track) {
    socket.soloSession = {
      track: null,
      phase: "ended",
      startedAt: 0,
      loadingStartedAt: 0,
      countdownEndsAt: 0,
      offset: 0,
      answered: true,
      guessed: null,
      revealed: true,
      mediaReady: false,
      mediaError: false,
      mediaErrorReason: "",
      daily: isDaily,
      completed: true
    };
    sendSoloState(socket);
    return;
  }

  socket.soloSession = {
    track: track,
    phase: autoplay ? "countdown" : "idle",
    startedAt: 0,
    loadingStartedAt: autoplay ? now() : 0,
    countdownEndsAt: autoplay ? now() + SOLO_PREROLL_DURATION : 0,
    offset: 0,
    answered: false,
    guessed: null,
    revealed: false,
    mediaReady: false,
    mediaError: false,
    mediaErrorReason: "",
    daily: isDaily
  };
  soloStatForTrack(track);
  sendSoloState(socket);
}

function failSoloMedia(socket, reason) {
  const session = socket.soloSession;
  if (!session || !session.track || session.answered) return false;

  const cleanReason = rawText(reason, 160) || "Opening nie zaladowal sie.";
  if (session.track.source === "youtube" && session.track.fallbackAudioUrl && !session.usingFallback) {
    session.track = Object.assign({}, session.track, {
      audioUrl: session.track.fallbackAudioUrl,
      source: "audio",
      usingFallback: true
    });
    session.phase = "countdown";
    session.startedAt = 0;
    session.loadingStartedAt = now();
    session.countdownEndsAt = now() + SOLO_PREROLL_DURATION;
    session.offset = 0;
    session.mediaReady = false;
    session.mediaError = false;
    session.mediaErrorReason = "";
    session.usingFallback = true;
    sendSoloState(socket);
    return "fallback";
  }

  const key = soloTrackKey(session.track);
  if (!socket.soloLoadFailures) socket.soloLoadFailures = {};
  if (key) socket.soloLoadFailures[key] = true;
  if (session.daily && key) {
    const dailyPlayer = dailyPlayerEntry(socket, dayKey(now()));
    dailyPlayer.skippedKeys[key] = {
      at: now(),
      reason: cleanReason
    };
    dailyPlayer.updatedAt = now();
    savePersistedRooms();
  }
  const permanentError = /youtube|kod|blokuje|nie ma poprawnego id|krotszy niz ustawiony start/i.test(cleanReason);
  if (permanentError) markSoloTrackLoadError(session.track, cleanReason);

  session.phase = "idle";
  session.startedAt = 0;
  session.loadingStartedAt = 0;
  session.countdownEndsAt = 0;
  session.offset = 0;
  session.revealed = false;
  session.mediaReady = false;
  session.mediaError = true;
  session.mediaErrorReason = cleanReason;

  sendSoloState(socket);
  broadcastModeratorStats();
  return true;
}

function startSoloPlayback(socket) {
  const session = socket.soloSession;
  if (!session || !session.track || session.answered) return false;
  if (session.phase !== "loading" && session.phase !== "countdown" && session.phase !== "idle") return false;

  session.phase = "playing";
  session.startedAt = now();
  session.loadingStartedAt = 0;
  session.countdownEndsAt = 0;
  session.offset = 0;
  session.revealed = false;
  session.mediaReady = true;
  session.mediaError = false;
  session.mediaErrorReason = "";

  const key = soloTrackKey(session.track);
  if (socket.soloLoadFailures && key) delete socket.soloLoadFailures[key];
  clearSoloTrackLoadError(session.track);
  sendSoloState(socket);
  return true;
}

function markSoloMediaReady(socket) {
  const session = socket.soloSession;
  if (!session || !session.track || session.answered) return false;
  if (session.phase !== "loading" && session.phase !== "countdown") return false;

  session.mediaReady = true;
  session.mediaError = false;
  session.mediaErrorReason = "";
  if (!session.countdownEndsAt) session.countdownEndsAt = now() + SOLO_PREROLL_DURATION;
  if (now() >= session.countdownEndsAt) return startSoloPlayback(socket);
  sendSoloState(socket);
  return true;
}

function recordSoloAnswer(socket, guessed, answerText) {
  const session = socket.soloSession;
  if (!session || !session.track || session.answered) return;

  session.offset = soloElapsed(socket);
  session.phase = session.phase === "ended" ? "ended" : "paused";
  session.answered = true;
  session.guessed = Boolean(guessed);
  session.answerText = rawText(answerText, 180);
  session.revealed = true;
  socket.soloStreak = session.guessed ? Math.max(0, Number(socket.soloStreak || 0)) + 1 : 0;
  if (socket.clientId) soloStreaks.set(socket.clientId, socket.soloStreak);

  const stat = soloStatForTrack(session.track);
  stat.attempts = Math.max(0, Number(stat.attempts || 0)) + 1;
  if (guessed) stat.guessed = Math.max(0, Number(stat.guessed || 0)) + 1;
  else stat.guessed = Math.max(0, Number(stat.guessed || 0));
  stat.updatedAt = now();

  const player = soloPlayerEntry(socket);
  player.attempts = Math.max(0, Number(player.attempts || 0)) + 1;
  player.todayAttempts = Math.max(0, Number(player.todayAttempts || 0)) + 1;
  if (session.guessed) {
    player.guessed = Math.max(0, Number(player.guessed || 0)) + 1;
    player.todayGuessed = Math.max(0, Number(player.todayGuessed || 0)) + 1;
  }
  player.streak = Math.max(0, Number(socket.soloStreak || 0));
  player.bestStreak = Math.max(Math.max(0, Number(player.bestStreak || 0)), player.streak);
  player.todayStreak = session.guessed ? Math.max(0, Number(player.todayStreak || 0)) + 1 : 0;
  player.todayBestStreak = Math.max(Math.max(0, Number(player.todayBestStreak || 0)), player.todayStreak);
  player.updatedAt = now();
  player.history.push({
    at: now(),
    trackKey: soloTrackKey(session.track),
    anime: combinedAnimeTitle(session.track.englishTitle, session.track.romajiTitle, session.track.anime),
    opening: rawText(session.track.opening, 120),
    answerText: rawText(answerText, 180),
    guessed: session.guessed,
    streakAfter: player.streak
  });
  if (player.history.length > 80) player.history.splice(0, player.history.length - 80);

  if (session.daily) {
    const day = dayKey(now());
    const dailyPlayer = dailyPlayerEntry(socket, day);
    const dailyTrackKey = soloTrackKey(session.track);
    const alreadyAnswered = dailyPlayer.history.some(function (item) {
      return item && item.trackKey === dailyTrackKey;
    });
    if (!alreadyAnswered) {
      dailyPlayer.attempts = Math.max(0, Number(dailyPlayer.attempts || 0)) + 1;
      if (session.guessed) dailyPlayer.guessed = Math.max(0, Number(dailyPlayer.guessed || 0)) + 1;
      dailyPlayer.streak = session.guessed ? Math.max(0, Number(dailyPlayer.streak || 0)) + 1 : 0;
      dailyPlayer.bestStreak = Math.max(Math.max(0, Number(dailyPlayer.bestStreak || 0)), dailyPlayer.streak);
      dailyPlayer.history.push({
        at: now(),
        trackKey: dailyTrackKey,
        anime: combinedAnimeTitle(session.track.englishTitle, session.track.romajiTitle, session.track.anime),
        opening: rawText(session.track.opening, 120),
        answerText: rawText(answerText, 180),
        guessed: session.guessed
      });
      const totalDailyTracks = dailySoloTracks(socket, allSoloTracks()).length;
      const skippedCount = Object.keys(dailyPlayer.skippedKeys || {}).length;
      dailyPlayer.completed = totalDailyTracks > 0 && dailyPlayer.history.length + skippedCount >= totalDailyTracks;
      dailyPlayer.updatedAt = now();
    }
  }

  savePersistedRooms();
  sendSoloState(socket);
  broadcastModeratorStats();
}

function recordSoloReport(socket, payload) {
  const session = socket.soloSession;
  if (!session || !session.track) return "Nie ma openingu do zgloszenia.";

  const message = rawText(payload.message, 700);
  if (!message) return "Wpisz opis bledu.";

  const track = session.track;
  const reports = soloReportsStore();
  const stat = soloStatForTrack(track);
  if (stat.qualityStatus === "ok" || !stat.qualityStatus) stat.qualityStatus = "reported";
  stat.reportedAt = now();
  reports.push({
    id: id("report_"),
    at: now(),
    nickname: cleanText(socket.nickname, "Solo", 60),
    clientId: rawText(socket.clientId, 80),
    message: message,
    trackKey: soloTrackKey(track),
    trackId: rawText(track.id, 80),
    anime: combinedAnimeTitle(track.englishTitle, track.romajiTitle, track.anime),
    opening: rawText(track.opening, 120),
    aliases: cleanAliases(track.aliases),
    englishTitle: cleanAnimeTitlePart(track.englishTitle),
    romajiTitle: cleanAnimeTitlePart(track.romajiTitle),
    difficulty: difficultyExists(track.difficulty) ? track.difficulty : "medium",
    qualityStatus: normalizeQualityStatus(track.qualityStatus, "ok"),
    fallbackAudioUrl: cleanAudioUrl(track.fallbackAudioUrl, ""),
    coverUrl: rawText(track.coverUrl, 700),
    description: rawText(track.description, 420),
    audioUrl: rawText(track.audioUrl, 700),
    videoId: rawText(track.videoId, 40),
    sourceTitle: rawText(track.sourceTitle, 180),
    durationText: rawText(track.durationText, 20),
    durationSeconds: numberInRange(track.durationSeconds, 0, 0, 86400),
    startAtFirst: numericTrackTime(track.startAtFirst, 0),
    startAtSecond: numericTrackTime(track.startAtSecond, numericTrackTime(track.startAtFirst, 0) + 5)
  });
  if (reports.length > 300) reports.splice(0, reports.length - 300);

  savePersistedRooms();
  send(socket, { type: "soloReportSaved", message: "Zgloszenie zapisane." });
  broadcastModeratorStats();
  return "";
}

function handleSoloJoin(socket, payload) {
  const previous = socket.roomCode ? getRoom(socket.roomCode) : null;
  socket.role = "solo";
  socket.clientId = rawText(payload.clientId, 80) || socket.id;
  socket.nickname = cleanText(payload.nickname, "Solo", 60);
  socket.avatar = cleanAvatar(payload.avatar);
  const soloPlayer = soloPlayerEntry(socket);
  socket.soloStreak = Math.max(0, Number(soloPlayer.streak || soloStreaks.get(socket.clientId) || socket.soloStreak || 0));
  socket.soloLoadFailures = {};
  socket.soloQueue = [];
  socket.soloMode = "random";
  socket.team = "Solo";
  socket.playMode = "solo";
  socket.joined = true;
  socket.roomCode = null;

  send(socket, { type: "soloJoined", id: socket.id, roomCode: "SOLO", role: "solo", playMode: "solo" });
  if (previous) broadcast(previous);
  startSoloRound(socket, false);
}

function handleSoloAction(socket, payload) {
  if (socket.role !== "solo") return sendError(socket, "Tryb solo nie jest wlaczony.");
  const action = payload.action;

  if (action === "daily") {
    socket.soloMode = "daily";
    socket.soloQueue = [];
    return startSoloRound(socket, Boolean(payload.autoplay));
  }

  if (action === "random") {
    socket.soloMode = "random";
    socket.soloQueue = [];
    return startSoloRound(socket, Boolean(payload.autoplay));
  }

  if (action === "start") {
    if (!socket.soloSession) startSoloRound(socket, false);
    const session = socket.soloSession;
    if (session && session.mediaError) return startSoloRound(socket, true);
    if (session && !session.answered && session.phase !== "playing" && session.phase !== "loading" && session.phase !== "countdown") {
      session.phase = "countdown";
      session.startedAt = 0;
      session.loadingStartedAt = now();
      session.countdownEndsAt = now() + SOLO_PREROLL_DURATION;
      session.offset = 0;
      session.revealed = false;
      session.mediaReady = false;
      session.mediaError = false;
      session.mediaErrorReason = "";
    }
    return sendSoloState(socket);
  }

  if (action === "mediaReady") {
    const session = socket.soloSession;
    const key = rawText(payload.key, 240);
    if (!session || !session.track || session.answered || key !== soloTrackKey(session.track)) return;
    return markSoloMediaReady(socket);
  }

  if (action === "mediaError") {
    const session = socket.soloSession;
    const key = rawText(payload.key, 240);
    if (!session || !session.track || session.answered || key !== soloTrackKey(session.track)) return;
    const failed = failSoloMedia(socket, payload.reason);
    if (failed === "fallback") return;
    if (failed) return startSoloRound(socket, true);
    return;
  }

  if (action === "answer") {
    return recordSoloAnswer(socket, Boolean(payload.guessed), payload.answer || "");
  }

  if (action === "answerText") {
    const session = socket.soloSession;
    const answerText = rawText(payload.answer, 180);
    if (!answerText) return sendError(socket, "Wybierz anime z listy.");
    return recordSoloAnswer(socket, soloAnswerMatches(session && session.track, answerText), answerText);
  }

  if (action === "report") {
    const error = recordSoloReport(socket, payload || {});
    if (error) return sendError(socket, error);
    return;
  }

  if (action === "next") {
    return startSoloRound(socket, Boolean(payload.autoplay));
  }
}

function validateGroupJoin(room, socket, payload) {
  const playMode = payload.playMode === "solo" ? "solo" : "group";
  const owner = rawText(payload.clientId, 80) || socket.id;
  if (playMode === "solo") {
    const baseName = cleanText(payload.nickname, "Gracz", 28);
    let soloGroupName = baseName;
    const existing = room.groups[soloGroupName];
    if (existing && existing.soloOwner && existing.soloOwner !== owner) {
      soloGroupName = cleanText(baseName + " " + owner.slice(-4), baseName, 32);
    }
    if (!room.groups[soloGroupName]) {
      room.groups[soloGroupName] = { score: 0, password: "", solo: true, soloOwner: owner };
    }
    socket.team = soloGroupName;
    socket.playMode = "solo";
    return "";
  }

  const groupName = cleanText(payload.team, "", 32);
  const groupPassword = rawText(payload.groupPassword, 80);

  if (!groupName) return "Wpisz nazwę grupy.";
  if (!groupPassword) return "Wpisz hasło grupy.";

  if (!room.groups[groupName]) {
    room.groups[groupName] = { score: 0, password: groupPassword };
  } else if (!room.groups[groupName].password) {
    room.groups[groupName].password = groupPassword;
  } else if (room.groups[groupName].password !== groupPassword) {
    return "Nieprawidłowe hasło grupy.";
  }

  socket.team = groupName;
  socket.playMode = "group";
  return "";
}

function joinRoom(socket, payload) {
  const room = getRoom(payload.roomCode);
  const previous = socket.roomCode ? getRoom(socket.roomCode) : null;
  const requestedRole = payload.role === "moderator" ? "moderator" : "player";

  if (requestedRole === "moderator" && rawText(payload.moderatorPassword, 120) !== MODERATOR_PASSWORD) {
    return rejectJoin(socket, "Nieprawidłowe hasło moderatora.");
  }

  if (requestedRole === "player" && isIpBlocked(room, socket.ip)) {
    return rejectJoin(socket, "Nie mozesz dolaczyc do tego pokoju.");
  }

  socket.role = requestedRole;
  socket.clientId = rawText(payload.clientId, 80) || socket.id;
  socket.nickname = cleanText(payload.nickname, socket.role === "moderator" ? "Administrator" : "Gracz");
  socket.avatar = cleanAvatar(payload.avatar);

  if (socket.role === "player") {
    const groupError = validateGroupJoin(room, socket, payload);
    if (groupError) return rejectJoin(socket, groupError);
    socket.personalScore = Number(room.playerScores[socket.clientId] || 0);
  } else {
    socket.team = "Administrator";
    socket.playMode = "group";
  }

  socket.joined = true;
  socket.roomCode = room.code;

  send(socket, { type: "joined", id: socket.id, roomCode: room.code, role: socket.role, team: socket.team, playMode: socket.playMode || "group" });
  if (previous && previous.code !== room.code) broadcast(previous);
  touch(room);
  broadcast(room);
}

function requireModerator(socket) {
  if (socket.role !== "moderator") {
    sendError(socket, "Tylko administrator może wykonać tę akcję.");
    return false;
  }
  return true;
}

function handleBuzz(socket) {
  if (!socket.roomCode) return;
  const room = getRoom(socket.roomCode);
  if (isRoundClosed(room)) return sendError(socket, "Ten opening jest juz zamkniety.");
  if (socket.role !== "player" || room.phase !== "playing" || room.currentBuzzer) return;
  if (room.lockedGroups[socket.team]) return sendError(socket, "Twoja grupa już próbowała w tej rundzie.");

  const answerStartedAt = now();
  const buzzedAt = elapsed(room);
  const points = scoreFor(room, buzzedAt);
  room.offset = buzzedAt;
  room.phase = "paused";
  room.currentBuzzer = {
    id: socket.id,
    nickname: socket.nickname,
    team: socket.team,
    buzzedAt: buzzedAt,
    suggestedPoints: points,
    label: scoringLabel(room, points, buzzedAt),
    answerStartedAt: answerStartedAt,
    answerDeadline: answerStartedAt + ANSWER_TIME_LIMIT,
    answerLimit: ANSWER_TIME_LIMIT
  };

  touch(room);
  broadcast(room);
}

function addTrack(room, payload) {
  const normalized = normalizeTrack(payload || {}, null);
  if (normalized.error) return normalized.error;

  room.tracks.push(normalized.track);
  if (!room.currentTrackId) room.currentTrackId = normalized.track.id;
  return null;
}

function addLibraryTrack(room, payload) {
  const normalized = normalizeTrack(payload || {}, null);
  if (normalized.error) return normalized.error;

  normalized.track.id = id("library_");
  room.libraryTracks.push(normalized.track);
  return null;
}

function libraryTrack(room, trackId) {
  const cleanId = cleanText(trackId, "", 80);
  return room.libraryTracks.find(function (track) {
    return track.id === cleanId;
  }) || null;
}

function addLibraryToMain(room, payload) {
  const source = libraryTrack(room, payload.trackId);
  if (!source) return "Nie znaleziono openingu w bibliotece.";

  const track = cloneTrackForMain(source);
  if (!track) return "Nie udalo sie przerzucic openingu.";
  room.tracks.push(track);
  if (!room.currentTrackId) room.currentTrackId = track.id;
  return null;
}

function removeLibraryTrack(room, payload) {
  const trackId = cleanText(payload.trackId, "", 80);
  const before = room.libraryTracks.length;
  room.libraryTracks = room.libraryTracks.filter(function (track) {
    return track.id !== trackId;
  });
  return before === room.libraryTracks.length ? "Nie znaleziono openingu w bibliotece." : null;
}

function updateLibraryTrackDifficulty(room, payload) {
  const track = libraryTrack(room, payload.trackId);
  if (!track) return "Nie znaleziono openingu w bibliotece.";
  if (!difficultyExists(payload.difficulty)) return "Niepoprawny poziom trudnosci.";
  track.difficulty = payload.difficulty;
  return null;
}

function updateLibraryTrack(room, payload) {
  const trackId = cleanText(payload.trackId, "", 80);
  const index = room.libraryTracks.findIndex(function (track) {
    return track.id === trackId;
  });
  if (index < 0) return "Nie znaleziono openingu w bibliotece do edycji.";

  const normalized = normalizeTrack(payload.track || {}, room.libraryTracks[index]);
  if (normalized.error) return normalized.error;

  room.libraryTracks[index] = normalized.track;
  return null;
}

function updateTrackListDifficultyByKey(list, statKey, difficulty) {
  let changed = 0;
  (list || []).forEach(function (track) {
    if (!track || soloTrackKey(track) !== statKey) return;
    track.difficulty = difficulty;
    changed += 1;
  });
  return changed;
}

function updateSoloStatDifficulty(payload) {
  const statKey = rawText(payload.key, 120);
  const difficulty = rawText(payload.difficulty, 40);
  if (!statKey) return "Nie znaleziono openingu.";
  if (!difficultyExists(difficulty)) return "Niepoprawny poziom trudnosci.";

  let changed = 0;
  rooms.forEach(function (room) {
    const roomChanged = updateTrackListDifficultyByKey(room.tracks, statKey, difficulty)
      + updateTrackListDifficultyByKey(room.libraryTracks, statKey, difficulty);
    if (!roomChanged) return;
    changed += roomChanged;
    touch(room);
    saveRoomConfig(room);
  });

  Object.keys(persistedRoomConfigs).forEach(function (code) {
    if (isMetaConfigKey(code) || rooms.has(code)) return;
    const config = persistedRoomConfigs[code];
    if (!config || typeof config !== "object") return;
    const configChanged = updateTrackListDifficultyByKey(config.tracks, statKey, difficulty)
      + updateTrackListDifficultyByKey(config.libraryTracks, statKey, difficulty);
    if (!configChanged) return;
    changed += configChanged;
    config.updatedAt = now();
  });

  const store = soloStatsStore();
  if (store[statKey]) {
    store[statKey].difficulty = difficulty;
    changed += 1;
  }

  if (!changed) return "Nie znaleziono openingu do zmiany poziomu.";
  savePersistedRooms();
  rooms.forEach(function (room) {
    broadcast(room);
  });
  broadcastModeratorStats();
  return null;
}

function updateSoloStatQuality(payload) {
  const statKey = rawText(payload.key, 140);
  const status = normalizeQualityStatus(payload.qualityStatus || payload.status, "ok");
  if (!statKey) return "Nie znaleziono openingu.";

  const store = soloStatsStore();
  if (!store[statKey]) store[statKey] = { attempts: 0, guessed: 0 };
  store[statKey].qualityStatus = status;
  store[statKey].disabled = Boolean(payload.disabled) || status === "needs_fix";
  if (status === "verified" || status === "ok") {
    delete store[statKey].mediaError;
    delete store[statKey].mediaErrorReason;
    delete store[statKey].mediaErrorAt;
    store[statKey].disabled = Boolean(payload.disabled);
  }
  if (status === "verified") store[statKey].verifiedAt = now();
  store[statKey].qualityUpdatedAt = now();
  savePersistedRooms();
  broadcastModeratorStats();
  return null;
}

function clearSoloStatMediaError(payload) {
  const statKey = rawText(payload.key, 140);
  const store = soloStatsStore();
  if (!statKey || !store[statKey]) return "Nie znaleziono openingu.";
  delete store[statKey].mediaError;
  delete store[statKey].mediaErrorReason;
  delete store[statKey].mediaErrorAt;
  store[statKey].loadFailures = 0;
  if (store[statKey].qualityStatus === "needs_fix") store[statKey].qualityStatus = "ok";
  store[statKey].disabled = false;
  savePersistedRooms();
  broadcastModeratorStats();
  return null;
}

function removeSoloReport(payload) {
  const reportId = rawText(payload.reportId || payload.id, 80);
  if (!reportId) return "Nie znaleziono zgloszenia.";

  const reports = soloReportsStore();
  const before = reports.length;
  const kept = reports.filter(function (report) {
    return rawText(report.id, 80) !== reportId;
  });
  if (kept.length === before) return "Nie znaleziono zgloszenia.";

  persistedRoomConfigs.__soloReports = kept;
  savePersistedRooms();
  broadcastModeratorStats();
  return "";
}

function mergeSoloStatEntry(fromKey, toKey, track) {
  if (!fromKey || !toKey || fromKey === toKey) return;
  const store = soloStatsStore();
  if (!store[fromKey]) return;
  if (!store[toKey]) {
    store[toKey] = store[fromKey];
  } else {
    store[toKey].attempts = Math.max(0, Number(store[toKey].attempts || 0)) + Math.max(0, Number(store[fromKey].attempts || 0));
    store[toKey].guessed = Math.max(0, Number(store[toKey].guessed || 0)) + Math.max(0, Number(store[fromKey].guessed || 0));
    store[toKey].soloAttempts = Math.max(0, Number(store[toKey].soloAttempts || 0)) + Math.max(0, Number(store[fromKey].soloAttempts || 0));
    store[toKey].gameAttempts = Math.max(0, Number(store[toKey].gameAttempts || 0)) + Math.max(0, Number(store[fromKey].gameAttempts || 0));
  }
  updateSoloStatMeta(track, store[toKey]);
  delete store[fromKey];
}

function updateReportMetaForTrack(oldKey, track) {
  const newKey = soloTrackKey(track);
  const stats = soloStatsStore();
  if (stats[newKey]) updateSoloStatMeta(track, stats[newKey]);
  soloReportsStore().forEach(function (report) {
    if (rawText(report.trackKey, 140) !== oldKey && rawText(report.trackId, 80) !== rawText(track.id, 80)) return;
    report.trackKey = newKey;
    report.trackId = rawText(track.id, 80);
    report.anime = combinedAnimeTitle(track.englishTitle, track.romajiTitle, track.anime);
    report.opening = rawText(track.opening, 120);
    report.aliases = cleanAliases(track.aliases);
    report.englishTitle = cleanAnimeTitlePart(track.englishTitle);
    report.romajiTitle = cleanAnimeTitlePart(track.romajiTitle);
    report.difficulty = difficultyExists(track.difficulty) ? track.difficulty : "medium";
    report.qualityStatus = normalizeQualityStatus(track.qualityStatus, report.qualityStatus || "reported");
    report.fallbackAudioUrl = cleanAudioUrl(track.fallbackAudioUrl, "");
    report.coverUrl = rawText(track.coverUrl, 700);
    report.description = rawText(track.description, 420);
    report.audioUrl = rawText(track.audioUrl, 700);
    report.videoId = rawText(track.videoId, 40);
    report.sourceTitle = rawText(track.sourceTitle, 180);
    report.durationText = rawText(track.durationText, 20);
    report.durationSeconds = numberInRange(track.durationSeconds, 0, 0, 86400);
    report.startAtFirst = numericTrackTime(track.startAtFirst, 0);
    report.startAtSecond = numericTrackTime(track.startAtSecond, numericTrackTime(track.startAtFirst, 0) + 5);
  });
  mergeSoloStatEntry(oldKey, newKey, track);
}

function updateTrackListByReportKey(list, statKey, payload) {
  let changed = 0;
  let sampleTrack = null;
  const trackId = rawText(payload.trackId, 80);
  (list || []).forEach(function (track, index) {
    if (!track) return;
    const matchesKey = statKey && soloTrackKey(track) === statKey;
    const matchesId = trackId && rawText(track.id, 80) === trackId;
    if (!matchesKey && !matchesId) return;
    const oldKey = soloTrackKey(track);
    const normalized = normalizeTrack(payload.track || {}, track);
    if (normalized.error) throw new Error(normalized.error);
    list[index] = normalized.track;
    updateReportMetaForTrack(oldKey, normalized.track);
    sampleTrack = normalized.track;
    changed += 1;
  });
  return { changed: changed, sampleTrack: sampleTrack };
}

function updateReportedTrack(payload) {
  const statKey = rawText(payload.trackKey || payload.key, 140);
  if (!statKey && !rawText(payload.trackId, 80)) return "Nie znaleziono zgloszonego openingu.";

  let changed = 0;
  let sampleTrack = null;

  try {
    rooms.forEach(function (room) {
      const tracksResult = updateTrackListByReportKey(room.tracks, statKey, payload);
      const libraryResult = updateTrackListByReportKey(room.libraryTracks, statKey, payload);
      const roomChanged = tracksResult.changed + libraryResult.changed;
      if (!roomChanged) return;
      changed += roomChanged;
      sampleTrack = tracksResult.sampleTrack || libraryResult.sampleTrack || sampleTrack;
      touch(room);
      saveRoomConfig(room);
      broadcast(room);
    });

    Object.keys(persistedRoomConfigs).forEach(function (code) {
      if (isMetaConfigKey(code) || rooms.has(code)) return;
      const config = persistedRoomConfigs[code];
      if (!config || typeof config !== "object") return;
      const tracksResult = updateTrackListByReportKey(config.tracks, statKey, payload);
      const libraryResult = updateTrackListByReportKey(config.libraryTracks, statKey, payload);
      const configChanged = tracksResult.changed + libraryResult.changed;
      if (!configChanged) return;
      changed += configChanged;
      sampleTrack = tracksResult.sampleTrack || libraryResult.sampleTrack || sampleTrack;
      config.updatedAt = now();
    });
  } catch (error) {
    return error.message || "Nie udalo sie zapisac openingu.";
  }

  if (!changed) return "Nie znaleziono zgloszonego openingu w bibliotece.";
  if (sampleTrack) updateReportMetaForTrack(statKey, sampleTrack);
  savePersistedRooms();
  broadcastModeratorStats();
  return "";
}

function updateTrack(room, payload) {
  const trackId = cleanText(payload.trackId, "", 80);
  const index = room.tracks.findIndex(function (track) {
    return track.id === trackId;
  });
  if (index < 0) return "Nie znaleziono openingu do edycji.";

  const normalized = normalizeTrack(payload.track || {}, room.tracks[index]);
  if (normalized.error) return normalized.error;

  room.tracks[index] = normalized.track;
  if (room.currentTrackId === trackId) resetPlayback(room);
  return null;
}

function resetPlayback(room) {
  room.phase = "idle";
  room.startedAt = 0;
  room.offset = 0;
  room.revealed = false;
  room.lockedGroups = {};
  room.currentBuzzer = null;
}

function markCurrentTrackMissed(room) {
  const track = currentTrack(room);
  if (!track || track.result) return false;
  track.result = {
    status: "missed",
    at: now()
  };
  return true;
}

function markCurrentTrackGuessed(room, buzzer, points) {
  const track = currentTrack(room);
  if (!track || !buzzer) return false;
  track.result = {
    status: "guessed",
    nickname: buzzer.nickname,
    team: buzzer.team,
    points: points,
    buzzedAt: buzzer.buzzedAt,
    at: now()
  };
  return true;
}

function clearTrackResult(room, payload) {
  const trackId = cleanText(payload.trackId, "", 80);
  const track = room.tracks.find(function (entry) {
    return entry.id === trackId;
  });
  if (!track) return "Nie znaleziono openingu.";

  track.result = null;
  if (room.currentTrackId === trackId) {
    room.revealed = false;
  }

  return "";
}

function normalizeDifficultySettings(scores) {
  const result = cloneScores(DEFAULT_DIFFICULTY_SCORES);
  DIFFICULTIES.forEach(function (difficulty) {
    const incoming = scores && scores[difficulty.key] ? scores[difficulty.key] : result[difficulty.key];
    result[difficulty.key] = {
      first: numberInRange(incoming.first, result[difficulty.key].first, 0, 99),
      second: numberInRange(incoming.second, result[difficulty.key].second, 0, 99)
    };
  });
  return result;
}

function findSocket(playerId) {
  return sockets.get(playerId) || null;
}

function awardPlayer(room, playerId, groupName, points) {
  const cleanGroup = cleanText(groupName, "", 32);
  const cleanPoints = numberInRange(points, 0, -99, 99);

  if (cleanGroup) {
    if (!room.groups[cleanGroup]) room.groups[cleanGroup] = { score: 0, password: "" };
    room.groups[cleanGroup].score += cleanPoints;
  }

  const target = playerId ? findSocket(cleanText(playerId, "", 80)) : null;
  if (target && target.roomCode === room.code && target.role === "player") {
    target.personalScore = Math.max(0, Number(target.personalScore || 0) + cleanPoints);
    if (target.clientId) room.playerScores[target.clientId] = target.personalScore;
  }
}

function awardCurrentBuzzer(room) {
  if (!room.currentBuzzer) return false;
  const points = scoreFor(room, room.currentBuzzer.buzzedAt);
  awardPlayer(room, room.currentBuzzer.id, room.currentBuzzer.team, points);
  markCurrentTrackGuessed(room, room.currentBuzzer, points);
  room.currentBuzzer.suggestedPoints = points;
  return true;
}

function awardCurrentBuzzerCustom(room, points) {
  if (!room.currentBuzzer) return false;
  const cleanPoints = numberInRange(points, 0, -99, 99);
  awardPlayer(room, room.currentBuzzer.id, room.currentBuzzer.team, cleanPoints);
  markCurrentTrackGuessed(room, room.currentBuzzer, cleanPoints);
  room.currentBuzzer.suggestedPoints = cleanPoints;
  return true;
}

function blockPlayerIp(room, socket, payload) {
  const playerId = cleanText(payload.playerId, "", 80);
  const target = playerId ? findSocket(playerId) : null;
  const ip = normalizeIp(payload.ip || (target && target.ip));
  if (!ip) return "Nie znaleziono tej osoby do zablokowania.";

  room.blockedIps[ip] = {
    ip: ip,
    nickname: cleanText((target && target.nickname) || payload.nickname, "Gracz", 60),
    team: cleanText((target && target.team) || payload.team, "Druzyna", 32),
    by: cleanText(socket.nickname, "Administrator", 60),
    at: now()
  };

  roomClients(room).forEach(function (client) {
    if (client.role === "player" && normalizeIp(client.ip) === ip) {
      send(client, { type: "kicked", message: "Administrator zablokowal dostep do gry." });
      client.joined = false;
      client.raw.end();
    }
  });

  return "";
}

function unblockPlayerIp(room, payload) {
  const blockId = rawText(payload.blockId || payload.id, 80);
  let ip = normalizeIp(payload.ip);
  if (!ip && blockId) {
    ip = Object.keys(room.blockedIps || {}).find(function (candidate) {
      return blockIdForIp(candidate) === blockId;
    }) || "";
  }
  if (!ip || !room.blockedIps[ip]) return "Nie znaleziono tej blokady.";
  delete room.blockedIps[ip];
  return "";
}

function removeGroup(room, payload) {
  const groupName = cleanText(payload.team, "", 32);
  if (!groupName || !room.groups[groupName]) return "Nie znaleziono tej grupy.";

  delete room.groups[groupName];
  delete room.lockedGroups[groupName];

  if (room.currentBuzzer && room.currentBuzzer.team === groupName) {
    room.currentBuzzer = null;
  }

  roomClients(room).forEach(function (client) {
    if (client.role === "player" && client.team === groupName) {
      if (client.clientId) delete room.playerScores[client.clientId];
      client.personalScore = 0;
      send(client, { type: "kicked", message: "Administrator usunal Twoja grupe z gry." });
      client.joined = false;
      client.raw.end();
    }
  });

  return "";
}

function removeRoom(socket, payload) {
  const targetCode = roomCode(payload.roomCode || payload.code);
  if (!targetCode) return "Nie znaleziono pokoju.";

  const existing = rooms.get(targetCode);
  const deletingCurrent = socket.roomCode === targetCode;

  if (existing) {
    roomClients(existing).forEach(function (client) {
      if (client.id === socket.id) return;
      send(client, { type: "kicked", message: "Administrator usunal ten pokoj." });
      client.joined = false;
      client.raw.end();
    });
    rooms.delete(targetCode);
  }

  delete persistedRoomConfigs[targetCode];
  savePersistedRooms();

  if (deletingCurrent) {
    const fresh = getRoom(fallbackRoomCodeAfterRemoval(targetCode));
    socket.roomCode = fresh.code;
    socket.team = "Administrator";
    socket.playMode = "group";
    socket.joined = true;
    socket.personalScore = 0;
    send(socket, { type: "joined", id: socket.id, roomCode: fresh.code, role: socket.role, team: socket.team, playMode: socket.playMode || "group" });
    broadcast(fresh);
  }

  broadcastModeratorStats();
  return "";
}

async function handleModerator(socket, payload) {
  if (!socket.roomCode || !requireModerator(socket)) return;
  const room = getRoom(socket.roomCode);
  const action = payload.action;

  if (action === "removeRoom") {
    const error = removeRoom(socket, payload || {});
    if (error) return sendError(socket, error);
    return;
  }

  if (action === "addTrack") {
    const error = addTrack(room, payload.track || {});
    if (error) return sendError(socket, error);
  }

  if (action === "searchYouTube") {
    const result = await searchYouTubeTracks(payload || {});
    if (result.error) return sendError(socket, result.error);
    send(socket, { type: "youtubeSearchResults", results: result.results });
    return;
  }

  if (action === "addLibraryTrack") {
    const error = addLibraryTrack(room, payload.track || {});
    if (error) return sendError(socket, error);
  }

  if (action === "addLibraryToMain") {
    const error = addLibraryToMain(room, payload || {});
    if (error) return sendError(socket, error);
  }

  if (action === "removeLibraryTrack") {
    const error = removeLibraryTrack(room, payload || {});
    if (error) return sendError(socket, error);
  }

  if (action === "updateLibraryTrack") {
    const error = updateLibraryTrack(room, payload || {});
    if (error) return sendError(socket, error);
  }

  if (action === "updateLibraryDifficulty") {
    const error = updateLibraryTrackDifficulty(room, payload || {});
    if (error) return sendError(socket, error);
  }

  if (action === "updateSoloStatDifficulty") {
    const error = updateSoloStatDifficulty(payload || {});
    if (error) return sendError(socket, error);
    return;
  }

  if (action === "updateSoloStatQuality") {
    const error = updateSoloStatQuality(payload || {});
    if (error) return sendError(socket, error);
    return;
  }

  if (action === "clearSoloMediaError") {
    const error = clearSoloStatMediaError(payload || {});
    if (error) return sendError(socket, error);
    return;
  }

  if (action === "removeSoloReport") {
    const error = removeSoloReport(payload || {});
    if (error) return sendError(socket, error);
    return;
  }

  if (action === "updateReportedTrack") {
    const error = updateReportedTrack(payload || {});
    if (error) return sendError(socket, error);
    return;
  }

  if (action === "importPlaylist") {
    const result = await importPlaylistTracks(room, payload || {});
    if (result.error) return sendError(socket, result.error);
    send(socket, {
      type: "playlistImported",
      message: "Import gotowy: dodano " + result.added + ", pominieto " + result.skipped + " z " + result.total + "."
    });
  }

  if (action === "updateTrack") {
    const error = updateTrack(room, payload || {});
    if (error) return sendError(socket, error);
  }

  if (action === "removeTrack") {
    const trackId = cleanText(payload.trackId, "", 80);
    room.tracks = room.tracks.filter(function (track) {
      return track.id !== trackId;
    });
    if (room.currentTrackId === trackId) {
      room.currentTrackId = room.tracks[0] ? room.tracks[0].id : null;
      resetPlayback(room);
    }
  }

  if (action === "clearTrackResult") {
    const error = clearTrackResult(room, payload || {});
    if (error) return sendError(socket, error);
  }

  if (action === "selectTrack") {
    const selectedTrackId = cleanText(payload.trackId, "", 80);
    if (room.tracks.some(function (track) { return track.id === selectedTrackId; })) {
      room.currentTrackId = selectedTrackId;
      resetPlayback(room);
    }
  }

  if (action === "play") {
    const track = currentTrack(room);
    if (!track) return sendError(socket, "Najpierw dodaj lub wybierz opening.");
    track.result = null;
    room.phase = "playing";
    room.offset = 0;
    room.startedAt = now();
    room.revealed = false;
    room.lockedGroups = {};
    room.currentBuzzer = null;
  }

  if (action === "pause") {
    if (room.phase === "playing") {
      room.offset = elapsed(room);
      room.phase = "paused";
    }
  }

  if (action === "resume") {
    if (!currentTrack(room)) return sendError(socket, "Najpierw dodaj lub wybierz opening.");
    if (room.phase === "paused" || room.phase === "idle") {
      room.phase = "playing";
      room.offset = numberInRange(room.offset, 0, 0, room.settings.clipDuration);
      room.startedAt = now();
      room.currentBuzzer = null;
    }
  }

  if (action === "stop") resetPlayback(room);

  if (action === "guessed") {
    if (awardCurrentBuzzer(room)) {
      room.currentBuzzer = null;
      if (currentTrack(room)) room.revealed = true;
    }
  }

  if (action === "awardBuzz") {
    if (awardCurrentBuzzerCustom(room, payload.points)) {
      room.currentBuzzer = null;
      if (currentTrack(room)) room.revealed = true;
    }
  }

  if (action === "revealTitle") {
    if (currentTrack(room)) {
      room.revealed = true;
      markCurrentTrackMissed(room);
    }
  }

  if (action === "rejectBuzz") {
    if (room.currentBuzzer) {
      room.lockedGroups[room.currentBuzzer.team] = true;
      room.currentBuzzer = null;
    }
  }

  if (action === "nextTrack" || action === "previousTrack") {
    if (room.tracks.length) {
      const index = Math.max(0, room.tracks.findIndex(function (track) { return track.id === room.currentTrackId; }));
      const shift = action === "nextTrack" ? 1 : -1;
      const nextIndex = (index + shift + room.tracks.length) % room.tracks.length;
      room.currentTrackId = room.tracks[nextIndex].id;
      resetPlayback(room);
    }
  }

  if (action === "kickPlayer") {
    const playerId = cleanText(payload.playerId, "", 80);
    const target = sockets.get(playerId);
    if (target && target.roomCode === room.code && target.role === "player") {
      send(target, { type: "kicked" });
      target.joined = false;
      target.raw.end();
    }
  }

  if (action === "blockIp") {
    const error = blockPlayerIp(room, socket, payload || {});
    if (error) return sendError(socket, error);
  }

  if (action === "unblockIp") {
    const error = unblockPlayerIp(room, payload || {});
    if (error) return sendError(socket, error);
  }

  if (action === "removeGroup") {
    const error = removeGroup(room, payload || {});
    if (error) return sendError(socket, error);
  }

  if (action === "clearBuzz") room.currentBuzzer = null;

  if (action === "award") {
    const groupName = cleanText(payload.team, room.currentBuzzer ? room.currentBuzzer.team : "", 32);
    const points = numberInRange(payload.points, 0, -99, 99);
    awardPlayer(room, payload.playerId, groupName, points);
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

  if (action === "resetRoom") {
    clearRoomConfig(room);
  } else if (["addTrack", "addLibraryTrack", "addLibraryToMain", "removeLibraryTrack", "updateLibraryTrack", "updateLibraryDifficulty", "importPlaylist", "updateTrack", "removeTrack", "selectTrack", "clearTrackResult", "updateSettings", "play", "guessed", "awardBuzz", "revealTitle", "blockIp", "unblockIp"].includes(action)) {
    saveRoomConfig(room);
  }

  touch(room);
  broadcast(room);
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
    return sendError(socket, "Niepoprawna wiadomość.");
  }

  if (payload.type === "join") return joinRoom(socket, payload);
  if (payload.type === "soloJoin") return handleSoloJoin(socket, payload);
  if (payload.type === "buzz") return handleBuzz(socket);
  if (payload.type === "soloAction") return handleSoloAction(socket, payload);
  if (payload.type === "profile") return updateProfile(socket, payload);
  if (payload.type === "moderator") {
    Promise.resolve(handleModerator(socket, payload)).catch(function () {
      sendError(socket, "Nie udalo sie wykonac akcji administratora.");
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
    return "no-cache";
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
      if (socket.role === "moderator" && socket.roomCode) {
        socket.roomCode = roomCode(socket.roomCode);
        send(socket, publicRoom(getRoom(socket.roomCode), socket));
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
  rooms.forEach(function (room) {
    if (hasJoinedClients(room)) broadcast(room);
  });
}, 1000);

const serverReady = initializePersistence().then(function () {
  return new Promise(function (resolve, reject) {
    server.once("error", reject);
    server.listen(PORT, function () {
  console.log("Anime Opening Quiz działa na http://localhost:" + PORT);
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
