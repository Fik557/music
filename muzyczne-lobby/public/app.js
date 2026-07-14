const $ = (selector) => document.querySelector(selector);

const SESSION_KEY = "animeOpeningQuizSession";
const PAGE_VOLUME_KEY = "animeOpeningQuizVolume";
const MAX_AVATAR_DATA_LENGTH = 60000;
const MAX_AUDIO_UPLOAD_BYTES = 25 * 1024 * 1024;
const AVATAR_OUTPUT_SIZE = 96;
const AVATAR_OUTPUT_QUALITY = 0.72;
const MEDIA_LOAD_TIMEOUT_MS = 5000;
const CLIP_END_PAUSE_EARLY_SECONDS = 0.08;
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
const playerToggleButton = $("#playerToggleButton");
const adminToggleButton = $("#adminToggleButton");
const backToPlayerButton = $("#backToPlayerButton");
const playerFields = $("#playerFields");
const adminFields = $("#adminFields");
const loginModeLabel = $("#loginModeLabel");
const loginTitle = $("#loginTitle");
const loginSubmitButton = $("#loginSubmitButton");
const soloLoginButton = $("#soloLoginButton");
const nicknameField = $("#nicknameField");
const nicknameInput = $("#nicknameInput");
const roomField = $("#roomField");
const groupModeRadio = $("#groupModeRadio");
const soloModeRadio = $("#soloModeRadio");
const groupFields = $("#groupFields");
const teamInput = $("#teamInput");
const groupPasswordInput = $("#groupPasswordInput");
const avatarField = $("#avatarField");
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
const volumeSlider = $("#volumeSlider");
const volumeValue = $("#volumeValue");
const copyLinkButton = $("#copyLinkButton");
const leaveButton = $("#leaveButton");
const appShell = $(".shell");
const mainGrid = $("#mainGrid");
const playSurface = $(".play-surface");
const soloDayStreakCard = $("#soloDayStreakCard");
const soloDayStreakValue = $("#soloDayStreakValue");
const soloDayBestValue = $("#soloDayBestValue");
const soloDayScoreValue = $("#soloDayScoreValue");
const adminAnimeCard = $("#adminAnimeCard");
const adminAnimeCover = $("#adminAnimeCover");
const adminAnimeCoverFallback = $("#adminAnimeCoverFallback");
const adminAnimeName = $("#adminAnimeName");
const adminAnimeDescription = $("#adminAnimeDescription");
const trackTitle = $("#trackTitle");
const trackArtist = $("#trackArtist");
const phaseLabel = $("#phaseLabel");
const progressFill = $("#progressFill");
const timeLabel = $("#timeLabel");
const scoreWindowLabel = $("#scoreWindowLabel");
const soundButton = $("#soundButton");
const buzzButton = $("#buzzButton");
const buzzCaption = $("#buzzCaption");
const soloPreroll = $("#soloPreroll");
const soloPrerollValue = $("#soloPrerollValue");
const soloControls = $("#soloControls");
const soloAnswerForm = $("#soloAnswerForm");
const soloAnswerInput = $("#soloAnswerInput");
const soloAnswerSubmitButton = $("#soloAnswerSubmitButton");
const soloAnswerOptions = $("#soloAnswerOptions");
const soloGuessedButton = $("#soloGuessedButton");
const soloMissedButton = $("#soloMissedButton");
const soloNextButton = $("#soloNextButton");
const soloRandomButton = $("#soloRandomButton");
const soloDailyButton = $("#soloDailyButton");
const soloReportPanel = $("#soloReportPanel");
const soloReportForm = $("#soloReportForm");
const soloReportInput = $("#soloReportInput");
const soloReportSubmitButton = $("#soloReportSubmitButton");
const answerCountdown = $("#answerCountdown");
const answerCountdownLabel = $("#answerCountdownLabel");
const answerCountdownValue = $("#answerCountdownValue");
const answerCountdownFill = $("#answerCountdownFill");
const scoreboard = $("#scoreboard");
const scoreTitle = $("#scoreTitle");
const peopleList = $("#peopleList");
const peopleTitle = $("#peopleTitle");
const peopleSection = peopleTitle ? peopleTitle.closest("section") : null;
const peopleCount = $("#peopleCount");
const moderatorPanel = $("#moderatorPanel");
const trackForm = $("#trackForm");
const trackAnimeInput = $("#trackAnimeInput");
const trackOpeningInput = $("#trackOpeningInput");
const trackDifficultyInput = $("#trackDifficultyInput");
const trackUrlInput = $("#trackUrlInput");
const trackStartFirstInput = $("#trackStartFirstInput");
const trackStartSecondInput = $("#trackStartSecondInput");
const localAudioSelect = $("#localAudioSelect");
const fallbackAudioSelect = $("#fallbackAudioSelect");
const audioUploadInput = $("#audioUploadInput");
const audioUploadButton = $("#audioUploadButton");
const audioUploadStatus = $("#audioUploadStatus");
const trackCoverInput = $("#trackCoverInput");
const trackDescriptionInput = $("#trackDescriptionInput");
const trackAliasesInput = $("#trackAliasesInput");
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
const librarySearchInput = $("#librarySearchInput");
const libraryDifficultyFilter = $("#libraryDifficultyFilter");
const libraryPercentFilter = $("#libraryPercentFilter");
const libraryStatusFilter = $("#libraryStatusFilter");
const librarySortInput = $("#librarySortInput");
const libraryClearFiltersButton = $("#libraryClearFiltersButton");
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
const adminPanelTabs = $("#adminPanelTabs");
const adminPanelButtons = Array.from(document.querySelectorAll("[data-admin-panel-target]"));
const adminPanelSections = Array.from(document.querySelectorAll("[data-admin-panel]"));
const adminSoloStatsList = $("#adminSoloStatsList");
const adminSoloStatsCount = $("#adminSoloStatsCount");
const adminRoomList = $("#adminRoomList");
const adminRoomsCount = $("#adminRoomsCount");
const adminReportList = $("#adminReportList");
const adminReportsCount = $("#adminReportsCount");
const adminCenterPhase = $("#adminCenterPhase");
const adminCenterGrid = $("#adminCenterGrid");
const adminSoloPlayersList = $("#adminSoloPlayersList");
const adminSoloPlayersCount = $("#adminSoloPlayersCount");
const adminQualityList = $("#adminQualityList");
const adminQualityCount = $("#adminQualityCount");
const statsSortDescButton = $("#statsSortDescButton");
const statsSortAscButton = $("#statsSortAscButton");
const statsSortHardestButton = $("#statsSortHardestButton");
const exportDataButton = $("#exportDataButton");
const importDataInput = $("#importDataInput");
const importDataButton = $("#importDataButton");
const backupStatus = $("#backupStatus");

const scoreInputs = {
  very_easy: { first: $("#scoreVeryEasyFirst"), second: $("#scoreVeryEasySecond") },
  easy: { first: $("#scoreEasyFirst"), second: $("#scoreEasySecond") },
  medium: { first: $("#scoreMediumFirst"), second: $("#scoreMediumSecond") },
  hard: { first: $("#scoreHardFirst"), second: $("#scoreHardSecond") },
  impossible: { first: $("#scoreImpossibleFirst"), second: $("#scoreImpossibleSecond") }
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  });
}

let socket = null;
let state = null;
let profile = null;
let ownId = null;
let loginMode = "solo";
let lastStateAt = Date.now();
let lastStateMessageType = "";
let soundEnabled = false;
let pageVolume = loadPageVolume();
let reconnectTimer = null;
let toastTimer = null;
let editingTrackId = null;
let editingTrackSource = "tracks";
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
let mediaLoadKey = "";
let mediaLoadTimer = null;
let mediaReadySentKey = "";
let mediaErrorSentKey = "";
let mobileAudioUnlocked = false;
let latestSearchResults = [];
let avatarData = "";
let avatarCropSource = null;
let buzzerAudioContext = null;
let lastBuzzerSoundKey = "";
let activeAdminPanel = "center";
let lastSoloAnswerTrackId = "";
let lastSoloReportTrackId = "";
let adminStatsSort = "desc";
let librarySearch = "";
let libraryDifficulty = "all";
let libraryPercent = "all";
let libraryStatus = "all";
let librarySort = "difficulty";
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

function setDocumentView(view) {
  document.body.dataset.view = view || "login";
}

function profileViewName(currentProfile) {
  if (!currentProfile) return "login";
  if (currentProfile.role === "moderator") return "moderator";
  if (currentProfile.role === "solo") return "solo";
  return "player";
}

function normalizeAnswerText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function loadPageVolume() {
  try {
    const saved = window.localStorage.getItem(PAGE_VOLUME_KEY);
    const percent = saved == null ? 100 : Number(saved);
    if (!Number.isFinite(percent)) return 1;
    return Math.max(0, Math.min(1, percent / 100));
  } catch (error) {
    return 1;
  }
}

function pageVolumePercent() {
  return Math.round(pageVolume * 100);
}

function applyPageVolume(syncPlayback) {
  const percent = pageVolumePercent();
  audio.volume = pageVolume;
  if (volumeSlider) volumeSlider.value = String(percent);
  if (volumeValue) volumeValue.textContent = percent + "%";
  try {
    if (youtubePlayerReady && youtubePlayer && youtubePlayer.setVolume) {
      youtubePlayer.setVolume(percent);
      if (percent > 0 && youtubePlayer.unMute) youtubePlayer.unMute();
    }
  } catch (error) {}
  if (syncPlayback) syncAudio(true);
}

function setPageVolume(value) {
  const percent = Math.max(0, Math.min(100, Number(value)));
  pageVolume = Number.isFinite(percent) ? percent / 100 : 1;
  try {
    window.localStorage.setItem(PAGE_VOLUME_KEY, String(pageVolumePercent()));
  } catch (error) {}
  applyPageVolume(true);
}

applyPageVolume(false);

if (volumeSlider) {
  volumeSlider.addEventListener("input", function () {
    setPageVolume(volumeSlider.value);
  });
}

function normalizeAvatarData(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length > MAX_AVATAR_DATA_LENGTH) return "";
  if (!/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(text)) return "";
  return text;
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
      avatar: normalizeAvatarData(profile.avatar)
    }));
  } catch (error) {}
}

function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!saved || typeof saved !== "object") return null;
    const role = saved.role === "moderator" ? "moderator" : (saved.role === "solo" ? "solo" : "player");
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
      avatar: normalizeAvatarData(saved.avatar)
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
  const size = AVATAR_OUTPUT_SIZE;
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
  return normalizeAvatarData(canvas.toDataURL("image/webp", AVATAR_OUTPUT_QUALITY));
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
  if (!avatarData) showToast("Zdjecie profilowe jest za duze. Sprobuj mniejszego kadru.");
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

function ensureBuzzerAudioContext() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  if (!buzzerAudioContext) buzzerAudioContext = new Context();
  return buzzerAudioContext;
}

function unlockBuzzerSound() {
  const context = ensureBuzzerAudioContext();
  if (context && context.state === "suspended") context.resume().catch(function () {});
}

function buzzerSoundKey(room) {
  const buzzer = room && room.currentBuzzer;
  if (!buzzer) return "";
  return [buzzer.id || "", buzzer.answerStartedAt || buzzer.buzzedAt || "", buzzer.team || ""].join("|");
}

function playBuzzerSound() {
  if (!soundEnabled) return;
  if (pageVolume <= 0) return;
  const context = ensureBuzzerAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume().catch(function () {});

  const start = context.currentTime + 0.01;
  const gain = context.createGain();
  const tone = context.createOscillator();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(760, start);
  tone.frequency.exponentialRampToValueAtTime(420, start + 0.18);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.24 * pageVolume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
  tone.connect(gain);
  gain.connect(context.destination);
  tone.start(start);
  tone.stop(start + 0.25);
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
  const isSoloLanding = loginMode === "solo";
  const isSolo = currentPlayMode() === "solo";
  if (groupFields) groupFields.classList.toggle("hidden", isSoloLanding || isSolo);
  if (teamInput) teamInput.required = !isAdmin && !isSoloLanding && !isSolo;
  if (groupPasswordInput) groupPasswordInput.required = !isAdmin && !isSoloLanding && !isSolo;
}

function showAppForProfile() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  setDocumentView(profileViewName(profile));
  moderatorPanel.classList.toggle("hidden", profile.role !== "moderator");
  roleLabel.textContent = profile.role === "moderator" ? "♛ administrator" : profile.nickname + (profile.playMode === "solo" ? "" : " / " + profile.team);
  if (profile.role === "solo") roleLabel.textContent = "granie solo";
  roomCodeLabel.textContent = profile.role === "solo" ? "SOLO" : profile.roomCode;
  copyLinkButton.classList.toggle("hidden", profile.role === "solo");
}

