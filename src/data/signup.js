/**
 * New-shop signup.
 * Mock today → localStorage "sessions.signup", then "sessions.account" once the shop is created.
 * Later → supabase.auth.signInWithOtp({ email })
 *         supabase.from("businesses").upsert({ owner_email, name, website, team_size, address, mobile_only, lat, lon })
 * An email that already owns a shop goes straight into that shop.
 */
import { loadAccount, saveAccount } from "./account.js";

const SIGNUP_KEY = "sessions.signup";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TEAM_SIZES = [
  { id: "just-me", label: "It's Just Me" },
  { id: "2-5", label: "2-5 Staff" },
  { id: "6-10", label: "6-10 Staff" },
  { id: "11+", label: "11+ Staff" },
];

export function normalizeSignupEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return EMAIL.test(email) ? email : null;
}

export function normalizeShopProfile({ email, website, businessName }) {
  const normalizedEmail = normalizeSignupEmail(email);
  if (!normalizedEmail) throw new Error("Enter a valid email");
  const name = String(businessName || "").trim();
  if (!name) throw new Error("Enter your business name");
  const site = String(website || "").trim();
  return {
    email: normalizedEmail,
    businessName: name,
    website: site || null,
  };
}

export function normalizeTeamSize(value) {
  const id = String(value || "");
  return TEAM_SIZES.some((size) => size.id === id) ? id : null;
}

function coordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeLocation({ address, mobileOnly }) {
  const mobile = Boolean(mobileOnly);
  const line = String(address || "").trim();
  if (!mobile && !line) throw new Error("Enter your address");
  return { address: mobile ? null : line, mobileOnly: mobile };
}

function readDraft() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SIGNUP_KEY) || "");
    if (!parsed || typeof parsed !== "object") return null;
    const email = normalizeSignupEmail(parsed.email);
    if (!email) return null;
    return {
      email,
      businessName: String(parsed.businessName || ""),
      website: parsed.website ? String(parsed.website) : null,
      teamSize: normalizeTeamSize(parsed.teamSize),
      address: parsed.address ? String(parsed.address) : null,
      mobileOnly: Boolean(parsed.mobileOnly),
      lat: coordinate(parsed.lat),
      lon: coordinate(parsed.lon),
      step: parsed.step === "location" ? "location" : parsed.step === "team" ? "team" : "shop",
      updatedAt: String(parsed.updatedAt || ""),
    };
  } catch {
    return null;
  }
}

function writeDraft(draft) {
  const next = { ...draft, step: draft.step || "shop", updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(SIGNUP_KEY, JSON.stringify(next));
  } catch {
    // ponytail: storage can be blocked; the page still holds what they typed
  }
  return next;
}

export function loadSignup() {
  return readDraft();
}

/**
 * Later → supabase.auth.signInWithOtp({ email })
 * @returns {Promise<{ next: string }>}
 */
export function routeAfterEmail(email, account) {
  const normalized = normalizeSignupEmail(email);
  if (!normalized) return null;
  if (account?.businessName && String(account.email || "").toLowerCase() === normalized) return "/";
  return "/signup/shop";
}

export function shopAccountFromDraft(draft) {
  if (!draft?.email || !draft.businessName || !draft.teamSize) return null;
  if (!draft.mobileOnly && !draft.address) return null;
  return {
    name: draft.businessName,
    email: draft.email,
    phone: "",
    password: "",
    businessName: draft.businessName,
    website: draft.website || null,
    teamSize: draft.teamSize,
    address: draft.mobileOnly ? null : draft.address,
    mobileOnly: Boolean(draft.mobileOnly),
    lat: draft.mobileOnly ? null : draft.lat ?? null,
    lon: draft.mobileOnly ? null : draft.lon ?? null,
    pendingEmailChange: null,
    pendingPhoneChange: null,
    pendingPasswordReset: null,
  };
}

export function activateShop() {
  const account = shopAccountFromDraft(readDraft());
  if (!account) return null;
  saveAccount(account);
  return account;
}

export async function continueWithEmail(email) {
  const normalized = normalizeSignupEmail(email);
  if (!normalized) throw new Error("Enter a valid email");
  const next = routeAfterEmail(normalized, loadAccount());
  if (next === "/") return { next };
  const current = readDraft();
  const draft = current?.email === normalized
    ? { ...current, email: normalized }
    : { email: normalized, businessName: "", website: null };
  writeDraft(draft);
  return { next };
}

/**
 * Later → supabase.from("businesses").upsert({ owner_email, name, website })
 * @returns {Promise<{ email: string, businessName: string, website: string | null }>}
 */
