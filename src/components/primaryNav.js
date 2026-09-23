const PRIMARY_NAV_HREFS = {
  Home: "/",
  Calendar: "/calendar",
};

export function linkPrimaryNav(root, { selected } = {}) {
  root.querySelectorAll(".sessions-rail-item, .sessions-nav-item").forEach((node) => {
    const label = node.getAttribute("aria-label");
    if (!label || node.classList.contains("mobile-menu__toggle")) return;

    if (selected) {
      const on = label === selected;
      node.classList.toggle("is-selected", on);
      if (on) node.setAttribute("aria-pressed", "true");
      else node.removeAttribute("aria-pressed");
    }

    const href = PRIMARY_NAV_HREFS[label];
    if (!href || node.tagName === "A") return;

    const link = document.createElement("a");
    link.className = node.className;
    link.href = href;
    link.setAttribute("aria-label", label);
    if (link.classList.contains("is-selected")) link.setAttribute("aria-current", "page");
    link.innerHTML = node.innerHTML;
    node.replaceWith(link);
  });
}
