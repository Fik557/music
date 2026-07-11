const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number((globalThis.process && process.env && process.env.PORT) || globalThis.MUSIC_LOBBY_PORT || 3000);
const MODERATOR_PASSWORD = "Kochamkotki";
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "rooms.json");
const persistedRoomConfigs = loadPersistedRooms();
const rooms = new Map();
const sockets = new Map();
const ANSWER_TIME_LIMIT = 15;

const DIFFICULTIES = [
  { key: "very_easy", label: "Very easy" },
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
  { key: "impossible", label: "Impossible" }
];

const DEFAULT_DIFFICULTY_SCORES = {
  very_easy: { first: 2, second: 1 },
  easy: { first: 3, second: 2 },
  medium: { first: 5, second: 3 },
  hard: { first: 7, second: 5 },
  impossible: { first: 10, second: 7 }
};

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

function cleanAvatar(value) {
  const text = String(value || "").trim();
  if (text.length > 180000) return "";
  if (!/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(text)) return "";
  return text;
}

function normalizeIp(value) {
  let ip = rawText(value, 80);
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (ip === "::1") ip = "127.0.0.1";
  return ip;
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

function loadPersistedRooms() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) || {};
  } catch (error) {
    console.warn("Nie udalo sie wczytac zapisanych openingow:", error.message);
    return {};
  }
}

function savePersistedRooms() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(persistedRoomConfigs, null, 2), "utf8");
  } catch (error) {
    console.warn("Nie udalo sie zapisac openingow:", error.message);
  }
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
      const englishTitle = rawText(track.englishTitle || track.animeEnglish || track.titleEnglish, 120);
      const romajiTitle = rawText(track.romajiTitle || track.animeRomaji || track.titleRomaji, 120);
      const sourceTitle = rawText(track.sourceTitle || track.rawTitle, 180);
      const anime = rawText(track.anime || track.title || [englishTitle, romajiTitle].filter(Boolean).join(" / "), 180) || "Anime bez nazwy";
      const opening = rawText(track.opening || track.artist, 120);
      const videoId = detectYouTubeVideoId(track.audioUrl);
      const source = videoId ? "youtube" : "audio";
      const difficulty = difficultyExists(track.difficulty) ? track.difficulty : "medium";
      const result = normalizeTrackResult(track.result);
      const durationSeconds = numberInRange(track.durationSeconds, parseDurationText(track.durationText), 0, 86400);
      const durationText = rawText(track.durationText, 20) || formatDurationSeconds(durationSeconds);
      return {
        id: rawText(track.id, 80) || id("track_"),
        anime: anime,
        opening: opening,
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
      clipDuration: 10,
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

function currentTrack(room) {
  return room.tracks.find(function (track) {
    return track.id === room.currentTrackId;
  }) || null;
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
  if (seconds <= room.settings.clipDuration) return difficulty + " · 5-10 s";
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
      return a.localeCompare(b);
    })
    .map(function (ip) {
      const entry = room.blockedIps[ip] || {};
      return {
        ip: ip,
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
    .replace(/\s*\((?:official|creditless|tv size|full|lyrics?|audio|hd|4k)[^)]*\)\s*/gi, " ")
    .replace(/\b(?:creditless|official|lyrics?|full version|tv size|hd|4k)\b/gi, " "), 140);
}

function parseOpeningTitle(title) {
  const clean = cleanYouTubeTitle(title);
  const match = clean.match(/^(.*?)\s*(?:-|:)?\s*(?:OP|Opening)\s*([0-9]+|[IVXLC]+)?\b/i);
  if (!match) {
    return {
      anime: clean || "Anime z YouTube",
      opening: ""
    };
  }

  return {
    anime: rawText(match[1], 90) || clean || "Anime z YouTube",
    opening: rawText("Opening " + (match[2] || ""), 90)
  };
}

