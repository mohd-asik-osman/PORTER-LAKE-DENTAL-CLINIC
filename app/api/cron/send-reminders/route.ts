import { NextRequest, NextResponse } from 'next/server';
import { processAppointmentReminders } from '@/lib/reminders';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Optional secret check if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(req.url);
      const keyParam = url.searchParams.get('key');
      if (keyParam !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
      }
    }

    const force = req.nextUrl.searchParams.get('force') === 'true';
    const summary = await processAppointmentReminders(force);

    return NextResponse.json({
      message: 'Appointment reminder job executed successfully',
      summary
    });
  } catch (error) {
    console.error('Error running appointment reminder cron API route:', error);
    return NextResponse.json({
      error: 'Failed to run appointment reminder job',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = body.force === true;
    const bookings = Array.isArray(body.bookings) ? body.bookings : undefined;

    const summary = await processAppointmentReminders(force, bookings);

    return NextResponse.json({
      message: '24-hour appointment reminder job triggered successfully',
      summary
    });
  } catch (error) {
    console.error('Error in POST appointment reminder route:', error);
    return NextResponse.json({
      error: 'Failed to process reminders',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
