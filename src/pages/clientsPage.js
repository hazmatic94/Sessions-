import { renderPrimaryButton } from "/ds/src/components/button/button.js";
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
import { renderSessionsModal } from "/ds/src/components/modal/modal.js";
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
    titleExtra: renderSessionsChip({ label: String(CLIENTS.length), className: "sessions-chip--count" }),
    actions: renderPrimaryButton({ label: "Add", icon: "plus" }).replace("<button ", '<button data-sessions-add-client-open '),
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
            content: `<div class="clients-page">${renderClientsHeader()}${renderSessionsFilterBar()}${renderSessionsClientList({ rows: CLIENTS })}<p class="clients-results">Viewing 1 – ${CLIENTS.length} of ${CLIENTS.length} results</p></div>`,
          })}
        </main>
      </div>
      ${renderSessionsFooter()}
      ${renderSessionsClientProfileDrawer()}
      ${renderSessionsAddClientDrawer()}
      ${renderDeleteClientModal()}
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
  bindDeleteClient(root);
  root.addEventListener("input", (event) => {
    if (event.target.name !== "client-search") return;
    clientQuery = event.target.value;
    refreshClients(root);
  });
  root.addEventListener("sessions:filter-sort", (event) => {
    clientSort = event.detail.value;
    refreshClients(root);
  });
}

function renderDeleteClientModal() {
  const modal = renderSessionsModal({
    title: "Delete client",
    body: "Are you sure? This action cannot be undone.",
    secondaryLabel: "Cancel",
    primaryLabel: "Delete",
  })
    .replace('class="sessions-button sessions-button--secondary"', 'class="sessions-button sessions-button--secondary" data-sessions-delete-cancel')
    .replace('class="sessions-button sessions-button--primary"', 'class="sessions-button sessions-button--primary" data-sessions-delete-confirm')
    .replace('class="sessions-modal__close"', 'class="sessions-modal__close" data-sessions-delete-cancel');

  return `<div class="clients-delete" data-sessions-delete-client hidden><button class="clients-delete__scrim" type="button" data-sessions-delete-cancel aria-label="Cancel"></button>${modal}</div>`;
}

function refreshClients(root) {
  const rows = visibleClients();
  const list = root.querySelector(".sessions-client-list");
  if (list) list.outerHTML = renderSessionsClientList({ rows });
  const chip = root.querySelector(".clients-page .sessions-chip--count");
  if (chip) chip.textContent = String(CLIENTS.length);
  const results = root.querySelector(".clients-results");
  if (!results) return;
  const shown = rows.length;
  results.textContent = shown ? `Viewing 1 – ${shown} of ${CLIENTS.length} results` : "Viewing 0 results";
}

function bindDeleteClient(root) {
  let pendingName = "";
  const dialog = () => root.querySelector("[data-sessions-delete-client]");

  const closeDelete = () => {
    pendingName = "";
    const modal = dialog();
    if (modal) modal.hidden = true;
  };

  const confirmDelete = () => {
    const index = CLIENTS.findIndex((client) => client.name === pendingName);
    if (index >= 0) CLIENTS.splice(index, 1);
    refreshClients(root);
    const profile = root.querySelector("[data-sessions-client-profile]");
    const scrim = root.querySelector("[data-sessions-client-profile-scrim]");
    if (profile) profile.hidden = true;
    if (scrim) scrim.hidden = true;
    closeDelete();
  };

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-sessions-client-action='delete']");
    if (action) {
      pendingName = root.querySelector("[data-sessions-client-profile] .sessions-client-card__name")?.textContent.trim() || "";
      const modal = dialog();
      if (pendingName && modal) modal.hidden = false;
      return;
    }

    if (!dialog() || dialog().hidden) return;
    if (event.target.closest("[data-sessions-delete-confirm]")) {
      confirmDelete();
      return;
    }
    if (event.target.closest("[data-sessions-delete-cancel]")) closeDelete();
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !dialog() || dialog().hidden) return;
    event.stopPropagation();
    closeDelete();
  }, true);
}

let clientQuery = "";
let clientSort = "";

function clientMatches(client, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const compact = (value) => value.toLowerCase().replace(/\s/g, "");
  return (
    client.name.toLowerCase().includes(q) ||
    client.email.toLowerCase().includes(q) ||
    compact(client.phone).includes(compact(q))
  );
}

function visibleClients() {
  const rows = CLIENTS.filter((client) => clientMatches(client, clientQuery));
  return clientSort ? sortClients(rows, clientSort) : rows;
}

function sortClients(rows, value) {
  const next = [...rows];
  const firstName = (row) => row.name.split(" ")[0];
  const created = (row) => Date.parse(row.createdOn);

  if (value === "first-name-az") next.sort((a, b) => firstName(a).localeCompare(firstName(b)));
  if (value === "first-name-za") next.sort((a, b) => firstName(b).localeCompare(firstName(a)));
  if (value === "created-oldest") next.sort((a, b) => created(a) - created(b));
  if (value === "created-newest") next.sort((a, b) => created(b) - created(a));
  return next;
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
