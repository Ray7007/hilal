/* Drawer, reports, and admin dashboard */
var ADMIN_DEFAULT_WHATSAPP = "966500000000";
var adminEventsBound = false;
var adminState = {
  loaded: false,
  activeTab: "sports",
  profile: null,
  sports: [],
  coaches: [],
  players: [],
  attendance: [],
  settings: null,
};

function firebaseApi() {
  return window.firebaseRuntime || null;
}

function cleanPhoneNumber(value) {
  return String(value || ADMIN_DEFAULT_WHATSAPP).replace(/[^\d]/g, "") || ADMIN_DEFAULT_WHATSAPP;
}

function supportNumber() {
  return cleanPhoneNumber(
    adminState.settings?.supportWhatsapp || state?.supportWhatsapp || ADMIN_DEFAULT_WHATSAPP,
  );
}

function updateSupportLink() {
  const href = `https://wa.me/${supportNumber()}`;
  ["supportWhatsappLink", "homeWhatsapp"].forEach((id) => {
    const link = $(id);
    if (link) link.href = href;
  });
}

function isHomeActive() {
  return document.querySelector(".page.active")?.id === "home";
}

function setHomeDrawerOpen(isOpen) {
  const drawer = $("homeDrawer");
  if (!drawer) return false;
  drawer.classList.toggle("closed", !isOpen);
  drawer.setAttribute("aria-hidden", "false");
  const app = document.querySelector("main.app");
  if (app) app.classList.toggle("drawer-open", !!isOpen);
  return true;
}

function closeHomeDrawer() {
  setHomeDrawerOpen(false);
}

function toggleHomeDrawer() {
  const drawer = $("homeDrawer");
  if (!drawer || !isHomeActive()) return false;
  updateSupportLink();
  setHomeDrawerOpen(drawer.classList.contains("closed"));
  return true;
}

function openPolicyModal() {
  const card = $("policyModal")?.querySelector(".simple-card");
  if (card) {
    card.innerHTML =
      "<h3>السياسات</h3><p>جميع البيانات المدخلة في النظام تقع تحت مسؤولية المستخدم والمدرب الذي قام بإدخالها. النظام لا يشارك البيانات مع أي جهة خارجية. يجب استخدام النظام لأغراض تنظيمية وإدارية فقط. يمنع إدخال بيانات غير صحيحة أو استخدامها بشكل مخالف.</p>";
  }
  openSimpleModal("policyModal");
}

function openDrawer(variant) {
  updateSupportLink();
  const drawer = $("sideDrawer");
  const backdrop = $("drawerBackdrop");
  if (!drawer || !backdrop) return;
  // apply 'collapsed' variant to show a slim icon rail
  if (variant === "collapsed") drawer.classList.add("collapsed");
  else drawer.classList.remove("collapsed");
  drawer.classList.remove("hidden");
  backdrop.classList.remove("hidden");
  drawer.setAttribute("aria-hidden", "false");
  const app = document.querySelector("main.app");
  requestAnimationFrame(() => {
    drawer.classList.add("open");
    backdrop.classList.add("open");
    if (app) app.classList.add("drawer-open");
  });
}

function closeDrawer() {
  const drawer = $("sideDrawer");
  const backdrop = $("drawerBackdrop");
  if (!drawer || !backdrop) return;
  const app = document.querySelector("main.app");
  // animate main app back first
  if (app) app.classList.remove("drawer-open");
  drawer.classList.remove("open");
  backdrop.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    drawer.classList.add("hidden");
    backdrop.classList.add("hidden");
    // clear variant state when fully hidden
    drawer.classList.remove("collapsed");
  }, 190);
}

function openSimpleModal(id) {
  const modal = $(id);
  if (!modal) return;
  modal.classList.remove("hidden");
}

function closeSimpleModal(id) {
  const modal = $(id);
  if (!modal) return;
  modal.classList.add("hidden");
}

function renderReports() {
  if (!$("reportsList")) return;
  const players = state.players || [];
  const present = players.filter((player) => player.present).length;
  const sorted = [...players].sort((a, b) => (+b.points || 0) - (+a.points || 0));
  const most = sorted[0];
  const least = sorted[sorted.length - 1];

  $("reportTotalPlayers").textContent = players.length;
  $("reportTodayAttendance").textContent = present;
  $("reportAttendanceRate").textContent = `${rate(players)}%`;
  $("reportsList").innerHTML = [
    `<div class="row"><b>الأكثر حضوراً</b><span>${esc(most?.name || "لا يوجد")}</span></div>`,
    `<div class="row"><b>الأقل حضوراً</b><span>${esc(least?.name || "لا يوجد")}</span></div>`,
  ].join("");
}

