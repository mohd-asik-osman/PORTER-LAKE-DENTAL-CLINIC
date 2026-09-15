import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export const CLINIC_TIME_ZONE = 'America/Halifax';
export const DEFAULT_LOCATION = '5141 Nova Scotia Trunk 7, Porters Lake, NS B3E 1M1';
export const DEFAULT_CLINIC = 'Porters Lake Dental';

export interface AppointmentCalendarData {
  service: string;
  date: Date | string;
  time: string;
  appointmentStartAt?: string;
  appointmentEndAt?: string;
  patientName?: string;
  location?: string;
  notes?: string;
}

export interface ParsedClinicAppointment {
  isValid: boolean;
  isSuspicious: boolean;
  errorMessage?: string;
  startDate: Date;
  endDate: Date;
  appointmentStartAt: string; // ISO string in UTC
  appointmentEndAt: string;   // ISO string in UTC
  reminderDueAt: string;      // ISO string in UTC (24h before start)
  timeZone: string;
  dateFormatted: string;      // e.g. "September 24, 2026"
  timeFormatted: string;      // e.g. "4:00 PM"
  dateTimeFormatted: string;  // e.g. "September 24, 2026, 4:00 PM ADT"
  dateStr: string;            // e.g. "2026-09-24"
  timeStr: string;            // e.g. "04:00 PM" or "16:00"
}

/**
 * Checks if a date input is missing, invalid, or suspicious (e.g. 1970-01-01 or year < 2000)
 */
export function isSuspiciousDate(dateInput: Date | string | null | undefined): boolean {
  if (!dateInput) return true;
  
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return true;
    const yr = dateInput.getFullYear();
    return yr < 2000 || yr > 2100;
  }

  const str = String(dateInput).trim();
  if (!str) return true;

  // Check 1970-01-01 or 1970 formats
  if (str.startsWith('1970') || str.startsWith('1969')) return true;

  // Try parsing yyyy-MM-dd
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    if (year < 2000 || year > 2100) return true;
  } else {
    const d = new Date(str);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) {
      return true;
    }
  }

  return false;
}

/**
 * Safely parses time string into 24-hour { hours, minutes }.
 * Supports "09:00 AM", "12:00 AM" (midnight -> 0), "12:00 PM" (noon -> 12), "04:00 PM" (16), "16:00", etc.
 */
export function parseTimeTo24Hour(timeInput: string): { hours: number; minutes: number } | null {
  if (!timeInput || typeof timeInput !== 'string') return null;

  const trimmed = timeInput.trim();
  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const period = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

  if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (period) {
    if (hours < 1 || hours > 12) return null;
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
  } else {
    if (hours < 0 || hours > 23) return null;
  }

  return { hours, minutes };
}

/**
 * Parses date and time strictly in Halifax time (America/Halifax) and converts to UTC instant.
 * Handles DST transitions seamlessly.
 */
export function parseClinicDateTime(
  dateInput: Date | string,
  timeInput: string,
  durationMinutes = 60
): ParsedClinicAppointment {
  let yyyyMMdd = '';

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      return createInvalidAppointmentResult('Invalid Date object provided');
    }
    // Format Date object to yyyy-MM-dd using local date numbers safely
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    yyyyMMdd = `${y}-${m}-${d}`;
  } else if (typeof dateInput === 'string') {
    const str = dateInput.trim();
    // Check if it's already an ISO string (e.g. 2026-09-24T19:00:00.000Z)
    if (str.includes('T') && !isNaN(new Date(str).getTime())) {
      const utcDate = new Date(str);
      yyyyMMdd = formatInTimeZone(utcDate, CLINIC_TIME_ZONE, 'yyyy-MM-dd');
    } else {
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        yyyyMMdd = match[0];
      } else {
        const d = new Date(str);
        if (isNaN(d.getTime())) {
          return createInvalidAppointmentResult(`Invalid date string: ${dateInput}`);
        }
        yyyyMMdd = formatInTimeZone(d, CLINIC_TIME_ZONE, 'yyyy-MM-dd');
      }
    }
  }

  if (isSuspiciousDate(yyyyMMdd)) {
    return createInvalidAppointmentResult(`Suspicious or invalid year in date: ${dateInput}`, true);
  }

  const timeParsed = parseTimeTo24Hour(timeInput);
  if (!timeParsed) {
    return createInvalidAppointmentResult(`Invalid time string: ${timeInput}`);
  }

  const hh = String(timeParsed.hours).padStart(2, '0');
  const mm = String(timeParsed.minutes).padStart(2, '0');

  // Local Halifax ISO representation without timezone offset: e.g. "2026-09-24T16:00:00"
  const localIsoString = `${yyyyMMdd}T${hh}:${mm}:00`;

  // Convert clinic-local time in Halifax to exact UTC instant Date
  const startDate = fromZonedTime(localIsoString, CLINIC_TIME_ZONE);

  if (isNaN(startDate.getTime())) {
    return createInvalidAppointmentResult(`Failed to convert time for ${localIsoString} in ${CLINIC_TIME_ZONE}`);
  }

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const reminderDueAt = new Date(startDate.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const appointmentStartAt = startDate.toISOString();
  const appointmentEndAt = endDate.toISOString();

  const dateFormatted = formatInTimeZone(startDate, CLINIC_TIME_ZONE, 'MMMM d, yyyy');
  const timeFormatted = formatInTimeZone(startDate, CLINIC_TIME_ZONE, 'h:mm a');
  const dateTimeFormatted = formatInTimeZone(startDate, CLINIC_TIME_ZONE, 'MMMM d, yyyy, h:mm a zzz');

  return {
    isValid: true,
    isSuspicious: false,
    startDate,
    endDate,
    appointmentStartAt,
    appointmentEndAt,
    reminderDueAt,
    timeZone: CLINIC_TIME_ZONE,
    dateFormatted,
    timeFormatted,
    dateTimeFormatted,
    dateStr: yyyyMMdd,
    timeStr: timeInput
  };
}

