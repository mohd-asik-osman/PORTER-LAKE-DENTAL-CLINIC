import { Resend } from 'resend';
import { db, auth } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { 
  parseClinicDateTime, 
  isSuspiciousDate, 
  formatClinicDateTime, 
  CLINIC_TIME_ZONE, 
  getGoogleCalendarUrl, 
  getOutlookWebUrl 
} from './calendar';

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (process.env.RESEND_API_KEY) {
    if (!resend) {
      resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
  }
  return null;
}

export interface ReminderResult {
  bookingId: string;
  patientName: string;
  patientEmail: string;
  service: string;
  date: string;
  time: string;
  appointmentStartAt?: string;
  sentAt: string;
  status: 'sent' | 'simulated' | 'error' | 'skipped_suspicious';
  errorMessage?: string;
}

export interface ProcessRemindersSummary {
  success: boolean;
  timestamp: string;
  totalChecked: number;
  dueRemindersCount: number;
  sentCount: number;
  results: ReminderResult[];
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || false,
    },
    operationType,
    path
  };
  console.error('Firestore Error in Reminders Job: ', JSON.stringify(errInfo));
}

export async function processAppointmentReminders(forceAllTomorrow = false): Promise<ProcessRemindersSummary> {
  const now = new Date();
  const results: ReminderResult[] = [];
  let totalChecked = 0;
  let dueRemindersCount = 0;
  let sentCount = 0;

  try {
    const bookingsPath = 'bookings';
    let snapshot;
    try {
      snapshot = await getDocs(collection(db, bookingsPath));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, bookingsPath);
      snapshot = null;
    }

    const bookingsList: any[] = [];
    if (snapshot && !snapshot.empty) {
      snapshot.forEach(docSnap => {
        bookingsList.push({ id: docSnap.id, ...docSnap.data() });
      });
    }

    totalChecked = bookingsList.length;

    for (const booking of bookingsList) {
      // Skip already rejected or cancelled bookings
      if (booking.status === 'rejected' || booking.status === 'cancelled') {
        continue;
      }

      // Skip if reminder has already been sent
      if (booking.reminderSent === true) {
        continue;
      }

      // Skip suspicious / invalid dates (e.g. 1970-01-01)
      if (booking.isSuspiciousDate || isSuspiciousDate(booking.date) || isSuspiciousDate(booking.appointmentStartAt)) {
        results.push({
          bookingId: booking.id,
          patientName: booking.patientName || 'Unknown',
          patientEmail: booking.patientEmail || '',
          service: booking.service || 'Dental Appointment',
          date: booking.date || 'Invalid',
          time: booking.time || 'Invalid',
          sentAt: new Date().toISOString(),
          status: 'skipped_suspicious',
          errorMessage: 'Skipped sending reminder due to suspicious or invalid date (needs manual review)'
        });
        continue;
      }

      let startDate: Date;

      if (booking.appointmentStartAt && !isNaN(new Date(booking.appointmentStartAt).getTime())) {
        startDate = new Date(booking.appointmentStartAt);
      } else {
        const parsed = parseClinicDateTime(booking.date, booking.time);
        if (!parsed.isValid) {
          results.push({
            bookingId: booking.id,
            patientName: booking.patientName || 'Unknown',
            patientEmail: booking.patientEmail || '',
            service: booking.service || 'Dental Appointment',
            date: booking.date || 'Invalid',
            time: booking.time || 'Invalid',
            sentAt: new Date().toISOString(),
            status: 'error',
            errorMessage: `Invalid appointment date/time: ${parsed.errorMessage}`
          });
          continue;
        }
        startDate = parsed.startDate;
      }

      // Compare UTC timestamps for reminder due check
      const reminderDueAtTime = startDate.getTime() - 24 * 60 * 60 * 1000;
      const diffMs = startDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Reminder is due if now >= reminderDueAt and now < startDate, or forced, or within ~32 hours
      const isDue = forceAllTomorrow || (now.getTime() >= reminderDueAtTime && now.getTime() < startDate.getTime()) || (diffHours >= 0 && diffHours <= 32);

      if (isDue) {
        dueRemindersCount++;

        const patientName = booking.patientName || 'Valued Patient';
        const patientEmail = booking.patientEmail;
        const service = booking.service || 'Dental Appointment';

        const dateDisplayHalifax = formatClinicDateTime(startDate, 'MMMM d, yyyy');
        const timeDisplayHalifax = formatClinicDateTime(startDate, 'h:mm a zzz');

        if (!patientEmail) {
          results.push({
            bookingId: booking.id,
            patientName,
            patientEmail: '',
            service,
            date: dateDisplayHalifax,
            time: timeDisplayHalifax,
            appointmentStartAt: startDate.toISOString(),
            sentAt: new Date().toISOString(),
            status: 'error',
            errorMessage: 'Patient email missing'
          });
          continue;
        }

        const calendarPayload = {
          service,
          date: booking.date || dateDisplayHalifax,
          time: booking.time || timeDisplayHalifax,
          appointmentStartAt: startDate.toISOString(),
          patientName
        };

        const googleCalUrl = getGoogleCalendarUrl(calendarPayload);
        const outlookCalUrl = getOutlookWebUrl(calendarPayload, true);

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #eff6ff;">
              <h2 style="color: #2563eb; margin: 0; font-size: 22px;">Porters Lake Dental</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">24-Hour Appointment Reminder</p>
            </div>

            <div style="padding: 24px 0;">
              <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Hello ${patientName},</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                This is a friendly reminder that you have an upcoming dental appointment scheduled for tomorrow at <strong>Porters Lake Dental</strong>.
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Service:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${service}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Date:</td>
                    <td style="padding: 6px 0; color: #2563eb; font-weight: 700; text-align: right;">${dateDisplayHalifax}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Time:</td>
                    <td style="padding: 6px 0; color: #2563eb; font-weight: 700; text-align: right;">${timeDisplayHalifax} (Halifax Time)</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Location:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">5141 Nova Scotia Trunk 7, Porters Lake, NS</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <p style="color: #1e40af; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">Add to your calendar:</p>
                <a href="${googleCalUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 12px; margin: 3px;">+ Google Calendar</a>
                <a href="${outlookCalUrl}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; font-weight: 700; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 12px; margin: 3px;">+ Outlook</a>
              </div>

              <div style="border-left: 4px solid #3b82f6; padding-left: 14px; margin-bottom: 24px;">
                <p style="color: #334155; font-size: 13px; font-weight: 700; margin: 0 0 4px 0;">Appointment Tips:</p>
                <ul style="color: #64748b; font-size: 13px; margin: 0; padding-left: 18px; line-height: 1.5;">
                  <li>Please arrive 10 minutes prior to your scheduled time.</li>
                  <li>Bring your government ID and dental insurance card.</li>
                  <li>Need to reschedule? Call us at (902) 827-4746.</li>
                </ul>
              </div>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">Porters Lake Dental Clinic &bull; Phone: (902) 827-4746 &bull; Email: dentist@bellaliant.com</p>
            </div>
          </div>
        `;

        const client = getResendClient();
        let emailStatus: 'sent' | 'simulated' = 'simulated';

        if (client) {
          try {
            await client.emails.send({
              from: 'Porters Lake Dental <noreply@porterslakedental.com>',
              to: [patientEmail],
              subject: `Reminder: Your Dental Appointment Tomorrow at ${timeDisplayHalifax}`,
              html: emailHtml
            });
            emailStatus = 'sent';
          } catch (sendErr) {
            console.error('Failed to send email via Resend:', sendErr);
            emailStatus = 'simulated';
          }
        } else {
          console.log(`[SIMULATED 24H REMINDER EMAIL] Sent to ${patientEmail} for ${service} on ${dateDisplayHalifax} at ${timeDisplayHalifax}`);
        }

        // Update booking in Firestore
        try {
          await updateDoc(doc(db, 'bookings', booking.id), {
            reminderSent: true,
            reminderSentAt: new Date().toISOString()
          });
        } catch (updateErr) {
          handleFirestoreError(updateErr, OperationType.UPDATE, `bookings/${booking.id}`);
        }

        sentCount++;
        results.push({
          bookingId: booking.id,
          patientName,
          patientEmail,
          service,
          date: dateDisplayHalifax,
          time: timeDisplayHalifax,
          appointmentStartAt: startDate.toISOString(),
          sentAt: new Date().toISOString(),
          status: emailStatus
        });
      }
    }
  } catch (err) {
    console.error('Error in processAppointmentReminders job:', err);
  }

  return {
    success: true,
    timestamp: now.toISOString(),
    totalChecked,
    dueRemindersCount,
    sentCount,
    results
  };
}