function trackFromYouTubeVideo(video, difficulty) {
  const meta = parseOpeningTitle(video.title || "");
  return {
    anime: meta.anime,
    opening: meta.opening,
    difficulty: difficultyExists(difficulty) ? difficulty : "medium",
    audioUrl: "https://www.youtube.com/watch?v=" + video.videoId,
    durationText: rawText(video.durationText, 20),
    durationSeconds: numberInRange(video.durationSeconds, parseDurationText(video.durationText), 0, 86400),
    startAtFirst: 0,
    startAtSecond: 5
  };
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

function collectYouTubeVideos(node, videos, seen) {
  if (!node || typeof node !== "object" || videos.length >= 100) return;

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

  Object.keys(node).forEach(function (key) {
    collectYouTubeVideos(node[key], videos, seen);
  });
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

  return {
    results: videos.map(function (video) {
      const track = trackFromYouTubeVideo(video, difficulty);
      return Object.assign(track, {
        id: id("search_"),
        videoId: video.videoId,
        source: "youtube",
        rawTitle: video.title
      });
    })
  };
}

async function importPlaylistTracks(room, payload) {
  const playlistId = detectYouTubePlaylistId(payload.playlistUrl || payload.url);
  if (!playlistId) return { error: "Wklej poprawny link do playlisty YouTube." };

  const difficulty = difficultyExists(payload.difficulty) ? payload.difficulty : "medium";
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
  const videos = extractPlaylistVideosFromHtml(html);
  if (!videos.length) return { error: "Nie znaleziono filmow na tej playliscie." };

  let added = 0;
  for (const video of videos) {
    const preparedVideo = await fillMissingVideoTitle(video);
    const normalized = normalizeTrack(trackFromYouTubeVideo(preparedVideo, difficulty), null);

    if (!normalized.error) {
      normalized.track.id = id("library_");
      room.libraryTracks.push(normalized.track);
      added += 1;
    }
  }

  return { added: added };
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
  const englishTitle = rawText(payload.englishTitle || payload.animeEnglish || payload.titleEnglish || (existing && existing.englishTitle), 120);
  const romajiTitle = rawText(payload.romajiTitle || payload.animeRomaji || payload.titleRomaji || (existing && existing.romajiTitle), 120);
  const sourceTitle = rawText(payload.sourceTitle || payload.rawTitle || (existing && existing.sourceTitle), 180);
  const anime = rawText(payload.anime || payload.title || [englishTitle, romajiTitle].filter(Boolean).join(" / "), 180) || (source === "youtube" ? "Anime z YouTube" : "Anime bez nazwy");
  const opening = rawText(payload.opening || payload.artist, 120);
  const durationSeconds = numberInRange(payload.durationSeconds, existing ? existing.durationSeconds : parseDurationText(payload.durationText), 0, 86400);
  const durationText = rawText(payload.durationText, 20) || (existing ? existing.durationText : "") || formatDurationSeconds(durationSeconds);

  return {
    track: {
      id: existing ? existing.id : id("track_"),
      anime: anime,
      opening: opening,
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
  const canSeeTitle = socket.role === "moderator" || room.revealed || room.phase === "ended";
  const anime = canSeeTitle ? track.anime : "Anime ukryte";
  const opening = canSeeTitle ? track.opening : "";
  return {
    id: track.id,
    anime: anime,
    opening: opening,
    englishTitle: canSeeTitle ? (track.englishTitle || "") : "",
    romajiTitle: canSeeTitle ? (track.romajiTitle || "") : "",
    title: anime,
    artist: opening,
    difficulty: track.difficulty || "medium",
    audioUrl: track.audioUrl,
    source: track.source || "audio",
    videoId: track.videoId || "",
    durationText: track.durationText || "",
    durationSeconds: numberInRange(track.durationSeconds, 0, 0, 86400),
    startAtFirst: numericTrackTime(track.startAtFirst, 0),
    startAtSecond: numericTrackTime(track.startAtSecond, numericTrackTime(track.startAtFirst, 0) + 5),
    startAt: numericTrackTime(track.startAtFirst, 0),
    revealed: canSeeTitle,
    result: normalizeTrackResult(track.result)
  };
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
        ip: isModerator ? normalizeIp(client.ip) : "",
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

function publicRoom(room, socket) {
  const isModerator = socket.role === "moderator";

  return {
    type: "state",
    serverNow: now(),
    room: {
      code: room.code,
      phase: room.phase,
      startedAt: room.startedAt,
      offset: elapsed(room),
      revealed: room.revealed || room.phase === "ended",
      lockedGroups: Object.keys(room.lockedGroups).filter(function (groupName) {
        return room.lockedGroups[groupName];
      }),
      tracks: isModerator ? room.tracks : [],
      libraryTracks: isModerator ? room.libraryTracks : [],
      currentTrackId: room.currentTrackId,
      currentTrack: visibleTrack(currentTrack(room), socket, room),
      currentBuzzer: publicBuzzer(room),
      teams: groupScores(room),
      groups: publicGroups(room),
      settings: room.settings,
      difficulties: DIFFICULTIES,
      people: peopleForRoom(room, isModerator),
      blockedIps: isModerator ? publicBlockedIps(room) : []
    }
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
    return rejectJoin(socket, "Ten adres IP jest zablokowany w tym pokoju.");
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
  if (!ip) return "Nie znaleziono adresu IP tej osoby.";

  room.blockedIps[ip] = {
    ip: ip,
    nickname: cleanText((target && target.nickname) || payload.nickname, "Gracz", 60),
    team: cleanText((target && target.team) || payload.team, "Druzyna", 32),
    by: cleanText(socket.nickname, "Administrator", 60),
    at: now()
  };

  roomClients(room).forEach(function (client) {
    if (client.role === "player" && normalizeIp(client.ip) === ip) {
      send(client, { type: "kicked", message: "Administrator zablokowal ten adres IP." });
      client.joined = false;
      client.raw.end();
    }
  });

  return "";
}

function unblockPlayerIp(room, payload) {
  const ip = normalizeIp(payload.ip);
  if (!ip || !room.blockedIps[ip]) return "Nie znaleziono tej blokady IP.";
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

async function handleModerator(socket, payload) {
  if (!socket.roomCode || !requireModerator(socket)) return;
  const room = getRoom(socket.roomCode);
  const action = payload.action;

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

  if (action === "importPlaylist") {
    const result = await importPlaylistTracks(room, payload || {});
    if (result.error) return sendError(socket, result.error);
    send(socket, { type: "playlistImported", message: "Dodano do biblioteki openingow: " + result.added + "." });
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
      clipDuration: 10,
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
  } else if (["addTrack", "addLibraryTrack", "addLibraryToMain", "removeLibraryTrack", "importPlaylist", "updateTrack", "removeTrack", "selectTrack", "clearTrackResult", "updateSettings", "play", "guessed", "awardBuzz", "revealTitle", "blockIp", "unblockIp"].includes(action)) {
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
  if (payload.type === "buzz") return handleBuzz(socket);
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
    ".ogg": "audio/ogg"
  }[extension] || "application/octet-stream";
}

function cacheControl(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if ([".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(extension)) {
    return "no-store";
  }
  return "public, max-age=3600";
}

function serve(req, res) {
  const requestUrl = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  const relative = path.relative(PUBLIC_DIR, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, function (error, data) {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType(filePath),
      "Cache-Control": cacheControl(filePath)
    });
    res.end(data);
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
}, 250);

setInterval(function () {
  rooms.forEach(function (room) {
    if (hasJoinedClients(room)) broadcast(room);
  });
}, 1000);

server.listen(PORT, function () {
  console.log("Anime Opening Quiz działa na http://localhost:" + PORT);
});

module.exports = server;
