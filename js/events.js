/* Events */
function bindGlobalEvents() {
  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) page(go.dataset.go);
    const card = e.target.closest("[data-card]");
    if (card) showPlayerCard(card.dataset.card);
    if (e.target.id === "closePlayerCard" || e.target.id === "playerCardModal")
      hidePlayerCard();
    const b = e.target.closest(".present[data-id]");
    if (b) {
      const p = state.players.find((x) => playerMatchesId(x, b.dataset.id));
      if (!p) return;
      const was = p.present;
      p.present = !p.present;
      if (!was && p.present) p.points++;
      if (was && !p.present && p.points > 0) p.points--;
      state.attendanceDate = todayKey();
      save();
      attendance();
      dash();
      playerDash();
      saveAttendanceToFirebase(p).catch(() => {
        showFirebaseWarning("تم حفظ الحضور محليًا فقط، تعذر حفظه في Firebase");
      });
    }
  });
  document.addEventListener("input", (e) => {
    const n = e.target.closest(".note[data-note]");
    if (n) {
      const p = state.players.find((x) => playerMatchesId(x, n.dataset.note));
      if (!p) return;
      p.note = n.value;
      save();
      debouncePlayerNoteSave(p);
    }
  });
}

function bindLoginEvents() {
  $("showCoach").onclick = () => {
    $("playerPanel").classList.add("hidden");
    $("coachPanel").classList.remove("hidden");
    $("coachUser").focus();
  };
  $("showPlayer").onclick = () => {
    $("coachPanel").classList.add("hidden");
    $("playerPanel").classList.remove("hidden");
    $("playerCode").focus();
  };
  $("coachLogin").onclick = async () => {
    const email = $("coachUser").value.trim(),
      password = $("coachPass").value.trim();
    if (!email || !password)
      return msg($("coachMsg"), "اكتب البريد الإلكتروني وكلمة المرور", "error");

    $("coachLogin").disabled = true;
    try {
      const loginWithFirebase = await getCoachLoginFunction();
      await loginWithFirebase(email, password);
      msg($("coachMsg"), "تم الدخول");
      setTimeout(() => page("coachDash"), 180);
    } catch (error) {
      msg($("coachMsg"), coachLoginErrorMessage(error), "error");
    } finally {
      $("coachLogin").disabled = false;
    }
  };
  $("playerLogin").onclick = () => {
    const c = $("playerCode").value.trim().toUpperCase();
    if (c === state.sportCode.toUpperCase()) {
      msg($("playerMsg"), "تم التحقق من الكود");
      setTimeout(() => page("playerDash"), 180);
    } else msg($("playerMsg"), "الكود غير صحيح", "error");
  };
}

async function getCoachLoginFunction() {
  if (typeof window.firebaseRuntime?.loginCoach === "function")
    return window.firebaseRuntime.loginCoach;
  if (typeof window.loginCoachWithFirebase === "function")
    return window.loginCoachWithFirebase;

  try {
    const { loginCoach } = await import("../src/firebase/auth.js");
    window.loginCoachWithFirebase = loginCoach;
    return loginCoach;
  } catch {
    return loginCoachWithFirebaseRest;
  }
}

async function loginCoachWithFirebaseRest(email, password) {
  const apiKey = "AIzaSyCcScEqYQedKiNv6rj-KEphUF8EI5Z8Zmc";
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result?.error?.message || "Unable to log in coach.");
    error.code = firebaseRestAuthCode(result?.error?.message);
    throw error;
  }

  return {
    user: {
      uid: result.localId,
      email: result.email,
    },
  };
}

function firebaseRestAuthCode(message = "") {
  if (["INVALID_LOGIN_CREDENTIALS", "EMAIL_NOT_FOUND", "INVALID_PASSWORD"].includes(message))
    return "auth/invalid-credential";
  if (message === "USER_DISABLED") return "auth/user-disabled";
  if (message === "TOO_MANY_ATTEMPTS_TRY_LATER") return "auth/too-many-requests";
  if (message === "INVALID_EMAIL") return "auth/invalid-email";

  return "auth/network-request-failed";
}

