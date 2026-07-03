const $ = (selector) => document.querySelector(selector);

const MODERATOR_PASSWORD = "Kochamkotki";
const SESSION_KEY = "animeOpeningQuizSession";
const DIFFICULTY_LABELS = {
  very_easy: "Very easy",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  impossible: "Impossible"
};

const loginView = $("#loginView");
const appView = $("#appView");
const loginForm = $("#loginForm");
const adminToggleButton = $("#adminToggleButton");
const backToPlayerButton = $("#backToPlayerButton");
const playerFields = $("#playerFields");
const adminFields = $("#adminFields");
const loginModeLabel = $("#loginModeLabel");
const loginTitle = $("#loginTitle");
const loginSubmitButton = $("#loginSubmitButton");
const nicknameInput = $("#nicknameInput");
const teamInput = $("#teamInput");
const groupPasswordInput = $("#groupPasswordInput");
const moderatorPasswordInput = $("#moderatorPasswordInput");
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
const trackAnimeInput = $("#trackAnimeInput");
const trackOpeningInput = $("#trackOpeningInput");
const trackDifficultyInput = $("#trackDifficultyInput");
const trackUrlInput = $("#trackUrlInput");
const trackStartFirstInput = $("#trackStartFirstInput");
const trackStartSecondInput = $("#trackStartSecondInput");
const trackSubmitButton = $("#trackSubmitButton");
const cancelEditButton = $("#cancelEditButton");
const trackList = $("#trackList");
const trackCount = $("#trackCount");
const playlistForm = $("#playlistForm");
const playlistUrlInput = $("#playlistUrlInput");
const playlistDifficultyInput = $("#playlistDifficultyInput");
const playlistImportButton = $("#playlistImportButton");
const playlistImportStatus = $("#playlistImportStatus");
const blockedIpList = $("#blockedIpList");
const playButton = $("#playButton");
const pauseButton = $("#pauseButton");
const resumeButton = $("#resumeButton");
const stopButton = $("#stopButton");
const previousButton = $("#previousButton");
const nextButton = $("#nextButton");
const resetScoresButton = $("#resetScoresButton");
const guessedButton = $("#guessedButton");
const awardSuggestedButton = $("#awardSuggestedButton");
const awardTwoButton = $("#awardTwoButton");
const awardOneButton = $("#awardOneButton");
const rejectBuzzButton = $("#rejectBuzzButton");
const resumeFromBuzzButton = $("#resumeFromBuzzButton");
const buzzedAtLabel = $("#buzzedAtLabel");
const decisionText = $("#decisionText");
const settingsForm = $("#settingsForm");
const toast = $("#toast");
const audio = $("#songAudio");

const scoreInputs = {
  very_easy: { first: $("#scoreVeryEasyFirst"), second: $("#scoreVeryEasySecond") },
  easy: { first: $("#scoreEasyFirst"), second: $("#scoreEasySecond") },
  medium: { first: $("#scoreMediumFirst"), second: $("#scoreMediumSecond") },
  hard: { first: $("#scoreHardFirst"), second: $("#scoreHardSecond") },
  impossible: { first: $("#scoreImpossibleFirst"), second: $("#scoreImpossibleSecond") }
};

let socket = null;
let state = null;
let profile = null;
let ownId = null;
let loginMode = "player";
let lastStateAt = Date.now();
let soundEnabled = false;
let reconnectTimer = null;
let toastTimer = null;
let editingTrackId = null;
let lastAudioErrorAt = 0;
let youtubeApiRequested = false;
let youtubeApiReady = false;
let youtubePlayer = null;
let youtubePlayerReady = false;
let youtubeVideoId = "";
let lastMediaKey = "";
let lastMediaSegment = "";
let lastYouTubeKey = "";
let lastYouTubeSegment = "";

const query = new URLSearchParams(location.search);
if (query.get("room")) roomInput.value = query.get("room");

