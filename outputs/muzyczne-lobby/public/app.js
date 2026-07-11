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
const groupModeRadio = $("#groupModeRadio");
const soloModeRadio = $("#soloModeRadio");
const groupFields = $("#groupFields");
const teamInput = $("#teamInput");
const groupPasswordInput = $("#groupPasswordInput");
const avatarInput = $("#avatarInput");
const avatarPreview = $("#avatarPreview");
const avatarCropPanel = $("#avatarCropPanel");
const avatarCropStage = $("#avatarCropStage");
const avatarCropImage = $("#avatarCropImage");
const avatarApplyCropButton = $("#avatarApplyCropButton");
const avatarClearButton = $("#avatarClearButton");
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
const answerCountdown = $("#answerCountdown");
const answerCountdownLabel = $("#answerCountdownLabel");
const answerCountdownValue = $("#answerCountdownValue");
const answerCountdownFill = $("#answerCountdownFill");
const scoreboard = $("#scoreboard");
const scoreTitle = $("#scoreTitle");
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
const youtubeSearchForm = $("#youtubeSearchForm");
const youtubeSearchInput = $("#youtubeSearchInput");
const youtubeSearchButton = $("#youtubeSearchButton");
const youtubeSearchResults = $("#youtubeSearchResults");
const libraryList = $("#libraryList");
const libraryCount = $("#libraryCount");
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
const buzzDecision = $("#buzzDecision");
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
let lastYouTubeError = "";
let lastMediaKey = "";
let lastMediaSegment = "";
let lastYouTubeKey = "";
let lastYouTubeSegment = "";
let latestSearchResults = [];
let avatarData = "";
let avatarCropSource = null;
let avatarCrop = {
  zoom: 1,
  x: 0,
  y: 0,
  dragging: false,
  startPointerX: 0,
  startPointerY: 0,
  startX: 0,
  startY: 0
};

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
      role: profile.role,
      playMode: profile.playMode || "group",
      avatar: profile.avatar || ""
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
      role: role,
      playMode: saved.playMode === "solo" ? "solo" : "group",
      avatar: String(saved.avatar || "").slice(0, 180000)
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

function renderAvatarPreview() {
  if (!avatarPreview) return;
  avatarPreview.style.backgroundImage = avatarData ? "url(" + avatarData + ")" : "";
  avatarPreview.textContent = avatarData ? "" : "+";
}

