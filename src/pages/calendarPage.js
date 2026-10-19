import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
  setupSessionsProfileMenu,
} from "/ds/src/components/navigation/index.js";
import { applySessionsCalendarSelection, renderSessionsCalendar } from "/ds/src/components/calendar/calendar.js";
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
import {
  renderCalendarAppointmentHoverHost,
  renderCalendarAppointmentsLayer,
  setupCalendarAppointmentHovers,
} from "/src/pages/calendarAppointments.js";
import { memberColor, outsideQuarters, SHIFT_TEAM, shiftLabel, shiftOn, tintMemberAvatar } from "/src/pages/shiftStore.js";

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
  const scroller = root.querySelector(".home-shell__main");
  const scrollTop = scroller?.scrollTop ?? 0;
  hours.innerHTML = `${Array.from({ length: HOUR_COUNT }, (_, hour) => {
    const columns = staff.map((person) => {
      const column = renderSessionsHourColumn({
        hour,
        outsideMinutes: outsideMinutesForHour(person.name, date, hour),
      });
      return column
        .replace("<div ", `<div style="--member-color: ${memberColor(person.name)}" `)
        .replace(
          "data-sessions-hour-column",
          `data-sessions-hour-column data-calendar-staff="${person.name}"`,
        );
    }).join("");
    return `<div class="calendar-hour">${renderSessionsHourLabel({
      hour,
      minute: 0,
    })}${columns}</div>`;
  }).join("")}${renderCalendarAppointmentsLayer(staff, date)}${renderSessionsCurrentTimeIndicator()}`;
  if (scroller) {
    scroller.scrollTop = scrollTop;
    scroller.scrollLeft = 0;
  }
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
          ${renderCalendarAppointmentHoverHost()}
          ${renderCalendarDayMenu()}
          ${renderCalendarStaffMenu()}
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

function syncCalendarHeaderLayout(root) {
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  root.querySelector(".sessions-calendar-header-row__layout--desktop")?.toggleAttribute("hidden", mobile);
  root.querySelector(".sessions-calendar-header-row__layout--mobile")?.toggleAttribute("hidden", !mobile);
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
    date: toNavigatorDateValue(new Date()),
  });
  syncCalendarHeaderLayout(root);
  window.matchMedia("(max-width: 768px)").addEventListener("change", () => {
    syncCalendarHeaderLayout(root);
    applySelectedStaff(root);
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
  setupCalendarAppointmentHovers(root);
  bindMobileMenu(root);
  applySelectedStaff(root);
  paintTeamMenuAvatars(root);
}

function paintTeamMenuAvatars(root) {
  root.querySelectorAll("[data-sessions-team-menu]").forEach((menu) => {
    menu.querySelectorAll("[data-sessions-team-member]").forEach((input) => {
      tintMemberAvatar(
        input.closest(".sessions-team-menu__member")?.querySelector(".sessions-avatar"),
        input.dataset.sessionsTeamMember,
      );
    });
    tintMemberAvatar(
      menu.querySelector("[data-sessions-team-filter='you'] .sessions-avatar"),
      menu.dataset.sessionsTeamYou,
    );
  });
}

function visibleTeamMenu(root) {
  const menus = [...root.querySelectorAll("[data-sessions-team-menu]")];
  return menus.find((menu) => menu.getClientRects().length) ?? menus[0];
}

function visibleStaff(root) {
  const menu = visibleTeamMenu(root);
  const limit = (list) =>
    window.matchMedia("(max-width: 768px)").matches ? list.slice(0, 3) : list;
  if (!menu) return limit(STAFF);
  const names = new Set(
    [...menu.querySelectorAll("[data-sessions-team-member]")]
      .filter((input) => input.checked)
      .map((input) => input.dataset.sessionsTeamMember),
  );
  const staff = STAFF.filter((person) => names.has(person.name));
  if (staff.length) return limit(staff);
  const you = STAFF.find((person) => person.name === menu.dataset.sessionsTeamYou);
  return limit(you ? [you] : STAFF.slice(0, 1));
}

function renderStaffHeader(staff) {
  return `<div class="calendar-staff">${staff
    .map((person) =>
      renderSessionsStaffHeader({
        name: person.name,
        avatarSrc: person.avatarSrc,
        avatarInitial: person.avatarInitial,
      }).replace("<div ", `<div style="--member-color: ${memberColor(person.name)}" `),
    )
    .join("")}</div>`;
}

function applySelectedStaff(root) {
  const staff = visibleStaff(root);
  const stage = root.querySelector(".calendar-stage");
  if (stage) stage.style.setProperty("--sessions-staff-count", String(staff.length));
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
    if (stageView) applyCalendarLayout(root, stageView, { keepScroll: true });
  }
}