window.onYouTubeIframeAPIReady = function () {
  youtubeApiReady = true;
  syncAudio(true);
};

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function cleanRoom(value) {
  return String(value || "LOBBY")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 18) || "LOBBY";
}

function saveSession() {
  if (!profile) return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      clientId: profile.clientId,
      nickname: profile.nickname,
      team: profile.team,
      groupPassword: profile.groupPassword,
      moderatorPassword: profile.moderatorPassword,
      roomCode: profile.roomCode,
      role: profile.role
    }));
  } catch (error) {}
}

function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!saved || typeof saved !== "object") return null;
    const role = saved.role === "moderator" ? "moderator" : "player";
    const roomCode = cleanRoom(saved.roomCode);
    const queryRoom = query.get("room") ? cleanRoom(query.get("room")) : "";
    if (queryRoom && queryRoom !== roomCode) return null;
    return {
      clientId: String(saved.clientId || makeClientId()).slice(0, 80),
      nickname: String(saved.nickname || "").slice(0, 40),
      team: String(saved.team || "").slice(0, 32),
      groupPassword: String(saved.groupPassword || "").slice(0, 80),
      moderatorPassword: String(saved.moderatorPassword || "").slice(0, 80),
      roomCode: roomCode,
      role: role
    };
  } catch (error) {
    return null;
  }
}

function makeClientId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return "client_" + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {}
}

function fillLoginFields(saved) {
  nicknameInput.value = saved.nickname || "";
  roomInput.value = saved.roomCode || "LOBBY";
  teamInput.value = saved.team || "";
  groupPasswordInput.value = saved.groupPassword || "";
  moderatorPasswordInput.value = saved.moderatorPassword || "";
}

function showAppForProfile() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  moderatorPanel.classList.toggle("hidden", profile.role !== "moderator");
  roleLabel.textContent = profile.role === "moderator" ? "♛ administrator" : profile.nickname + " / " + profile.team;
  roomCodeLabel.textContent = profile.roomCode;
}

function setLoginMode(mode) {
  loginMode = mode;
  const isAdmin = mode === "moderator";
  playerFields.classList.toggle("hidden", isAdmin);
  adminFields.classList.toggle("hidden", !isAdmin);
  adminToggleButton.classList.toggle("hidden", isAdmin);
  loginModeLabel.textContent = isAdmin ? "administrator" : "gracz";
  loginTitle.textContent = isAdmin ? "Panel administratora" : "Dolacz do gry";
  loginSubmitButton.textContent = isAdmin ? "Wejdz jako administrator" : "Wejdz jako gracz";
  teamInput.required = !isAdmin;
  groupPasswordInput.required = !isAdmin;
  moderatorPasswordInput.required = isAdmin;
  if (isAdmin) moderatorPasswordInput.focus();
}

