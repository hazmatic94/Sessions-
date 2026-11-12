import { bindAuthEntry, renderAuthEntry } from "/src/pages/authEntry.js";

export function mountSignupPage(root) {
  root.innerHTML = renderAuthEntry();
  bindAuthEntry(root);
}
