import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
} from "/ds/src/components/navigation/index.js";
import { renderSessionsCalendarHeaderRow } from "/ds/src/components/patterns/calendarHeaderRow.js";
import {
  renderSessionsStaffHeader,
  setupSessionsStaffHeaders,
} from "/ds/src/components/patterns/staffHeader.js";
import { linkPrimaryNav } from "/src/components/primaryNav.js";

const STAFF = [
  { name: "Larry June", avatarSrc: "/assets/user.png" },
  { name: "Marcus Bell", avatarInitial: "M" },
  { name: "Sofia Reyes", avatarInitial: "S" },
];

const navOptions = {
  href: "/",
  ariaLabel: "Sessions home",
};

export function renderCalendarPage() {
  return `
    <div class="home-shell">
      <div id="mobile-nav" class="home-shell__mobile"></div>
      <div id="top-nav" class="home-shell__desktop"></div>
      <div class="home-shell__body">
        <div class="home-shell__rail" id="rail"></div>
        <div class="calendar-stage">
          <div id="calendar-header"></div>
          <div id="staff-header"></div>
          <main class="home-shell__main"></main>
        </div>
      </div>
    </div>
  `;
}

export function mountCalendarPage(root) {
  root.innerHTML = renderCalendarPage();
  root.querySelector("#top-nav").innerHTML = renderTopNav(navOptions);
  root.querySelector("#rail").innerHTML = renderSessionsLeftRail({
    selected: "calendar",
  });
  root.querySelector("#mobile-nav").innerHTML = renderMobileMenu(navOptions);
  root.querySelector("#calendar-header").innerHTML = renderSessionsCalendarHeaderRow();
  root.querySelector("#staff-header").innerHTML = renderSessionsStaffHeader({
    name: "Larry June",
    avatarSrc: "/assets/user.png",
    staff: STAFF,
  });
  linkPrimaryNav(root, { selected: "Calendar" });
  setupSessionsStaffHeaders();
  bindMobileMenu(root);
}

function setMobileMenuOpen(device, open) {
  device.classList.toggle("is-open", open);
  const toggle = device.querySelector("[data-mobile-menu-toggle]");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open
        ? toggle.dataset.closeLabel || "Close menu"
        : toggle.dataset.menuLabel || "Open menu",
    );
  }
  device
    .querySelector("[data-mobile-menu-panel]")
    ?.setAttribute("aria-hidden", String(!open));
}

function bindMobileMenu(root) {
  root.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-mobile-menu-toggle]");
    if (toggle) {
      event.preventDefault();
      const device = toggle.closest(".mobile-menu-device");
      if (!device) return;
      setMobileMenuOpen(device, toggle.getAttribute("aria-expanded") !== "true");
      return;
    }

    if (
      event.target.classList?.contains("mobile-menu-device") &&
      event.target.classList.contains("is-open")
    ) {
      setMobileMenuOpen(event.target, false);
    }
  });

  const mobileQuery = window.matchMedia("(max-width: 768px)");
  mobileQuery.addEventListener("change", (event) => {
    if (event.matches) return;
    root.querySelectorAll(".mobile-menu-device.is-open").forEach((device) => {
      setMobileMenuOpen(device, false);
    });
  });
}