function setLoginMode(mode) {
  loginMode = mode;
  setDocumentView("login");
  document.body.dataset.loginMode = mode;
  const isSoloLanding = mode === "solo";
  const isAdmin = mode === "moderator";
  const isPlayer = mode === "player";
  if (nicknameField) nicknameField.classList.toggle("hidden", isSoloLanding);
  if (roomField) roomField.classList.toggle("hidden", isSoloLanding);
  if (avatarField) avatarField.classList.toggle("hidden", isSoloLanding);
  playerFields.classList.toggle("hidden", !isPlayer);
  adminFields.classList.toggle("hidden", !isAdmin);
  loginSubmitButton.classList.toggle("hidden", isSoloLanding);
  if (playerToggleButton) playerToggleButton.classList.toggle("active", isPlayer);
  if (adminToggleButton) adminToggleButton.classList.toggle("active", isAdmin);
  loginModeLabel.textContent = isAdmin ? "administrator" : (isPlayer ? "gracz" : "solo");
  loginTitle.textContent = isAdmin ? "Panel administratora" : (isPlayer ? "Dolacz do gry" : "Granie solo");
  loginSubmitButton.textContent = isAdmin ? "Wejdz jako administrator" : "Wejdz jako gracz";
  moderatorPasswordInput.required = isAdmin;
  nicknameInput.required = !isSoloLanding;
  updatePlayerModeFields();
  if (isAdmin) moderatorPasswordInput.focus();
  if (isPlayer) nicknameInput.focus();
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
      state = mergeStatePayload(payload.room, payload.type);
      lastStateAt = Date.now();
      const nextBuzzerSoundKey = buzzerSoundKey(state);
      if (nextBuzzerSoundKey && nextBuzzerSoundKey !== lastBuzzerSoundKey) playBuzzerSound();
      lastBuzzerSoundKey = nextBuzzerSoundKey;
      render();
      syncAudio();
    }
    if (payload.type === "soloState") {
      state = mergeStatePayload(payload.room, payload.type);
      lastStateAt = Date.now();
      render();
      syncAudio();
    }
    if (payload.type === "error") {
      if (playlistImportButton) playlistImportButton.disabled = false;
      if (youtubeSearchButton) youtubeSearchButton.disabled = false;
      if (audioUploadButton) audioUploadButton.disabled = false;
      if (soloReportSubmitButton) soloReportSubmitButton.disabled = false;
      if (importDataButton) importDataButton.disabled = false;
      if (playlistImportStatus) playlistImportStatus.textContent = payload.message;
      if (audioUploadStatus) audioUploadStatus.textContent = payload.message;
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
    if (payload.type === "soloReportSaved") {
      if (soloReportSubmitButton) soloReportSubmitButton.disabled = false;
      if (soloReportInput) soloReportInput.value = "";
      if (soloReportPanel) soloReportPanel.open = false;
      showToast(payload.message || "Zgloszenie zapisane.");
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
    if (payload.type === "soloJoined") {
      ownId = payload.id;
      if (profile) {
        profile.roomCode = "SOLO";
        profile.role = "solo";
        profile.playMode = "solo";
        roleLabel.textContent = "granie solo";
      }
      saveSession();
      const url = new URL(location.href);
      url.searchParams.delete("room");
      history.replaceState(null, "", url);
    }
  });

  socket.addEventListener("close", function () {
    connectionStatus.textContent = "offline";
    clearTimeout(reconnectTimer);
    if (profile) reconnectTimer = setTimeout(connect, 1000);
  });
}

function mergeStatePayload(nextState, messageType) {
  const next = nextState && typeof nextState === "object" ? nextState : {};
  const sameRoom = state && state.code === next.code;
  const previous = sameRoom ? state : {};
  lastStateMessageType = messageType;
  const merged = Object.assign({}, previous, next);

  [
    "adminRooms",
    "blockedIps",
    "groups",
    "libraryTracks",
    "localAudioFiles",
    "lockedGroups",
    "people",
    "qualityStatuses",
    "soloReports",
    "soloStats",
    "soloTitleOptions",
    "tracks"
  ].forEach(function (field) {
    if (!Array.isArray(merged[field])) merged[field] = [];
  });

  if (!merged.teams || typeof merged.teams !== "object" || Array.isArray(merged.teams)) merged.teams = {};
  merged.settings = Object.assign(
    { clipDuration: 15, segmentSplit: 5, difficultyScores: {} },
    previous.settings && typeof previous.settings === "object" ? previous.settings : {},
    next.settings && typeof next.settings === "object" ? next.settings : {}
  );

  return merged;
}

function send(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function sendJoin() {
  if (profile.role === "solo") {
    send({
      type: "soloJoin",
      clientId: profile.clientId,
      nickname: profile.nickname,
      avatar: normalizeAvatarData(profile.avatar)
    });
    return;
  }

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
    avatar: normalizeAvatarData(profile.avatar)
  });
}

function switchAdminRoom(roomCode) {
  if (!profile || profile.role !== "moderator") return;
  const cleanCode = cleanRoom(roomCode);
  if (!cleanCode || cleanCode === profile.roomCode) return;
  profile.roomCode = cleanCode;
  if (roomInput) roomInput.value = cleanCode;
  roomCodeLabel.textContent = cleanCode;
  saveSession();
  const url = new URL(location.href);
  url.searchParams.set("room", cleanCode);
  history.replaceState(null, "", url);
  sendJoin();
  showToast("Przelaczono na pokoj " + cleanCode + ".");
}

function join(role) {
  const nickname = nicknameInput.value.trim() || (role === "moderator" ? "Administrator" : "Gracz");
  const roomCode = role === "solo" ? "SOLO" : cleanRoom(roomInput.value);
  const playMode = role === "solo" ? "solo" : (role === "player" ? currentPlayMode() : "group");
  const team = playMode === "solo" ? nickname : teamInput.value.trim();
  const groupPassword = playMode === "solo" ? "" : groupPasswordInput.value.trim();
  const moderatorPassword = moderatorPasswordInput.value.trim();

  if (role === "player" && playMode !== "solo") {
    if (!team) return showToast("Wpisz nazwe grupy.");
    if (!groupPassword) return showToast("Wpisz haslo grupy.");
  }

  if (avatarCropSource) applyAvatarCrop();
  const safeAvatar = normalizeAvatarData(avatarData);
  if (avatarData && !safeAvatar) {
    avatarData = "";
    renderAvatarPreview();
    showToast("Zdjecie profilowe bylo za duze, dolaczasz bez zdjecia.");
  }
  profile = { clientId: makeClientId(), nickname, team, groupPassword, moderatorPassword, roomCode, role, playMode, avatar: safeAvatar };
  saveSession();
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  setDocumentView(profileViewName(profile));
  moderatorPanel.classList.toggle("hidden", role !== "moderator");
  roleLabel.textContent = role === "moderator" ? "♛ administrator" : nickname + (playMode === "solo" ? "" : " / " + team);
  if (role === "solo") roleLabel.textContent = "granie solo";
  roomCodeLabel.textContent = roomCode;
  copyLinkButton.classList.toggle("hidden", role === "solo");
  connect();
  sendJoin();
}

function returnToLogin(message) {
  clearSession();
  profile = null;
  state = null;
  soundEnabled = false;
  soundButton.textContent = "Wlacz dzwiek";
  editingTrackId = null;
  editingTrackSource = "tracks";
  clearAvatarCrop();
  audio.pause();
  pauseYouTube();
  if (socket) socket.close();
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
  setDocumentView("login");
  moderatorPanel.classList.add("hidden");
  copyLinkButton.classList.remove("hidden");
  resetTrackForm();
  if (message) showToast(message);
}

function restoreSession() {
  const saved = loadSession();
  if (!saved) return;
  fillLoginFields(saved);
  setLoginMode(saved.role === "solo" ? "solo" : (saved.role === "moderator" ? "moderator" : "player"));
  profile = saved;
  showAppForProfile();
  connect();
}

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  join(loginMode === "solo" ? "solo" : loginMode);
});

if (playerToggleButton) playerToggleButton.addEventListener("click", () => setLoginMode("player"));
adminToggleButton.addEventListener("click", () => setLoginMode("moderator"));
backToPlayerButton.addEventListener("click", () => setLoginMode("player"));
soloLoginButton.addEventListener("click", () => join("solo"));
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

function primeSongAudioFromGesture() {
  unlockBuzzerSound();
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");

  const previousMuted = audio.muted;
  let restored = false;
  const restoreAudio = function () {
    if (restored) return;
    restored = true;
    if (!state || state.phase !== "playing") audio.pause();
    audio.muted = previousMuted;
  };

  try {
    const attempt = audio.play();
    if (attempt && typeof attempt.then === "function") {
      attempt.then(function () {
        mobileAudioUnlocked = true;
        restoreAudio();
      }).catch(restoreAudio);
    } else {
      mobileAudioUnlocked = true;
      restoreAudio();
    }
  } catch (error) {
    restoreAudio();
  }
  setTimeout(restoreAudio, 350);

  try {
    if (youtubePlayerReady && youtubePlayer && youtubePlayer.playVideo) {
      if (youtubePlayer.mute) youtubePlayer.mute();
      youtubePlayer.playVideo();
      setTimeout(function () {
        try {
          if (!state || state.phase !== "playing") youtubePlayer.pauseVideo();
          if (youtubePlayer.unMute) youtubePlayer.unMute();
          youtubePlayer.setVolume(pageVolumePercent());
        } catch (error) {}
      }, 250);
    }
  } catch (error) {}
}

soundButton.addEventListener("click", function () {
  soundEnabled = true;
  soundButton.textContent = "Dzwiek wlaczony";
  syncAudio(true);
  primeSongAudioFromGesture();
  requestYouTubeApi();
  if (profile && profile.role === "solo" && state && state.solo && state.solo.mediaError) {
    send({ type: "soloAction", action: "next", autoplay: true });
  } else if (profile && profile.role === "solo" && state && state.phase !== "playing" && state.phase !== "loading" && !(state.solo && state.solo.answered)) {
    send({ type: "soloAction", action: "start" });
  }
  syncAudio(true);
});

audio.addEventListener("loadeddata", function () {
  if (state && (state.phase === "loading" || state.phase === "countdown")) syncAudio(true);
});

audio.addEventListener("canplay", function () {
  if (state && (state.phase === "loading" || state.phase === "countdown")) syncAudio(true);
});

audio.addEventListener("seeked", function () {
  if (state && (state.phase === "loading" || state.phase === "countdown")) syncAudio(true);
});

audio.addEventListener("error", function () {
  if (state && state.currentTrack && state.currentTrack.source !== "youtube") {
    reportMediaError(state.currentTrack, "Nie zaladowano pliku audio.");
  }
});

buzzButton.addEventListener("click", () => send({ type: "buzz" }));
if (soloAnswerForm) {
  soloAnswerForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const answer = soloAnswerInput ? soloAnswerInput.value.trim() : "";
    if (!answer) {
      showToast("Wybierz anime z listy.");
      return;
    }
    if (state && !Array.isArray(state.soloTitleOptions) && Array.isArray(state.soloStats)) {
      const currentStat = state.soloStats.find((entry) => entry.current);
      if (currentStat && currentStat.anime) {
        send({
          type: "soloAction",
          action: "answer",
          guessed: normalizeAnswerText(answer) === normalizeAnswerText(currentStat.anime),
          answer
        });
        return;
      }
    }
    send({ type: "soloAction", action: "answerText", answer });
  });
}
if (soloReportForm) {
  soloReportForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const message = soloReportInput ? soloReportInput.value.trim() : "";
    if (!message) {
      showToast("Wpisz opis bledu.");
      return;
    }
    if (!state || !state.currentTrack) {
      showToast("Najpierw wylosuj opening.");
      return;
    }
    if (soloReportSubmitButton) soloReportSubmitButton.disabled = true;
    send({ type: "soloAction", action: "report", message });
  });
}
soloGuessedButton.addEventListener("click", () => send({ type: "soloAction", action: "answer", guessed: true }));
soloMissedButton.addEventListener("click", () => send({ type: "soloAction", action: "answer", guessed: false }));
soloNextButton.addEventListener("click", function () {
  if (soundEnabled) primeSongAudioFromGesture();
  send({ type: "soloAction", action: "next", autoplay: soundEnabled });
});
if (soloRandomButton) {
  soloRandomButton.addEventListener("click", function () {
    if (soundEnabled) primeSongAudioFromGesture();
    send({ type: "soloAction", action: "random", autoplay: soundEnabled });
  });
}
if (soloDailyButton) {
  soloDailyButton.addEventListener("click", function () {
    if (soundEnabled) primeSongAudioFromGesture();
    send({ type: "soloAction", action: "daily", autoplay: soundEnabled });
  });
}

if (adminPanelTabs) {
  adminPanelTabs.addEventListener("click", function (event) {
    const button = event.target.closest("[data-admin-panel-target]");
    if (!button) return;
    activeAdminPanel = button.dataset.adminPanelTarget || "center";
    renderAdminPanelTabs();
  });
}

if (statsSortDescButton) {
  statsSortDescButton.addEventListener("click", function () {
    adminStatsSort = "desc";
    renderAdminSoloStats();
  });
}

