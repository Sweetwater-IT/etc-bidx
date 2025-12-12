// app/api/send-help-request/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,   // it@establishedtraffic.com
    pass: process.env.SMTP_PASS,   // the 16-char App Password
  },
})

export async function POST(request: NextRequest) {
  try {
    const { subject, message, user_email } = await request.json()

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Subject and message required' }, { status: 400 })
    }

    // 1. Save to Supabase
    await supabase.from('help_requests').insert({
      subject: subject.trim(),
      message: message.trim(),
      user_email: user_email?.trim() || null,
    })

    // 2. Send email → arrives in it@establishedtraffic.com inbox
    await transporter.sendMail({
      from: `"BidX Help Desk" <${process.env.SMTP_FROM}>`,   // shows as BidX Help Desk
      to: process.env.SMTP_FROM!,                            // lands in IT inbox
      replyTo: user_email || undefined,                      // you can just hit reply
      subject: `Help Request – ${subject}`,
      html: `
        <h2>New Help Request</h2>
        <p><strong>From:</strong> ${user_email || 'Unknown user'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <pre style="background:#f9f9f9; padding:16px; border-radius:8px; font-family:monospace;">
${message}
        </pre>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Help request failed:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
