import { loadAccount } from "/src/data/account.js";

const PRIMARY_NAV_HREFS = {
  Home: "/",
  Calendar: "/calendar",
  Services: "/services",
  Clients: "/clients",
  Team: "/team",
  Settings: "/settings",
};

function bindPageTransition() {
  if (document.documentElement.dataset.sessionsPageTransition === "true") return;
  document.documentElement.dataset.sessionsPageTransition = "true";

  let leaving = false;
  document.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const link = event.target.closest("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    const shell = document.querySelector(".home-shell");
    if (!shell) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true;
    shell.classList.add("is-page-leaving");
    const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--motion-fast")) || 120;
    window.setTimeout(() => location.assign(link.href), ms);
  });
}

function paintAvatarInitial(avatar, name, initial) {
  if (!avatar) return;
  avatar.classList.remove("sessions-avatar--image");
  avatar.classList.add("sessions-avatar--initials");
  avatar.setAttribute("aria-label", name);
  const inner = avatar.querySelector(".sessions-avatar__inner");
  if (!inner) return;
  inner.replaceChildren();
  const mark = document.createElement("span");
  mark.className = "sessions-avatar__initial";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = initial;
  inner.append(mark);
}

function paintSignedInAccount(root) {
  const account = loadAccount();
  if (!account?.businessName) return;
  const initial = account.name.trim().charAt(0).toUpperCase();
  root.querySelectorAll(".sessions-menu-user-header__name, .mobile-menu-panel__user-name").forEach((el) => {
    el.textContent = account.name;
  });
  root.querySelectorAll(".sessions-menu-user-header__email, .mobile-menu-panel__user-email").forEach((el) => {
    el.textContent = account.email;
  });
  root.querySelectorAll(".sessions-menu-user-header .sessions-avatar, [data-sessions-profile-trigger] .sessions-avatar, .mobile-menu-panel__user .sessions-avatar").forEach((avatar) => {
    paintAvatarInitial(avatar, account.name, initial);
  });
  root.querySelectorAll("[data-sessions-profile-trigger]").forEach((trigger) => {
    trigger.setAttribute("aria-label", `Open profile menu for ${account.name}`);
  });
  root.querySelectorAll(".mobile-menu-panel__user").forEach((trigger) => {
    trigger.setAttribute("aria-label", `View ${account.name} profile`);
  });
}

export function linkPrimaryNav(root, { selected } = {}) {
  bindPageTransition();
  paintSignedInAccount(root);
  root.querySelectorAll(".sessions-left-rail .sessions-rail-item, .mobile-menu-panel .sessions-nav-item").forEach((node) => {
    const label = node.getAttribute("aria-label");
    if (!label || node.classList.contains("mobile-menu__toggle")) return;

    if (selected) {
      const on = label === selected;
      node.classList.toggle("is-selected", on);
      if (on) node.setAttribute("aria-pressed", "true");
      else node.removeAttribute("aria-pressed");
    }

    const href = PRIMARY_NAV_HREFS[label];
    if (!href || node.tagName === "A") return;

    const link = document.createElement("a");
    link.className = node.className;
    link.href = href;
    link.setAttribute("aria-label", label);
    if (link.classList.contains("is-selected")) link.setAttribute("aria-current", "page");
    link.innerHTML = node.innerHTML;
    node.replaceWith(link);
  });

  root.querySelectorAll(".sessions-menu-item").forEach((item) => {
    if (item.querySelector(".sessions-menu-item__label")?.textContent !== "Account settings") return;
    if (item.tagName === "A") return;
    const link = document.createElement("a");
    link.className = item.className;
    link.href = "/settings";
    link.innerHTML = item.innerHTML;
    item.replaceWith(link);
  });
}
