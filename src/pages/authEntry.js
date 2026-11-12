import { renderSessionsButton } from "/ds/src/components/button/button.js";
import { renderSessionsInput } from "/ds/src/components/input/input.js";
import { renderSessionsLogo } from "/ds/src/components/navigation/logo.js";
import { continueWithEmail } from "/src/data/signup.js";

const PHONE_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M1 3.5C1 2.84 1.26 2.2 1.73 1.73 2.2 1.26 2.84 1 3.5 1h1.14c.72 0 1.35.49 1.52 1.18l.92 3.69a1.5 1.5 0 0 1-.58 1.63l-1.08.8a.4.4 0 0 0-.1.3 8.6 8.6 0 0 0 4.18 4.17.4.4 0 0 0 .29-.1l.81-1.08a1.5 1.5 0 0 1 1.63-.58l3.68.92c.7.17 1.18.8 1.18 1.52V16a2.5 2.5 0 0 1-2.5 2.5h-1.88C6.88 18.5 1 12.62 1 5.38V3.5Z"/></svg>`;

const GOOGLE_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.61Z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"/></svg>`;

const APPLE_ICON = `<svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true"><path fill="currentColor" d="M13.2 9.5c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8s-1.6-.7-2.7-.7c-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.4.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7s1.6.7 2.7.7 1.8-1 2.5-2c.8-1.1 1.1-2.2 1.1-2.3-.1 0-2.2-.8-2.2-3.5ZM11.1 3.2c.6-.7 1-1.7.9-2.7-1 .1-2.1.6-2.7 1.4-.6.7-1.1 1.7-.9 2.6 1 .1 2-.5 2.7-1.3Z"/></svg>`;

function socialButton(icon, label) {
  return `<button type="button" class="sessions-button sessions-button--secondary sessions-button--full-width auth-social">${icon}<span class="sessions-button__label">${label}</span></button>`;
}

export function renderAuthEntry() {
  const email = renderSessionsInput({
    id: "auth-email",
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Enter email here",
    fullWidth: true,
    ariaLabel: "Email",
  });
  const continueButton = renderSessionsButton({
    variant: "primary",
    label: "Continue",
    fullWidth: true,
    type: "submit",
  });

  const logo = renderSessionsLogo({ ariaLabel: "Sessions" }).replace(
    /^<a\b[^>]*>/,
    '<div class="sessions-logo">',
  ).replace("</a>", "</div>");

  return `<main class="auth-screen"><section class="auth-panel"><form class="auth-form" data-auth-form novalidate><div class="auth-form__intro"><h1 class="auth-form__title">Sessions for Barbers</h1><p class="auth-form__lead">Create an account or log in to manage your business</p></div>${email}<p class="auth-form__note">We'll send you a verification code. Standard rates may apply.</p>${continueButton}<div class="auth-or" role="separator"><span>OR</span></div><div class="auth-socials">${socialButton(PHONE_ICON, "Continue with Mobile")}${socialButton(GOOGLE_ICON, "Continue with Google")}${socialButton(APPLE_ICON, "Continue with Apple")}</div><div class="auth-customer"><p>Are you a customer looking to book an appointment?</p><button type="button" class="auth-customer__link">Book as a customer</button></div><p class="auth-legal">This site is protected by reCAPTCHA.<br>Google Privacy Policy and Terms of Service apply</p></form></section><aside class="auth-hero"><div class="auth-hero__mark">${logo}<p class="auth-hero__tag">Book your next session</p></div></aside></main>`;
}

export function setAuthInputError(id, message) {
  const field = document.getElementById(id);
  const label = field?.closest(".sessions-input");
  if (!label) return;
  label.classList.toggle("sessions-input--error", Boolean(message));
  if (message) field.setAttribute("aria-invalid", "true");
  else field.removeAttribute("aria-invalid");
  let note = label.querySelector(".sessions-input__message");
  if (!message) {
    note?.remove();
    return;
  }
  if (!note) {
    note = document.createElement("span");
    note.className = "sessions-input__message";
    note.id = `${id}-message`;
    note.setAttribute("role", "alert");
    label.append(note);
    field.setAttribute("aria-describedby", note.id);
  }
  note.textContent = message;
}

export function bindAuthEntry(root) {
  const form = root.querySelector("[data-auth-form]");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = form.querySelector("#auth-email");
    setAuthInputError("auth-email", "");
    try {
      const { next } = await continueWithEmail(input?.value);
      location.assign(next);
    } catch (error) {
      setAuthInputError("auth-email", error instanceof Error ? error.message : "Enter a valid email");
    }
  });
}