function createInvalidAppointmentResult(errorMessage: string, isSuspicious = true): ParsedClinicAppointment {
  const dummyDate = new Date(0);
  return {
    isValid: false,
    isSuspicious,
    errorMessage,
    startDate: dummyDate,
    endDate: dummyDate,
    appointmentStartAt: '',
    appointmentEndAt: '',
    reminderDueAt: '',
    timeZone: CLINIC_TIME_ZONE,
    dateFormatted: 'Invalid Date',
    timeFormatted: 'Invalid Time',
    dateTimeFormatted: 'Invalid Date/Time',
    dateStr: '',
    timeStr: ''
  };
}

/**
 * Format any stored UTC timestamp or Date in Halifax Time
 */
export function formatClinicDateTime(dateInput: Date | string, formatStr = 'MMMM d, yyyy, h:mm a'): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return 'Invalid Date';
    return formatInTimeZone(d, CLINIC_TIME_ZONE, formatStr);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Builds appointment event details using stored UTC start/end or parsed Halifax inputs
 */
export function buildAppointmentDetails(data: AppointmentCalendarData) {
  let startDate: Date;
  let endDate: Date;

  if (data.appointmentStartAt && !isNaN(new Date(data.appointmentStartAt).getTime())) {
    startDate = new Date(data.appointmentStartAt);
    if (data.appointmentEndAt && !isNaN(new Date(data.appointmentEndAt).getTime())) {
      endDate = new Date(data.appointmentEndAt);
    } else {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }
  } else {
    const parsed = parseClinicDateTime(data.date, data.time);
    if (!parsed.isValid) {
      throw new Error(`Cannot build calendar details for invalid appointment: ${parsed.errorMessage}`);
    }
    startDate = parsed.startDate;
    endDate = parsed.endDate;
  }

  const location = data.location || DEFAULT_LOCATION;
  const title = `Dental Appointment: ${data.service} - ${DEFAULT_CLINIC}`;
  const timeFormattedHalifax = formatInTimeZone(startDate, CLINIC_TIME_ZONE, 'h:mm a zzz');
  const dateFormattedHalifax = formatInTimeZone(startDate, CLINIC_TIME_ZONE, 'MMMM d, yyyy');

  const description = `Appointment for ${data.service} at ${DEFAULT_CLINIC}.\n\nPatient Name: ${data.patientName || 'Patient'}\nDate: ${dateFormattedHalifax}\nTime: ${timeFormattedHalifax} (Halifax Time)\nLocation: ${location}\nClinic Phone: (902) 827-4746\nEmail: dentist@bellaliant.com\n${data.notes ? `\nNotes: ${data.notes}` : ''}`;

  return {
    title,
    description,
    location,
    startDate,
    endDate
  };
}

/**
 * Generate Google Calendar URL with exact UTC start and end parameters
 */
export function getGoogleCalendarUrl(data: AppointmentCalendarData): string {
  const details = buildAppointmentDetails(data);
  const formatUtc = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const startStr = formatUtc(details.startDate);
  const endStr = formatUtc(details.endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: details.title,
    dates: `${startStr}/${endStr}`,
    details: details.description,
    location: details.location,
    ctz: CLINIC_TIME_ZONE
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL with exact UTC ISO start and end parameters
 */
export function getOutlookWebUrl(data: AppointmentCalendarData, isOffice365 = true): string {
  const details = buildAppointmentDetails(data);
  const startIso = details.startDate.toISOString();
  const endIso = details.endDate.toISOString();

  const baseUrl = isOffice365
    ? 'https://outlook.office.com/calendar/0/deeplink/compose'
    : 'https://outlook.live.com/calendar/0/deeplink/compose';

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: details.title,
    startdt: startIso,
    enddt: endIso,
    body: details.description,
    location: details.location,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Trigger .ics download with exact UTC DTSTART / DTEND values
 */
export function downloadIcsFile(data: AppointmentCalendarData) {
  const details = buildAppointmentDetails(data);
  const formatUtc = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const startStr = formatUtc(details.startDate);
  const endStr = formatUtc(details.endDate);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Porters Lake Dental//Appointment Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `SUMMARY:${details.title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${details.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${details.location.replace(/\n/g, ' ')}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `STATUS:CONFIRMED`,
    `UID:appointment-${details.startDate.getTime()}@porterslakedental.com`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `porters-lake-dental-appointment-${data.service.toLowerCase().replace(/\s+/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
