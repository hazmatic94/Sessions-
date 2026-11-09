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
  confirmPhoneChange,
  loadAccount,
  requestEmailChange,
  requestPhoneChange,
  requestPasswordReset,
  resendEmailChange,
  resendPhoneChange,
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
  {
    key: "phone",
    label: "Phone",
    type: "tel",
    body: "Update the phone number associated with your account.",
    drawerTitle: "Change your phone number",
    drawerBody: "Update the phone number associated with your account.",
  },
  {
    key: "password",
    label: "Password",
    type: "password",
    body: "Update your password to keep your account secure.",
    drawerTitle: "Change your password",
    drawerBody: "Update your password to keep your account secure.",
  },
];

const EYE_OPEN = `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M9.97 12.38a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path fill="currentColor" fill-rule="evenodd" d="M1.07 9.41C2.31 5.69 5.83 3 9.97 3c4.14 0 7.66 2.69 8.9 6.41.1.3.1.63 0 .93-1.24 3.72-4.76 6.41-8.9 6.41-4.14 0-7.65-2.69-8.9-6.41a1.2 1.2 0 0 1 0-.93Zm13.28.46a4.38 4.38 0 1 1-8.76 0 4.38 4.38 0 0 1 8.76 0Z"/></svg>`;
const EYE_CLOSED = `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M2.91 2.17a.75.75 0 0 0-1.06 1.06l15 15a.75.75 0 0 0 1.06-1.06l-2.58-2.58a11 11 0 0 0 3.56-4.04c.1-.3.1-.63 0-.93C17.63 5.92 14.11 3.23 9.97 3.23c-1.21 0-2.41.23-3.54.69L2.91 2.17Zm11.18 9.41c0 .15-.01.3-.03.44l-3.54-3.54a3.13 3.13 0 0 1 3.57 3.1Zm-2.68 3.1-3.54-3.54a3.13 3.13 0 0 0 3.54 3.54ZM5.6 10.11c0-.52.09-1.01.25-1.47L3.27 6.06A11 11 0 0 0 1.07 9.65c-.1.3-.1.63 0 .93 1.24 3.72 4.75 6.41 8.9 6.41 1.25 0 2.44-.25 3.53-.69l-2.06-2.06a4.4 4.4 0 0 1-5.84-4.13Z"/></svg>`;
const EYE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-3.2 4.2M6.1 6.1C3.7 7.8 2 12 2 12a18.7 18.7 0 0 0 6.2 5.6 11 11 0 0 0 3.7 1.4"/></svg>`;

let account = loadAccount();

function displayPhone(phone) {
  return phone.replace(/^\+\d+\s*/, "").trim() || phone;
}

function formatOtpPhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length > 9) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  const groups = digits.match(/.{1,3}/g) || [];
  return groups.length ? `+61 ${groups.join(" ")}` : String(phone || "");
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

  if (field.key === "phone") {
    const current = renderSessionsInput({
      label: "Current phone number",
      placeholder: "",
      type: "tel",
      id: "settings-edit-phone-current",
      name: "currentPhone",
      value: displayPhone(account.phone),
      fullWidth: true,
    }).replace("<input ", '<input readonly tabindex="-1" data-settings-edit-phone-current ');
    const next = renderSessionsInput({
      label: "Enter your new phone number",
      placeholder: "",
      type: "tel",
      id: "settings-edit-phone-new",
      name: "newPhone",
      value: "",
      fullWidth: true,
    }).replace("<input ", '<input data-settings-edit-input autocomplete="tel" ');
    return `<div class="settings-edit__stack">${current}${next}</div>`;
  }

  if (field.key === "password") return renderPasswordFields();

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

function renderPasswordInput({ id, name, autocomplete }) {
  return renderSessionsInput({
    label: "",
    placeholder: "",
    type: "password",
    id,
    name,
    value: "",
    fullWidth: true,
    rightIcon: EYE_CLOSED,
  })
    .replace("<input ", `<input data-settings-password-input autocomplete="${autocomplete}" `)
    .replace(
      `<span class="sessions-input__icon sessions-input__icon--trailing" aria-hidden="true">${EYE_CLOSED}</span>`,
      `<button class="sessions-input__icon sessions-input__icon--trailing settings-password__reveal" type="button" data-settings-password-reveal aria-pressed="false" aria-label="Show password">${EYE_CLOSED}</button>`,
    );
}

