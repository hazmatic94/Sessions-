import { renderGhostButton, renderSecondaryButton, renderSessionsButton } from "/ds/src/components/button/button.js";
import { renderSessionsInput } from "/ds/src/components/input/input.js";
import { renderSessionsModal } from "/ds/src/components/modal/modal.js";
import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
  setupSessionsProfileMenu,
} from "/ds/src/components/navigation/index.js";
import { renderSessionsPageHeader } from "/ds/src/components/patterns/pageHeader.js";
import { renderSessionsFooter } from "/ds/src/components/patterns/footer.js";
import { renderSessionsSurface } from "/ds/src/components/patterns/surface.js";
import { escapeHtml } from "/ds/src/utils.js";
import { renderPageTitle, renderPageWrapper } from "/src/components/pageWrapper.js";
import { linkPrimaryNav } from "/src/components/primaryNav.js";
import {
  loadAccount,
  requestEmailChange,
  resendEmailChange,
  saveAccount,
} from "/src/data/account.js";
import { setSessionsSurfaceDrawerOpen } from "/src/utils/surfaceDrawer.js";

const navOptions = {
  href: "/",
  ariaLabel: "Sessions home",
};

const FIELDS = [
  {
    key: "name",
    label: "Name",
    type: "text",
    body: "Update the name on your account.",
    drawerTitle: "Change your name",
    drawerBody: "Edit and manage the content of your online profile.",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    body: "Update the email address associated with your account.",
    drawerTitle: "Change your email address",
    drawerBody: "Update the email address associated with your account.",
  },
  { key: "phone", label: "Phone", type: "tel", body: "Update the phone number on your account." },
  { key: "password", label: "Password", type: "password", body: "Update the password on your account." },
];

const EYE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-3.2 4.2M6.1 6.1C3.7 7.8 2 12 2 12a18.7 18.7 0 0 0 6.2 5.6 11 11 0 0 0 3.7 1.4"/></svg>`;

let account = loadAccount();

function displayPhone(phone) {
  return phone.replace(/^\+\d+\s*/, "").trim() || phone;
}

function fieldValue(field, revealed) {
  if (field.key === "phone") return displayPhone(account.phone);
  if (field.key !== "password" || revealed) return account[field.key];
  return "••••••••";
}

function renderFieldRow(field) {
  const reveal = field.key === "password"
    ? `<button class="settings-account__reveal" type="button" data-settings-reveal aria-pressed="false" aria-label="Show password">${EYE_OFF}</button>`
    : "";
  const editDesktop = renderSecondaryButton({ label: "Edit", className: "settings-card__edit settings-card__edit--desktop" }).replace(
    "<button ",
    '<button data-settings-edit ',
  );
  const editMobile = renderGhostButton({
    iconSrc: "/assets/IconMore.svg",
    ariaLabel: `Edit ${field.label}`,
    className: "settings-card__edit settings-card__edit--mobile",
  }).replace("<button ", '<button type="button" data-settings-edit ');
  return `<div class="settings-card__row" data-settings-row data-settings-field="${field.key}" data-settings-type="${field.type}">
    <div class="settings-card__row-inner">
      <div class="settings-card__main">
        <span class="settings-card__label">${field.label}:</span>
        <span class="settings-card__value" data-settings-value><span data-settings-text>${escapeHtml(fieldValue(field, false))}</span>${reveal}</span>
      </div>
      ${editDesktop}${editMobile}
    </div>
  </div>`;
}

function renderSettingsRow(innerMarkup) {
  return `<div class="settings-card__row"><div class="settings-card__row-inner">${innerMarkup}</div></div>`;
}

function renderSettingsCards() {
  const manageBilling = renderSecondaryButton({ label: "Manage" }).replace(
    "<button ",
    '<button type="button" data-settings-manage-billing ',
  );
  const managePayments = renderSecondaryButton({ label: "Manage" }).replace(
    "<button ",
    '<button type="button" data-settings-manage-payments ',
  );
  const deleteAccount = renderSecondaryButton({
    label: "Delete account",
    className: "settings-card__delete",
  }).replace("<button ", '<button data-settings-delete-open ');

  const accountCard = `<section class="settings-card settings-card--account"><h3 class="sessions-page-header__title settings-card__title">Account</h3><div class="settings-card__body">${FIELDS.map(renderFieldRow).join("")}</div></section>`;
  const billing = `<section class="settings-card settings-card--billing"><h3 class="sessions-page-header__title settings-card__title">Billing</h3><div class="settings-card__body">${renderSettingsRow(`<p class="settings-card__copy">Current plan: <strong>Sessions Pro</strong> • $29.99/Month</p>${manageBilling}`)}</div></section>`;
  const payments = `<section class="settings-card settings-card--payments"><h3 class="sessions-page-header__title settings-card__title">Payment Integrations</h3><div class="settings-card__body">${renderSettingsRow(`<div class="settings-card__main"><span class="settings-card__label">Stripe:</span><span class="settings-card__chip">Connected</span></div>${managePayments}`)}</div></section>`;
  const danger = `<section class="settings-card settings-card--danger"><div class="settings-card__body">${renderSettingsRow(`<div class="settings-card__main"><div><p class="settings-card__danger-title">Delete your account</p><p class="settings-card__danger-body">Temporarily disable your account.</p></div></div>${deleteAccount}`)}</div></section>`;
  return accountCard + billing + payments + danger;
}

