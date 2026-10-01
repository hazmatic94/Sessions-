import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
  setupSessionsProfileMenu,
} from "/ds/src/components/navigation/index.js";
import { applySessionsCalendarSelection } from "/ds/src/components/calendar/calendar.js";
import { setupSessionsCalendars } from "/ds/src/components/calendar/interactions.js";
import {
  formatCalendarHeaderMobileDate,
  renderSessionsCalendarHeaderRow,
  setupSessionsTeamMenus,
} from "/ds/src/components/patterns/calendarHeaderRow.js";
import { renderSessionsCalendarDayHeader } from "/ds/src/components/patterns/calendarDayHeader.js";
import { renderSessionsStaffDayBoard } from "/ds/src/components/patterns/staffDayBoard.js";
import {
  addNavigatorDays,
  formatNavigatorDate,
  setupSessionsNavigators,
  toNavigatorDateValue,
} from "/ds/src/components/patterns/navigator.js";
import {
  renderSessionsCurrentTimeIndicator,
  setupSessionsCurrentTimeIndicators,
} from "/ds/src/components/patterns/currentTimeIndicator.js";
import { renderSessionsHourColumn } from "/ds/src/components/patterns/hourColumn.js";
import { setupSessionsSlotMenus } from "/ds/src/components/patterns/slotMenu.js";
import { renderSessionsHourLabel } from "/ds/src/components/patterns/hourLabel.js";
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

const OPEN_FROM_HOUR = 9;
const OPEN_UNTIL_HOUR = 18;
const CLOSED_QUARTERS = [0, 15, 30, 45];

function outsideMinutesForHour(hour) {
  if (hour >= OPEN_FROM_HOUR && hour < OPEN_UNTIL_HOUR) return [];
  return CLOSED_QUARTERS;
}

