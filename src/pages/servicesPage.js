import { renderPrimaryButton, renderSecondaryButton } from "/ds/src/components/button/button.js";
import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
  setupSessionsProfileMenu,
} from "/ds/src/components/navigation/index.js";
import { renderSessionsAddServiceDrawer, setupSessionsAddService } from "/ds/src/components/patterns/addService.js";
import { renderSessionsFooter } from "/ds/src/components/patterns/footer.js";
import { renderSessionsServiceList, renderSessionsServiceListRow, setupSessionsServiceLists } from "/ds/src/components/rows/serviceListRow.js";
import { renderSessionsModal } from "/ds/src/components/modal/modal.js";
import { renderPageTitle, renderPageWrapper } from "/src/components/pageWrapper.js";
import { linkPrimaryNav } from "/src/components/primaryNav.js";

const navOptions = {
  href: "/",
  ariaLabel: "Sessions home",
};

const SERVICES_KEY = "sessions.services";

function storedServices() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SERVICES_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && String(item.name || "").trim());
  } catch {
    return [];
  }
}

function rememberServices(root) {
  const rows = [...root.querySelectorAll(".services-page .sessions-service-list__row:not(.sessions-service-list__head)")];
  try {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(rows.map(readServiceRow)));
  } catch {
    // ponytail: storage can be blocked; the list still lives for this page view
  }
}

export function renderServicesPage() {
  const services = storedServices();
  return `
    <div class="home-shell">
      <div id="mobile-nav" class="home-shell__mobile"></div>
      <div id="top-nav" class="home-shell__desktop"></div>
      <div class="home-shell__body">
        <div class="home-shell__rail" id="rail"></div>
        <main class="home-shell__main">
          ${renderPageWrapper({
            content: `<div class="services-page">${renderPageTitle({
              title: "Service menu",
              bodyMarkup: `<p class="sessions-page-header__body">View and manage the services offered by your business. <button type="button" class="page-title__link">Learn more</button></p>`,
              actions: `${renderSecondaryButton({ label: "Options", icon: "chevron-down", iconPosition: "end" })}${renderPrimaryButton({ label: "Add", icon: "plus" }).replace("<button ", '<button data-sessions-add-service-open ')}`,
            })}${services.length ? renderSessionsServiceList({ rows: services }) : renderServicesEmpty()}</div>`,
          })}
        </main>
      </div>
      ${renderSessionsFooter()}
      ${renderSessionsAddServiceDrawer()}
      <div class="sessions-modal-host" data-sessions-service-modal hidden>
        ${renderSessionsModal({
          title: "You have unsaved changes.",
          body: "If you close this now, the changes will be lost. Do you want to exit?",
          secondaryLabel: "Cancel",
          primaryLabel: "Yes exit",
        })}
      </div>
    </div>
  `;
}

function renderServicesEmpty() {
  return `<section class="services-empty">
    <img class="services-empty__icon" src="/assets/IconSearch.svg" alt="" />
    <h3 class="sessions-page-header__title">No services found</h3>
    <p class="sessions-page-header__body">Try adjusting your search criteria</p>
    ${renderSecondaryButton({ label: "Create new service" }).replace("<button ", '<button data-sessions-add-service-open ')}
  </section>`;
}

export function mountServicesPage(root) {
  root.innerHTML = renderServicesPage();
  root.querySelector("#top-nav").innerHTML = renderTopNav(navOptions);
  setupSessionsProfileMenu(root);
  root.querySelector("#rail").innerHTML = renderSessionsLeftRail({
    selected: "services",
  });
  root.querySelector("#mobile-nav").innerHTML = renderMobileMenu(navOptions);
  bindMobileMenu(root);
  linkPrimaryNav(root, { selected: "Services" });
  setupSessionsAddService(root);
  setupSessionsServiceLists(root);
  bindServiceCreate(root);
  bindServiceModal(root);
}

function bindServiceCreate(root) {
  root.addEventListener("click", (event) => {
    const save = event.target.closest("[data-sessions-add-service-continue]");
    if (!save || save.disabled) return;
    const form = root.querySelector("[data-sessions-add-service-form]");
    if (!form) return;
    const data = new FormData(form);
    const duration = form.querySelector("#add-service-duration");
    const service = {
      name: String(data.get("serviceName") || "").trim(),
      description: String(data.get("description") || ""),
      duration: duration?.selectedOptions[0]?.textContent || "",
      priceType: String(data.get("priceType") || "fixed"),
      price: String(data.get("price") || "0.00"),
    };
    if (editingRow?.isConnected) {
      editingRow.outerHTML = renderSessionsServiceListRow(service);
      editingRow = null;
    } else {
      addServiceRow(root, service);
    }
    rememberServices(root);
    form.reset();
    root.querySelectorAll("[data-sessions-add-service] .sessions-add-service__counted").forEach((counted) => {
      const field = counted.querySelector(".sessions-input__field");
      const count = counted.querySelector("[data-sessions-add-service-count]");
      if (field && count && field.maxLength >= 0) count.textContent = `0/${field.maxLength}`;
    });
    root.querySelector("[data-sessions-add-service-close]")?.click();
  });
}

let editingRow = null;
let pendingDeleteRow = null;
let allowServiceClose = false;
let openingForEdit = false;