function coachLoginErrorMessage(error) {
  const code = error?.code || "";
  const message = error?.message || "";

  if (code === "auth/invalid-email") return "صيغة البريد الإلكتروني غير صحيحة";
  if (
    ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(
      code,
    )
  )
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  if (code === "auth/user-disabled") return "تم تعطيل حساب المدرب";
  if (code === "auth/too-many-requests")
    return "تم إيقاف المحاولات مؤقتًا. حاول لاحقًا";
  if (code === "auth/network-request-failed")
    return "تعذر الاتصال بFirebase. تحقق من الإنترنت وحاول مرة أخرى";
  if (code === "auth/operation-not-allowed")
    return "تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في Firebase";
  if (message.includes("Coach profile"))
    return "تم تسجيل الدخول لكن لم يتم العثور على ملف المدرب";

  return "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى";
}

function bindDashboardEvents() {
  $("saveCode").onclick = async () => {
    const c = $("codeInput").value.trim().toUpperCase();
    if (c.length < 4) return msg($("codeMsg"), "أدخل كود أطول وأوضح", "error");
    state.sportCode = c;
    save();
    $("codeInput").value = c;
    msg($("codeMsg"), "تم حفظ الكود بنجاح");
    try {
      await saveSportSettingsToFirebase(c);
    } catch {
      msg($("codeMsg"), "تم حفظ الكود محليًا فقط، تعذر حفظه في Firebase", "warn");
    }
  };
  $("copyCode").onclick = async () => {
    const c = $("codeInput").value.trim().toUpperCase() || state.sportCode;
    try {
      if (navigator.clipboard && window.isSecureContext)
        await navigator.clipboard.writeText(c);
      else {
        $("codeInput").value = c;
        $("codeInput").select();
        document.execCommand("copy");
        $("codeInput").blur();
      }
      msg($("codeMsg"), "تم نسخ الكود");
    } catch {
      msg($("codeMsg"), "تعذر نسخ الكود تلقائيًا", "error");
    }
  };
  $("toggleRegister").onclick = toggleRegisterPanel;
  $("saveNewPlayer").onclick = registerPlayer;
  $("saveWeekly").onclick = async () => {
    document
      .querySelectorAll(".weekly-input")
      .forEach(
        (i) =>
          (state.weeklyPlan[+i.dataset.i].workout = i.value.trim() || "راحة"),
      );
    save();
    msg($("weeklyMsg"), "تم حفظ الجدول وسيظهر للاعب مباشرة");
    playerDash();
    try {
      await saveWeeklyScheduleToFirebase();
    } catch {
      msg(
        $("weeklyMsg"),
        "تم حفظ الجدول محليًا فقط، تعذر حفظه في Firebase",
        "warn",
      );
    }
  };
  $("dailyGroup").onchange = daily;
  $("search").oninput = attendance;
  $("addDaily").onclick = async () => {
    const title = $("dailyTitle").value.trim(),
      details = $("dailyDetails").value.trim();
    if (!title || !details)
      return msg($("dailyMsg"), "اكتب اسم التمرين والتفاصيل", "error");
    const workout = {
      title,
      details,
      group: $("dailyGroup").value,
      note: $("dailyNote").value.trim(),
      sport: sportName(),
    };
    state.dailyWorkouts.push(workout);
    save();
    $("dailyTitle").value = $("dailyDetails").value = $("dailyNote").value = "";
    msg($("dailyMsg"), "تمت إضافة التمرين");
    daily();
    playerDash();
    try {
      const savedWorkout = await saveDailyWorkoutToFirebase(workout);
      if (savedWorkout?.id) {
        workout.id = savedWorkout.id;
        workout.firebaseId = savedWorkout.id;
        save();
        daily();
        playerDash();
      }
    } catch {
      msg(
        $("dailyMsg"),
        "تم حفظ التمرين محليًا فقط، تعذر حفظه في Firebase",
        "warn",
      );
    }
  };
  $("reset").onclick = async () => {
    if (!confirm("تأكيد تصفير حضور اليوم؟")) return;
    state.players.forEach((p) => (p.present = false));
    state.attendanceDate = todayKey();
    save();
    attendance();
    dash();
    playerDash();
    const results = await Promise.allSettled(
      state.players.map((player) => saveAttendanceToFirebase(player)),
    );
    if (results.some((result) => result.status === "rejected")) {
      showFirebaseWarning("تم تصفير الحضور محليًا فقط، تعذر حفظه كاملًا في Firebase");
    }
  };
}

function bindEvents() {
  bindGlobalEvents();
  bindLoginEvents();
  bindDashboardEvents();
  if (typeof bindDrawerEvents === "function") bindDrawerEvents();
}
