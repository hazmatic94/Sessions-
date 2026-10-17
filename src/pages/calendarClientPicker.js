import { renderGhostButton, renderSessionsButton } from "/ds/src/components/button/button.js";
import * as addClientPatterns from "/ds/src/components/patterns/addClient.js";
import { renderSessionsAddServiceSurfaceContent } from "/ds/src/components/patterns/addService.js";
import { renderSessionsMenuDivider } from "/ds/src/components/menu/index.js";
import { renderSessionsClientCard } from "/ds/src/components/cards/clientCard.js";
import { renderSessionsClientRow } from "/ds/src/components/rows/clientRow.js";
import { renderSessionsSearch } from "/ds/src/components/search/search.js";
import { renderSessionsSelector } from "/ds/src/components/selector/selector.js";
import { closeClientActions, setClientActionsOpen } from "/ds/src/components/patterns/clientProfile.js";
import { runSurfaceStepTransition } from "/ds/src/components/patterns/surfaceSteps.js";
import { renderSessionsSurface } from "/ds/src/components/patterns/surface.js";
import { escapeHtml } from "/ds/src/utils.js";
import { listClientsForBooking } from "/src/data/clients.js";
import {
  appendService,
  formatServicePrice,
  listServicesForBooking,
  readServiceFromForm,
  totalServicePrice,
} from "/src/data/services.js";

const { renderSessionsAddClientSurfaceContent } = addClientPatterns;
const syncAddClientScrollCues = addClientPatterns.syncSessionsAddClientScrollCues ?? (() => {});

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

function renderServiceCard(service, index, selected = false) {
  const duration = String(service.duration || "").replace(/(\d+)\s+min/g, "$1min");
  return renderSessionsSelector({
    id: String(index),
    name: service.name,
    duration,
    priceLabel: formatServicePrice(service.priceType, service.price),
    selected,
  }).replace("data-sessions-selector", `data-sessions-selector data-calendar-service-pick="${index}"`);
}

function renderServiceList(selected = new Set()) {
  const services = listServicesForBooking();
  if (!services.length) return renderServiceEmpty();
  return `<div class="sessions-selector-list">${services.map((service, index) => renderServiceCard(service, index, selected.has(String(index)))).join("")}</div>`;
}

function renderFlowClose() {
  return renderGhostButton({
    icon: "close",
    ariaLabel: "Close",
    className: "sessions-client-profile__close",
  }).replace("<button ", '<button type="button" data-calendar-client-picker-close ');
}

function renderServicePanel() {
  const back = renderGhostButton({
    label: "Back",
    icon: "chevron-left",
    className: "sessions-client-edit__back",
  }).replace("<button ", '<button type="button" data-calendar-booking-service-back ');
  const add = renderSessionsButton({
    variant: "secondary",
    label: "Create new",
    icon: "plus",
  }).replace("<button ", '<button data-calendar-booking-service-add ');
  const next = renderSessionsButton({
    variant: "primary",
    label: "Continue",
    fullWidth: true,
  }).replace("<button ", '<button data-calendar-service-continue ');

  return `<div class="calendar-client-picker__panel sessions-surface-step-panel" data-calendar-booking-service-panel hidden><div class="sessions-notifications sessions-surface-step calendar-booking-step"><div class="sessions-client-edit__nav">${back}${renderFlowClose()}</div><div class="sessions-notifications__heading"><h2 class="calendar-client-picker__title">Select a service</h2></div><div class="calendar-service-picker__body" data-calendar-booking-service-list-host>${renderServiceList()}</div><div class="calendar-service-picker__add">${add}</div></div><div class="calendar-service-picker__continue" data-calendar-service-continue-bar hidden>${next}</div></div>`;
}

function renderAddServicePanel() {
  return `<div class="calendar-client-picker__panel sessions-surface-step-panel" data-calendar-booking-add-service-panel data-sessions-add-service hidden>${renderSessionsAddServiceSurfaceContent({
    idPrefix: "calendar-booking-service",
    formId: "calendar-booking-add-service-form",
    formAttribute: "data-calendar-booking-add-service-form",
    closeAttribute: "data-calendar-booking-add-service-back",
    dismissAttribute: "data-calendar-client-picker-close",
    showNav: true,
    saveType: "submit",
  })}</div>`;
}

