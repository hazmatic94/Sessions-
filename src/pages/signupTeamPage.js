import { renderSessionsButton } from "/ds/src/components/button/button.js";
import { renderSessionsFooter } from "/ds/src/components/patterns/footer.js";
import { TEAM_SIZES, loadSignup, saveTeamSize } from "/src/data/signup.js";
import { renderSignupProgress } from "/src/pages/signupShopPage.js";

const CHECK = `<svg class="team-size__check" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6.2 10.2 8.7 12.7 13.8 7.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function renderTeamPage(draft) {
  const options = TEAM_SIZES.map((size) => {
    const selected = draft.teamSize === size.id;
    return `<button type="button" class="team-size${selected ? " is-selected" : ""}" role="radio" aria-checked="${selected ? "true" : "false"}" data-team-size="${size.id}"><span>${size.label}</span>${CHECK}</button>`;
  }).join("");
  const continueButton = renderSessionsButton({
    variant: "primary",
    label: "Continue",
    fullWidth: true,
    type: "submit",
  });

  return `<main class="shop-screen">${renderSignupProgress(2)}<div class="shop-main"><form class="shop-form" data-team-form novalidate><div class="shop-form__intro"><h1 class="shop-form__title">What's your team size?</h1><p class="shop-form__lead">This will help us set up your calendar correctly. Don't worry, this doesn't change the price - you can have unlimited team members for free on Sessions</p></div><div class="team-sizes" role="radiogroup" aria-label="Team size">${options}</div><p class="team-size__error" data-team-error hidden></p>${continueButton}</form></div>${renderSessionsFooter()}</main>`;
}

export function mountSignupTeamPage(root) {
  const draft = loadSignup();
  if (!draft?.email) {
    location.replace("/signup");
    return;
  }
  if (!draft.businessName) {
    location.replace("/signup/shop");
    return;
  }
  root.innerHTML = renderTeamPage(draft);
  const form = root.querySelector("[data-team-form]");
  const error = form?.querySelector("[data-team-error]");
  form?.querySelectorAll("[data-team-size]").forEach((button) => {
    button.addEventListener("click", () => {
      form.querySelectorAll("[data-team-size]").forEach((option) => {
        const selected = option === button;
        option.classList.toggle("is-selected", selected);
        option.setAttribute("aria-checked", selected ? "true" : "false");
      });
      if (error) {
        error.hidden = true;
        error.textContent = "";
      }
    });
  });
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selected = form.querySelector("[data-team-size].is-selected");
    try {
      await saveTeamSize(selected?.dataset.teamSize);
      location.assign("/signup/location");
    } catch (err) {
      if (!error) return;
      error.hidden = false;
      error.textContent = err instanceof Error ? err.message : "Choose a team size";
    }
  });
}
