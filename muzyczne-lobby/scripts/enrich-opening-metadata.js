const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "rooms.json");
const ANILIST_URL = "https://graphql.anilist.co";

const OPENING_OVERRIDES = {
  XqD0oCHLIF8: { query: "Solo Leveling", opening: "Opening 1" },
  fWRPihlt2ho: { query: "Your Lie in April", opening: "Opening 1" },
  "CID-sYQNCew": { query: "Attack on Titan Season 2", opening: "Opening 1" },
  "3hdJ8PKNXrc": { query: "Sword Art Online: Alicization", opening: "Opening 1" },
  "7aMOurgDB-o": { query: "Tokyo Ghoul", opening: "Opening 1" },
  PgBvV9ofjmA: { query: "Oshi no Ko", opening: "Opening 1" },
  I_zP1YmmREo: { query: "Blend S", opening: "Opening 1" },
  tF4faMbs5oQ: { query: "Dr. Stone", opening: "Opening 1" },
  "7hBoJDcBt28": { query: "Kakegurui", opening: "Opening 1" },
  oG4eu4HMtbo: { query: "My Dress-Up Darling", opening: "Opening 1" },
  "atxYe-nOa9w": { query: "One Punch Man", opening: "Opening 1" },
  qPdPjWkJZF8: { query: "Dandadan", opening: "Opening 1" },
  L96VbQ9ytWk: { query: "Call of the Night", opening: "Opening 1" },
  "1FPdtR_5KFo": { query: "Steins;Gate", opening: "Opening 1" },
  JBqxVX_LXvk: { query: "Fire Force", opening: "Opening 1" },
  lLiwIH5sxeo: { query: "Kaguya-sama: Love is War Season 2", opening: "Opening 2" },
  pmanD_s7G3U: { query: "Demon Slayer: Kimetsu no Yaiba", opening: "Opening 1" },
  "60A31DKGzAM": { query: "Jujutsu Kaisen Season 2", opening: "Opening 4" },
  LLDA9cfRLlg: { query: "Future Diary", opening: "Opening 1" },
  qQmTdijhjD4: { query: "Dragon Ball Z", opening: "Opening 1" },
  "EQ-DKvLQlyQ": { query: "The Apothecary Diaries", opening: "Opening 1" },
  HIoeEngUiKU: { query: "Rascal Does Not Dream of Bunny Girl Senpai", opening: "Opening 1" },
  VdkbWCgDPMg: { query: "Magi: The Kingdom of Magic", opening: "Opening 1" },
  XjHqfhOcK_0: { query: "Wotakoi: Love is Hard for Otaku", opening: "Opening 1" },
  BDoNRDqgmT0: { query: "Toradora!", opening: "Opening 1" },
  Hlw8dTz_iq0: { query: "SPY x FAMILY", opening: "Opening 2" },
  fpG3BPNQepY: { query: "KONOSUBA -God's blessing on this wonderful world!", opening: "Opening 1" },
  Tt4_enX63K0: { query: "Zom 100: Bucket List of the Dead", opening: "Opening 1" },
  "fodAJ-1dN3I": { query: "ERASED", opening: "Opening 1" },
  elyXcwunIYA: { query: "Fullmetal Alchemist: Brotherhood", opening: "Opening 1" },
  LK6_f5I33R8: { query: "Goblin Slayer II", opening: "Opening 1" },
  "l5wAdQ-UkWY": { query: "VINLAND SAGA", opening: "Opening 1" },
  q8L4VhyfVxQ: { query: "Assassination Classroom Second Season", opening: "Opening 4" },
  zzJ8U8OtEsE: { query: "Soul Eater", opening: "Opening 1" },
  bFFtHGDGpXc: { query: "JoJo's Bizarre Adventure: Diamond is Unbreakable", opening: "Opening 2" },
  "6CBp4qylX6I": { query: "No Game No Life", opening: "Opening 1" },
  vci9YwpFFcA: { query: "Overlord III", opening: "Opening 3" },
  nQQ1IYESt4I: { query: "The Promised Neverland", opening: "Opening 1" },
  VDGG9zi53rQ: { query: "Re:Zero Season 4", opening: "Opening 1" },
  hkcdLR_tdtA: { query: "Mushoku Tensei: Jobless Reincarnation Season 2", opening: "Opening 1" },
  FGFNUSn7awY: { query: "Anohana: The Flower We Saw That Day", opening: "Opening 1" },
  eMPjAGR75RA: { query: "ONIMAI: I'm Now Your Sister!", opening: "Opening 1" },
  gNn9NxZH2Vo: { query: "Ya Boy Kongming!", opening: "Opening 1" },
  WVb4b0RmU0s: { query: "Gintama", opening: "Opening 18" },
  "bG0cGW35-TI": { query: "Go! Go! Loser Ranger!", opening: "Opening 1" },
  WWBDuVCuiUQ: { query: "Psycho-Pass", opening: "Opening 1" },
  "G8C2JK5-7P4": { query: "Kenichi: The Mightiest Disciple", opening: "Opening 1" },
  fggISqEyuew: { query: "Saga of Tanya the Evil", opening: "Opening 1" },
  SJxVzZy_hF8: { query: "The Rising of the Shield Hero Season 4", opening: "Opening 1" },
  A4kLcDWBYcQ: { query: "DARLING in the FRANXX", opening: "Opening 1" },
  IuSAC8ZDf1A: { query: "WIND BREAKER", opening: "Opening 1" },
  "b6-2P8RgT0A": { query: "Himouto! Umaru-chan", opening: "Opening 1" },
  "4QFe2FH13wE": { query: "Made in Abyss: The Golden City of the Scorching Sun", opening: "Opening 1" },
  aso1mQLUAbc: { query: "Kaiju No. 8", opening: "Opening 1" },
  "7Ewk3Oxyhgk": { query: "Don't Toy with Me, Miss Nagatoro", opening: "Opening 1" },
  "HN_-WaTLD_A": { query: "BLEACH", opening: "Opening 10" },
  gCnCFtbY0ZI: { query: "Fate/Zero", opening: "Opening 1" },
  "5RVEM8-UKlg": { query: "Kuroko's Basketball", opening: "Opening 1" },
  "6pH1AZzYwF0": { query: "Sword Art Online II", opening: "Opening 4" },
  "DeGw8-KwxM4": { query: "Eromanga Sensei", opening: "Opening 1" },
  ZAKuyZEyZjY: { query: "Violet Evergarden", opening: "Opening 1" },
  JRmgL564x8E: { query: "Little Witch Academia", opening: "Opening 1" },
  DUqKtA0CESs: { query: "Ragna Crimson", opening: "Opening 1" },
  Xl7WIDaIgXo: { query: "Plastic Memories", opening: "Opening 1" },
  "5cwL3Ml8LEg": { query: "Haikyuu!!", opening: "Opening 2" },
  CSrfJBwRvEM: { query: "Gleipnir", opening: "Opening 1" },
  Y6hkBiZGCag: { query: "Haiyore! Nyaruko-san W", opening: "Opening 1" },
  aYtVJ7gYIWw: { query: "Black Clover", opening: "Opening 11" },
  eZN3afhTyGY: { query: "Arifureta: From Commonplace to World's Strongest", opening: "Opening 1" },
  QLO4tg0ubXc: { query: "Interspecies Reviewers", opening: "Opening 1" },
  gC68s6hlHwM: { query: "Strike the Blood", opening: "Opening 1" },
  gO2z86PoQRY: { query: "Naruto", opening: "Opening 6" },
  ieJ8YV8LiDk: { query: "Hunter x Hunter (1999)", opening: "Opening 2" },
  YgLObftNC7U: { query: "Beelzebub", opening: "Opening 5" },
  OgMsBRtbtlg: { query: "Fullmetal Alchemist", opening: "Opening 3" },
  klFVxGAacz0: { query: "Air Gear", opening: "Opening 1" },
  "bEgsB-hel0I": { query: "Oreshura", opening: "Opening 1" },
  "8dx4ewFve_k": { query: "The Familiar of Zero: Knight of the Twin Moons", opening: "Opening 1" },
  RFVzZtjz3aA: { query: "Unbreakable Machine-Doll", opening: "Ending 1" },
  MxMNwnlO9bI: { query: "Happy Sugar Life", opening: "Opening 1" },
  "pJvoP1Nz-Bs": { query: "The Day I Became a God", opening: "Opening 1" },
  m_QP5_rdH_g: { query: "Slam Dunk", opening: "Opening 1" },
  x1VNM57PHms: { query: "Hajime no Ippo", opening: "Opening 2" },
  "0L859J3iQk8": { query: "Kill Me Baby", opening: "Opening 1" },
  SJ5ICtGn6u8: { query: "Gantz", opening: "Opening 1" },
  l_RqpP00kkw: { query: "Kiss x Sis", opening: "Opening 1" },
  lF0gFgHR4Fk: { query: "Radiant Season 2", opening: "Opening 1" },
  oAXrRWLKzko: { query: "Ergo Proxy", opening: "Opening 1" },
  "-okZdA0xxYs": { query: "Bokurano", opening: "Opening 1" },
  MeCHp0Bm_6g: { query: "Welcome to the N.H.K.", opening: "Opening 1" },
  "9GQF1_PUTqE": { query: "Shuffle!", opening: "Opening 1" },
  "y-BhD4CH6Qs": { query: "Yu Yu Hakusho", opening: "Opening 2" },
  fVwTk7wk7ew: { query: "To Love Ru Darkness", opening: "Opening 1" },
  "5g74RJ27mEU": { query: "Rokka: Braves of the Six Flowers", opening: "Opening 2" },
  q7fdfUzCmRA: { query: "The Fruit of Grisaia", opening: "Opening 1" },
  MVjya_57uEo: { query: "Nyan Koi!", opening: "Opening 1" },
  "4NGGMPESDl4": { query: "Baka and Test", opening: "Opening 1" },
  KV8HGbACPzM: { query: "Senpai is an Otokonoko", opening: "Opening 1" },
  xpAg0spgFJA: { query: "Great Teacher Onizuka", opening: "Opening 2" },
  iKNnJS9lpFA: { query: "Shiki", opening: "Opening 2" }
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanText(value, fallback) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return text || fallback || "";
}

