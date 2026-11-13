import { renderSessionsButton } from "/ds/src/components/button/button.js";
import { renderSessionsCheckbox } from "/ds/src/components/checkbox/checkbox.js";
import { renderSessionsFooter } from "/ds/src/components/patterns/footer.js";
import { renderSessionsInput } from "/ds/src/components/input/input.js";
import { loadSignup, saveLocation } from "/src/data/signup.js";
import { setAuthInputError } from "/src/pages/authEntry.js";
import { renderSignupProgress } from "/src/pages/signupShopPage.js";

const PIN = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5A4.5 4.5 0 0 0 8 1.5Zm0 6.1a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Z"/></svg>`;

function renderLocationPage(draft) {
  const address = renderSessionsInput({
    id: "location-address",
    name: "address",
    type: "text",
    label: "Where are you operating from?",
    placeholder: "Search for your address",
    value: draft.address || "",
    fullWidth: true,
    disabled: Boolean(draft.mobileOnly),
    rightIcon: PIN,
    ariaLabel: "Business address",
  });
  const checkbox = renderSessionsCheckbox({
    checked: Boolean(draft.mobileOnly),
    attributes: { id: "location-mobile", name: "mobileOnly" },
  });
  const continueButton = renderSessionsButton({
    variant: "primary",
    label: "Continue",
    fullWidth: true,
    type: "submit",
  });

  return `<main class="shop-screen">${renderSignupProgress(3)}<div class="shop-main"><form class="shop-form" data-location-form novalidate><div class="shop-form__intro"><h1 class="shop-form__title">Set your location</h1><p class="shop-form__lead">Add your business location so your clients can easily find you</p></div><div class="location-field">${address}<ul class="location-suggest" id="location-suggest" role="listbox" hidden></ul></div><label class="location-mobile" for="location-mobile">${checkbox}<span>I don't have a business address (mobile and online services only)</span></label>${continueButton}</form></div>${renderSessionsFooter()}</main>`;
}

function bindAddressSuggest(field, list) {
  let timer = 0;
  let requestId = 0;
  let active = -1;
  let suggestions = [];
  let suppress = false;

  field.autocomplete = "off";
  field.setAttribute("aria-autocomplete", "list");
  field.setAttribute("aria-controls", "location-suggest");
  field.setAttribute("aria-expanded", "false");

  function close() {
    list.hidden = true;
    list.innerHTML = "";
    active = -1;
    suggestions = [];
    field.setAttribute("aria-expanded", "false");
  }

  function paint() {
    list.innerHTML = "";
    if (!suggestions.length) {
      const empty = document.createElement("li");
      empty.className = "location-suggest__empty";
      empty.textContent = "No matching address";
      list.append(empty);
    } else {
      suggestions.forEach((suggestion, index) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "location-suggest__option";
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", index === active ? "true" : "false");
        if (index === active) button.classList.add("is-active");
        button.textContent = suggestion.label;
        button.addEventListener("mousedown", (event) => event.preventDefault());
        button.addEventListener("click", () => choose(index));
        item.append(button);
        list.append(item);
      });
    }
    list.hidden = false;
    field.setAttribute("aria-expanded", "true");
  }

  function choose(index) {
    const suggestion = suggestions[index];
    if (!suggestion) return;
    suppress = true;
    field.value = suggestion.label;
    field.dataset.lat = suggestion.lat ?? "";
    field.dataset.lon = suggestion.lon ?? "";
    suppress = false;
    close();
    setAuthInputError("location-address", "");
  }

  async function search(query) {
    const id = ++requestId;
    const response = await fetch(`/api/address?q=${encodeURIComponent(query)}`);
    if (id !== requestId) return;
    suggestions = response.ok ? await response.json() : [];
    if (!Array.isArray(suggestions)) suggestions = [];
    active = suggestions.length ? 0 : -1;
    paint();
  }

  field.addEventListener("input", () => {
    if (suppress) return;
    field.dataset.lat = "";
    field.dataset.lon = "";
    window.clearTimeout(timer);
    const query = field.value.trim();
    if (query.length < 3) {
      requestId += 1;
      close();
      return;
    }
    timer = window.setTimeout(() => {
      search(query).catch(() => close());
    }, 300);
  });

  field.addEventListener("keydown", (event) => {
    if (list.hidden) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      active = Math.min(active + 1, suggestions.length - 1);
      paint();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      active = Math.max(active - 1, 0);
      paint();
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape") {
      close();
    }
  });

  document.addEventListener("click", (event) => {
    if (!field.closest(".location-field")?.contains(event.target)) close();
  });

  return { close };
}

function setAddressDisabled(field, disabled) {
  const label = field?.closest(".sessions-input");
  if (!field || !label) return;
  field.disabled = disabled;
  label.classList.toggle("is-disabled", disabled);
  if (disabled) field.value = "";
}

export function mountSignupLocationPage(root) {
  const draft = loadSignup();
  if (!draft?.email) {
    location.replace("/signup");
    return;
  }
  if (!draft.businessName) {
    location.replace("/signup/shop");
    return;
  }
  if (!draft.teamSize) {
    location.replace("/signup/team");
    return;
  }
  root.innerHTML = renderLocationPage(draft);
  const form = root.querySelector("[data-location-form]");
  const field = form?.querySelector("#location-address");
  const list = form?.querySelector("#location-suggest");
  const mobile = form?.querySelector("#location-mobile");
  const suggest = field && list ? bindAddressSuggest(field, list) : null;
  if (draft.lat != null && draft.lon != null && field) {
    field.dataset.lat = String(draft.lat);
    field.dataset.lon = String(draft.lon);
  }
  mobile?.addEventListener("change", () => {
    setAddressDisabled(field, mobile.checked);
    setAuthInputError("location-address", "");
    if (mobile.checked) {
      field.dataset.lat = "";
      field.dataset.lon = "";
      suggest?.close();
    }
  });
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthInputError("location-address", "");
    try {
      await saveLocation({
        address: field?.value,
        mobileOnly: Boolean(mobile?.checked),
        lat: field?.dataset.lat,
        lon: field?.dataset.lon,
      });
      location.assign("/signup/done");
    } catch (error) {
      setAuthInputError("location-address", error instanceof Error ? error.message : "Enter your address");
    }
  });
}
