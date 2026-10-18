import { NextRequest, NextResponse } from 'next/server';
import { 
  CLINIC_TIME_ZONE, 
  getAvailableSlotsForDate, 
  getClinicHoursForDate,
  CANDIDATE_TIME_SLOTS 
} from '@/lib/calendar';

import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getDynamicClosures() {
  const primaryPath = path.join(process.cwd(), 'data', 'holidays.json');
  const tmpPath = '/tmp/dentacare_holidays.json';

  try {
    if (fs.existsSync(primaryPath)) {
      const raw = fs.readFileSync(primaryPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  try {
    if (fs.existsSync(tmpPath)) {
      const raw = fs.readFileSync(tmpPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  return [];
}

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

    const dynamicClosures = getDynamicClosures();
    const clinicHours = getClinicHoursForDate(date, dynamicClosures);
    const slots = getAvailableSlotsForDate(date, 60, dynamicClosures);
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
