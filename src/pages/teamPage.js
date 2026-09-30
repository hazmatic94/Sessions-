import { renderPrimaryButton, renderSecondaryButton } from "/ds/src/components/button/button.js";
import { renderSessionsChip } from "/ds/src/components/chip/chip.js";
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

function renderTeamHeader() {
  return renderPageTitle({
    title: "Team members",
    body: "View, add, edit and delete your team's details.",
    titleExtra: renderSessionsChip({ label: String(TEAM.length) }),
    actions: `${renderSecondaryButton({ label: "Options", icon: "chevron-down", iconPosition: "end" })}${renderPrimaryButton({ label: "Add", icon: "plus" })}`,
  });
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
            content: `<div class="team-page">${renderTeamHeader()}${renderSessionsFilterBar({
              placeholder: "Search team members",
              name: "team-search",
              filtersLabel: "Filters",
              sortLabel: "Custom order",
              sortOptions: [],
            })}${renderSessionsTeamList({ rows: TEAM })}</div>`,
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
