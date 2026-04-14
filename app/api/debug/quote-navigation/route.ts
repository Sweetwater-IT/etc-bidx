import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.info('[QuoteNavigationDebug]', body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[QuoteNavigationDebug] Failed to parse payload', error)
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
