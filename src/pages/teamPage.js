import { renderSessionsAvatar } from "/ds/src/components/avatar/avatar.js";
import { renderPrimaryButton, renderSecondaryButton, renderSessionsButton } from "/ds/src/components/button/button.js";
import { renderSessionsChip } from "/ds/src/components/chip/chip.js";
import { escapeHtml } from "/ds/src/utils.js";
import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
  setupSessionsProfileMenu,
} from "/ds/src/components/navigation/index.js";
import { renderSessionsMenuItem } from "/ds/src/components/menu/item.js";
import { renderSessionsMenuPanel } from "/ds/src/components/menu/panel.js";
import { renderSessionsModal } from "/ds/src/components/modal/modal.js";
import { renderSessionsFilterBar, setupSessionsFilterBars } from "/ds/src/components/patterns/filterBar.js";
import { renderSessionsFooter } from "/ds/src/components/patterns/footer.js";
import { renderSessionsTeamList, setupSessionsTeamLists } from "/ds/src/components/rows/teamMemberRow.js";
import { renderPageTitle, renderPageWrapper } from "/src/components/pageWrapper.js";
import { linkPrimaryNav } from "/src/components/primaryNav.js";
import { loadShiftWeek, shiftLabel, writeShiftDay } from "/src/pages/shiftStore.js";

const navOptions = {
  href: "/",
  ariaLabel: "Sessions home",
};

const TEAM = [
  {
    name: "Harry Maher",
    email: "harry@sessions.com",
    phone: "+61 461 455 500",
    role: "Workspace Owner",
    avatarSrc: "/assets/user.png",
  },
  {
    name: "Kale Emery",
    email: "kale@sessions.com",
    phone: "+61 461 455 500",
    role: "No Access",
    avatarInitial: "K",
  },
  {
    name: "Connor Braddock",
    email: "connor@sessions.com",
    phone: "+61 461 455 500",
    role: "No Access",
    avatarInitial: "C",
  },
];

const TEAM_SORTS = [
  { value: "custom", label: "Custom order" },
  { value: "name-az", label: "Name (A-Z)" },
  { value: "name-za", label: "Name (Z-A)" },
];

const VIEW_COPY = {
  members: {
    title: "Team members",
    body: "View, add, edit and delete your team's details.",
  },
  shifts: {
    title: "Scheduled shifts",
    body: "Set when your team can be booked.",
  },
};

const DAY_HOURS = ["18h", "18h", "18h", "18h", "18h", "18h", "0h"];
const MEMBER_HOURS = {
  "Harry Maher": "90h",
  "Kale Emery": "90h",
  "Connor Braddock": "108h",
};
const SHIFT_COPY = {
  "time-off": "Time Off",
  closed: "Not working",
};
const SHIFT_ACTIONS = [
  { value: "edit-day", label: "Edit this day" },
  { value: "time-off", label: "Add time off" },
  { value: "delete", label: "Delete this shift" },
];

function renderTeamHeader() {
  return renderPageTitle({
    title: VIEW_COPY.members.title,
    body: VIEW_COPY.members.body,
    titleExtra: renderSessionsChip({ label: String(TEAM.length), className: "sessions-chip--count" }),
    actions: `${renderSecondaryButton({ label: "Shifts" }).replace("<button ", '<button data-team-view-toggle ')}${renderPrimaryButton({ label: "Add", icon: "plus" })}`,
  });
}