function renderPasswordFields() {
  const field = (label, id, name, autocomplete, forgot = false) => {
    const forgotButton = forgot
      ? `<button class="settings-password__forgot" type="button" data-settings-forgot-password>Forgot password?</button>`
      : "";
    return `<div class="settings-password__field"><div class="settings-password__label-row"><label class="sessions-input__label" for="${id}">${label}</label>${forgotButton}</div>${renderPasswordInput({ id, name, autocomplete })}</div>`;
  };
  return `<div class="settings-password">${field("Current password", "settings-edit-password-current", "currentPassword", "current-password", true)}${field("New password", "settings-edit-password-new", "newPassword", "new-password")}${field("Confirm new password", "settings-edit-password-confirm", "confirmPassword", "new-password")}<p class="settings-password__error" data-settings-password-error hidden></p></div>`;
}

const RESET_NOTE_ICON = `<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7.25" stroke="currentColor" stroke-width="1.5"/><path d="M10 6.15v4.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="13.85" r="0.85" fill="currentColor"/></svg>`;

function renderPasswordReset() {
  const email = renderSessionsInput({
    label: "Email address",
    placeholder: "",
    type: "email",
    id: "settings-reset-email",
    name: "resetEmail",
    value: account.email,
    fullWidth: true,
  }).replace("<input ", '<input autocomplete="email" ');
  return `<div class="settings-password-reset">${email}<p class="settings-password-reset__note"><span class="settings-password-reset__note-icon">${RESET_NOTE_ICON}</span><span>We have sent a password reset link to this email address</span></p></div>`;
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
  delete drawer.dataset.mode;
  setEditSaveLabel(drawer, "Save");
  armEditFieldsForClick(drawer);
  setSettingsEditOpen(root, true).then(() => armEditFieldsForClick(drawer));
}

function setEditSaveLabel(drawer, label) {
  const labelEl = drawer.querySelector("[data-settings-edit-save] .sessions-button__label");
  if (labelEl) labelEl.textContent = label;
}

function showPasswordReset(root) {
  const { drawer } = editDrawerNodes(root);
  if (!drawer) return;
  const title = drawer.querySelector("[data-settings-edit-title]");
  const body = drawer.querySelector("[data-settings-edit-body]");
  const fields = drawer.querySelector("[data-settings-edit-fields]");
  if (title) title.textContent = "Reset password";
  if (body) body.textContent = "We\u2019ll send you a link to reset your password.";
  if (fields) fields.innerHTML = renderPasswordReset();
  drawer.dataset.mode = "reset";
  setEditSaveLabel(drawer, "Send reset link");
  armEditFieldsForClick(drawer);
}

let editSaveLocked = false;

async function saveEditDrawer(root) {
  if (editSaveLocked) return;
  editSaveLocked = true;
  try {
    await commitEditDrawer(root);
  } finally {
    editSaveLocked = false;
  }
}

