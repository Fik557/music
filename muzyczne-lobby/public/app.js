const $ = (selector) => document.querySelector(selector);

const SESSION_KEY = "animeOpeningQuizSession";
const SOLO_USER_KEY = "animeOpeningQuizSoloUser";
const PAGE_VOLUME_KEY = "animeOpeningQuizVolume";
const MAX_AVATAR_DATA_LENGTH = 60000;
const MAX_AUDIO_UPLOAD_BYTES = 25 * 1024 * 1024;
const AVATAR_OUTPUT_SIZE = 96;
const AVATAR_OUTPUT_QUALITY = 0.72;
const MEDIA_LOAD_TIMEOUT_MS = 5000;
const CLIP_END_PAUSE_EARLY_SECONDS = 0.08;
const AUDIO_DRIFT_CORRECTION_SECONDS = 1.75;
const DIFFICULTY_LABELS = {
  very_easy: "Very easy",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  impossible: "Impossible"
};
const ADMIN_PAGE_META = {
  center: { title: "Centrum", description: "Sterowanie gra i najwazniejsze informacje." },
  rooms: { title: "Gry", description: "Aktywne pokoje, gracze i zarzadzanie lobby." },
  tracks: { title: "Openingi", description: "Glowna lista utworow wykorzystywanych w grze." },
  playlist: { title: "Import playlisty", description: "Dodawanie wielu openingow z playlisty YouTube." },
  search: { title: "Wyszukiwarka YouTube", description: "Wyszukiwanie i dodawanie pojedynczych openingow." },
  library: { title: "Biblioteka", description: "Pelna baza openingow, filtrowanie i edycja danych." },
  blocked: { title: "Zablokowane osoby", description: "Lista blokad graczy i zarzadzanie dostepem." },
  scoring: { title: "Punktacja", description: "Punkty przyznawane dla kazdego poziomu trudnosci." },
  stats: { title: "% zgadniec", description: "Skutecznosc odpowiedzi i porownanie trudnosci openingow." },
  soloPlayers: { title: "Ranking solo", description: "Wyniki osob grajacych w trybie solo." },
  quality: { title: "Jakosc openingow", description: "Problemy z odtwarzaniem i stan plikow audio." },
  backup: { title: "Backup", description: "Eksport i przywracanie zapisanych danych." },
  reports: { title: "Zgloszenia", description: "Bledy przeslane przez graczy podczas gry solo." },
  history: { title: "Historia zmian", description: "Zapisane i nieudane edycje wykonane przez administratorow." }
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
const nicknameLabel = $("#nicknameLabel");
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
const roomContextLabel = $("#roomContextLabel");
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
const retryTrackSaveButton = $("#retryTrackSaveButton");
const trackEditPreview = $("#trackEditPreview");
const trackPreviewStatus = $("#trackPreviewStatus");
const trackPreviewFirstButton = $("#trackPreviewFirstButton");
const trackPreviewSecondButton = $("#trackPreviewSecondButton");
const trackPreviewStopButton = $("#trackPreviewStopButton");
const trackPreviewMedia = $("#trackPreviewMedia");
const trackSaveStatus = $("#trackSaveStatus");
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
const audioSecondary = $("#songAudioSecondary");
const adminPanelTabs = $("#adminPanelTabs");
const adminPanelButtons = Array.from(document.querySelectorAll("[data-admin-panel-target]"));
const adminPanelSections = Array.from(document.querySelectorAll("[data-admin-panel]"));
const adminNavDropdowns = Array.from(document.querySelectorAll(".admin-nav-dropdown"));
const adminNavCurrent = $("#adminNavCurrent");
const adminPageHeading = $("#adminPageHeading");
const adminPageTitle = $("#adminPageTitle");
const adminPageDescription = $("#adminPageDescription");
const adminPageLoader = $("#adminPageLoader");
const adminLoaderLabel = $("#adminLoaderLabel");
const adminSoloStatsList = $("#adminSoloStatsList");
const adminSoloStatsCount = $("#adminSoloStatsCount");
const adminRoomList = $("#adminRoomList");
const adminRoomsCount = $("#adminRoomsCount");
const adminReportList = $("#adminReportList");
const adminReportsCount = $("#adminReportsCount");
const adminReportSearchInput = $("#adminReportSearchInput");
const adminReportSortInput = $("#adminReportSortInput");
const adminAuditList = $("#adminAuditList");
const adminAuditCount = $("#adminAuditCount");
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
let pendingTrackSave = null;
let pendingTrackSaveTimer = null;
let lastFailedTrackSave = null;
let pendingAdminRepeat = null;
let pendingAdminRepeatTimer = null;
let lastAdminAuditRenderKey = "";
let lastRenderedTracks = null;
let lastRenderedCurrentTrackId = "";
let adminPageLoading = false;
let adminPageTransitionTimer = null;
let trackPreviewAudio = null;
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
let activeAdminPanel = adminPanelFromHash() || "center";
let lastSoloAnswerTrackId = "";
let lastSoloReportTrackId = "";
let adminStatsSort = "desc";
let adminReportSearch = "";
let adminReportSort = "newest";
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
  audioSecondary.volume = pageVolume;
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

function loadSoloUser() {
  try {
    const saved = JSON.parse(localStorage.getItem(SOLO_USER_KEY) || "null");
    if (!saved || typeof saved !== "object") return null;
    return {
      clientId: String(saved.clientId || "").slice(0, 80),
      nickname: String(saved.nickname || "").slice(0, 40)
    };
  } catch (error) {
    return null;
  }
}

function saveSoloUser(clientId, nickname) {
  try {
    localStorage.setItem(SOLO_USER_KEY, JSON.stringify({
      clientId: String(clientId || "").slice(0, 80),
      nickname: String(nickname || "").slice(0, 40)
    }));
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
…30422 tokens truncated… rejectBuzzButton.textContent = expired ? "Nie dodawaj punktow" : "Bledne - zablokuj grupe";
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
  pauseLocalAudio();
  pauseYouTube();
  send({ type: "soloAction", action: "mediaError", key: mediaActionKey(track), reason: reason || "Nie zaladowano openingu." });
}

function pauseLocalAudio() {
  audio.pause();
  audioSecondary.pause();
}

function resetPreparedAudio(media) {
  media._preparedKey = "";
  media._preparedTime = -1;
}

function ensureLocalAudioSource(media, desiredUrl) {
  if (media.src === desiredUrl) return false;
  media.src = desiredUrl;
  media.load();
  resetPreparedAudio(media);
  return true;
}

function prepareLocalAudioAt(media, desiredUrl, desiredTime, preparedKey) {
  ensureLocalAudioSource(media, desiredUrl);
  media.volume = pageVolume;

  if (media.readyState >= 1 && !media.seeking) {
    const drift = Math.abs((media.currentTime || 0) - desiredTime);
    if (media._preparedKey !== preparedKey || drift > 0.2) {
      try {
        media.currentTime = desiredTime;
        media._preparedKey = preparedKey;
        media._preparedTime = desiredTime;
      } catch (error) {
        return false;
      }
    }
  }

  if (media.readyState < 3 || media.seeking) return false;
  return Math.abs((media.currentTime || 0) - desiredTime) <= 0.45;
}

function localAudioTooShort(media, desiredTime) {
  return Number.isFinite(media.duration) && media.duration > 0 && desiredTime >= media.duration;
}

function syncAudio(force) {
  if (!state || !state.currentTrack) {
    pauseLocalAudio();
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
    pauseLocalAudio();
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
    pauseLocalAudio();
    syncYouTube(track, force, clipElapsed);
    return;
  }

  pauseYouTube();
  audio.volume = pageVolume;
  audioSecondary.volume = pageVolume;
  const desiredUrl = new URL(track.audioUrl, location.href).href;
  const primarySourceChanged = ensureLocalAudioSource(audio, desiredUrl);
  const secondarySourceChanged = ensureLocalAudioSource(audioSecondary, desiredUrl);
  const sourceChanged = primarySourceChanged || secondarySourceChanged;
  if (sourceChanged) {
    lastMediaKey = "";
    lastMediaSegment = "";
  }

  const split = Number((state.settings && state.settings.segmentSplit) || 5);
  const firstTiming = desiredSourceTime(track, 0);
  const secondTiming = desiredSourceTime(track, split);
  const timing = desiredSourceTime(track, clipElapsed);
  const desiredTime = timing.seconds;
  const mediaKey = track.id + "|" + track.audioUrl;
  const soloLoading = isSoloLoadingTrack(track);

  if (soloLoading) startMediaLoadWatch(track);

  const firstPreparedKey = mediaKey + "|first";
  const secondPreparedKey = mediaKey + "|second";
  const needsSegmentPreparation = soloLoading
    || state.phase === "idle"
    || audio._preparedKey !== firstPreparedKey
    || audioSecondary._preparedKey !== secondPreparedKey;
  let firstReady = audio.readyState >= 3 && !audio.seeking;
  let secondReady = audioSecondary.readyState >= 3 && !audioSecondary.seeking;
  if (needsSegmentPreparation) {
    firstReady = prepareLocalAudioAt(audio, desiredUrl, firstTiming.seconds, firstPreparedKey);
    secondReady = prepareLocalAudioAt(audioSecondary, desiredUrl, secondTiming.seconds, secondPreparedKey);
  }
  const invalidStart = localAudioTooShort(audio, firstTiming.seconds) || localAudioTooShort(audioSecondary, secondTiming.seconds);

  if (invalidStart) {
    const invalidTime = localAudioTooShort(audioSecondary, secondTiming.seconds) ? secondTiming.seconds : firstTiming.seconds;
    if (soloLoading) {
      reportMediaError(track, "Plik audio jest krotszy niz ustawiony start " + formatSeconds(invalidTime) + ".");
      return;
    }
    if (Date.now() - lastAudioErrorAt > 2500) {
      lastAudioErrorAt = Date.now();
      showToast("Ten plik audio jest krotszy niz ustawiony start " + formatSeconds(invalidTime) + ".");
    }
  }

  if (soloLoading) {
    pauseLocalAudio();
    if (firstReady && secondReady) reportMediaReady(track);
    return;
  }

  const activeAudio = timing.segment === "second" ? audioSecondary : audio;
  const inactiveAudio = timing.segment === "second" ? audio : audioSecondary;
  const segmentChanged = lastMediaKey !== mediaKey || lastMediaSegment !== timing.segment;
  const drift = Math.abs((activeAudio.currentTime || 0) - desiredTime);
  inactiveAudio.pause();

  if (!activeAudio.seeking && drift > (segmentChanged ? 0.25 : AUDIO_DRIFT_CORRECTION_SECONDS)) {
    try {
      activeAudio.currentTime = desiredTime;
    } catch (error) {}
  }
  lastMediaKey = mediaKey;
  lastMediaSegment = timing.segment;

  if (state.phase === "playing" && soundEnabled) {
    if (activeAudio.paused) {
      activeAudio.play().catch(function () {
        if (Date.now() - lastAudioErrorAt > 2500) {
          lastAudioErrorAt = Date.now();
          showToast("Kliknij Wlacz dzwiek przed startem rundy.");
        }
      });
    }
  } else {
    pauseLocalAudio();
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
  pauseLocalAudio();
  const timing = desiredSourceTime(track, Number.isFinite(clipElapsed) ? clipElapsed : estimatedElapsed());
  const desiredTime = timing.seconds;
  const mediaKey = track.id + "|" + track.videoId;
  if (!ensureYouTubePlayer(track, desiredTime)) return;

  try {
    if (isSoloLoadingTrack(track)) {
      startMediaLoadWatch(track);
      if (lastYouTubeKey !== mediaKey || lastYouTubeSegment !== timing.segment) {
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
    const segmentChanged = lastYouTubeKey !== mediaKey || lastYouTubeSegment !== timing.segment;
    if ((segmentChanged && drift > 0.35) || (!segmentChanged && drift > 2)) {
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