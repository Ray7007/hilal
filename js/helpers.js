/* Helpers */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}
function domReady() {
  if (document.readyState !== "loading") return Promise.resolve();
  return new Promise((resolve) =>
    document.addEventListener("DOMContentLoaded", resolve, { once: true }),
  );
}
function nextPaint() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
}
function setSplashProgress(value) {
  splashProgress = Math.max(splashProgress, Math.min(1, value));
  const bar = document.querySelector(".splash-loader span");
  if (bar) bar.style.setProperty("--splash-progress", splashProgress);
}
function timeLeft(started, reserve = 0) {
  return SPLASH_MAX_DURATION - (performance.now() - started) - reserve;
}
function withTimeout(promise, ms) {
  return Promise.race([promise, wait(ms)]);
}
function loadImageUrl(src) {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (img.decode) img.decode().catch(() => {}).finally(resolve);
      else resolve();
    };
    img.decoding = "async";
    img.onload = finish;
    img.onerror = finish;
    img.src = src;
    if (img.complete) finish();
  });
}
function hydrateLazyImages() {
  document.querySelectorAll("img:not(.splash-poster):not(.logo-img)").forEach((img) => {
    img.loading = "lazy";
    img.decoding = "async";
  });
}
async function waitForImages(started) {
  const urls = new Set([
    ...Array.from(document.images)
      .filter((img) => img.loading !== "lazy")
      .map((img) => img.currentSrc || img.src)
      .filter(Boolean),
  ]);
  if (!urls.size) {
    setSplashProgress(0.72);
    return;
  }
  let loaded = 0;
  const update = () => {
    loaded += 1;
    setSplashProgress(0.4 + (loaded / urls.size) * 0.32);
  };
  const tasks = Array.from(urls, (src) => loadImageUrl(src).finally(update));
  await withTimeout(Promise.all(tasks), Math.max(0, timeLeft(started, 260)));
  setSplashProgress(0.72);
}
function msg(el, t, type = "ok") {
  el.textContent = t;
  el.style.color =
    type === "ok" ? "#148347" : type === "warn" ? "#c27a00" : "#c2413b";
}
function toast(t) {
  const el = $("toast");
  if (!el) return;
  el.textContent = t;
  el.classList.remove("hidden");
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.classList.add("hidden"), 240);
  }, 2600);
}
function todayKey() {
  return new Date().toLocaleDateString("sv-SE");
}
function resetAttendanceIfNewDay() {
  const today = todayKey();
  if (!state.attendanceDate) {
    state.attendanceDate = today;
    save();
    return;
  }
  if (state.attendanceDate !== today) {
    state.players.forEach((p) => (p.present = false));
    state.attendanceDate = today;
    save();
    toast("تم تصفير حضور اليوم تلقائيًا");
  }
}
function esc(v) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function rate(list = state.players) {
  return list.length
    ? Math.round((list.filter((p) => p.present).length / list.length) * 100)
    : 0;
}
function ageFromBirth(v) {
  if (!v) return 0;
  const b = new Date(v),
    t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a > 0 ? a : 0;
}
function playerBirth(p) {
  if (p.birthDate) return p.birthDate;
  if (p.age) {
    return new Date().getFullYear() - p.age + "-01-01";
  }
  return "غير مسجل";
}
function playerIdNo(p) {
  return p.nationalId || p.identity || "غير مسجل";
}

function sportId() {
  return state?.selectedSport?.en || defaults.selectedSport.en;
}

function sportName() {
  return state?.selectedSport?.ar || defaults.selectedSport.ar;
}

function weeklyScheduleId() {
  return `${sportId()}_weekly`;
}

function playerKey(player) {
  return String(player?.firebaseId || player?.id || "");
}

function playerMatchesId(player, id) {
  const target = String(id);
  return String(player?.id) === target || String(player?.firebaseId || "") === target;
}

function normalizePlayer(player, index = 0, localPlayer) {
  return {
    id: player.id || player.firebaseId || localPlayer?.id || index + 1,
    firebaseId: player.firebaseId || player.id || "",
    name: player.name || localPlayer?.name || "",
    age:
      +player.age ||
      +(localPlayer?.age || 0) ||
      ageFromBirth(player.birthDate) ||
      0,
    group: player.group || localPlayer?.group || groups[0],
    present: Boolean(localPlayer?.present),
    points: +player.points || +localPlayer?.points || 0,
    phone: player.phone || localPlayer?.phone || "",
    nationalId: player.nationalId || localPlayer?.nationalId || "",
    birthDate: player.birthDate || localPlayer?.birthDate || "",
    weight: player.weight || localPlayer?.weight || "",
    note: player.note ?? localPlayer?.note ?? "",
    sport: player.sport || localPlayer?.sport || sportName(),
  };
}

function refreshCurrentViews() {
  dash();
  renderDayStrip();
  attendance();
  daily();
  playerDash();
  const active = document.querySelector(".page.active")?.id;
  if (active === "weekly") weeklyEditor("weeklyEditor", "weekly-input");
}

function showFirebaseWarning(text) {
  toast(text);
}