function splitName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

function drawerCopy(field) {
  if (field.drawerTitle) {
    return { title: field.drawerTitle, body: field.drawerBody || field.body };
  }
  return {
    title: `Change your ${field.label.toLowerCase()}`,
    body: field.body,
  };
}

function renderEditFieldMarkup(field) {
  if (field.key === "name") {
    const { firstName, lastName } = splitName(account.name);
    const first = renderSessionsInput({
      label: "First name",
      placeholder: "",
      id: "settings-edit-first",
      name: "firstName",
      value: firstName,
      fullWidth: true,
    }).replace("<input ", '<input data-settings-edit-first ');
    const last = renderSessionsInput({
      label: "Last name",
      placeholder: "",
      id: "settings-edit-last",
      name: "lastName",
      value: lastName,
      fullWidth: true,
    }).replace("<input ", '<input data-settings-edit-last ');
    return `<div class="sessions-add-client__names settings-edit__names">${first}${last}</div>`;
  }

  if (field.key === "email") {
    const current = renderSessionsInput({
      label: "Current email address",
      placeholder: "",
      type: "email",
      id: "settings-edit-email-current",
      name: "currentEmail",
      value: account.email,
      fullWidth: true,
    }).replace("<input ", '<input readonly tabindex="-1" data-settings-edit-email-current ');
    const next = renderSessionsInput({
      label: "New email address",
      placeholder: "Enter your new email address",
      type: "email",
      id: "settings-edit-email-new",
      name: "newEmail",
      value: "",
      fullWidth: true,
    }).replace("<input ", '<input data-settings-edit-input autocomplete="email" ');
    return `<div class="settings-edit__stack">${current}${next}</div>`;
  }

  return renderSessionsInput({
    label: field.label,
    placeholder: "",
    type: field.type,
    id: "settings-edit-field",
    name: "settings-edit",
    value: account[field.key],
    fullWidth: true,
  }).replace("<input ", '<input data-settings-edit-input ');
}

function renderEditDrawer() {
  const closeAttr = "data-sessions-settings-edit-close";
  const back = renderGhostButton({
    label: "Back",
    icon: "chevron-left",
    className: "sessions-client-profile__back",
  }).replace("<button ", `<button type="button" ${closeAttr} `);
  const navClose = renderGhostButton({
    icon: "close",
    ariaLabel: "Close editor",
    className: "sessions-client-profile__close",
  }).replace("<button ", `<button type="button" ${closeAttr} `);
  const surfaceClose = renderSessionsButton({
    variant: "secondary",
    icon: "close",
    ariaLabel: "Close editor",
    className: "sessions-surface-close",
  }).replace("<button ", `<button type="button" ${closeAttr} `);
  const cancel = renderSessionsButton({ variant: "secondary", label: "Cancel" }).replace(
    "<button ",
    `<button type="button" ${closeAttr} `,
  );
  const save = renderSessionsButton({ variant: "primary", label: "Save" }).replace(
    "<button ",
    '<button type="button" data-settings-edit-save ',
  );
  const header = renderSessionsPageHeader({
    title: "Change your name",
    body: "Edit and manage the content of your online profile.",
  })
    .replace(
      'class="sessions-page-header__title"',
      'class="sessions-page-header__title" id="settings-edit-title" data-settings-edit-title',
    )
    .replace('class="sessions-page-header__body"', 'class="sessions-page-header__body" data-settings-edit-body');
  const nav = `<div class="sessions-add-client__nav">${back}${navClose}</div>`;
  const step = `<div class="sessions-notifications sessions-surface-step">${nav}<div class="sessions-notifications__heading">${header}</div><div data-settings-edit-fields class="sessions-add-client__form"></div></div>`;
  const actions = `<div class="sessions-add-client__actions">${cancel}${save}</div>`;

  return `<div class="sessions-surface-scrim" data-sessions-settings-edit-scrim hidden></div><div class="sessions-surface-drawer is-sessions-inner-page" data-sessions-settings-edit role="dialog" aria-modal="true" aria-labelledby="settings-edit-title" hidden>${surfaceClose}${renderSessionsSurface({ children: `${step}${actions}` })}</div>`;
}

