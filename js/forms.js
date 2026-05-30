/* Forms */
function clearRegisterForm() {
  [
    "regName",
    "regNational",
    "regPhone",
    "regBirth",
    "regAge",
    "regWeight",
    "regNote",
  ].forEach((id) => ($(id).value = ""));
  $("regGroup").value = groups[0];
}
function toggleRegisterPanel() {
  const panel = $("registerPanel"),
    hidden = !panel.classList.contains("hidden");
  panel.classList.toggle("hidden", hidden);
  setIconButton(
    "toggleRegister",
    hidden ? "تسجيل لاعب" : "إخفاء التسجيل",
    hidden ? "plus" : "back",
  );
  if (!hidden) $("regName").focus();
}
async function registerPlayer() {
  const name = $("regName").value.trim(),
    nationalId = $("regNational").value.trim(),
    birthDate = $("regBirth").value,
    age = +$("regAge").value || ageFromBirth(birthDate);
  if (!name) return msg($("registerMsg"), "اكتب اسم اللاعب أولاً", "error");
  if (!nationalId)
    return msg(
      $("registerMsg"),
      "أدخل رقم الهوية حتى يظهر في بطاقة اللاعب",
      "error",
    );
  if (!age)
    return msg($("registerMsg"), "أدخل العمر أو تاريخ الميلاد", "error");

  const addPlayerToFirestore =
    window.firebaseRuntime?.addPlayer || window.addPlayerToFirestore;
  if (typeof addPlayerToFirestore !== "function")
    return msg(
      $("registerMsg"),
      "تعذر تحميل حفظ اللاعب في Firebase. حدّث الصفحة وحاول مرة أخرى",
      "error",
    );

  const playerData = {
    name,
    nationalId,
    phone: $("regPhone").value.trim(),
    birthDate,
    age,
    weight: $("regWeight").value.trim(),
    group: $("regGroup").value,
    note: $("regNote").value.trim(),
    sport: state.selectedSport.ar,
    sportId: state.selectedSport.en,
  };

  $("saveNewPlayer").disabled = true;
  try {
    const savedPlayer = await addPlayerToFirestore(playerData);

    const nextId = savedPlayer.id || Math.max(0, ...state.players.map((p) => +p.id || 0)) + 1;
    state.players.push({
      id: nextId,
      firebaseId: savedPlayer.id || "",
      ...playerData,
      present: false,
      points: 0,
    });
    save();
    clearRegisterForm();
    msg($("registerMsg"), "تم تسجيل اللاعب بنجاح وإضافته في التحضير");
    toast("تم تسجيل اللاعب بنجاح");
    attendance();
    dash();
    playerDash();
  } catch (error) {
    msg($("registerMsg"), playerRegistrationErrorMessage(error), "error");
  } finally {
    $("saveNewPlayer").disabled = false;
  }
}

function playerRegistrationErrorMessage(error) {
  const code = error?.code || "";

  if (code === "permission-denied")
    return "ليس لديك صلاحية حفظ اللاعب في Firebase";
  if (code === "unavailable" || code === "firebase/network-request-failed")
    return "تعذر الاتصال بFirebase. تحقق من الإنترنت وحاول مرة أخرى";

  return "تعذر حفظ اللاعب في Firebase. لم يتم مسح البيانات";
}
