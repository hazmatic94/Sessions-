import { renderSessionsCalendarAppointmentCard } from "/ds/src/components/patterns/calendarAppointmentCard.js";
import { renderSessionsHourBooking } from "/ds/src/components/patterns/hourBooking.js";
import { formatHourBookingTimeRange } from "/ds/src/components/patterns/hourTime.js";
import { escapeHtml } from "/ds/src/utils.js";
import {
  appointmentsForStaffDay,
  formatAppointmentDuration,
  formatAppointmentTimeHeader,
  listAppointments,
} from "/src/data/appointments.js";
import { memberColor } from "/src/pages/shiftStore.js";

function appointmentPreviewFields(appointment) {
  const walkIn =
    appointment.walkIn ??
    /walk[\s-]?in/i.test(String(appointment.customerName || ""));

  return {
    when: formatAppointmentTimeHeader(
      appointment.hour,
      appointment.minute,
      appointment.durationMinutes,
    ),
    status: appointment.status || "Booked",
    customerName: walkIn ? "Walk-In" : appointment.customerName,
    walkIn,
    avatarSrc: appointment.avatarSrc || "",
    avatarInitial: appointment.avatarInitial || "",
    serviceName: appointment.serviceType || "Appointment",
    priceLabel: appointment.priceLabel || "",
    staffName: appointment.staffName || "",
    durationLabel:
      appointment.durationLabel || formatAppointmentDuration(appointment.durationMinutes),
  };
}

function positionHoverCard(card, anchor) {
  const rect = anchor.getBoundingClientRect();
  const margin = 12;
  const blockOffsetX = 0.32;

  card.style.position = "fixed";
  card.style.margin = "0";
  card.style.visibility = "hidden";
  card.style.top = "0";
  card.style.left = "0";

  const cardRect = card.getBoundingClientRect();
  const anchorCenterY = rect.top + rect.height / 2;
  let top = anchorCenterY - cardRect.height / 2;
  let left = rect.left + rect.width * blockOffsetX;

  top = Math.max(margin, Math.min(top, window.innerHeight - cardRect.height - margin));
  left = Math.min(left, window.innerWidth - margin - cardRect.width);
  left = Math.max(margin, left);

  card.style.top = `${top}px`;
  card.style.left = `${left}px`;
  card.style.visibility = "";
}

export function renderCalendarAppointmentHoverHost() {
  return "";
}

function appointmentHoverHost() {
  let node = document.querySelector("[data-calendar-appointment-hover]");
  if (!node) {
    node = document.createElement("div");
    node.className = "calendar-appointment-hover";
    node.dataset.calendarAppointmentHover = "";
    node.hidden = true;
    document.body.appendChild(node);
  }
  return node;
}

export function setupCalendarAppointmentHovers(root) {
  if (root.dataset.calendarAppointmentHoversBound === "true") return;
  root.dataset.calendarAppointmentHoversBound = "true";

  const host = () => appointmentHoverHost();
  const hide = () => {
    const node = host();
    if (!node) return;
    node.hidden = true;
    node.innerHTML = "";
  };
  const isDesktop = () => window.matchMedia("(min-width: 769px)").matches;

  const show = (anchor) => {
    const id = anchor.dataset.calendarAppointment;
    const appointment = listAppointments().find((row) => row.id === id);
    const node = host();
    if (!appointment || !node) return;
    const color =
      anchor.style.getPropertyValue("--member-color") || memberColor(appointment.staffName);
    node.innerHTML = renderSessionsCalendarAppointmentCard(appointmentPreviewFields(appointment));
    const card = node.querySelector("[data-sessions-calendar-appointment-card]");
    if (!card) return;
    card.hidden = false;
    card.style.setProperty("--member-color", color);
    node.hidden = false;
    positionHoverCard(card, anchor);
  };

  root.addEventListener(
    "mouseover",
    (event) => {
      if (!isDesktop()) return;
      const anchor = event.target.closest(".calendar-appointment");
      if (!anchor || anchor.contains(event.relatedTarget)) return;
      show(anchor);
    },
    true,
  );

  root.addEventListener(
    "mouseout",
    (event) => {
      if (!isDesktop()) return;
      const anchor = event.target.closest(".calendar-appointment");
      if (!anchor) return;
      const next = event.relatedTarget;
      if (next && anchor.contains(next)) return;
      hide();
    },
    true,
  );

  root.querySelector(".home-shell__main")?.addEventListener("scroll", hide, { passive: true });
  window.matchMedia("(max-width: 768px)").addEventListener("change", hide);

  root.addEventListener("click", (event) => {
    const anchor = event.target.closest(".calendar-appointment");
    if (!anchor) return;
    event.preventDefault();
    event.stopPropagation();
    hide();
    const id = anchor.dataset.calendarAppointment;
    if (!id) return;
    root.dispatchEvent(
      new CustomEvent("sessions:appointment-checkout", {
        bubbles: true,
        detail: { appointmentId: id },
      }),
    );
  });
}

export function renderCalendarAppointmentsLayer(staff, date) {
  const blocks = staff
    .flatMap((person, index) => {
      const rows = appointmentsForStaffDay(date, person.name);
      return rows.map((appointment) => {
        const start = appointment.hour * 60 + appointment.minute;
        const booking = renderSessionsHourBooking({
          time: formatHourBookingTimeRange(
            appointment.hour,
            appointment.minute,
            appointment.durationMinutes,
          ),
          customerName: appointment.walkIn ? "Walk-In" : appointment.customerName,
          serviceType: appointment.serviceType,
        });
        const color = memberColor(person.name);
        return `<div class="calendar-appointment" data-calendar-appointment="${escapeHtml(appointment.id)}" style="--appt-start: ${start}; --appt-duration: ${appointment.durationMinutes}; --appt-staff-index: ${index}; --member-color: ${color}">${booking}</div>`;
      });
    })
    .join("");

  return `<div class="calendar-appointments" aria-hidden="false">${blocks}</div>`;
}
