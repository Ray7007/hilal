/* Coach Rendering */
function dash() {
  const present = state.players.filter((p) => p.present).length;
  $("total").textContent = state.players.length;
  $("today").textContent = present;
  $("rate").textContent = rate() + "%";
  $("sportChip").textContent = state.selectedSport.ar;
  $("codeInput").value = state.sportCode;
}
function weeklyEditor(root, klass) {
  $(root).innerHTML = "";
  state.weeklyPlan.forEach((e, i) => {
    const l = document.createElement("label");
    l.className = "card";
    l.innerHTML = `<b>${e.day}</b><input class="input ${klass}" data-i="${i}" value="${esc(e.workout)}">`;
    $(root).appendChild(l);
  });
}
function daily() {
  $("dailyList").innerHTML = "";
  const list = state.dailyWorkouts.filter(
    (w) => w.group === $("dailyGroup").value,
  );
  if (!list.length) {
    $("dailyList").innerHTML =
      '<div class="empty">لا توجد تمارين لهذه الفئة حتى الآن</div>';
    return;
  }
  list.forEach((w, i) => {
    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `<div><b>${w.title}</b><br><span>${w.details}${w.note ? " - " + w.note : ""}</span></div><button class="ghost tiny-action" data-del="${i}">حذف</button>`;
    $("dailyList").appendChild(el);
  });
  document.querySelectorAll("[data-del]").forEach(
    (b) =>
      (b.onclick = async () => {
        const visible = state.dailyWorkouts.filter(
          (w) => w.group === $("dailyGroup").value,
        );
        const target = visible[+b.dataset.del];
        state.dailyWorkouts = state.dailyWorkouts.filter((w) => w !== target);
        save();
        daily();
        playerDash();
        try {
          await deleteDailyWorkoutFromFirebase(target);
        } catch {
          showFirebaseWarning("تم حذف التمرين محليًا فقط، تعذر حذفه من Firebase");
        }
      }),
  );
}