function connect() {
  if (socket && socket.readyState <= 1) return;

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(protocol + "//" + location.host);
  connectionStatus.textContent = "laczenie";

  socket.addEventListener("open", function () {
    connectionStatus.textContent = "online";
    if (profile) sendJoin();
  });

  socket.addEventListener("message", function (event) {
    const payload = JSON.parse(event.data);
    if (payload.type === "hello") ownId = payload.id;
    if (payload.type === "state") {
      state = payload.room;
      lastStateAt = Date.now();
      render();
      syncAudio();
    }
    if (payload.type === "error") {
      if (playlistImportButton) playlistImportButton.disabled = false;
      if (playlistImportStatus) playlistImportStatus.textContent = payload.message;
      showToast(payload.message);
    }
    if (payload.type === "joinRejected") returnToLogin(payload.message);
    if (payload.type === "kicked") returnToLogin(payload.message || "Administrator wyrzucil Cie z gry.");
    if (payload.type === "playlistImported") {
      if (playlistImportButton) playlistImportButton.disabled = false;
      if (playlistImportStatus) playlistImportStatus.textContent = payload.message;
      if (playlistUrlInput) playlistUrlInput.value = "";
      showToast(payload.message);
    }
    if (payload.type === "joined") {
      ownId = payload.id;
      if (profile) profile.roomCode = payload.roomCode;
      saveSession();
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
    clientId: profile.clientId,
    nickname: profile.nickname,
    team: profile.team,
    groupPassword: profile.groupPassword,
    moderatorPassword: profile.moderatorPassword,
    roomCode: profile.roomCode,
    role: profile.role
  });
}

function join(role) {
  const nickname = nicknameInput.value.trim() || (role === "moderator" ? "Administrator" : "Gracz");
  const roomCode = cleanRoom(roomInput.value);
  const team = teamInput.value.trim();
  const groupPassword = groupPasswordInput.value.trim();
  const moderatorPassword = moderatorPasswordInput.value.trim();

  if (role === "moderator" && moderatorPassword !== MODERATOR_PASSWORD) {
    showToast("Wpisz poprawne haslo administratora.");
    return;
  }

  if (role === "player") {
    if (!team) return showToast("Wpisz nazwe grupy.");
    if (!groupPassword) return showToast("Wpisz haslo grupy.");
  }

  profile = { clientId: makeClientId(), nickname, team, groupPassword, moderatorPassword, roomCode, role };
  saveSession();
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  moderatorPanel.classList.toggle("hidden", role !== "moderator");
  roleLabel.textContent = role === "moderator" ? "♛ administrator" : nickname + " / " + team;
  roomCodeLabel.textContent = roomCode;
  connect();
  sendJoin();
}

function returnToLogin(message) {
  clearSession();
  profile = null;
  state = null;
  soundEnabled = false;
  editingTrackId = null;
  audio.pause();
  pauseYouTube();
  if (socket) socket.close();
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
  moderatorPanel.classList.add("hidden");
  resetTrackForm();
  if (message) showToast(message);
}

function restoreSession() {
  const saved = loadSession();
  if (!saved) return;
  fillLoginFields(saved);
  setLoginMode(saved.role);
  profile = saved;
  showAppForProfile();
  connect();
}

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  join(loginMode);
});

adminToggleButton.addEventListener("click", () => setLoginMode("moderator"));
backToPlayerButton.addEventListener("click", () => setLoginMode("player"));
leaveButton.addEventListener("click", () => returnToLogin("Wyszedles z pokoju."));

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
  soundButton.textContent = "Dzwiek wlaczony";
  requestYouTubeApi();
  syncAudio(true);
});

buzzButton.addEventListener("click", () => send({ type: "buzz" }));

trackForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const payload = {
    track: {
      anime: trackAnimeInput.value,
      opening: trackOpeningInput.value,
      difficulty: trackDifficultyInput.value,
      audioUrl: trackUrlInput.value,
      startAtFirst: Number(trackStartFirstInput.value || 0),
      startAtSecond: Number(trackStartSecondInput.value || 5)
    }
  };

  if (editingTrackId) {
    mod("updateTrack", Object.assign({ trackId: editingTrackId }, payload));
  } else {
    mod("addTrack", payload);
  }
  resetTrackForm();
});

playlistForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const playlistUrl = playlistUrlInput.value.trim();
  if (!playlistUrl) return showToast("Wklej link do playlisty YouTube.");

  playlistImportButton.disabled = true;
  playlistImportStatus.textContent = "Importowanie playlisty...";
  mod("importPlaylist", {
    playlistUrl: playlistUrl,
    difficulty: playlistDifficultyInput.value
  });
});

cancelEditButton.addEventListener("click", resetTrackForm);

settingsForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const difficultyScores = {};
  Object.keys(scoreInputs).forEach(function (key) {
    difficultyScores[key] = {
      first: Number(scoreInputs[key].first.value || 0),
      second: Number(scoreInputs[key].second.value || 0)
    };
  });
  mod("updateSettings", { settings: { difficultyScores } });
});