async function commitEditDrawer(root) {
  const { drawer } = editDrawerNodes(root);
  if (!drawer) return;
  if (drawer.dataset.mode === "reset") {
    const email = drawer.querySelector("#settings-reset-email")?.value.trim();
    if (!email) return;
    openResetInboxModal(root, email);
    try {
      await requestPasswordReset(email);
    } catch (error) {
      console.warn(error);
    }
    return;
  }

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
  } else if (key === "phone") {
    const next = drawer.querySelector("#settings-edit-phone-new")?.value.trim()
      || drawer.querySelector("[data-settings-edit-input]")?.value.trim();
    const nextDigits = (next || "").replace(/\D/g, "");
    const currentDigits = displayPhone(account.phone).replace(/\D/g, "");
    if (!nextDigits || nextDigits === currentDigits) return;

    openPhoneOtpModal(root, next);
    try {
      const pending = account.pendingPhoneChange;
      if (pending?.phone === next) {
        try {
          await resendPhoneChange();
        } catch {
          await requestPhoneChange(next);
        }
      } else {
        await requestPhoneChange(next);
      }
      account = loadAccount();
    } catch (error) {
      console.warn(error);
      showPhoneOtpError(root, "Couldn't send a code. Try again.");
    }
    return;
  } else if (key === "password") {
    const current = drawer.querySelector("#settings-edit-password-current")?.value ?? "";
    const next = drawer.querySelector("#settings-edit-password-new")?.value ?? "";
    const confirmValue = drawer.querySelector("#settings-edit-password-confirm")?.value ?? "";
    const error = drawer.querySelector("[data-settings-password-error]");
    const fail = (message) => {
      if (!error) return;
      error.textContent = message;
      error.hidden = false;
    };
    if (!current || !next || !confirmValue) {
      fail("Fill in all three password fields.");
      return;
    }
    if (current !== account.password) {
      fail("That current password doesn't match.");
      return;
    }
    if (next !== confirmValue) {
      fail("Those new passwords don't match.");
      return;
    }
    if (error) error.hidden = true;
    account.password = next;
    showSettingsBanner(root, "Your password has been updated.");
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

function hoistVerifyDialog(dialog) {
  if (dialog && dialog.parentElement !== document.body) document.body.appendChild(dialog);
}

function openEmailInboxModal(root, pendingEmail) {
  const dialog = document.querySelector("[data-settings-email-inbox]");
  hoistVerifyDialog(dialog);
  const address = dialog?.querySelector("[data-settings-email-inbox-address]");
  if (address) address.textContent = pendingEmail;
  if (dialog) dialog.hidden = false;
  setVerifyOverlay(root);
}

function closeEmailInboxModal(root) {
  const dialog = document.querySelector("[data-settings-email-inbox]");
  if (dialog) dialog.hidden = true;
  setVerifyOverlay(root);
}

function isEmailInboxOpen() {
  const dialog = document.querySelector("[data-settings-email-inbox]");
  return Boolean(dialog && !dialog.hidden);
}

function renderPhoneOtpModal() {
  const digits = Array.from({ length: 6 }, (_, index) => {
    const auto = index === 0 ? ' autocomplete="one-time-code"' : ' autocomplete="off"';
    return `<input class="settings-phone-otp__digit" type="text" inputmode="numeric" maxlength="1" aria-label="Digit ${index + 1}" data-settings-phone-otp-digit${auto} />`;
  }).join("");
  const bodyMarkup = `<div class="settings-phone-otp">
    <h3 class="sessions-modal__title settings-phone-otp__title" id="settings-phone-otp-title">Verify your phone number</h3>
    <p class="sessions-modal__body settings-phone-otp__lead">Enter the 6-digit verification code sent to</p>
    <p class="settings-phone-otp__number" data-settings-phone-otp-number></p>
    <div class="settings-phone-otp__digits" role="group" aria-label="Verification code">${digits}</div>
    <p class="settings-phone-otp__error" data-settings-phone-otp-error hidden></p>
  </div>`;

  const modal = renderSessionsModal({
    bodyMarkup,
    secondaryLabel: "Resend",
    primaryLabel: "Close",
  })
    .replace(
      '<div class="sessions-modal__actions"><button class="sessions-button sessions-button--secondary" type="button"><span class="sessions-button__label">Resend</span></button>',
      '<div class="sessions-modal__actions"><button class="sessions-button sessions-button--secondary" type="button" data-settings-phone-otp-resend><span class="sessions-button__label">Resend</span></button>',
    )
    .replace(
      '<button class="sessions-button sessions-button--primary" type="button"><span class="sessions-button__label">Close</span></button>',
      '<button class="sessions-button sessions-button--primary" type="button" data-settings-phone-otp-close><span class="sessions-button__label">Close</span></button>',
    )
    .replace('class="sessions-modal__close"', 'class="sessions-modal__close" data-settings-phone-otp-close')
    .replace('role="dialog"', 'role="dialog" aria-labelledby="settings-phone-otp-title"');

  return `<div class="settings-dialog settings-phone-otp-dialog" data-settings-phone-otp hidden><button class="settings-dialog__scrim" type="button" data-settings-phone-otp-close aria-label="Close"></button>${modal}</div>`;
}

function phoneOtpDigits() {
  return [...document.querySelectorAll("[data-settings-phone-otp-digit]")];
}

function clearPhoneOtp(root) {
  phoneOtpDigits(root).forEach((input) => {
    input.value = "";
  });
  const error = document.querySelector("[data-settings-phone-otp-error]");
  if (error) {
    error.hidden = true;
    error.textContent = "";
  }
  const dialog = document.querySelector("[data-settings-phone-otp]");
  if (dialog) delete dialog.dataset.submitting;
}

function showPhoneOtpError(root, message) {
  const error = document.querySelector("[data-settings-phone-otp-error]");
  if (!error) return;
  error.textContent = message;
  error.hidden = false;
}

const RESET_RESEND_SECONDS = 60;
let resetResendTimer = 0;

function renderResetInboxModal() {
  const email = renderSessionsInput({
    label: "Email address",
    placeholder: "",
    type: "email",
    id: "settings-reset-inbox-email",
    name: "resetInboxEmail",
    value: "",
    fullWidth: true,
  }).replace("<input ", '<input readonly tabindex="-1" data-settings-reset-inbox-email ');
  const bodyMarkup = `<div class="settings-reset-inbox">
    <h3 class="sessions-modal__title settings-reset-inbox__title" id="settings-reset-inbox-title">Check your inbox</h3>
    <p class="sessions-modal__body settings-reset-inbox__lead">If an account exists for that email address, we&rsquo;ll send a password reset link.</p>
    <div class="settings-reset-inbox__email">${email}</div>
    <p class="settings-reset-inbox__prompt">Didn&rsquo;t receive an email?</p>
    <button class="settings-reset-inbox__resend" type="button" data-settings-reset-inbox-resend disabled>Resend link (${RESET_RESEND_SECONDS}s)</button>
  </div>`;

  const modal = renderSessionsModal({
    bodyMarkup,
    secondaryLabel: "",
    primaryLabel: "Done",
  })
    .replace(
      '<button class="sessions-button sessions-button--primary" type="button"><span class="sessions-button__label">Done</span></button>',
      '<button class="sessions-button sessions-button--primary" type="button" data-settings-reset-inbox-close><span class="sessions-button__label">Done</span></button>',
    )
    .replace('class="sessions-modal__close"', 'class="sessions-modal__close" data-settings-reset-inbox-close')
    .replace('role="dialog"', 'role="dialog" aria-labelledby="settings-reset-inbox-title"');

  return `<div class="settings-dialog settings-reset-inbox-dialog" data-settings-reset-inbox hidden><button class="settings-dialog__scrim" type="button" data-settings-reset-inbox-close aria-label="Close"></button>${modal}</div>`;
}

function paintResetResend(dialog, seconds) {
  const button = dialog?.querySelector("[data-settings-reset-inbox-resend]");
  if (!button) return;
  const waiting = seconds > 0;
  button.disabled = waiting;
  button.textContent = waiting ? `Resend link (${seconds}s)` : "Resend link";
}

function startResetResendCountdown(dialog) {
  window.clearInterval(resetResendTimer);
  let left = RESET_RESEND_SECONDS;
  paintResetResend(dialog, left);
  resetResendTimer = window.setInterval(() => {
    left -= 1;
    paintResetResend(dialog, left);
    if (left <= 0) window.clearInterval(resetResendTimer);
  }, 1000);
}

function openResetInboxModal(root, email) {
  const dialog = document.querySelector("[data-settings-reset-inbox]");
  hoistVerifyDialog(dialog);
  const input = dialog?.querySelector("[data-settings-reset-inbox-email]");
  if (input) input.value = email;
  if (dialog) {
    dialog.dataset.email = email;
    dialog.hidden = false;
    startResetResendCountdown(dialog);
  }
  setVerifyOverlay(root);
}

function closeResetInboxModal(root) {
  window.clearInterval(resetResendTimer);
  const dialog = document.querySelector("[data-settings-reset-inbox]");
  if (dialog) dialog.hidden = true;
  setVerifyOverlay(root);
}

function isResetInboxOpen() {
  const dialog = document.querySelector("[data-settings-reset-inbox]");
  return Boolean(dialog && !dialog.hidden);
}

function setVerifyOverlay(root) {
  const open = isEmailInboxOpen(root) || isPhoneOtpOpen(root) || isResetInboxOpen();
  document.body.classList.toggle("is-settings-verify-open", open);
  const { drawer } = editDrawerNodes(root);
  if (!drawer) return;
  if (open) drawer.setAttribute("aria-hidden", "true");
  else if (!drawer.hidden) drawer.removeAttribute("aria-hidden");
}

function openPhoneOtpModal(root, phone) {
  const dialog = document.querySelector("[data-settings-phone-otp]");
  hoistVerifyDialog(dialog);
  const number = dialog?.querySelector("[data-settings-phone-otp-number]");
  if (number) number.textContent = `${formatOtpPhone(phone)}.`;
  clearPhoneOtp(root);
  if (dialog) dialog.hidden = false;
  setVerifyOverlay(root);
  requestAnimationFrame(() => phoneOtpDigits(root)[0]?.focus());
}

function closePhoneOtpModal(root) {
  const dialog = document.querySelector("[data-settings-phone-otp]");
  if (dialog) dialog.hidden = true;
  clearPhoneOtp(root);
  setVerifyOverlay(root);
}

function isPhoneOtpOpen(root) {
  const dialog = document.querySelector("[data-settings-phone-otp]");
  return Boolean(dialog && !dialog.hidden);
}

function phoneOtpValue(root) {
  return phoneOtpDigits(root).map((input) => input.value).join("");
}

async function submitPhoneOtp(root) {
  const dialog = document.querySelector("[data-settings-phone-otp]");
  const code = phoneOtpValue(root);
  if (!dialog || dialog.dataset.submitting === "true" || code.length !== 6) return;
  dialog.dataset.submitting = "true";

  const result = await confirmPhoneChange(code);
  if (result.ok) {
    account = loadAccount();
    closePhoneOtpModal(root);
    syncAccountPresentation(root);
    setSettingsEditOpen(root, false);
    showSettingsBanner(root, "Your phone number has been updated.");
    return;
  }

  delete dialog.dataset.submitting;
  clearPhoneOtp(root);
  showPhoneOtpError(
    root,
    result.error === "expired"
      ? "That code expired. Resend a new one."
      : "That code doesn't match. Try again.",
  );
  phoneOtpDigits(root)[0]?.focus();
}

function fillPhoneOtp(root, value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 6).split("");
  const inputs = phoneOtpDigits(root);
  inputs.forEach((input, index) => {
    input.value = digits[index] || "";
  });
  if (digits.length === 6) {
    void submitPhoneOtp(root);
    return;
  }
  inputs[digits.length]?.focus();
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
            content: `<div class="settings-page"><p class="settings-banner" data-settings-banner hidden></p>${renderPageTitle({
              title: "Settings",
              body: "Update your personal details and manage your account preferences.",
            })}${renderSettingsCards()}</div>`,
          })}
        </main>
      </div>
      ${renderSessionsFooter()}
      ${renderEditDrawer()}
      ${renderEmailInboxModal()}
      ${renderPhoneOtpModal()}
      ${renderResetInboxModal()}
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
    showSettingsBanner(root, "Your email address has been updated.");
  }
}

