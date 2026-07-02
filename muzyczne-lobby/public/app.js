const $ = function (selector) {
  return document.querySelector(selector);
};

const loginView = $("#loginView");
const appView = $("#appView");
const loginForm = $("#loginForm");
const moderatorJoinButton = $("#moderatorJoinButton");
const nicknameInput = $("#nicknameInput");
const teamInput = $("#teamInput");
const roomInput = $("#roomInput");
const roleLabel = $("#roleLabel");
const connectionStatus = $("#connectionStatus");
const roomCodeLabel = $("#roomCodeLabel");
const copyLinkButton = $("#copyLinkButton");
const leaveButton = $("#leaveButton");
const trackTitle = $("#trackTitle");
const trackArtist = $("#trackArtist");
const phaseLabel = $("#phaseLabel");
const progressFill = $("#progressFill");
const timeLabel = $("#timeLabel");
const scoreWindowLabel = $("#scoreWindowLabel");
const soundButton = $("#soundButton");
const buzzButton = $("#buzzButton");
const buzzCaption = $("#buzzCaption");
const scoreboard = $("#scoreboard");
const peopleList = $("#peopleList");
const peopleCount = $("#peopleCount");
const moderatorPanel = $("#moderatorPanel");
const trackForm = $("#trackForm");
const trackTitleInput = $("#trackTitleInput");
const trackArtistInput = $("#trackArtistInput");
const trackUrlInput = $("#trackUrlInput");
const trackStartInput = $("#trackStartInput");
const trackList = $("#trackList");
const trackCount = $("#trackCount");
const playButton = $("#playButton");
const pauseButton = $("#pauseButton");
const resumeButton = $("#resumeButton");
const stopButton = $("#stopButton");
const previousButton = $("#previousButton");
const nextButton = $("#nextButton");
const resetScoresButton = $("#resetScoresButton");
const awardSuggestedButton = $("#awardSuggestedButton");
const awardTwoButton = $("#awardTwoButton");
const awardOneButton = $("#awardOneButton");
const clearBuzzButton = $("#clearBuzzButton");
const resumeFromBuzzButton = $("#resumeFromBuzzButton");
const buzzedAtLabel = $("#buzzedAtLabel");
const decisionText = $("#decisionText");
const settingsForm = $("#settingsForm");
const clipDurationInput = $("#clipDurationInput");
const firstWindowInput = $("#firstWindowInput");
const secondWindowInput = $("#secondWindowInput");
const toast = $("#toast");
const audio = $("#songAudio");

let socket = null;
let state = null;
let profile = null;
let lastStateAt = Date.now();
let soundEnabled = false;
let reconnectTimer = null;
let toastTimer = null;

const query = new URLSearchParams(location.search);
if (query.get("room")) roomInput.value = query.get("room");

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.add("hidden");
  }, 2800);
}

function cleanRoom(value) {
  return String(value || "LOBBY")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 18) || "LOBBY";
}

function connect() {
  if (socket && socket.readyState <= 1) return;

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(protocol + "//" + location.host);
  connectionStatus.textContent = "łączenie";

  socket.addEventListener("open", function () {
    connectionStatus.textContent = "online";
    if (profile) sendJoin();
  });

  socket.addEventListener("message", function (event) {
    const payload = JSON.parse(event.data);
    if (payload.type === "state") {
      state = payload.room;
      lastStateAt = Date.now();
      render();
      syncAudio();
    }
    if (payload.type === "error") showToast(payload.message);
    if (payload.type === "joined") {
      const url = new URL(location.href);
      url.searchParams.set("room", payload.roomCode);
      history.replaceState(null, "", url);
    }
  });

  socket.addEventListener("close", function () {
    connectionStatus.textContent = "offline";
    clearTimeout(reconnectTimer);
    if (profile) reconnectTimer = setTimeout(connect, 1000);
  });
}

function send(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function sendJoin() {
  send({
    type: "join",
    nickname: profile.nickname,
    team: profile.team,
    roomCode: profile.roomCode,
    role: profile.role
  });
}

function join(role) {
  const nickname = nicknameInput.value.trim() || (role === "moderator" ? "Moderator" : "Gracz");
  const roomCode = cleanRoom(roomInput.value);
  profile = {
    nickname: nickname,
    team: teamInput.value || "Drużyna A",
    roomCode: roomCode,
    role: role
  };

  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  moderatorPanel.classList.toggle("hidden", role !== "moderator");
  roleLabel.textContent = role === "moderator" ? "moderator" : nickname + " · " + profile.team;
  roomCodeLabel.textContent = roomCode;
  connect();
  sendJoin();
}

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  join("player");
});

moderatorJoinButton.addEventListener("click", function () {
  join("moderator");
});

leaveButton.addEventListener("click", function () {
  profile = null;
  state = null;
  soundEnabled = false;
  audio.pause();
  if (socket) socket.close();
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
});