playButton.addEventListener("click", () => mod("play"));
pauseButton.addEventListener("click", () => mod("pause"));
resumeButton.addEventListener("click", () => mod("resume"));
stopButton.addEventListener("click", () => mod("stop"));
previousButton.addEventListener("click", () => mod("previousTrack"));
nextButton.addEventListener("click", () => mod("nextTrack"));
resetScoresButton.addEventListener("click", () => mod("resetScores"));
guessedButton.addEventListener("click", () => mod("guessed"));
resumeFromBuzzButton.addEventListener("click", () => mod("resume"));
rejectBuzzButton.addEventListener("click", () => mod("rejectBuzz"));
awardSuggestedButton.addEventListener("click", () => award((state && state.currentBuzzer && state.currentBuzzer.suggestedPoints) || 0));
awardTwoButton.addEventListener("click", () => award(2));
awardOneButton.addEventListener("click", () => award(1));

function mod(action, data) {
  send(Object.assign({ type: "moderator", action }, data || {}));
}

function award(points) {
  const buzzer = state && state.currentBuzzer;
  if (!buzzer) return;
  mod("award", { team: buzzer.team, points, playerId: buzzer.id });
  mod("revealTitle");
  mod("clearBuzz");
}

function estimatedElapsed() {
  if (!state) return 0;
  if (state.phase !== "playing") return state.offset || 0;
  const localDelta = (Date.now() - lastStateAt) / 1000;
  return Math.min(state.settings.clipDuration, Math.max(0, (state.offset || 0) + localDelta));
}

function scoreWindowText() {
  if (!state || !state.currentTrack) return "0-5 s / 5-10 s";
  const difficulty = state.currentTrack.difficulty || "medium";
  const scores = state.settings.difficultyScores[difficulty] || { first: 0, second: 0 };
  return DIFFICULTY_LABELS[difficulty] + ": " + scores.first + " pkt 0-5 s / " + scores.second + " pkt 5-10 s";
}

function render() {
  if (!state) return;

  roomCodeLabel.textContent = state.code;
  renderTrackHeader();
  phaseLabel.textContent = phaseText(state.phase);
  scoreWindowLabel.textContent = scoreWindowText();
  peopleCount.textContent = state.people.length + " osob";

  document.documentElement.style.setProperty("--good-width", "50%");
  document.documentElement.style.setProperty("--ok-width", "50%");

  renderScores();
  renderPeople();
  renderTracks();
  renderModerator();
  renderBlockedIps();
  renderBuzzer();
}

function renderTrackHeader() {
  const track = state.currentTrack;
  if (!track) {
    trackTitle.textContent = "Brak openingu";
    trackArtist.textContent = "Administrator dodaje anime i opening w panelu.";
    return;
  }

  trackTitle.textContent = track.anime || "Anime ukryte";
  if (track.revealed) {
    const sourceLabel = track.source === "youtube" ? "YouTube" : "audio";
    trackArtist.textContent = track.opening || sourceLabel;
  } else {
    trackArtist.textContent = "Anime i opening pokaza sie po czasie albo po kliknieciu Zgadniete.";
  }
}

function renderScores() {
  scoreboard.replaceChildren();
  const groups = state.groups && state.groups.length
    ? state.groups.map((group) => [group.name, group.score, group.blockedThisRound])
    : Object.entries(state.teams).map((entry) => [entry[0], entry[1], false]);

  if (!groups.length) {
    scoreboard.append(node("p", "muted empty-row", "Nie ma jeszcze grup."));
    return;
  }

  groups.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(function (entry) {
    const team = entry[0];
    const score = entry[1];
    const blocked = entry[2];
    const row = node("div", "score-row");
    const meta = node("div", "person-meta");
    meta.append(node("b", "", team), node("span", "", blocked ? "zablokowana w tej rundzie" : "punkty grupy"));
    const scoreValue = node("div", "score-value");
    scoreValue.append(node("strong", "", String(score)));

    if (profile && profile.role === "moderator") {
      const actions = node("div", "score-actions");
      const minus = node("button", "", "-1");
      const plus = node("button", "", "+1");
      const remove = node("button", "danger-button", "Usun");
      minus.type = "button";
      plus.type = "button";
      remove.type = "button";
      remove.title = "Usun grupe";
      minus.addEventListener("click", () => mod("award", { team, points: -1 }));
      plus.addEventListener("click", () => mod("award", { team, points: 1 }));
      remove.addEventListener("click", () => mod("removeGroup", { team }));
      actions.append(minus, plus, remove);
      scoreValue.append(actions);
    }

    row.append(meta, scoreValue);
    scoreboard.append(row);
  });
}

