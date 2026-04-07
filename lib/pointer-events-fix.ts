/**
 * Utility to restore pointer events that may be disabled by shadcn/ui Dialog components
 * This fixes issues where pointer-events: none lingers after modal/dropdown closes
 */
export function restorePointerEvents() {
  if (typeof document === 'undefined') {
    return;
  }

  for (const element of [document.body, document.documentElement]) {
    element.style.removeProperty('pointer-events');
    element.removeAttribute('inert');
  }
}
