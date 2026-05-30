/* Player Rendering */
function playerDash() {
  $("playerSport").textContent = state.selectedSport.ar;
  $("playerWeekly").innerHTML = state.weeklyPlan
    .map(
      (e) => `<div class="row"><b>${e.day}</b><span>${e.workout}</span></div>`,
    )
    .join("");
}

function showPlayerCard(id) {
  const p = state.players.find((x) => playerMatchesId(x, id));
  if (!p) return;
  const modal = $("playerCardModal");
  $("playerCardBody").innerHTML =
    `<div class="player-card-head">بطاقة اللاعب/ة</div><div class="player-card-body"><section class="player-card-main"><div class="player-card-row"><span>الاسم:</span><b>${esc(p.name)}</b></div><div class="player-card-row"><span>رقم الهوية:</span><b>${esc(playerIdNo(p))}</b></div><div class="player-card-row"><span>اللعبة:</span><b>${esc(state.selectedSport.ar)}</b></div><div class="player-card-row"><span>تاريخ الميلاد:</span><b>${esc(playerBirth(p))}</b></div><div class="card-note"><div>الإداري: محمد مجرشي<br><b>المدرب: محمد علي</b><br><b>مساعد المدرب: رضوان الجوهر</b></div><div>ملاحظة المدرب: ${esc(p.note || "لا توجد ملاحظات")}</div></div><div class="card-valid">صلاحية لمدة شهرين من تاريخ ${new Date().toLocaleDateString("ar-SA")}</div></section><aside class="player-card-side"><div class="side-title">بيانات مختصرة</div><div class="side-stat"><small>الفئة</small><b>${esc(p.group || "غير محدد")}</b></div><div class="side-stat"><small>العمر</small><b>${esc(p.age || "-")} سنة</b></div><div class="side-stat"><small>الحضور</small><b>${esc(p.points || 0)} يوم</b></div></aside></div>`;
  modal.classList.remove("hidden");
}
function hidePlayerCard() {
  $("playerCardModal").classList.add("hidden");
}
