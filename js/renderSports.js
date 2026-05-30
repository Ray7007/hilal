/* Sports Rendering */
function loadSportImage(card) {
  if (!card || card.dataset.loaded === "1") return;
  card.style.setProperty("--img", `url('${card.dataset.img}')`);
  card.dataset.loaded = "1";
}

function lazyLoadSportImages() {
  const cards = document.querySelectorAll(".sport[data-img]");
  if (!("IntersectionObserver" in window)) {
    cards.forEach(loadSportImage);
    return;
  }
  const root = document.querySelector(".content") || null;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadSportImage(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { root, rootMargin: "180px 0px", threshold: 0.01 },
  );
  cards.forEach((card) => observer.observe(card));
}

function renderSports() {
  $("sportsGrid").innerHTML = "";
  sports.forEach(([en, ar, count, img]) => {
    const c = document.createElement("article");
    c.className = "sport";
    c.dataset.img = img;
    c.innerHTML = `<b>${en}</b><span>${ar}</span><div class="meta"><span>${count} لاعب</span><i class="dot"></i></div>`;
    c.onclick = () => {
      state.selectedSport = { en, ar };
      save();
      $("sportTitle").textContent = en;
      $("sportDesc").textContent = `اختر المسار المناسب لرياضة ${ar}`;
      $("sportStatus").textContent = `${count} لاعب`;
      page("sport");
      loadFirebaseState().catch(() => {
        showFirebaseWarning("تعذر تحميل بيانات الرياضة من Firebase، تم استخدام البيانات المحلية");
      });
    };
    $("sportsGrid").appendChild(c);
  });
  lazyLoadSportImages();
}