function editDrawerNodes(root) {
  return {
    drawer: root.querySelector("[data-sessions-settings-edit]"),
    scrim: root.querySelector("[data-sessions-settings-edit-scrim]"),
  };
}

function setSettingsEditOpen(root, open) {
  const { drawer, scrim } = editDrawerNodes(root);
  return setSessionsSurfaceDrawerOpen({ drawer, scrim, open, hideScrimOnMobile: true });
}

function syncAccountPresentation(root) {
  FIELDS.forEach((field) => {
    root.querySelectorAll(`[data-settings-field="${field.key}"]`).forEach((row) => paintField(row));
  });

  root.querySelectorAll(".sessions-menu-user-header__name").forEach((el) => {
    el.textContent = account.name;
  });
  root.querySelectorAll(".sessions-menu-user-header__email").forEach((el) => {
    el.textContent = account.email;
  });

  root.querySelectorAll("[data-sessions-profile-trigger]").forEach((trigger) => {
    trigger.setAttribute("aria-label", `Open profile menu for ${account.name}`);
    const img = trigger.querySelector("img");
    if (img) img.alt = account.name;
    const initial = trigger.querySelector(".sessions-avatar__initial");
    if (initial) initial.textContent = account.name.trim().charAt(0).toUpperCase() || "";
  });
}

function armEditFieldsForClick(drawer) {
  const host = drawer.querySelector("[data-settings-edit-fields]");
  if (!host) return;

  host.querySelectorAll(".sessions-input__field:not([readonly])").forEach((input) => {
    delete input.dataset.userActivated;
    input.addEventListener(
      "focus",
      () => {
        if (input.dataset.userActivated === "true") return;
        if (input.matches(":focus-visible")) {
          input.dataset.userActivated = "true";
          return;
        }
        input.blur();
      },
      true,
    );
  });

  host.addEventListener(
    "pointerdown",
    (event) => {
      const input = event.target.closest(".sessions-input")?.querySelector(".sessions-input__field:not([readonly])");
      if (input) input.dataset.userActivated = "true";
    },
    true,
  );

  const blurFocusedField = () => {
    host.querySelectorAll(".sessions-input__field").forEach((input) => {
      if (document.activeElement === input) input.blur();
    });
  };

  requestAnimationFrame(() => {
    blurFocusedField();
    requestAnimationFrame(blurFocusedField);
  });
}

function openEditDrawer(root, field) {
  const { drawer } = editDrawerNodes(root);
  if (!drawer || !field) return;
  const copy = drawerCopy(field);
  const title = drawer.querySelector("[data-settings-edit-title]");
  const body = drawer.querySelector("[data-settings-edit-body]");
  const fields = drawer.querySelector("[data-settings-edit-fields]");
  if (title) title.textContent = copy.title;
  if (body) body.textContent = copy.body;
  if (fields) fields.innerHTML = renderEditFieldMarkup(field);
  drawer.dataset.field = field.key;
  armEditFieldsForClick(drawer);
  setSettingsEditOpen(root, true).then(() => armEditFieldsForClick(drawer));
}

async function saveEditDrawer(root) {
  const { drawer } = editDrawerNodes(root);
  if (!drawer) return;
  const key = drawer.dataset.field;
  const field = FIELDS.find((item) => item.key === key);
  if (!field) return;

  if (key === "email") {
    const next = drawer.querySelector("[data-settings-edit-input]")?.value.trim();
    if (!next) return;
    if (next.toLowerCase() === account.email.toLowerCase()) return;

    try {
      const pending = account.pendingEmailChange;
      if (pending?.email?.toLowerCase() === next.toLowerCase()) {
        await resendEmailChange();
      } else {
        await requestEmailChange(next);
      }
      account = loadAccount();
      openEmailInboxModal(root, next);
    } catch (error) {
      console.warn(error);
    }
    return;
  }

  if (key === "name") {
    const first = drawer.querySelector("[data-settings-edit-first]")?.value.trim() || "";
    const last = drawer.querySelector("[data-settings-edit-last]")?.value.trim() || "";
    const nextName = [first, last].filter(Boolean).join(" ");
    if (!nextName) return;
    account.name = nextName;
  } else {
    const next = drawer.querySelector("[data-settings-edit-input]")?.value.trim();
    if (!next) return;
    account[key] = next;
  }

  saveAccount(account);
  account = loadAccount();
  syncAccountPresentation(root);
  setSettingsEditOpen(root, false);
}

