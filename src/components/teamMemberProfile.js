import { renderSessionsAvatarEdit, setupSessionsAvatarEdits } from "/ds/src/components/avatar/avatar.js";
import { renderGhostButton, renderSessionsButton } from "/ds/src/components/button/button.js";
import { renderSessionsClientCard } from "/ds/src/components/cards/clientCard.js";
import { renderSessionsClientForm } from "/ds/src/components/patterns/addClient.js";
import { setSessionsSurfaceDrawerOpen } from "/src/utils/surfaceDrawer.js";
import { prefersReducedSurfaceMotion, runSurfaceStepTransition } from "/ds/src/components/patterns/surfaceSteps.js";
import { renderSessionsSurface } from "/ds/src/components/patterns/surface.js";
import { escapeHtml } from "/ds/src/utils.js";

function splitName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

function splitPhone(phone = "") {
  const match = phone.trim().match(/^(\+\d+)\s*(.*)$/);
  if (!match) return { countryCode: "+61", phone: phone.trim() };
  return { countryCode: match[1], phone: match[2] };
}

const TEAM_PERMISSION_ROLES = ["Workspace Owner", "No Access"];

function renderRoleSelect(selected = "") {
  const value = TEAM_PERMISSION_ROLES.includes(selected) ? selected : TEAM_PERMISSION_ROLES[0];
  const options = TEAM_PERMISSION_ROLES.map(
    (role) => `<option value="${escapeHtml(role)}"${role === value ? " selected" : ""}>${escapeHtml(role)}</option>`,
  ).join("");

  return `<label class="sessions-input sessions-input--full-width sessions-team-profile__role-select"><span class="sessions-input__label">Permission role</span><span class="sessions-input__control"><select class="sessions-input__field" name="role" id="edit-team-role" aria-label="Permission role">${options}</select></span></label>`;
}