function weekDates(from = new Date()) {
  const monday = new Date(from);
  monday.setHours(12, 0, 0, 0);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function formatDay(date) {
  const weekday = date.toLocaleDateString("en-AU", { weekday: "short" });
  const month = date.toLocaleDateString("en-AU", { month: "short" });
  return `${weekday}, ${month} ${date.getDate()}`;
}

function shiftButton(block, index) {
  if (block?.kind === "shift") {
    return `<div class="team-shifts__cell" data-shift-day="${index}" data-shift-start="${block.start}" data-shift-end="${block.end}"><button class="team-shifts__shift" type="button" aria-haspopup="menu" aria-expanded="false">${shiftLabel(block)}</button></div>`;
  }
  if (block?.kind === "time-off") {
    const times = block.start == null ? "" : ` data-shift-start="${block.start}" data-shift-end="${block.end}"`;
    return `<div class="team-shifts__cell" data-shift-day="${index}"${times}><button class="team-shifts__shift team-shifts__shift--idle" type="button" aria-haspopup="menu" aria-expanded="false">${SHIFT_COPY["time-off"]}</button></div>`;
  }
  return `<div class="team-shifts__cell" data-shift-day="${index}"><button class="team-shifts__shift team-shifts__shift--idle" type="button" aria-haspopup="menu" aria-expanded="false">${SHIFT_COPY.closed}</button></div>`;
}

function renderShiftCell(block, index) {
  return shiftButton(block, index);
}

function renderShiftRow(member) {
  const avatar = renderSessionsAvatar({
    src: member.avatarSrc,
    name: member.name,
    initial: member.avatarInitial || member.name,
    size: "small",
  });
  const shifts = (loadShiftWeek()[member.name] || []).map((block, index) => renderShiftCell(block, index)).join("");
  return `<div class="team-shifts__row" data-shift-member="${escapeHtml(member.name)}"><div class="sessions-list__person team-shifts__member"><div class="team-shifts__member-card">${avatar}<div class="team-shifts__who"><p class="sessions-team-list__name">${escapeHtml(member.name)}</p><p class="team-shifts__total">${MEMBER_HOURS[member.name] || ""}</p></div><button class="team-shifts__edit" type="button" aria-label="Edit shifts"><img src="/assets/IconEdit.svg" width="20" height="20" alt="" /></button></div></div>${shifts}</div>`;
}

function renderShiftMenu() {
  const items = SHIFT_ACTIONS.map((item) =>
    renderSessionsMenuItem({
      icon: "",
      label: item.label,
      className: "team-shifts__option",
      attributes: { "data-shift-action": item.value },
    }),
  ).join("");
  const sheet = `<div class="sessions-team-sheet team-shifts__sheet"><button class="sessions-team-sheet__close" type="button" aria-label="Close"><img src="/assets/IconClose.svg" width="24" height="24" alt="" /></button><div class="team-shifts__sheet-avatar"></div><p class="sessions-team-sheet__name"></p><p class="sessions-team-sheet__date"></p></div>`;
  return `<div class="team-shifts__menu" hidden><button class="sessions-team-sheet__scrim" type="button" aria-label="Close"></button>${renderSessionsMenuPanel({ children: `${sheet}${items}` })}</div>`;
}

const SHIFT_STEP = 15;
const SHIFT_OPEN = 10 * 60;
const SHIFT_CLOSE = 19 * 60;

function clockLabel(minutes) {
  const hour = Math.floor(minutes / 60);
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}

function durationLabel(start, end) {
  let delta = end - start;
  if (delta < 0) delta += 24 * 60;
  const hours = Math.floor(delta / 60);
  const mins = delta % 60;
  if (hours && mins) return `${hours}hr ${mins}min`;
  if (hours) return `${hours}hr`;
  return `${mins}min`;
}

function parseClock(text) {
  const match = String(text).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(match[2] || 0);
}

function readShiftTimes(cell) {
  if (cell.dataset.shiftStart && cell.dataset.shiftEnd) {
    return { start: Number(cell.dataset.shiftStart), end: Number(cell.dataset.shiftEnd) };
  }
  const [rawStart, rawEnd] = (cell.querySelector(".team-shifts__shift")?.textContent || "").split(" - ");
  const start = parseClock(rawStart);
  const end = parseClock(rawEnd);
  if (start == null || end == null) return { start: SHIFT_OPEN, end: SHIFT_CLOSE };
  return { start, end };
}

function renderTimeSelect(name, label) {
  const options = Array.from({ length: (24 * 60) / SHIFT_STEP }, (_, index) => {
    const minutes = index * SHIFT_STEP;
    return `<button class="team-shift-edit__time-option" type="button" role="option" data-minutes="${minutes}" aria-selected="false">${clockLabel(minutes)}</button>`;
  }).join("");
  return `<div class="team-shift-edit__time" data-shift-time="${name}"><span class="sessions-input__label">${label}</span><button class="team-shift-edit__time-button" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="team-shift-edit__time-value">${clockLabel(SHIFT_OPEN)}</span></button><input type="hidden" name="${name}" value="${SHIFT_OPEN}" /><div class="team-shift-edit__time-list" role="listbox" hidden>${options}</div></div>`;
}

function renderShiftEdit() {
  const fields = `<h3 class="sessions-modal__title" id="sessions-modal-title-shift" data-shift-edit-title></h3><p class="sessions-modal__body" data-shift-edit-body>You are editing this day’s shifts only.</p><div class="team-shift-edit__times">${renderTimeSelect("start", "Start time")}${renderTimeSelect("end", "End time")}</div><p class="team-shift-edit__duration"><span data-shift-edit-duration-label>Total shift duration:</span> <span data-shift-edit-duration>9hr</span></p>`;
  const modal = renderSessionsModal({
    title: "Shift",
    bodyMarkup: fields,
    primaryLabel: "Save",
    secondaryLabel: "Cancel",
  }).replace(
    '<div class="sessions-modal__actions">',
    `<div class="sessions-modal__actions">${renderSessionsButton({ variant: "secondary", icon: "trash", ariaLabel: "Delete this shift", className: "team-shift-edit__delete" })}`,
  );
  return `<div class="team-shift-edit" hidden><button class="team-shift-edit__scrim" type="button" aria-label="Close"></button>${modal}</div>`;
}

function renderShifts() {
  const days = weekDates();
  const headings = days
    .map((date, index) => `<span class="team-shifts__day">${formatDay(date)}<span class="team-shifts__hours">${DAY_HOURS[index]}</span></span>`)
    .join("");

  return `<div class="team-shifts" data-team-panel="shifts" hidden><div class="team-shifts__scroll"><div class="team-shifts__grid" style="--team-shift-days: ${days.length}"><div class="team-shifts__row team-shifts__head"><span></span>${headings}</div><div class="team-shifts__body">${TEAM.map((member) => renderShiftRow(member)).join("")}</div></div></div>${renderShiftMenu()}</div>`;
}

function renderShiftToast() {
  return `<div class="team-toast" role="status" aria-live="polite" aria-hidden="true"><p class="team-toast__label">Working hours updated</p><button class="team-toast__close" type="button" aria-label="Dismiss"></button></div>`;
}

export function renderTeamPage() {
  return `
    <div class="home-shell">
      <div id="mobile-nav" class="home-shell__mobile"></div>
      <div id="top-nav" class="home-shell__desktop"></div>
      <div class="home-shell__body">
        <div class="home-shell__rail" id="rail"></div>
        <main class="home-shell__main">
          ${renderPageWrapper({
            content: `<div class="team-page" data-team-view="members">${renderTeamHeader()}<div data-team-panel="members">${renderSessionsFilterBar({
              placeholder: "Search team members",
              name: "team-search",
              sortLabel: "Custom order",
              sortOptions: TEAM_SORTS,
            })}${renderSessionsTeamList({ rows: TEAM })}</div>${renderShifts()}</div>`,
          })}
        </main>
      </div>
      ${renderSessionsFooter()}
      ${renderShiftEdit()}
      ${renderShiftToast()}
    </div>
  `;
}

export function mountTeamPage(root) {
  root.innerHTML = renderTeamPage();
  root.querySelector("#top-nav").innerHTML = renderTopNav(navOptions);
  setupSessionsProfileMenu(root);
  root.querySelector("#rail").innerHTML = renderSessionsLeftRail({
    selected: "team",
  });
  root.querySelector("#mobile-nav").innerHTML = renderMobileMenu(navOptions);
  bindMobileMenu(root);
  linkPrimaryNav(root, { selected: "Team" });
  setupSessionsTeamLists(root);
  setupSessionsFilterBars(root);
  bindTeamSort(root);
  bindTeamView(root);
  bindShiftMenu(root);
  bindShiftToast(root);
}

function bindTeamSort(root) {
  const list = root.querySelector(".sessions-team-list");
  if (!list) return;
  list.querySelectorAll(".sessions-team-list__row:not(.sessions-team-list__head)").forEach((row, index) => {
    row.dataset.teamOrder = String(index);
  });
  root.addEventListener("sessions:filter-sort", (event) => {
    const value = event.detail?.value;
    const rows = [...list.querySelectorAll(".sessions-team-list__row:not(.sessions-team-list__head)")];
    const nameOf = (row) => row.querySelector(".sessions-team-list__name")?.textContent ?? "";
    rows.sort((a, b) => {
      if (value === "name-az" || value === "name-za") {
        const delta = nameOf(a).localeCompare(nameOf(b));
        return value === "name-za" ? -delta : delta;
      }
      return Number(a.dataset.teamOrder) - Number(b.dataset.teamOrder);
    });
    rows.forEach((row) => list.appendChild(row));
  });
}

function showTeamView(page, view) {
  const copy = VIEW_COPY[view] ?? VIEW_COPY.members;
  page.dataset.teamView = copy === VIEW_COPY.shifts ? "shifts" : "members";
  page.querySelectorAll("[data-team-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.teamPanel !== page.dataset.teamView;
  });
  page.querySelector(".sessions-page-header__title").textContent = copy.title;
  page.querySelector(".sessions-page-header__body").textContent = copy.body;
  const toggle = page.querySelector("[data-team-view-toggle] .sessions-button__label");
  if (toggle) toggle.textContent = page.dataset.teamView === "shifts" ? "Team" : "Shifts";
  closeShiftMenu(page);
  closeShiftEdit();
}

