import { renderGhostButton, renderSessionsButton } from "/ds/src/components/button/button.js";
import { renderSessionsInput } from "/ds/src/components/input/input.js";
import { formatHourBookingTimeRange, resolveHourTime } from "/ds/src/components/patterns/hourTime.js";
import { addNavigatorDays, formatNavigatorDate } from "/ds/src/components/patterns/navigator.js";
import { renderSessionsSurface } from "/ds/src/components/patterns/surface.js";
import { escapeHtml } from "/ds/src/utils.js";
import { appointmentsForStaffDay } from "/src/data/appointments.js";
import { setSessionsSurfaceDrawerOpen } from "/src/utils/surfaceDrawer.js";

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

function addBlockedTime({ date, staffName, start, duration, title }) {
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
    title: title || "",
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
        const label = savedBlockLabel(block.hour, block.minute, block.durationMinutes);
        return `<div class="calendar-block" data-calendar-block="${block.id}" style="--appt-start: ${start}; --appt-duration: ${block.durationMinutes}; --appt-staff-index: ${index}">${label}</div>`;
      }),
    )
    .join("");
  return `<div class="calendar-blocks">${blocks}</div>`;
}

export function formatBlockDuration(minutes) {
  const span = Math.max(0, Number(minutes) || 0);
  if (span < 60) return `${span} min duration`;
  const hours = Math.floor(span / 60);
  const rest = span % 60;
  const hourLabel = `${hours} hr`;
  return rest ? `${hourLabel} ${rest} min duration` : `${hourLabel} duration`;
}

function savedBlockLabel(hour, minute, durationMinutes) {
  const start = resolveHourTime(hour, minute);
  const endTotal = hour * 60 + minute + durationMinutes;
  const end = endTotal >= 24 * 60
    ? { time: "12:00" }
    : resolveHourTime(Math.floor(endTotal / 60) % 24, endTotal % 60);
  return `${start.time} - ${end.time} Blocked time`;
}

{
  if (formatBlockDuration(15) !== "15 min duration") throw new Error("formatBlockDuration");
  if (formatBlockDuration(90) !== "1 hr 30 min duration") throw new Error("formatBlockDuration");
  if (savedBlockLabel(13, 15, 15) !== "1:15 - 1:30 Blocked time") throw new Error("savedBlockLabel");
}

function timeLabel(minutes) {
  if (minutes >= 24 * 60) return "12:00 am";
  return resolveHourTime(Math.floor(minutes / 60), minutes % 60).labelSpaced;
}

function option(value, label) {
  return `<option value="${escapeHtml(String(value))}">${escapeHtml(label)}</option>`;
}

export function renderCalendarBlockEditor() {
  const back = renderGhostButton({
    label: "Back",
    icon: "chevron-left",
    className: "sessions-client-edit__back",
  }).replace("<button ", '<button type="button" data-calendar-block-edit-back ');
  const close = renderSessionsButton({
    variant: "secondary",
    icon: "close",
    ariaLabel: "Close blocked time",
    className: "sessions-surface-close",
  }).replace("<button ", '<button type="button" data-calendar-block-edit-back ');
  const title = renderSessionsInput({
    label: "Title (Optional)",
    placeholder: "",
    name: "title",
    id: "calendar-block-edit-title",
    fullWidth: true,
  });
  const save = renderSessionsButton({
    variant: "primary",
    label: "Save",
    type: "submit",
    fullWidth: true,
  });
  const form = `<form id="calendar-block-edit-form" class="calendar-block-edit__form" data-calendar-block-edit-form>${title}<label class="sessions-input sessions-input--full-width calendar-block-edit__select"><span class="sessions-input__label">Date</span><span class="sessions-input__control"><select class="sessions-input__field" name="date"></select></span></label><div class="calendar-block-edit__times"><label class="sessions-input sessions-input--full-width calendar-block-edit__select"><span class="sessions-input__label">Start time</span><span class="sessions-input__control"><select class="sessions-input__field" name="start"></select></span></label><label class="sessions-input sessions-input--full-width calendar-block-edit__select"><span class="sessions-input__label">End time</span><span class="sessions-input__control"><select class="sessions-input__field" name="end"></select></span></label><p class="calendar-block-edit__duration" data-calendar-block-edit-duration></p></div><label class="sessions-input sessions-input--full-width calendar-block-edit__select"><span class="sessions-input__label">Team member</span><span class="sessions-input__control"><select class="sessions-input__field" name="staff"></select></span></label></form>`;
  const page = `<div class="calendar-block-edit__page"><div class="calendar-block-edit__nav sessions-client-edit__nav">${back}</div><h3 class="calendar-block-edit__title" id="calendar-block-edit-heading">Add blocked time</h3>${form}<div class="calendar-block-edit__save">${save.replace("<button ", '<button form="calendar-block-edit-form" ')}</div></div>`;

  return `<div class="sessions-surface-scrim" data-calendar-block-edit-scrim hidden></div><div class="calendar-block-edit sessions-surface-drawer is-sessions-inner-page" data-calendar-block-edit role="dialog" aria-modal="true" aria-labelledby="calendar-block-edit-heading" hidden>${close}${renderSessionsSurface({ children: page })}</div>`;
}

