import { bindAuthEntry, renderAuthEntry } from "/src/pages/authEntry.js";

export function mountLoginPage(root) {
  root.innerHTML = renderAuthEntry();
  bindAuthEntry(root);
}
