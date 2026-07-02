const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number((globalThis.process && process.env && process.env.PORT) || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const rooms = new Map();
const sockets = new Map();

function now() {
  return Date.now() / 1000;
}

function id(prefix) {
  return String(prefix || "") + crypto.randomBytes(6).toString("hex");
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

function numberInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function createRoom(code) {
  return {
    code: code,
    phase: "idle",
    startedAt: 0,
    offset: 0,
    tracks: [],
    currentTrackId: null,
    currentBuzzer: null,
    teams: {
      "Drużyna A": 0,
      "Drużyna B": 0
    },
    settings: {
      clipDuration: 10,
      firstWindow: 5,
      secondWindow: 2
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

function scoreFor(room, seconds) {
  if (seconds <= room.settings.firstWindow) return 2;
  if (seconds <= room.settings.firstWindow + room.settings.secondWindow) return 1;
  return 0;
}

function scoringLabel(points) {
  if (points === 2) return "pierwsze 5 s";
  if (points === 1) return "drugi próg";
  return "poza progiem";
}

function publicRoom(room) {
  const people = roomClients(room)
    .filter(function (socket) {
      return socket.joined;
    })
    .map(function (socket) {
      return {
        id: socket.id,
        nickname: socket.nickname,
        team: socket.team,
        role: socket.role,
        connected: true
      };
    })
    .sort(function (a, b) {
      return Number(b.role === "moderator") - Number(a.role === "moderator") || a.nickname.localeCompare(b.nickname);
    });

  return {
    type: "state",
    serverNow: now(),
    room: {
      code: room.code,
      phase: room.phase,
      startedAt: room.startedAt,
      offset: elapsed(room),
      tracks: room.tracks,
      currentTrackId: room.currentTrackId,
      currentTrack: currentTrack(room),
      currentBuzzer: room.currentBuzzer,
      teams: room.teams,
      settings: room.settings,
      people: people
    }
  };
}

function touch(room) {
  room.updatedAt = now();
}

function broadcast(room) {
  const state = JSON.stringify(publicRoom(room));
  roomClients(room).forEach(function (socket) {
    sendRaw(socket, state);
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

function joinRoom(socket, payload) {
  const room = getRoom(payload.roomCode);
  const previous = socket.roomCode ? getRoom(socket.roomCode) : null;

  socket.joined = true;
  socket.roomCode = room.code;
  socket.role = payload.role === "moderator" ? "moderator" : "player";
  socket.nickname = cleanText(payload.nickname, socket.role === "moderator" ? "Moderator" : "Gracz");
  socket.team = cleanText(payload.team, "Drużyna A", 32);

  if (socket.team && room.teams[socket.team] == null) room.teams[socket.team] = 0;

  send(socket, { type: "joined", id: socket.id, roomCode: room.code });
  if (previous && previous.code !== room.code) broadcast(previous);
  broadcast(room);
}

function requireModerator(socket) {
  if (socket.role !== "moderator") {
    sendError(socket, "Tylko moderator może wykonać tę akcję.");
    return false;
  }
  return true;
}

function handleBuzz(socket) {
  if (!socket.roomCode) return;
  const room = getRoom(socket.roomCode);
  if (room.phase !== "playing" || room.currentBuzzer) return;

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
    label: scoringLabel(points)
  };

  touch(room);
  broadcast(room);
}

function addTrack(room, payload) {
  const audioUrl = cleanText(payload.audioUrl, "", 500);
  if (!audioUrl) return "Brakuje linku do pliku audio.";

  const track = {
    id: id("track_"),
    title: cleanText(payload.title, "Bez tytułu", 90),
    artist: cleanText(payload.artist, "", 90),
    audioUrl: audioUrl,
    startAt: numberInRange(payload.startAt, 0, 0, 36000)
  };

  room.tracks.push(track);
  if (!room.currentTrackId) room.currentTrackId = track.id;
  return null;
}

function resetPlayback(room) {
  room.phase = "idle";
  room.startedAt = 0;
  room.offset = 0;
  room.currentBuzzer = null;
}

function handleModerator(socket, payload) {
  if (!socket.roomCode || !requireModerator(socket)) return;
  const room = getRoom(socket.roomCode);
  const action = payload.action;

  if (action === "addTrack") {
    const error = addTrack(room, payload.track || {});
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

  if (action === "selectTrack") {
    const selectedTrackId = cleanText(payload.trackId, "", 80);
    if (room.tracks.some(function (track) { return track.id === selectedTrackId; })) {
      room.currentTrackId = selectedTrackId;
      resetPlayback(room);
    }
  }

  if (action === "play") {
    if (!currentTrack(room)) return sendError(socket, "Najpierw dodaj lub wybierz piosenkę.");
    room.phase = "playing";
    room.offset = 0;
    room.startedAt = now();
    room.currentBuzzer = null;
  }

  if (action === "pause") {
    if (room.phase === "playing") {
      room.offset = elapsed(room);
      room.phase = "paused";
    }
  }

  if (action === "resume") {
    if (!currentTrack(room)) return sendError(socket, "Najpierw dodaj lub wybierz piosenkę.");
    if (room.phase === "paused" || room.phase === "idle") {
      room.phase = "playing";
      room.offset = numberInRange(room.offset, 0, 0, room.settings.clipDuration);
      room.startedAt = now();
      room.currentBuzzer = null;
    }
  }

  if (action === "stop") resetPlayback(room);

  if (action === "nextTrack" || action === "previousTrack") {
    if (room.tracks.length) {
      const index = Math.max(0, room.tracks.findIndex(function (track) { return track.id === room.currentTrackId; }));
      const shift = action === "nextTrack" ? 1 : -1;
      const nextIndex = (index + shift + room.tracks.length) % room.tracks.length;
      room.currentTrackId = room.tracks[nextIndex].id;
      resetPlayback(room);
    }
  }

  if (action === "clearBuzz") room.currentBuzzer = null;

  if (action === "award") {
    const team = cleanText(payload.team, room.currentBuzzer ? room.currentBuzzer.team : "Drużyna A", 32);
    const points = numberInRange(payload.points, 0, -20, 20);
    if (room.teams[team] == null) room.teams[team] = 0;
    room.teams[team] += points;
  }

  if (action === "setScore") {
    const scoreTeam = cleanText(payload.team, "Drużyna A", 32);
    const value = numberInRange(payload.value, 0, -999, 999);
    room.teams[scoreTeam] = value;
  }

  if (action === "resetScores") {
    Object.keys(room.teams).forEach(function (team) {
      room.teams[team] = 0;
    });
  }

  if (action === "updateSettings") {
    const settings = payload.settings || {};
    const clipDuration = numberInRange(settings.clipDuration, room.settings.clipDuration, 3, 60);
    const firstWindow = numberInRange(settings.firstWindow, room.settings.firstWindow, 1, clipDuration);
    const maxSecond = Math.max(0, clipDuration - firstWindow);
    const secondWindow = numberInRange(settings.secondWindow, room.settings.secondWindow, 0, maxSecond);
    room.settings = {
      clipDuration: clipDuration,
      firstWindow: firstWindow,
      secondWindow: secondWindow
    };
    room.offset = numberInRange(room.offset, 0, 0, clipDuration);
  }

  if (action === "resetRoom") {
    room.tracks = [];
    room.currentTrackId = null;
    room.currentBuzzer = null;
    room.phase = "idle";
    room.offset = 0;
    room.startedAt = 0;
    room.teams = { "Drużyna A": 0, "Drużyna B": 0 };
  }

  touch(room);
  broadcast(room);
}

function updateProfile(socket, payload) {
  if (!socket.roomCode) return;
  const room = getRoom(socket.roomCode);
  socket.nickname = cleanText(payload.nickname, socket.nickname || "Gracz");
  socket.team = cleanText(payload.team, socket.team || "Drużyna A", 32);
  if (room.teams[socket.team] == null) room.teams[socket.team] = 0;
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
  if (payload.type === "moderator") return handleModerator(socket, payload);
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
      "Cache-Control": filePath.endsWith("index.html") ? "no-store" : "public, max-age=3600"
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
    nickname: "Gracz",
    team: "Drużyna A",
    role: "player"
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
      room.currentBuzzer = null;
      touch(room);
      broadcast(room);
    }
  });
}, 250);

server.listen(PORT, function () {
  console.log("Muzyczne Lobby działa na http://localhost:" + PORT);
});