function bindServiceModal(root) {
  const host = root.querySelector("[data-sessions-service-modal]");

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-sessions-add-service-open]") && !openingForEdit) {
      editingRow = null;
      resetServiceForm(root);
    }
  }, true);

  root.addEventListener("click", (event) => {
    if (!event.target.closest("[data-sessions-add-service-close], [data-sessions-add-service-scrim]")) return;
    const drawer = root.querySelector("[data-sessions-add-service]");
    if (!drawer || drawer.hidden || allowServiceClose || !serviceFormDirty(root)) {
      allowServiceClose = false;
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    openServiceModal(root, "discard");
  }, true);

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (host && !host.hidden) {
      event.stopPropagation();
      host.hidden = true;
      return;
    }
    const drawer = root.querySelector("[data-sessions-add-service]");
    if (!drawer || drawer.hidden || !serviceFormDirty(root)) return;
    event.stopPropagation();
    openServiceModal(root, "discard");
  }, true);

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-sessions-service-action]");
    if (!action) return;
    const kind = action.getAttribute("data-sessions-service-action");
    const row = action.closest(".sessions-service-list__row");
    if (kind === "edit" && row) {
      editingRow = row;
      openingForEdit = true;
      fillServiceForm(root, readServiceRow(row));
      root.querySelector("[data-sessions-add-service-open]")?.click();
      openingForEdit = false;
      return;
    }
    if (kind === "delete" && row) {
      pendingDeleteRow = row;
      openServiceModal(root, "delete");
    }
  });

  host?.addEventListener("click", (event) => {
    if (event.target === host || event.target.closest(".sessions-modal__close, .sessions-modal__actions .sessions-button--secondary")) {
      host.hidden = true;
      pendingDeleteRow = null;
      return;
    }
    if (!event.target.closest(".sessions-modal__actions .sessions-button--primary")) return;
    host.hidden = true;
    if (host.dataset.modalKind === "delete") {
      removeServiceRow(root, pendingDeleteRow);
      pendingDeleteRow = null;
      return;
    }
    allowServiceClose = true;
    editingRow = null;
    resetServiceForm(root);
    root.querySelector("[data-sessions-add-service-close]")?.click();
    allowServiceClose = false;
  });
}

function openServiceModal(root, kind) {
  const host = root.querySelector("[data-sessions-service-modal]");
  if (!host) return;
  host.dataset.modalKind = kind;
  const title = host.querySelector(".sessions-modal__title");
  const body = host.querySelector(".sessions-modal__body");
  const primary = host.querySelector(".sessions-modal__actions .sessions-button--primary .sessions-button__label");
  if (kind === "delete") {
    if (title) title.textContent = "Permanently delete service";
    if (body) body.textContent = "Are you sure you want to delete this service?";
    if (primary) primary.textContent = "Delete";
  } else {
    if (title) title.textContent = "You have unsaved changes.";
    if (body) body.textContent = "If you close this now, the changes will be lost. Do you want to exit?";
    if (primary) primary.textContent = "Yes exit";
  }
  host.hidden = false;
}

function readServiceRow(row) {
  return {
    name: row.dataset.serviceName || "",
    description: row.dataset.serviceDescription || "",
    duration: row.dataset.serviceDuration || "",
    priceType: row.dataset.servicePriceType || "fixed",
    price: row.dataset.servicePrice || "0.00",
  };
}

function currentService(root) {
  const form = root.querySelector("[data-sessions-add-service-form]");
  const data = new FormData(form);
  const duration = form.querySelector("#add-service-duration");
  return {
    name: String(data.get("serviceName") || "").trim(),
    description: String(data.get("description") || "").trim(),
    duration: duration?.selectedOptions[0]?.textContent || "",
    priceType: String(data.get("priceType") || "fixed"),
    price: Number(data.get("price") || 0).toFixed(2),
  };
}

function serviceFormDirty(root) {
  const current = currentService(root);
  const saved = editingRow
    ? readServiceRow(editingRow)
    : { name: "", description: "", duration: "1 hr", priceType: "fixed", price: "0.00" };
  saved.price = Number(saved.price || 0).toFixed(2);
  return ["name", "description", "duration", "priceType", "price"].some((key) => current[key] !== saved[key]);
}

function fillServiceForm(root, service) {
  const form = root.querySelector("[data-sessions-add-service-form]");
  if (!form) return;
  form.serviceName.value = service.name;
  form.description.value = service.description;
  form.priceType.value = service.priceType;
  form.price.value = Number(service.price || 0).toFixed(2);
  const duration = form.querySelector("#add-service-duration");
  const option = [...(duration?.options || [])].find((item) => item.textContent === service.duration);
  if (option) duration.value = option.value;
  syncServiceCounts(root);
}

function resetServiceForm(root) {
  root.querySelector("[data-sessions-add-service-form]")?.reset();
  syncServiceCounts(root);
}

function syncServiceCounts(root) {
  root.querySelectorAll("[data-sessions-add-service] .sessions-add-service__counted").forEach((counted) => {
    const field = counted.querySelector(".sessions-input__field");
    const count = counted.querySelector("[data-sessions-add-service-count]");
    if (field && count && field.maxLength >= 0) count.textContent = `${field.value.length}/${field.maxLength}`;
  });
}

function removeServiceRow(root, row) {
  const list = row?.closest(".sessions-service-list");
  row?.remove();
  if (!list?.querySelector(".sessions-service-list__row:not(.sessions-service-list__head)")) {
    list?.remove();
    root.querySelector(".services-page")?.insertAdjacentHTML("beforeend", renderServicesEmpty());
  }
  rememberServices(root);
}

function addServiceRow(root, service) {
  const page = root.querySelector(".services-page");
  const list = page?.querySelector(".sessions-service-list");
  if (!page) return;
  if (!list) {
    page.querySelector(".services-empty")?.remove();
    page.insertAdjacentHTML("beforeend", renderSessionsServiceList({ rows: [service] }));
    return;
  }
  list.insertAdjacentHTML("beforeend", renderSessionsServiceListRow(service));
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
