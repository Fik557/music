const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "rooms.json");
const TIMES_FILE = process.argv[2] || "D:\\pulpit\\openingi czasy.txt";

const PLAYLISTS = [
  { url: "https://www.youtube.com/playlist?list=PLYbZ6S3M4LEA", difficulty: "very_easy", section: "VERY EASY" },
  { url: "https://www.youtube.com/playlist?list=PLODjyMoH_ugs", difficulty: "easy", section: "EASY" },
  { url: "https://www.youtube.com/playlist?list=PLIYqZhJ6zv2U", difficulty: "medium", section: "MEDIUM" },
  { url: "https://www.youtube.com/playlist?list=PLEvIXHBQg37U", difficulty: "hard", section: "HARD" },
  { url: "https://www.youtube.com/playlist?list=PLC9akF6PKV50", difficulty: "impossible", section: "IMPOSSIBLE" }
];

const DEFAULT_DIFFICULTY_SCORES = {
  very_easy: { first: 2, second: 1 },
  easy: { first: 3, second: 2 },
  medium: { first: 5, second: 3 },
  hard: { first: 7, second: 5 },
  impossible: { first: 10, second: 7 }
};

function rawText(value, max) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max || 120);
}

function id(prefix) {
  return String(prefix || "") + crypto.randomBytes(6).toString("hex");
}

function decodeJsonString(value) {
  try {
    return JSON.parse("\"" + String(value || "").replace(/"/g, "\\\"") + "\"");
  } catch (error) {
    return String(value || "");
  }
}

function parseDurationText(value) {
  const parts = String(value || "").trim().split(":").map((part) => Number(part));
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
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

function cleanYouTubeTitle(title) {
  return rawText(String(title || "")
    .replace(/\s*\[[^\]]*\]\s*/g, " ")
    .replace(/\s*\((?:official|creditless|tv size|full|lyrics?|audio|hd|4k)[^)]*\)\s*/gi, " ")
    .replace(/\b(?:creditless|official|lyrics?|full version|tv size|hd|4k)\b/gi, " "), 140);
}

function parseOpeningTitle(title) {
  const clean = cleanYouTubeTitle(title);
  const match = clean.match(/^(.*?)\s*(?:-|–|—|\||:)?\s*(?:OP|Opening)\s*#?\s*([0-9]+|[IVXLC]+)?\b/i);
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

function youtubeText(value) {
  if (!value || typeof value !== "object") return "";
  if (value.simpleText) return rawText(value.simpleText, 140);
  if (Array.isArray(value.runs)) {
    return rawText(value.runs.map((run) => run && run.text ? run.text : "").join(""), 140);
  }
  return "";
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
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === "\"") inString = false;
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

function collectYouTubeVideos(node, videos, seen) {
  if (!node || typeof node !== "object" || videos.length >= 150) return;
  const item = node.playlistVideoRenderer || node.videoRenderer || node.compactVideoRenderer;
  if (item) {
    const videoId = rawText(item.videoId, 40);
    if (/^[A-Za-z0-9_-]{11}$/.test(videoId) && !seen[videoId]) {
      const durationText = youtubeText(item.lengthText);
      seen[videoId] = true;
      videos.push({
        videoId,
        title: youtubeText(item.title) || "YouTube opening",
        durationText,
        durationSeconds: parseDurationText(durationText)
      });
    }
  }
  Object.keys(node).forEach((key) => collectYouTubeVideos(node[key], videos, seen));
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

function extractPlaylistVideosFromHtml(html) {
  const videos = [];
  const seen = {};
  const initialData = extractBalancedJson(html, "ytInitialData");
  if (initialData) {
    try {
      collectYouTubeVideos(JSON.parse(initialData), videos, seen);
    } catch (error) {
      videos.length = 0;
      Object.keys(seen).forEach((key) => delete seen[key]);
    }
  }
  if (videos.length) return videos;

  const matches = html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g);
  for (const match of matches) {
    const videoId = match[1];
    if (!seen[videoId]) {
      const durationText = durationNearVideoId(html, videoId);
      seen[videoId] = true;
      videos.push({
        videoId,
        title: titleNearVideoId(html, videoId) || "YouTube opening " + (videos.length + 1),
        durationText,
        durationSeconds: parseDurationText(durationText)
      });
      if (videos.length >= 150) break;
    }
  }
  return videos;
}

function detectPlaylistId(value) {
  const text = String(value || "").trim();
  try {
    const url = new URL(text);
    return rawText(url.searchParams.get("list"), 120);
  } catch (error) {
    return rawText(text, 120);
  }
}

function parseTimeToken(value, preferLast) {
  const matches = String(value || "").match(/\d+/g);
  if (!matches || !matches.length) return null;
  return Number(preferLast ? matches[matches.length - 1] : matches[0]);
}

function parseTimesFile(filePath) {
  const result = {};
  let section = "";
  fs.readFileSync(filePath, "utf8").split(/\r?\n/).forEach((line) => {
    const text = line.trim();
    if (!text) return;
    const upper = text.toUpperCase();
    if (["VERY EASY", "EASY", "MEDIUM", "HARD", "IMPOSSIBLE"].includes(upper)) {
      section = upper;
      if (!result[section]) result[section] = [];
      return;
    }
    if (!section || !/^\d/.test(text)) return;
    const tokens = text.split(/\s+/);
    result[section].push({
      first: parseTimeToken(tokens[0], false),
      second: parseTimeToken(tokens[1], true)
    });
  });
  return result;
}

function mostReplayedStartFromWatchHtml(html) {
  const regex = /"startMillis"\s*:\s*(?:"(\d+)"|(\d+))[\s\S]{0,260}?"intensityScoreNormalized"\s*:\s*([0-9.]+)/g;
  let best = null;
  let match;
  while ((match = regex.exec(html))) {
    const startMillis = Number(match[1] || match[2] || 0);
    const intensity = Number(match[3] || 0);
    if (!Number.isFinite(startMillis) || !Number.isFinite(intensity)) continue;
    if (!best || intensity > best.intensity) best = { startMillis, intensity };
  }
  if (!best) return 5;
  const seconds = Math.floor(best.startMillis / 1000);
  return seconds > 0 ? seconds : 5;
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

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "accept-language": "pl,en;q=0.8",
      "user-agent": "Mozilla/5.0 AnimeOpeningQuiz"
    }
  });
  if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);
  return response.text();
}