function adminErrorMessage(error) {
  const code = error?.code || "";
  const raw = `${code} ${error?.message || ""}`;

  if (raw.includes("auth/invalid-email")) return "صيغة البريد الإلكتروني غير صحيحة";
  if (
    ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(
      code,
    ) ||
    raw.includes("auth/invalid-credential") ||
    raw.includes("INVALID_LOGIN_CREDENTIALS")
  )
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  if (raw.includes("auth/user-disabled")) return "تم تعطيل هذا الحساب";
  if (raw.includes("auth/too-many-requests"))
    return "تم إيقاف المحاولات مؤقتاً. حاول لاحقاً";
  if (raw.includes("permission-denied"))
    return "ليس لديك صلاحية تنفيذ هذه العملية في Firebase";
  if (raw.includes("unauthenticated")) return "يجب تسجيل الدخول أولاً";
  if (raw.includes("unavailable") || raw.includes("network"))
    return "تعذر الاتصال بـ Firebase. حاول مرة أخرى";

  return "تعذر تنفيذ العملية. تحقق من البيانات وحاول مرة أخرى";
}

function localSportsAsObjects() {
  return sports.map(([nameEn, nameAr, count, image]) => ({
    id: nameEn,
    nameAr,
    nameEn,
    image,
    active: true,
    count,
  }));
}

function sportLabel(sport) {
  return sport?.nameAr || sport?.sport || sport?.id || "غير محدد";
}

function sportValue(sport) {
  return sport?.id || sport?.nameEn || sport?.sportId || sport?.nameAr || "";
}

function sportLabelById(id) {
  const sport = adminState.sports.find((item) => sportValue(item) === id);
  return sportLabel(sport) || id || "غير محدد";
}

function coachKey(coach) {
  return coach?.uid || coach?.authUid || coach?.id || coach?.email || "";
}

function coachNameById(id) {
  const coach = adminState.coaches.find((item) => String(coachKey(item)) === String(id));
  return coach?.name || coach?.email || id || "غير محدد";
}

function playerMatchesSport(player, sportId) {
  if (!sportId) return true;
  return player.sportId === sportId || player.sport === sportLabelById(sportId);
}

function playerMatchesCoach(player, coachId) {
  if (!coachId) return true;
  return [player.coachId, player.coachUid, player.coachEmail].some(
    (value) => String(value || "") === String(coachId),
  );
}

function fillSportSelect(selectId, allLabel = "") {
  const select = $(selectId);
  if (!select) return;
  const options = adminState.sports.length ? adminState.sports : localSportsAsObjects();
  select.innerHTML = allLabel ? `<option value="">${allLabel}</option>` : "";
  options.forEach((sport) => {
    const option = document.createElement("option");
    option.value = sportValue(sport);
    option.textContent = sportLabel(sport);
    select.appendChild(option);
  });
}

