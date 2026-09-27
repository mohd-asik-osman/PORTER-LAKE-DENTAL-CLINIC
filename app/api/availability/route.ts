import { NextRequest, NextResponse } from 'next/server';
import { 
  CLINIC_TIME_ZONE, 
  getAvailableSlotsForDate, 
  getClinicHoursForDate,
  CANDIDATE_TIME_SLOTS 
} from '@/lib/calendar';

export const dynamic = 'force-dynamic';

/**
 * Public availability endpoint:
 * Returns available appointment slots for a given date in Halifax time without exposing any
 * patient names, emails, phone numbers, or booking records (PII protection).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({
        timeZone: CLINIC_TIME_ZONE,
        standardSlots: CANDIDATE_TIME_SLOTS,
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

    const clinicHours = getClinicHoursForDate(date);
    const slots = getAvailableSlotsForDate(date);
    const availableSlots = slots.filter(s => s.available).map(s => s.time);

    return NextResponse.json({
      date,
      timeZone: CLINIC_TIME_ZONE,
      clinicHours: clinicHours.hoursDisplay,
      isOpen: clinicHours.isOpen,
      availableSlots,
      allSlots: slots,
      totalSlots: availableSlots.length
    });
  } catch (error) {
    console.error('Error in availability endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve available slots' },
      { status: 500 }
    );
  }
}
