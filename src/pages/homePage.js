import { renderSessionsRecentSalesCard } from "/ds/src/components/cards/index.js";
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

export function renderHomePage() {
  return `
    <div class="home-shell">
      <div id="mobile-nav" class="home-shell__mobile"></div>
      <div class="home-shell__rail" id="rail"></div>
      <div class="home-shell__stage">
        <div id="top-nav" class="home-shell__desktop"></div>
        <main class="home-shell__main">
          ${renderPageWrapper({
            content: renderSessionsRecentSalesCard(recentSales),
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
