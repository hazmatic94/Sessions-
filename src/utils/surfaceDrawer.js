const MOTION_MS = 288;

export function isMobileViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

export function prefersReducedSurfaceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const closeTokens = new WeakMap();

function bumpCloseToken(drawer) {
  const next = (closeTokens.get(drawer) || 0) + 1;
  closeTokens.set(drawer, next);
  return next;
}

/** @param {{ drawer?: HTMLElement | null, scrim?: HTMLElement | null, open: boolean, hideScrimOnMobile?: boolean, onClosed?: () => void }} options */
export function setSessionsSurfaceDrawerOpen({
  drawer,
  scrim = null,
  open,
  hideScrimOnMobile = true,
  onClosed,
} = {}) {
  if (!drawer) return Promise.resolve();

  const mobile = isMobileViewport();

  if (open) {
    bumpCloseToken(drawer);
    drawer.classList.remove("is-closing");
    if (scrim) {
      scrim.classList.remove("is-closing");
      if (mobile && hideScrimOnMobile) scrim.hidden = true;
      else scrim.hidden = false;
    }
    drawer.hidden = false;
    document.body.classList.toggle("is-sessions-inner-page-open", mobile);
    return Promise.resolve();
  }

  document.body.classList.toggle("is-sessions-inner-page-open", false);

  if (drawer.hidden || prefersReducedSurfaceMotion()) {
    drawer.classList.remove("is-closing");
    drawer.hidden = true;
    if (scrim) {
      scrim.classList.remove("is-closing");
      scrim.hidden = true;
    }
    onClosed?.();
    return Promise.resolve();
  }

  const token = bumpCloseToken(drawer);
  drawer.classList.add("is-closing");
  scrim?.classList.add("is-closing");

  return new Promise((resolve) => {
    const finish = () => {
      if (token !== closeTokens.get(drawer)) return;
      drawer.classList.remove("is-closing");
      drawer.hidden = true;
      if (scrim) {
        scrim.classList.remove("is-closing");
        scrim.hidden = true;
      }
      onClosed?.();
      resolve();
    };

    const onEnd = (event) => {
      if (event.target !== drawer || event.propertyName !== "transform") return;
      drawer.removeEventListener("transitionend", onEnd);
      finish();
    };

    drawer.addEventListener("transitionend", onEnd);
    window.setTimeout(finish, MOTION_MS);
  });
}