async function loadFirebaseState() {
  const api = window.firebaseRuntime;
  if (!api) return;

  const currentSportId = sportId();
  const selectedSport = sportName();
  const [sportResult, playersResult, attendanceResult, weeklyResult, dailyResult] =
    await Promise.allSettled([
      api.getSportSettings
        ? api.getSportSettings(currentSportId)
        : Promise.resolve(null),
      api.getPlayers({ sport: selectedSport, active: true }),
      api.getAttendance(todayKey()),
      api.getSchedule(weeklyScheduleId()),
      api.getDailyWorkouts({ sport: selectedSport, active: true }),
    ]);

  if (sportId() !== currentSportId) return;

  if (sportResult.status === "fulfilled" && sportResult.value?.sportCode) {
    state.sportCode = String(sportResult.value.sportCode).toUpperCase();
  }

  if (playersResult.status === "fulfilled") {
    const localPlayers = state.players || [];
    const localById = new Map(localPlayers.map((player) => [playerKey(player), player]));
    const localByNationalId = new Map(
      localPlayers
        .filter((player) => player.nationalId)
        .map((player) => [String(player.nationalId), player]),
    );

    state.players = playersResult.value.map((player, index) => {
      const localPlayer =
        localById.get(String(player.id)) ||
        localByNationalId.get(String(player.nationalId || ""));
      return normalizePlayer(player, index, localPlayer);
    });
  } else if (playersResult.status === "rejected") {
    showFirebaseWarning("تعذر تحميل اللاعبين من Firebase، تم استخدام البيانات المحلية");
  }

  if (attendanceResult.status === "fulfilled") {
    const attendanceByPlayer = new Map(
      attendanceResult.value.map((entry) => [String(entry.playerId), entry]),
    );

    state.players.forEach((player) => {
      player.present = false;
      const entry = attendanceByPlayer.get(playerKey(player));
      if (!entry) return;
      player.present = Boolean(entry.present);
      player.points = +entry.points || +player.points || 0;
      if (entry.note !== undefined) player.note = entry.note || "";
    });
    state.attendanceDate = todayKey();
  } else if (attendanceResult.status === "rejected") {
    showFirebaseWarning("تعذر تحميل الحضور من Firebase، تم استخدام البيانات المحلية");
  }

  if (weeklyResult.status === "fulfilled" && weeklyResult.value?.weeklyPlan) {
    state.weeklyPlan = weeklyResult.value.weeklyPlan;
  } else if (weeklyResult.status === "rejected") {
    showFirebaseWarning("تعذر تحميل الجدول الأسبوعي من Firebase");
  }

  if (dailyResult.status === "fulfilled") {
    state.dailyWorkouts = dailyResult.value.map((workout) => ({
      id: workout.id,
      firebaseId: workout.id,
      title: workout.title || "",
      details: workout.details || "",
      group: workout.group || groups[0],
      note: workout.note || "",
      sport: workout.sport || selectedSport,
    }));
  } else if (dailyResult.status === "rejected") {
    showFirebaseWarning("تعذر تحميل التمارين اليومية من Firebase");
  }

  save();
  refreshCurrentViews();
}

async function saveAttendanceToFirebase(player) {
  const api = window.firebaseRuntime;
  if (!api) return false;
  const id = playerKey(player);
  if (!id) return false;

  await api.updateAttendance({
    playerId: id,
    playerName: player.name,
    date: todayKey(),
    sport: sportName(),
    sportId: sportId(),
    present: Boolean(player.present),
    points: +player.points || 0,
    note: player.note || "",
  });

  return true;
}

async function saveWeeklyScheduleToFirebase() {
  const api = window.firebaseRuntime;
  if (!api) return false;

  await api.saveSchedule({
    id: weeklyScheduleId(),
    sportId: sportId(),
    sport: sportName(),
    type: "weekly",
    weeklyPlan: state.weeklyPlan,
  });

  return true;
}

async function saveDailyWorkoutToFirebase(workout) {
  const api = window.firebaseRuntime;
  if (!api) return null;

  return api.addDailyWorkout({
    ...workout,
    sportId: sportId(),
    sport: sportName(),
  });
}

async function deleteDailyWorkoutFromFirebase(workout) {
  const api = window.firebaseRuntime;
  const id = workout?.firebaseId || workout?.id;
  if (!api || !id) return false;

  await api.deleteDailyWorkout(id);
  return true;
}

async function saveSportSettingsToFirebase(code) {
  const api = window.firebaseRuntime;
  if (!api || !api.saveSportSettings) return false;

  await api.saveSportSettings({
    id: sportId(),
    sportId: sportId(),
    sport: sportName(),
    sportCode: code,
  });

  return true;
}

function debouncePlayerNoteSave(player) {
  clearTimeout(player.noteSaveTimer);
  player.noteSaveTimer = setTimeout(async () => {
    try {
      const api = window.firebaseRuntime;
      if (!api || !player.firebaseId) return;
      await api.updatePlayerNote(playerKey(player), player.note || "");
      await saveAttendanceToFirebase(player);
    } catch {
      showFirebaseWarning("تم حفظ الملاحظة محليًا فقط، تعذر حفظها في Firebase");
    }
  }, 600);
}
