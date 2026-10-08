import { renderPrimaryButton, renderSecondaryButton } from "/ds/src/components/button/button.js";
import { renderSessionsInput } from "/ds/src/components/input/input.js";
import { renderSessionsModal } from "/ds/src/components/modal/modal.js";
import {
  renderMobileMenu,
  renderSessionsLeftRail,
  renderTopNav,
  setupSessionsProfileMenu,
} from "/ds/src/components/navigation/index.js";
import { renderSessionsFooter } from "/ds/src/components/patterns/footer.js";
import { escapeHtml } from "/ds/src/utils.js";
import { renderPageTitle, renderPageWrapper } from "/src/components/pageWrapper.js";
import { linkPrimaryNav } from "/src/components/primaryNav.js";

const navOptions = {
  href: "/",
  ariaLabel: "Sessions home",
};

const ACCOUNT_KEY = "sessions.account";

const DEFAULT_ACCOUNT = {
  name: "Larry June",
  email: "goodjoblarry@gmail.com",
  phone: "+61 0461455500",
  password: "larryjune",
};

const FIELDS = [
  { key: "name", label: "Name", type: "text", body: "Update the name on your account." },
  { key: "email", label: "Email", type: "email", body: "Update the email on your account." },
  { key: "phone", label: "Phone number", type: "tel", body: "Update the phone number on your account." },
  { key: "password", label: "Password", type: "password", body: "Update the password on your account." },
];

const EYE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-3.2 4.2M6.1 6.1C3.7 7.8 2 12 2 12a18.7 18.7 0 0 0 6.2 5.6 11 11 0 0 0 3.7 1.4"/></svg>`;

function loadAccount() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "");
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_ACCOUNT };
    return { ...DEFAULT_ACCOUNT, ...parsed };
  } catch {
    return { ...DEFAULT_ACCOUNT };
  }
}

function writeAccount(account) {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    // ponytail: storage can be blocked; the values still show for this page view
  }
}

let account = loadAccount();

function fieldValue(field, revealed) {
  if (field.key !== "password" || revealed) return account[field.key];
  return "••••••••";
}

function renderField(field) {
  const reveal = field.key === "password"
    ? `<button class="settings-account__reveal" type="button" data-settings-reveal aria-pressed="false" aria-label="Show password">${EYE_OFF}</button>`
    : "";
  return `<div class="settings-account__row" data-settings-row data-settings-field="${field.key}" data-settings-type="${field.type}">
    <span class="settings-account__label">${field.label}:</span>
    <div class="settings-account__value" data-settings-value><span data-settings-text>${escapeHtml(fieldValue(field, false))}</span>${reveal}</div>
    ${renderSecondaryButton({ label: "Edit" }).replace("<button ", '<button data-settings-edit ')}
  </div>`;
}

function renderEditModal() {
  const modal = renderSessionsModal({
    title: "Edit name",
    bodyMarkup: `<h3 class="sessions-modal__title" id="sessions-modal-title-edit-name">Edit name</h3><p class="sessions-modal__body" data-settings-edit-body>Update the name on your account.</p>${renderSessionsInput({
      label: "Name",
      placeholder: "",
      id: "settings-edit-field",
      name: "settings-edit",
      fullWidth: true,
    }).replace("<input ", '<input data-settings-edit-input ')}`,
    secondaryLabel: "Cancel",
    primaryLabel: "Save",
  })
    .replace('class="sessions-button sessions-button--secondary"', 'class="sessions-button sessions-button--secondary" data-settings-edit-cancel')
    .replace('class="sessions-button sessions-button--primary"', 'class="sessions-button sessions-button--primary" data-settings-edit-save')
    .replace('class="sessions-modal__close"', 'class="sessions-modal__close" data-settings-edit-cancel');

  return `<div class="settings-edit" data-settings-edit-modal hidden><button class="settings-edit__scrim" type="button" data-settings-edit-cancel aria-label="Cancel"></button>${modal}</div>`;
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

  return `<div class="settings-delete" data-settings-delete hidden><button class="settings-delete__scrim" type="button" data-settings-delete-cancel aria-label="Cancel"></button>${modal}</div>`;
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
            content: `<div class="settings-page"><div class="page-title">${renderPageTitle({
              title: "Account",
              body: "Edit and manage the content of your online profile",
            })}</div><section class="settings-account">${FIELDS.map(renderField).join("")}<div class="settings-account__danger"><div><p class="settings-account__danger-title">Delete your account</p><p class="settings-account__danger-body">Temporarily disable your account.</p></div>${renderPrimaryButton({ label: "Delete Account", className: "settings-account__delete" }).replace("<button ", '<button data-settings-delete-open ')}</div></section></div>`,
          })}
        </main>
      </div>
      ${renderSessionsFooter()}
      ${renderEditModal()}
      ${renderDeleteModal()}
    </div>
  `;
}

export function mountSettingsPage(root) {
  account = loadAccount();
  root.innerHTML = renderSettingsPage();
  root.querySelector("#top-nav").innerHTML = renderTopNav(navOptions);
  setupSessionsProfileMenu(root);
  root.querySelector("#rail").innerHTML = renderSessionsLeftRail({
    selected: "settings",
  });
  root.querySelector("#mobile-nav").innerHTML = renderMobileMenu(navOptions);
  bindMobileMenu(root);
  linkPrimaryNav(root, { selected: "Settings" });
  bindAccount(root);
}

function paintField(row) {
  const field = FIELDS.find((item) => item.key === row.dataset.settingsField);
  const text = row.querySelector("[data-settings-text]");
  if (text) text.textContent = fieldValue(field, row.classList.contains("is-revealed"));
}

function bindAccount(root) {
  const editDialog = () => root.querySelector("[data-settings-edit-modal]");
  const deleteDialog = () => root.querySelector("[data-settings-delete]");

  const closeEdit = () => {
    const modal = editDialog();
    if (modal) modal.hidden = true;
  };

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

    const edit = event.target.closest("[data-settings-edit]");
    if (edit) {
      const row = edit.closest("[data-settings-row]");
      const field = FIELDS.find((item) => item.key === row.dataset.settingsField);
      const modal = editDialog();
      if (!field || !modal) return;
      modal.dataset.field = field.key;
      const title = modal.querySelector(".sessions-modal__title");
      if (title) title.textContent = `Edit ${field.label.toLowerCase()}`;
      const body = modal.querySelector("[data-settings-edit-body]");
      if (body) body.textContent = field.body;
      const label = modal.querySelector(".sessions-input__label");
      if (label) label.textContent = field.label;
      const input = modal.querySelector("[data-settings-edit-input]");
      input.type = field.type;
      input.value = account[field.key];
      modal.hidden = false;
      input.focus();
      return;
    }

    if (event.target.closest("[data-settings-edit-save]")) {
      const modal = editDialog();
      const input = modal?.querySelector("[data-settings-edit-input]");
      const key = modal?.dataset.field;
      const next = input?.value.trim();
      if (key && next) account[key] = next;
      if (key) writeAccount(account);
      const row = root.querySelector(`[data-settings-field="${key}"]`);
      if (row) paintField(row);
      closeEdit();
      return;
    }

    if (event.target.closest("[data-settings-edit-cancel]")) {
      closeEdit();
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
    if (editDialog() && !editDialog().hidden) {
      event.stopPropagation();
      closeEdit();
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
