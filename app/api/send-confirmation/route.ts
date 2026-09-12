import { Resend } from 'resend';
import { NextResponse } from 'next/server';

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY is not defined. Email sending will be mocked.');
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export async function POST(req: Request) {
  try {
    const { email, userName, service, date, time } = await req.json();

    if (!email || !userName || !service || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = getResend();
    
    if (!client) {
      console.log(`[MOCK EMAIL] To: ${email}, Subject: Booking Confirmation - Porters Lake Dental`);
      return NextResponse.json({ data: { id: 'mock_email_id' } });
    }

    const { data, error } = await client.emails.send({
      from: 'Porters Lake Dental <onboarding@resend.dev>',
      to: [email],
      subject: 'Booking Confirmation - Porters Lake Dental',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 16px;">Booking Confirmed!</h1>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hi ${userName},</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">Your appointment at Porters Lake Dental has been successfully booked. Here are the details:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Service:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Date:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Time:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${time}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">We look forward to seeing you! If you need to reschedule, please visit your dashboard.</p>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #94a3b8; font-size: 14px;">&copy; 2026 Porters Lake Dental. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
