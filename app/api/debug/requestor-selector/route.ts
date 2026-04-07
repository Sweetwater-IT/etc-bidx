import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.info('[RequestorSelectorDebug]', body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[RequestorSelectorDebug] Failed to parse payload', error)
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
