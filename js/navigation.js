/* Navigation */
function hideSplash() {
  const el = $("splash");
  if (el) el.classList.add("splash-out");
}
function page(id) {
  const target = $(id);
  if (!target) return;
  const hasBottomNav = ["coachDash", "attendance", "weekly"].includes(id);
  document.body.dataset.page = id;
  document.body.classList.toggle("has-bottom-nav", hasBottomNav);
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  target.classList.add("active");
  document
    .querySelectorAll("#bottomNav button")
    .forEach((b) =>
      b.classList.toggle(
        "active",
        b.dataset.nav ? b.dataset.nav === id : b.dataset.go === id,
      ),
    );
  $("bottomNav").classList.toggle("hidden", !hasBottomNav);
  if (id === "sport") prepSport();
  if (id === "coachDash") dash();
  if (id === "attendance") {
    renderDayStrip();
    attendance();
  }
  if (id === "daily") daily();
  if (id === "weekly") weeklyEditor("weeklyEditor", "weekly-input");
  if (id === "reports" && typeof renderReports === "function") renderReports();
  if (id === "adminDash" && typeof loadAdminDashboard === "function")
    loadAdminDashboard().catch(() => {
      showFirebaseWarning("تعذر تحميل لوحة الإداري من Firebase");
    });
  if (id === "playerDash") playerDash();
  const content = document.querySelector(".content");
  if (content) content.scrollTop = 0;
  window.scrollTo(0, 0);
}
function prepSport() {
  $("coachPanel").classList.add("hidden");
  $("playerPanel").classList.add("hidden");
  $("playerCode").value = "";
  $("coachMsg").textContent = "";
  $("playerMsg").textContent = "";
}
