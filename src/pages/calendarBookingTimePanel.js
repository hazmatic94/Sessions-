import { renderSessionsButton } from "/ds/src/components/button/button.js";
import {
  renderBookingCheckoutFooter,
  renderBookingStep,
} from "/src/pages/calendarBookingShell.js";
import { renderSessionsAvatar } from "/ds/src/components/avatar/avatar.js";
import { formatHourBookingLabel } from "/ds/src/components/patterns/hourTime.js";
import {
  addNavigatorDays,
  parseNavigatorDate,
  toNavigatorDateValue,
} from "/ds/src/components/patterns/navigator.js";
import { renderSessionsMenuPanel } from "/ds/src/components/menu/index.js";
import { escapeHtml } from "/ds/src/utils.js";
import { totalServicePrice } from "/src/data/services.js";
import { memberColor, SHIFT_TEAM } from "/src/pages/shiftStore.js";

const STAFF_CHECK_SVG =
  '<svg class="calendar-booking-time__staff-check" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5 8 13.5 15 6.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const TIME_SLOTS = Array.from({ length: 9 * 4 }, (_, index) => {
  const hour = 9 + Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return { hour, minute, label: formatHourBookingLabel(hour, minute) };
});

function bookingServices(booking) {
  if (Array.isArray(booking.services) && booking.services.length) return booking.services;
  return booking.service?.name ? [booking.service] : [];
}

function staffMember(name) {
  return SHIFT_TEAM.find((person) => person.name === name) ?? SHIFT_TEAM[0];
}

function staffAvatar(person) {
  return renderSessionsAvatar({
    src: person.avatarSrc,
    name: person.name,
    initial: person.name,
    size: "small",
    className: "sessions-team-menu__avatar",
  }).replace("<div ", `<div style="--member-color: ${memberColor(person.name)}" `);
}

function renderStaffMenuOptions(selectedName) {
  return SHIFT_TEAM
    .map((person) => {
      const selected = person.name === selectedName;
      return `<button type="button" class="sessions-menu-item calendar-booking-time__staff-option${selected ? " is-selected" : ""}" role="option" data-calendar-time-staff-pick="${escapeHtml(person.name)}" aria-selected="${selected ? "true" : "false"}">${staffAvatar(person)}<span class="sessions-menu-item__label">${escapeHtml(person.name)}</span>${selected ? STAFF_CHECK_SVG : '<span class="calendar-booking-time__staff-check" aria-hidden="true"></span>'}</button>`;
    })
    .join("");
}

function dateStrip(centerValue) {
  const center = parseNavigatorDate(centerValue);
  const start = addNavigatorDays(toNavigatorDateValue(center), -3);
  return Array.from({ length: 7 }, (_, index) => {
    const value = addNavigatorDays(start, index);
    const date = parseNavigatorDate(value);
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const closed = date.getDay() === 0;
    const selected = value === centerValue;
    return { value, day: date.getDate(), weekday, closed, selected };
  });
}

export function setBookingTimeStaffMenuOpen(root, open) {
  const menu = root.querySelector("[data-calendar-time-staff-menu]");
  const panel = root.querySelector("[data-calendar-time-staff-panel]");
  const trigger = root.querySelector("[data-calendar-time-staff-trigger]");
  if (!menu || !panel || !trigger) return;
  menu.classList.toggle("is-open", open);
  panel.hidden = !open;
  trigger.setAttribute("aria-expanded", open ? "true" : "false");
}

export function renderBookingTimePanel() {
  return `<div class="calendar-client-picker__panel sessions-surface-step-panel" data-calendar-booking-time-panel hidden><div class="calendar-booking-time" data-calendar-booking-time-host></div></div>`;
}

export function paintBookingTimePanel(root, booking = {}) {
  const host = root.querySelector("[data-calendar-booking-time-host]");
  if (!host) return;

  const staffName = booking.staffName || SHIFT_TEAM[0]?.name || "";
  const person = staffMember(staffName);
  const dateValue = booking.date || toNavigatorDateValue(new Date());
  const month = parseNavigatorDate(dateValue).toLocaleDateString("en-US", { month: "long" });
  const selectedTime = booking.time || "";
  const price = totalServicePrice(bookingServices(booking)) || "A$ 0";
  const avatar = staffAvatar(person);
  const staffMenu = `<div class="calendar-booking-time__staff-menu" data-calendar-time-staff-menu><button type="button" class="calendar-booking-time__staff" data-calendar-time-staff-trigger aria-haspopup="listbox" aria-expanded="false" title="${escapeHtml(person.name)}">${avatar}<span class="calendar-booking-time__staff-name">${escapeHtml(person.name)}</span><img src="/assets/IconChevronDown.svg" width="20" height="20" alt="" /></button><div class="calendar-booking-time__staff-panel" data-calendar-time-staff-panel role="listbox" hidden>${renderSessionsMenuPanel({ children: renderStaffMenuOptions(staffName), className: "calendar-booking-time__staff-panel-inner" })}</div></div>`;

  const days = dateStrip(dateValue)
    .map((day) => {
      const classes = [
        "calendar-booking-time__day",
        day.selected ? "is-selected" : "",
        day.closed ? "is-closed" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<button type="button" class="${classes}" data-calendar-time-date="${escapeHtml(day.value)}" ${day.closed ? "disabled" : ""} aria-pressed="${day.selected ? "true" : "false"}"><span class="calendar-booking-time__day-circle" aria-hidden="true"><span class="calendar-booking-time__daynum">${day.day}</span></span><span class="calendar-booking-time__weekday">${escapeHtml(day.weekday)}</span></button>`;
    })
    .join("");

  const slots = TIME_SLOTS
    .map((slot) => {
      const selected = selectedTime === slot.label;
      return `<button type="button" class="calendar-booking-time__slot${selected ? " is-selected" : ""}" data-calendar-time-slot data-calendar-time-hour="${slot.hour}" data-calendar-time-minute="${slot.minute}" aria-pressed="${selected ? "true" : "false"}">${escapeHtml(slot.label)}</button>`;
    })
    .join("");

  const continueBtn = renderSessionsButton({
    variant: "primary",
    label: "Continue",
    fullWidth: true,
    disabled: !selectedTime,
  }).replace("<button ", '<button type="button" data-calendar-time-continue ');

  const body = `<div class="calendar-booking-time__staff-row">${staffMenu}</div><div class="calendar-booking-time__month"><button type="button" class="calendar-booking-time__month-nav" data-calendar-time-month="-1" aria-label="Previous month"><img src="/assets/IconChevronLeft.svg" width="20" height="20" alt="" /></button><span class="calendar-booking-time__month-label">${escapeHtml(month)}</span><button type="button" class="calendar-booking-time__month-nav" data-calendar-time-month="1" aria-label="Next month"><img src="/assets/IconCehvronRight.svg" width="20" height="20" alt="" /></button></div><div class="calendar-booking-time__days">${days}</div><div class="calendar-booking-time__times-head"><span>Available times</span></div><div class="calendar-booking-time__slots">${slots}</div>`;
  const footer = renderBookingCheckoutFooter({
    price,
    payAttribute: "data-calendar-booking-to-pay",
    actionsHtml: continueBtn,
  });

  host.innerHTML = renderBookingStep({
    backTo: "service",
    title: "Select a time",
    body,
    footer,
  });
}

export function shiftBookingMonth(dateValue, delta) {
  const date = parseNavigatorDate(dateValue);
  date.setMonth(date.getMonth() + delta);
  return toNavigatorDateValue(date);
}

