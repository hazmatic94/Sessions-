import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
} from "/ds/src/components/navigation/index.js";
import { renderSessionsCalendarHeaderRow } from "/ds/src/components/patterns/calendarHeaderRow.js";
import { renderSessionsHourColumn } from "/ds/src/components/patterns/hourColumn.js";
import {
  applySessionsHourLabel,
  renderSessionsHourLabel,
} from "/ds/src/components/patterns/hourLabel.js";
import { HOUR_COUNT } from "/ds/src/components/patterns/hourTime.js";
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
          <main class="home-shell__main">
            <div id="hour-column" class="calendar-hours"></div>
          </main>
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
  const hours = root.querySelector("#hour-column");
  hours.innerHTML = Array.from({ length: HOUR_COUNT }, (_, hour) => {
    return `<div class="calendar-hour">${renderSessionsHourLabel({
      hour,
      minute: 0,
    })}${renderSessionsHourColumn({ hour })}</div>`;
  }).join("");
  syncHourClock(root, { scroll: true });
  window.setInterval(() => syncHourClock(root), 1000);
  linkPrimaryNav(root, { selected: "Calendar" });
  setupSessionsStaffHeaders();
  bindMobileMenu(root);
}

function syncHourClock(root, { scroll = false } = {}) {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  root.querySelectorAll("[data-sessions-hour-label]").forEach((label) => {
    const labelHour = Number(label.dataset.hour);
    const nextMinute = labelHour === hour ? minute : 0;
    if (Number(label.dataset.minute) !== nextMinute) {
      applySessionsHourLabel(label, labelHour, nextMinute);
    }
  });

  if (!scroll) return;
  const current = root.querySelector(
    `[data-sessions-hour-label][data-hour="${hour}"]`,
  );
  const row = current?.closest(".calendar-hour");
  const scroller = root.querySelector(".home-shell__main");
  if (!row || !scroller) return;
  scroller.scrollTop +=
    row.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
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