function renderEmailInboxModal() {
  const bodyMarkup = `<div class="settings-email-inbox">
    <div class="settings-email-inbox__icon"><img class="settings-email-inbox__icon-img" src="/assets/IconMail.svg" width="52" height="52" alt="" aria-hidden="true" /></div>
    <div class="settings-email-inbox__copy">
      <h3 class="sessions-modal__title settings-email-inbox__title" id="settings-email-inbox-title">Check your inbox</h3>
      <p class="sessions-modal__body settings-email-inbox__lead">We&rsquo;ve sent a verification link to</p>
      <p class="settings-email-inbox__address" data-settings-email-inbox-address></p>
      <p class="sessions-modal__body settings-email-inbox__follow">Follow the link in the email to confirm your new email address.</p>
    </div>
  </div>`;

  const modal = renderSessionsModal({
    bodyMarkup,
    secondaryLabel: "Resend",
    primaryLabel: "Close",
  })
    .replace(
      '<div class="sessions-modal__actions"><button class="sessions-button sessions-button--secondary" type="button"><span class="sessions-button__label">Resend</span></button>',
      '<div class="sessions-modal__actions"><button class="sessions-button sessions-button--secondary" type="button" data-settings-email-inbox-resend><span class="sessions-button__label">Resend</span></button>',
    )
    .replace(
      '<button class="sessions-button sessions-button--primary" type="button"><span class="sessions-button__label">Close</span></button>',
      '<button class="sessions-button sessions-button--primary" type="button" data-settings-email-inbox-close><span class="sessions-button__label">Close</span></button>',
    )
    .replace('class="sessions-modal__close"', 'class="sessions-modal__close" data-settings-email-inbox-close')
    .replace(
      'role="dialog"',
      'role="dialog" aria-labelledby="settings-email-inbox-title"',
    );

  return `<div class="settings-dialog settings-email-inbox-dialog" data-settings-email-inbox hidden><button class="settings-dialog__scrim" type="button" data-settings-email-inbox-close aria-label="Close"></button>${modal}</div>`;
}

function openEmailInboxModal(root, pendingEmail) {
  const dialog = root.querySelector("[data-settings-email-inbox]");
  const address = dialog?.querySelector("[data-settings-email-inbox-address]");
  if (address) address.textContent = pendingEmail;
  if (dialog) dialog.hidden = false;
  document.body.classList.add("is-settings-email-inbox-open");
  const { drawer } = editDrawerNodes(root);
  if (drawer) drawer.setAttribute("aria-hidden", "true");
}

function closeEmailInboxModal(root) {
  const dialog = root.querySelector("[data-settings-email-inbox]");
  if (dialog) dialog.hidden = true;
  document.body.classList.remove("is-settings-email-inbox-open");
  const { drawer } = editDrawerNodes(root);
  if (drawer && !drawer.hidden) drawer.removeAttribute("aria-hidden");
}

function isEmailInboxOpen(root) {
  const dialog = root.querySelector("[data-settings-email-inbox]");
  return Boolean(dialog && !dialog.hidden);
}

function renderDeleteModal() {
  const modal = renderSessionsModal({
    title: "Delete account",
    body: "Are you sure? This action cannot be undone.",
    secondaryLabel: "Cancel",
    primaryLabel: "Delete Account",
  })
    .replace('class="sessions-button sessions-button--secondary"', 'class="sessions-button sessions-button--secondary" data-settings-delete-cancel')
    .replace('class="sessions-button sessions-button--primary"', 'class="sessions-button sessions-button--primary" data-settings-delete-confirm')
    .replace('class="sessions-modal__close"', 'class="sessions-modal__close" data-settings-delete-cancel');

  return `<div class="settings-dialog settings-delete" data-settings-delete hidden><button class="settings-dialog__scrim" type="button" data-settings-delete-cancel aria-label="Cancel"></button>${modal}</div>`;
}