function renderAddClientPanel() {
  return `<div class="calendar-client-picker__panel sessions-surface-step-panel" data-calendar-client-picker-add-panel data-sessions-add-client hidden>${renderSessionsAddClientSurfaceContent({
    closeAttribute: "data-calendar-client-picker-back",
    dismissAttribute: "data-calendar-client-picker-close",
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

function bookingServices(booking) {
  if (Array.isArray(booking.services) && booking.services.length) return booking.services;
  return booking.service?.name ? [booking.service] : [];
}

function renderSummaryBody(booking) {
  const client = booking.client ?? {};
  const services = bookingServices(booking);
  const card = renderSessionsClientCard({
    name: client.name || "Walk in",
    email: client.email || "Walk-in",
    avatarSrc: client.avatarSrc,
    avatarInitial: client.avatarInitial,
    editProfileLabel: "Edit profile",
  });
  const selected = services
    .map((service) =>
      renderSessionsSelector({
        name: service.name,
        duration: String(service.duration || "").replace(/(\d+)\s+min/g, "$1min"),
        priceLabel: formatServicePrice(service.priceType, service.price),
        interactive: false,
      }),
    )
    .join("");
  const add = renderSessionsButton({
    variant: "secondary",
    label: "Create new",
    icon: "plus",
  }).replace("<button ", '<button data-calendar-booking-service-add ');
  return `<div class="calendar-booking-summary__when"><button class="calendar-booking-summary__date" type="button" data-calendar-booking-date aria-haspopup="dialog" aria-expanded="false">${escapeHtml(formatBookingDate(booking.date))}<img src="/assets/IconChevronDown.svg" width="20" height="20" alt="" /></button><p class="calendar-booking-summary__time">${escapeHtml(booking.time || "")}</p></div>${card}<section class="calendar-booking-summary__service"><h3 class="calendar-booking-summary__label">${services.length > 1 ? "Services" : "Service"}</h3>${selected}<div class="calendar-service-picker__add">${add}</div></section>`;
}

function renderSummaryPay(booking) {
  const price = totalServicePrice(bookingServices(booking));
  return `<button class="calendar-booking-summary__pay" type="button" data-calendar-booking-to-pay><span>To pay</span><img src="/assets/IconCehvronRight.svg" width="20" height="20" alt="" /><strong>${escapeHtml(price)}</strong></button>`;
}

function renderSummaryPanel() {
  const back = renderGhostButton({
    label: "Back",
    icon: "chevron-left",
    className: "sessions-client-profile__back",
  }).replace("<button ", '<button type="button" data-calendar-booking-summary-back ');
  const book = renderSessionsButton({ variant: "secondary", label: "Book in" }).replace(
    "<button ",
    '<button data-calendar-booking-book ',
  );
  const pay = renderSessionsButton({ variant: "primary", label: "Pay now" }).replace(
    "<button ",
    '<button data-calendar-booking-pay ',
  );

  return `<div class="calendar-client-picker__panel sessions-surface-step-panel" data-calendar-booking-summary-panel hidden><div class="calendar-booking-summary"><div class="calendar-booking-summary__scroll"><div class="sessions-client-profile__nav">${back}${renderFlowClose()}</div><div data-calendar-booking-summary-host></div></div><div class="calendar-booking-summary__footer"><div data-calendar-booking-summary-pay></div><div class="calendar-booking-summary__actions">${book}${pay}</div></div></div></div>`;
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

  const pageBack = renderGhostButton({
    label: "Back",
    icon: "chevron-left",
    className: "sessions-client-profile__back",
  }).replace("<button ", '<button type="button" data-calendar-client-picker-close ');

  return `<div class="calendar-client-picker__panel sessions-surface-step-panel is-step-active" data-calendar-client-picker-list-panel><div class="sessions-notifications calendar-client-picker"><div class="sessions-client-profile__nav">${pageBack}${renderFlowClose()}</div><div class="calendar-client-picker__intro"><h2 class="calendar-client-picker__title">Select a client</h2>${search}</div><div class="calendar-client-picker__actions">${addNew}${walkIn}</div>${renderSessionsMenuDivider()}<div class="calendar-client-picker__list-wrap">${renderPickerList()}</div></div></div>`;
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
let pickerCloseToken = 0;

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
    if (panel === "add-client") requestAnimationFrame(() => syncAddClientScrollCues(root));
    return;
  }

  if (!from) {
    to.hidden = false;
    to.classList.add("is-step-active");
    if (panel === "add-client") requestAnimationFrame(() => syncAddClientScrollCues(root));
    return;
  }

  pickerStepAnimating = true;
  await runSurfaceStepTransition(steps, from, to, forward ? "forward" : "back");
  pickerStepAnimating = false;
  if (panel === "add-client") requestAnimationFrame(() => syncAddClientScrollCues(root));
}

function resetAddClientForm(root) {
  root.querySelector("[data-calendar-booking-add-client-form]")?.reset();
}

function resetAddServiceForm(root) {
  const form = root.querySelector("[data-calendar-booking-add-service-form]");
  form?.reset();
  form?.querySelectorAll(".sessions-add-service__counted").forEach((counted) => {
    const field = counted.querySelector(".sessions-input__field");
    const count = counted.querySelector("[data-sessions-add-service-count]");
    if (field && count && field.maxLength >= 0) count.textContent = `0/${field.maxLength}`;
  });
  syncBookingAddServiceSave(root);
}

function syncBookingAddServiceSave(root) {
  const form = root.querySelector("[data-calendar-booking-add-service-form]");
  const button = form?.querySelector("[type='submit']");
  const name = form?.querySelector("[name='serviceName']");
  if (button) button.disabled = !name?.value.trim();
}

function mergePendingBooking(root, patch) {
  const current = JSON.parse(root.dataset.calendarPendingBooking || "{}");
  root.dataset.calendarPendingBooking = JSON.stringify({ ...current, ...patch });
}

function resetPickerChrome(root, { resetPending = false } = {}) {
  if (resetPending) delete root.dataset.calendarPendingBooking;
  resetPickerPanels(root);
  resetAddClientForm(root);
  resetAddServiceForm(root);
  const search = root.querySelector("[data-calendar-client-picker-search]");
  if (search) search.value = "";
  const list = root.querySelector("[data-calendar-client-picker-list]");
  if (list) list.outerHTML = renderPickerList();
}

function setPickerOpen(root, open, { resetPending = false } = {}) {
  const drawer = root.querySelector("[data-calendar-client-picker]");
  const scrim = root.querySelector("[data-calendar-client-picker-scrim]");
  if (!drawer) return;

  if (open) {
    pickerCloseToken += 1;
    drawer.classList.remove("is-closing");
    scrim?.classList.remove("is-closing");
    drawer.hidden = false;
    if (scrim) scrim.hidden = false;
    resetPickerPanels(root);
    return;
  }

  const finish = (token) => {
    if (token !== pickerCloseToken) return;
    drawer.classList.remove("is-closing");
    scrim?.classList.remove("is-closing");
    drawer.hidden = true;
    if (scrim) scrim.hidden = true;
    resetPickerChrome(root, { resetPending });
  };

  finish(++pickerCloseToken);
}

function paintPickerList(root, query = "") {
  const host = root.querySelector("[data-calendar-client-picker-list]");
  if (!host) return;
  host.outerHTML = renderPickerList(query);
}

function paintServiceList(root, extraSelected = []) {
  const host = root.querySelector("[data-calendar-booking-service-list-host]");
  if (!host) return;
  const selected = new Set([
    ...[...host.querySelectorAll("[data-calendar-service-pick].is-selected")].map((el) => el.dataset.calendarServicePick),
    ...extraSelected.map(String),
  ]);
  host.innerHTML = renderServiceList(selected);
  syncServiceContinue(root);
}

function syncServiceContinue(root) {
  const bar = root.querySelector("[data-calendar-service-continue-bar]");
  if (bar) bar.hidden = !root.querySelector("[data-calendar-service-pick].is-selected");
}

function selectedServices(root) {
  const services = listServicesForBooking();
  return [...root.querySelectorAll("[data-calendar-service-pick].is-selected")]
    .map((el) => services[Number(el.dataset.calendarServicePick)])
    .filter(Boolean);
}

function toggleServicePick(card) {
  const on = card.classList.toggle("is-selected");
  card.setAttribute("aria-pressed", on ? "true" : "false");
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
  const booking = pendingBooking(root);
  host.innerHTML = renderSummaryBody(booking);
  const pay = root.querySelector("[data-calendar-booking-summary-pay]");
  if (pay) pay.innerHTML = renderSummaryPay(booking);
}

function continueWithServices(root) {
  const services = selectedServices(root);
  if (!services.length) return;
  mergePendingBooking(root, { services, service: services[0] });
  paintSummary(root);
  goToBookingPanel(root, "summary", { direction: "forward" });
}

function selectClient(root, client) {
  mergePendingBooking(root, { client });
  paintServiceList(root);
  goToBookingPanel(root, "service", { direction: "forward" });
}

function pinAddServiceActions(root) {
  const form = root.querySelector("[data-calendar-booking-add-service-panel] .sessions-add-client__form");
  const actions = form?.querySelector(".sessions-add-client__actions");
  if (actions) form.after(actions);
}

export function bindCalendarClientPicker(root) {
  pinAddServiceActions(root);
  const openPicker = (detail) => {
    const date =
      detail?.date ||
      root.querySelector("[data-sessions-navigator]")?.dataset.sessionsNavigatorValue ||
      "";
    root.dataset.calendarPendingBooking = JSON.stringify({ ...(detail ?? {}), date });
    paintPickerList(root, "");
    paintServiceList(root);
    const search = root.querySelector("[data-calendar-client-picker-search]");
    if (search) search.value = "";
    setPickerOpen(root, true);
  };

  root.addEventListener("sessions:slot-booking", (event) => {
    if (event.detail?.action !== "appointment") return;
    openPicker(event.detail);
  });

  root.addEventListener("sessions:booking-when", (event) => {
    const detail = event.detail ?? {};
    const patch = {};
    if (detail.date) patch.date = detail.date;
    if (detail.time) patch.time = detail.time;
    if (!Object.keys(patch).length) return;
    mergePendingBooking(root, patch);
    if (activePanel(root) !== "summary") return;
    paintSummary(root);
    const dateSheet = root.querySelector("[data-calendar-date-sheet].is-booking");
    if (dateSheet && !dateSheet.hidden) {
      root.querySelector("[data-calendar-booking-date]")?.setAttribute("aria-expanded", "true");
    }
  });

  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-calendar-client-picker-search]")) {
      paintPickerList(root, event.target.value);
      return;
    }
    const serviceField = event.target.closest("[data-calendar-booking-add-service-panel] .sessions-input__field");
    if (!serviceField) return;
    if (serviceField.maxLength >= 0) {
      const count = serviceField.closest(".sessions-add-service__counted")?.querySelector("[data-sessions-add-service-count]");
      if (count) count.textContent = `${serviceField.value.length}/${serviceField.maxLength}`;
    }
    if (serviceField.name === "serviceName") syncBookingAddServiceSave(root);
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
      const index = String(listServicesForBooking().length - 1);
      resetAddServiceForm(root);
      paintServiceList(root, [index]);
      if (addServiceReturn === "summary") {
        const services = selectedServices(root);
        mergePendingBooking(root, { services, service: services[0] });
        paintSummary(root);
      }
      goToBookingPanel(root, addServiceReturn, { direction: "back" });
    }
  });

  root.addEventListener("click", (event) => {
    const drawer = root.querySelector("[data-calendar-client-picker]");
    if (!drawer || drawer.hidden) return;

    if (event.target.closest(".sessions-team-sheet__close, .sessions-client-card__menu .sessions-team-sheet__scrim")) {
      event.preventDefault();
      closeClientActions(root);
      return;
    }

    const actionsTrigger = event.target.closest("[data-sessions-client-actions] > .sessions-button");
    if (actionsTrigger) {
      event.preventDefault();
      const actions = actionsTrigger.closest("[data-sessions-client-actions]");
      const open = actions.classList.contains("is-open");
      closeClientActions(root);
      setClientActionsOpen(actions, !open);
      return;
    }

    if (event.target.closest("[data-sessions-client-action]")) {
      event.preventDefault();
      closeClientActions(root);
      return;
    }

    if (!event.target.closest(".sessions-client-card__menu")) closeClientActions(root);

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

    if (event.target.closest("[data-calendar-booking-summary-back]")) {
      event.preventDefault();
      goToBookingPanel(root, "service", { direction: "back" });
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

    if (event.target.closest("[data-calendar-service-continue]")) {
      event.preventDefault();
      continueWithServices(root);
      return;
    }

    const servicePick = event.target.closest("[data-calendar-service-pick]");
    if (servicePick) {
      event.preventDefault();
      event.stopPropagation();
      toggleServicePick(servicePick);
      syncServiceContinue(root);
      return;
    }

    const priceStep = event.target.closest("[data-calendar-booking-add-service-panel] [data-sessions-add-service-price-step]");
    if (priceStep) {
      const field = priceStep.closest("label")?.querySelector("[data-sessions-add-service-price]");
      if (!field) return;
      const step = Number(priceStep.dataset.sessionsAddServicePriceStep);
      const next = Math.max(0, (Number(field.value) || 0) + step);
      field.value = next.toFixed(2);
    }
  });

  root.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      const servicePick = event.target.closest?.("[data-calendar-service-pick]");
      if (servicePick && event.target === servicePick) {
        event.preventDefault();
        toggleServicePick(servicePick);
        syncServiceContinue(root);
        return;
      }
    }
    if (event.key !== "Escape") return;
    const drawer = root.querySelector("[data-calendar-client-picker]");
    if (!drawer || drawer.hidden) return;
    if (root.querySelector("[data-sessions-client-actions].is-open")) {
      event.stopPropagation();
      closeClientActions(root);
      return;
    }
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

  syncAddClientScrollCues(root);
}
