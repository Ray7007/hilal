/* Attendance Rendering */
function renderDayStrip() {
  const root = $("dayStrip");
  if (!root) return;
  const days = [
      "السبت",
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
    ],
    now = new Date(),
    today = new Intl.DateTimeFormat("ar-SA", { weekday: "long" })
      .format(now)
      .replace("،", ""),
    start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 1) % 7));
  root.innerHTML = days
    .map((d, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const active = d === today;
      return `<button type="button" class="${active ? "active" : ""}" aria-pressed="${active}"><span>${d}</span><b>${date.getDate()}</b></button>`;
    })
    .join("");
}

function attendance() {
  const term = ($("search").value || "").trim(),
    src = term
      ? state.players.filter(
          (p) => p.name.includes(term) || p.group.includes(term),
        )
      : state.players,
    p = src.filter((x) => x.present).length;
  $("presentCount").textContent = p;
  $("absentCount").textContent = src.length - p;
  $("ratioCount").textContent = src.length
    ? Math.round((p / src.length) * 100) + "%"
    : "0%";
  $("attendanceRoot").innerHTML = "";
  if (!src.length) {
    $("attendanceRoot").innerHTML =
      '<div class="empty">ما فيه لاعب مطابق للبحث</div>';
    return;
  }
  groups.forEach((g) => {
    const gp = src.filter((p) => p.group === g);
    if (!gp.length) return;
    const wrap = document.createElement("section");
    wrap.innerHTML = `<div class="group"><span>${g}</span><span>${gp.length} لاعب</span></div>`;
    gp.forEach((player) => {
      const el = document.createElement("article");
      el.className = "player";
      el.innerHTML = `<button class="player-name" data-card="${player.id}" type="button"><span class="player-id-icon">${ico("id")}</span><span>${player.name} <span class="player-age">(${player.age} سنة)</span></span></button><div class="note-wrap"><span class="note-icon">${ico("note")}</span><input class="input note" data-note="${player.id}" placeholder="اكتب ملاحظة هنا..." value="${esc(player.note)}"></div><div class="foot"><span>الحضور: ${player.points} أيام</span></div><div class="actions"><button class="present ${player.present ? "" : "off"}" data-id="${player.id}">${player.present ? "حاضر" : "تحضير"}</button><a class="call" href="tel:${player.phone}" aria-label="اتصال باللاعب">${ico("phone")}</a></div>`;
      wrap.appendChild(el);
    });
    $("attendanceRoot").appendChild(wrap);
  });
}