if (statsSortAscButton) {
  statsSortAscButton.addEventListener("click", function () {
    adminStatsSort = "asc";
    renderAdminSoloStats();
  });
}

if (statsSortHardestButton) {
  statsSortHardestButton.addEventListener("click", function () {
    adminStatsSort = "hardest";
    renderAdminSoloStats();
  });
}

if (librarySearchInput) {
  librarySearchInput.addEventListener("input", function () {
    librarySearch = librarySearchInput.value || "";
    renderLibrary();
  });
}

if (libraryDifficultyFilter) {
  libraryDifficultyFilter.addEventListener("change", function () {
    libraryDifficulty = libraryDifficultyFilter.value || "all";
    renderLibrary();
  });
}

if (libraryPercentFilter) {
  libraryPercentFilter.addEventListener("change", function () {
    libraryPercent = libraryPercentFilter.value || "all";
    renderLibrary();
  });
}

if (libraryStatusFilter) {
  libraryStatusFilter.addEventListener("change", function () {
    libraryStatus = libraryStatusFilter.value || "all";
    renderLibrary();
  });
}

if (librarySortInput) {
  librarySortInput.addEventListener("change", function () {
    librarySort = librarySortInput.value || "difficulty";
    renderLibrary();
  });
}

if (libraryClearFiltersButton) {
  libraryClearFiltersButton.addEventListener("click", function () {
    librarySearch = "";
    libraryDifficulty = "all";
    libraryPercent = "all";
    libraryStatus = "all";
    librarySort = "difficulty";
    if (librarySearchInput) librarySearchInput.value = "";
    if (libraryDifficultyFilter) libraryDifficultyFilter.value = "all";
    if (libraryPercentFilter) libraryPercentFilter.value = "all";
    if (libraryStatusFilter) libraryStatusFilter.value = "all";
    if (librarySortInput) librarySortInput.value = "difficulty";
    renderLibrary();
  });
}

if (exportDataButton) {
  exportDataButton.addEventListener("click", async function () {
    if (!profile || profile.role !== "moderator") return;
    try {
      exportDataButton.disabled = true;
      if (backupStatus) backupStatus.textContent = "Tworzenie backupu...";
      const url = "/api/export-data?moderatorPassword=" + encodeURIComponent(profile.moderatorPassword || "");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Nie udalo sie pobrac backupu.");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "anime-opening-quiz-backup.json";
      document.body.append(link);
      link.click();
      URL.revokeObjectURL(link.href);
      link.remove();
      if (backupStatus) backupStatus.textContent = "Backup pobrany.";
      showToast("Backup danych pobrany.");
    } catch (error) {
      if (backupStatus) backupStatus.textContent = error && error.message ? error.message : "Nie udalo sie pobrac backupu.";
      showToast(error && error.message ? error.message : "Nie udalo sie pobrac backupu.");
    } finally {
      exportDataButton.disabled = false;
    }
  });
}

if (importDataButton) {
  importDataButton.addEventListener("click", async function () {
    if (!profile || profile.role !== "moderator") return;
    const file = importDataInput && importDataInput.files && importDataInput.files[0];
    if (!file) return showToast("Wybierz plik JSON z backupem.");
    try {
      importDataButton.disabled = true;
      if (backupStatus) backupStatus.textContent = "Importowanie danych...";
      const text = await file.text();
      const data = JSON.parse(text);
      const response = await fetch("/api/import-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moderatorPassword: profile.moderatorPassword || "",
          data: data
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.error) throw new Error(payload.error || "Nie udalo sie zaimportowac danych.");
      if (importDataInput) importDataInput.value = "";
      if (backupStatus) backupStatus.textContent = payload.message || "Dane zaimportowane.";
      showToast(payload.message || "Dane zaimportowane.");
      mod("refresh");
    } catch (error) {
      if (backupStatus) backupStatus.textContent = error && error.message ? error.message : "Nie udalo sie zaimportowac danych.";
      showToast(error && error.message ? error.message : "Nie udalo sie zaimportowac danych.");
    } finally {
      importDataButton.disabled = false;
    }
  });
}

trackForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const payload = {
    track: {
      anime: trackAnimeInput.value,
      opening: trackOpeningInput.value,
      difficulty: trackDifficultyInput.value,
      audioUrl: trackUrlInput.value,
      fallbackAudioUrl: fallbackAudioSelect ? fallbackAudioSelect.value : "",
      startAtFirst: Number(trackStartFirstInput.value || 0),
      startAtSecond: Number(trackStartSecondInput.value || 5),
      coverUrl: trackCoverInput.value,
      description: trackDescriptionInput.value,
      aliases: trackAliasesInput ? trackAliasesInput.value : ""
    }
  };

  if (editingTrackId) {
    if (editingTrackSource === "report") {
      mod("updateReportedTrack", Object.assign({ trackKey: editingTrackId }, payload));
      showToast("Zapisano zgloszony opening.");
    } else {
      const action = editingTrackSource === "library" ? "updateLibraryTrack" : "updateTrack";
      mod(action, Object.assign({ trackId: editingTrackId }, payload));
      showToast(editingTrackSource === "library" ? "Zapisano opening w bibliotece." : "Zapisano opening.");
    }
  } else {
    mod("addTrack", payload);
  }
  resetTrackForm();
});

if (localAudioSelect) {
  localAudioSelect.addEventListener("change", function () {
    if (localAudioSelect.value) trackUrlInput.value = localAudioSelect.value;
  });
}

if (audioUploadButton) {
  audioUploadButton.addEventListener("click", async function () {
    const file = audioUploadInput && audioUploadInput.files && audioUploadInput.files[0];
    if (!file) return showToast("Wybierz plik audio.");
    if (file.size > MAX_AUDIO_UPLOAD_BYTES) return showToast("Plik audio jest za duzy. Limit to 25 MB.");

    try {
      audioUploadButton.disabled = true;
      if (audioUploadStatus) audioUploadStatus.textContent = "Wgrywanie audio...";
      const dataUrl = await readFileAsDataUrl(file);
      const response = await fetch("/api/upload-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moderatorPassword: profile && profile.moderatorPassword,
          fileName: file.name,
          mimeType: file.type,
          dataUrl: dataUrl
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.error) throw new Error(payload.error || "Nie udalo sie wgrac audio.");
      if (state && Array.isArray(payload.localAudioFiles)) state.localAudioFiles = payload.localAudioFiles;
      if (payload.file && payload.file.url) trackUrlInput.value = payload.file.url;
      if (audioUploadInput) audioUploadInput.value = "";
      if (audioUploadStatus) audioUploadStatus.textContent = payload.message || "Wgrano audio.";
      renderLocalAudioFiles();
      if (payload.file && payload.file.url && localAudioSelect) localAudioSelect.value = payload.file.url;
      showToast(payload.message || "Wgrano audio.");
      mod("refresh");
    } catch (error) {
      audioUploadButton.disabled = false;
      if (audioUploadStatus) audioUploadStatus.textContent = error && error.message ? error.message : "Nie udalo sie wczytac pliku.";
      showToast(error && error.message ? error.message : "Nie udalo sie wczytac pliku audio.");
    } finally {
      audioUploadButton.disabled = false;
    }
  });
}

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
  if (profile && profile.role === "solo") return "Losowy opening";
  const duration = Number((state && state.settings && state.settings.clipDuration) || 15);
  if (!state || !state.currentTrack) return "0-5 s / 5-" + duration + " s";
  const difficulty = state.currentTrack.difficulty || "medium";
  const scores = state.settings.difficultyScores[difficulty] || { first: 0, second: 0 };
  return DIFFICULTY_LABELS[difficulty] + ": " + scores.first + " pkt 0-5 s / " + scores.second + " pkt 5-" + duration + " s";
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

function soloPrerollLeft() {
  if (!state || state.phase !== "countdown") return 0;
  const localDelta = (Date.now() - lastStateAt) / 1000;
  return Math.max(0, Number(state.countdownLeft || 0) - localDelta);
}

function renderSoloPreroll() {
  if (!soloPreroll || !soloPrerollValue) return;
  const visible = Boolean(profile && profile.role === "solo" && state && state.phase === "countdown");
  soloPreroll.classList.toggle("hidden", !visible);
  if (!visible) return;

  const left = soloPrerollLeft();
  const number = Math.max(1, Math.ceil(left));
  const waitingForMedia = left <= 0 && !(state.solo && state.solo.mediaReady);
  soloPrerollValue.textContent = waitingForMedia ? "..." : String(number);
  soloPreroll.classList.toggle("waiting", waitingForMedia);
  phaseLabel.textContent = waitingForMedia ? "ladowanie" : String(number);
}

function renderAnswerCountdown() {
  const isPlayer = profile && profile.role === "player";
  const isModerator = profile && profile.role === "moderator";
  const buzzer = state && state.currentBuzzer;
  const show = Boolean((isPlayer || isModerator) && buzzer);
  if (!answerCountdown) return;

  answerCountdown.classList.toggle("hidden", !show);
  if (!show) return;

  const limit = Math.max(1, Number(buzzer.answerLimit || 15));
  const left = answerTimeLeft(buzzer);
  const percent = Math.max(0, Math.min(100, (left / limit) * 100));
  const expired = left <= 0 || buzzer.answerExpired;
  const isOwnTurn = ownId && buzzer.id === ownId;

  answerCountdown.classList.toggle("expired", expired);
  answerCountdown.classList.toggle("admin-countdown", Boolean(isModerator));
  answerCountdown.classList.toggle("own-turn", Boolean(isOwnTurn && !expired));
  answerCountdownLabel.textContent = expired
    ? (isModerator ? "Czas minal, wybierz decyzje" : "Czeka na decyzje administratora")
    : (isModerator ? "Czas odpowiedzi: " + buzzer.nickname : (isOwnTurn ? "Twoj czas na odpowiedz" : "Czas odpowiedzi: " + buzzer.nickname));
  answerCountdownValue.textContent = expired ? "0.0 s" : left.toFixed(1) + " s";
  answerCountdownFill.style.width = percent + "%";
}

function render() {
  if (!state) return;

  document.body.dataset.phase = state.phase || "ready";
  roomCodeLabel.textContent = state.code;
  renderTrackHeader();
  renderAdminAnimeCard();
  renderSoloDayStreak();
  phaseLabel.textContent = phaseText(state.phase);
  renderSoloPreroll();
  scoreWindowLabel.textContent = scoreWindowText();
  const soloProfileView = Boolean(profile && profile.role === "solo");
  peopleCount.textContent = soloProfileView ? "" : state.people.length + " osob";
  peopleCount.classList.toggle("hidden", soloProfileView);
  if (peopleSection) peopleSection.classList.toggle("hidden", Boolean(profile && profile.role === "solo"));
  if (peopleTitle) peopleTitle.textContent = "Osoby";

  document.documentElement.style.setProperty("--good-width", "50%");
  document.documentElement.style.setProperty("--ok-width", "50%");

  renderScores();
  renderPeople();
  renderLocalAudioFiles();
  renderTracks();
  renderLibrary();
  renderModerator();
  renderBlockedIps();
  renderSoloAnswerOptions();
  renderBuzzer();
  renderAnswerCountdown();
}

function renderLocalAudioFiles() {
  if ((!localAudioSelect && !fallbackAudioSelect) || !profile || profile.role !== "moderator") return;
  const currentValue = localAudioSelect ? (localAudioSelect.value || trackUrlInput.value) : "";
  const fallbackValue = fallbackAudioSelect ? fallbackAudioSelect.value : "";
  const files = state.localAudioFiles || [];
  if (localAudioSelect) {
    localAudioSelect.replaceChildren();
    localAudioSelect.append(new Option("Lokalne audio", ""));
  }
  if (fallbackAudioSelect) {
    fallbackAudioSelect.replaceChildren();
    fallbackAudioSelect.append(new Option("Awaryjne audio", ""));
  }
  files.forEach(function (file) {
    const label = file.name + (file.size ? " · " + Math.round(file.size / 1024 / 1024 * 10) / 10 + " MB" : "");
    if (localAudioSelect) localAudioSelect.append(new Option(label, file.url));
    if (fallbackAudioSelect) fallbackAudioSelect.append(new Option(label, file.url));
  });
  if (localAudioSelect) localAudioSelect.value = files.some((file) => file.url === currentValue) ? currentValue : "";
  if (fallbackAudioSelect) fallbackAudioSelect.value = files.some((file) => file.url === fallbackValue) ? fallbackValue : "";
}

