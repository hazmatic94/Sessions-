import { appointmentsForStaffDay } from "/src/data/appointments.js";
import { formatHourBookingTimeRange } from "/ds/src/components/patterns/hourTime.js";

const STORAGE_KEY = "sessions.blockedTimes";

function listBlockedTimes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBlockedTimes(rows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ponytail: storage can be blocked; the grid still updates for this view
  }
}

export function blockedTimesForStaffDay(date, staffName) {
  return listBlockedTimes().filter((row) => row.date === date && row.staffName === staffName);
}

function addBlockedTime({ date, staffName, start, duration }) {
  const hour = Math.floor(start / 60);
  const minute = start % 60;
  const rows = listBlockedTimes();
  rows.push({
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    date,
    staffName,
    hour,
    minute,
    durationMinutes: duration,
  });
  saveBlockedTimes(rows);
}

function removeBlockedTime(id) {
  saveBlockedTimes(listBlockedTimes().filter((row) => row.id !== id));
}

export function clampBlockEnd(start, end, unavailable) {
  const dir = end >= start ? 15 : -15;
  let last = start;
  for (let t = start; dir > 0 ? t <= end : t >= end; t += dir) {
    if (unavailable(t)) break;
    last = t;
  }
  const from = Math.min(start, last);
  return { from, to: Math.max(start, last) + 15 };
}

{
  const unavailable = (minute) => minute >= 45;
  const range = clampBlockEnd(0, 60, unavailable);
  if (range.from !== 0 || range.to !== 45) throw new Error("clampBlockEnd");
}

function calendarDate(root) {
  return root.querySelector("[data-sessions-navigator]")?.dataset.sessionsNavigatorValue ?? "";
}

function staffIndex(root, staffName) {
  const row = root.querySelector(".calendar-hour");
  if (!row) return 0;
  return [...row.querySelectorAll("[data-calendar-staff]")].findIndex(
    (column) => column.dataset.calendarStaff === staffName,
  );
}

function slotMinutes(slot) {
  const column = slot.closest("[data-sessions-hour-column]");
  return Number(column?.dataset.hour) * 60 + Number(slot.dataset.minute);
}

function takenMinutes(root, staffName, date) {
  const taken = new Set();
  const mark = (hour, minute, duration) => {
    const start = hour * 60 + minute;
    for (let t = start; t < start + duration; t += 15) taken.add(t);
  };
  appointmentsForStaffDay(date, staffName).forEach((row) => mark(row.hour, row.minute, row.durationMinutes));
  blockedTimesForStaffDay(date, staffName).forEach((row) => mark(row.hour, row.minute, row.durationMinutes));
  return taken;
}

function slotFromPoint(x, y) {
  for (const node of document.elementsFromPoint(x, y)) {
    const slot = node.closest?.(".sessions-hour-column__slot");
    if (slot) return slot;
  }
  return null;
}

function paintTargets(root) {
  const date = calendarDate(root);
  const cache = new Map();
  root.querySelectorAll(".sessions-hour-column__slot").forEach((slot) => {
    const column = slot.closest("[data-sessions-hour-column]");
    const staffName = column?.dataset.calendarStaff ?? "";
    if (!cache.has(staffName)) cache.set(staffName, takenMinutes(root, staffName, date));
    const open = slot.dataset.outsideHours !== "true" && !cache.get(staffName).has(slotMinutes(slot));
    slot.classList.toggle("is-block-target", open);
  });
}

export function renderBlockedTimesLayer(staff, date) {
  const blocks = staff
    .flatMap((person, index) =>
      blockedTimesForStaffDay(date, person.name).map((block) => {
        const start = block.hour * 60 + block.minute;
        const label = formatHourBookingTimeRange(block.hour, block.minute, block.durationMinutes);
        return `<div class="calendar-block" data-calendar-block="${block.id}" style="--appt-start: ${start}; --appt-duration: ${block.durationMinutes}; --appt-staff-index: ${index}">${label}</div>`;
      }),
    )
    .join("");
  return `<div class="calendar-blocks">${blocks}</div>`;
}