export function renderCalendarPage() {
  return `
    <div class="home-shell">
      <div id="mobile-nav" class="home-shell__mobile"></div>
      <div id="top-nav" class="home-shell__desktop"></div>
      <div class="home-shell__body">
        <div class="home-shell__rail" id="rail"></div>
        <div class="calendar-stage" style="--sessions-staff-count: ${STAFF.length}">
          <div id="calendar-header"></div>
          <div id="staff-header"></div>
          <div id="calendar-days" hidden></div>
          <main class="home-shell__main">
            <div id="staff-days" class="sessions-staff-days" hidden></div>
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
  setupSessionsProfileMenu(root);
  root.querySelector("#rail").innerHTML = renderSessionsLeftRail({
    selected: "calendar",
  });
  root.querySelector("#mobile-nav").innerHTML = renderMobileMenu(navOptions);
  root.querySelector("#calendar-header").innerHTML = renderSessionsCalendarHeaderRow({
    team: STAFF,
    youName: "Larry June",
  });
  root.querySelector("#staff-header").innerHTML = renderStaffHeader(STAFF);
  const hours = root.querySelector("#hour-column");
  hours.innerHTML = `${Array.from({ length: HOUR_COUNT }, (_, hour) => {
    const columns = Array.from({ length: 7 }, (_, index) => {
      const column = renderSessionsHourColumn({
        hour,
        outsideMinutes: outsideMinutesForHour(hour),
      });
      return index < STAFF.length
        ? column
        : column.replace("sessions-hour-column", "sessions-hour-column is-day-extra");
    }).join("");
    return `<div class="calendar-hour">${renderSessionsHourLabel({
      hour,
      minute: 0,
    })}${columns}</div>`;
  }).join("")}${renderSessionsCurrentTimeIndicator()}`;
  applyCalendarLayout(root, "day");
  scrollCalendarToDate(root, calendarStartDate(root));
  setupSessionsCurrentTimeIndicators(root);
  placeCurrentTime(root);
  setupSessionsNavigators(root);
  bindNavigatorChevrons(root);
  setupSessionsCalendars();
  linkPrimaryNav(root, { selected: "Calendar" });
  setupSessionsStaffHeaders();
  setupSessionsTeamMenus(root);
  setupSessionsSlotMenus(root);
  bindCalendarLayout(root);
  bindMobileMenu(root);
  applySelectedStaff(root);
}

function visibleStaff(root) {
  const menu = root.querySelector("[data-sessions-team-menu]");
  if (!menu) return STAFF;
  const names = new Set(
    [...menu.querySelectorAll("[data-sessions-team-member]")]
      .filter((input) => input.checked)
      .map((input) => input.dataset.sessionsTeamMember),
  );
  const staff = STAFF.filter((person) => names.has(person.name));
  if (staff.length) return staff;
  const you = STAFF.find((person) => person.name === menu.dataset.sessionsTeamYou);
  return you ? [you] : STAFF.slice(0, 1);
}

function renderStaffHeader(staff) {
  return `<div class="calendar-staff">${staff
    .map((person) =>
      renderSessionsStaffHeader({
        name: person.name,
        avatarSrc: person.avatarSrc,
        avatarInitial: person.avatarInitial,
      }),
    )
    .join("")}</div>`;
}

function applySelectedStaff(root) {
  const staff = visibleStaff(root);
  const stage = root.querySelector(".calendar-stage");
  if (stage) stage.style.setProperty("--sessions-staff-count", String(staff.length));
  const header = root.querySelector("#staff-header");
  if (header) header.innerHTML = renderStaffHeader(staff);
  root.querySelectorAll(".calendar-hour").forEach((row) => {
    let index = 0;
    [...row.children].forEach((column) => {
      if (!column.classList.contains("sessions-hour-column")) return;
      column.classList.toggle("is-day-extra", index >= staff.length);
      index += 1;
    });
  });
  const staffDays = root.querySelector("#staff-days");
  if (staffDays && !staffDays.hidden) {
    const stageView = stage?.classList.contains("is-view-week")
      ? "week"
      : stage?.classList.contains("is-view-3day")
        ? "3day"
        : "";
    if (stageView) applyCalendarLayout(root, stageView);
  }
}

function calendarStartDate(root) {
  return (
    root.querySelector("[data-sessions-navigator]")?.dataset.sessionsNavigatorValue ??
    toNavigatorDateValue("2026-08-18")
  );
}

function applyCalendarLayout(root, view) {
  const stage = root.querySelector(".calendar-stage");
  const days = root.querySelector("#calendar-days");
  const staffDays = root.querySelector("#staff-days");
  const isThreeDay = view === "3day";
  const isWeek = view === "week";
  const isStaffDays = isThreeDay || isWeek;
  stage?.classList.toggle("is-view-3day", isThreeDay);
  stage?.classList.toggle("is-view-week", isWeek);
  if (staffDays) staffDays.hidden = !isStaffDays;
  if (isStaffDays) {
    const scroller = root.querySelector(".home-shell__main");
    if (scroller) scroller.scrollTop = 0;
  }
  if (!days) return;
  days.hidden = !isStaffDays;
  if (!isStaffDays) return;
  const selected = calendarStartDate(root);
  days.innerHTML = renderSessionsCalendarDayHeader({
    start: selected,
    selected,
    week: isWeek,
  });
  if (staffDays) {
    staffDays.innerHTML = renderSessionsStaffDayBoard({
      staff: visibleStaff(root),
      start: selected,
      week: isWeek,
    });
  }
}

function setCalendarDate(root, date) {
  const navigator = root.querySelector("[data-sessions-navigator]");
  if (!navigator) return;
  navigator.dataset.sessionsNavigatorValue = date;
  const label = formatNavigatorDate(date);
  const dateLabel = navigator.querySelector("[data-sessions-navigator-date-label]");
  const dateButton = navigator.querySelector("[data-sessions-navigator-date]");
  if (dateLabel) dateLabel.textContent = label;
  dateButton?.setAttribute("aria-label", label);
  navigator.querySelectorAll("[data-sessions-calendar]").forEach((calendar) => {
    applySessionsCalendarSelection(calendar, { rangeStart: date, rangeEnd: null });
  });
  navigator.dispatchEvent(
    new CustomEvent("sessions:navigator-date", { bubbles: true, detail: { date } }),
  );
}

function shiftCalendarDate(root, amount) {
  setCalendarDate(root, addNavigatorDays(calendarStartDate(root), amount));
}

function bindNavigatorChevrons(root) {
  root.addEventListener("click", (event) => {
    if (event.target.closest(".sessions-calendar-header-row__today")) {
      event.preventDefault();
      setCalendarDate(root, toNavigatorDateValue(new Date()));
      return;
    }
    if (event.target.closest("[data-sessions-navigator-previous]")) {
      event.preventDefault();
      shiftCalendarDate(root, -1);
      return;
    }
    if (event.target.closest("[data-sessions-navigator-next]")) {
      event.preventDefault();
      shiftCalendarDate(root, 1);
    }
  });
}

function bindCalendarLayout(root) {
  root.addEventListener("sessions:calendar-view", (event) => {
    applyCalendarLayout(root, event.detail.view);
  });
  root.addEventListener("sessions:team-selection", () => {
    applySelectedStaff(root);
  });
  root.addEventListener("sessions:navigator-date", (event) => {
    const date = event.detail?.date ?? calendarStartDate(root);
    syncMobileDate(root, date);
    const stage = root.querySelector(".calendar-stage");
    const view = stage?.classList.contains("is-view-week")
      ? "week"
      : stage?.classList.contains("is-view-3day")
        ? "3day"
        : "";
    if (view) applyCalendarLayout(root, view);
    scrollCalendarToDate(root, date);
  });
}

function syncMobileDate(root, date) {
  const mobileDate = root.querySelector("[data-sessions-calendar-header-mobile-date]");
  const mobileLabel = root.querySelector("[data-sessions-calendar-header-mobile-date-label]");
  if (!mobileDate) return;
  const mobileText = formatCalendarHeaderMobileDate(date);
  mobileDate.dataset.sessionsCalendarHeaderMobileDateValue = date;
  if (mobileLabel) mobileLabel.textContent = mobileText;
  mobileDate.setAttribute("aria-label", mobileText);
}

function scrollCalendarToDate(root, date) {
  const stage = root.querySelector(".calendar-stage");
  if (stage?.classList.contains("is-view-3day") || stage?.classList.contains("is-view-week")) return;
  const hour = date === toNavigatorDateValue(new Date())
    ? new Date().getHours()
    : OPEN_FROM_HOUR;
  const label = root.querySelector(`[data-sessions-hour-label][data-hour="${hour}"]`);
  const row = label?.closest(".calendar-hour");
  const scroller = root.querySelector(".home-shell__main");
  if (!row || !scroller) return;
  scroller.scrollTop +=
    row.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
}

function placeCurrentTime(root) {
  const indicator = root.querySelector("[data-sessions-current-time]");
  const row = root.querySelector(".calendar-hour");
  if (!indicator || !row) return;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  indicator.style.top = `${(minutes / 60) * row.getBoundingClientRect().height}px`;
  const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
  window.setTimeout(() => placeCurrentTime(root), delay);
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