function bindTeamView(root) {
  const page = root.querySelector(".team-page");
  page.addEventListener("click", (event) => {
    if (!event.target.closest("[data-team-view-toggle]")) return;
    showTeamView(page, page.dataset.teamView === "shifts" ? "members" : "shifts");
  });
  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-sessions-team-action='shifts']")) showTeamView(page, "shifts");
    const timeOff = event.target.closest("[data-sessions-team-action='time-off']");
    if (!timeOff) return;
    const name = timeOff.closest(".sessions-team-list__row")?.querySelector(".sessions-team-list__name")?.textContent?.trim();
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const index = weekDates().findIndex((date) => date.toDateString() === today.toDateString());
    const cell = page.querySelector(`[data-shift-member="${CSS.escape(name || "")}"] [data-shift-day="${index}"]`);
    showTeamView(page, "shifts");
    if (cell) openShiftEdit(cell, "time-off");
  });
}

function showShiftToast() {
  const toast = document.querySelector(".team-toast");
  if (!toast) return;
  toast.classList.add("is-visible");
  toast.setAttribute("aria-hidden", "false");
  window.clearTimeout(showShiftToast.timer);
  showShiftToast.timer = window.setTimeout(hideShiftToast, 4000);
}

function hideShiftToast() {
  const toast = document.querySelector(".team-toast");
  if (!toast) return;
  window.clearTimeout(showShiftToast.timer);
  toast.classList.remove("is-visible");
  toast.setAttribute("aria-hidden", "true");
}

