import { renderPrimaryButton, renderSecondaryButton } from "/ds/src/components/button/button.js";
import { renderSessionsChip } from "/ds/src/components/chip/chip.js";
import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
  setupSessionsProfileMenu,
} from "/ds/src/components/navigation/index.js";
import { renderSessionsFilterBar, setupSessionsFilterBars } from "/ds/src/components/patterns/filterBar.js";
import { renderSessionsFooter } from "/ds/src/components/patterns/footer.js";
import { renderSessionsClientList } from "/ds/src/components/rows/clientListRow.js";
import { renderSessionsAddClientDrawer, setupSessionsAddClient } from "/ds/src/components/patterns/addClient.js";
import {
  renderSessionsClientProfileDrawer,
  setupSessionsClientProfiles,
} from "/ds/src/components/patterns/clientProfile.js";
import { renderPageTitle, renderPageWrapper } from "/src/components/pageWrapper.js";
import { linkPrimaryNav } from "/src/components/primaryNav.js";

const navOptions = {
  href: "/",
  ariaLabel: "Sessions home",
};

const CLIENTS = [
  {
    name: "Harry Maher",
    email: "harrymaherdesign@gmail.com",
    phone: "+61 461455500",
    sales: "A$ 5040",
    createdOn: "Jun 18, 2024",
    avatarInitial: "H",
  },
  {
    name: "Larry June",
    email: "larry@sessions.com",
    phone: "+61 400112233",
    sales: "A$ 1280",
    createdOn: "Aug 2, 2024",
    avatarSrc: "/assets/user.png",
  },
  {
    name: "Marcus Bell",
    email: "marcus@sessions.com",
    phone: "+61 411223344",
    sales: "A$ 760",
    createdOn: "Mar 9, 2025",
    avatarInitial: "M",
  },
  {
    name: "Sofia Reyes",
    email: "sofia@sessions.com",
    phone: "+61 422334455",
    sales: "A$ 2140",
    createdOn: "Jan 14, 2025",
    avatarInitial: "S",
  },
  {
    name: "Wendy Smith",
    email: "wendy@sessions.com",
    phone: "+61 433445566",
    sales: "A$ 540",
    createdOn: "Sep 28, 2024",
    avatarInitial: "W",
  },
  {
    name: "Ava Nguyen",
    email: "ava@sessions.com",
    phone: "+61 444556677",
    sales: "A$ 980",
    createdOn: "Nov 3, 2024",
    avatarInitial: "A",
  },
];

function renderClientsHeader() {
  return renderPageTitle({
    title: "Clients list",
    body: "View, add, edit and delete your client's details.",
    titleExtra: renderSessionsChip({ label: "402", className: "sessions-chip--count" }),
    actions: `${renderSecondaryButton({ label: "Options", icon: "chevron-down", iconPosition: "end" })}${renderPrimaryButton({ label: "Add", icon: "plus" }).replace("<button ", '<button data-sessions-add-client-open ')}`,
  });
}

export function renderClientsPage() {
  return `
    <div class="home-shell">
      <div id="mobile-nav" class="home-shell__mobile"></div>
      <div id="top-nav" class="home-shell__desktop"></div>
      <div class="home-shell__body">
        <div class="home-shell__rail" id="rail"></div>
        <main class="home-shell__main">
          ${renderPageWrapper({
            content: `<div class="clients-page">${renderClientsHeader()}${renderSessionsFilterBar()}${renderSessionsClientList({ rows: CLIENTS })}</div>`,
          })}
        </main>
      </div>
      ${renderSessionsFooter()}
      ${renderSessionsClientProfileDrawer()}
      ${renderSessionsAddClientDrawer()}
    </div>
  `;
}

export function mountClientsPage(root) {
  root.innerHTML = renderClientsPage();
  root.querySelector("#top-nav").innerHTML = renderTopNav(navOptions);
  setupSessionsProfileMenu(root);
  root.querySelector("#rail").innerHTML = renderSessionsLeftRail({
    selected: "clients",
  });
  root.querySelector("#mobile-nav").innerHTML = renderMobileMenu(navOptions);
  bindMobileMenu(root);
  linkPrimaryNav(root, { selected: "Clients" });
  setupSessionsFilterBars(root);
  setupSessionsClientProfiles(root, { clients: CLIENTS });
  setupSessionsAddClient(root);
  root.addEventListener("sessions:filter-sort", (event) => {
    const list = root.querySelector(".sessions-client-list");
    if (!list) return;
    list.outerHTML = renderSessionsClientList({ rows: sortClients(event.detail.value) });
  });
}

function sortClients(value) {
  const rows = [...CLIENTS];
  const firstName = (row) => row.name.split(" ")[0];
  const created = (row) => Date.parse(row.createdOn);

  if (value === "first-name-az") rows.sort((a, b) => firstName(a).localeCompare(firstName(b)));
  if (value === "first-name-za") rows.sort((a, b) => firstName(b).localeCompare(firstName(a)));
  if (value === "created-oldest") rows.sort((a, b) => created(a) - created(b));
  if (value === "created-newest") rows.sort((a, b) => created(b) - created(a));
  return rows;
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
