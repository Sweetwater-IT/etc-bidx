'use client'

type SignQuoteDebugDetails = Record<string, unknown>

export function logSignQuoteDebug(
  event: string,
  details: SignQuoteDebugDetails = {}
) {
  const payload = {
    event,
    details,
    path:
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : 'server',
    timestamp: new Date().toISOString()
  }

  console.debug('[SignQuoteDebug]', payload)

  if (typeof window === 'undefined') {
    return
  }

  try {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    ) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json'
      })
      navigator.sendBeacon('/api/debug/sign-quote', blob)
      return
    }
  } catch (error) {
    console.warn('[SignQuoteDebug] sendBeacon failed', error)
  }

  fetch('/api/debug/sign-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(error => {
    console.warn('[SignQuoteDebug] debug fetch failed', error)
  })
}