export function renderSettingsPage() {
  return `
    <div class="home-shell">
      <div id="mobile-nav" class="home-shell__mobile"></div>
      <div id="top-nav" class="home-shell__desktop"></div>
      <div class="home-shell__body">
        <div class="home-shell__rail" id="rail"></div>
        <main class="home-shell__main">
          ${renderPageWrapper({
            content: `<div class="settings-page"><p class="settings-banner" data-settings-email-verified hidden>Your email address has been updated.</p>${renderPageTitle({
              title: "Settings",
              body: "Update your personal details and manage your account preferences.",
            })}${renderSettingsCards()}</div>`,
          })}
        </main>
      </div>
      ${renderSessionsFooter()}
      ${renderEditDrawer()}
      ${renderEmailInboxModal()}
      ${renderDeleteModal()}
    </div>
  `;
}

export function mountSettingsPage(root) {
  account = loadAccount();
  root.innerHTML = renderSettingsPage();
  root.querySelector("#top-nav").innerHTML = renderTopNav({
    ...navOptions,
    avatar: {
      src: "/assets/demo/larry.jpg",
      alt: account.name,
      name: account.name,
    },
  });
  setupSessionsProfileMenu(root);
  root.querySelector("#rail").innerHTML = renderSessionsLeftRail({
    selected: "settings",
  });
  root.querySelector("#mobile-nav").innerHTML = renderMobileMenu(navOptions);
  bindMobileMenu(root);
  linkPrimaryNav(root, { selected: "Settings" });
  bindAccount(root);
  syncAccountPresentation(root);

  if (new URLSearchParams(location.search).get("emailVerified") === "1") {
    history.replaceState({}, "", "/settings");
    const banner = root.querySelector("[data-settings-email-verified]");
    if (banner) banner.hidden = false;
  }
}

function paintField(row) {
  const field = FIELDS.find((item) => item.key === row.dataset.settingsField);
  const text = row.querySelector("[data-settings-text]");
  if (text) text.textContent = fieldValue(field, row.classList.contains("is-revealed"));
}

function bindAccount(root) {
  const deleteDialog = () => root.querySelector("[data-settings-delete]");

  root.addEventListener("click", (event) => {
    const reveal = event.target.closest("[data-settings-reveal]");
    if (reveal) {
      const row = reveal.closest("[data-settings-row]");
      const shown = !row.classList.contains("is-revealed");
      row.classList.toggle("is-revealed", shown);
      reveal.setAttribute("aria-pressed", String(shown));
      reveal.setAttribute("aria-label", shown ? "Hide password" : "Show password");
      reveal.innerHTML = shown ? EYE : EYE_OFF;
      paintField(row);
      return;
    }

    if (event.target.closest("[data-sessions-settings-edit-scrim], [data-sessions-settings-edit-close]")) {
      if (isEmailInboxOpen(root)) return;
      setSettingsEditOpen(root, false);
      return;
    }

    const edit = event.target.closest("[data-settings-edit]");
    if (edit) {
      const row = edit.closest("[data-settings-row]");
      const field = FIELDS.find((item) => item.key === row?.dataset.settingsField);
      if (field) openEditDrawer(root, field);
      return;
    }

    if (event.target.closest("[data-settings-edit-save]")) {
      void saveEditDrawer(root);
      return;
    }

    if (event.target.closest("[data-settings-email-inbox-resend]")) {
      void resendEmailChange().catch((error) => console.warn(error));
      return;
    }

    if (event.target.closest("[data-settings-email-inbox-close]")) {
      closeEmailInboxModal(root);
      return;
    }

    if (event.target.closest("[data-settings-delete-open]")) {
      const modal = deleteDialog();
      if (modal) modal.hidden = false;
      return;
    }

    if (!deleteDialog() || deleteDialog().hidden) return;
    // ponytail: no account backend yet; confirm just closes
    if (event.target.closest("[data-settings-delete-confirm], [data-settings-delete-cancel]")) {
      deleteDialog().hidden = true;
    }
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (isEmailInboxOpen(root)) {
      event.stopPropagation();
      closeEmailInboxModal(root);
      return;
    }
    const { drawer } = editDrawerNodes(root);
    if (drawer && !drawer.hidden) {
      event.stopPropagation();
      setSettingsEditOpen(root, false);
      return;
    }
    if (deleteDialog() && !deleteDialog().hidden) {
      event.stopPropagation();
      deleteDialog().hidden = true;
    }
  }, true);
}

function setMobileMenuOpen(device, open) {
  device.classList.toggle("is-open", open);
  const toggle = device.querySelector("[data-mobile-menu-toggle]");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? toggle.dataset.closeLabel || "Close menu" : toggle.dataset.menuLabel || "Open menu",
    );
  }
  device.querySelector("[data-mobile-menu-panel]")?.setAttribute("aria-hidden", String(!open));
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

    if (event.target.classList?.contains("mobile-menu-device") && event.target.classList.contains("is-open")) {
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
