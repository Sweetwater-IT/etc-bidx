/**
 * Utility to restore pointer events that may be disabled by shadcn/ui Dialog components
 * This fixes issues where pointer-events: none lingers after modal/dropdown closes
 */
export function restorePointerEvents() {
  // Remove any lingering pointer-events: none from body
  document.body.style.pointerEvents = '';
  // Also clean up any inert attributes if present
  document.body.removeAttribute('inert');
}