function bindShiftToast(root) {
  root.querySelector(".team-toast__close")?.addEventListener("click", hideShiftToast);
}

function bindShiftMenu(root) {
  const page = root.querySelector(".team-page");
  page.addEventListener("click", (event) => {
    const cell = event.target.closest(".team-shifts__cell");
    if (cell) {
      event.preventDefault();
      const menu = page.querySelector(".team-shifts__menu");
      if (cell === shiftMenuCell && menu && !menu.hidden && !menu.classList.contains("is-closing")) {
        closeShiftMenu(page);
        return;
      }
      openShiftMenu(cell);
      return;
    }
    if (event.target.closest(".sessions-team-sheet__close, .team-shifts__menu .sessions-team-sheet__scrim")) {
      event.preventDefault();
      closeShiftMenu(page);
      return;
    }
    const action = event.target.closest("[data-shift-action]");
    if (action) {
      event.preventDefault();
      const cell = shiftMenuCell;
      closeShiftMenu(page);
      if (action.dataset.shiftAction === "edit-day" && cell) openShiftEdit(cell);
      if (action.dataset.shiftAction === "time-off" && cell) openShiftEdit(cell, "time-off");
      if (action.dataset.shiftAction === "delete" && cell) commitShift(cell, { kind: "closed" });
      return;
    }
    if (event.target.closest(".team-shifts__menu .sessions-menu-panel")) return;
    closeShiftMenu(page);
  });
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const edit = root.querySelector(".team-shift-edit");
    if (edit && !edit.hidden) {
      const openList = edit.querySelector(".team-shift-edit__time-list:not([hidden])");
      if (openList) closeTimeLists(edit);
      else closeShiftEdit();
    } else closeShiftMenu(page);
  });
  bindShiftEdit(root);
  page.querySelector(".team-shifts__scroll")?.addEventListener("scroll", () => closeShiftMenu(page));
  window.matchMedia("(max-width: 768px)").addEventListener("change", () => closeShiftMenu(page));
}

