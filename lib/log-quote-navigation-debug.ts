'use client'

type QuoteNavigationDebugDetails = Record<string, unknown>

export function logQuoteNavigationDebug(
  event: string,
  details: QuoteNavigationDebugDetails = {}
) {
  const payload = {
    event,
    details,
    path:
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : 'server',
    referrer:
      typeof document !== 'undefined' ? document.referrer || null : null,
    timestamp: new Date().toISOString()
  }

  console.debug('[QuoteNavigationDebug]', payload)

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
      navigator.sendBeacon('/api/debug/quote-navigation', blob)
      return
    }
  } catch (error) {
    console.warn('[QuoteNavigationDebug] sendBeacon failed', error)
  }

  fetch('/api/debug/quote-navigation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(error => {
    console.warn('[QuoteNavigationDebug] debug fetch failed', error)
  })
}
