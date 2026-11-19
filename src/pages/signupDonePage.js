import { renderSessionsButton } from "/ds/src/components/button/button.js";
import { renderSessionsFooter } from "/ds/src/components/patterns/footer.js";
import { activateShop, loadSignup } from "/src/data/signup.js";
import { requireSignedIn } from "/src/data/supabaseAuth.js";

function renderDonePage() {
  const done = renderSessionsButton({
    variant: "primary",
    label: "Done",
    type: "button",
  });
  return `<main class="shop-screen"><div class="shop-main"><div class="signup-done"><div class="signup-done__check" role="img" aria-label="Success"></div><h1 class="shop-form__title">Your Business is Set Up!</h1><p class="shop-form__lead">Good-Job, Now lets get that money up.</p>${done}</div></div>${renderSessionsFooter()}</main>`;
}

export async function mountSignupDonePage(root) {
  if (!requireSignedIn()) return;
  const draft = loadSignup();
  if (!draft?.email) {
    location.replace("/signup");
    return;
  }
  if (draft.step !== "location" && draft.step !== "done") {
    location.replace("/signup/location");
    return;
  }
  let problem = "";
  try {
    await activateShop();
  } catch (error) {
    problem = error instanceof Error ? error.message : "Could not save your shop";
  }
  root.innerHTML = renderDonePage();
  if (problem) {
    const lead = root.querySelector(".shop-form__lead");
    if (lead) lead.textContent = problem;
  }
  root.querySelector(".sessions-button")?.addEventListener("click", () => {
    location.assign("/");
  });
}
