import { renderGhostButton, renderSessionsButton } from "/ds/src/components/button/button.js";
import { renderSessionsInput } from "/ds/src/components/input/input.js";
import { renderSessionsAddClientSurfaceContent } from "/ds/src/components/patterns/addClient.js";
import { renderSessionsPageHeader } from "/ds/src/components/patterns/pageHeader.js";
import { renderSessionsMenuDivider } from "/ds/src/components/menu/index.js";
import { renderSessionsClientCard } from "/ds/src/components/cards/clientCard.js";
import { renderSessionsClientRow } from "/ds/src/components/rows/clientRow.js";
import { renderSessionsSearch } from "/ds/src/components/search/search.js";
import { renderSessionsSelector } from "/ds/src/components/selector/selector.js";
import { runSurfaceStepTransition } from "/ds/src/components/patterns/surfaceSteps.js";
import { renderSessionsSurface } from "/ds/src/components/patterns/surface.js";
import { escapeHtml } from "/ds/src/utils.js";
import { listClientsForBooking } from "/src/data/clients.js";
import {
  appendService,
  formatServicePrice,
  listServicesForBooking,
  readServiceFromForm,
} from "/src/data/services.js";

const BOOKING_PANELS = ["client", "add-client", "service", "add-service", "summary"];

const PANEL_LABELS = {
  client: "Select a client",
  "add-client": "Add new client",
  service: "Select a service",
  "add-service": "Service details",
  summary: "Appointment",
};

function isDesktop() {
  return window.matchMedia("(min-width: 769px)").matches;
}

function filterClients(query) {
  const needle = query.trim().toLowerCase();
  const clients = listClientsForBooking();
  if (!needle) return clients;
  return clients.filter(
    (client) =>
      client.name.toLowerCase().includes(needle) || client.email.toLowerCase().includes(needle),
  );
}

function renderPickerClientRow(client) {
  return renderSessionsClientRow({
    name: client.name,
    email: client.email,
    avatarSrc: client.avatarSrc,
    avatarInitial: client.avatarInitial,
  }).replace("<button ", `<button data-calendar-client-pick="${escapeHtml(client.email)}" `);
}

function renderPickerList(query = "") {
  const rows = filterClients(query).map((client) => renderPickerClientRow(client)).join("");
  return `<div class="sessions-client-row-list calendar-client-picker__list" data-calendar-client-picker-list>${rows}</div>`;
}

function renderServiceEmpty() {
  return `<section class="services-empty calendar-service-picker__empty">
    <img class="services-empty__icon" src="/assets/IconSearch.svg" alt="" />
    <h3 class="sessions-page-header__title">No services found</h3>
    <p class="sessions-page-header__body">You don't have any services added yet.</p>
  </section>`;
}

function renderServiceCard(service, index) {
  const duration = String(service.duration || "").replace(/(\d+)\s+min/g, "$1min");
  return renderSessionsSelector({
    id: String(index),
    name: service.name,
    duration,
    priceLabel: formatServicePrice(service.priceType, service.price),
  }).replace("data-sessions-selector", `data-sessions-selector data-calendar-service-pick="${index}"`);
}

function renderServiceList() {
  const services = listServicesForBooking();
  if (!services.length) return renderServiceEmpty();
  return `<div class="sessions-selector-list">${services.map((service, index) => renderServiceCard(service, index)).join("")}</div>`;
}

function renderServicePanel() {
  const back = renderGhostButton({
    label: "Back",
    icon: "chevron-left",
    className: "sessions-client-edit__back",
  }).replace("<button ", '<button type="button" data-calendar-booking-service-back ');
  const add = renderSessionsButton({
    variant: "secondary",
    label: "Add new service",
    icon: "plus",
  }).replace("<button ", '<button data-calendar-booking-service-add ');

  return `<div class="calendar-client-picker__panel sessions-surface-step-panel" data-calendar-booking-service-panel hidden><div class="sessions-notifications sessions-surface-step calendar-booking-step"><div class="sessions-client-edit__nav">${back}</div><div class="sessions-notifications__heading"><h2 class="calendar-client-picker__title">Select a service</h2></div><div class="calendar-service-picker__body" data-calendar-booking-service-list-host>${renderServiceList()}</div><div class="calendar-service-picker__add">${add}</div></div></div>`;
}