function renderTeamMemberForm(member) {
  const { firstName, lastName } = splitName(member.name);
  const { countryCode, phone } = splitPhone(member.phone || "");
  const roleField = renderRoleSelect(member.role);
  const base = renderSessionsClientForm({
    idPrefix: "edit-team",
    formId: "sessions-edit-team-form",
    formAttribute: "data-sessions-edit-team-form",
    firstName,
    lastName,
    email: member.email,
    phone,
    countryCode,
    note: "",
  });

  return base.replace(/<label class="sessions-input sessions-input--multiline[\s\S]*?<\/label>\s*/, roleField);
}

function renderTeamMemberEdit(member) {
  const back = renderGhostButton({
    label: "Back",
    icon: "chevron-left",
    className: "sessions-client-edit__back",
  }).replace("<button ", '<button data-sessions-edit-team-cancel ');
  const close = renderGhostButton({
    icon: "close",
    ariaLabel: "Close team member profile",
    className: "sessions-client-profile__close",
  }).replace("<button ", '<button data-sessions-client-profile-close ');
  const cancel = renderSessionsButton({
    variant: "secondary",
    label: "Cancel",
  }).replace("<button ", '<button data-sessions-edit-team-cancel ');
  const save = renderSessionsButton({
    variant: "primary",
    label: "Save",
    type: "submit",
  }).replace("<button ", '<button form="sessions-edit-team-form" ');

  return `<div class="sessions-client-edit" data-sessions-edit-team><div class="sessions-notifications sessions-surface-step"><div class="sessions-client-edit__nav">${back}${close}</div>${renderSessionsAvatarEdit({
    src: member.avatarSrc,
    name: member.name,
    initial: member.avatarInitial || member.name,
    size: "large",
  })}${renderTeamMemberForm(member)}<div class="sessions-client-edit__actions">${cancel}${save}</div></div></div>`;
}

function renderProfileNav() {
  const back = renderGhostButton({
    label: "Back",
    icon: "chevron-left",
    className: "sessions-client-profile__back",
  }).replace("<button ", '<button data-sessions-client-profile-close ');
  const close = renderGhostButton({
    icon: "close",
    ariaLabel: "Close team member profile",
    className: "sessions-client-profile__close",
  }).replace("<button ", '<button data-sessions-client-profile-close ');

  return `<div class="sessions-client-profile__nav">${back}${close}</div>`;
}

function renderTeamMemberProfile(member) {
  const meta = `<div class="sessions-client-profile__list sessions-team-profile__meta"><p>${escapeHtml(member.phone)}</p><p>${escapeHtml(member.role)}</p></div>`;

  return `<div class="sessions-client-profile sessions-team-profile"><div class="sessions-client-profile__header">${renderProfileNav()}</div>${renderSessionsClientCard({
    name: member.name,
    email: member.email,
    avatarSrc: member.avatarSrc,
    avatarInitial: member.avatarInitial,
    editProfileLabel: "\u200b",
  })}${meta}</div>`;
}

export function renderTeamMemberProfileDrawer() {
  const close = renderSessionsButton({
    variant: "secondary",
    icon: "close",
    ariaLabel: "Close team member profile",
    className: "sessions-surface-close",
  }).replace("<button ", '<button data-sessions-client-profile-close ');

  return `<div class="sessions-surface-scrim" data-sessions-client-profile-scrim hidden></div><div class="sessions-surface-drawer is-sessions-inner-page" data-sessions-client-profile role="dialog" aria-label="Team member profile" hidden>${close}${renderSessionsSurface({
    children: `<div data-sessions-client-profile-body></div>`,
  })}</div>`;
}

function closeTeamActionMenus(root) {
  root.querySelectorAll("[data-sessions-team-actions]").forEach((actions) => {
    const menu = actions.querySelector(".sessions-team-list__menu");
    const trigger = actions.querySelector(":scope > .sessions-button");
    actions.classList.remove("is-open");
    trigger?.setAttribute("aria-expanded", "false");
    if (!menu) return;
    menu.classList.remove("is-closing");
    menu.hidden = true;
  });
  document.body.classList.remove("is-team-sheet-open");
}

function setTeamProfileOpen(root, open) {
  const surface = root.querySelector("[data-sessions-client-profile]");
  const scrim = root.querySelector("[data-sessions-client-profile-scrim]");
  return setSessionsSurfaceDrawerOpen({ drawer: surface, scrim, open, hideScrimOnMobile: true });
}

function memberFromRow(row, members) {
  const name = row?.querySelector(".sessions-team-list__name")?.textContent?.trim();
  return members.find((member) => member.name === name);
}

function paintTeamRow(row, member) {
  const name = row.querySelector(".sessions-team-list__name");
  if (name) name.textContent = member.name;
  const email = row.querySelector(".sessions-team-list__email");
  if (email) email.textContent = member.email;
  const phone = row.querySelector(".sessions-team-list__phone");
  if (phone) phone.textContent = member.phone;
  const role = row.querySelector(".sessions-team-list__role");
  if (role) role.textContent = member.role;
  row.querySelectorAll(".sessions-avatar").forEach((avatar) => {
    const img = avatar.querySelector("img");
    if (img && member.avatarSrc) img.src = member.avatarSrc;
    avatar.setAttribute("aria-label", member.name);
  });
}

export function setupTeamMemberProfiles(root, { members = [], onUpdated } = {}) {
  if (root.dataset.teamMemberProfilesBound === "true") return;
  root.dataset.teamMemberProfilesBound = "true";
  setupSessionsAvatarEdits(root);

  let currentMember = null;
  let currentRow = null;
  let profileStepAnimating = false;

  const mountProfileBody = (html) => {
    const body = root.querySelector("[data-sessions-client-profile-body]");
    if (!body) return;
    body.classList.remove("is-fading");
    body.innerHTML = `<div class="sessions-surface-steps"><div class="sessions-surface-step-panel is-step-active">${html}</div></div>`;
    setupSessionsAvatarEdits(root);
  };

  const swapProfileView = async (html, direction = "forward") => {
    const body = root.querySelector("[data-sessions-client-profile-body]");
    if (!body) return;

    const steps = body.querySelector(".sessions-surface-steps");
    const from = steps?.querySelector(".sessions-surface-step-panel.is-step-active");

    if (!steps || !from || prefersReducedSurfaceMotion() || profileStepAnimating) {
      mountProfileBody(html);
      return;
    }

    const to = document.createElement("div");
    to.className = "sessions-surface-step-panel";
    to.innerHTML = html;
    steps.appendChild(to);

    profileStepAnimating = true;
    await runSurfaceStepTransition(steps, from, to, direction);
    from.remove();
    profileStepAnimating = false;
    setupSessionsAvatarEdits(root);
  };

  const showProfile = () => {
    if (!currentMember) return;
    swapProfileView(renderTeamMemberProfile(currentMember), "back");
  };

  const openMember = (member, row, { edit = false } = {}) => {
    if (!member) return;
    closeTeamActionMenus(root);
    currentMember = member;
    currentRow = row;
    mountProfileBody(edit ? renderTeamMemberEdit(member) : renderTeamMemberProfile(member));
    setTeamProfileOpen(root, true);
  };

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-sessions-edit-team-cancel]")) {
      event.preventDefault();
      showProfile();
      return;
    }

    if (event.target.closest("[data-sessions-client-profile-close], [data-sessions-client-profile-scrim]")) {
      setTeamProfileOpen(root, false);
      currentMember = null;
      currentRow = null;
      return;
    }

    if (event.target.closest(".sessions-team-sheet__close, .sessions-team-list__menu .sessions-team-sheet__scrim")) {
      closeTeamActionMenus(root);
      return;
    }

    const action = event.target.closest("[data-sessions-team-action]");
    if (action) {
      event.preventDefault();
      const row = action.closest(".sessions-team-list__row");
      const member = memberFromRow(row, members);
      if (!member) return;
      currentMember = member;
      currentRow = row;
      closeTeamActionMenus(root);
      const body = root.querySelector("[data-sessions-client-profile-body]");
      if (action.dataset.sessionsTeamAction === "edit" && body) {
        const drawerOpen = root.querySelector("[data-sessions-client-profile]:not([hidden])");
        if (drawerOpen && currentMember) {
          swapProfileView(renderTeamMemberEdit(currentMember), "forward");
        } else {
          openMember(member, row, { edit: true });
        }
      }
      return;
    }
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (root.querySelector("[data-sessions-team-actions].is-open")) {
      closeTeamActionMenus(root);
      return;
    }
    if (root.querySelector("[data-sessions-edit-team]")) {
      showProfile();
      return;
    }
    setTeamProfileOpen(root, false);
    currentMember = null;
    currentRow = null;
  });

  root.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-sessions-edit-team-form]");
    if (!form || !currentMember) return;
    event.preventDefault();
    const data = new FormData(form);
    const firstName = String(data.get("firstName") || "").trim();
    const lastName = String(data.get("lastName") || "").trim();
    const name = [firstName, lastName].filter(Boolean).join(" ");
    const countryCode = String(data.get("countryCode") || "").trim();
    const phoneDigits = String(data.get("phone") || "").trim();
    currentMember.name = name || currentMember.name;
    currentMember.email = String(data.get("email") || "").trim();
    currentMember.phone = phoneDigits ? `${countryCode} ${phoneDigits}` : currentMember.phone;
    currentMember.role = String(data.get("role") || "").trim() || currentMember.role;

    if (currentRow) paintTeamRow(currentRow, currentMember);
    onUpdated?.(currentMember);
    showProfile();
  });
}