function readFileAsDataUrl(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise(function (resolve, reject) {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function makeAvatarData(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  return cropAvatarImage(image, 1, 0, 0);
}

function cropAvatarImage(image, zoom, offsetX, offsetY) {
  const size = 160;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const safeZoom = Math.max(1, Math.min(3, Number(zoom) || 1));
  const safeOffsetX = Math.max(-4, Math.min(4, Number(offsetX) || 0));
  const safeOffsetY = Math.max(-4, Math.min(4, Number(offsetY) || 0));
  const scale = Math.max(size / image.width, size / image.height) * safeZoom;
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = (size - drawWidth) / 2 + safeOffsetX * size * 0.18;
  const drawY = (size - drawHeight) / 2 + safeOffsetY * size * 0.18;
  canvas.width = size;
  canvas.height = size;
  context.clearRect(0, 0, size, size);
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  return canvas.toDataURL("image/png");
}

function updateAvatarCropPreview() {
  if (!avatarCropImage || !avatarCropSource) return;
  avatarCropImage.style.transform = "translate(" + (avatarCrop.x * 18) + "%, " + (avatarCrop.y * 18) + "%) scale(" + avatarCrop.zoom + ")";
}

function applyAvatarCrop() {
  if (!avatarCropSource) return;
  avatarData = cropAvatarImage(
    avatarCropSource,
    avatarCrop.zoom,
    avatarCrop.x,
    avatarCrop.y
  );
  renderAvatarPreview();
}

async function prepareAvatarCrop(file) {
  const dataUrl = await readFileAsDataUrl(file);
  avatarCropSource = await loadImage(dataUrl);
  avatarCropImage.src = dataUrl;
  avatarCrop.zoom = 1;
  avatarCrop.x = 0;
  avatarCrop.y = 0;
  avatarCrop.dragging = false;
  avatarCropPanel.classList.remove("hidden");
  updateAvatarCropPreview();
  applyAvatarCrop();
}

function clearAvatarCrop() {
  avatarData = "";
  avatarCropSource = null;
  avatarCrop.zoom = 1;
  avatarCrop.x = 0;
  avatarCrop.y = 0;
  avatarCrop.dragging = false;
  if (avatarInput) avatarInput.value = "";
  if (avatarCropImage) avatarCropImage.removeAttribute("src");
  if (avatarCropPanel) avatarCropPanel.classList.add("hidden");
  renderAvatarPreview();
}

function clampAvatarCrop(value) {
  return Math.max(-4, Math.min(4, value));
}

function startAvatarDrag(event) {
  if (!avatarCropSource) return;
  avatarCrop.dragging = true;
  avatarCrop.startPointerX = event.clientX;
  avatarCrop.startPointerY = event.clientY;
  avatarCrop.startX = avatarCrop.x;
  avatarCrop.startY = avatarCrop.y;
  avatarCropStage.classList.add("dragging");
  avatarCropStage.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function moveAvatarDrag(event) {
  if (!avatarCrop.dragging || !avatarCropSource) return;
  const rect = avatarCropStage.getBoundingClientRect();
  const scale = Math.max(rect.width, rect.height) || 1;
  avatarCrop.x = clampAvatarCrop(avatarCrop.startX + ((event.clientX - avatarCrop.startPointerX) / scale) * 4);
  avatarCrop.y = clampAvatarCrop(avatarCrop.startY + ((event.clientY - avatarCrop.startPointerY) / scale) * 4);
  updateAvatarCropPreview();
}

function stopAvatarDrag(event) {
  if (!avatarCrop.dragging) return;
  avatarCrop.dragging = false;
  avatarCropStage.classList.remove("dragging");
  if (event && avatarCropStage.hasPointerCapture(event.pointerId)) avatarCropStage.releasePointerCapture(event.pointerId);
  applyAvatarCrop();
}

function zoomAvatarCrop(event) {
  if (!avatarCropSource) return;
  event.preventDefault();
  const direction = event.deltaY < 0 ? 1 : -1;
  avatarCrop.zoom = Math.max(1, Math.min(3, avatarCrop.zoom + direction * 0.12));
  updateAvatarCropPreview();
  applyAvatarCrop();
}

function fillLoginFields(saved) {
  nicknameInput.value = saved.nickname || "";
  roomInput.value = saved.roomCode || "LOBBY";
  teamInput.value = saved.team || "";
  groupPasswordInput.value = saved.groupPassword || "";
  if (soloModeRadio) soloModeRadio.checked = saved.playMode === "solo";
  if (groupModeRadio) groupModeRadio.checked = saved.playMode !== "solo";
  moderatorPasswordInput.value = saved.moderatorPassword || "";
  avatarData = saved.avatar || "";
  renderAvatarPreview();
  updatePlayerModeFields();
}

function currentPlayMode() {
  return soloModeRadio && soloModeRadio.checked ? "solo" : "group";
}

function updatePlayerModeFields() {
  const isAdmin = loginMode === "moderator";
  const isSolo = currentPlayMode() === "solo";
  if (groupFields) groupFields.classList.toggle("hidden", isSolo);
  if (teamInput) teamInput.required = !isAdmin && !isSolo;
  if (groupPasswordInput) groupPasswordInput.required = !isAdmin && !isSolo;
}

function showAppForProfile() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  moderatorPanel.classList.toggle("hidden", profile.role !== "moderator");
  roleLabel.textContent = profile.role === "moderator" ? "♛ administrator" : profile.nickname + (profile.playMode === "solo" ? "" : " / " + profile.team);
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
  moderatorPasswordInput.required = isAdmin;
  updatePlayerModeFields();
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
      if (youtubeSearchButton) youtubeSearchButton.disabled = false;
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
    if (payload.type === "youtubeSearchResults") {
      latestSearchResults = payload.results || [];
      if (youtubeSearchButton) youtubeSearchButton.disabled = false;
      renderSearchResults();
      showToast("Znaleziono wynikow: " + latestSearchResults.length + ".");
    }
    if (payload.type === "joined") {
      ownId = payload.id;
      if (profile) {
        profile.roomCode = payload.roomCode;
        if (payload.team) profile.team = payload.team;
        if (payload.playMode) profile.playMode = payload.playMode;
        roleLabel.textContent = profile.role === "moderator" ? "♛ administrator" : profile.nickname + (profile.playMode === "solo" ? "" : " / " + profile.team);
      }
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
    role: profile.role,
    playMode: profile.playMode || "group",
    avatar: profile.avatar || ""
  });
}

function join(role) {
  const nickname = nicknameInput.value.trim() || (role === "moderator" ? "Administrator" : "Gracz");
  const roomCode = cleanRoom(roomInput.value);
  const playMode = role === "player" ? currentPlayMode() : "group";
  const team = playMode === "solo" ? nickname : teamInput.value.trim();
  const groupPassword = playMode === "solo" ? "" : groupPasswordInput.value.trim();
  const moderatorPassword = moderatorPasswordInput.value.trim();

  if (role === "moderator" && moderatorPassword !== MODERATOR_PASSWORD) {
    showToast("Wpisz poprawne haslo administratora.");
    return;
  }

  if (role === "player" && playMode !== "solo") {
    if (!team) return showToast("Wpisz nazwe grupy.");
    if (!groupPassword) return showToast("Wpisz haslo grupy.");
  }

  if (avatarCropSource) applyAvatarCrop();
  profile = { clientId: makeClientId(), nickname, team, groupPassword, moderatorPassword, roomCode, role, playMode, avatar: avatarData };
  saveSession();
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  moderatorPanel.classList.toggle("hidden", role !== "moderator");
  roleLabel.textContent = role === "moderator" ? "♛ administrator" : nickname + (playMode === "solo" ? "" : " / " + team);
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
  clearAvatarCrop();
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
if (groupModeRadio) groupModeRadio.addEventListener("change", updatePlayerModeFields);
if (soloModeRadio) soloModeRadio.addEventListener("change", updatePlayerModeFields);

avatarInput.addEventListener("change", async function () {
  const file = avatarInput.files && avatarInput.files[0];
  if (!file) {
    clearAvatarCrop();
    return;
  }

  try {
    await prepareAvatarCrop(file);
  } catch (error) {
    clearAvatarCrop();
    showToast("Nie udalo sie wczytac zdjecia profilowego.");
  }
});

avatarCropStage.addEventListener("pointerdown", startAvatarDrag);
avatarCropStage.addEventListener("pointermove", moveAvatarDrag);
avatarCropStage.addEventListener("pointerup", stopAvatarDrag);
avatarCropStage.addEventListener("pointercancel", stopAvatarDrag);
avatarCropStage.addEventListener("wheel", zoomAvatarCrop);

avatarApplyCropButton.addEventListener("click", function () {
  applyAvatarCrop();
  showToast("Kadr zdjecia zapisany.");
});

avatarClearButton.addEventListener("click", clearAvatarCrop);

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

youtubeSearchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const query = youtubeSearchInput.value.trim();
  if (!query) return showToast("Wpisz nazwe anime albo openingu.");

  youtubeSearchButton.disabled = true;
  youtubeSearchResults.replaceChildren(node("p", "muted empty-row", "Szukam openingow..."));
  mod("searchYouTube", {
    query: query
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
  mod("awardBuzz", { points });
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

function answerTimeLeft(buzzer) {
  if (!buzzer) return 0;
  const base = Number(buzzer.answerTimeLeft || 0);
  const localDelta = (Date.now() - lastStateAt) / 1000;
  return Math.max(0, base - localDelta);
}

function isAnswerExpired(buzzer) {
  return Boolean(buzzer && (buzzer.answerExpired || answerTimeLeft(buzzer) <= 0));
}

function answerCountdownText(buzzer) {
  if (!buzzer) return "";
  const left = answerTimeLeft(buzzer);
  if (left <= 0) return "czas minal";
  return Math.ceil(left) + " s na odpowiedz";
}

function renderAnswerCountdown() {
  const isPlayer = profile && profile.role === "player";
  const buzzer = state && state.currentBuzzer;
  const show = Boolean(isPlayer && buzzer);
  if (!answerCountdown) return;

  answerCountdown.classList.toggle("hidden", !show);
  if (!show) return;

  const limit = Math.max(1, Number(buzzer.answerLimit || 15));
  const left = answerTimeLeft(buzzer);
  const percent = Math.max(0, Math.min(100, (left / limit) * 100));
  const expired = left <= 0 || buzzer.answerExpired;
  const isOwnTurn = ownId && buzzer.id === ownId;

  answerCountdown.classList.toggle("expired", expired);
  answerCountdown.classList.toggle("own-turn", Boolean(isOwnTurn && !expired));
  answerCountdownLabel.textContent = expired
    ? "Czeka na decyzje administratora"
    : (isOwnTurn ? "Twoj czas na odpowiedz" : "Czas odpowiedzi: " + buzzer.nickname);
  answerCountdownValue.textContent = expired ? "0.0 s" : left.toFixed(1) + " s";
  answerCountdownFill.style.width = percent + "%";
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
  renderLibrary();
  renderModerator();
  renderBlockedIps();
  renderBuzzer();
  renderAnswerCountdown();
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

function playerPeople() {
  return (state.people || []).filter((person) => person.role === "player");
}

function isSoloView() {
  if (!state || !profile) return false;
  if (profile.role === "player") return profile.playMode === "solo";
  const players = playerPeople();
  return profile.role === "moderator" && players.length > 0 && players.every((person) => person.playMode === "solo");
}

function rankedPlayers() {
  return playerPeople().slice().sort(function (a, b) {
    return Number(b.personalScore || 0) - Number(a.personalScore || 0)
      || String(a.nickname || "").localeCompare(String(b.nickname || ""));
  });
}

function renderScores() {
  scoreboard.replaceChildren();
  if (scoreTitle) scoreTitle.textContent = isSoloView() ? "Wynik" : "Wynik grup";

  if (isSoloView()) {
    const players = rankedPlayers();
    if (!players.length) {
      scoreboard.append(node("p", "muted empty-row", "Nie ma jeszcze osob."));
      return;
    }

    players.forEach(function (person) {
      const row = node("div", "score-row tournament-card solo-score-row");
      if (person.id === ownId) row.classList.add("own-player");
      const meta = node("div", "person-meta score-meta");
      meta.append(node("b", "", (person.isMvp ? "\u265B " : "") + person.nickname), node("span", "", "punkty osobiste"));
      const scoreValue = node("div", "score-value");
      scoreValue.append(node("strong", "", String(Number(person.personalScore || 0))));
      row.append(meta, scoreValue);
      scoreboard.append(row);
    });
    return;
  }

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
    const row = node("div", "score-row tournament-card");
    const meta = node("div", "person-meta score-meta");
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
  const row = node("div", "person-row tournament-card");
  if (person.id === ownId) row.classList.add("own-player");
  const meta = node("div", "person-meta person-card-meta");
  const name = (person.isMvp ? "\u265B " : "") + person.nickname;
  const details = person.role === "moderator"
    ? "Administrator"
    : Number(person.personalScore || 0) + " pkt osobiste";
  const nameLine = node("div", "person-name-line");
  const avatar = node("span", "avatar-badge", person.avatar ? "" : String(person.nickname || "?").slice(0, 1).toUpperCase());
  if (person.avatar) avatar.style.backgroundImage = "url(" + person.avatar + ")";
  const copy = node("div", "person-copy");
  nameLine.append(node("b", "", name));
  copy.append(nameLine, node("span", "person-points", details));
  meta.append(avatar, copy);

  if (person.blockedThisRound) copy.append(node("span", "blocked-note", "Ta grupa juz probowala."));
  if (profile && profile.role === "moderator" && person.ip) copy.append(node("span", "", "IP: " + person.ip));

  if (profile && profile.role === "moderator" && person.role === "player") {
    row.classList.add("with-actions");
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

  if (isSoloView()) {
    const players = rankedPlayers();
    if (!players.length) {
      peopleList.append(node("p", "muted empty-row", "Nie ma jeszcze osob w pokoju."));
      return;
    }
    players.forEach((person) => peopleList.append(groupedPersonRow(person)));
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

function trackSubtitle(track) {
  return (track.opening || "opening bez nazwy")
    + " / " + DIFFICULTY_LABELS[track.difficulty || "medium"]
    + " / " + (track.source === "youtube" ? "YouTube" : "audio")
    + (durationLabel(track) ? " / " + durationLabel(track) : "")
    + " / 0-5 od " + formatSeconds(track.startAtFirst)
    + " / 5-10 od " + formatSeconds(track.startAtSecond);
}

function durationLabel(track) {
  if (track.durationText) return track.durationText;
  const seconds = Number(track.durationSeconds || 0);
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return minutes + ":" + String(rest).padStart(2, "0");
}

function youtubeEmbedUrl(videoId) {
  return "https://www.youtube.com/embed/" + encodeURIComponent(videoId) + "?rel=0";
}

function difficultySelect(value) {
  const select = document.createElement("select");
  Object.keys(DIFFICULTY_LABELS).forEach(function (key) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = DIFFICULTY_LABELS[key];
    option.selected = key === (value || "medium");
    select.append(option);
  });
  return select;
}

function renderSearchResults() {
  if (!youtubeSearchResults) return;
  youtubeSearchResults.replaceChildren();

  if (!latestSearchResults.length) {
    youtubeSearchResults.append(node("p", "muted empty-row", "Brak wynikow wyszukiwania."));
    return;
  }

  latestSearchResults.forEach(function (track) {
    const row = node("div", "search-result-row");
    const meta = node("div", "track-meta");
    meta.append(
      node("b", "", track.anime || "Anime z YouTube"),
      node("span", "", trackSubtitle(track))
    );
    if (track.rawTitle) meta.append(node("span", "", track.rawTitle));

    const preview = node("div", "search-preview");
    if (track.videoId) {
      const iframe = document.createElement("iframe");
      iframe.src = youtubeEmbedUrl(track.videoId);
      iframe.title = track.anime || "Podglad YouTube";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      preview.append(iframe);
    } else {
      preview.append(node("span", "muted", "Brak podgladu"));
    }

    const actions = node("div", "search-actions");
    const select = difficultySelect(track.difficulty || "medium");
    const add = node("button", "primary", "Do biblioteki");
    add.type = "button";
    add.addEventListener("click", function () {
      mod("addLibraryTrack", { track: Object.assign({}, track, { difficulty: select.value }) });
      showToast("Dodano do biblioteki.");
    });
    actions.append(select, add);
    row.append(meta, preview, actions);
    youtubeSearchResults.append(row);
  });
}

function renderLibrary() {
  if (!libraryList || !profile || profile.role !== "moderator") return;
  const tracks = state.libraryTracks || [];
  libraryList.replaceChildren();
  libraryCount.textContent = String(tracks.length);

  if (!tracks.length) {
    libraryList.append(node("p", "muted empty-row", "Biblioteka jest pusta."));
    return;
  }

  Object.keys(DIFFICULTY_LABELS).forEach(function (difficulty) {
    const items = tracks.filter((track) => (track.difficulty || "medium") === difficulty);
    if (!items.length) return;

    const section = node("div", "library-difficulty");
    const title = node("div", "library-difficulty-title");
    title.append(node("b", "", DIFFICULTY_LABELS[difficulty]), node("span", "", items.length + " openingow"));
    const list = node("div", "library-difficulty-list");

    items.forEach(function (track) {
      const row = node("div", "library-row");
      const meta = node("div", "track-meta");
      meta.append(node("b", "", track.anime || "Anime bez nazwy"), node("span", "", trackSubtitle(track)));

      const actions = node("div", "track-actions");
      const add = node("button", "primary", "Do rundy");
      const remove = node("button", "danger-button", "Usun");
      add.type = "button";
      remove.type = "button";
      add.addEventListener("click", () => mod("addLibraryToMain", { trackId: track.id }));
      remove.addEventListener("click", () => mod("removeLibraryTrack", { trackId: track.id }));
      actions.append(add, remove);
      row.append(meta, actions);
      list.append(row);
    });

    section.append(title, list);
    libraryList.append(section);
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
      node("span", "", trackSubtitle(track))
    );
    if (result) meta.append(node("span", "track-result", trackResultText(result)));
    const actions = node("div", "track-actions");
    const select = node("button", "", "Wybierz");
    const edit = node("button", "", "Edytuj");
    const clearResult = node("button", "", "Odznacz");
    const remove = node("button", "", "Usun");
    select.type = "button";
    edit.type = "button";
    clearResult.type = "button";
    remove.type = "button";
    select.addEventListener("click", () => mod("selectTrack", { trackId: track.id }));
    edit.addEventListener("click", () => editTrack(track));
    clearResult.addEventListener("click", () => mod("clearTrackResult", { trackId: track.id }));
    remove.addEventListener("click", () => mod("removeTrack", { trackId: track.id }));
    actions.append(select, edit);
    if (result) actions.append(clearResult);
    actions.append(remove);
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
  renderBuzzDecision();

  const settings = state.settings.difficultyScores || {};
  Object.keys(scoreInputs).forEach(function (key) {
    const scores = settings[key] || { first: 0, second: 0 };
    scoreInputs[key].first.value = scores.first;
    scoreInputs[key].second.value = scores.second;
  });
}

function renderBuzzDecision() {
  const buzzer = state.currentBuzzer;
  const expired = isAnswerExpired(buzzer);
  const countdown = answerCountdownText(buzzer);
  const answerLimit = buzzer ? Math.round(Number(buzzer.answerLimit || 15)) : 15;
  if (buzzDecision) buzzDecision.classList.toggle("answer-expired", Boolean(buzzer && expired));

  buzzedAtLabel.textContent = buzzer ? formatSeconds(buzzer.buzzedAt) + " / " + buzzer.label + " / " + countdown : "brak";
  if (!buzzer) {
    decisionText.textContent = "Nikt jeszcze nie zatrzymal openingu.";
  } else if (expired) {
    decisionText.textContent = buzzer.nickname + " (" + buzzer.team + ") nie odpowiedzial/a w " + answerLimit + " s. Wybierz: dodac " + buzzer.suggestedPoints + " pkt albo nie dodawac punktow.";
  } else {
    decisionText.textContent = buzzer.nickname + " (" + buzzer.team + ") zatrzymal/a opening. Ma " + countdown + ". Zgadniete doda automatycznie: " + buzzer.suggestedPoints + " pkt.";
  }

  guessedButton.disabled = !buzzer;
  awardSuggestedButton.disabled = !buzzer || buzzer.suggestedPoints <= 0;
  awardTwoButton.disabled = !buzzer;
  awardOneButton.disabled = !buzzer;
  rejectBuzzButton.disabled = !buzzer;
  resumeFromBuzzButton.disabled = state.phase !== "paused" || Boolean(buzzer);

  guessedButton.textContent = expired ? "Dodaj punkty" : "Zgadniete";
  awardSuggestedButton.textContent = expired ? "Dodaj sugerowane" : "Dodaj sugerowane";
  rejectBuzzButton.textContent = expired ? "Nie dodawaj punktow" : "Bledne - zablokuj grupe";
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
    if (isAnswerExpired(state.currentBuzzer)) {
      buzzCaption.textContent = "Czas odpowiedzi minal. Administrator decyduje o punktach.";
    } else {
      buzzCaption.textContent = state.currentBuzzer.nickname + " zgaduje. " + answerCountdownText(state.currentBuzzer) + ".";
    }
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
  if (state.currentBuzzer) {
    renderBuzzer();
    renderAnswerCountdown();
    if (profile && profile.role === "moderator") renderBuzzDecision();
  }
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
        },
        onError: function (event) {
          const code = event && event.data ? String(event.data) : "";
          const key = youtubeVideoId + ":" + code;
          if (lastYouTubeError !== key) {
            lastYouTubeError = key;
            showToast("YouTube blokuje ten film w aplikacji" + (code ? " (kod " + code + ")." : ".") + " Podmien link openingu.");
          }
          pauseYouTube();
        }
      }
    });
    return false;
  }

  if (!youtubePlayerReady) return false;

  if (youtubeVideoId !== track.videoId) {
    youtubeVideoId = track.videoId;
    lastYouTubeError = "";
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
