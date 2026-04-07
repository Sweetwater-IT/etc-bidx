'use client'

type SignOrderDebugDetails = Record<string, unknown>

export function logSignOrderDebug(
  event: string,
  details: SignOrderDebugDetails = {}
) {
  const payload = {
    event,
    details,
    path:
      typeof window !== 'undefined' ? window.location.pathname : 'server',
    bodyState:
      typeof document !== 'undefined'
        ? {
            pointerEvents: document.body.style.pointerEvents || null,
            inert: document.body.hasAttribute('inert')
          }
        : null,
    timestamp: new Date().toISOString()
  }

  console.debug('[SignOrderDebug]', payload)

  if (typeof window === 'undefined') {
    return
  }

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json'
      })
      navigator.sendBeacon('/api/debug/sign-order', blob)
      return
    }
  } catch (error) {
    console.warn('[SignOrderDebug] sendBeacon failed', error)
  }

  fetch('/api/debug/sign-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(error => {
    console.warn('[SignOrderDebug] debug fetch failed', error)
  })
}
