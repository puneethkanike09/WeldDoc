/** Errors that often mean a stale tab, failed chunk fetch, or bad soft navigation. */
const RECOVERABLE_PATTERNS = [
  /loading chunk/i,
  /chunkloaderror/i,
  /failed to load chunk/i,
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /failed to fetch rsc payload/i,
  /failed to find server action/i,
  /unexpected response from server/i,
  /networkerror/i,
  /load failed/i,
];

const RELOAD_KEY = "welddoc-nav-reload-at";
const RELOAD_COOLDOWN_MS = 15_000;

function messageFrom(reason: unknown): string {
  if (reason instanceof Error) {
    return `${reason.name} ${reason.message}`;
  }
  if (typeof reason === "string") return reason;
  return String(reason ?? "");
}

export function isRecoverableNavigationError(reason: unknown): boolean {
  const message = messageFrom(reason);
  if (!message) return false;
  return RECOVERABLE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Full reload once per cooldown window. Returns true if a reload was triggered.
 * Used after deploy skew or flaky mobile navigation.
 */
export function reloadOnceForNavigationRecovery(): boolean {
  if (typeof window === "undefined") return false;

  const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
  const now = Date.now();
  if (now - last < RELOAD_COOLDOWN_MS) return false;

  sessionStorage.setItem(RELOAD_KEY, String(now));
  window.location.reload();
  return true;
}
