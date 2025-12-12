// app/api/send-help-request/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const IT_EMAIL = 'it@establishedtraffic.com'  // Change if needed
const FROM_EMAIL = 'kenny.mack@sweetwaterit.com'    // Must be verified in Resend dashboard

export async function POST(request: NextRequest) {
  try {
    const { subject, message, user_email } = await request.json()

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    const trimmedSubject = subject.trim()
    const trimmedMessage = message.trim()
    const trimmedEmail = user_email?.trim() || null

    // 1. Save to Supabase
    const { error: dbError } = await supabase
      .from('help_requests')
      .insert({
        subject: trimmedSubject,
        message: trimmedMessage,
        user_email: trimmedEmail,
      })

    if (dbError) {
      console.error('Supabase insert failed:', dbError)
      throw dbError
    }

    // 2. Send email via Resend
    await resend.emails.send({
      from: `BidX Help Desk <${FROM_EMAIL}>`,
      to: IT_EMAIL,
      replyTo: trimmedEmail || undefined,
      subject: `Help Request – ${trimmedSubject}`,
      html: `
        <h2>New Help Request</h2>
        <p><strong>From:</strong> ${trimmedEmail || 'Unknown user'}</p>
        <p><strong>Subject:</strong> ${trimmedSubject}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <pre style="background:#f9f9f9; padding:16px; border-radius:8px; font-family:monospace; white-space: pre-wrap;">
${trimmedMessage}
        </pre>
        <p><small>Ticket saved in Supabase help_requests table</small></p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Help request API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send request' },
      { status: 500 }
    )
  }
}