let shiftMenuCell = null;

function shiftMenuMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function sheetDate(date) {
  const day = date.getDate();
  const teen = day % 100;
  const suffix = teen >= 11 && teen <= 13 ? "th" : { 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th";
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday} ${month} ${day}${suffix}`;
}

function syncShiftSheetClass() {
  const menu = document.querySelector(".team-shifts__menu");
  const shiftOpen = menu && !menu.hidden;
  const teamOpen = document.querySelector("[data-sessions-team-actions].is-open");
  document.body.classList.toggle("is-team-sheet-open", shiftMenuMobile() && Boolean(shiftOpen || teamOpen));
}

function finishShiftMenuClose(menu) {
  if (!menu.classList.contains("is-closing")) return;
  menu.classList.remove("is-closing");
  menu.hidden = true;
  shiftMenuCell?.classList.remove("is-open");
  shiftMenuCell?.querySelector(".team-shifts__shift")?.setAttribute("aria-expanded", "false");
  shiftMenuCell = null;
  syncShiftSheetClass();
}

function closeShiftMenu(page = document) {
  const menu = page.querySelector?.(".team-shifts__menu") || document.querySelector(".team-shifts__menu");
  if (!menu || menu.hidden || menu.classList.contains("is-closing")) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (shiftMenuMobile() && !reduce) {
    const panel = menu.querySelector(".sessions-menu-panel");
    menu.classList.add("is-closing");
    panel?.addEventListener(
      "animationend",
      (event) => {
        if (event.target === panel) finishShiftMenuClose(menu);
      },
      { once: true },
    );
    window.setTimeout(() => finishShiftMenuClose(menu), 400);
    return;
  }
  menu.hidden = true;
  shiftMenuCell?.classList.remove("is-open");
  shiftMenuCell?.querySelector(".team-shifts__shift")?.setAttribute("aria-expanded", "false");
  shiftMenuCell = null;
  syncShiftSheetClass();
}

function placeShiftMenu(menu, cell) {
  const panel = menu.querySelector(".sessions-menu-panel");
  panel.style.top = "";
  panel.style.left = "";
  if (shiftMenuMobile()) return;
  const rect = cell.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  let top = rect.bottom + 8;
  let left = rect.left;
  if (left + panelRect.width > window.innerWidth - 8) left = window.innerWidth - 8 - panelRect.width;
  if (top + panelRect.height > window.innerHeight - 8) top = Math.max(8, rect.top - panelRect.height - 8);
  panel.style.top = `${top}px`;
  panel.style.left = `${Math.max(8, left)}px`;
}

function openShiftMenu(cell) {
  const menu = document.querySelector(".team-shifts__menu");
  const row = cell.closest("[data-shift-member]");
  const member = TEAM.find((person) => person.name === row?.dataset.shiftMember);
  const sheet = menu.querySelector(".sessions-team-sheet");
  sheet.querySelector(".team-shifts__sheet-avatar").innerHTML = renderSessionsAvatar({
    src: member?.avatarSrc,
    name: member?.name || "",
    initial: member?.avatarInitial || member?.name || "",
    size: "medium",
  });
  sheet.querySelector(".sessions-team-sheet__name").textContent = member?.name || "";
  sheet.querySelector(".sessions-team-sheet__date").textContent = sheetDate(weekDates()[Number(cell.dataset.shiftDay)]);
  if (shiftMenuCell && shiftMenuCell !== cell) {
    shiftMenuCell.classList.remove("is-open");
    shiftMenuCell.querySelector(".team-shifts__shift")?.setAttribute("aria-expanded", "false");
  }
  shiftMenuCell = cell;
  cell.classList.add("is-open");
  cell.querySelector(".team-shifts__shift")?.setAttribute("aria-expanded", "true");
  menu.classList.remove("is-closing");
  menu.hidden = false;
  placeShiftMenu(menu, cell);
  syncShiftSheetClass();
}

let shiftEditCell = null;

function paintShiftDuration(host) {
  const start = Number(host.querySelector('[name="start"]').value);
  const end = Number(host.querySelector('[name="end"]').value);
  host.querySelector("[data-shift-edit-duration]").textContent = durationLabel(start, end);
}

function closeTimeLists(host) {
  host.querySelectorAll(".team-shift-edit__time-list").forEach((list) => {
    list.hidden = true;
  });
  host.querySelectorAll(".team-shift-edit__time-button").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function setShiftTime(host, name, minutes) {
  const field = host.querySelector(`[data-shift-time="${name}"]`);
  field.querySelector("input").value = String(minutes);
  field.querySelector(".team-shift-edit__time-value").textContent = clockLabel(minutes);
  field.querySelectorAll(".team-shift-edit__time-option").forEach((option) => {
    option.setAttribute("aria-selected", option.dataset.minutes === String(minutes) ? "true" : "false");
  });
}

function openShiftEdit(cell, mode = "shift") {
  const host = document.querySelector(".team-shift-edit");
  const timeOff = mode === "time-off";
  const name = cell.closest("[data-shift-member]")?.dataset.shiftMember || "";
  const date = weekDates()[Number(cell.dataset.shiftDay)];
  host.classList.toggle("is-time-off", timeOff);
  host.dataset.shiftEditMode = timeOff ? "time-off" : "shift";
  host.querySelector("[data-shift-edit-title]").textContent = `${name}’s ${timeOff ? "time off" : "shift"} ${formatDay(date)}`;
  host.querySelector("[data-shift-edit-body]").textContent = timeOff
    ? "You are adding time off for this day only."
    : "You are editing this day’s shifts only.";
  host.querySelector("[data-shift-edit-duration-label]").textContent = timeOff ? "Total time off:" : "Total shift duration:";
  const { start, end } = readShiftTimes(cell);
  closeTimeLists(host);
  setShiftTime(host, "start", start);
  setShiftTime(host, "end", end);
  paintShiftDuration(host);
  shiftEditCell = cell;
  host.hidden = false;
}

function closeShiftEdit() {
  const host = document.querySelector(".team-shift-edit");
  if (!host || host.hidden) return;
  closeTimeLists(host);
  host.hidden = true;
  shiftEditCell = null;
}

function commitShift(cell, block) {
  const name = cell.closest("[data-shift-member]")?.dataset.shiftMember;
  if (!name) return;
  writeShiftDay(name, Number(cell.dataset.shiftDay), block);
  const fresh = document.createElement("div");
  fresh.innerHTML = shiftButton(block, Number(cell.dataset.shiftDay));
  cell.replaceWith(fresh.firstElementChild);
  showShiftToast();
}

function applyShiftEdit(kind) {
  const host = document.querySelector(".team-shift-edit");
  if (shiftEditCell && kind === "save") {
    const start = Number(host.querySelector('[name="start"]').value);
    const end = Number(host.querySelector('[name="end"]').value);
    const kind = host.dataset.shiftEditMode === "time-off" ? "time-off" : "shift";
    commitShift(shiftEditCell, { kind, start, end });
    shiftEditCell = null;
  }
  if (shiftEditCell && kind === "delete") {
    commitShift(shiftEditCell, { kind: "closed" });
    shiftEditCell = null;
  }
  closeShiftEdit();
}

function bindShiftEdit(root) {
  const host = root.querySelector(".team-shift-edit");
  host.addEventListener("click", (event) => {
    const option = event.target.closest(".team-shift-edit__time-option");
    if (option) {
      const field = option.closest(".team-shift-edit__time");
      setShiftTime(host, field.dataset.shiftTime, Number(option.dataset.minutes));
      closeTimeLists(host);
      paintShiftDuration(host);
      return;
    }
    const button = event.target.closest(".team-shift-edit__time-button");
    if (button) {
      const list = button.parentElement.querySelector(".team-shift-edit__time-list");
      const opening = list.hidden;
      closeTimeLists(host);
      if (opening) {
        list.hidden = false;
        button.setAttribute("aria-expanded", "true");
        const selected = list.querySelector('[aria-selected="true"]');
        if (selected) list.scrollTop = Math.max(0, selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2);
      }
      return;
    }
    if (event.target.closest(".team-shift-edit__scrim, .sessions-modal__close, .sessions-modal__actions .sessions-button--secondary")) {
      event.preventDefault();
      closeShiftEdit();
      return;
    }
    if (event.target.closest(".team-shift-edit__delete")) {
      event.preventDefault();
      applyShiftEdit("delete");
      return;
    }
    if (event.target.closest(".sessions-modal__actions .sessions-button--primary")) {
      event.preventDefault();
      applyShiftEdit("save");
      return;
    }
    closeTimeLists(host);
  });
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
