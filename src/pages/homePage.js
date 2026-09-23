import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
} from "/ds/src/components/navigation/index.js";

const navOptions = {
  href: "/",
  ariaLabel: "Sessions home",
};

export function renderHomePage() {
  return `
    <div class="home-shell">
      <div id="top-nav" class="home-shell__desktop"></div>
      <div id="mobile-nav" class="home-shell__mobile"></div>
      <div class="home-shell__body">
        <div class="home-shell__rail" id="rail"></div>
        <main class="home-shell__main"></main>
      </div>
    </div>
  `;
}

export function mountHomePage(root) {
  root.innerHTML = renderHomePage();
  root.querySelector("#top-nav").innerHTML = renderTopNav(navOptions);
  root.querySelector("#rail").innerHTML = renderSessionsLeftRail({
    selected: "home",
  });
  root.querySelector("#mobile-nav").innerHTML = renderMobileMenu(navOptions);
  bindMobileMenu(root);
}

function bindMobileMenu(root) {
  root.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-mobile-menu-toggle]");
    if (!toggle) return;

    event.preventDefault();
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    const nextExpanded = !expanded;
    toggle.setAttribute("aria-expanded", String(nextExpanded));
    toggle.setAttribute(
      "aria-label",
      nextExpanded
        ? toggle.dataset.closeLabel || "Close menu"
        : toggle.dataset.menuLabel || "Open menu",
    );

    const device = toggle.closest(".mobile-menu-device");
    device?.classList.toggle("is-open", nextExpanded);
    device
      ?.querySelector("[data-mobile-menu-panel]")
      ?.setAttribute("aria-hidden", String(!nextExpanded));
  });

  const mobileQuery = window.matchMedia("(max-width: 768px)");
  mobileQuery.addEventListener("change", (event) => {
    if (event.matches) return;

    root.querySelectorAll(".mobile-menu-device.is-open").forEach((device) => {
      device.classList.remove("is-open");
      const toggle = device.querySelector("[data-mobile-menu-toggle]");
      if (!toggle) return;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", toggle.dataset.menuLabel || "Open menu");
      device.querySelector("[data-mobile-menu-panel]")?.setAttribute("aria-hidden", "true");
    });
  });
}