export async function saveShopProfile({ website, businessName }) {
  const current = readDraft();
  if (!current?.email) throw new Error("Enter your email first");
  const profile = normalizeShopProfile({
    email: current.email,
    website,
    businessName,
  });
  writeDraft({ ...current, ...profile, step: "shop" });
  return profile;
}

/**
 * Later → supabase.from("businesses").update({ team_size })
 * @returns {Promise<{ teamSize: string }>}
 */
export async function saveTeamSize(teamSize) {
  const current = readDraft();
  if (!current?.email) throw new Error("Enter your email first");
  if (!String(current.businessName || "").trim()) throw new Error("Enter your business name");
  const size = normalizeTeamSize(teamSize);
  if (!size) throw new Error("Choose a team size");
  writeDraft({ ...current, teamSize: size, step: "team" });
  return { teamSize: size };
}

/**
 * Later → supabase.from("businesses").update({ address, mobile_only, lat, lon })
 * Suggestions come from /api/address. A typed address still saves without a point.
 * @returns {Promise<{ address: string | null, mobileOnly: boolean, lat: number | null, lon: number | null }>}
 */
export async function saveLocation({ address, mobileOnly, lat, lon }) {
  const current = readDraft();
  if (!current?.email) throw new Error("Enter your email first");
  if (!String(current.businessName || "").trim()) throw new Error("Enter your business name");
  if (!current.teamSize) throw new Error("Choose a team size");
  const location = normalizeLocation({ address, mobileOnly });
  const point = location.mobileOnly || coordinate(lat) == null || coordinate(lon) == null
    ? { lat: null, lon: null }
    : { lat: coordinate(lat), lon: coordinate(lon) };
  writeDraft({ ...current, ...location, ...point, step: "location" });
  return { ...location, ...point };
}

export function signupSelfCheck() {
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  assert(normalizeSignupEmail("  Good@Shop.com ") === "good@shop.com", "email");
  assert(normalizeSignupEmail("nope") === null, "bad email");
  const shop = normalizeShopProfile({
    email: "a@b.co",
    website: "  sessions.com ",
    businessName: "  June Cuts  ",
  });
  assert(shop.businessName === "June Cuts" && shop.website === "sessions.com", "shop");
  assert(
    normalizeShopProfile({ email: "a@b.co", website: "   ", businessName: "June" }).website === null,
    "empty site",
  );
  let missing = false;
  try {
    normalizeShopProfile({ email: "a@b.co", website: "", businessName: "  " });
  } catch {
    missing = true;
  }
  assert(missing, "name required");
  assert(normalizeTeamSize("2-5") === "2-5", "team size");
  assert(normalizeTeamSize("nope") === null, "bad team size");
  const located = normalizeLocation({ address: "  1 King St ", mobileOnly: false });
  assert(located.address === "1 King St" && located.mobileOnly === false, "address");
  const mobile = normalizeLocation({ address: "1 King St", mobileOnly: true });
  assert(mobile.address === null && mobile.mobileOnly === true, "mobile only");
  let noAddress = false;
  try {
    normalizeLocation({ address: "  ", mobileOnly: false });
  } catch {
    noAddress = true;
  }
  assert(noAddress, "address required");
  const opened = shopAccountFromDraft({
    email: "good@shop.com",
    businessName: "June Cuts",
    website: "sessions.com",
    teamSize: "just-me",
    address: "1 King St",
    mobileOnly: false,
    lat: -33.9,
    lon: 151.2,
  });
  assert(opened?.name === "June Cuts" && opened.email === "good@shop.com" && opened.address === "1 King St", "open shop");
  assert(opened.phone === "" && opened.password === "", "no demo secrets");
  const mobileShop = shopAccountFromDraft({
    email: "good@shop.com",
    businessName: "June Cuts",
    teamSize: "2-5",
    address: "1 King St",
    mobileOnly: true,
    lat: -33.9,
    lon: 151.2,
  });
  assert(mobileShop.address === null && mobileShop.lat === null && mobileShop.lon === null, "mobile shop");
  assert(shopAccountFromDraft({ email: "good@shop.com", businessName: "June Cuts" }) === null, "incomplete shop");
  assert(routeAfterEmail("good@shop.com", opened) === "/", "return home");
  assert(routeAfterEmail("other@shop.com", opened) === "/signup/shop", "new email");
  assert(routeAfterEmail("goodjoblarry@gmail.com", { email: "goodjoblarry@gmail.com", name: "Larry June" }) === "/signup/shop", "demo account");
}
