import { NextRequest, NextResponse } from 'next/server';
import { CLINIC_TIME_ZONE } from '@/lib/calendar';

export const dynamic = 'force-dynamic';

const STANDARD_TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM'
];

/**
 * Public availability endpoint:
 * Returns available appointment slots for a given date without exposing any
 * patient names, emails, phone numbers, or booking records (PII protection).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({
        timeZone: CLINIC_TIME_ZONE,
        standardSlots: STANDARD_TIME_SLOTS,
        message: 'Specify a date query parameter (YYYY-MM-DD) to check availability'
      });
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // In a production setup, booked slots for this date can be aggregated server-side.
    // Safe response returns only available slot strings.
    return NextResponse.json({
      date,
      timeZone: CLINIC_TIME_ZONE,
      availableSlots: STANDARD_TIME_SLOTS,
      totalSlots: STANDARD_TIME_SLOTS.length
    });
  } catch (error) {
    console.error('Error in availability endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve available slots' },
      { status: 500 }
    );
  }
}