function renderPeopleFlatDeprecated() {
  peopleList.replaceChildren();
  if (!state.people.length) {
    peopleList.append(node("p", "muted empty-row", "Nie ma jeszcze osob w pokoju."));
    return;
  }

  state.people.forEach(function (person) {
    const row = node("div", "person-row");
    const meta = node("div", "person-meta");
    const name = (person.isMvp ? "♛ " : "") + person.nickname;
    const details = person.role === "moderator"
      ? "Administrator"
      : person.team + " / " + Number(person.personalScore || 0) + " pkt osobiste";
    meta.append(node("b", "", name), node("span", "", details));

    if (person.blockedThisRound) meta.append(node("span", "blocked-note", "Ta grupa juz probowala."));
    if (profile && profile.role === "moderator" && person.ip) meta.append(node("span", "", "IP: " + person.ip));

    if (profile && profile.role === "moderator" && person.role === "player") {
      const actions = node("div", "person-actions");
      const kick = node("button", "", "Wyrzuc");
      const blockIp = node("button", "", "Blokuj IP");
      kick.type = "button";
      blockIp.type = "button";
      kick.addEventListener("click", () => mod("kickPlayer", { playerId: person.id }));
      blockIp.addEventListener("click", () => mod("blockIp", { playerId: person.id }));
      actions.append(kick, blockIp);
      row.append(meta, actions);
    } else {
      const dot = node("span", "role-dot " + (person.role === "moderator" ? "moderator" : ""));
      row.append(meta, dot);
    }

    peopleList.append(row);
  });
}

function groupedPersonRow(person) {
  const row = node("div", "person-row");
  const meta = node("div", "person-meta");
  const name = (person.isMvp ? "\u265B " : "") + person.nickname;
  const details = person.role === "moderator"
    ? "Administrator"
    : Number(person.personalScore || 0) + " pkt osobiste";
  meta.append(node("b", "", name), node("span", "", details));

  if (person.blockedThisRound) meta.append(node("span", "blocked-note", "Ta grupa juz probowala."));
  if (profile && profile.role === "moderator" && person.ip) meta.append(node("span", "", "IP: " + person.ip));

  if (profile && profile.role === "moderator" && person.role === "player") {
    const actions = node("div", "person-actions");
    const kick = node("button", "", "Wyrzuc");
    const blockIp = node("button", "", "Blokuj IP");
    kick.type = "button";
    blockIp.type = "button";
    kick.addEventListener("click", () => mod("kickPlayer", { playerId: person.id }));
    blockIp.addEventListener("click", () => mod("blockIp", { playerId: person.id }));
    actions.append(kick, blockIp);
    row.append(meta, actions);
  } else {
    const dot = node("span", "role-dot " + (person.role === "moderator" ? "moderator" : ""));
    row.append(meta, dot);
  }

  return row;
}

function renderPeople() {
  peopleList.replaceChildren();
  if (!state.people.length) {
    peopleList.append(node("p", "muted empty-row", "Nie ma jeszcze osob w pokoju."));
    return;
  }

  const groups = new Map();
  const order = [];

  function ensureGroup(name) {
    if (!groups.has(name)) {
      groups.set(name, []);
      order.push(name);
    }
  }

  if (state.people.some((person) => person.role === "moderator")) ensureGroup("Administrator");
  (state.groups || []).forEach((group) => ensureGroup(group.name));

  state.people.forEach(function (person) {
    const groupName = person.role === "moderator" ? "Administrator" : (person.team || "Bez grupy");
    ensureGroup(groupName);
    groups.get(groupName).push(person);
  });

  order.forEach(function (groupName) {
    const people = groups.get(groupName) || [];
    if (!people.length) return;

    const group = node("div", "people-group");
    const title = node("div", "people-group-title");
    title.append(node("b", "", groupName), node("span", "", people.length + " os."));
    const members = node("div", "people-group-members");
    people.forEach((person) => members.append(groupedPersonRow(person)));
    group.append(title, members);
    peopleList.append(group);
  });
}