export function bindCalendarBlockedTime(root) {
  const stage = () => root.querySelector(".calendar-stage");
  const banner = () => root.querySelector("[data-calendar-block-banner]");
  let drag = null;
  let ignoreBlockClick = false;

  const blocking = () => stage()?.classList.contains("is-blocking") === true;

  function setBlocking(on) {
    stage()?.classList.toggle("is-blocking", on);
    const bar = banner();
    if (bar) bar.hidden = !on;
    if (on) paintTargets(root);
    else {
      root.querySelectorAll(".is-block-target").forEach((slot) => slot.classList.remove("is-block-target"));
      root.querySelector("[data-calendar-block-preview]")?.remove();
      drag = null;
    }
  }

  function preview(staffName, from, to) {
    const hours = root.querySelector("#hour-column");
    if (!hours) return;
    let node = hours.querySelector("[data-calendar-block-preview]");
    if (!node) {
      node = document.createElement("div");
      node.className = "calendar-block calendar-block-preview";
      node.dataset.calendarBlockPreview = "";
      hours.append(node);
    }
    const index = Math.max(0, staffIndex(root, staffName));
    node.hidden = false;
    node.style.setProperty("--appt-start", String(from));
    node.style.setProperty("--appt-duration", String(to - from));
    node.style.setProperty("--appt-staff-index", String(index));
    node.textContent = formatHourBookingTimeRange(Math.floor(from / 60), from % 60, to - from);
  }

  function unavailableAt(staffName, minute) {
    const slot = [...root.querySelectorAll(`[data-calendar-staff="${CSS.escape(staffName)}"] [data-minute="${minute % 60}"]`)].find(
      (node) => Number(node.closest("[data-sessions-hour-column]")?.dataset.hour) === Math.floor(minute / 60),
    );
    if (!slot || slot.dataset.outsideHours === "true") return true;
    return takenMinutes(root, staffName, calendarDate(root)).has(minute);
  }

  root.addEventListener("sessions:block-time", () => setBlocking(true));
  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-sessions-slot-action]");
    if (action?.dataset.sessionsSlotAction !== "blocked") return;
    setBlocking(true);
  });
  root.addEventListener("sessions:navigator-date", () => {
    if (blocking()) paintTargets(root);
  });
  root.addEventListener("sessions:calendar-view", () => {
    if (blocking()) paintTargets(root);
  });
  root.addEventListener("sessions:appointments-changed", () => {
    if (blocking()) paintTargets(root);
  });

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-calendar-block-cancel]")) {
      event.preventDefault();
      setBlocking(false);
      return;
    }
    if (!blocking()) return;
    const block = event.target.closest("[data-calendar-block]");
    if (!block || block.classList.contains("calendar-block-preview")) return;
    if (ignoreBlockClick) return;
    event.preventDefault();
    event.stopPropagation();
    removeBlockedTime(block.dataset.calendarBlock);
    root.dispatchEvent(new CustomEvent("sessions:appointments-changed", { bubbles: true }));
  });

  root.addEventListener(
    "click",
    (event) => {
      if (!blocking()) return;
      if (!event.target.closest(".sessions-hour-column__slot")) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );

  root.addEventListener("pointerdown", (event) => {
    if (!blocking() || event.button !== 0) return;
    const slot = event.target.closest(".sessions-hour-column__slot");
    if (!slot?.classList.contains("is-block-target")) return;
    event.preventDefault();
    const staffName = slot.closest("[data-sessions-hour-column]")?.dataset.calendarStaff ?? "";
    const start = slotMinutes(slot);
    ignoreBlockClick = true;
    drag = { staffName, start, end: start, pointerId: event.pointerId };
    slot.setPointerCapture?.(event.pointerId);
    preview(staffName, start, start + 15);
  });

  root.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const slot = slotFromPoint(event.clientX, event.clientY);
    const column = slot?.closest("[data-sessions-hour-column]");
    if (!slot || column?.dataset.calendarStaff !== drag.staffName) return;
    drag.end = slotMinutes(slot);
    const range = clampBlockEnd(drag.start, drag.end, (minute) => unavailableAt(drag.staffName, minute));
    preview(drag.staffName, range.from, range.to);
    drag.range = range;
  });

  root.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const range = drag.range ?? clampBlockEnd(drag.start, drag.end, (minute) => unavailableAt(drag.staffName, minute));
    const staffName = drag.staffName;
    drag = null;
    setTimeout(() => {
      ignoreBlockClick = false;
    }, 0);
    if (range.to <= range.from) return;
    addBlockedTime({
      date: calendarDate(root),
      staffName,
      start: range.from,
      duration: range.to - range.from,
    });
    root.dispatchEvent(new CustomEvent("sessions:appointments-changed", { bubbles: true }));
  });

  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && blocking()) setBlocking(false);
  });
}
