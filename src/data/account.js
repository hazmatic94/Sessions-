/** @typedef {{ email: string, token: string, requestedAt: string }} PendingEmailChange */

const ACCOUNT_KEY = "sessions.account";
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

const DEFAULT_ACCOUNT = {
  name: "Larry June",
  email: "goodjoblarry@gmail.com",
  phone: "+61 0461455500",
  password: "larryjune",
  pendingEmailChange: null,
};

function normalizeAccount(raw) {
  const merged = { ...DEFAULT_ACCOUNT, ...(raw && typeof raw === "object" ? raw : {}) };
  if (merged.pendingEmailChange && typeof merged.pendingEmailChange !== "object") {
    merged.pendingEmailChange = null;
  }
  return merged;
}

export function loadAccount() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "");
    return normalizeAccount(parsed);
  } catch {
    return { ...DEFAULT_ACCOUNT };
  }
}

export function saveAccount(account) {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    // ponytail: storage can be blocked; in-memory still works for this view
  }
}

function newToken() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function buildEmailVerifyUrl(token) {
  const origin = typeof location !== "undefined" ? location.origin : "http://127.0.0.1:43123";
  return `${origin}/verify-email?token=${encodeURIComponent(token)}`;
}

function logDevVerifyLink(token) {
  if (typeof console === "undefined") return;
  console.info("[sessions] Email verification link (mock):", buildEmailVerifyUrl(token));
}

function pendingIsExpired(pending) {
  const at = Date.parse(pending?.requestedAt || "");
  if (!Number.isFinite(at)) return true;
  return Date.now() - at > PENDING_TTL_MS;
}

/**
 * Mock today → localStorage + console link.
 * Later → POST /account/email-change { newEmail }
 * @returns {Promise<{ pendingEmail: string }>}
 */
export async function requestEmailChange(newEmail) {
  const trimmed = String(newEmail || "").trim();
  if (!trimmed) throw new Error("Email is required");

  const account = loadAccount();
  if (trimmed.toLowerCase() === account.email.toLowerCase()) {
    throw new Error("That is already your email address");
  }

  const token = newToken();
  account.pendingEmailChange = {
    email: trimmed,
    token,
    requestedAt: new Date().toISOString(),
  };
  saveAccount(account);
  logDevVerifyLink(token);
  return { pendingEmail: trimmed };
}

/**
 * Later → POST /account/email-change/resend
 * @returns {Promise<{ pendingEmail: string }>}
 */
export async function resendEmailChange() {
  const account = loadAccount();
  const pending = account.pendingEmailChange;
  if (!pending?.email) throw new Error("No pending email change");

  if (pendingIsExpired(pending)) {
    account.pendingEmailChange = null;
    saveAccount(account);
    throw new Error("This verification link expired. Change your email again.");
  }

  const token = newToken();
  account.pendingEmailChange = {
    email: pending.email,
    token,
    requestedAt: new Date().toISOString(),
  };
  saveAccount(account);
  logDevVerifyLink(token);
  return { pendingEmail: pending.email };
}

/**
 * Later → GET /account/email-change/confirm?token=…
 * @returns {Promise<{ ok: true, email: string } | { ok: false, error: string }>}
 */
export async function confirmEmailChange(token) {
  const trimmed = String(token || "").trim();
  if (!trimmed) return { ok: false, error: "missing_token" };

  const account = loadAccount();
  const pending = account.pendingEmailChange;
  if (!pending || pending.token !== trimmed) {
    return { ok: false, error: "invalid_token" };
  }
  if (pendingIsExpired(pending)) {
    account.pendingEmailChange = null;
    saveAccount(account);
    return { ok: false, error: "expired" };
  }

  account.email = pending.email;
  account.pendingEmailChange = null;
  saveAccount(account);
  return { ok: true, email: account.email };
}

export function getPendingEmailChange() {
  const pending = loadAccount().pendingEmailChange;
  if (!pending) return null;
  if (pendingIsExpired(pending)) {
    const account = loadAccount();
    account.pendingEmailChange = null;
    saveAccount(account);
    return null;
  }
  return pending;
}
