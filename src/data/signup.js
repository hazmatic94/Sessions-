/**
 * New-shop signup. This is not the logged-in mock account.
 * Mock today → localStorage "sessions.signup"
 * Later → supabase.auth.signInWithOtp({ email })
 *         supabase.from("businesses").upsert({ owner_email, name, website, team_size })
 * An email that already owns a shop goes to login, not this draft.
 */

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
      step: parsed.step === "team" ? "team" : "shop",
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
export async function continueWithEmail(email) {
  const normalized = normalizeSignupEmail(email);
  if (!normalized) throw new Error("Enter a valid email");
  const current = readDraft();
  const draft = current?.email === normalized
    ? { ...current, email: normalized }
    : { email: normalized, businessName: "", website: null };
  writeDraft(draft);
  return { next: "/signup/shop" };
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
}
