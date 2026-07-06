/**
 * eventBus.ts
 * ------------
 * Tiny wrapper around native window CustomEvents, used so the Voice
 * Assistant can tell other parts of the app to react (e.g. stop the
 * currently ringing alarm, or refresh a medicine list) without prop
 * drilling or a heavier state management library.
 */

export const MEDIVOICE_EVENTS = {
  STOP_ALARM: "medivoice:stop-alarm",
  REFRESH_MEDICINES: "medivoice:refresh-medicines",
} as const;

export function emitEvent(name: string) {
  window.dispatchEvent(new CustomEvent(name));
}

export function onEvent(name: string, handler: () => void) {
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}