function renderBookingServiceSelect({ label, name, id, value, options }) {
  const items = options
    .map(([optionValue, optionLabel]) => {
      const selected = optionValue === value ? " selected" : "";
      return `<option value="${optionValue}"${selected}>${optionLabel}</option>`;
    })
    .join("");
  return `<label class="sessions-input sessions-add-service__select"><span class="sessions-input__label">${label}</span><span class="sessions-input__control"><select class="sessions-input__field" name="${name}" id="${id}" data-calendar-booking-service-duration>${items}</select></span></label>`;
}

function renderAddServicePanel() {
  const back = renderGhostButton({
    label: "Back",
    icon: "chevron-left",
    className: "sessions-client-edit__back",
  }).replace("<button ", '<button type="button" data-calendar-booking-add-service-back ');
  const name = renderSessionsInput({
    label: "Service name",
    placeholder: "Add a service name",
    name: "serviceName",
    id: "calendar-booking-service-name",
    fullWidth: true,
  });
  const priceType = renderBookingServiceSelect({
    label: "Price type",
    name: "priceType",
    id: "calendar-booking-service-price-type",
    value: "fixed",
    options: [
      ["fixed", "Fixed"],
      ["free", "Free"],
      ["from", "From"],
    ],
  });
  const price = `<label class="sessions-input sessions-add-service__price"><span class="sessions-input__label">Price</span><span class="sessions-input__control"><span class="sessions-add-service__prefix">A$</span><input class="sessions-input__field" name="price" id="calendar-booking-service-price" inputmode="decimal" value="60.00" data-calendar-booking-service-price /><span class="sessions-add-service__stepper"><button type="button" data-calendar-booking-service-price-step="1" aria-label="Increase price"><img src="/assets/IconChevronUp.svg" alt="" /></button><button type="button" data-calendar-booking-service-price-step="-1" aria-label="Decrease price"><img src="/assets/IconChevronDown.svg" alt="" /></button></span></span></label>`;
  const duration = renderBookingServiceSelect({
    label: "Duration",
    name: "duration",
    id: "calendar-booking-service-duration",
    value: "45",
    options: [
      ["15", "15 min"],
      ["30", "30 min"],
      ["45", "45 min"],
      ["60", "1 hr"],
      ["90", "1 hr 30 min"],
      ["120", "2 hr"],
    ],
  });
  const cancel = renderSessionsButton({ variant: "secondary", label: "Cancel" }).replace(
    "<button ",
    '<button type="button" data-calendar-booking-add-service-back ',
  );
  const save = renderSessionsButton({
    variant: "primary",
    label: "Save",
    type: "submit",
    disabled: true,
  }).replace("<button ", '<button form="calendar-booking-add-service-form" data-calendar-booking-save-service ');
  const form = `<form class="sessions-add-client__form" id="calendar-booking-add-service-form" data-calendar-booking-add-service-form>${name}${priceType}${price}${duration}<div class="sessions-add-client__actions sessions-add-client__actions--inline">${cancel}${save}</div></form>`;

  return `<div class="calendar-client-picker__panel sessions-surface-step-panel" data-calendar-booking-add-service-panel hidden><div class="sessions-notifications sessions-surface-step calendar-booking-step" data-calendar-booking-add-service-body><div class="sessions-client-edit__nav">${back}</div><div class="sessions-notifications__heading">${renderSessionsPageHeader({
    title: "Service details",
    body: "Add your new service details here",
  })}</div>${form}</div></div>`;
}

function renderAddClientPanel() {
  return `<div class="calendar-client-picker__panel sessions-surface-step-panel" data-calendar-client-picker-add-panel data-sessions-add-client hidden>${renderSessionsAddClientSurfaceContent({
    closeAttribute: "data-calendar-client-picker-back",
    formId: "calendar-booking-add-client-form",
    formAttribute: "data-calendar-booking-add-client-form",
    idPrefix: "calendar-booking-add-client",
    navClassName: "sessions-client-edit__nav",
    backClassName: "sessions-client-edit__back",
    inlineActions: true,
  })}</div>`;
}

function formatBookingDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const weekday = date.toLocaleDateString("en-AU", { weekday: "short" });
  const month = date.toLocaleDateString("en-AU", { month: "short" });
  return `${weekday} ${date.getDate()} ${month}`;
}

function renderSummaryBody(booking) {
  const client = booking.client ?? {};
  const service = booking.service ?? {};
  const card = renderSessionsClientCard({
    name: client.name || "Walk in",
    email: client.email || "Walk-in",
    avatarSrc: client.avatarSrc,
    avatarInitial: client.avatarInitial,
    editProfileLabel: "Edit profile",
  });
  const selected = service.name
    ? renderSessionsSelector({
        name: service.name,
        duration: String(service.duration || "").replace(/(\d+)\s+min/g, "$1min"),
        priceLabel: formatServicePrice(service.priceType, service.price),
        interactive: false,
      })
    : "";
  const add = renderSessionsButton({
    variant: "secondary",
    label: "Add new service",
    icon: "plus",
  }).replace("<button ", '<button data-calendar-booking-service-add ');
  const price = formatServicePrice(service.priceType, service.price);

  return `<div class="calendar-booking-summary__when"><button class="calendar-booking-summary__date" type="button" data-calendar-booking-date>${escapeHtml(formatBookingDate(booking.date))}<img src="/assets/IconChevronDown.svg" width="20" height="20" alt="" /></button><p class="calendar-booking-summary__time">${escapeHtml(booking.time || "")}</p></div>${card}<section class="calendar-booking-summary__service"><h3 class="calendar-booking-summary__label">Service</h3>${selected}<div class="calendar-service-picker__add">${add}</div></section>${renderSessionsMenuDivider()}<button class="calendar-booking-summary__pay" type="button" data-calendar-booking-to-pay><span>To pay</span><img src="/assets/IconCehvronRight.svg" width="20" height="20" alt="" /><strong>${escapeHtml(price)}</strong></button>`;
}

function renderSummaryPanel() {
  const more = renderSessionsButton({
    variant: "secondary",
    iconSrc: "/assets/IconMore.svg",
    ariaLabel: "More actions",
  }).replace("<button ", '<button data-calendar-booking-more ');
  const book = renderSessionsButton({ variant: "secondary", label: "Book in" }).replace(
    "<button ",
    '<button data-calendar-booking-book ',
  );
  const pay = renderSessionsButton({ variant: "primary", label: "Pay now" }).replace(
    "<button ",
    '<button data-calendar-booking-pay ',
  );

  return `<div class="calendar-client-picker__panel sessions-surface-step-panel" data-calendar-booking-summary-panel hidden><div class="calendar-booking-summary"><div class="calendar-booking-summary__scroll" data-calendar-booking-summary-host></div><div class="calendar-booking-summary__footer">${more}${book}${pay}</div></div></div>`;
}

function renderListPanel() {
  const search = renderSessionsSearch({
    placeholder: "Name, email or phone",
    name: "client-search",
    ariaLabel: "Search clients",
  }).replace("<input ", '<input data-calendar-client-picker-search ');
  const addNew = renderSessionsClientRow({ variant: "add", label: "Add new client" }).replace(
    "<button ",
    '<button data-calendar-client-add ',
  );
  const walkIn = renderSessionsClientRow({ variant: "walk-in", label: "Walk in" }).replace(
    "<button ",
    '<button data-calendar-client-walk-in ',
  );

  return `<div class="calendar-client-picker__panel sessions-surface-step-panel is-step-active" data-calendar-client-picker-list-panel><div class="sessions-notifications calendar-client-picker"><div class="calendar-client-picker__intro"><h2 class="calendar-client-picker__title">Select a client</h2>${search}</div><div class="calendar-client-picker__actions">${addNew}${walkIn}</div>${renderSessionsMenuDivider()}<div class="calendar-client-picker__list-wrap">${renderPickerList()}</div></div></div>`;
}

