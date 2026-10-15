import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
  setupSessionsProfileMenu,
} from "/ds/src/components/navigation/index.js";
import {
  applySessionsCalendarSelection,
  renderSessionsCalendar,
  renderSessionsStackedCalendar,
} from "/ds/src/components/calendar/calendar.js";
import { renderSessionsModal } from "/ds/src/components/modal/modal.js";
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
  parseNavigatorDate,
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
import { bindCalendarClientPicker, renderCalendarClientPicker } from "/src/pages/calendarClientPicker.js";
import { outsideQuarters, SHIFT_TEAM, shiftLabel, shiftOn } from "/src/pages/shiftStore.js";

const STAFF = SHIFT_TEAM;

const navOptions = {
  href: "/",
  ariaLabel: "Sessions home",
};

const OPEN_FROM_HOUR = 9;
const OPEN_UNTIL_HOUR = 18;
const CLOSED_QUARTERS = [0, 15, 30, 45];

function outsideMinutesForHour(name, date, hour) {
  const block = shiftOn(name, date);
  if (!block) {
    if (hour >= OPEN_FROM_HOUR && hour < OPEN_UNTIL_HOUR) return [];
    return CLOSED_QUARTERS;
  }
  return outsideQuarters(block, hour);
}

function paintCalendarHours(root) {
  const staff = visibleStaff(root);
  const date = calendarStartDate(root);
  const hours = root.querySelector("#hour-column");
  if (!hours) return;
  hours.innerHTML = `${Array.from({ length: HOUR_COUNT }, (_, hour) => {
    const columns = Array.from({ length: 7 }, (_, index) => {
      const person = staff[index];
      const column = renderSessionsHourColumn({
        hour,
        outsideMinutes: person ? outsideMinutesForHour(person.name, date, hour) : CLOSED_QUARTERS,
      });
      return index < staff.length
        ? column.replace(
            "data-sessions-hour-column",
            `data-sessions-hour-column data-calendar-staff="${person.name}"`,
          )
        : column.replace("sessions-hour-column", "sessions-hour-column is-day-extra");
    }).join("");
    return `<div class="calendar-hour">${renderSessionsHourLabel({
      hour,
      minute: 0,
    })}${columns}</div>`;
  }).join("")}${renderSessionsCurrentTimeIndicator()}`;
  setupSessionsCurrentTimeIndicators(root);
  placeCurrentTime(root);
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
          <div data-sessions-slot-menu-mount></div>
        </div>
      </div>
      ${renderCalendarDateSheet()}
      ${renderCalendarClientPicker()}
    </div>
  `;
}

function renderCalendarDateSheet() {
  const modal = renderSessionsModal({
    bodyMarkup: `<div data-calendar-date-sheet-body></div>`,
    primaryLabel: "",
    secondaryLabel: "",
  }).replace(
    'role="dialog" aria-modal="true"',
    'role="dialog" aria-modal="true" aria-label="Choose a date"',
  );

  return `<div class="calendar-date-sheet" data-calendar-date-sheet hidden><button class="calendar-date-sheet__scrim" type="button" aria-label="Close"></button>${modal}</div>`;
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
    youName: "Harry Maher",
  });
  root.querySelector("#staff-header").innerHTML = renderStaffHeader(STAFF);
  paintCalendarHours(root);
  applyCalendarLayout(root, "day");
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
  bindMobileDateSheet(root);
  bindCalendarClientPicker(root);
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
  if (stage) {
    stage.style.setProperty("--sessions-staff-count", String(staff.length));
    stage.classList.toggle("is-single-staff", staff.length === 1);
  }
  const header = root.querySelector("#staff-header");
  if (header) header.innerHTML = renderStaffHeader(staff);
  paintCalendarHours(root);
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
  if (!isStaffDays) {
    scrollCalendarToDate(root);
    return;
  }
  const selected = calendarStartDate(root);
  days.innerHTML = renderSessionsCalendarDayHeader({
    start: selected,
    selected,
    week: isWeek,
  });
  if (staffDays) {
    const staff = visibleStaff(root);
    staffDays.innerHTML = renderSessionsStaffDayBoard({
      staff,
      start: selected,
      week: isWeek,
    });
    markShiftDays(staffDays, staff);
  }
}

function markShiftDays(board, staff) {
  [...board.querySelectorAll(".sessions-staff-day")].forEach((row, index) => {
    const person = staff[index];
    if (!person) return;
    row.querySelectorAll("[data-sessions-staff-day]").forEach((cell) => {
      const block = shiftOn(person.name, cell.dataset.sessionsStaffDay);
      if (!block) return;
      cell.classList.toggle("is-closed", block.kind !== "shift");
      cell.querySelector(".calendar-shift-hours")?.remove();
      if (block.kind !== "shift") return;
      const label = document.createElement("span");
      label.className = "calendar-shift-hours";
      label.textContent = shiftLabel(block);
      cell.append(label);
    });
  });
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
    paintCalendarHours(root);
    if (view) applyCalendarLayout(root, view);
    else scrollCalendarToDate(root);
  });
}

function readBookingWhen(root) {
  try {
    const booking = JSON.parse(root.dataset.calendarPendingBooking || "{}");
    return { date: booking.date || "", time: booking.time || "" };
  } catch {
    return { date: "", time: "" };
  }
}

function paintBookingDate(sheet, selected, month, year) {
  const parsed = parseNavigatorDate(selected);
  const body = sheet.querySelector("[data-calendar-date-sheet-body]");
  if (!body) return;
  body.innerHTML = `<h2 class="sessions-modal__title calendar-date-sheet__title">Edit date</h2>${renderSessionsCalendar({
    month: month ?? parsed.getMonth(),
    year: year ?? parsed.getFullYear(),
    rangeStart: selected,
    selection: "single",
  })}`;
}

function paintDateSheet(sheet, selected) {
  const parsed = parseNavigatorDate(selected);
  const body = sheet.querySelector("[data-calendar-date-sheet-body]");
  if (!body) return;
  if (sheet.classList.contains("is-booking")) {
    paintBookingDate(sheet, selected);
    return;
  }
  body.innerHTML = renderSessionsStackedCalendar({
    startMonth: parsed.getMonth(),
    startYear: parsed.getFullYear(),
    rangeStart: selected,
    selection: "single",
  });
}

function shiftBookingMonth(calendar, delta) {
  let months = [];
  try {
    months = JSON.parse(calendar?.dataset.calendarMonths || "[]");
  } catch {
    months = [];
  }
  const current = months[0];
  if (!current) return null;
  const next = new Date(current.year, current.month + delta, 1);
  return { month: next.getMonth(), year: next.getFullYear() };
}

function publishBookingWhen(root, detail) {
  root.dispatchEvent(new CustomEvent("sessions:booking-when", { detail }));
}

function bindMobileDateSheet(root) {
  const sheet = () => root.querySelector("[data-calendar-date-sheet]");
  const dateButton = () => root.querySelector("[data-sessions-calendar-header-mobile-date]");
  let closeToken = 0;

  const finishClose = (modal, token) => {
    if (token !== closeToken) return;
    const booking = modal.classList.contains("is-booking");
    modal.classList.remove("is-closing", "is-booking");
    modal.hidden = true;
    dateButton()?.setAttribute("aria-expanded", "false");
    const bookingDate = root.querySelector("[data-calendar-booking-date]");
    bookingDate?.setAttribute("aria-expanded", "false");
    if (booking) bookingDate?.focus();
    else dateButton()?.focus();
  };

  const closeSheet = () => {
    const modal = sheet();
    if (!modal || modal.hidden) return;
    const token = ++closeToken;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!mobile || reduce || modal.classList.contains("is-closing")) {
      finishClose(modal, token);
      return;
    }
    const panel = modal.querySelector(".sessions-modal");
    modal.classList.add("is-closing");
    panel?.addEventListener(
      "animationend",
      (event) => {
        if (event.target === panel) finishClose(modal, token);
      },
      { once: true },
    );
    window.setTimeout(() => finishClose(modal, token), 400);
  };

  const openSheet = ({ booking = false } = {}) => {
    const modal = sheet();
    if (!modal) return;
    if (!booking && !window.matchMedia("(max-width: 768px)").matches) return;
    closeToken += 1;
    modal.classList.remove("is-closing");
    modal.classList.toggle("is-booking", booking);
    const bookingWhen = booking ? readBookingWhen(root) : null;
    const selected = bookingWhen?.date || calendarStartDate(root);
    paintDateSheet(modal, selected);
    modal.querySelector(".sessions-modal")?.setAttribute("aria-label", booking ? "Edit date" : "Choose a date");
    modal.hidden = false;
    if (booking) root.querySelector("[data-calendar-booking-date]")?.setAttribute("aria-expanded", "true");
    else dateButton()?.setAttribute("aria-expanded", "true");
    modal.querySelector(".sessions-modal__close")?.focus();
  };

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-calendar-booking-date]")) {
      event.preventDefault();
      openSheet({ booking: true });
      return;
    }

    if (event.target.closest("[data-sessions-calendar-header-mobile-date]")) {
      event.preventDefault();
      openSheet();
      return;
    }

    const modal = sheet();
    if (!modal || modal.hidden) return;

    if (event.target.closest(".calendar-date-sheet__scrim, .calendar-date-sheet .sessions-modal__close")) {
      event.preventDefault();
      closeSheet();
      return;
    }

    const nav = event.target.closest(".calendar-date-sheet.is-booking .sessions-calendar__nav");
    if (nav) {
      event.preventDefault();
      const delta = nav.classList.contains("sessions-calendar__nav--next") ? 1 : -1;
      const next = shiftBookingMonth(nav.closest("[data-sessions-calendar]"), delta);
      if (!next) return;
      paintBookingDate(modal, readBookingWhen(root).date || calendarStartDate(root), next.month, next.year);
      return;
    }

    const picked = event.target.closest(".calendar-date-sheet .sessions-date");
    if (!picked || picked.disabled) return;
    const dateKey = picked.dataset.calendarDate;
    if (!dateKey) return;
    if (modal.classList.contains("is-booking")) {
      event.preventDefault();
      publishBookingWhen(root, { date: dateKey });
      closeSheet();
      return;
    }
    setCalendarDate(root, dateKey);
    closeSheet();
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !sheet() || sheet().hidden) return;
    event.stopPropagation();
    closeSheet();
  }, true);

  window.matchMedia("(max-width: 768px)").addEventListener("change", (event) => {
    if (!event.matches) closeSheet();
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

function scrollCalendarToDate(root) {
  const stage = root.querySelector(".calendar-stage");
  if (stage?.classList.contains("is-view-3day") || stage?.classList.contains("is-view-week")) return;
  const hour = new Date().getHours();
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
