import { formatHourBookingLabel, resolveHourTime } from "/ds/src/components/patterns/hourTime.js";
import { durationMinutes, listServicesForBooking, totalServicePrice } from "/src/data/services.js";

const STORAGE_KEY = "sessions.appointments";

export function listAppointments() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAppointments(rows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ponytail: storage can be blocked
  }
}

function resolveBookingStart(booking) {
  const hour = Number(booking.hour);
  const minute = Number(booking.minute);
  if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
    return { hour: ((hour % 24) + 24) % 24, minute: ((minute % 60) + 60) % 60 };
  }
  const time = String(booking.time || "").trim().toLowerCase().replace(/\s/g, "");
  const match = /^(\d{1,2}):(\d{2})(am|pm)$/.exec(time);
  if (!match) return { hour: 9, minute: 0 };
  let h = Number(match[1]);
  const m = Number(match[2]);
  if (match[3] === "pm" && h < 12) h += 12;
  if (match[3] === "am" && h === 12) h = 0;
  return { hour: h, minute: m };
}

function isWalkInClient(client) {
  const name = String(client?.name || "").trim().toLowerCase();
  return name === "walk in" || name === "walk-in";
}

export function formatAppointmentDuration(minutes) {
  const total = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours && mins) return `${hours}h ${mins}min`;
  if (hours) return `${hours}h`;
  return `${mins}min`;
}

export function formatAppointmentTimeHeader(hour, minute, durationMinutes) {
  const start = resolveHourTime(hour, minute);
  const endTotal = hour * 60 + minute + durationMinutes;
  const end = resolveHourTime(Math.floor(endTotal / 60) % 24, endTotal % 60);
  return `${start.time}${start.period} – ${end.time}${end.period}`;
}

function bookingServices(booking) {
  if (Array.isArray(booking.services) && booking.services.length) return booking.services;
  return booking.service?.name ? [booking.service] : [];
}

export function createAppointmentFromBooking(booking) {
  const services = bookingServices(booking);
  const duration = services.reduce((sum, service) => sum + durationMinutes(service.duration), 0) || 15;
  const { hour, minute } = resolveBookingStart(booking);
  const client = booking.client ?? {};

  const walkIn = isWalkInClient(client);

  return {
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    date: String(booking.date || ""),
    staffName: String(booking.staffName || ""),
    hour,
    minute,
    time: String(booking.time || formatHourBookingLabel(hour, minute)),
    durationMinutes: duration,
    durationLabel: formatAppointmentDuration(duration),
    customerName: String(client.name || "Walk in"),
    walkIn,
    avatarSrc: String(client.avatarSrc || ""),
    avatarInitial: String(client.avatarInitial || ""),
    clientEmail: String(client.email || ""),
    services: services.map((service) => ({ ...service })),
    serviceType: services.map((service) => service.name).filter(Boolean).join(", ") || "Appointment",
    priceLabel: totalServicePrice(services),
    status: "Booked",
  };
}

export function appointmentToPendingBooking(appointment) {
  const walkIn =
    appointment.walkIn ?? /walk[\s-]?in/i.test(String(appointment.customerName || ""));
  const catalog = listServicesForBooking();
  let services = Array.isArray(appointment.services) ? appointment.services : [];
  if (!services.length && appointment.serviceType) {
    services = appointment.serviceType
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map(
        (name) =>
          catalog.find((row) => row.name === name) ?? {
            name,
            description: "",
            duration: formatAppointmentDuration(appointment.durationMinutes),
            priceType: "fixed",
            price: "0.00",
          },
      );
  }

  return {
    appointmentId: appointment.id,
    date: appointment.date,
    time: appointment.time || formatHourBookingLabel(appointment.hour, appointment.minute),
    hour: appointment.hour,
    minute: appointment.minute,
    staffName: appointment.staffName,
    client: {
      name: walkIn ? "Walk in" : appointment.customerName,
      email: appointment.clientEmail || "",
      avatarSrc: appointment.avatarSrc || "",
      avatarInitial: appointment.avatarInitial || "",
    },
    services,
    service: services[0],
  };
}

export function addAppointmentFromBooking(booking) {
  const appointment = createAppointmentFromBooking(booking);
  if (!appointment.date || !appointment.staffName) return null;
  const rows = listAppointments();
  rows.push(appointment);
  saveAppointments(rows);
  return appointment;
}

export function appointmentsForStaffDay(date, staffName) {
  return listAppointments().filter((row) => row.date === date && row.staffName === staffName);
}
