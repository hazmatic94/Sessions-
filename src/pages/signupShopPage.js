import { renderSessionsButton } from "/ds/src/components/button/button.js";
import { renderSessionsFooter } from "/ds/src/components/patterns/footer.js";
import { renderSessionsInput } from "/ds/src/components/input/input.js";
import { loadSignup, saveShopProfile } from "/src/data/signup.js";
import { setAuthInputError } from "/src/pages/authEntry.js";

export function renderSignupProgress(step) {
  const tracks = [1, 2, 3]
    .map(() => `<span class="shop-progress__track"><span class="shop-progress__fill"></span></span>`)
    .join("");
  return `<div class="shop-progress" data-step="${step}" role="progressbar" aria-valuemin="1" aria-valuemax="3" aria-valuenow="${step}" aria-label="Step ${step} of 3">${tracks}</div>`;
}

function renderShopPage(draft) {
  const website = renderSessionsInput({
    id: "shop-website",
    name: "website",
    type: "text",
    label: "Website (Optional)",
    placeholder: "sessions.com",
    value: draft.website || "",
    fullWidth: true,
    ariaLabel: "Website",
  });
  const businessName = renderSessionsInput({
    id: "shop-name",
    name: "businessName",
    type: "text",
    label: "Business name",
    placeholder: "Enter the name of your business",
    value: draft.businessName || "",
    fullWidth: true,
    ariaLabel: "Business name",
  });
  const continueButton = renderSessionsButton({
    variant: "primary",
    label: "Continue",
    fullWidth: true,
    type: "submit",
  });

  return `<main class="shop-screen">${renderSignupProgress(1)}<div class="shop-main"><div class="shop-form__intro"><h1 class="shop-form__title">What's your shop's name?</h1><p class="shop-form__lead">This is the brand name your clients will see. Your billing and legal name can be added later.</p></div><form class="shop-form" data-shop-form novalidate><div class="shop-fields">${website}${businessName}</div>${continueButton}</form></div>${renderSessionsFooter()}</main>`;
}

export function mountSignupShopPage(root) {
  const draft = loadSignup();
  if (!draft) {
    location.replace("/signup");
    return;
  }
  root.innerHTML = renderShopPage(draft);
  root.querySelector("[data-shop-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setAuthInputError("shop-name", "");
    try {
      await saveShopProfile({
        website: form.querySelector("#shop-website")?.value,
        businessName: form.querySelector("#shop-name")?.value,
      });
      location.assign("/signup/team");
    } catch (error) {
      setAuthInputError("shop-name", error instanceof Error ? error.message : "Enter your business name");
    }
  });
}