function renderTrackHeader() {
  const track = state.currentTrack;
  if (!track) {
    trackTitle.textContent = "Brak openingu";
    trackArtist.textContent = "Administrator dodaje anime i opening w panelu.";
    trackTitle.classList.remove("hinted-title");
    return;
  }

  const animeHint = animeHintForTrack(track);
  trackTitle.textContent = animeHint || track.anime || "Anime ukryte";
  trackTitle.classList.toggle("hinted-title", Boolean(animeHint && !track.revealed));
  if (profile && profile.role === "solo" && state.solo && state.solo.mediaError) {
    trackTitle.textContent = "Opening nie zaladowal sie";
    trackTitle.classList.remove("hinted-title");
    trackArtist.textContent = "Kliknij Nastepny, zeby wylosowac inny.";
    return;
  }
  if (profile && profile.role === "solo" && state.solo && state.solo.answered) {
    trackArtist.textContent = state.solo.guessed ? "Zgadniete." : "Nie zgadniete.";
    return;
  }
  if (track.revealed) {
    const sourceLabel = track.source === "youtube" ? "YouTube" : "audio";
    trackArtist.textContent = track.opening || sourceLabel;
  } else if (profile && profile.role === "solo") {
    trackArtist.textContent = "Posluchaj openingu i wybierz anime z listy.";
  } else {
    trackArtist.textContent = "Anime i opening pokaza sie po czasie albo po kliknieciu Zgadniete.";
  }
}

function coverFallbackText(track) {
  return String((track && track.anime) || "?").trim().slice(0, 1).toUpperCase() || "?";
}