async function fillVideoDetails(video, needHeatmap) {
  const titleMissing = !video.title || /^YouTube opening(?:\s+\d+)?$/i.test(video.title);
  if (!titleMissing && !needHeatmap) return { video, heatmapStart: null };

  try {
    const html = await fetchHtml("https://www.youtube.com/watch?v=" + encodeURIComponent(video.videoId) + "&hl=pl");
    if (titleMissing) {
      const title = videoTitleFromWatchHtml(html);
      if (title) video.title = title;
    }
    return { video, heatmapStart: needHeatmap ? mostReplayedStartFromWatchHtml(html) : null };
  } catch (error) {
    return { video, heatmapStart: needHeatmap ? 5 : null };
  }
}

function createTrack(video, difficulty, times, heatmapStart) {
  const meta = parseOpeningTitle(video.title || "");
  const first = Number.isFinite(times && times.first) ? times.first : 0;
  const second = Number.isFinite(times && times.second) ? times.second : (Number.isFinite(heatmapStart) ? heatmapStart : 5);
  const durationSeconds = Number(video.durationSeconds || 0);
  const durationText = rawText(video.durationText, 20) || formatDurationSeconds(durationSeconds);
  return {
    id: id("track_"),
    anime: meta.anime,
    opening: meta.opening,
    title: meta.anime,
    artist: meta.opening,
    difficulty,
    audioUrl: "https://www.youtube.com/watch?v=" + video.videoId,
    source: "youtube",
    videoId: video.videoId,
    durationText,
    durationSeconds,
    startAtFirst: first,
    startAtSecond: second,
    startAt: first,
    result: null
  };
}

async function importPlaylist(playlist, timeEntries) {
  const playlistId = detectPlaylistId(playlist.url);
  const html = await fetchHtml("https://www.youtube.com/playlist?list=" + encodeURIComponent(playlistId) + "&hl=pl");
  const videos = extractPlaylistVideosFromHtml(html);
  const tracks = [];

  for (let index = 0; index < videos.length; index += 1) {
    const times = timeEntries[index] || null;
    const needsHeatmap = !times || !Number.isFinite(times.second);
    const details = await fillVideoDetails(videos[index], needsHeatmap);
    tracks.push(createTrack(details.video, playlist.difficulty, times, details.heatmapStart));
  }

  return tracks;
}

async function main() {
  const timesBySection = parseTimesFile(TIMES_FILE);
  const data = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) : {};
  if (!data.LOBBY) data.LOBBY = {};
  if (!Array.isArray(data.LOBBY.tracks)) data.LOBBY.tracks = [];
  if (!data.LOBBY.settings) data.LOBBY.settings = { difficultyScores: DEFAULT_DIFFICULTY_SCORES };
  if (!data.LOBBY.settings.difficultyScores) data.LOBBY.settings.difficultyScores = DEFAULT_DIFFICULTY_SCORES;

  const existingVideoIds = new Set(data.LOBBY.tracks.map((track) => track.videoId).filter(Boolean));
  const existingUrls = new Set(data.LOBBY.tracks.map((track) => track.audioUrl).filter(Boolean));
  const added = [];
  const skipped = [];

  for (const playlist of PLAYLISTS) {
    const tracks = await importPlaylist(playlist, timesBySection[playlist.section] || []);
    for (const track of tracks) {
      if (existingVideoIds.has(track.videoId) || existingUrls.has(track.audioUrl)) {
        skipped.push(track.anime + " " + track.opening);
        continue;
      }
      existingVideoIds.add(track.videoId);
      existingUrls.add(track.audioUrl);
      data.LOBBY.tracks.push(track);
      added.push(track);
    }
  }

  if (!data.LOBBY.currentTrackId && data.LOBBY.tracks[0]) data.LOBBY.currentTrackId = data.LOBBY.tracks[0].id;
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.copyFileSync(DATA_FILE, DATA_FILE + ".bak-" + Date.now());
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");

  console.log(JSON.stringify({
    added: added.length,
    skipped: skipped.length,
    totalLobbyTracks: data.LOBBY.tracks.length,
    firstAdded: added.slice(0, 5).map((track) => ({
      anime: track.anime,
      opening: track.opening,
      difficulty: track.difficulty,
      startAtFirst: track.startAtFirst,
      startAtSecond: track.startAtSecond
    }))
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