function fillCoachSelect(selectId) {
  const select = $(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">كل المدربين</option>';
  adminState.coaches.forEach((coach) => {
    const option = document.createElement("option");
    option.value = coachKey(coach);
    option.textContent = coach.name || coach.email || "مدرب";
    select.appendChild(option);
  });
}

function syncSportsFromFirestore(remoteSports) {
  if (!Array.isArray(remoteSports) || !remoteSports.length) return;
  const activeSports = remoteSports.filter((sport) => sport.active !== false);
  if (!activeSports.length) return;
  sports.splice(
    0,
    sports.length,
    ...activeSports.map((sport) => [
      sport.nameEn || sport.id || sport.nameAr,
      sport.nameAr || sport.nameEn || sport.id,
      sport.count || sport.playersCount || 0,
      sport.image || "assets/optimized/hilal-icon.webp",
    ]),
  );
  renderSports();
}

async function loadSportsCatalogFromFirebase() {
  const api = firebaseApi();
  if (!api?.getSports) return;
  const remoteSports = await api.getSports({ active: true });
  syncSportsFromFirestore(remoteSports);
}

async function loadAdminDashboard(force = false) {
  const api = firebaseApi();
  if (!api || adminState.loaded && !force) {
    renderAdminDashboard();
    return;
  }

  const today = $("attendanceDateFilter")?.value || todayKey();
  const [sportsResult, coachesResult, playersResult, attendanceResult, settingsResult] =
    await Promise.allSettled([
      api.getSports ? api.getSports() : Promise.resolve([]),
      api.getCoaches ? api.getCoaches() : Promise.resolve([]),
      api.getAllPlayers
        ? api.getAllPlayers()
        : api.getPlayers
          ? api.getPlayers()
          : Promise.resolve([]),
      api.getAttendanceRecords
        ? api.getAttendanceRecords({ date: today })
        : Promise.resolve([]),
      api.getAppSettings ? api.getAppSettings() : Promise.resolve(null),
    ]);

  adminState.sports =
    sportsResult.status === "fulfilled" &&
    Array.isArray(sportsResult.value) &&
    sportsResult.value.length
      ? sportsResult.value
      : localSportsAsObjects();
  adminState.coaches =
    coachesResult.status === "fulfilled" && Array.isArray(coachesResult.value)
      ? coachesResult.value
      : [];
  adminState.players =
    playersResult.status === "fulfilled" && Array.isArray(playersResult.value)
      ? playersResult.value
      : state.players || [];
  adminState.attendance =
    attendanceResult.status === "fulfilled" && Array.isArray(attendanceResult.value)
      ? attendanceResult.value
      : [];

  if (settingsResult.status === "fulfilled" && settingsResult.value) {
    adminState.settings = settingsResult.value;
    state.supportWhatsapp =
      settingsResult.value.supportWhatsapp || state.supportWhatsapp || ADMIN_DEFAULT_WHATSAPP;
    state.appName = settingsResult.value.appName || state.appName;
    save();
  }

  adminState.loaded = true;
  renderAdminDashboard();

  if (
    [sportsResult, coachesResult, playersResult, attendanceResult, settingsResult].some(
      (result) => result.status === "rejected",
    )
  ) {
    toast("تم فتح لوحة الإداري مع بعض البيانات المحلية بسبب تعذر تحميل Firebase");
  }
}

function renderAdminDashboard() {
  if (!$("adminDash")) return;
  renderAdminOverview();
  renderAdminSelects();
  renderAdminSportsSummary();
  renderAdminSportsList();
  renderAdminCoachesList();
  renderAdminPlayersList();
  renderAdminAttendanceList();
  renderAdminSettings();
}

function renderAdminOverview() {
  if (!$("adminSportsCount")) return;
  const todayPresent =
    adminState.attendance.filter((entry) => entry.present).length ||
    (state.players || []).filter((player) => player.present).length;

  $("adminSportsCount").textContent = adminState.sports.length || sports.length;
  $("adminCoachesCount").textContent = adminState.coaches.length;
  $("adminPlayersCount").textContent = adminState.players.length;
  $("adminTodayAttendance").textContent = todayPresent;
}

function renderAdminSelects() {
  fillSportSelect("coachSportAdmin", "اختر الرياضة");
  fillSportSelect("coachSportFilterAdmin", "كل الرياضات");
  fillSportSelect("playerSportFilter", "كل الرياضات");
  fillSportSelect("attendanceSportFilter", "كل الرياضات");
  fillCoachSelect("playerCoachFilter");
  fillCoachSelect("attendanceCoachFilter");
  if ($("attendanceDateFilter") && !$("attendanceDateFilter").value)
    $("attendanceDateFilter").value = todayKey();
}

function renderAdminSportsSummary() {
  const root = $("adminSportsSummary");
  if (!root) return;
  const allSports = adminState.sports.length ? adminState.sports : localSportsAsObjects();
  root.innerHTML = allSports
    .map((sport) => {
      const sportId = sportValue(sport);
      const coachesCount = adminState.coaches.filter((coach) => coach.sportId === sportId).length;
      const playersCount = adminState.players.filter((player) =>
        playerMatchesSport(player, sportId),
      ).length;
      const attendanceCount = adminState.attendance.filter((entry) =>
        playerMatchesSport(entry, sportId),
      ).length;

      return `<article class="admin-summary-card">
        <div>
          <b>${esc(sportLabel(sport))}</b>
          <span>${sport.active === false ? "معطلة" : "مفعلة"}</span>
        </div>
        <div class="admin-summary-stats">
          <span>${coachesCount} مدرب</span>
          <span>${playersCount} لاعب</span>
          <span>${attendanceCount} حضور</span>
        </div>
        <div class="admin-summary-actions">
          <button class="soft" data-admin-filter="players" data-sport-id="${esc(sportId)}" type="button">اللاعبين</button>
          <button class="ghost" data-admin-filter="coaches" data-sport-id="${esc(sportId)}" type="button">المدربين</button>
        </div>
      </article>`;
    })
    .join("");
}

function renderAdminSportsList() {
  const root = $("adminSportsList");
  if (!root) return;
  if (!adminState.sports.length) {
    root.innerHTML = '<div class="empty">لا توجد رياضات حتى الآن</div>';
    return;
  }

  root.innerHTML = adminState.sports
    .map(
      (sport) => `<article class="admin-item" data-sport-id="${esc(sportValue(sport))}">
        <div class="admin-item-title"><b>${esc(sportLabel(sport))}</b><span>${sport.active === false ? "معطلة" : "مفعّلة"}</span></div>
        <input class="input" data-admin-field="nameAr" value="${esc(sport.nameAr || "")}" placeholder="اسم الرياضة بالعربي">
        <input class="input" data-admin-field="nameEn" value="${esc(sport.nameEn || "")}" placeholder="اسم الرياضة بالإنجليزي">
        <input class="input" data-admin-field="image" value="${esc(sport.image || "")}" placeholder="مسار الصورة">
        <label class="admin-check"><input type="checkbox" data-admin-field="active" ${sport.active === false ? "" : "checked"}><span>مفعّلة</span></label>
        <div class="admin-actions">
          <button class="soft" data-admin-action="update-sport" type="button">حفظ</button>
          <button class="ghost danger-action" data-admin-action="delete-sport" type="button">حذف</button>
        </div>
      </article>`,
    )
    .join("");
}

function renderAdminCoachesList() {
  const root = $("adminCoachesList");
  if (!root) return;
  const sportFilter = $("coachSportFilterAdmin")?.value || "";
  const search = ($("coachSearchAdmin")?.value || "").trim();
  const coaches = adminState.coaches.filter((coach) => {
    if (sportFilter && coach.sportId !== sportFilter) return false;
    if (
      search &&
      !String(coach.name || "").includes(search) &&
      !String(coach.email || "").includes(search)
    )
      return false;

    return true;
  });

  if (!coaches.length) {
    root.innerHTML = '<div class="empty">لا توجد ملفات مدربين حتى الآن</div>';
    return;
  }

  root.innerHTML = coaches
    .map(
      (coach) => `<article class="admin-item" data-coach-id="${esc(coach.id || coach.uid || "")}" data-coach-email="${esc(coach.email || "")}">
        <div class="admin-item-title"><b>${esc(coach.name || "مدرب")}</b><span>${coach.active === false ? "معطل" : "مفعّل"}</span></div>
        <div class="admin-credential-box">
          <span>اسم المستخدم: <b>${esc(coach.email || "غير محدد")}</b></span>
          <span>كلمة المرور: لا يمكن عرضها، استخدم إعادة التعيين</span>
        </div>
        <input class="input" data-admin-field="name" value="${esc(coach.name || "")}" placeholder="اسم المدرب">
        <input class="input" data-admin-field="email" value="${esc(coach.email || "")}" placeholder="البريد">
        <input class="input" data-admin-field="phone" value="${esc(coach.phone || "")}" placeholder="الجوال">
        <input class="input" data-admin-field="uid" value="${esc(coach.uid || coach.authUid || "")}" placeholder="Firebase UID">
        <select class="select" data-admin-field="sportId">${adminSportOptions(coach.sportId)}</select>
        <label class="admin-check"><input type="checkbox" data-admin-field="active" ${coach.active === false ? "" : "checked"}><span>مفعّل</span></label>
        <div class="admin-actions">
          <button class="soft" data-admin-action="update-coach" type="button">حفظ</button>
          <button class="ghost" data-admin-action="reset-coach-password" type="button">إعادة كلمة المرور</button>
        </div>
      </article>`,
    )
    .join("");
}

function adminSportOptions(selected = "") {
  const options = adminState.sports.length ? adminState.sports : localSportsAsObjects();
  return options
    .map((sport) => {
      const value = sportValue(sport);
      return `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(sportLabel(sport))}</option>`;
    })
    .join("");
}

function renderAdminPlayersList() {
  const root = $("adminPlayersList");
  if (!root) return;
  const sportFilter = $("playerSportFilter")?.value || "";
  const coachFilter = $("playerCoachFilter")?.value || "";
  const groupFilter = $("playerGroupFilter")?.value || "";
  const search = ($("playerSearchAdmin")?.value || "").trim();
  const players = adminState.players.filter((player) => {
    if (!playerMatchesSport(player, sportFilter)) return false;
    if (!playerMatchesCoach(player, coachFilter)) return false;
    if (groupFilter && player.group !== groupFilter) return false;
    if (
      search &&
      !String(player.name || "").includes(search) &&
      !String(player.nationalId || player.identity || "").includes(search)
    )
      return false;

    return true;
  });

  if (!players.length) {
    root.innerHTML = '<div class="empty">لا يوجد لاعب مطابق</div>';
    return;
  }

  root.innerHTML = players
    .map(
      (player) => `<article class="admin-item" data-player-id="${esc(player.id || player.firebaseId || "")}">
        <div class="admin-item-title"><b>${esc(player.name || "لاعب")}</b><span>${esc(player.group || "غير محدد")}</span></div>
        <div class="admin-credential-box">
          <span>الرياضة: <b>${esc(player.sport || sportLabelById(player.sportId))}</b></span>
          <span>المدرب: ${esc(coachNameById(player.coachId || player.coachUid || player.coachEmail))}</span>
        </div>
        <input class="input" data-admin-field="name" value="${esc(player.name || "")}" placeholder="الاسم">
        <input class="input" data-admin-field="nationalId" value="${esc(player.nationalId || player.identity || "")}" placeholder="رقم الهوية">
        <input class="input" data-admin-field="phone" value="${esc(player.phone || "")}" placeholder="الجوال">
        <input class="input" data-admin-field="age" type="number" value="${esc(player.age || "")}" placeholder="العمر">
        <input class="input" data-admin-field="weight" type="number" value="${esc(player.weight || "")}" placeholder="الوزن">
        <select class="select" data-admin-field="group">${groups
          .map((group) => `<option ${group === player.group ? "selected" : ""}>${group}</option>`)
          .join("")}</select>
        <textarea class="textarea" data-admin-field="note" placeholder="ملاحظات">${esc(player.note || "")}</textarea>
        <div class="admin-actions">
          <button class="soft" data-admin-action="update-player" type="button">حفظ</button>
          <button class="ghost danger-action" data-admin-action="delete-player" type="button">حذف</button>
        </div>
      </article>`,
    )
    .join("");
}

function renderAdminAttendanceList() {
  const root = $("adminAttendanceList");
  if (!root) return;
  if (!adminState.attendance.length) {
    root.innerHTML = '<div class="empty">لا توجد سجلات حضور لهذا الاختيار</div>';
    return;
  }

  root.innerHTML = adminState.attendance
    .map(
      (entry) => `<div class="row">
        <b>${esc(entry.playerName || entry.playerId || "لاعب")}</b>
        <span>${entry.present ? "حاضر" : "غائب"} - ${esc(entry.date || "")}</span>
      </div>`,
    )
    .join("");
}

function renderAdminSettings() {
  if ($("settingsWhatsapp"))
    $("settingsWhatsapp").value = supportNumber();
  if ($("settingsAppName"))
    $("settingsAppName").value = adminState.settings?.appName || state.appName || "إدارة النادي";
}

function readAdminItem(item, fields) {
  return Object.fromEntries(
    fields.map((field) => {
      const control = item.querySelector(`[data-admin-field="${field}"]`);
      const value = control?.type === "checkbox" ? control.checked : control?.value?.trim();
      return [field, value];
    }),
  );
}

function isLocalDevelopmentHost() {
  return (
    location.protocol === "file:" ||
    ["localhost", "127.0.0.1", ""].includes(location.hostname)
  );
}

async function handleAdminLogin() {
  const email = $("adminLoginEmail")?.value.trim();
  const password = $("adminLoginPass")?.value.trim();
  if (!email || !password)
    return msg($("adminLoginMsg"), "اكتب البريد الإلكتروني وكلمة المرور", "error");

  const api = firebaseApi();
  const isLocalAdmin =
    isLocalDevelopmentHost() &&
    (email === "admin@hilal.local" || email === "admin@gmail.com") &&
    password === "Admin@12345";
  if (isLocalAdmin) {
    adminState.profile = { uid: "local-admin", email, name: "المشرف المحلي", active: true };
    msg($("adminLoginMsg"), "تم دخول الإداري (تجريبي)");
    closeSimpleModal("adminLoginModal");
    closeDrawer();
    page("adminDash");
    await loadAdminDashboard(true);
    return;
  }
  if (!api?.loginAdmin)
    return msg($("adminLoginMsg"), "تعذر تحميل Firebase Auth. حدّث الصفحة", "error");

  $("adminLoginBtn").disabled = true;
  try {
    const credential = await api.loginAdmin(email, password);
    const profile = api.getAdminProfile
      ? await api.getAdminProfile({
          uid: credential.user.uid,
          email: credential.user.email || email,
        })
      : null;

    if (!profile || profile.active === false) {
      await api.logoutCoach?.().catch(() => {});
      return msg($("adminLoginMsg"), "ليس لديك صلاحية دخول الإداري", "error");
    }

    adminState.profile = profile;
    msg($("adminLoginMsg"), "تم دخول الإداري");
    closeSimpleModal("adminLoginModal");
    closeDrawer();
    page("adminDash");
    await loadAdminDashboard(true);
  } catch (error) {
    msg($("adminLoginMsg"), adminErrorMessage(error), "error");
  } finally {
    $("adminLoginBtn").disabled = false;
  }
}

async function addSportFromForm() {
  const api = firebaseApi();
  const payload = {
    nameAr: $("sportNameAr")?.value.trim(),
    nameEn: $("sportNameEn")?.value.trim(),
    image: $("sportImage")?.value.trim(),
    active: Boolean($("sportActive")?.checked),
  };
  if (!payload.nameAr)
    return msg($("sportsAdminMsg"), "اكتب اسم الرياضة بالعربي", "error");

  try {
    const saved = await api.addSport(payload);
    adminState.sports.push(saved);
    ["sportNameAr", "sportNameEn", "sportImage"].forEach((id) => ($(id).value = ""));
    $("sportActive").checked = true;
    msg($("sportsAdminMsg"), "تمت إضافة الرياضة");
    syncSportsFromFirestore(adminState.sports);
    renderAdminDashboard();
  } catch (error) {
    msg($("sportsAdminMsg"), adminErrorMessage(error), "error");
  }
}

async function updateSportFromItem(item) {
  const api = firebaseApi();
  const id = item.dataset.sportId;
  const payload = readAdminItem(item, ["nameAr", "nameEn", "image", "active"]);

  try {
    await api.updateSport(id, payload);
    adminState.sports = adminState.sports.map((sport) =>
      sportValue(sport) === id ? { ...sport, ...payload, id } : sport,
    );
    msg($("sportsAdminMsg"), "تم حفظ الرياضة");
    syncSportsFromFirestore(adminState.sports);
    renderAdminDashboard();
  } catch (error) {
    msg($("sportsAdminMsg"), adminErrorMessage(error), "error");
  }
}

async function deleteSportFromItem(item) {
  if (!confirm("تأكيد حذف الرياضة؟")) return;
  const api = firebaseApi();
  const id = item.dataset.sportId;

  try {
    await api.deleteSport(id);
    adminState.sports = adminState.sports.filter((sport) => sportValue(sport) !== id);
    msg($("sportsAdminMsg"), "تم حذف الرياضة");
    renderAdminDashboard();
  } catch (error) {
    msg($("sportsAdminMsg"), adminErrorMessage(error), "error");
  }
}

async function addCoachFromForm() {
  const api = firebaseApi();
  const payload = {
    uid: $("coachUidAdmin")?.value.trim(),
    name: $("coachNameAdmin")?.value.trim(),
    email: $("coachEmailAdmin")?.value.trim(),
    phone: $("coachPhoneAdmin")?.value.trim(),
    sportId: $("coachSportAdmin")?.value,
    role: "coach",
    active: Boolean($("coachActiveAdmin")?.checked),
  };
  if (!payload.name || !payload.email)
    return msg($("coachesAdminMsg"), "اكتب اسم المدرب وبريده", "error");

  try {
    const saved = await api.addCoach(payload);
    adminState.coaches.push(saved);
    ["coachUidAdmin", "coachNameAdmin", "coachEmailAdmin", "coachPhoneAdmin"].forEach(
      (id) => ($(id).value = ""),
    );
    $("coachActiveAdmin").checked = true;
    msg($("coachesAdminMsg"), "تمت إضافة ملف المدرب");
    renderAdminDashboard();
  } catch (error) {
    msg($("coachesAdminMsg"), adminErrorMessage(error), "error");
  }
}

async function updateCoachFromItem(item) {
  const api = firebaseApi();
  const id = item.dataset.coachId;
  const payload = readAdminItem(item, ["name", "email", "phone", "uid", "sportId", "active"]);

  try {
    await api.updateCoach(id, payload);
    adminState.coaches = adminState.coaches.map((coach) =>
      (coach.id || coach.uid) === id ? { ...coach, ...payload } : coach,
    );
    msg($("coachesAdminMsg"), "تم حفظ بيانات المدرب");
    renderAdminDashboard();
  } catch (error) {
    msg($("coachesAdminMsg"), adminErrorMessage(error), "error");
  }
}

async function resetCoachPasswordFromItem(item) {
  const email =
    item.dataset.coachEmail ||
    item.querySelector('[data-admin-field="email"]')?.value?.trim();
  if (!email) return msg($("coachesAdminMsg"), "لا يوجد بريد للمدرب", "error");
  if (!firebaseApi()?.resetPassword)
    return msg($("coachesAdminMsg"), "تعذر تحميل خدمة إعادة كلمة المرور", "error");

  try {
    await firebaseApi().resetPassword(email);
    msg($("coachesAdminMsg"), `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}`);
  } catch (error) {
    msg($("coachesAdminMsg"), adminErrorMessage(error), "error");
  }
}

async function updatePlayerFromItem(item) {
  const api = firebaseApi();
  const id = item.dataset.playerId;
  const existing = adminState.players.find(
    (player) => String(player.id || player.firebaseId) === String(id),
  );
  const payload = readAdminItem(item, [
    "name",
    "nationalId",
    "phone",
    "age",
    "weight",
    "group",
    "note",
  ]);
  payload.age = +payload.age || "";
  payload.sport = existing?.sport || state.selectedSport.ar;
  payload.sportId = existing?.sportId || state.selectedSport.en;

  try {
    await api.updatePlayer(id, payload);
    adminState.players = adminState.players.map((player) =>
      String(player.id || player.firebaseId) === String(id)
        ? { ...player, ...payload }
        : player,
    );
    state.players = state.players.map((player) =>
      playerMatchesId(player, id) ? { ...player, ...payload } : player,
    );
    save();
    msg($("playersAdminMsg"), "تم حفظ بيانات اللاعب");
    renderAdminPlayersList();
    attendance();
    dash();
  } catch (error) {
    msg($("playersAdminMsg"), adminErrorMessage(error), "error");
  }
}

async function deletePlayerFromItem(item) {
  if (!confirm("تأكيد حذف اللاعب؟")) return;
  const api = firebaseApi();
  const id = item.dataset.playerId;

  try {
    await api.deletePlayer(id);
    adminState.players = adminState.players.filter(
      (player) => String(player.id || player.firebaseId) !== String(id),
    );
    state.players = state.players.filter((player) => !playerMatchesId(player, id));
    save();
    msg($("playersAdminMsg"), "تم حذف اللاعب");
    renderAdminDashboard();
    attendance();
    dash();
  } catch (error) {
    msg($("playersAdminMsg"), adminErrorMessage(error), "error");
  }
}

async function refreshAdminAttendance() {
  const api = firebaseApi();
  if (!api?.getAttendanceRecords) return renderAdminAttendanceList();
  const sportFilter = $("attendanceSportFilter")?.value || "";
  const coachFilter = $("attendanceCoachFilter")?.value || "";
  const filters = {
    date: $("attendanceDateFilter")?.value || todayKey(),
  };
  if (sportFilter) filters.sportId = sportFilter;
  if (coachFilter) filters.coachId = coachFilter;

  try {
    adminState.attendance = await api.getAttendanceRecords(filters);
    renderAdminOverview();
    renderAdminAttendanceList();
  } catch (error) {
    msg($("attendanceAdminMsg"), adminErrorMessage(error), "error");
  }
}

async function saveAdminSettings() {
  const api = firebaseApi();
  const payload = {
    supportWhatsapp: cleanPhoneNumber($("settingsWhatsapp")?.value),
    appName: $("settingsAppName")?.value.trim() || "إدارة النادي",
  };

  try {
    if (api?.updateAppSettings) await api.updateAppSettings(payload);
    adminState.settings = { ...(adminState.settings || {}), ...payload };
    state.supportWhatsapp = payload.supportWhatsapp;
    state.appName = payload.appName;
    save();
    updateSupportLink();
    msg($("settingsAdminMsg"), "تم حفظ الإعدادات");
  } catch (error) {
    msg($("settingsAdminMsg"), adminErrorMessage(error), "error");
  }
}

function setAdminTab(name) {
  adminState.activeTab = name;
  document
    .querySelectorAll("[data-admin-tab]")
    .forEach((button) => button.classList.toggle("active", button.dataset.adminTab === name));
  document
    .querySelectorAll("[data-admin-panel]")
    .forEach((panel) => panel.classList.toggle("active", panel.dataset.adminPanel === name));
}

function bindDrawerEvents() {
  if (adminEventsBound) return;
  adminEventsBound = true;
  document.addEventListener("click", async (event) => {
    const drawerToggle = event.target.closest("[data-drawer-open]");
    if (drawerToggle) {
      event.preventDefault();
      if (toggleHomeDrawer()) return;
      openDrawer();
    }

    if (
      $("homeDrawer") &&
      !event.target.closest("#homeDrawer") &&
      !drawerToggle
    ) {
      closeHomeDrawer();
    }

    if (event.target.closest("#closeDrawer") || event.target.id === "drawerBackdrop")
      closeDrawer();

    const drawerGo = event.target.closest("[data-drawer-go]");
    if (drawerGo) {
      closeDrawer();
      page(drawerGo.dataset.drawerGo);
    }

    if (event.target.closest("#openPolicies")) {
      closeDrawer();
      openPolicyModal();
    }
    if (event.target.closest("#languageToggle")) {
      closeDrawer();
      toast("سيتم دعم تغيير اللغة لاحقاً");
    }
    if (event.target.closest("#openAdminLogin")) {
      closeDrawer();
      openSimpleModal("adminLoginModal");
      setTimeout(() => $("adminLoginEmail")?.focus(), 60);
    }
    if (event.target.closest("#drawerLogout")) {
      closeDrawer();
      try {
        await firebaseApi()?.logoutCoach?.();
      } catch {}
      toast("تم تسجيل الخروج");
      page("home");
    }
    if (
      event.target.id === "closePolicyModal" ||
      event.target.id === "policyModal"
    )
      closeSimpleModal("policyModal");
    if (
      event.target.id === "closeAboutModal" ||
      event.target.id === "aboutModal"
    )
      closeSimpleModal("aboutModal");
    if (
      event.target.id === "closeAdminLogin" ||
      event.target.id === "adminLoginModal"
    )
      closeSimpleModal("adminLoginModal");
    if (event.target.closest("#homeAdminBtn")) {
      closeHomeDrawer();
      openSimpleModal("adminLoginModal");
      setTimeout(() => $("adminLoginEmail")?.focus(), 60);
    }
    if (event.target.closest("#homePolicyBtn")) {
      closeHomeDrawer();
      openPolicyModal();
    }
    if (event.target.closest("#homeLangBtn")) {
      closeHomeDrawer();
      toast("سيتم دعم تغيير اللغة لاحقاً");
    }
    if (event.target.closest("#homeAboutBtn")) {
      closeHomeDrawer();
      openSimpleModal("aboutModal");
    }
    if (event.target.closest("#adminLoginBtn")) handleAdminLogin();
    if (event.target.closest("#addSportBtn")) addSportFromForm();
    if (event.target.closest("#addCoachBtn")) addCoachFromForm();
    if (event.target.closest("#saveSettingsBtn")) saveAdminSettings();

    const tab = event.target.closest("[data-admin-tab]");
    if (tab) setAdminTab(tab.dataset.adminTab);

    const filter = event.target.closest("[data-admin-filter]");
    if (filter) {
      const sportId = filter.dataset.sportId || "";
      if (filter.dataset.adminFilter === "players") {
        setAdminTab("players");
        if ($("playerSportFilter")) $("playerSportFilter").value = sportId;
        renderAdminPlayersList();
      }
      if (filter.dataset.adminFilter === "coaches") {
        setAdminTab("coaches");
        if ($("coachSportFilterAdmin")) $("coachSportFilterAdmin").value = sportId;
        renderAdminCoachesList();
      }
      return;
    }

    const action = event.target.closest("[data-admin-action]");
    if (!action) return;
    const item = action.closest(".admin-item");
    if (!item) return;
    if (action.dataset.adminAction === "update-sport") updateSportFromItem(item);
    if (action.dataset.adminAction === "delete-sport") deleteSportFromItem(item);
    if (action.dataset.adminAction === "update-coach") updateCoachFromItem(item);
    if (action.dataset.adminAction === "reset-coach-password") resetCoachPasswordFromItem(item);
    if (action.dataset.adminAction === "update-player") updatePlayerFromItem(item);
    if (action.dataset.adminAction === "delete-player") deletePlayerFromItem(item);
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "playerSearchAdmin") renderAdminPlayersList();
    if (event.target.id === "coachSearchAdmin") renderAdminCoachesList();
  });
  document.addEventListener("change", (event) => {
    if (["coachSportFilterAdmin"].includes(event.target.id))
      renderAdminCoachesList();
    if (["playerSportFilter", "playerCoachFilter", "playerGroupFilter"].includes(event.target.id))
      renderAdminPlayersList();
    if (
      ["attendanceDateFilter", "attendanceSportFilter", "attendanceCoachFilter"].includes(
        event.target.id,
      )
    )
      refreshAdminAttendance();
  });

  const content = document.querySelector(".content") || document.body;
  new MutationObserver(() => {
    if (!isHomeActive()) closeHomeDrawer();
  }).observe(content, { attributes: true, childList: true, subtree: true });
}