export function renderCalendarClientPicker() {
  const close = renderSessionsButton({
    variant: "secondary",
    icon: "close",
    ariaLabel: "Close client picker",
    className: "sessions-surface-close",
  }).replace("<button ", '<button data-calendar-client-picker-close ');

  return `<div class="sessions-surface-scrim" data-calendar-client-picker-scrim hidden></div><div class="sessions-surface-drawer" data-calendar-client-picker role="dialog" aria-label="Select a client" hidden>${close}${renderSessionsSurface({ children: `<div class="sessions-surface-steps">${renderListPanel()}${renderAddClientPanel()}${renderServicePanel()}${renderAddServicePanel()}${renderSummaryPanel()}</div>` })}</div>`;
}

let pickerStepAnimating = false;
let addServiceReturn = "service";

function panelEl(root, panel) {
  const map = {
    client: "[data-calendar-client-picker-list-panel]",
    "add-client": "[data-calendar-client-picker-add-panel]",
    service: "[data-calendar-booking-service-panel]",
    "add-service": "[data-calendar-booking-add-service-panel]",
    summary: "[data-calendar-booking-summary-panel]",
  };
  return root.querySelector(map[panel]);
}

function activePanel(root) {
  const panel = root.querySelector("[data-calendar-client-picker] .sessions-surface-step-panel.is-step-active");
  if (!panel) return "client";
  if (panel.matches("[data-calendar-client-picker-add-panel]")) return "add-client";
  if (panel.matches("[data-calendar-booking-service-panel]")) return "service";
  if (panel.matches("[data-calendar-booking-add-service-panel]")) return "add-service";
  if (panel.matches("[data-calendar-booking-summary-panel]")) return "summary";
  return "client";
}

function resetPickerPanels(root) {
  const steps = root.querySelector("[data-calendar-client-picker] .sessions-surface-steps");
  steps?.classList.remove("is-transitioning");
  for (const panel of BOOKING_PANELS) {
    const el = panelEl(root, panel);
    if (!el) continue;
    const isClient = panel === "client";
    el.hidden = !isClient;
    el.classList.toggle("is-step-active", isClient);
    el.classList.remove(
      "is-step-exit-to-left",
      "is-step-exit-to-right",
      "is-step-enter-from-left",
      "is-step-enter-from-right",
    );
  }
  root.querySelector("[data-calendar-client-picker]")?.setAttribute("aria-label", PANEL_LABELS.client);
}

async function goToBookingPanel(root, panel, { animate = true, direction } = {}) {
  const steps = root.querySelector("[data-calendar-client-picker] .sessions-surface-steps");
  const to = panelEl(root, panel);
  const from = root.querySelector("[data-calendar-client-picker] .sessions-surface-step-panel.is-step-active");
  const drawer = root.querySelector("[data-calendar-client-picker]");
  if (!to || !drawer) return;
  if (from === to) return;

  drawer.setAttribute("aria-label", PANEL_LABELS[panel] || PANEL_LABELS.client);

  if (pickerStepAnimating) return;

  const forward =
    direction === "forward" ||
    (direction !== "back" &&
      BOOKING_PANELS.indexOf(panel) > BOOKING_PANELS.indexOf(activePanel(root)));

  if (!animate || !steps) {
    for (const key of BOOKING_PANELS) {
      const el = panelEl(root, key);
      if (!el) continue;
      const isActive = key === panel;
      el.hidden = !isActive;
      el.classList.toggle("is-step-active", isActive);
    }
    return;
  }

  if (!from) {
    to.hidden = false;
    to.classList.add("is-step-active");
    return;
  }

  pickerStepAnimating = true;
  await runSurfaceStepTransition(steps, from, to, forward ? "forward" : "back");
  pickerStepAnimating = false;
}

function resetAddClientForm(root) {
  root.querySelector("[data-calendar-booking-add-client-form]")?.reset();
}