copyLinkButton.addEventListener("click", async function () {
  const url = new URL(location.href);
  url.searchParams.set("room", (profile && profile.roomCode) || "LOBBY");
  try {
    await navigator.clipboard.writeText(url.toString());
    showToast("Link do pokoju skopiowany.");
  } catch (error) {
    showToast(url.toString());
  }
});

soundButton.addEventListener("click", function () {
  soundEnabled = true;
  soundButton.textContent = "Dźwięk włączony";
  syncAudio(true);
});

buzzButton.addEventListener("click", function () {
  send({ type: "buzz" });
});

trackForm.addEventListener("submit", function (event) {
  event.preventDefault();
  mod("addTrack", {
    track: {
      title: trackTitleInput.value,
      artist: trackArtistInput.value,
      audioUrl: trackUrlInput.value,
      startAt: Number(trackStartInput.value || 0)
    }
  });
  trackTitleInput.value = "";
  trackArtistInput.value = "";
  trackUrlInput.value = "";
  trackStartInput.value = "0";
});

settingsForm.addEventListener("submit", function (event) {
  event.preventDefault();
  mod("updateSettings", {
    settings: {
      clipDuration: Number(clipDurationInput.value),
      firstWindow: Number(firstWindowInput.value),
      secondWindow: Number(secondWindowInput.value)
    }
  });
});

playButton.addEventListener("click", function () { mod("play"); });
pauseButton.addEventListener("click", function () { mod("pause"); });
resumeButton.addEventListener("click", function () { mod("resume"); });
stopButton.addEventListener("click", function () { mod("stop"); });
previousButton.addEventListener("click", function () { mod("previousTrack"); });
nextButton.addEventListener("click", function () { mod("nextTrack"); });
resetScoresButton.addEventListener("click", function () { mod("resetScores"); });
resumeFromBuzzButton.addEventListener("click", function () { mod("resume"); });
clearBuzzButton.addEventListener("click", function () { mod("clearBuzz"); });
awardSuggestedButton.addEventListener("click", function () { award((state && state.currentBuzzer && state.currentBuzzer.suggestedPoints) || 0); });
awardTwoButton.addEventListener("click", function () { award(2); });
awardOneButton.addEventListener("click", function () { award(1); });

function mod(action, data) {
  send(Object.assign({ type: "moderator", action: action }, data || {}));
}

function award(points) {
  const buzzer = state && state.currentBuzzer;
  if (!buzzer) return;
  mod("award", { team: buzzer.team, points: points });
  mod("clearBuzz");
}

function estimatedElapsed() {
  if (!state) return 0;
  if (state.phase !== "playing") return state.offset || 0;
  const localDelta = (Date.now() - lastStateAt) / 1000;
  return Math.min(state.settings.clipDuration, Math.max(0, (state.offset || 0) + localDelta));
}

function scoreWindowText() {
  if (!state) return "";
  const first = state.settings.firstWindow;
  const secondEnd = state.settings.firstWindow + state.settings.secondWindow;
  return "2 pkt: 0-" + first + " s · 1 pkt: " + first + "-" + secondEnd + " s";
}

function render() {
  if (!state) return;

  roomCodeLabel.textContent = state.code;
  const track = state.currentTrack;
  trackTitle.textContent = track ? track.title : "Brak piosenki";
  trackArtist.textContent = track && track.artist ? track.artist : (track ? "Gotowe do rundy." : "Moderator dodaje utwory w panelu.");
  phaseLabel.textContent = phaseText(state.phase);
  scoreWindowLabel.textContent = scoreWindowText();
  peopleCount.textContent = state.people.length + " " + (state.people.length === 1 ? "osoba" : "osób");

  const good = (state.settings.firstWindow / state.settings.clipDuration) * 100;
  const ok = (state.settings.secondWindow / state.settings.clipDuration) * 100;
  document.documentElement.style.setProperty("--good-width", good + "%");
  document.documentElement.style.setProperty("--ok-width", ok + "%");

  renderScores();
  renderPeople();
  renderTracks();
  renderModerator();
  renderBuzzer();
}

function renderScores() {
  scoreboard.replaceChildren();
  Object.entries(state.teams)
    .sort(function (a, b) {
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    })
    .forEach(function (entry) {
      const team = entry[0];
      const score = entry[1];
      const row = node("div", "score-row");
      const meta = node("div", "person-meta");
      meta.append(node("b", "", team), node("span", "", "punkty drużyny"));
      const scoreValue = node("div", "score-value");
      scoreValue.append(node("strong", "", String(score)));

      if (profile && profile.role === "moderator") {
        const actions = node("div", "score-actions");
        const minus = node("button", "", "−1");
        const plus = node("button", "", "+1");
        minus.type = "button";
        plus.type = "button";
        minus.addEventListener("click", function () { mod("award", { team: team, points: -1 }); });
        plus.addEventListener("click", function () { mod("award", { team: team, points: 1 }); });
        actions.append(minus, plus);
        scoreValue.append(actions);
      }

      row.append(meta, scoreValue);
      scoreboard.append(row);
    });
}

