export const AUTH_STATE_CHANGED_EVENT = 'lookitry-auth-changed';

export function dispatchAuthStateChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}