function renderTracks() {
  trackList.replaceChildren();
  trackCount.textContent = String(state.tracks.length);

  if (!state.tracks.length) {
    trackList.append(node("p", "muted empty-row", "Brak zapisanych openingow."));
    return;
  }

  state.tracks.forEach(function (track) {
    const result = track.result || null;
    const resultClass = result && result.status === "guessed" ? " result-guessed" : (result && result.status === "missed" ? " result-missed" : "");
    const row = node("div", "track-row " + (track.id === state.currentTrackId ? "current" : "") + resultClass);
    const meta = node("div", "track-meta");
    meta.append(
      node("b", "", track.anime || "Anime bez nazwy"),
      node("span", "", (track.opening || "opening bez nazwy") + " / " + DIFFICULTY_LABELS[track.difficulty || "medium"] + " / " + (track.source === "youtube" ? "YouTube" : "audio") + " / 0-5 od " + formatSeconds(track.startAtFirst) + " / 5-10 od " + formatSeconds(track.startAtSecond))
    );
    if (result) meta.append(node("span", "track-result", trackResultText(result)));
    const actions = node("div", "track-actions");
    const select = node("button", "", "Wybierz");
    const edit = node("button", "", "Edytuj");
    const remove = node("button", "", "Usun");
    select.type = "button";
    edit.type = "button";
    remove.type = "button";
    select.addEventListener("click", () => mod("selectTrack", { trackId: track.id }));
    edit.addEventListener("click", () => editTrack(track));
    remove.addEventListener("click", () => mod("removeTrack", { trackId: track.id }));
    actions.append(select, edit, remove);
    row.append(meta, actions);
    trackList.append(row);
  });
}

function editTrack(track) {
  editingTrackId = track.id;
  trackAnimeInput.value = track.anime || "";
  trackOpeningInput.value = track.opening || "";
  trackDifficultyInput.value = track.difficulty || "medium";
  trackUrlInput.value = track.audioUrl || "";
  trackStartFirstInput.value = String(finiteNumber(track.startAtFirst, 0));
  trackStartSecondInput.value = String(finiteNumber(track.startAtSecond, 5));
  trackSubmitButton.textContent = "Zapisz";
  cancelEditButton.classList.remove("hidden");
  trackAnimeInput.focus();
}

function resetTrackForm() {
  editingTrackId = null;
  if (!trackAnimeInput) return;
  trackAnimeInput.value = "";
  trackOpeningInput.value = "";
  trackDifficultyInput.value = "medium";
  trackUrlInput.value = "";
  trackStartFirstInput.value = "0";
  trackStartSecondInput.value = "5";
  trackSubmitButton.textContent = "Dodaj";
  cancelEditButton.classList.add("hidden");
}

function renderBlockedIps() {
  if (!blockedIpList || !profile || profile.role !== "moderator") return;
  const blockedIps = state.blockedIps || [];
  blockedIpList.replaceChildren();

  if (!blockedIps.length) {
    blockedIpList.append(node("p", "muted empty-row", "Brak zablokowanych IP."));
    return;
  }

  blockedIps.forEach(function (block) {
    const row = node("div", "blocked-ip-row");
    const meta = node("div", "blocked-ip-meta");
    const addedAt = block.at ? new Date(block.at * 1000).toLocaleString("pl-PL") : "";
    meta.append(
      node("b", "", block.ip),
      node("span", "", (block.nickname || "Gracz") + " / " + (block.team || "Druzyna"))
    );
    if (addedAt) meta.append(node("span", "", "Dodano: " + addedAt));

    const actions = node("div", "blocked-ip-actions");
    const unblock = node("button", "", "Odblokuj");
    unblock.type = "button";
    unblock.addEventListener("click", () => mod("unblockIp", { ip: block.ip }));
    actions.append(unblock);
    row.append(meta, actions);
    blockedIpList.append(row);
  });
}

