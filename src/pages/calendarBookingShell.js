import { renderGhostButton } from "/ds/src/components/button/button.js";
import { escapeHtml } from "/ds/src/utils.js";

/** @param {{ backTo: string }} options — panel id, `close`, or `summary-prev` */
export function renderBookingStepNav({ backTo }) {
  const back = renderGhostButton({
    label: "Back",
    icon: "chevron-left",
    className: "sessions-client-edit__back",
  }).replace(
    "<button ",
    `<button type="button" data-calendar-booking-back data-calendar-booking-back-to="${escapeHtml(backTo)}" `,
  );
  const close = renderGhostButton({
    icon: "close",
    ariaLabel: "Close",
    className: "sessions-client-profile__close",
  }).replace("<button ", '<button type="button" data-calendar-client-picker-close ');
  return `<div class="calendar-booking-step__nav sessions-client-edit__nav">${back}${close}</div>`;
}

/** @param {{ price: string, attribute?: string }} options */
export function renderBookingPayRow({ price, attribute = "data-calendar-booking-to-pay" }) {
  return `<button class="calendar-booking-checkout__pay" type="button" ${attribute}><span>To pay</span><img src="/assets/IconCehvronRight.svg" width="20" height="20" alt="" /><strong>${escapeHtml(price)}</strong></button>`;
}

/**
 * Sticky checkout footer: optional pay row + action buttons.
 * @param {{ price?: string | null, payAttribute?: string, payHostAttribute?: string, actionsHtml?: string, actionsHidden?: boolean, actionsBarAttribute?: string }} options
 */
export function renderBookingCheckoutFooter({
  price = null,
  payAttribute = "data-calendar-booking-to-pay",
  payHostAttribute = "",
  actionsHtml = "",
  actionsHidden = false,
  actionsBarAttribute = "",
} = {}) {
  const payRow = payHostAttribute
    ? `<div class="calendar-booking-checkout__pay-row" ${payHostAttribute}></div>`
    : price != null
      ? `<div class="calendar-booking-checkout__pay-row">${renderBookingPayRow({ price, attribute: payAttribute })}</div>`
      : "";
  const actions = actionsHtml
    ? `<div class="calendar-booking-checkout__actions"${actionsHidden ? " hidden" : ""}${actionsBarAttribute ? ` ${actionsBarAttribute}` : ""}>${actionsHtml}</div>`
    : "";
  return `<footer class="calendar-booking-checkout">${payRow}${actions}</footer>`;
}

/** Sticky primary actions only (no checkout divider / pay row). */
export function renderBookingStepActionsFooter({
  actionsHtml = "",
  actionsHidden = false,
  actionsBarAttribute = "",
} = {}) {
  if (!actionsHtml) return "";
  return `<div class="calendar-booking-step__actions"${actionsHidden ? " hidden" : ""}${actionsBarAttribute ? ` ${actionsBarAttribute}` : ""}>${actionsHtml}</div>`;
}

/**
 * @param {{ backTo?: string | false, title?: string, body: string, footer?: string }} options
 */
export function renderBookingStep({ backTo, title = "", body, footer = "" }) {
  const nav = backTo !== false ? renderBookingStepNav({ backTo }) : "";
  const titleHtml = title
    ? `<h2 class="calendar-booking-step__title">${escapeHtml(title)}</h2>`
    : "";
  return `<div class="calendar-booking-step">${nav}<div class="calendar-booking-step__scroll">${titleHtml}${body}</div>${footer}</div>`;
}
