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
import { escapeHtml } from "/ds/src/utils.js";
import { totalServicePrice } from "/src/data/services.js";
import { memberColor, SHIFT_TEAM } from "/src/pages/shiftStore.js";

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
  const avatar = renderSessionsAvatar({
    src: person.avatarSrc,
    name: person.name,
    initial: person.name,
    size: "small",
  }).replace("<div ", `<div style="--member-color: ${memberColor(person.name)}" `);

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

  const body = `<div class="calendar-booking-time__staff-row"><button type="button" class="calendar-booking-time__staff" data-calendar-time-staff-cycle aria-haspopup="listbox">${avatar}<span class="calendar-booking-time__staff-name">${escapeHtml(person.name)}</span><img src="/assets/IconChevronDown.svg" width="20" height="20" alt="" /></button><button type="button" class="calendar-booking-time__calendar" aria-label="Open calendar"><img src="/assets/IconCalendar.svg" width="20" height="20" alt="" /></button></div><div class="calendar-booking-time__month"><button type="button" class="calendar-booking-time__month-nav" data-calendar-time-month="-1" aria-label="Previous month"><img src="/assets/IconChevronLeft.svg" width="20" height="20" alt="" /></button><span class="calendar-booking-time__month-label">${escapeHtml(month)}</span><button type="button" class="calendar-booking-time__month-nav" data-calendar-time-month="1" aria-label="Next month"><img src="/assets/IconCehvronRight.svg" width="20" height="20" alt="" /></button></div><div class="calendar-booking-time__days">${days}</div><div class="calendar-booking-time__times-head"><span>Available times</span><button type="button" class="calendar-booking-time__pick-calendar">Pick from calendar</button></div><div class="calendar-booking-time__slots">${slots}</div>`;
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

export function cycleBookingStaff(booking) {
  const index = SHIFT_TEAM.findIndex((person) => person.name === booking.staffName);
  const next = SHIFT_TEAM[(index + 1) % SHIFT_TEAM.length];
  return next?.name || booking.staffName;
}

export function shiftBookingMonth(dateValue, delta) {
  const date = parseNavigatorDate(dateValue);
  date.setMonth(date.getMonth() + delta);
  return toNavigatorDateValue(date);
}
