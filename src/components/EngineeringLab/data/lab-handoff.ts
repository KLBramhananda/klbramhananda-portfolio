/**
 * The System Design, ERP / Procurement and Production Incident labs are screens
 * inside `/lab` (opened by state, not by URL). This lets something outside the
 * Lab page (the terminal, a new browser tab) ask `/lab` to open one of them:
 * through a sessionStorage key (same tab) or an `?open=<module id>` query.
 */
export const LAB_OPEN_KEY = "bk:lab:open";

/** The module id requested for this visit, if any. Read-only, so it is safe to call twice (StrictMode). */
export function peekLabHandoff(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("open") ?? window.sessionStorage.getItem(LAB_OPEN_KEY);
  } catch {
    return null;
  }
}

/** Clears the request once it has been used. */
export function clearLabHandoff() {
  try {
    window.sessionStorage.removeItem(LAB_OPEN_KEY);
    const url = new URL(window.location.href);
    if (url.searchParams.has("open")) {
      url.searchParams.delete("open");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  } catch {
    /* private mode: nothing to clear */
  }
}
