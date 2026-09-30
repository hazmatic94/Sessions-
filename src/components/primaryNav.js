const PRIMARY_NAV_HREFS = {
  Home: "/",
  Calendar: "/calendar",
  Services: "/services",
  Clients: "/clients",
  Team: "/team",
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

export function linkPrimaryNav(root, { selected } = {}) {
  bindPageTransition();
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
}