function detectVideoId(url) {
  const text = String(url || "");
  const direct = text.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (direct) return direct[1];
  return "";
}

function cleanCandidate(value) {
  return cleanText(value)
    .replace(/[「」【】]/g, " ")
    .replace(/\b(?:TV|Anime|Opening|OP|Ending|ED|Creditless|Official|Non-credit|NCOP)\b/gi, " ")
    .replace(/\s*[|:-]\s*.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatAnimeTitle(englishTitle, romajiTitle) {
  const english = cleanText(englishTitle);
  const romaji = cleanText(romajiTitle);
  if (english && romaji && english.toLowerCase() !== romaji.toLowerCase()) {
    return english + " / " + romaji;
  }
  return english || romaji || "Anime bez nazwy";
}

function openingFromTitle(title, fallback) {
  const text = cleanText(title);
  const current = cleanText(fallback);
  const ending = text.match(/\b(?:ED|Ending|Closing)\s*#?\s*([0-9]+)?\b/i);
  if (ending) return "Ending " + (ending[1] || "1");

  const opening = text.match(/\b(?:OP|Opening)\s*#?\s*([0-9]+)?\b/i);
  if (opening) return "Opening " + (opening[1] || "1");

  if (/^(?:Opening|Ending)\s+[0-9]+$/i.test(current)) return current;
  if (/^Opening$/i.test(current) || !current) return "Opening 1";
  return current;
}

async function fetchJson(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 10000);
  let response;

  try {
    response = await fetch(url, Object.assign({}, options || {}, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) {
    await sleep(2500);
    return fetchJson(url, options, timeoutMs);
  }
  if (!response.ok) throw new Error("HTTP " + response.status + " " + url);
  return response.json();
}

async function fetchYouTubeTitle(videoId) {
  if (!videoId) return "";
  try {
    const url = "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + videoId);
    const json = await fetchJson(url, {
      headers: { "user-agent": "Mozilla/5.0 AnimeOpeningQuiz" }
    }, 7000);
    return cleanText(json.title);
  } catch (error) {
    return "";
  }
}

const anilistCache = new Map();

async function fetchAniListTitle(query) {
  const search = cleanText(query);
  if (!search) return null;
  if (anilistCache.has(search)) return anilistCache.get(search);

  const body = {
    query: "query ($search: String) { Media(search: $search, type: ANIME) { id title { romaji english native } } }",
    variables: { search: search }
  };

  try {
    const json = await fetchJson(ANILIST_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        "user-agent": "AnimeOpeningQuizMetadata/1.0"
      },
      body: JSON.stringify(body)
    }, 9000);
    const media = json && json.data && json.data.Media;
    const title = media && media.title ? media.title : null;
    const result = title ? {
      englishTitle: cleanText(title.english) || cleanText(title.romaji),
      romajiTitle: cleanText(title.romaji) || cleanText(title.english)
    } : null;
    anilistCache.set(search, result);
    await sleep(250);
    return result;
  } catch (error) {
    anilistCache.set(search, null);
    return null;
  }
}

async function mapLimit(items, limit, worker) {
  const result = [];
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      result[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return result;
}

async function enrichTrack(track) {
  if (!track || !track.audioUrl) return { changed: false, failed: false };

  const videoId = cleanText(track.videoId) || detectVideoId(track.audioUrl);
  const override = OPENING_OVERRIDES[videoId] || {};
  const sourceTitle = await fetchYouTubeTitle(videoId);
  const query = override.query || cleanCandidate(track.anime) || cleanCandidate(sourceTitle);
  const anilist = await fetchAniListTitle(query);
  const englishTitle = cleanText(override.english) || (anilist && anilist.englishTitle) || cleanText(track.englishTitle) || query;
  const romajiTitle = cleanText(override.romaji) || (anilist && anilist.romajiTitle) || cleanText(track.romajiTitle) || englishTitle;
  const opening = cleanText(override.opening) || openingFromTitle(sourceTitle, track.opening);
  const anime = formatAnimeTitle(englishTitle, romajiTitle);
  let changed = false;

  function set(key, value) {
    const next = cleanText(value);
    if (next && track[key] !== next) {
      track[key] = next;
      changed = true;
    }
  }

  set("anime", anime);
  set("title", anime);
  set("opening", opening);
  set("artist", opening);
  set("englishTitle", englishTitle);
  set("romajiTitle", romajiTitle);
  if (sourceTitle) set("sourceTitle", sourceTitle);
  if (videoId) set("videoId", videoId);
  if (videoId && track.source !== "youtube") {
    track.source = "youtube";
    changed = true;
  }

  return { changed, failed: !anilist };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function seedEmptyRooms(data) {
  const lobby = data.LOBBY;
  if (!lobby || !Array.isArray(lobby.tracks) || !lobby.tracks.length) return 0;

  let seeded = 0;
  Object.keys(data).forEach((roomCode) => {
    if (roomCode === "LOBBY") return;
    const room = data[roomCode] || {};
    if (!Array.isArray(room.tracks) || !room.tracks.length) {
      room.tracks = clone(lobby.tracks);
      room.libraryTracks = clone(lobby.libraryTracks || lobby.tracks);
      room.currentTrackId = lobby.currentTrackId || (room.tracks[0] && room.tracks[0].id) || null;
      room.settings = room.settings || clone(lobby.settings || {});
      data[roomCode] = room;
      seeded += 1;
    }
  });
  return seeded;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const lists = [];
  Object.keys(data).forEach((roomCode) => {
    const room = data[roomCode];
    if (!room || typeof room !== "object") return;
    if (Array.isArray(room.tracks)) lists.push(room.tracks);
    if (Array.isArray(room.libraryTracks)) lists.push(room.libraryTracks);
  });

  const byVideoId = new Map();
  lists.forEach((tracks) => {
    tracks.forEach((track) => {
      const videoId = cleanText(track.videoId) || detectVideoId(track.audioUrl);
      if (!videoId || byVideoId.has(videoId)) return;
      byVideoId.set(videoId, track);
    });
  });

  const metadata = new Map();
  let changed = 0;
  let failed = 0;
  await mapLimit(Array.from(byVideoId.values()), 4, async (track) => {
    const videoId = cleanText(track.videoId) || detectVideoId(track.audioUrl);
    const result = await enrichTrack(track);
    metadata.set(videoId, {
      anime: track.anime,
      opening: track.opening,
      englishTitle: track.englishTitle,
      romajiTitle: track.romajiTitle,
      sourceTitle: track.sourceTitle,
      videoId: track.videoId,
      source: track.source
    });
    if (result.changed) changed += 1;
    if (result.failed) failed += 1;
  });

  lists.forEach((tracks) => {
    tracks.forEach((track) => {
      const videoId = cleanText(track.videoId) || detectVideoId(track.audioUrl);
      const meta = metadata.get(videoId);
      if (!meta) return;
      Object.assign(track, meta, {
        title: meta.anime,
        artist: meta.opening
      });
    });
  });

  const seededRooms = seedEmptyRooms(data);
  fs.copyFileSync(DATA_FILE, DATA_FILE + ".bak-enrich-" + Date.now());
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");

  console.log(JSON.stringify({
    uniqueTracks: byVideoId.size,
    changed: changed,
    failedAniListMatches: failed,
    seededRooms: seededRooms,
    lobbyTracks: data.LOBBY && data.LOBBY.tracks ? data.LOBBY.tracks.length : 0
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
