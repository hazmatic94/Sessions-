/**
 * Email code auth against Supabase Auth.
 * Later this is supabase.auth.signInWithOtp / verifyOtp.
 * The key in supabasePublic.js is the public publishable key.
 */
import { SUPABASE_KEY, SUPABASE_URL } from "./supabasePublic.js";

const SESSION_KEY = "sessions.auth";
const PENDING_KEY = "sessions.auth.pending";

export function normalizeEmailCode(value) {
  const code = String(value || "").replace(/\s/g, "");
  return /^\d{6}$/.test(code) ? code : null;
}

export function routeAfterVerified(business) {
  return business?.name ? "/" : "/signup/shop";
}

export function sessionFromRedirectHash(hash) {
  const params = new URLSearchParams(String(hash || "").replace(/^#/, ""));
  const accessToken = params.get("access_token");
  if (!accessToken) return null;
  return {
    accessToken,
    refreshToken: params.get("refresh_token") || "",
    expiresAt: Date.now() + Number(params.get("expires_in") || 3600) * 1000,
    email: "",
  };
}

export function requireSignedIn() {
  if (loadAuthSession()) return true;
  location.replace("/login");
  return false;
}

export function loadAuthSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || "");
    if (!parsed?.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function loadPendingEmail() {
  try {
    return localStorage.getItem(PENDING_KEY) || "";
  } catch {
    return "";
  }
}

export function savePendingEmail(email) {
  try {
    if (email) localStorage.setItem(PENDING_KEY, email);
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // ponytail: storage can be blocked; the open form still shows the code step
  }
}

function authHeaders(token) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token || SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function errorMessage(response) {
  const body = await response.json().catch(() => ({}));
  return body.msg || body.message || body.error_description || "Something went wrong";
}

export async function sendEmailCode(email) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, create_user: true }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
}

export async function verifyEmailCode(email, token) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, token, type: "email" }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  const body = await response.json();
  return saveAuthSession({
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: Date.now() + Number(body.expires_in || 3600) * 1000,
    email: body.user?.email || email,
  });
}

async function freshSession() {
  const session = loadAuthSession();
  if (!session?.accessToken) throw new Error("Sign in first");
  if (session.expiresAt - Date.now() > 60_000) return session;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  const body = await response.json();
  return saveAuthSession({
    accessToken: body.access_token,
    refreshToken: body.refresh_token || session.refreshToken,
    expiresAt: Date.now() + Number(body.expires_in || 3600) * 1000,
    email: body.user?.email || session.email,
  });
}

export async function authUser() {
  const session = await freshSession();
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: authHeaders(session.accessToken),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}

async function rest(path, { method = "GET", body } = {}) {
  const session = await freshSession();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      ...authHeaders(session.accessToken),
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  if (response.status === 204) return null;
  return response.json();
}

export async function currentBusiness() {
  const rows = await rest("businesses?select=id,name,website,team_size,address,mobile_only,lat,lon&limit=1");
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function createShop(account) {
  const created = await rest("rpc/create_shop", {
    method: "POST",
    body: {
      shop_name: account.businessName,
      shop_website: account.website,
      shop_team_size: account.teamSize,
      shop_address: account.address,
      shop_mobile_only: account.mobileOnly,
      shop_lat: account.lat,
      shop_lon: account.lon,
    },
  });
  return Array.isArray(created) ? created[0] : created;
}

export function authSelfCheck() {
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  assert(normalizeEmailCode(" 123 456 ") === "123456", "code spaces");
  assert(normalizeEmailCode("12345") === null, "short code");
  assert(normalizeEmailCode("abcdef") === null, "letters");
  assert(routeAfterVerified({ name: "June Cuts" }) === "/", "existing shop");
  assert(routeAfterVerified(null) === "/signup/shop", "new shop");
  const session = sessionFromRedirectHash("#access_token=abc&refresh_token=def&expires_in=10");
  assert(session?.accessToken === "abc" && session.refreshToken === "def", "magic link");
  assert(sessionFromRedirectHash("") === null, "no magic link");
}