function resetAddServiceForm(root) {
  const form = root.querySelector("[data-calendar-booking-add-service-form]");
  form?.reset();
  syncBookingAddServiceSave(root);
}

function syncBookingAddServiceSave(root) {
  const button = root.querySelector("[data-calendar-booking-save-service]");
  const name = root.querySelector("#calendar-booking-service-name");
  if (button) button.disabled = !name?.value.trim();
}

function mergePendingBooking(root, patch) {
  const current = JSON.parse(root.dataset.calendarPendingBooking || "{}");
  root.dataset.calendarPendingBooking = JSON.stringify({ ...current, ...patch });
}

function setPickerOpen(root, open, { resetPending = false } = {}) {
  const drawer = root.querySelector("[data-calendar-client-picker]");
  const scrim = root.querySelector("[data-calendar-client-picker-scrim]");
  if (drawer) drawer.hidden = !open;
  if (scrim) scrim.hidden = !open;
  if (!open) {
    if (resetPending) delete root.dataset.calendarPendingBooking;
    resetPickerPanels(root);
    resetAddClientForm(root);
    resetAddServiceForm(root);
    const search = root.querySelector("[data-calendar-client-picker-search]");
    if (search) search.value = "";
    const list = root.querySelector("[data-calendar-client-picker-list]");
    if (list) list.outerHTML = renderPickerList();
  } else {
    resetPickerPanels(root);
  }
}

function paintPickerList(root, query = "") {
  const host = root.querySelector("[data-calendar-client-picker-list]");
  if (!host) return;
  host.outerHTML = renderPickerList(query);
}

function paintServiceList(root) {
  const host = root.querySelector("[data-calendar-booking-service-list-host]");
  if (!host) return;
  host.innerHTML = renderServiceList();
}

function clearCalendarSlotSelection(root) {
  root.querySelectorAll(".sessions-hour-column__slot.is-selected").forEach((slot) => {
    slot.classList.remove("is-selected");
  });
}

function pendingBooking(root) {
  try {
    return JSON.parse(root.dataset.calendarPendingBooking || "{}");
  } catch {
    return {};
  }
}

function paintSummary(root) {
  const host = root.querySelector("[data-calendar-booking-summary-host]");
  if (!host) return;
  host.innerHTML = renderSummaryBody(pendingBooking(root));
}

function selectService(root, service) {
  mergePendingBooking(root, { service });
  paintSummary(root);
  goToBookingPanel(root, "summary", { direction: "forward" });
}

function selectClient(root, client) {
  mergePendingBooking(root, { client });
  paintServiceList(root);
  goToBookingPanel(root, "service", { direction: "forward" });
}