function renderModerator() {
  if (!profile || profile.role !== "moderator") return;
  const buzzer = state.currentBuzzer;
  buzzedAtLabel.textContent = buzzer ? formatSeconds(buzzer.buzzedAt) + " / " + buzzer.label : "brak";
  decisionText.textContent = buzzer
    ? buzzer.nickname + " (" + buzzer.team + ") zatrzymal/a opening. Zgadniete doda automatycznie: " + buzzer.suggestedPoints + " pkt."
    : "Nikt jeszcze nie zatrzymal openingu.";

  guessedButton.disabled = !buzzer;
  awardSuggestedButton.disabled = !buzzer || buzzer.suggestedPoints <= 0;
  awardTwoButton.disabled = !buzzer;
  awardOneButton.disabled = !buzzer;
  rejectBuzzButton.disabled = !buzzer;
  resumeFromBuzzButton.disabled = state.phase !== "paused";

  const settings = state.settings.difficultyScores || {};
  Object.keys(scoreInputs).forEach(function (key) {
    const scores = settings[key] || { first: 0, second: 0 };
    scoreInputs[key].first.value = scores.first;
    scoreInputs[key].second.value = scores.second;
  });
}

function renderBuzzer() {
  const isPlayer = profile && profile.role === "player";
  const lockedGroups = state.lockedGroups || [];
  const blocked = isPlayer && lockedGroups.includes(profile.team);
  const canBuzz = isPlayer && state.phase === "playing" && !state.currentBuzzer && !blocked;
  buzzButton.disabled = !canBuzz;

  if (!isPlayer) {
    buzzCaption.textContent = "Panel administratora steruje runda.";
  } else if (blocked) {
    buzzCaption.textContent = "Twoja grupa juz probowala w tej rundzie.";
  } else if (state.revealed) {
    buzzCaption.textContent = "Anime i opening zostaly pokazane.";
  } else if (state.currentBuzzer) {
    buzzCaption.textContent = state.currentBuzzer.nickname + " byl/a pierwszy/a.";
  } else if (state.phase === "playing") {
    buzzCaption.textContent = "Wcisnij Zgaduje!, gdy znasz opening.";
  } else if (state.phase === "paused") {
    buzzCaption.textContent = "Opening zatrzymany.";
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

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function desiredSourceTime(track, clipElapsed) {
  const split = (state && state.settings && state.settings.segmentSplit) || 5;
  if (clipElapsed < split) {
    return {
      segment: "first",
      seconds: finiteNumber(track.startAtFirst, 0) + clipElapsed
    };
  }
  return {
    segment: "second",
    seconds: finiteNumber(track.startAtSecond, finiteNumber(track.startAtFirst, 0) + split) + (clipElapsed - split)
  };
}

function syncAudio(force) {
  if (!state || !state.currentTrack) {
    audio.pause();
    pauseYouTube();
    return;
  }

  const track = state.currentTrack;
  if (track.source === "youtube") {
    syncYouTube(track, force);
    return;
  }

  pauseYouTube();
  const desiredUrl = new URL(track.audioUrl, location.href).href;
  if (audio.src !== desiredUrl) {
    audio.src = desiredUrl;
    audio.load();
  }

  const timing = desiredSourceTime(track, estimatedElapsed());
  const desiredTime = timing.seconds;
  const mediaKey = track.id + "|" + track.audioUrl;
  const drift = Math.abs((audio.currentTime || 0) - desiredTime);

  if (Number.isFinite(audio.duration) && audio.duration > 0 && desiredTime > audio.duration) {
    if (Date.now() - lastAudioErrorAt > 2500) {
      lastAudioErrorAt = Date.now();
      showToast("Ten plik audio jest krotszy niz ustawiony start " + formatSeconds(desiredTime) + ".");
    }
  }

  if (force || drift > 0.35 || lastMediaKey !== mediaKey || lastMediaSegment !== timing.segment) {
    try {
      audio.currentTime = desiredTime;
      lastMediaKey = mediaKey;
      lastMediaSegment = timing.segment;
    } catch (error) {
      return;
    }
  }

  if (state.phase === "playing" && soundEnabled) {
    audio.play().catch(function () {
      if (Date.now() - lastAudioErrorAt > 2500) {
        lastAudioErrorAt = Date.now();
        showToast("Kliknij Wlacz dzwiek przed startem rundy.");
      }
    });
  } else {
    audio.pause();
  }
}

function requestYouTubeApi() {
  if (window.YT && window.YT.Player) {
    youtubeApiReady = true;
    return true;
  }
  if (!youtubeApiRequested) {
    youtubeApiRequested = true;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.append(script);
  }
  return false;
}

function ensureYouTubePlayer(track, desiredTime) {
  if (!track.videoId) {
    showToast("Ten link YouTube nie ma poprawnego ID filmu.");
    return false;
  }
  if (!requestYouTubeApi()) return false;

  if (!youtubePlayer) {
    youtubePlayer = new YT.Player("youtubePlayer", {
      height: "200",
      width: "240",
      videoId: track.videoId,
      playerVars: {
        playsinline: 1,
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        origin: location.origin
      },
      events: {
        onReady: function () {
          youtubePlayerReady = true;
          youtubeVideoId = track.videoId;
          try {
            youtubePlayer.unMute();
            youtubePlayer.setVolume(100);
            youtubePlayer.seekTo(desiredTime, true);
            youtubePlayer.pauseVideo();
          } catch (error) {}
          syncAudio(true);
        }
      }
    });
    return false;
  }

  if (!youtubePlayerReady) return false;

  if (youtubeVideoId !== track.videoId) {
    youtubeVideoId = track.videoId;
    youtubePlayer.loadVideoById({ videoId: track.videoId, startSeconds: desiredTime });
    if (!(state.phase === "playing" && soundEnabled)) youtubePlayer.pauseVideo();
  }

  return true;
}

function syncYouTube(track, force) {
  audio.pause();
  const timing = desiredSourceTime(track, estimatedElapsed());
  const desiredTime = timing.seconds;
  const mediaKey = track.id + "|" + track.videoId;
  if (!ensureYouTubePlayer(track, desiredTime)) return;

  try {
    const currentTime = youtubePlayer.getCurrentTime ? youtubePlayer.getCurrentTime() : 0;
    const drift = Math.abs((currentTime || 0) - desiredTime);
    if (force || drift > 0.75 || lastYouTubeKey !== mediaKey || lastYouTubeSegment !== timing.segment) {
      youtubePlayer.seekTo(desiredTime, true);
      lastYouTubeKey = mediaKey;
      lastYouTubeSegment = timing.segment;
    }

    if (state.phase === "playing" && soundEnabled) {
      youtubePlayer.unMute();
      youtubePlayer.setVolume(100);
      youtubePlayer.playVideo();
    } else {
      youtubePlayer.pauseVideo();
    }
  } catch (error) {}
}

function pauseYouTube() {
  try {
    if (youtubePlayerReady && youtubePlayer && youtubePlayer.pauseVideo) youtubePlayer.pauseVideo();
  } catch (error) {}
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

function trackResultText(result) {
  if (result.status === "guessed") {
    return "Zgadl/a: " + result.nickname + " / " + result.team + " / +" + result.points + " pkt przy " + formatSeconds(result.buzzedAt);
  }
  if (result.status === "missed") return "Nikt nie zgadl tej piosenki.";
  return "";
}

setLoginMode("player");
restoreSession();
setInterval(tick, 100);