function renderPeople() {
  peopleList.replaceChildren();
  state.people.forEach(function (person) {
    const row = node("div", "person-row");
    const meta = node("div", "person-meta");
    meta.append(node("b", "", person.nickname), node("span", "", person.role === "moderator" ? "Moderator" : person.team));
    const dot = node("span", "role-dot " + (person.role === "moderator" ? "moderator" : ""));
    row.append(meta, dot);
    peopleList.append(row);
  });
}

function renderTracks() {
  trackList.replaceChildren();
  trackCount.textContent = String(state.tracks.length);

  state.tracks.forEach(function (track) {
    const row = node("div", "track-row " + (track.id === state.currentTrackId ? "current" : ""));
    const meta = node("div", "track-meta");
    meta.append(
      node("b", "", track.title),
      node("span", "", (track.artist || "bez wykonawcy") + " · start " + formatSeconds(track.startAt))
    );
    const actions = node("div", "track-actions");
    const select = node("button", "", "Wybierz");
    const remove = node("button", "", "Usuń");
    select.type = "button";
    remove.type = "button";
    select.addEventListener("click", function () { mod("selectTrack", { trackId: track.id }); });
    remove.addEventListener("click", function () { mod("removeTrack", { trackId: track.id }); });
    actions.append(select, remove);
    row.append(meta, actions);
    trackList.append(row);
  });
}

function renderModerator() {
  if (!profile || profile.role !== "moderator") return;
  const buzzer = state.currentBuzzer;
  buzzedAtLabel.textContent = buzzer ? formatSeconds(buzzer.buzzedAt) + " · " + buzzer.label : "brak";
  decisionText.textContent = buzzer
    ? buzzer.nickname + " (" + buzzer.team + ") zatrzymał/a piosenkę. Sugerowane: " + buzzer.suggestedPoints + " pkt."
    : "Nikt jeszcze nie zatrzymał piosenki.";

  awardSuggestedButton.disabled = !buzzer || buzzer.suggestedPoints <= 0;
  awardTwoButton.disabled = !buzzer;
  awardOneButton.disabled = !buzzer;
  clearBuzzButton.disabled = !buzzer;
  resumeFromBuzzButton.disabled = state.phase !== "paused";

  clipDurationInput.value = state.settings.clipDuration;
  firstWindowInput.value = state.settings.firstWindow;
  secondWindowInput.value = state.settings.secondWindow;
}

function renderBuzzer() {
  const isPlayer = profile && profile.role === "player";
  const canBuzz = isPlayer && state.phase === "playing" && !state.currentBuzzer;
  buzzButton.disabled = !canBuzz;

  if (!isPlayer) {
    buzzCaption.textContent = "Panel moderatora steruje rundą.";
  } else if (state.currentBuzzer) {
    buzzCaption.textContent = state.currentBuzzer.nickname + " był/a pierwszy/a.";
  } else if (state.phase === "playing") {
    buzzCaption.textContent = "Wciśnij, gdy znasz tytuł.";
  } else if (state.phase === "paused") {
    buzzCaption.textContent = "Piosenka zatrzymana.";
  } else {
    buzzCaption.textContent = "Czeka na start rundy.";
  }
}

function tick() {
  if (!state) return;
  const currentElapsed = estimatedElapsed();
  const duration = state.settings.clipDuration || 10;
  progressFill.style.width = Math.min(100, (currentElapsed / duration) * 100) + "%";
  timeLabel.textContent = currentElapsed.toFixed(1) + " s";
  syncAudio();
}

function syncAudio(force) {
  if (!state || !state.currentTrack) {
    audio.pause();
    return;
  }

  const desiredUrl = new URL(state.currentTrack.audioUrl, location.href).href;
  if (audio.src !== desiredUrl) {
    audio.src = desiredUrl;
    audio.load();
  }

  const clipElapsed = estimatedElapsed();
  const desiredTime = state.currentTrack.startAt + clipElapsed;
  const drift = Math.abs((audio.currentTime || 0) - desiredTime);
  if (force || drift > 0.35) {
    try {
      audio.currentTime = desiredTime;
    } catch (error) {
      return;
    }
  }

  if (state.phase === "playing" && soundEnabled) {
    audio.play().catch(function () {
      showToast("Kliknij Włącz dźwięk przed startem rundy.");
    });
  } else {
    audio.pause();
  }
}

function phaseText(phase) {
  return {
    idle: "gotowe",
    playing: "gra",
    paused: "pauza",
    ended: "koniec"
  }[phase] || phase;
}

function formatSeconds(value) {
  return Number(value || 0).toFixed(1) + " s";
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

setInterval(tick, 100);
connect();