export function bindCalendarClientPicker(root) {
  const openPicker = (detail) => {
    if (!isDesktop()) return;
    const date = root.querySelector("[data-sessions-navigator]")?.dataset.sessionsNavigatorValue ?? "";
    root.dataset.calendarPendingBooking = JSON.stringify({ ...(detail ?? {}), date });
    paintPickerList(root, "");
    paintServiceList(root);
    const search = root.querySelector("[data-calendar-client-picker-search]");
    if (search) search.value = "";
    setPickerOpen(root, true);
  };

  root.addEventListener("sessions:slot-booking", (event) => {
    if (event.detail?.action !== "appointment") return;
    if (!isDesktop()) return;
    openPicker(event.detail);
  });

  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-calendar-client-picker-search]")) {
      paintPickerList(root, event.target.value);
      return;
    }
    if (event.target.matches("#calendar-booking-service-name")) syncBookingAddServiceSave(root);
  });

  root.addEventListener("submit", (event) => {
    if (event.target.matches("[data-calendar-booking-add-client-form]")) {
      event.preventDefault();
      goToBookingPanel(root, "client", { direction: "back" });
      paintPickerList(root, root.querySelector("[data-calendar-client-picker-search]")?.value ?? "");
      return;
    }
    if (event.target.matches("[data-calendar-booking-add-service-form]")) {
      event.preventDefault();
      const service = readServiceFromForm(event.target);
      if (!service?.name) return;
      appendService(service);
      resetAddServiceForm(root);
      paintServiceList(root);
      if (addServiceReturn === "summary") {
        mergePendingBooking(root, { service });
        paintSummary(root);
      }
      goToBookingPanel(root, addServiceReturn, { direction: "back" });
    }
  });

  root.addEventListener("click", (event) => {
    const drawer = root.querySelector("[data-calendar-client-picker]");
    if (!drawer || drawer.hidden) return;

    if (event.target.closest("[data-calendar-client-picker-close], [data-calendar-client-picker-scrim]")) {
      event.preventDefault();
      setPickerOpen(root, false, { resetPending: true });
      clearCalendarSlotSelection(root);
      return;
    }

    if (event.target.closest("[data-calendar-client-picker-back]")) {
      event.preventDefault();
      goToBookingPanel(root, "client", { direction: "back" });
      return;
    }

    if (event.target.closest("[data-calendar-booking-service-back]")) {
      event.preventDefault();
      goToBookingPanel(root, "client", { direction: "back" });
      return;
    }

    if (event.target.closest("[data-calendar-booking-add-service-back]")) {
      event.preventDefault();
      goToBookingPanel(root, addServiceReturn, { direction: "back" });
      return;
    }

    if (event.target.closest("[data-calendar-booking-book], [data-calendar-booking-pay]")) {
      event.preventDefault();
      setPickerOpen(root, false, { resetPending: true });
      clearCalendarSlotSelection(root);
      return;
    }

    if (event.target.closest("[data-calendar-client-walk-in]")) {
      event.preventDefault();
      selectClient(root, { walkIn: true, name: "Walk in" });
      return;
    }

    if (event.target.closest("[data-calendar-client-add]")) {
      event.preventDefault();
      goToBookingPanel(root, "add-client", { direction: "forward" });
      return;
    }

    if (event.target.closest("[data-calendar-booking-service-add]")) {
      event.preventDefault();
      addServiceReturn = event.target.closest("[data-calendar-booking-summary-panel]") ? "summary" : "service";
      resetAddServiceForm(root);
      goToBookingPanel(root, "add-service", { direction: "forward" });
      return;
    }

    const pick = event.target.closest("[data-calendar-client-pick]");
    if (pick) {
      event.preventDefault();
      const email = pick.dataset.calendarClientPick;
      const client = listClientsForBooking().find((row) => row.email === email);
      if (client) selectClient(root, client);
      return;
    }

    if (event.target.closest("[data-selector-action]")) {
      event.preventDefault();
      return;
    }

    const servicePick = event.target.closest("[data-calendar-service-pick]");
    if (servicePick) {
      event.preventDefault();
      const index = Number(servicePick.dataset.calendarServicePick);
      const service = listServicesForBooking()[index];
      if (service) selectService(root, service);
      return;
    }

    const priceStep = event.target.closest("[data-calendar-booking-service-price-step]");
    if (priceStep) {
      const field = root.querySelector("[data-calendar-booking-service-price]");
      if (!field) return;
      const step = Number(priceStep.dataset.calendarBookingServicePriceStep);
      const next = Math.max(0, (Number(field.value) || 0) + step);
      field.value = next.toFixed(2);
    }
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const drawer = root.querySelector("[data-calendar-client-picker]");
    if (!drawer || drawer.hidden) return;
    const panel = activePanel(root);
    if (panel === "add-service") {
      event.stopPropagation();
      goToBookingPanel(root, addServiceReturn, { direction: "back" });
      return;
    }
    if (panel === "summary") {
      event.stopPropagation();
      goToBookingPanel(root, "service", { direction: "back" });
      return;
    }
    if (panel === "add-client") {
      event.stopPropagation();
      goToBookingPanel(root, "client", { direction: "back" });
      return;
    }
    if (panel === "service") {
      event.stopPropagation();
      goToBookingPanel(root, "client", { direction: "back" });
      return;
    }
    event.stopPropagation();
    setPickerOpen(root, false, { resetPending: true });
    clearCalendarSlotSelection(root);
  }, true);
}
