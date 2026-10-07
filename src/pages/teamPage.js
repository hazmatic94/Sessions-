import { renderSessionsAvatar } from "/ds/src/components/avatar/avatar.js";
import { renderPrimaryButton } from "/ds/src/components/button/button.js";
import { renderSessionsChip } from "/ds/src/components/chip/chip.js";
import { applySessionsTabSelection } from "/ds/src/components/tabs/interactions.js";
import { renderSessionsTabs } from "/ds/src/components/tabs/tabs.js";
import { escapeHtml } from "/ds/src/utils.js";
import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
  setupSessionsProfileMenu,
} from "/ds/src/components/navigation/index.js";
import { renderSessionsFilterBar } from "/ds/src/components/patterns/filterBar.js";
import { renderSessionsFooter } from "/ds/src/components/patterns/footer.js";
import { renderSessionsTeamList, setupSessionsTeamLists } from "/ds/src/components/rows/teamMemberRow.js";
import { renderPageTitle, renderPageWrapper } from "/src/components/pageWrapper.js";
import { linkPrimaryNav } from "/src/components/primaryNav.js";

const navOptions = {
  href: "/",
  ariaLabel: "Sessions home",
};

const TEAM = [
  {
    name: "Trend Freak",
    email: "trendfreakhub@gmail.com",
    phone: "+61 461 455 500",
    role: "Workspace owner",
    avatarInitial: "T",
  },
  {
    name: "Wendy Smith (Demo)",
    role: "No access",
    avatarInitial: "W",
  },
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

// ponytail: every weekday is the same 9–6 shift; per-person hours come later
const SHIFT_LABEL = "9 AM – 6 PM";
const SHIFT_HOURS = 9;

function renderTeamHeader() {
  return renderPageTitle({
    title: VIEW_COPY.members.title,
    body: VIEW_COPY.members.body,
    titleExtra: renderSessionsChip({ label: String(TEAM.length), className: "sessions-chip--count" }),
    actions: renderPrimaryButton({ label: "Add", icon: "plus" }),
  });
}

function weekdayDates(from = new Date()) {
  const monday = new Date(from);
  monday.setHours(12, 0, 0, 0);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  return Array.from({ length: 5 }, (_, index) => {
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

function renderShiftRow(member) {
  const avatar = renderSessionsAvatar({
    src: member.avatarSrc,
    name: member.name,
    initial: member.avatarInitial || member.name,
    size: "small",
  });
  const shifts = Array.from({ length: 5 }, () => `<span class="team-shifts__shift">${SHIFT_LABEL}</span>`).join("");
  return `<div class="team-shifts__row"><div class="sessions-list__person team-shifts__member">${avatar}<div class="team-shifts__who"><p class="sessions-team-list__name">${escapeHtml(member.name)}</p><p class="team-shifts__total">${SHIFT_HOURS * 5} hr</p></div></div>${shifts}</div>`;
}

function renderShifts() {
  const days = weekdayDates();
  const dayTotal = `${SHIFT_HOURS * TEAM.length} hr`;
  const headings = days
    .map((date) => `<span class="team-shifts__day">${formatDay(date)}<span class="team-shifts__hours">${dayTotal}</span></span>`)
    .join("");
  const start = days[0].toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  const end = days[4].toLocaleDateString("en-AU", { day: "numeric", month: "short" });

  return `<div class="team-shifts" data-team-panel="shifts" hidden><p class="team-shifts__meta">This week · ${start} – ${end}</p><div class="team-shifts__scroll"><div class="team-shifts__grid"><div class="team-shifts__row team-shifts__head"><span>Team member</span>${headings}</div>${TEAM.map(renderShiftRow).join("")}</div></div></div>`;
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
            content: `<div class="team-page" data-team-view="members">${renderTeamHeader()}${renderSessionsTabs({
              className: "team-page__switch",
              tabs: [
                { label: "Team members", value: "members", selected: true },
                { label: "Scheduled shifts", value: "shifts" },
              ],
            })}<div data-team-panel="members">${renderSessionsFilterBar({
              placeholder: "Search team members",
              name: "team-search",
              sortLabel: "Custom order",
              sortOptions: [],
            })}${renderSessionsTeamList({ rows: TEAM })}</div>${renderShifts()}</div>`,
          })}
        </main>
      </div>
      ${renderSessionsFooter()}
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
  bindTeamView(root);
}

function showTeamView(page, view) {
  const copy = VIEW_COPY[view] ?? VIEW_COPY.members;
  page.dataset.teamView = copy === VIEW_COPY.shifts ? "shifts" : "members";
  page.querySelectorAll("[data-team-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.teamPanel !== page.dataset.teamView;
  });
  page.querySelector(".sessions-page-header__title").textContent = copy.title;
  page.querySelector(".sessions-page-header__body").textContent = copy.body;
  applySessionsTabSelection(page.querySelector(".team-page__switch"), page.dataset.teamView);
}

function bindTeamView(root) {
  const page = root.querySelector(".team-page");
  page.addEventListener("click", (event) => {
    const tab = event.target.closest(".team-page__switch [role='tab']");
    if (tab) showTeamView(page, tab.dataset.tabValue);
  });
  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-sessions-team-action='shifts']")) showTeamView(page, "shifts");
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
