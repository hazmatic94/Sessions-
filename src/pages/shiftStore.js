import { parseNavigatorDate } from "/ds/src/components/patterns/navigator.js";

const STORAGE_KEY = "sessions.shifts";
const SHIFT_START = 10 * 60;
const SHIFT_END = 19 * 60;

export const SHIFT_TEAM = [
  { name: "Harry Maher", avatarSrc: "/assets/user.png" },
  { name: "Kale Emery", avatarInitial: "K" },
  { name: "Connor Braddock", avatarInitial: "C" },
];

const SEED_KINDS = {
  "Harry Maher": ["shift", "shift", "shift", "shift", "shift", "shift", "closed"],
  "Kale Emery": ["shift", "shift", "shift", "time-off", "shift", "shift", "closed"],
  "Connor Braddock": ["shift", "shift", "shift", "shift", "shift", "shift", "shift"],
};

function blockFor(kind) {
  if (kind === "shift") return { kind, start: SHIFT_START, end: SHIFT_END };
  return { kind };
}

function seedWeek() {
  return Object.fromEntries(
    SHIFT_TEAM.map((person) => [person.name, SEED_KINDS[person.name].map(blockFor)]),
  );
}

export function loadShiftWeek() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "");
    if (saved && typeof saved === "object") return saved;
  } catch {
    // ponytail: storage can be blocked; the roster still shows for this page view
  }
  return seedWeek();
}

export function shiftLabel(block) {
  if (!block || block.kind !== "shift") return "";
  return `${compactClock(block.start)} - ${compactClock(block.end)}`;
}

function compactClock(minutes) {
  const hour = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return mins ? `${h12}:${String(mins).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

export function writeShiftDay(name, dayIndex, block) {
  const week = loadShiftWeek();
  const days = week[name] ? week[name].slice() : [];
  days[dayIndex] = block;
  week[name] = days;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(week));
  } catch {
    // ponytail: storage can be blocked; the cell still updates for this page view
  }
  return week;
}

export function weekdayIndex(dateValue) {
  return (parseNavigatorDate(dateValue).getDay() + 6) % 7;
}

export function shiftOn(name, dateValue) {
  const days = loadShiftWeek()[name];
  if (!days) return null;
  return days[weekdayIndex(dateValue)] ?? { kind: "empty" };
}

export function outsideQuarters(block, hour) {
  const quarters = [0, 15, 30, 45];
  if (!block || block.kind === "closed" || block.kind === "empty") return quarters;
  if (block.kind === "time-off") {
    if (block.start == null || block.end == null) return quarters;
    return quarters.filter((minute) => {
      const at = hour * 60 + minute;
      return at >= block.start && at < block.end;
    });
  }
  if (block.kind !== "shift") return quarters;
  return quarters.filter((minute) => {
    const at = hour * 60 + minute;
    return at < block.start || at >= block.end;
  });
}
