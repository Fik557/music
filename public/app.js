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
  if (event && avatarCropStage.hasPointerCapture(event.pointerId)) avatarCropStage.release…22653 tokens truncated…", "blocked-ip-actions");
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
    soloNextButton.disabled = !state.currentTrack || state.phase === "loading" || (!answered && !mediaError && (state.phase === "playing" || state.phase === "ended"));

    if (!state.currentTrack) {
      buzzCaption.textContent = "Brak openingow do losowania.";
    } else if (answered) {
      buzzCaption.textContent = state.solo.guessed ? "Zgadniete! Streak rosnie." : "Nie zgadniete. Streak wyzerowany.";
    } else if (mediaError) {
      buzzCaption.textContent = (state.solo.mediaErrorReason || "Opening nie zaladowal sie w 5 sekund.") + " Kliknij Nastepny.";
    } else if (state.phase === "loading") {
      buzzCaption.textContent = "Laduje opening przed startem czasu.";
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
  return Boolean(profile && profile.role === "solo" && state && state.phase === "loading" && state.currentTrack && track && state.currentTrack.id === track.id);
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
  if (state.phase !== "loading" && state.phase !== "playing") return;
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
  if (!(profile && profile.role === "solo" && state.phase === "loading")) {
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

