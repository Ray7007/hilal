/* Bootstrap */
async function finishBoot(started) {
  setSplashProgress(0.92);
  await wait(SPLASH_MIN_DURATION - (performance.now() - started));
  setSplashProgress(1);
  document.body.classList.add("app-ready");
  await nextPaint();
  await wait(Math.min(170, Math.max(0, timeLeft(started, 20))));
  hideSplash();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  const register = () => navigator.serviceWorker.register("./sw.js").catch(() => null);
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}

async function init() {
  const started = performance.now();
  setSplashProgress(0.06);
  await domReady();
  setSplashProgress(0.18);
  hydrateLazyImages();
  state = load();
  setSplashProgress(0.3);
  bindEvents();
  resetAttendanceIfNewDay();
  setInterval(resetAttendanceIfNewDay, 60000);
  hydrateIcons();
  renderSports();
  if (typeof loadSportsCatalogFromFirebase === "function")
    loadSportsCatalogFromFirebase().catch(() => {
      showFirebaseWarning("تعذر تحميل الرياضات من Firebase، تم استخدام القائمة المحلية");
    });
  renderDayStrip();
  attendance();
  daily();
  playerDash();
  page("home");
  loadFirebaseState().catch(() => {
    showFirebaseWarning("تعذر الاتصال بـ Firebase، تم استخدام البيانات المحلية");
  });
  setSplashProgress(0.4);
  await waitForImages(started);
  await nextPaint();
  setSplashProgress(0.84);
  await finishBoot(started);
  registerServiceWorker();
}

init().catch(() => {
  if (!state) state = load();
  setSplashProgress(1);
  document.body.classList.add("app-ready");
  hideSplash();
});
