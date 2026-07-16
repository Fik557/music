"use strict";

const target = process.env.SOLO_TEST_URL || "ws://127.0.0.1:8091";
const socket = new WebSocket(target);
const clientId = "solo-preroll-smoke-" + Date.now();
let startSent = false;
let readySent = false;
let countdownStartedAt = 0;

const timeout = setTimeout(function () {
  console.error("Solo preroll test timed out.");
  process.exit(1);
}, 12000);

function send(payload) {
  socket.send(JSON.stringify(payload));
}

socket.addEventListener("message", function (event) {
  const payload = JSON.parse(String(event.data || "{}"));
  if (payload.type === "hello") {
    send({
      type: "soloJoin",
      clientId: clientId,
      nickname: "Preroll smoke test"
    });
    return;
  }

  if (payload.type !== "soloState" || !payload.room) return;
  const room = payload.room;
  if (room.phase === "idle" && room.currentTrack && !startSent) {
    startSent = true;
    send({ type: "soloAction", action: "start" });
    return;
  }

  if ((room.phase === "loading" || room.phase === "countdown") && !readySent && room.currentTrackId) {
      readySent = true;
      send({
        type: "soloAction",
        action: "mediaReady",
        key: room.currentTrackId
      });
    return;
  }

  if (room.phase === "countdown") {
    if (!countdownStartedAt) countdownStartedAt = Date.now();
    return;
  }

  if (room.phase === "playing") {
    const elapsed = Date.now() - countdownStartedAt;
    clearTimeout(timeout);
    socket.close();
    if (!countdownStartedAt || elapsed < 2700 || elapsed > 4500) {
      console.error("Unexpected solo preroll duration: " + elapsed + " ms");
      process.exit(1);
    }
    console.log("Solo preroll OK: " + elapsed + " ms");
    process.exit(0);
  }
});

socket.addEventListener("error", function () {
  clearTimeout(timeout);
  console.error("Solo preroll WebSocket connection failed.");
  process.exit(1);
});