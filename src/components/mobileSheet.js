const MENU_SELECTOR =
  ".sessions-team-list__menu, .sessions-service-list__menu, .sessions-client-card__menu, .team-shifts__menu";

export function upgradeMobileSheetMenu(menu) {
  if (!menu || menu.dataset.mobileSheetReady === "true") return;
  menu.dataset.mobileSheetReady = "true";
  menu.classList.add("sessions-mobile-sheet");
}

export function refreshMobileSheetMenus(root = document) {
  root.querySelectorAll(MENU_SELECTOR).forEach(upgradeMobileSheetMenu);
}

export function setupMobileSheetMenus(root = document) {
  if (root.dataset.mobileSheetMenusBound === "true") return;
  root.dataset.mobileSheetMenusBound = "true";
  refreshMobileSheetMenus(root);
}