function showSettingsBanner(root, message) {
  const banner = root.querySelector("[data-settings-banner]");
  if (!banner) return;
  banner.textContent = message;
  banner.hidden = false;
}

function paintField(row) {
  const field = FIELDS.find((item) => item.key === row.dataset.settingsField);
  const text = row.querySelector("[data-settings-text]");
  if (text) text.textContent = fieldValue(field, row.classList.contains("is-revealed"));
}

function bindAccount(root) {
  const deleteDialog = () => root.querySelector("[data-settings-delete]");
  let saveFromPointer = false;

  document.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (!event.target.closest("[data-settings-edit-save]")) return;
    event.preventDefault();
    saveFromPointer = true;
    void saveEditDrawer(root);
  });

  document.addEventListener("pointerup", () => {
    if (!saveFromPointer) return;
    setTimeout(() => {
      saveFromPointer = false;
    }, 0);
  });

  document.addEventListener("click", (event) => {
    const passwordReveal = event.target.closest("[data-settings-password-reveal]");
    if (passwordReveal) {
      const input = passwordReveal.closest(".sessions-input__control")?.querySelector("[data-settings-password-input]");
      if (!input) return;
      const shown = input.type === "password";
      input.type = shown ? "text" : "password";
      passwordReveal.setAttribute("aria-pressed", String(shown));
      passwordReveal.setAttribute("aria-label", shown ? "Hide password" : "Show password");
      passwordReveal.innerHTML = shown ? EYE_OPEN : EYE_CLOSED;
      return;
    }

    if (event.target.closest("[data-settings-forgot-password]")) {
      showPasswordReset(root);
      return;
    }

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
      if (isEmailInboxOpen(root) || isPhoneOtpOpen(root) || isResetInboxOpen()) return;
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
      if (saveFromPointer) {
        saveFromPointer = false;
        return;
      }
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

    if (event.target.closest("[data-settings-phone-otp-resend]")) {
      clearPhoneOtp(root);
      void resendPhoneChange()
        .then(() => phoneOtpDigits(root)[0]?.focus())
        .catch((error) => {
          console.warn(error);
          showPhoneOtpError(root, "Couldn't resend that code. Change your number again.");
        });
      return;
    }

    if (event.target.closest("[data-settings-phone-otp-close]")) {
      closePhoneOtpModal(root);
      return;
    }

    if (event.target.closest("[data-settings-reset-inbox-resend]")) {
      const dialog = document.querySelector("[data-settings-reset-inbox]");
      const email = dialog?.dataset.email;
      if (!dialog || !email) return;
      void requestPasswordReset(email)
        .then(() => startResetResendCountdown(dialog))
        .catch((error) => console.warn(error));
      return;
    }

    if (event.target.closest("[data-settings-reset-inbox-close]")) {
      if (saveFromPointer) {
        saveFromPointer = false;
        return;
      }
      closeResetInboxModal(root);
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

  document.addEventListener("input", (event) => {
    const input = event.target.closest("[data-settings-phone-otp-digit]");
    if (!input || !isPhoneOtpOpen(root)) return;
    const raw = input.value.replace(/\D/g, "");
    if (raw.length > 1) {
      fillPhoneOtp(root, raw);
      return;
    }
    input.value = raw.slice(-1);
    if (input.value) {
      const inputs = phoneOtpDigits(root);
      const next = inputs[inputs.indexOf(input) + 1];
      if (next) next.focus();
    }
    if (phoneOtpValue(root).length === 6) void submitPhoneOtp(root);
  });

  document.addEventListener("paste", (event) => {
    const input = event.target.closest("[data-settings-phone-otp-digit]");
    if (!input || !isPhoneOtpOpen(root)) return;
    event.preventDefault();
    fillPhoneOtp(root, event.clipboardData?.getData("text") || "");
  });

  document.addEventListener("keydown", (event) => {
    const input = event.target.closest("[data-settings-phone-otp-digit]");
    if (input && isPhoneOtpOpen(root) && event.key === "Backspace" && !input.value) {
      const inputs = phoneOtpDigits(root);
      const prev = inputs[inputs.indexOf(input) - 1];
      if (prev) {
        prev.value = "";
        prev.focus();
      }
    }
    if (event.key !== "Escape") return;
    if (isPhoneOtpOpen(root)) {
      event.stopPropagation();
      closePhoneOtpModal(root);
      return;
    }
    if (isResetInboxOpen()) {
      event.stopPropagation();
      closeResetInboxModal(root);
      return;
    }
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