export function bindCalendarBlockedTime(root) {
  const stage = () => root.querySelector(".calendar-stage");
  const banner = () => root.querySelector("[data-calendar-block-banner]");
  let drag = null;
  let ignoreBlockClick = false;

  const blocking = () => stage()?.classList.contains("is-blocking") === true;

  const editor = () => root.querySelector("[data-calendar-block-edit]");
  const editorScrim = () => root.querySelector("[data-calendar-block-edit-scrim]");
  const editorForm = () => root.querySelector("[data-calendar-block-edit-form]");
  const editorOpen = () => editor()?.hidden === false;

  function clearChip(name) {
    root.querySelector(`[data-calendar-block-${name}]`)?.remove();
  }

  function showChip(name, staffName, from, to) {
    const hours = root.querySelector("#hour-column");
    if (!hours) return;
    const attr = `data-calendar-block-${name}`;
    let node = hours.querySelector(`[${attr}]`);
    if (!node) {
      node = document.createElement("div");
      node.className = name === "hover" ? "calendar-block calendar-block-preview" : "calendar-block calendar-block-selected";
      node.setAttribute(attr, "");
      hours.append(node);
    }
    node.hidden = false;
    node.style.setProperty("--appt-start", String(from));
    node.style.setProperty("--appt-duration", String(to - from));
    node.style.setProperty("--appt-staff-index", String(Math.max(0, staffIndex(root, staffName))));
    node.textContent = formatHourBookingTimeRange(Math.floor(from / 60), from % 60, to - from);
  }

  function closeEditor() {
    const drawer = editor();
    if (!drawer || drawer.hidden) {
      clearChip("selected");
      return;
    }
    setSessionsSurfaceDrawerOpen({
      drawer,
      scrim: editorScrim(),
      open: false,
      hideScrimOnMobile: true,
    });
    clearChip("selected");
  }

  function setBlocking(on) {
    stage()?.classList.toggle("is-blocking", on);
    const bar = banner();
    if (bar) bar.hidden = !on;
    if (on) paintTargets(root);
    else {
      root.querySelectorAll(".is-block-target").forEach((slot) => slot.classList.remove("is-block-target"));
      clearChip("hover");
      closeEditor();
      drag = null;
    }
  }

  function staffNames() {
    const row = root.querySelector(".calendar-hour");
    if (!row) return [];
    return [...row.querySelectorAll("[data-calendar-staff]")].map((column) => column.dataset.calendarStaff || "");
  }

  function paintDuration() {
    const form = editorForm();
    const label = root.querySelector("[data-calendar-block-edit-duration]");
    const save = editor()?.querySelector(".calendar-block-edit__save .sessions-button");
    if (!form || !label) return 0;
    const duration = Number(form.elements.end.value) - Number(form.elements.start.value);
    label.textContent = duration > 0 ? formatBlockDuration(duration) : "";
    if (save) save.disabled = duration <= 0;
    return duration;
  }

  function openEditor({ staffName, from, to }) {
    const form = editorForm();
    const drawer = editor();
    if (!form || !drawer) return;
    clearChip("hover");
    showChip("selected", staffName, from, to);
    const date = calendarDate(root);
    form.elements.date.innerHTML = Array.from({ length: 36 }, (_, index) => addNavigatorDays(date, index - 14))
      .map((value) => option(value, formatNavigatorDate(value)))
      .join("");
    form.elements.date.value = date;
    form.elements.start.innerHTML = Array.from({ length: (24 * 60) / 15 }, (_, index) => index * 15)
      .map((value) => option(value, timeLabel(value)))
      .join("");
    form.elements.end.innerHTML = Array.from({ length: (24 * 60) / 15 }, (_, index) => (index + 1) * 15)
      .map((value) => option(value, timeLabel(value)))
      .join("");
    form.elements.start.value = String(from);
    form.elements.end.value = String(to);
    form.elements.staff.innerHTML = staffNames().map((name) => option(name, name)).join("");
    form.elements.staff.value = staffName;
    form.elements.title.value = "";
    paintDuration();
    setSessionsSurfaceDrawerOpen({
      drawer,
      scrim: editorScrim(),
      open: true,
      hideScrimOnMobile: true,
    });
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
    if (!block || block.classList.contains("calendar-block-preview") || block.classList.contains("calendar-block-selected")) return;
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
    if (editorOpen()) return;
    ignoreBlockClick = true;
    drag = { staffName, start, end: start, pointerId: event.pointerId };
    slot.setPointerCapture?.(event.pointerId);
    clearChip("hover");
    showChip("selected", staffName, start, start + 15);
  });

  root.addEventListener("pointermove", (event) => {
    if (drag && event.pointerId === drag.pointerId) {
      const slot = slotFromPoint(event.clientX, event.clientY);
      const column = slot?.closest("[data-sessions-hour-column]");
      if (!slot || column?.dataset.calendarStaff !== drag.staffName) return;
      drag.end = slotMinutes(slot);
      const range = clampBlockEnd(drag.start, drag.end, (minute) => unavailableAt(drag.staffName, minute));
      showChip("selected", drag.staffName, range.from, range.to);
      drag.range = range;
      return;
    }
    if (!blocking() || drag || editorOpen() || event.buttons !== 0) return;
    const slot = event.target.closest?.(".sessions-hour-column__slot");
    if (!slot?.classList.contains("is-block-target")) {
      clearChip("hover");
      return;
    }
    const staffName = slot.closest("[data-sessions-hour-column]")?.dataset.calendarStaff ?? "";
    const start = slotMinutes(slot);
    showChip("hover", staffName, start, start + 15);
  });

  root.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const range = drag.range ?? clampBlockEnd(drag.start, drag.end, (minute) => unavailableAt(drag.staffName, minute));
    const staffName = drag.staffName;
    drag = null;
    setTimeout(() => {
      ignoreBlockClick = false;
    }, 0);
    if (range.to <= range.from) {
      clearChip("selected");
      return;
    }
    openEditor({ staffName, from: range.from, to: range.to });
  });

  root.addEventListener("pointerleave", (event) => {
    if (event.target !== root || drag) return;
    clearChip("hover");
  });

  root.addEventListener("change", (event) => {
    const form = editorForm();
    if (!form || !form.contains(event.target)) return;
    const duration = paintDuration();
    if (duration <= 0) return;
    showChip("selected", form.elements.staff.value, Number(form.elements.start.value), Number(form.elements.end.value));
  });

  root.addEventListener("submit", (event) => {
    const form = editorForm();
    if (!form || event.target !== form) return;
    event.preventDefault();
    const duration = Number(form.elements.end.value) - Number(form.elements.start.value);
    if (duration <= 0) return;
    addBlockedTime({
      date: form.elements.date.value,
      staffName: form.elements.staff.value,
      start: Number(form.elements.start.value),
      duration,
      title: form.elements.title.value.trim(),
    });
    setBlocking(false);
    root.dispatchEvent(new CustomEvent("sessions:appointments-changed", { bubbles: true }));
  });

  root.addEventListener("click", (event) => {
    if (!event.target.closest("[data-calendar-block-edit-back], [data-calendar-block-edit-scrim]")) return;
    event.preventDefault();
    closeEditor();
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (editorOpen()) {
      closeEditor();
      return;
    }
    if (blocking()) setBlocking(false);
  });
}