function calendarStartDate(root) {
  return (
    root.querySelector("[data-sessions-navigator]")?.dataset.sessionsNavigatorValue ??
    toNavigatorDateValue(new Date())
  );
}

function applyCalendarLayout(root, view, { keepScroll = false } = {}) {
  const stage = root.querySelector(".calendar-stage");
  const days = root.querySelector("#calendar-days");
  const staffDays = root.querySelector("#staff-days");
  const isThreeDay = view === "3day";
  const isWeek = view === "week";
  const isStaffDays = isThreeDay || isWeek;
  stage?.classList.toggle("is-view-3day", isThreeDay);
  stage?.classList.toggle("is-view-week", isWeek);
  if (staffDays) staffDays.hidden = !isStaffDays;
  if (isStaffDays && !keepScroll) {
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
    markShiftDays(staffDays, staff, selected);
  }
}

function markShiftDays(board, staff, selected) {
  [...board.querySelectorAll(".sessions-staff-day")].forEach((row, index) => {
    const person = staff[index];
    if (!person) return;
    row.dataset.calendarStaff = person.name;
    row.style.setProperty("--member-color", memberColor(person.name));
    row.querySelectorAll("[data-sessions-staff-day]").forEach((cell) => {
      cell.classList.toggle("is-selected", cell.dataset.sessionsStaffDay === selected);
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

function openCalendarDay(root, date) {
  setCalendarDate(root, date);
  root.querySelector('[data-sessions-calendar-view-option="day"]')?.click();
}

function formatDayMenuTitle(value) {
  const date = parseNavigatorDate(value);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday}, ${date.getDate()} ${month}`;
}

function renderCalendarDayMenu() {
  return `<div class="calendar-day-menu" data-calendar-day-menu hidden><div class="sessions-menu-panel"><div class="calendar-day-menu__title"><span data-calendar-day-menu-title></span><button type="button" data-calendar-day-menu-close aria-label="Close"><img src="/assets/IconClose.svg" width="20" height="20" alt=""></button></div><hr class="sessions-menu-panel__divider" aria-hidden="true"><button class="sessions-menu-item" type="button" data-calendar-day-menu-action="appointment"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.75" y="4.25" width="14.5" height="13" rx="1.5" stroke="currentColor" stroke-width="1.25"/><path d="M2.75 8.25h14.5M6.5 2.75v3M13.5 2.75v3" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg><span class="sessions-menu-item__label">Add appointment</span></button><button class="sessions-menu-item" type="button" data-calendar-day-menu-action="blocked"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.75" y="4.25" width="14.5" height="13" rx="1.5" stroke="currentColor" stroke-width="1.25"/><path d="M2.75 8.25h14.5M6.5 2.75v3M13.5 2.75v3M8.1 12.1l3.8 3.8M11.9 12.1l-3.8 3.8" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg><span class="sessions-menu-item__label">Add blocked time</span></button><button class="sessions-menu-item" type="button" data-calendar-day-menu-action="day"><img src="/assets/IconDay.svg" width="20" height="20" alt=""><span class="sessions-menu-item__label">Day view</span></button></div></div>`;
}

function renderCalendarStaffMenu() {
  return `<div class="calendar-staff-menu" data-calendar-staff-menu hidden><div class="sessions-menu-panel"><button class="sessions-menu-item" type="button" data-calendar-staff-menu-action="day"><img src="/assets/IconDay.svg" width="20" height="20" alt=""><span class="sessions-menu-item__label">Day view</span></button><button class="sessions-menu-item" type="button" data-calendar-staff-menu-action="3day"><img src="/assets/Icon3Day.svg" width="20" height="20" alt=""><span class="sessions-menu-item__label">3 day view</span></button><button class="sessions-menu-item" type="button" data-calendar-staff-menu-action="week"><img src="/assets/IconWeek.svg" width="20" height="20" alt=""><span class="sessions-menu-item__label">Week view</span></button><hr class="sessions-menu-panel__divider" aria-hidden="true"><p class="calendar-staff-menu__heading">Actions</p><button class="sessions-menu-item" type="button" data-calendar-staff-menu-action="appointment"><span class="sessions-menu-item__label">Add appointment</span></button><button class="sessions-menu-item" type="button" data-calendar-staff-menu-action="blocked"><span class="sessions-menu-item__label">Add blocked time</span></button><button class="sessions-menu-item" type="button" data-calendar-staff-menu-action="time-off"><span class="sessions-menu-item__label">Add time off</span></button><button class="sessions-menu-item" type="button" data-calendar-staff-menu-action="member"><span class="sessions-menu-item__label">View team member</span></button></div></div>`;
}

function closeDayMenu(root) {
  const menu = root.querySelector("[data-calendar-day-menu]");
  if (menu) menu.hidden = true;
}

function closeStaffMenu(root) {
  const menu = root.querySelector("[data-calendar-staff-menu]");
  if (menu) menu.hidden = true;
}

function placeMenu(menu, x, y) {
  menu.hidden = false;
  const panel = menu.querySelector(".sessions-menu-panel");
  const width = panel?.offsetWidth || 320;
  const height = panel?.offsetHeight || 280;
  menu.style.left = `${Math.min(Math.max(8, x), window.innerWidth - width - 8)}px`;
  menu.style.top = `${Math.min(Math.max(8, y + 8), window.innerHeight - height - 8)}px`;
}

function openStaffMenu(root, { staffName, x, y }) {
  const menu = root.querySelector("[data-calendar-staff-menu]");
  if (!menu) return;
  menu.dataset.staff = staffName;
  placeMenu(menu, x, y);
}

function openDayMenu(root, { date, staffName, x, y }) {
  const menu = root.querySelector("[data-calendar-day-menu]");
  if (!menu) return;
  menu.dataset.date = date;
  menu.dataset.staff = staffName;
  const title = menu.querySelector("[data-calendar-day-menu-title]");
  if (title) title.textContent = formatDayMenuTitle(date);
  closeStaffMenu(root);
  placeMenu(menu, x, y);
}

function bindCalendarLayout(root) {
  root.addEventListener("click", (event) => {
    const menu = root.querySelector("[data-calendar-day-menu]");
    if (event.target.closest("[data-calendar-day-menu-close]")) {
      event.preventDefault();
      closeDayMenu(root);
      return;
    }
    const actionEl = event.target.closest("[data-calendar-day-menu-action]");
    if (actionEl && menu) {
      event.preventDefault();
      const date = menu.dataset.date;
      const staffName = menu.dataset.staff || "";
      const action = actionEl.dataset.calendarDayMenuAction;
      closeDayMenu(root);
      if (action === "day" && date) openCalendarDay(root, date);
      if (action === "appointment" && date) {
        root.dispatchEvent(
          new CustomEvent("sessions:slot-booking", {
            bubbles: true,
            detail: { action: "appointment", date, staffName },
          }),
        );
      }
      return;
    }
    if (event.target.closest("[data-calendar-day-menu]")) return;

    const staffMenu = root.querySelector("[data-calendar-staff-menu]");
    const staffAction = event.target.closest("[data-calendar-staff-menu-action]");
    if (staffAction && staffMenu) {
      event.preventDefault();
      const staffName = staffMenu.dataset.staff || "";
      const action = staffAction.dataset.calendarStaffMenuAction;
      closeStaffMenu(root);
      if (action === "day" || action === "3day" || action === "week") {
        root.querySelector(`[data-sessions-calendar-view-option="${action}"]`)?.click();
      }
      if (action === "appointment") {
        root.dispatchEvent(
          new CustomEvent("sessions:slot-booking", {
            bubbles: true,
            detail: { action: "appointment", date: calendarStartDate(root), staffName },
          }),
        );
      }
      if (action === "member") window.location.assign("/team");
      return;
    }
    if (event.target.closest("[data-calendar-staff-menu]")) return;

    const stage = root.querySelector(".calendar-stage");
    const staffLabel = event.target.closest(".sessions-staff-day__label");
    const staffBoard = stage?.classList.contains("is-view-3day") || stage?.classList.contains("is-view-week");
    if (staffBoard && staffLabel) {
      event.preventDefault();
      closeDayMenu(root);
      openStaffMenu(root, {
        staffName:
          staffLabel.closest(".sessions-staff-day")?.dataset.calendarStaff ||
          staffLabel.querySelector(".sessions-staff-day__name")?.textContent ||
          "",
        x: event.clientX,
        y: event.clientY,
      });
      return;
    }
    const headerDay = event.target.closest("[data-sessions-calendar-day]");
    const columnDay = event.target.closest("[data-sessions-staff-day]");
    if (stage?.classList.contains("is-view-3day") && headerDay?.dataset.sessionsCalendarDay) {
      event.preventDefault();
      closeDayMenu(root);
      closeStaffMenu(root);
      openCalendarDay(root, headerDay.dataset.sessionsCalendarDay);
      return;
    }
    if (stage?.classList.contains("is-view-3day") && columnDay?.dataset.sessionsStaffDay) {
      event.preventDefault();
      openDayMenu(root, {
        date: columnDay.dataset.sessionsStaffDay,
        staffName: columnDay.closest(".sessions-staff-day")?.dataset.calendarStaff || "",
        x: event.clientX,
        y: event.clientY,
      });
      return;
    }
    const weekDate = headerDay?.dataset.sessionsCalendarDay || columnDay?.dataset.sessionsStaffDay;
    if (stage?.classList.contains("is-view-week") && weekDate) {
      event.preventDefault();
      closeDayMenu(root);
      closeStaffMenu(root);
      openCalendarDay(root, weekDate);
      return;
    }
    closeDayMenu(root);
    closeStaffMenu(root);
  });
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeDayMenu(root);
    closeStaffMenu(root);
  });
  root.querySelector(".home-shell__main")?.addEventListener("scroll", () => {
    closeDayMenu(root);
    closeStaffMenu(root);
  });
  root.addEventListener("sessions:calendar-view", (event) => {
    applyCalendarLayout(root, event.detail.view);
  });
  root.addEventListener("sessions:team-selection", () => {
    applySelectedStaff(root);
  });
  root.addEventListener("sessions:appointments-changed", () => {
    paintCalendarHours(root);
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

function paintMonth(sheet, selected, month, year) {
  const parsed = parseNavigatorDate(selected);
  const body = sheet.querySelector("[data-calendar-date-sheet-body]");
  if (!body) return;
  const title = sheet.classList.contains("is-booking")
    ? `<h2 class="sessions-modal__title calendar-date-sheet__title">Edit date</h2>`
    : "";
  body.innerHTML = `${title}${renderSessionsCalendar({
    month: month ?? parsed.getMonth(),
    year: year ?? parsed.getFullYear(),
    rangeStart: selected,
    selection: "single",
  })}`;
}

function paintDateSheet(sheet, selected) {
  paintMonth(sheet, selected);
}

function shiftVisibleMonth(calendar, delta) {
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

    const nav = event.target.closest(".calendar-date-sheet:not(.calendar-slot-sheet) .sessions-calendar__nav");
    if (nav) {
      event.preventDefault();
      const delta = nav.classList.contains("sessions-calendar__nav--next") ? 1 : -1;
      const next = shiftVisibleMonth(nav.closest("[data-sessions-calendar]"), delta);
      if (!next) return;
      const selected = modal.classList.contains("is-booking")
        ? readBookingWhen(root).date || calendarStartDate(root)
        : calendarStartDate(root);
      paintMonth(modal, selected, next.month, next.year);
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
