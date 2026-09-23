import {
  renderSessionsAppointmentActivityCard,
  renderSessionsRecentSalesCard,
  renderSessionsTopServicesCard,
  renderSessionsUpcomingAppointmentsCard,
} from "/ds/src/components/cards/index.js";
import { SESSIONS_CHART_COLORS } from "/ds/src/components/patterns/chartColors.js";
import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
} from "/ds/src/components/navigation/index.js";
import { renderPageWrapper } from "/src/components/pageWrapper.js";

const navOptions = {
  href: "/",
  ariaLabel: "Sessions home",
};

const RECENT_SALES_DAILY = [385, 420, 510, 620, 340, 395, 430];
const RECENT_SALES_APPOINTMENTS_DAILY = [210, 245, 315, 380, 185, 220, 235];

function formatUsd(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(amount);
}

const recentSales = {
  title: "Recent Sales",
  period: "Last 7 days",
  totalValue: formatUsd(RECENT_SALES_DAILY.reduce((sum, value) => sum + value, 0)),
  metrics: [
    { label: "Appointments", value: "47" },
    {
      label: "Appointments Value",
      value: formatUsd(
        RECENT_SALES_APPOINTMENTS_DAILY.reduce((sum, value) => sum + value, 0),
      ),
    },
  ],
  chart: {
    columns: 7,
    rows: 4,
    startDate: "2025-03-19",
    variant: "bar",
    yAxisFormat: "currency",
    barColors: {
      base: { color: SESSIONS_CHART_COLORS.sales },
      stack: { color: SESSIONS_CHART_COLORS.appointments },
    },
    bars: RECENT_SALES_DAILY.map((sales, index) => ({
      base: sales,
      stack: RECENT_SALES_APPOINTMENTS_DAILY[index],
    })),
  },
  legend: [
    { label: "Sales", color: SESSIONS_CHART_COLORS.sales },
    { label: "Appointments", color: SESSIONS_CHART_COLORS.appointments },
  ],
};

const upcomingAppointments = {
  title: "Upcoming appointments",
  period: "Last 7 days",
  totalValue: "17",
  totalLabel: "Booked",
  metrics: [
    { label: "Confirmed Appointments", value: "32" },
    { label: "Cancelled Appointments", value: "4" },
  ],
  chart: {
    columns: 7,
    rows: 4,
    max: 20,
    startDate: "2025-03-19",
    variant: "bar",
    barColors: {
      base: { color: SESSIONS_CHART_COLORS.confirmed },
      stack: { color: SESSIONS_CHART_COLORS.cancelled },
    },
    bars: [
      { value: 14 },
      { base: 10, stack: 2 },
      { value: 16.5 },
      { value: 18 },
      { base: 15, stack: 2 },
      { value: 11 },
      { value: 13 },
    ],
  },
  legend: [
    { label: "Confirmed", color: SESSIONS_CHART_COLORS.confirmed },
    { label: "Cancelled", color: SESSIONS_CHART_COLORS.cancelled },
  ],
};

const appointmentActivity = {
  title: "Appointment activity",
  viewAllHref: "#",
  appointments: [
    ["20", "Aug", "Skin Fade", "BOOKED", "Thu, 20 Aug 2026", "2:45pm", "Online Booking", "45min", 60],
    ["20", "Aug", "Skin Fade", "BOOKED", "Thu, 20 Aug 2026", "2:45pm", "Online Booking", "45min", 60],
    ["20", "Aug", "Skin Fade", "CANCELLED", "Thu, 20 Aug 2026", "3:30pm", "Online Booking", "45min", 60],
    ["20", "Aug", "Skin Fade", "CANCELLED", "Thu, 20 Aug 2026", "4:15pm", "Online Booking", "45min", 60],
    ["21", "Aug", "Beard Trim", "BOOKED", "Fri, 21 Aug 2026", "11:00am", "Walk-in", "30min", 35],
    ["21", "Aug", "Buzz Cut", "BOOKED", "Fri, 21 Aug 2026", "12:00pm", "Online Booking", "30min", 40],
    ["21", "Aug", "Line Up", "CANCELLED", "Fri, 21 Aug 2026", "1:00pm", "Walk-in", "20min", 25],
    ["22", "Aug", "Skin Fade", "BOOKED", "Sat, 22 Aug 2026", "10:00am", "Online Booking", "45min", 60],
    ["22", "Aug", "Taper Fade", "BOOKED", "Sat, 22 Aug 2026", "11:30am", "Online Booking", "45min", 55],
    ["22", "Aug", "Beard Trim", "BOOKED", "Sat, 22 Aug 2026", "2:00pm", "Walk-in", "30min", 35],
    ["23", "Aug", "Zero Fade", "BOOKED", "Sun, 23 Aug 2026", "9:30am", "Online Booking", "45min", 60],
  ].map(([day, month, serviceName, status, dateLabel, startTime, bookingSource, duration, price]) => ({
    day,
    month,
    serviceName,
    status,
    dateLabel,
    startTime,
    bookingSource,
    duration,
    staffMember: "Larry",
    price,
  })),
};

