import { confirmEmailChange } from "/src/data/account.js";

export function mountVerifyEmailPage(root) {
  root.innerHTML = `<main class="verify-email"><p class="verify-email__status">Confirming your email…</p></main>`;

  const params = new URLSearchParams(location.search);
  const token = params.get("token") || "";
  const status = root.querySelector(".verify-email__status");

  confirmEmailChange(token).then((result) => {
    if (result.ok) {
      location.replace("/settings?emailVerified=1");
      return;
    }

    const copy =
      result.error === "expired"
        ? "This verification link has expired. Open Settings and request a new one."
        : result.error === "missing_token"
          ? "This link is missing a verification token."
          : "This verification link is invalid or has already been used.";

    if (status) {
      status.textContent = copy;
      status.classList.add("verify-email__status--error");
    }
    root.insertAdjacentHTML(
      "beforeend",
      '<a class="verify-email__link" href="/settings">Back to Settings</a>',
    );
  });
}
