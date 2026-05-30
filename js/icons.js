/* Icons */
function ico(name) {
  const paths = {
    home: '<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    calendar:
      '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="4"/><path d="M3 10h18"/>',
    training:
      '<path d="M6 6v12"/><path d="M18 6v12"/><path d="M3 9v6"/><path d="M21 9v6"/><path d="M6 12h12"/>',
    save: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/><path d="M12 12h4"/><path d="M12 16h4"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><rect x="4" y="4" width="11" height="11" rx="2"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    shield:
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M9 12l2 2 4-5"/>',
    phone:
      '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z"/>',
    note: '<path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2"/><path d="M6.5 16a4 4 0 0 1 5 0"/><path d="M14 10h4"/><path d="M14 14h4"/>',
    sport:
      '<path d="M6 17 17 6"/><path d="m14 5 5 5"/><path d="m5 14 5 5"/><path d="M9 8 8 7"/><path d="m16 15-1-1"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    reports:
      '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-7"/>',
    whatsapp:
      '<path d="M5 19.5 6.3 16A8 8 0 1 1 9 18.2Z"/><path d="M9.5 8.8c.2 3 1.8 4.7 4.7 5l1.1-1.1c.3-.3.3-.8 0-1.1l-1-1c-.3-.3-.8-.3-1.1 0l-.4.4a5 5 0 0 1-1.8-1.8l.4-.4c.3-.3.3-.8 0-1.1l-1-1c-.3-.3-.8-.3-1.1 0Z"/>',
    policy:
      '<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/><path d="M9 12h6"/><path d="M9 16h6"/>',
    language:
      '<path d="M4 5h9"/><path d="M9 3v2c0 4-2 7-5 9"/><path d="M5 9c1 2 3 4 6 5"/><path d="M13 21l4-9 4 9"/><path d="M15 17h4"/>',
    logout:
      '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 4v16"/>',
    edit:
      '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash:
      '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.sport}</svg>`;
}
function setIconButton(id, text, icon) {
  const b = $(id);
  if (!b) return;
  b.innerHTML = `${ico(icon)}<span>${text}</span>`;
  b.dataset.iconified = "1";
}
function hydrateIcons() {
  document.querySelectorAll(".icon").forEach((btn) => {
    if (btn.dataset.iconified) return;
    const label = btn.textContent.trim(),
      isBack = label === "‹",
      iconName = btn.dataset.icon || (isBack ? "back" : "home");
    if (!btn.getAttribute("aria-label"))
      btn.setAttribute("aria-label", isBack ? "رجوع" : "الرئيسية");
    btn.innerHTML = ico(iconName);
    btn.dataset.iconified = "1";
  });
  const navIcons = {
    coachDash: "home",
    attendance: "calendar",
    weekly: "training",
  };
  document.querySelectorAll("#bottomNav button").forEach((btn) => {
    if (btn.dataset.iconified) return;
    const text = btn.textContent.trim();
    btn.innerHTML = `<span class="nav-icon">${ico(navIcons[btn.dataset.nav] || "home")}</span><span>${text}</span>`;
    btn.dataset.iconified = "1";
  });
  const copy = $("copyCode");
  if (copy && !copy.dataset.iconified) {
    copy.innerHTML = ico("copy");
    copy.dataset.iconified = "1";
  }
  document.querySelectorAll("[data-icon-chip]").forEach((chip) => {
    if (chip.dataset.iconified) return;
    const text = chip.textContent.trim();
    chip.innerHTML = `${ico(chip.dataset.iconChip)}<span>${text}</span>`;
    chip.dataset.iconified = "1";
  });
  [
    ["showPlayer", "user"],
    ["showCoach", "shield"],
    ["saveCode", "save"],
    ["toggleRegister", "plus"],
    ["saveNewPlayer", "save"],
    ["addDaily", "plus"],
    ["saveWeekly", "save"],
  ].forEach(([id, icon]) => {
    const b = $(id);
    if (b && !b.dataset.iconified)
      setIconButton(id, b.textContent.trim(), icon);
  });
}