const topServices = {
  title: "Top Services",
  period: "Last 30 Days",
  services: [
    ["Skin Fade", 309, 8, "up", 32],
    ["Taper Fade", 276, 5, "up", 28],
    ["Zero Fade", 198, 3, "down", 20],
    ["Beard Trim", 154, 2, "up", 16],
    ["Buzz Cut", 128, 1, "up", 4],
    ["Line Up", 112, 4, "up", 3],
    ["Hot Towel Shave", 98, 2, "down", 3],
    ["Kids Cut", 87, 6, "up", 3],
    ["Design", 76, 1, "up", 2],
    ["Colour", 64, 3, "down", 2],
    ["Wash & Style", 52, 2, "up", 2],
  ].map(([serviceName, bookingCount, changePercent, trend, percentage]) => ({
    serviceName,
    bookingCount,
    changePercent,
    trend,
    percentage,
  })),
};

export function renderHomePage() {
  return `
    <div class="home-shell">
      <div id="mobile-nav" class="home-shell__mobile"></div>
      <div class="home-shell__rail" id="rail"></div>
      <div class="home-shell__stage">
        <div id="top-nav" class="home-shell__desktop"></div>
        <main class="home-shell__main">
          ${renderPageWrapper({
            content: `<div class="home-card-stack"><div class="home-card-row">${renderSessionsRecentSalesCard(recentSales)}${renderSessionsUpcomingAppointmentsCard(upcomingAppointments)}</div><div class="home-card-row">${renderSessionsAppointmentActivityCard(appointmentActivity)}${renderSessionsTopServicesCard(topServices)}</div></div>`,
          })}
        </main>
      </div>
    </div>
  `;
}

export function mountHomePage(root) {
  root.innerHTML = renderHomePage();
  root.querySelector("#top-nav").innerHTML = renderTopNav(navOptions);
  root.querySelector("#rail").innerHTML = renderSessionsLeftRail({
    selected: "home",
  });
  root.querySelector("#mobile-nav").innerHTML = renderMobileMenu(navOptions);
  bindMobileMenu(root);
}

function bindMobileMenu(root) {
  root.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-mobile-menu-toggle]");
    if (!toggle) return;

    event.preventDefault();
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    const nextExpanded = !expanded;
    toggle.setAttribute("aria-expanded", String(nextExpanded));
    toggle.setAttribute(
      "aria-label",
      nextExpanded
        ? toggle.dataset.closeLabel || "Close menu"
        : toggle.dataset.menuLabel || "Open menu",
    );

    const device = toggle.closest(".mobile-menu-device");
    device?.classList.toggle("is-open", nextExpanded);
    device
      ?.querySelector("[data-mobile-menu-panel]")
      ?.setAttribute("aria-hidden", String(!nextExpanded));
  });

  const mobileQuery = window.matchMedia("(max-width: 768px)");
  mobileQuery.addEventListener("change", (event) => {
    if (event.matches) return;

    root.querySelectorAll(".mobile-menu-device.is-open").forEach((device) => {
      device.classList.remove("is-open");
      const toggle = device.querySelector("[data-mobile-menu-toggle]");
      if (!toggle) return;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", toggle.dataset.menuLabel || "Open menu");
      device.querySelector("[data-mobile-menu-panel]")?.setAttribute("aria-hidden", "true");
    });
  });
}
