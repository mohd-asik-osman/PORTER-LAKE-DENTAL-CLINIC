import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { 
  getGoogleCalendarUrl, 
  getOutlookWebUrl, 
  parseClinicDateTime, 
  formatClinicDateTime 
} from '@/lib/calendar';

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
    const { email, userName, service, date, time, appointmentStartAt } = await req.json();

    if (!email || !userName || !service || (!date && !appointmentStartAt) || (!time && !appointmentStartAt)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let startDateIso = appointmentStartAt;
    let formattedDateDisplay = date;
    let formattedTimeDisplay = time;

    if (startDateIso && !isNaN(new Date(startDateIso).getTime())) {
      const startDate = new Date(startDateIso);
      formattedDateDisplay = formatClinicDateTime(startDate, 'MMMM d, yyyy');
      formattedTimeDisplay = formatClinicDateTime(startDate, 'h:mm a');
    } else {
      const parsed = parseClinicDateTime(date, time);
      if (parsed.isValid) {
        startDateIso = parsed.appointmentStartAt;
        formattedDateDisplay = parsed.dateFormatted;
        formattedTimeDisplay = parsed.timeFormatted;
      }
    }

    const calendarPayload = {
      service,
      date: formattedDateDisplay || date,
      time: formattedTimeDisplay || time,
      appointmentStartAt: startDateIso,
      patientName: userName
    };

    const googleCalendarUrl = getGoogleCalendarUrl(calendarPayload);
    const outlookCalendarUrl = getOutlookWebUrl(calendarPayload, true);

    const client = getResend();
    
    if (!client) {
      console.log(`[MOCK CONFIRMATION EMAIL] To: ${email}, Subject: Booking Confirmation - Porters Lake Dental`);
      return NextResponse.json({ data: { id: 'mock_email_id' } });
    }

    const { data, error } = await client.emails.send({
      from: 'Porters Lake Dental <onboarding@resend.dev>',
      to: [email],
      subject: 'Booking Confirmation - Porters Lake Dental',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
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
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${formattedDateDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Time:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${formattedTimeDisplay} (Halifax Time)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Location:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">5141 Nova Scotia Trunk 7, Porters Lake, NS</td>
              </tr>
            </table>
          </div>

          <div style="margin: 24px 0; text-align: center; background-color: #eff6ff; padding: 18px; border-radius: 12px; border: 1px solid #dbeafe;">
            <p style="color: #1e40af; font-size: 14px; font-weight: 700; margin: 0 0 12px 0;">📅 Add this appointment to your calendar:</p>
            <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; margin: 4px 4px;">+ Google Calendar</a>
            <a href="${outlookCalendarUrl}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; font-weight: 700; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; margin: 4px 4px;">+ Outlook</a>
          </div>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">We look forward to seeing you! If you need to reschedule, please visit your dashboard or call us at (902) 827-4746.</p>
          
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
