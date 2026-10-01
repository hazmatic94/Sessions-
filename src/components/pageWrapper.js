import { renderSessionsPageHeader } from "/ds/src/components/patterns/pageHeader.js";

export function renderPageWrapper({ content = "" } = {}) {
  return `<div class="page-wrapper">${content}</div>`;
}

export function renderPageTitle({ title, body = "", bodyMarkup = "", titleExtra = "", actions = "" } = {}) {
  const header = renderSessionsPageHeader({ title, body, bodyMarkup });
  const withHeading = titleExtra
    ? header.replace(
        /(<h3 class="sessions-page-header__title">[\s\S]*?<\/h3>)/,
        `<div class="page-title__heading">$1${titleExtra}</div>`,
      )
    : header;
  if (!actions) return withHeading;
  return `<div class="page-title">${withHeading}<div class="page-title__actions">${actions}</div></div>`;
}