function setCoverBackground(element, url) {
  if (!element) return;
  if (!url) {
    element.style.backgroundImage = "";
    element.classList.remove("has-cover");
    return;
  }
  element.style.backgroundImage = "url(\"" + String(url).replace(/"/g, "%22") + "\")";
  element.classList.add("has-cover");
}

function renderAdminAnimeCard() {
  if (!adminAnimeCard || !mainGrid) return;
  const track = state && state.currentTrack;
  const show = Boolean(profile && profile.role === "moderator" && track);
  adminAnimeCard.classList.toggle("hidden", !show);
  mainGrid.classList.toggle("admin-info-visible", show);
  if (appShell) appShell.classList.toggle("admin-info-visible", show);
  if (playSurface) playSurface.classList.remove("admin-info-visible");
  if (!show) return;

  setCoverBackground(adminAnimeCover, track.coverUrl || "");
  if (adminAnimeCoverFallback) adminAnimeCoverFallback.textContent = coverFallbackText(track);
  if (adminAnimeName) adminAnimeName.textContent = track.anime || "Anime bez nazwy";
  if (adminAnimeDescription) adminAnimeDescription.textContent = track.description || "Brak opisu.";
}

function renderSoloDayStreak() {
  if (!soloDayStreakCard || !mainGrid) return;
  const show = Boolean(profile && profile.role === "solo");
  soloDayStreakCard.classList.toggle("hidden", !show);
  mainGrid.classList.toggle("solo-streak-visible", show);
  if (appShell) appShell.classList.toggle("solo-streak-visible", show);
  if (!show) return;

  const soloState = state && state.solo ? state.solo : {};
  const profileStats = state && state.soloProfile ? state.soloProfile : {};
  const streak = Math.max(0, Number(profileStats.todayStreak || 0));
  const todayBest = Math.max(streak, Math.max(0, Number(profileStats.todayBestStreak || 0)));
  const todayGuessed = Math.max(0, Number(profileStats.todayGuessed || soloState.todayGuessed || 0));
  const todayAttempts = Math.max(0, Number(profileStats.todayAttempts || soloState.todayAttempts || 0));

  soloDayStreakValue.textContent = String(streak);
  soloDayBestValue.textContent = String(todayBest);
  soloDayScoreValue.textContent = todayGuessed + "/" + todayAttempts;
  soloDayStreakCard.classList.toggle("is-hot", streak >= 3);
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

function renderSoloAnswerOptions() {
  if (!soloAnswerOptions) return;
  const options = Array.isArray(state && state.soloTitleOptions)
    ? state.soloTitleOptions
    : ((state && state.soloStats) || []).map((entry) => entry.anime).filter(Boolean);
  const seen = {};
  soloAnswerOptions.replaceChildren();
  options.forEach(function (title) {
    const key = normalizeAnswerText(title);
    if (!key || seen[key]) return;
    seen[key] = true;
    const option = document.createElement("option");
    option.value = title;
    soloAnswerOptions.append(option);
  });
}

function animeHintForTrack(track) {
  if (!state || !track || track.revealed) return "";
  const steps = Array.isArray(track.animeHintSteps) ? track.animeHintSteps : [];
  if (!steps.length) return "";
  const duration = Number((state.settings && state.settings.clipDuration) || 15);
  const startAt = Number.isFinite(Number(track.animeHintStartAt))
    ? Number(track.animeHintStartAt)
    : Math.max(0, duration - 3);
  if (estimatedElapsed() < startAt) return "";
  const hint = steps[0] || "";
  if (profile && profile.role === "solo") {
    const first = Array.from(String(hint)).find((char) => /[\p{L}\p{N}]/u.test(char));
    return first || "";
  }
  return hint;
}

function renderSoloPracticeScore() {
  const track = state.currentTrack;
  const soloState = state.solo || {};
  const profileStats = state.soloProfile || {};
  const daily = state.soloDaily || {};
  if (scoreTitle) scoreTitle.textContent = daily.active ? "Daily 10" : "Solo";
  if (soloRandomButton) soloRandomButton.classList.toggle("active", !daily.active);
  if (soloDailyButton) soloDailyButton.classList.toggle("active", Boolean(daily.active));
  const answered = Boolean(state.solo && state.solo.answered);
  const guessed = Boolean(state.solo && state.solo.guessed);
  const streak = Math.max(0, Number((state.solo && state.solo.streak) || 0));
  const bestStreak = Math.max(0, Number(profileStats.bestStreak || soloState.bestStreak || streak || 0));
  const todayGuessed = Number(profileStats.todayGuessed || soloState.todayGuessed || 0);
  const todayAttempts = Number(profileStats.todayAttempts || soloState.todayAttempts || 0);
  const card = node("div", "solo-summary-card tournament-card");
  card.classList.toggle("solo-answer-correct", Boolean(answered && guessed));
  card.classList.toggle("solo-answer-wrong", Boolean(answered && !guessed));
  card.classList.toggle("solo-daily-active", Boolean(daily.active));

  if (!track) {
    const message = daily.active && daily.completed
      ? "Daily 10 ukonczone na dzisiaj."
      : "Brak openingow do losowania.";
    card.append(node("b", "solo-summary-empty", message));
    scoreboard.append(card);
    return;
  }

  const head = node("div", "solo-summary-head");
  const copy = node("div", "solo-summary-copy");
  const title = answered
    ? (guessed ? "Zgadniete" : "Nie zgadniete")
    : (daily.active ? "Daily 10" : "Streak");
  const detail = answered && state.solo.answerText
    ? "Wybrano: " + state.solo.answerText
    : (answered ? "Odpowiedz zapisana" : (daily.active ? "Ten sam zestaw przez 24h" : streak + " zgadnietych z rzedu"));
  copy.append(node("b", "", title), node("span", "", detail));
  head.append(copy, node("strong", "solo-summary-value", String(streak)));
  card.append(head);

  const miniStats = node("div", "solo-mini-stats");
  miniStats.append(
    soloMiniStat("Rekord", String(bestStreak)),
    soloMiniStat("Dzisiaj", todayGuessed + "/" + todayAttempts)
  );
  if (daily.active) miniStats.append(soloMiniStat("Daily", Number(daily.guessed || 0) + "/" + Number(daily.total || 0)));
  card.append(miniStats);

  if (daily.active) {
    const total = Math.max(1, Number(daily.total || 10));
    const done = Math.max(0, total - Number(daily.remaining || 0));
    const progress = node("div", "solo-daily-progress");
    const progressText = node("div", "solo-daily-text");
    progressText.append(node("b", "", "Daily 10"), node("span", "", done + "/" + total + " / zostalo: " + Number(daily.remaining || 0)));
    const bar = node("div", "solo-daily-bar");
    const fill = node("span", "solo-daily-fill");
    fill.style.width = Math.max(0, Math.min(100, (done / total) * 100)) + "%";
    bar.append(fill);
    progress.append(progressText, bar);
    card.append(progress);
  }

  const history = Array.isArray(profileStats.history) ? profileStats.history.slice(0, 3) : [];
  if (history.length) {
    const historyBox = node("div", "solo-compact-history");
    history.forEach(function (item) {
      const itemRow = node("div", "solo-compact-history-row " + (item.guessed ? "correct" : "wrong"));
      itemRow.append(
        node("b", "", item.guessed ? "OK" : "X"),
        node("span", "", item.anime || "Anime")
      );
      historyBox.append(itemRow);
    });
    card.append(historyBox);
  }
  scoreboard.append(card);
}

function soloMiniStat(label, value) {
  const stat = node("div", "solo-mini-stat");
  stat.append(node("span", "", label), node("strong", "", value));
  return stat;
}

function renderScores() {
  scoreboard.replaceChildren();
  if (profile && profile.role === "solo") {
    renderSoloPracticeScore();
    return;
  }
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
      row.classList.add("with-actions");
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
    if (profile && profile.role === "moderator" && person.role === "player") {
      const actions = node("div", "person-actions");
      const kick = node("button", "", "Wyrzuc");
      const addOne = node("button", "point-action", "+1");
      const addTwo = node("button", "point-action", "+2");
      const minusOne = node("button", "point-action", "-1");
      const blockIp = node("button", "", "Blokuj");
      kick.type = "button";
      addOne.type = "button";
      addTwo.type = "button";
      minusOne.type = "button";
      blockIp.type = "button";
      kick.addEventListener("click", () => mod("kickPlayer", { playerId: person.id }));
      addOne.addEventListener("click", () => mod("award", { playerId: person.id, team: person.team, points: 1 }));
      addTwo.addEventListener("click", () => mod("award", { playerId: person.id, team: person.team, points: 2 }));
      minusOne.addEventListener("click", () => mod("award", { playerId: person.id, team: person.team, points: -1 }));
      blockIp.addEventListener("click", () => mod("blockIp", { playerId: person.id }));
      actions.append(addOne, addTwo, minusOne, kick, blockIp);
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
  if (profile && profile.role === "moderator" && person.role === "player") {
    row.classList.add("with-actions");
    const actions = node("div", "person-actions");
    const kick = node("button", "", "Wyrzuc");
    const addOne = node("button", "point-action", "+1");
    const addTwo = node("button", "point-action", "+2");
    const minusOne = node("button", "point-action", "-1");
    const blockIp = node("button", "", "Blokuj");
    kick.type = "button";
    addOne.type = "button";
    addTwo.type = "button";
    minusOne.type = "button";
    blockIp.type = "button";
    kick.addEventListener("click", () => mod("kickPlayer", { playerId: person.id }));
    addOne.addEventListener("click", () => mod("award", { playerId: person.id, team: person.team, points: 1 }));
    addTwo.addEventListener("click", () => mod("award", { playerId: person.id, team: person.team, points: 2 }));
    minusOne.addEventListener("click", () => mod("award", { playerId: person.id, team: person.team, points: -1 }));
    blockIp.addEventListener("click", () => mod("blockIp", { playerId: person.id }));
    actions.append(addOne, addTwo, minusOne, kick, blockIp);
    row.append(meta, actions);
  } else {
    const dot = node("span", "role-dot " + (person.role === "moderator" ? "moderator" : ""));
    row.append(meta, dot);
  }

  return row;
}

function renderPeople() {
  peopleList.replaceChildren();
  if (profile && profile.role === "solo") {
    const track = state.currentTrack;
    if (!track) {
      peopleList.append(node("p", "muted empty-row", "Losowanie openingu..."));
      return;
    }
    const row = node("div", "person-row tournament-card own-player");
    const meta = node("div", "person-meta");
    const answered = state.solo && state.solo.answered;
    const resultText = answered
      ? (state.solo.guessed ? "Zapisano jako zgadniete" : "Zapisano jako niezgadniete")
      : (state.phase === "playing" ? "Trwa proba" : "Kliknij Wlacz dzwiek, zeby zaczac");
    meta.append(node("b", "", track.revealed ? (track.anime || "Anime bez nazwy") : "Anime ukryte"), node("span", "", resultText));
    const dot = node("span", "role-dot");
    row.append(meta, dot);
    peopleList.append(row);
    return;
  }

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
  const duration = Number((state && state.settings && state.settings.clipDuration) || 15);
  return (track.opening || "opening bez nazwy")
    + " / " + DIFFICULTY_LABELS[track.difficulty || "medium"]
    + " / " + (track.source === "youtube" ? "YouTube" : "audio")
    + (durationLabel(track) ? " / " + durationLabel(track) : "")
    + " / 0-5 od " + formatSeconds(track.startAtFirst)
    + " / 5-" + duration + " od " + formatSeconds(track.startAtSecond);
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

function qualityStatuses() {
  const statuses = Array.isArray(state && state.qualityStatuses) ? state.qualityStatuses : [];
  return statuses.length ? statuses : [
    { key: "ok", label: "Dziala" },
    { key: "slow", label: "Wolno sie laduje" },
    { key: "reported", label: "Zgloszone" },
    { key: "needs_fix", label: "Do poprawy" },
    { key: "verified", label: "Sprawdzone" }
  ];
}

function qualityLabel(value) {
  const key = value || "ok";
  const found = qualityStatuses().find((status) => status.key === key);
  return found ? found.label : "Dziala";
}

function qualitySelect(value) {
  const select = document.createElement("select");
  qualityStatuses().forEach(function (status) {
    const option = document.createElement("option");
    option.value = status.key;
    option.textContent = status.label;
    option.selected = status.key === (value || "ok");
    select.append(option);
  });
  return select;
}

function qualityPill(status, disabled) {
  const label = disabled ? "Wylaczone" : qualityLabel(status);
  const pill = node("span", "quality-pill quality-" + (disabled ? "disabled" : (status || "ok")), label);
  return pill;
}

function updateSoloQuality(entry, status, disabled) {
  if (!entry || !entry.key) return;
  mod("updateSoloStatQuality", {
    key: entry.key,
    trackId: entry.trackId,
    qualityStatus: status || entry.qualityStatus || "ok",
    disabled: Boolean(disabled)
  });
}

function clearSoloMediaError(entry) {
  if (!entry || !entry.key) return;
  mod("clearSoloMediaError", { key: entry.key, trackId: entry.trackId });
}

function editStatTrack(entry) {
  if (!entry) return;
  editReportedTrack({
    trackKey: entry.key,
    trackId: entry.trackId,
    anime: entry.anime,
    opening: entry.opening,
    aliases: entry.aliases,
    difficulty: entry.difficulty,
    audioUrl: entry.audioUrl,
    fallbackAudioUrl: entry.fallbackAudioUrl,
    startAtFirst: entry.startAtFirst,
    startAtSecond: entry.startAtSecond,
    coverUrl: entry.coverUrl,
    description: entry.description
  });
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

function youtubeIdFromUrl(value) {
  const text = String(value || "");
  const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/)
    || text.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : "";
}

function libraryStatForTrack(track) {
  const stats = Array.isArray(state && state.soloStats) ? state.soloStats : [];
  const videoId = String(track.videoId || youtubeIdFromUrl(track.audioUrl)).trim();
  const audioUrl = String(track.audioUrl || "").trim();
  const anime = normalizeAnswerText(track.anime || "");
  const opening = normalizeAnswerText(track.opening || "");

  return stats.find(function (entry) {
    if (videoId && String(entry.videoId || "").trim() === videoId) return true;
    if (audioUrl && String(entry.audioUrl || "").trim() === audioUrl) return true;
    const entryAnime = normalizeAnswerText(entry.anime || "");
    const entryOpening = normalizeAnswerText(entry.opening || "");
    return anime && entryAnime === anime && (!opening || entryOpening === opening);
  }) || null;
}

function libraryProblemInfo(track, stat) {
  const quality = (stat && stat.qualityStatus) || track.qualityStatus || "ok";
  const reports = Number((stat && stat.reportsCount) || 0);
  return {
    quality: quality,
    reports: reports,
    mediaError: Boolean(stat && stat.mediaError),
    disabled: Boolean(stat && stat.disabled),
    missingMeta: !track.coverUrl || !track.description,
    noAudio: !track.audioUrl && !track.fallbackAudioUrl,
    percent: stat && Number.isFinite(Number(stat.percent)) ? Number(stat.percent) : null,
    attempts: stat ? Number(stat.attempts || 0) : 0
  };
}

function libraryTrackSearchText(track) {
  return normalizeAnswerText([
    track.anime,
    track.opening,
    track.audioUrl,
    track.fallbackAudioUrl,
    track.sourceTitle,
    track.description,
    Array.isArray(track.aliases) ? track.aliases.join(" ") : track.aliases
  ].join(" "));
}

function libraryStatusMatches(track, stat) {
  const info = libraryProblemInfo(track, stat);
  if (libraryStatus === "reported") return info.reports > 0 || info.quality === "reported";
  if (libraryStatus === "broken") return info.mediaError || info.disabled || info.quality === "needs_fix";
  if (libraryStatus === "missing_meta") return info.missingMeta;
  if (libraryStatus === "no_audio") return info.noAudio;
  if (libraryStatus === "problem") {
    return info.mediaError || info.disabled || info.reports > 0 || info.quality === "needs_fix"
      || info.quality === "reported" || info.missingMeta || info.noAudio;
  }
  return true;
}

function libraryPercentMatches(stat) {
  const attempts = Number((stat && stat.attempts) || 0);
  const percent = Number((stat && stat.percent) || 0);
  if (libraryPercent === "no_stats") return attempts <= 0;
  if (libraryPercent === "100_80") return attempts > 0 && percent >= 80;
  if (libraryPercent === "79_60") return attempts > 0 && percent >= 60 && percent < 80;
  if (libraryPercent === "59_40") return attempts > 0 && percent >= 40 && percent < 60;
  if (libraryPercent === "39_20") return attempts > 0 && percent >= 20 && percent < 40;
  if (libraryPercent === "19_0") return attempts > 0 && percent >= 0 && percent < 20;
  return true;
}

function filteredLibraryTracks(tracks) {
  const search = normalizeAnswerText(librarySearch);
  return tracks.filter(function (track) {
    const stat = libraryStatForTrack(track);
    if (libraryDifficulty !== "all" && (track.difficulty || "medium") !== libraryDifficulty) return false;
    if (!libraryPercentMatches(stat)) return false;
    if (search && !libraryTrackSearchText(track).includes(search)) return false;
    return libraryStatusMatches(track, stat);
  }).sort(function (a, b) {
    const statA = libraryStatForTrack(a);
    const statB = libraryStatForTrack(b);
    const infoA = libraryProblemInfo(a, statA);
    const infoB = libraryProblemInfo(b, statB);
    if (librarySort === "name") return String(a.anime || "").localeCompare(String(b.anime || ""));
    if (librarySort === "hardest") {
      const percentA = infoA.attempts ? infoA.percent : 101;
      const percentB = infoB.attempts ? infoB.percent : 101;
      if (percentA !== percentB) return percentA - percentB;
      if (infoB.attempts !== infoA.attempts) return infoB.attempts - infoA.attempts;
      return String(a.anime || "").localeCompare(String(b.anime || ""));
    }
    if (librarySort === "most_reports") {
      if (infoB.reports !== infoA.reports) return infoB.reports - infoA.reports;
      if (Number(infoB.mediaError) !== Number(infoA.mediaError)) return Number(infoB.mediaError) - Number(infoA.mediaError);
      return String(a.anime || "").localeCompare(String(b.anime || ""));
    }
    const order = Object.keys(DIFFICULTY_LABELS);
    const diffA = order.indexOf(a.difficulty || "medium");
    const diffB = order.indexOf(b.difficulty || "medium");
    if (diffA !== diffB) return diffA - diffB;
    return String(a.anime || "").localeCompare(String(b.anime || ""));
  });
}

function libraryBadges(track, stat) {
  const info = libraryProblemInfo(track, stat);
  const badges = node("div", "library-badges");
  if (info.percent != null) badges.append(node("span", "library-badge", info.percent + "%"));
  if (info.reports > 0) badges.append(node("span", "library-badge warning", info.reports + " zgl."));
  if (info.mediaError || info.quality === "needs_fix") badges.append(node("span", "library-badge danger", "blad"));
  if (info.missingMeta) badges.append(node("span", "library-badge", "meta"));
  if (info.noAudio) badges.append(node("span", "library-badge danger", "audio"));
  if (!badges.childNodes.length) badges.append(node("span", "library-badge ok", "ok"));
  return badges;
}

function renderLibrary() {
  if (!libraryList || !profile || profile.role !== "moderator") return;
  const tracks = state.libraryTracks || [];
  const filteredTracks = filteredLibraryTracks(tracks);
  libraryList.replaceChildren();
  libraryCount.textContent = filteredTracks.length === tracks.length
    ? String(tracks.length)
    : filteredTracks.length + " / " + tracks.length;
  if (librarySearchInput && librarySearchInput.value !== librarySearch) librarySearchInput.value = librarySearch;
  if (libraryDifficultyFilter && libraryDifficultyFilter.value !== libraryDifficulty) libraryDifficultyFilter.value = libraryDifficulty;
  if (libraryPercentFilter && libraryPercentFilter.value !== libraryPercent) libraryPercentFilter.value = libraryPercent;
  if (libraryStatusFilter && libraryStatusFilter.value !== libraryStatus) libraryStatusFilter.value = libraryStatus;
  if (librarySortInput && librarySortInput.value !== librarySort) librarySortInput.value = librarySort;

  if (!tracks.length) {
    libraryList.append(node("p", "muted empty-row", "Biblioteka jest pusta."));
    return;
  }

  if (!filteredTracks.length) {
    libraryList.append(node("p", "muted empty-row", "Brak openingow dla wybranych filtrow."));
    return;
  }

  const groups = librarySort === "difficulty"
    ? Object.keys(DIFFICULTY_LABELS).map(function (difficulty) {
      return {
        title: DIFFICULTY_LABELS[difficulty],
        items: filteredTracks.filter((track) => (track.difficulty || "medium") === difficulty)
      };
    })
    : [{ title: "Wyniki", items: filteredTracks }];

  groups.forEach(function (group) {
    const items = group.items;
    if (!items.length) return;

    const section = node("div", "library-difficulty");
    const title = node("div", "library-difficulty-title");
    title.append(node("b", "", group.title), node("span", "", items.length + " openingow"));
    const list = node("div", "library-difficulty-list");

    items.forEach(function (track) {
      const stat = libraryStatForTrack(track);
      const info = libraryProblemInfo(track, stat);
      const row = node("div", "library-row");
      if (info.mediaError || info.quality === "needs_fix" || info.noAudio) row.classList.add("library-row-problem");
      const meta = node("div", "track-meta");
      meta.append(node("b", "", track.anime || "Anime bez nazwy"), node("span", "", trackSubtitle(track)), libraryBadges(track, stat));

      const actions = node("div", "track-actions");
      const difficulty = difficultySelect(track.difficulty || "medium");
      difficulty.title = "Zmien poziom w bibliotece";
      difficulty.addEventListener("change", function () {
        mod("updateLibraryDifficulty", { trackId: track.id, difficulty: difficulty.value });
        showToast("Zmieniono poziom w bibliotece.");
      });
      const add = node("button", "primary", "Do rundy");
      const edit = node("button", "", "Edytuj");
      const remove = node("button", "danger-button", "Usun");
      add.type = "button";
      edit.type = "button";
      remove.type = "button";
      add.addEventListener("click", () => mod("addLibraryToMain", { trackId: track.id }));
      edit.addEventListener("click", () => editTrack(track, "library"));
      remove.addEventListener("click", () => mod("removeLibraryTrack", { trackId: track.id }));
      actions.append(difficulty, add, edit, remove);
      row.append(meta, actions);
      list.append(row);
    });

    section.append(title, list);
    libraryList.append(section);
  });
}

function renderAdminRooms() {
  if (!adminRoomList || !adminRoomsCount || !profile || profile.role !== "moderator") return;
  const rooms = state.adminRooms || [];
  adminRoomList.replaceChildren();
  adminRoomsCount.textContent = rooms.length + " pokoi";

  if (!rooms.length) {
    adminRoomList.append(node("p", "muted empty-row", "Brak zapisanych gier."));
    return;
  }

  rooms.forEach(function (room) {
    const row = node("div", "admin-room-row tournament-card" + (room.current ? " current" : ""));
    const meta = node("div", "track-meta");
    const status = room.active ? "online" : "zapisany";
    const details = status
      + " / " + Number(room.players || 0) + " graczy"
      + " / " + Number(room.tracks || 0) + " openingow"
      + " / " + Number(room.results || 0) + " wynikow";
    meta.append(
      node("b", "", room.code || "LOBBY"),
      node("span", "", details)
    );
    if (room.currentAnime) meta.append(node("span", "", "Teraz: " + room.currentAnime));

    const actions = node("div", "track-actions");
    const enter = node("button", room.current ? "primary" : "", room.current ? "Aktywny" : "Wejdz");
    const remove = node("button", "danger-button", "Usun");
    enter.type = "button";
    remove.type = "button";
    enter.disabled = Boolean(room.current);
    enter.addEventListener("click", function () {
      switchAdminRoom(room.code);
    });
    remove.addEventListener("click", function () {
      if (!window.confirm("Usunac pokoj " + room.code + "?")) return;
      mod("removeRoom", { roomCode: room.code });
    });
    actions.append(enter, remove);
    row.append(meta, actions);
    adminRoomList.append(row);
  });
}

function centerAction(label, action, className) {
  const button = node("button", className || "", label);
  button.type = "button";
  button.addEventListener("click", function () {
    mod(action);
  });
  return button;
}

function downloadJsonFile(fileName, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.append(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function exportTournamentResults() {
  if (!state) return;
  downloadJsonFile("anime-opening-quiz-wyniki-" + (state.code || "LOBBY") + ".json", {
    room: state.code,
    exportedAt: new Date().toISOString(),
    teams: state.teams || {},
    people: state.people || [],
    tracks: (state.tracks || []).map(function (track) {
      return {
        anime: track.anime,
        opening: track.opening,
        difficulty: track.difficulty,
        result: track.result || null
      };
    })
  });
  showToast("Wyniki turnieju pobrane.");
}

function renderAdminCenter() {
  if (!adminCenterGrid || !profile || profile.role !== "moderator") return;
  const track = state.currentTrack;
  const buzzer = state.currentBuzzer;
  const stats = state.soloStats || [];
  const reports = state.soloReports || [];
  const persistence = state.persistence || {};
  const problemCount = stats.filter((entry) => entry.mediaError || entry.disabled || entry.qualityStatus === "needs_fix" || entry.reportsCount).length;
  adminCenterGrid.replaceChildren();
  if (adminCenterPhase) adminCenterPhase.textContent = phaseText(state.phase);

  const nowCard = node("div", "admin-center-card tournament-card");
  const nowMeta = node("div", "track-meta");
  nowMeta.append(
    node("b", "", track ? (track.anime || "Anime bez nazwy") : "Brak openingu"),
    node("span", "", track ? trackSubtitle(track) : "Dodaj albo wybierz opening.")
  );
  if (track) nowMeta.append(qualityPill(track.qualityStatus || "ok", false));
  const nowActions = node("div", "admin-center-actions");
  nowActions.append(
    centerAction("Start", "play", "primary"),
    centerAction("Pauza", "pause"),
    centerAction("Dalej", "nextTrack"),
    centerAction("Reset", "resetScores")
  );
  nowCard.append(nowMeta, nowActions);

  const buzzCard = node("div", "admin-center-card tournament-card");
  const buzzMeta = node("div", "track-meta");
  buzzMeta.append(
    node("b", "", buzzer ? buzzer.nickname : "Brak odpowiedzi"),
    node("span", "", buzzer ? (buzzer.team + " / " + formatSeconds(buzzer.buzzedAt) + " / " + buzzer.suggestedPoints + " pkt") : "Czekam na pierwszy przycisk.")
  );
  const buzzActions = node("div", "admin-center-actions");
  const guessed = node("button", "primary", "Zgadniete");
  const rejected = node("button", "", "Bledne");
  const resume = node("button", "", "Odpauzuj");
  guessed.type = "button";
  rejected.type = "button";
  resume.type = "button";
  guessed.disabled = !buzzer;
  rejected.disabled = !buzzer;
  guessed.addEventListener("click", function () { mod("guessed"); });
  rejected.addEventListener("click", function () { mod("rejectBuzz"); });
  resume.addEventListener("click", function () { mod("resume"); });
  buzzActions.append(guessed, rejected, resume);
  buzzCard.append(buzzMeta, buzzActions);

  const roomCard = node("div", "admin-center-card tournament-card");
  const players = (state.people || []).filter((person) => person.role === "player").length;
  const groups = new Set((state.people || []).filter((person) => person.role === "player").map((person) => person.team || "Solo"));
  const roomMeta = node("div", "track-meta");
  roomMeta.append(
    node("b", "", "Pokoj " + (state.code || "LOBBY")),
    node("span", "", players + " graczy / " + groups.size + " grup / " + (state.tracks || []).length + " openingow")
  );
  const roomActions = node("div", "admin-center-actions");
  const exportResults = node("button", "", "Eksport wynikow");
  exportResults.type = "button";
  exportResults.addEventListener("click", exportTournamentResults);
  roomActions.append(node("div", "admin-center-kpi", String(players)), exportResults);
  roomCard.append(roomMeta, roomActions);

  const qualityCard = node("div", "admin-center-card tournament-card");
  const qualityMeta = node("div", "track-meta");
  qualityMeta.append(
    node("b", "", "Kontrola jakosci"),
    node("span", "", problemCount + " do sprawdzenia / " + reports.length + " zgloszen")
  );
  const qualityActions = node("div", "admin-center-actions");
  const openQuality = node("button", "", "Otworz jakosc");
  openQuality.type = "button";
  openQuality.addEventListener("click", function () {
    activeAdminPanel = "quality";
    renderAdminPanelTabs();
  });
  qualityActions.append(openQuality);
  qualityCard.append(qualityMeta, qualityActions);

  const dataCard = node("div", "admin-center-card tournament-card");
  const dataMeta = node("div", "track-meta");
  dataMeta.append(
    node("b", "", "Dane i backup"),
    node("span", "", (persistence.label || "JSON") + " / auto-backup wlaczony")
  );
  if (persistence.warning) dataMeta.append(node("span", "media-error-note", persistence.warning));
  const dataActions = node("div", "admin-center-actions");
  const openBackup = node("button", "", "Backup");
  openBackup.type = "button";
  openBackup.addEventListener("click", function () {
    activeAdminPanel = "backup";
    renderAdminPanelTabs();
  });
  dataActions.append(openBackup);
  dataCard.append(dataMeta, dataActions);

  adminCenterGrid.append(nowCard, buzzCard, roomCard, qualityCard, dataCard);
}

function renderAdminSoloPlayers() {
  if (!adminSoloPlayersList || !adminSoloPlayersCount || !profile || profile.role !== "moderator") return;
  const players = Array.isArray(state.soloLeaderboard) ? state.soloLeaderboard : [];
  const dailyPlayers = Array.isArray(state.dailySoloLeaderboard) ? state.dailySoloLeaderboard : [];
  adminSoloPlayersList.replaceChildren();
  adminSoloPlayersCount.textContent = players.length + " graczy / daily " + dailyPlayers.length;

  if (!players.length && !dailyPlayers.length) {
    adminSoloPlayersList.append(node("p", "muted empty-row", "Brak zapisanych graczy solo."));
    return;
  }

  if (dailyPlayers.length) {
    const dailySection = node("div", "solo-ranking-section");
    const dailyTitle = node("div", "stats-category-title");
    dailyTitle.append(node("b", "", "Daily 10"), node("span", "", dailyPlayers.length + " graczy"));
    dailySection.append(dailyTitle);
    dailyPlayers.slice(0, 10).forEach(function (player, index) {
      const row = node("div", "score-row tournament-card solo-player-row daily-player-row");
      const meta = node("div", "person-meta score-meta");
      meta.append(
        node("b", "", (index + 1) + ". " + (player.nickname || "Solo")),
        node("span", "", Number(player.guessed || 0) + "/" + Number(player.attempts || 0) + " / streak: " + Number(player.bestStreak || 0))
      );
      const scoreValue = node("div", "score-value");
      scoreValue.append(node("strong", "", String(Number(player.percent || 0)) + "%"));
      row.append(meta, scoreValue);
      dailySection.append(row);
    });
    adminSoloPlayersList.append(dailySection);
  }

  if (players.length) {
    const allTitle = node("div", "stats-category-title");
    allTitle.append(node("b", "", "Ranking caly"), node("span", "", players.length + " graczy"));
    adminSoloPlayersList.append(allTitle);
  }

  players.forEach(function (player, index) {
    const row = node("div", "score-row tournament-card solo-player-row");
    const meta = node("div", "person-meta score-meta");
    meta.append(
      node("b", "", (index + 1) + ". " + (player.nickname || "Solo")),
      node("span", "", "best streak: " + Number(player.bestStreak || 0) + " / teraz: " + Number(player.streak || 0))
    );
    const details = node("div", "solo-player-details");
    details.append(
      node("span", "", Number(player.guessed || 0) + "/" + Number(player.attempts || 0) + " zgadnietych"),
      node("span", "", "dzisiaj: " + Number(player.todayGuessed || 0) + "/" + Number(player.todayAttempts || 0))
    );
    meta.append(details);
    const scoreValue = node("div", "score-value");
    scoreValue.append(node("strong", "", String(Number(player.percent || 0)) + "%"));
    row.append(meta, scoreValue);
    adminSoloPlayersList.append(row);
  });
}

function renderAdminQuality() {
  if (!adminQualityList || !adminQualityCount || !profile || profile.role !== "moderator") return;
  const stats = state.soloStats || [];
  const rows = stats.filter((entry) => entry.mediaError || entry.disabled || entry.reportsCount || entry.qualityStatus !== "ok");
  const displayRows = rows.length ? rows : stats.slice(0, 20);
  adminQualityList.replaceChildren();
  adminQualityCount.textContent = rows.length ? rows.length + " do sprawdzenia" : stats.length + " sprawdzone";

  if (!displayRows.length) {
    adminQualityList.append(node("p", "muted empty-row", "Brak openingow w bibliotece."));
    return;
  }

  displayRows.forEach(function (entry) {
    const row = node("div", "quality-row tournament-card");
    if (entry.mediaError || entry.qualityStatus === "needs_fix") row.classList.add("media-error");
    const meta = node("div", "track-meta");
    const title = [entry.anime, entry.opening].filter(Boolean).join(" / ") || "Anime bez nazwy";
    const detail = [
      entry.mediaError ? "blad ladowania" : "",
      entry.loadFailures ? entry.loadFailures + " awarii" : "",
      entry.reportsCount ? entry.reportsCount + " zgloszen" : "",
      entry.verifiedAt ? "sprawdzone: " + formatReportDate(entry.verifiedAt) : "",
      entry.disabled ? "wylaczone z solo" : "",
      DIFFICULTY_LABELS[entry.difficulty || "medium"] || "Medium"
    ].filter(Boolean).join(" / ");
    meta.append(node("b", "", title), node("span", "", detail || "bez problemow"));
    if (entry.mediaErrorReason) meta.append(node("span", "media-error-note", entry.mediaErrorReason));

    const tools = node("div", "quality-tools");
    const select = qualitySelect(entry.qualityStatus || "ok");
    const save = node("button", "", "Zapisz");
    const disable = node("button", entry.disabled ? "" : "danger-button", entry.disabled ? "Odblokuj solo" : "Wylacz solo");
    const clear = node("button", "", "Wyczysc blad");
    const edit = node("button", "", "Edytuj");
    save.type = "button";
    disable.type = "button";
    clear.type = "button";
    edit.type = "button";
    clear.disabled = !entry.mediaError;
    save.addEventListener("click", function () {
      updateSoloQuality(entry, select.value, entry.disabled);
      showToast("Zapisano status jakosci.");
    });
    disable.addEventListener("click", function () {
      updateSoloQuality(entry, select.value, !entry.disabled);
      showToast(entry.disabled ? "Opening odblokowany w solo." : "Opening wylaczony z solo.");
    });
    clear.addEventListener("click", function () {
      clearSoloMediaError(entry);
      showToast("Wyczyszczono blad ladowania.");
    });
    edit.addEventListener("click", function () {
      editStatTrack(entry);
    });
    tools.append(qualityPill(entry.qualityStatus || "ok", entry.disabled), select, save, disable, clear, edit);
    row.append(meta, tools);
    adminQualityList.append(row);
  });
}

const STATS_PERCENT_CATEGORIES = [
  { key: "very_easy", label: "Very easy", range: "100-80%", min: 80, max: 100 },
  { key: "easy", label: "Easy", range: "79-60%", min: 60, max: 79 },
  { key: "medium", label: "Medium", range: "59-40%", min: 40, max: 59 },
  { key: "hard", label: "Hard", range: "39-20%", min: 20, max: 39 },
  { key: "impossible", label: "Impossible", range: "19-0%", min: 0, max: 19 }
];

function statsCategoryForPercent(percent) {
  const value = Math.max(0, Math.min(100, Number(percent || 0)));
  return STATS_PERCENT_CATEGORIES.find((category) => value >= category.min && value <= category.max)
    || STATS_PERCENT_CATEGORIES[STATS_PERCENT_CATEGORIES.length - 1];
}

function sortedStatsRows(stats) {
  return stats.slice().sort(function (a, b) {
    if (adminStatsSort === "hardest") {
      const missedDiff = Number(b.missed || 0) - Number(a.missed || 0);
      if (missedDiff !== 0) return missedDiff;
      const percentDiff = Number(a.percent || 0) - Number(b.percent || 0);
      if (percentDiff !== 0) return percentDiff;
      const attemptsDiff = Number(b.attempts || 0) - Number(a.attempts || 0);
      if (attemptsDiff !== 0) return attemptsDiff;
      return String(a.anime || "").localeCompare(String(b.anime || ""));
    }
    const diff = Number(a.percent || 0) - Number(b.percent || 0);
    if (diff !== 0) return adminStatsSort === "asc" ? diff : -diff;
    const attemptsDiff = Number(a.attempts || 0) - Number(b.attempts || 0);
    if (attemptsDiff !== 0) return adminStatsSort === "asc" ? attemptsDiff : -attemptsDiff;
    return String(a.anime || "").localeCompare(String(b.anime || ""));
  });
}

function renderAdminSoloStats() {
  if (!adminSoloStatsList || !adminSoloStatsCount || !profile || profile.role !== "moderator") return;
  const stats = state.soloStats || [];
  adminSoloStatsList.replaceChildren();
  adminSoloStatsCount.textContent = stats.length + " openingow";
  if (statsSortDescButton) statsSortDescButton.classList.toggle("active", adminStatsSort === "desc");
  if (statsSortAscButton) statsSortAscButton.classList.toggle("active", adminStatsSort === "asc");
  if (statsSortHardestButton) statsSortHardestButton.classList.toggle("active", adminStatsSort === "hardest");

  if (!stats.length) {
    adminSoloStatsList.append(node("p", "muted empty-row", "Brak zapisanych odpowiedzi solo."));
    return;
  }

  const rowsByCategory = {};
  STATS_PERCENT_CATEGORIES.forEach(function (category) {
    rowsByCategory[category.key] = [];
  });

  sortedStatsRows(stats).forEach(function (entry) {
    rowsByCategory[statsCategoryForPercent(entry.percent).key].push(entry);
  });

  const categories = adminStatsSort === "asc" || adminStatsSort === "hardest"
    ? STATS_PERCENT_CATEGORIES.slice().reverse()
    : STATS_PERCENT_CATEGORIES;

  categories.forEach(function (category) {
    const rows = rowsByCategory[category.key] || [];
    if (!rows.length) return;

    const section = node("div", "stats-category");
    const title = node("div", "stats-category-title");
    title.append(node("b", "", category.label), node("span", "", category.range + " / " + rows.length + " openingow"));
    const list = node("div", "stats-category-list");

    rows.forEach(function (entry) {
      const row = node("div", "score-row tournament-card solo-stat-row");
      if (entry.current) row.classList.add("own-player");
      if (entry.mediaError) row.classList.add("media-error");
      const meta = node("div", "person-meta score-meta");
      const detail = entry.attempts
        ? entry.guessed + "/" + entry.attempts + " zgadnietych"
          + " / gry: " + Number(entry.gameAttempts || 0)
          + " / solo: " + Number(entry.soloAttempts || 0)
          + " / pudla: " + Number(entry.missed || 0)
        : "brak odpowiedzi";
      meta.append(node("b", "", entry.anime || "Anime bez nazwy"), node("span", "", detail));
      if (entry.mediaError) {
        meta.append(node("span", "media-error-note", "Blad ladowania" + (entry.mediaErrorReason ? ": " + entry.mediaErrorReason : "")));
      }
      const scoreValue = node("div", "score-value");
      const difficulty = entry.difficulty || "medium";
      const difficultyTools = node("div", "stats-difficulty-control");
      const currentDifficulty = node("span", "stat-difficulty-pill", DIFFICULTY_LABELS[difficulty] || "Medium");
      const difficultyInput = difficultySelect(difficulty);
      const qualityInput = qualitySelect(entry.qualityStatus || "ok");
      const changeDifficulty = node("button", "", "Zmien");
      const changeQuality = node("button", "", "Jakosc");
      changeDifficulty.type = "button";
      changeQuality.type = "button";
      changeDifficulty.addEventListener("click", function () {
        mod("updateSoloStatDifficulty", { key: entry.key, difficulty: difficultyInput.value });
        showToast("Zmieniono poziom openingu.");
      });
      changeQuality.addEventListener("click", function () {
        updateSoloQuality(entry, qualityInput.value, entry.disabled);
        showToast("Zapisano status jakosci.");
      });
      difficultyTools.append(currentDifficulty, difficultyInput, changeDifficulty, qualityPill(entry.qualityStatus || "ok", entry.disabled), qualityInput, changeQuality);
      if (entry.mediaError) scoreValue.append(node("span", "media-error-pill", "blad"));
      scoreValue.append(difficultyTools, node("strong", "", String(Number(entry.percent || 0)) + "%"));
      row.append(meta, scoreValue);
      list.append(row);
    });

    section.append(title, list);
    adminSoloStatsList.append(section);
  });
}

function formatReportDate(value) {
  const seconds = Number(value || 0);
  if (!seconds) return "";
  return new Date(seconds * 1000).toLocaleString("pl-PL");
}

function renderAdminReports() {
  if (!adminReportList || !adminReportsCount || !profile || profile.role !== "moderator") return;
  const reports = Array.isArray(state.soloReports) ? state.soloReports : [];
  adminReportList.replaceChildren();
  adminReportsCount.textContent = reports.length + " zgloszen";

  if (!reports.length) {
    adminReportList.append(node("p", "muted empty-row", "Brak zgloszen od graczy."));
    return;
  }

  reports.forEach(function (report) {
    const row = node("div", "admin-report-row tournament-card");
    const meta = node("div", "track-meta admin-report-meta");
    const date = formatReportDate(report.at);
    const trackName = [report.anime, report.opening].filter(Boolean).join(" / ") || "Anime bez nazwy";
    const detailParts = [
      report.nickname || "Solo",
      DIFFICULTY_LABELS[report.difficulty] || report.difficultyLabel || "Medium",
      date
    ].filter(Boolean);
    meta.append(
      node("b", "", trackName),
      node("span", "", detailParts.join(" / ")),
      node("p", "admin-report-message", report.message || "Brak opisu.")
    );
    if (report.sourceTitle) meta.append(node("span", "", report.sourceTitle));
    const source = node("div", "admin-report-source");
    source.append(node("span", "", report.videoId ? "YouTube" : "Audio"));
    if (report.audioUrl) {
      const link = node("a", "", "Link");
      link.href = report.audioUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
      source.append(link);
    }
    const actions = node("div", "admin-report-actions");
    const edit = node("button", "", "Edytuj opening");
    const remove = node("button", "danger-button", "Usun");
    edit.type = "button";
    remove.type = "button";
    edit.addEventListener("click", function () {
      editReportedTrack(report);
    });
    remove.addEventListener("click", function () {
      if (!window.confirm("Usunac to zgloszenie?")) return;
      mod("removeSoloReport", { reportId: report.id });
      showToast("Usunieto zgloszenie.");
    });
    actions.append(edit, remove);
    source.append(actions);
    row.append(meta, source);
    adminReportList.append(row);
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

function editTrack(track, source) {
  editingTrackId = track.id;
  editingTrackSource = source === "library" ? "library" : "tracks";
  trackAnimeInput.value = track.anime || "";
  trackOpeningInput.value = track.opening || "";
  trackDifficultyInput.value = track.difficulty || "medium";
  trackUrlInput.value = track.audioUrl || "";
  if (localAudioSelect) localAudioSelect.value = track.audioUrl || "";
  if (fallbackAudioSelect) fallbackAudioSelect.value = track.fallbackAudioUrl || "";
  trackStartFirstInput.value = String(finiteNumber(track.startAtFirst, 0));
  trackStartSecondInput.value = String(finiteNumber(track.startAtSecond, 5));
  trackCoverInput.value = track.coverUrl || "";
  trackDescriptionInput.value = track.description || "";
  if (trackAliasesInput) trackAliasesInput.value = Array.isArray(track.aliases) ? track.aliases.join("\n") : (track.aliases || "");
  trackSubmitButton.textContent = editingTrackSource === "library" ? "Zapisz biblioteke" : "Zapisz";
  cancelEditButton.classList.remove("hidden");
  if (editingTrackSource === "library") {
    activeAdminPanel = "tracks";
    renderAdminPanelTabs();
  }
  if (trackForm && trackForm.scrollIntoView) trackForm.scrollIntoView({ behavior: "smooth", block: "start" });
  trackAnimeInput.focus();
}

function editReportedTrack(report) {
  editingTrackId = report.trackKey || report.trackId || "";
  if (!editingTrackId) {
    showToast("Nie znaleziono openingu do edycji.");
    return;
  }
  editingTrackSource = "report";
  trackAnimeInput.value = report.anime || "";
  trackOpeningInput.value = report.opening || "";
  trackDifficultyInput.value = report.difficulty || "medium";
  trackUrlInput.value = report.audioUrl || "";
  if (localAudioSelect) localAudioSelect.value = report.audioUrl || "";
  if (fallbackAudioSelect) fallbackAudioSelect.value = report.fallbackAudioUrl || "";
  trackStartFirstInput.value = String(finiteNumber(report.startAtFirst, 0));
  trackStartSecondInput.value = String(finiteNumber(report.startAtSecond, 5));
  trackCoverInput.value = report.coverUrl || "";
  trackDescriptionInput.value = report.description || "";
  if (trackAliasesInput) trackAliasesInput.value = Array.isArray(report.aliases) ? report.aliases.join("\n") : (report.aliases || "");
  trackSubmitButton.textContent = "Zapisz zgloszony";
  cancelEditButton.classList.remove("hidden");
  activeAdminPanel = "tracks";
  renderAdminPanelTabs();
  if (trackForm && trackForm.scrollIntoView) trackForm.scrollIntoView({ behavior: "smooth", block: "start" });
  trackAnimeInput.focus();
}

function resetTrackForm() {
  editingTrackId = null;
  editingTrackSource = "tracks";
  if (!trackAnimeInput) return;
  trackAnimeInput.value = "";
  trackOpeningInput.value = "";
  trackDifficultyInput.value = "medium";
  trackUrlInput.value = "";
  if (localAudioSelect) localAudioSelect.value = "";
  if (fallbackAudioSelect) fallbackAudioSelect.value = "";
  if (audioUploadInput) audioUploadInput.value = "";
  if (audioUploadStatus) audioUploadStatus.textContent = "";
  trackStartFirstInput.value = "0";
  trackStartSecondInput.value = "5";
  trackCoverInput.value = "";
  trackDescriptionInput.value = "";
  if (trackAliasesInput) trackAliasesInput.value = "";
  trackSubmitButton.textContent = "Dodaj";
  cancelEditButton.classList.add("hidden");
}

function renderBlockedIps() {
  if (!blockedIpList || !profile || profile.role !== "moderator") return;
  const blockedIps = state.blockedIps || [];
  blockedIpList.replaceChildren();

  if (!blockedIps.length) {
    blockedIpList.append(node("p", "muted empty-row", "Brak zablokowanych osob."));
    return;
  }

  blockedIps.forEach(function (block) {
    const row = node("div", "blocked-ip-row");
    const meta = node("div", "blocked-ip-meta");
    const addedAt = block.at ? new Date(block.at * 1000).toLocaleString("pl-PL") : "";
    meta.append(
      node("b", "", block.nickname || "Zablokowany gracz"),
      node("span", "", block.team || "Druzyna")
    );
    if (addedAt) meta.append(node("span", "", "Dodano: " + addedAt));

    const actions = node("div", "blocked-ip-actions");
    const unblock = node("button", "", "Odblokuj");
    unblock.type = "button";
    unblock.addEventListener("click", () => mod("unblockIp", { blockId: block.id }));
    actions.append(unblock);
    row.append(meta, actions);
    blockedIpList.append(row);
  });
}

function renderAdminPanelTabs() {
  if (!adminPanelButtons.length || !adminPanelSections.length) return;
  const available = adminPanelButtons.some((button) => button.dataset.adminPanelTarget === activeAdminPanel);
  if (!available) activeAdminPanel = "center";

  adminPanelButtons.forEach(function (button) {
    const active = button.dataset.adminPanelTarget === activeAdminPanel;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  adminPanelSections.forEach(function (section) {
    section.classList.toggle("hidden", section.dataset.adminPanel !== activeAdminPanel);
  });
}

function renderModerator() {
  if (!profile || profile.role !== "moderator") return;
  renderAdminPanelTabs();
  renderBuzzDecision();
  renderAdminCenter();
  renderAdminRooms();
  renderAdminSoloStats();
  renderAdminSoloPlayers();
  renderAdminQuality();
  renderAdminReports();

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
  if (!buzzer && (state.roundClosed || state.revealed)) {
    decisionText.textContent = "Opening jest zamkniety po zgadnieciu. Gracze sa zablokowani, mozesz odpauzowac i puscic go do konca.";
  } else if (!buzzer) {
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
  const isSoloPractice = profile && profile.role === "solo";
  if (soloControls) soloControls.classList.toggle("hidden", !isSoloPractice);
  buzzButton.classList.toggle("hidden", Boolean(isSoloPractice));

  if (isSoloPractice) {
    const answered = Boolean(state.solo && state.solo.answered);
    const mediaError = Boolean(state.solo && state.solo.mediaError);
    const canAnswer = Boolean(state.currentTrack && !answered && !mediaError && (state.phase === "playing" || state.phase === "ended"));
    if (soloGuessedButton) soloGuessedButton.classList.add("hidden");
    if (soloAnswerInput && lastSoloAnswerTrackId !== state.currentTrackId) {
      lastSoloAnswerTrackId = state.currentTrackId || "";
      soloAnswerInput.value = "";
    }
    if (soloReportInput && lastSoloReportTrackId !== state.currentTrackId) {
      lastSoloReportTrackId = state.currentTrackId || "";
      soloReportInput.value = "";
      if (soloReportPanel) soloReportPanel.open = false;
    }
    if (soloAnswerInput) {
      soloAnswerInput.disabled = !canAnswer;
      if (answered && state.solo && state.solo.answerText) soloAnswerInput.value = state.solo.answerText;
    }
    if (soloAnswerSubmitButton) soloAnswerSubmitButton.disabled = !canAnswer;
    if (soloReportInput) soloReportInput.disabled = !state.currentTrack;
    if (soloReportSubmitButton) soloReportSubmitButton.disabled = !state.currentTrack;
    soloGuessedButton.disabled = !canAnswer;
    soloMissedButton.disabled = !canAnswer;
    soloNextButton.disabled = !state.currentTrack || state.phase === "loading" || state.phase === "countdown" || (!answered && !mediaError && (state.phase === "playing" || state.phase === "ended"));

    if (!state.currentTrack) {
      buzzCaption.textContent = "Brak openingow do losowania.";
    } else if (answered) {
      buzzCaption.textContent = state.solo.guessed ? "Zgadniete! Streak rosnie." : "Nie zgadniete. Streak wyzerowany.";
    } else if (mediaError) {
      buzzCaption.textContent = (state.solo.mediaErrorReason || "Opening nie zaladowal sie w 5 sekund.") + " Kliknij Nastepny.";
    } else if (state.phase === "loading") {
      buzzCaption.textContent = "Laduje opening przed startem czasu.";
    } else if (state.phase === "countdown") {
      const left = soloPrerollLeft();
      buzzCaption.textContent = left <= 0 && !(state.solo && state.solo.mediaReady)
        ? "Koncze ladowanie openingu. Czas gry jeszcze nie plynie."
        : "Opening wystartuje po odliczaniu.";
    } else if (state.phase === "playing") {
      buzzCaption.textContent = "Sluchaj i zaznacz odpowiedz.";
    } else if (state.phase === "ended") {
      buzzCaption.textContent = "Czas minal, ale nadal mozesz wpisac odpowiedz.";
    } else {
      buzzCaption.textContent = "Kliknij Wlacz dzwiek, zeby zaczac probe.";
    }
    return;
  }

  if (soloControls) soloControls.classList.add("hidden");
  buzzButton.classList.remove("hidden");
  const isPlayer = profile && profile.role === "player";
  const lockedGroups = state.lockedGroups || [];
  const blocked = isPlayer && lockedGroups.includes(profile.team);
  const roundClosed = Boolean(state.roundClosed || state.revealed);
  const canBuzz = isPlayer && state.phase === "playing" && !state.currentBuzzer && !blocked && !roundClosed;
  buzzButton.disabled = !canBuzz;

  if (!isPlayer) {
    buzzCaption.textContent = "Panel administratora steruje runda.";
  } else if (blocked) {
    buzzCaption.textContent = "Twoja grupa juz probowala w tej rundzie.";
  } else if (roundClosed) {
    buzzCaption.textContent = "Opening zgadniety. Administrator moze puscic go do konca.";
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
  const duration = state.settings.clipDuration || 15;
  renderTrackHeader();
  renderSoloPreroll();
  progressFill.style.width = Math.min(100, (currentElapsed / duration) * 100) + "%";
  timeLabel.textContent = currentElapsed.toFixed(1) + " s";
  if (profile && profile.role === "solo") renderBuzzer();
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

function isPlaybackAtLocalEnd(clipElapsed) {
  if (!state || state.phase !== "playing") return false;
  const duration = Number((state.settings && state.settings.clipDuration) || 15);
  return Number.isFinite(duration) && duration > 0 && clipElapsed >= duration - CLIP_END_PAUSE_EARLY_SECONDS;
}

function mediaActionKey(track) {
  if (!track) return "";
  return (state && state.currentTrackId) || track.soloKey || track.id || "";
}

function mediaLoadIdentity(track) {
  if (!track) return "";
  return [
    (state && state.mediaToken) || mediaActionKey(track),
    track.source || "audio",
    track.videoId || "",
    track.audioUrl || ""
  ].join("|");
}

function isSoloLoadingTrack(track) {
  return Boolean(profile && profile.role === "solo" && state && (state.phase === "loading" || state.phase === "countdown") && state.currentTrack && track && state.currentTrack.id === track.id);
}

function clearMediaLoadTimer() {
  if (mediaLoadTimer) clearTimeout(mediaLoadTimer);
  mediaLoadTimer = null;
}

function startMediaLoadWatch(track) {
  if (!isSoloLoadingTrack(track)) return;
  const key = mediaLoadIdentity(track);
  if (mediaLoadKey !== key) {
    mediaLoadKey = key;
    mediaReadySentKey = "";
    mediaErrorSentKey = "";
    clearMediaLoadTimer();
  }
  if (mediaReadySentKey === key || mediaErrorSentKey === key) return;
  if (mediaLoadTimer) return;
  mediaLoadTimer = setTimeout(function () {
    reportMediaError(track, "Opening nie zaladowal sie w 5 sekund.");
  }, MEDIA_LOAD_TIMEOUT_MS);
}

function reportMediaReady(track) {
  if (!isSoloLoadingTrack(track)) return;
  const key = mediaLoadIdentity(track);
  if (mediaReadySentKey === key || mediaErrorSentKey === key) return;
  mediaReadySentKey = key;
  clearMediaLoadTimer();
  send({ type: "soloAction", action: "mediaReady", key: mediaActionKey(track) });
}

function reportMediaError(track, reason) {
  if (!profile || profile.role !== "solo" || !state || !state.currentTrack || !track || state.currentTrack.id !== track.id) return;
  if (state.solo && state.solo.answered) return;
  if (state.phase !== "loading" && state.phase !== "countdown" && state.phase !== "playing") return;
  const key = mediaLoadIdentity(track);
  if (mediaErrorSentKey === key) return;
  mediaErrorSentKey = key;
  clearMediaLoadTimer();
  audio.pause();
  pauseYouTube();
  send({ type: "soloAction", action: "mediaError", key: mediaActionKey(track), reason: reason || "Nie zaladowano openingu." });
}

function syncAudio(force) {
  if (!state || !state.currentTrack) {
    audio.pause();
    pauseYouTube();
    clearMediaLoadTimer();
    return;
  }

  let track = state.currentTrack;
  if (!isSoloLoadingTrack(track)) {
    clearMediaLoadTimer();
  }
  const clipElapsed = estimatedElapsed();
  if (isPlaybackAtLocalEnd(clipElapsed)) {
    audio.pause();
    pauseYouTube();
    return;
  }
  if (track.source === "youtube" && track.fallbackAudioUrl && lastYouTubeError && lastYouTubeError.indexOf((track.videoId || "") + ":") === 0) {
    track = Object.assign({}, track, {
      id: String(track.id || "track") + "_fallback",
      source: "audio",
      audioUrl: track.fallbackAudioUrl
    });
    pauseYouTube();
  }
  if (track.source === "youtube") {
    syncYouTube(track, force, clipElapsed);
    return;
  }

  pauseYouTube();
  audio.volume = pageVolume;
  const desiredUrl = new URL(track.audioUrl, location.href).href;
  if (audio.src !== desiredUrl) {
    audio.src = desiredUrl;
    audio.load();
    lastMediaKey = "";
    lastMediaSegment = "";
  }

  const timing = desiredSourceTime(track, clipElapsed);
  const desiredTime = timing.seconds;
  const mediaKey = track.id + "|" + track.audioUrl;
  const drift = Math.abs((audio.currentTime || 0) - desiredTime);
  const soloLoading = isSoloLoadingTrack(track);

  if (soloLoading) startMediaLoadWatch(track);

  if (Number.isFinite(audio.duration) && audio.duration > 0 && desiredTime > audio.duration) {
    if (soloLoading) {
      reportMediaError(track, "Plik audio jest krotszy niz ustawiony start " + formatSeconds(desiredTime) + ".");
      return;
    }
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
      if (soloLoading) startMediaLoadWatch(track);
      return;
    }
  }

  if (soloLoading) {
    audio.pause();
    if (audio.readyState >= 3 && !audio.seeking) reportMediaReady(track);
    return;
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
    if (isSoloLoadingTrack(track)) reportMediaError(track, "Link YouTube nie ma poprawnego ID filmu.");
    else showToast("Ten link YouTube nie ma poprawnego ID filmu.");
    return false;
  }
  if (!requestYouTubeApi()) {
    if (isSoloLoadingTrack(track)) startMediaLoadWatch(track);
    return false;
  }

  if (!youtubePlayer) {
    if (isSoloLoadingTrack(track)) startMediaLoadWatch(track);
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
            youtubePlayer.setVolume(pageVolumePercent());
            if (isSoloLoadingTrack(track) && youtubePlayer.cueVideoById) {
              youtubePlayer.cueVideoById({ videoId: track.videoId, startSeconds: desiredTime });
            } else {
              youtubePlayer.seekTo(desiredTime, true);
              youtubePlayer.pauseVideo();
            }
          } catch (error) {}
          syncAudio(true);
        },
        onStateChange: function (event) {
          const activeTrack = state && state.currentTrack;
          const playerState = window.YT && window.YT.PlayerState;
          if (!activeTrack || activeTrack.source !== "youtube" || activeTrack.videoId !== youtubeVideoId || !playerState) return;
          if (!isSoloLoadingTrack(activeTrack)) return;
          if (event.data === playerState.CUED || event.data === playerState.PAUSED) {
            reportMediaReady(activeTrack);
          }
        },
        onError: function (event) {
          const code = event && event.data ? String(event.data) : "";
          const key = youtubeVideoId + ":" + code;
          if (lastYouTubeError !== key) {
            lastYouTubeError = key;
            showToast("YouTube blokuje ten film w aplikacji" + (code ? " (kod " + code + ")." : ".") + " Podmien link openingu.");
          }
          const activeTrack = state && state.currentTrack && state.currentTrack.source === "youtube" ? state.currentTrack : track;
          reportMediaError(activeTrack, "YouTube nie zaladowal filmu" + (code ? " (kod " + code + ")" : "") + ".");
          pauseYouTube();
        }
      }
    });
    return false;
  }

  if (!youtubePlayerReady) {
    if (isSoloLoadingTrack(track)) startMediaLoadWatch(track);
    return false;
  }

  if (youtubeVideoId !== track.videoId) {
    youtubeVideoId = track.videoId;
    lastYouTubeError = "";
    if (isSoloLoadingTrack(track) && youtubePlayer.cueVideoById) {
      youtubePlayer.cueVideoById({ videoId: track.videoId, startSeconds: desiredTime });
    } else {
      youtubePlayer.loadVideoById({ videoId: track.videoId, startSeconds: desiredTime });
    }
    if (!(state.phase === "playing" && soundEnabled)) youtubePlayer.pauseVideo();
  }

  return true;
}

function youtubeReadyForTrack(track) {
  if (!youtubePlayerReady || !youtubePlayer || !track || !track.videoId) return false;
  try {
    const data = youtubePlayer.getVideoData ? youtubePlayer.getVideoData() : null;
    const loadedVideoId = data && data.video_id ? String(data.video_id) : "";
    if (loadedVideoId && loadedVideoId !== track.videoId) return false;
    const playerState = window.YT && window.YT.PlayerState;
    const stateCode = youtubePlayer.getPlayerState ? youtubePlayer.getPlayerState() : null;
    if (playerState && (stateCode === playerState.CUED || stateCode === playerState.PAUSED)) return true;
    const duration = youtubePlayer.getDuration ? Number(youtubePlayer.getDuration()) : 0;
    return Number.isFinite(duration) && duration > 0 && (!playerState || stateCode !== playerState.UNSTARTED);
  } catch (error) {
    return false;
  }
}

function syncYouTube(track, force, clipElapsed) {
  audio.pause();
  const timing = desiredSourceTime(track, Number.isFinite(clipElapsed) ? clipElapsed : estimatedElapsed());
  const desiredTime = timing.seconds;
  const mediaKey = track.id + "|" + track.videoId;
  if (!ensureYouTubePlayer(track, desiredTime)) return;

  try {
    if (isSoloLoadingTrack(track)) {
      startMediaLoadWatch(track);
      if (force || lastYouTubeKey !== mediaKey || lastYouTubeSegment !== timing.segment) {
        if (youtubePlayer.cueVideoById) youtubePlayer.cueVideoById({ videoId: track.videoId, startSeconds: desiredTime });
        else youtubePlayer.seekTo(desiredTime, true);
        lastYouTubeKey = mediaKey;
        lastYouTubeSegment = timing.segment;
      }
      youtubePlayer.pauseVideo();
      if (youtubeReadyForTrack(track)) reportMediaReady(track);
      return;
    }

    const currentTime = youtubePlayer.getCurrentTime ? youtubePlayer.getCurrentTime() : 0;
    const drift = Math.abs((currentTime || 0) - desiredTime);
    if (force || drift > 0.75 || lastYouTubeKey !== mediaKey || lastYouTubeSegment !== timing.segment) {
      youtubePlayer.seekTo(desiredTime, true);
      lastYouTubeKey = mediaKey;
      lastYouTubeSegment = timing.segment;
    }

    if (state.phase === "playing" && soundEnabled) {
      youtubePlayer.unMute();
      youtubePlayer.setVolume(pageVolumePercent());
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
    loading: "ladowanie",
    countdown: "3",
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

setLoginMode("solo");
restoreSession();
setInterval(tick, 100);
