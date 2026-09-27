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

export interface ClinicHours {
  isOpen: boolean;
  openHour: number;   // 24-hr (e.g. 8)
  openMinute: number; // (e.g. 0)
  closeHour: number;  // 24-hr (e.g. 18 for Mon-Wed, 17 for Thu, 15 for Fri)
  closeMinute: number;// (e.g. 0)
  hoursDisplay: string;
  reason?: string;
}

export interface TimeSlotOption {
  time: string;
  available: boolean;
  reason?: string;
}

export interface CalendarDayInfo {
  dayNumber: number;
  dateStr: string;
  isPast: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isClosed: boolean;
  closureReason?: string;
}

export interface MonthCalendarData {
  year: number;
  monthIndex: number; // 0 = Jan, 8 = Sept
  monthLabel: string;
  daysInMonth: number;
  leadingEmptyDays: number;
  days: CalendarDayInfo[];
}

/**
 * Standard Candidate Time Slots offered by the clinic (hourly starting from 08:00 AM)
 */
export const CANDIDATE_TIME_SLOTS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM'
];

/**
 * Known Nova Scotia statutory holidays & clinic closures
 */
export const CONFIGURED_CLINIC_CLOSURES: Record<string, string> = {
  // Fixed annual dates
  '01-01': "New Year's Day",
  '07-01': 'Canada Day',
  '09-30': 'National Day for Truth and Reconciliation',
  '11-11': 'Remembrance Day',
  '12-25': 'Christmas Day',
  '12-26': 'Boxing Day',
  // 2026 specific dates
  '2026-02-16': 'Nova Scotia Heritage Day',
  '2026-04-03': 'Good Friday',
  '2026-04-06': 'Easter Monday',
  '2026-05-18': 'Victoria Day',
  '2026-08-03': 'Natal Day',
  '2026-09-07': 'Labour Day',
  '2026-10-12': 'Thanksgiving Day',
  // 2027 specific dates
  '2027-02-15': 'Nova Scotia Heritage Day',
  '2027-03-26': 'Good Friday',
  '2027-03-29': 'Easter Monday',
  '2027-05-24': 'Victoria Day',
  '2027-08-02': 'Natal Day',
  '2027-09-06': 'Labour Day',
  '2027-10-11': 'Thanksgiving Day'
};

/**
 * Gets today's date formatted as YYYY-MM-DD in America/Halifax
 */
export function getHalifaxTodayDateStr(): string {
  return formatInTimeZone(new Date(), CLINIC_TIME_ZONE, 'yyyy-MM-dd');
}

/**
 * Gets current time in Halifax as 24-hr { hours, minutes }
 */
export function getHalifaxCurrentTime(): { hours: number; minutes: number } {
  const now = new Date();
  const h = parseInt(formatInTimeZone(now, CLINIC_TIME_ZONE, 'H'), 10);
  const m = parseInt(formatInTimeZone(now, CLINIC_TIME_ZONE, 'm'), 10);
  return { hours: h, minutes: m };
}

/**
 * Checks if a date string YYYY-MM-DD is in the past according to Halifax calendar
 */
export function isPastDateInHalifax(dateStr: string): boolean {
  if (!dateStr) return true;
  const todayHalifax = getHalifaxTodayDateStr();
  return dateStr < todayHalifax;
}

/**
 * Checks if a date string YYYY-MM-DD is today in Halifax
 */
export function isTodayInHalifax(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr === getHalifaxTodayDateStr();
}

/**
 * Checks if a date is a configured clinic holiday or closure
 */
export function isClinicClosure(dateStr: string): { isClosed: boolean; reason?: string } {
  if (!dateStr) return { isClosed: false };
  
  // Check exact full date YYYY-MM-DD
  if (CONFIGURED_CLINIC_CLOSURES[dateStr]) {
    return { isClosed: true, reason: CONFIGURED_CLINIC_CLOSURES[dateStr] };
  }

  // Check recurring annual MM-DD
  const mmdd = dateStr.slice(5); // e.g. "12-25"
  if (CONFIGURED_CLINIC_CLOSURES[mmdd]) {
    return { isClosed: true, reason: CONFIGURED_CLINIC_CLOSURES[mmdd] };
  }

  return { isClosed: false };
}

/**
 * Returns clinic operating hours for any given date string YYYY-MM-DD
 * Clinic Hours:
 * Monday–Wednesday: 08:00–18:00
 * Thursday: 08:00–17:00
 * Friday: 08:00–15:00
 * Saturday–Sunday: Closed
 */
export function getClinicHoursForDate(dateStr: string): ClinicHours {
  if (!dateStr) {
    return { isOpen: false, openHour: 0, openMinute: 0, closeHour: 0, closeMinute: 0, hoursDisplay: 'Closed' };
  }

  const closure = isClinicClosure(dateStr);
  if (closure.isClosed) {
    return {
      isOpen: false,
      openHour: 0,
      openMinute: 0,
      closeHour: 0,
      closeMinute: 0,
      hoursDisplay: `Closed (${closure.reason})`,
      reason: closure.reason
    };
  }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { isOpen: false, openHour: 0, openMinute: 0, closeHour: 0, closeMinute: 0, hoursDisplay: 'Invalid Date' };
  }

  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);

  // Day of week: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isOpen: false, openHour: 0, openMinute: 0, closeHour: 0, closeMinute: 0, hoursDisplay: 'Closed (Weekend)' };
  }

  if (dayOfWeek === 4) {
    // Thursday: 08:00–17:00
    return { isOpen: true, openHour: 8, openMinute: 0, closeHour: 17, closeMinute: 0, hoursDisplay: '8:00 AM – 5:00 PM' };
  }

  if (dayOfWeek === 5) {
    // Friday: 08:00–15:00
    return { isOpen: true, openHour: 8, openMinute: 0, closeHour: 15, closeMinute: 0, hoursDisplay: '8:00 AM – 3:00 PM' };
  }

  // Monday–Wednesday: 08:00–18:00
  return { isOpen: true, openHour: 8, openMinute: 0, closeHour: 18, closeMinute: 0, hoursDisplay: '8:00 AM – 6:00 PM' };
}

/**
 * Checks if a selected slot fits entirely within clinic hours and has not expired if today
 */
export function isSlotCompatibleWithDate(dateStr: string, timeStr: string, durationMinutes = 60): boolean {
  if (!dateStr || !timeStr) return false;

  const hours = getClinicHoursForDate(dateStr);
  if (!hours.isOpen) return false;

  const parsedTime = parseTimeTo24Hour(timeStr);
  if (!parsedTime) return false;

  const slotStartMinutes = parsedTime.hours * 60 + parsedTime.minutes;
  const slotEndMinutes = slotStartMinutes + durationMinutes;

  const clinicOpenMinutes = hours.openHour * 60 + hours.openMinute;
  const clinicCloseMinutes = hours.closeHour * 60 + hours.closeMinute;

  // Slot must start at or after clinic open, and finish at or before clinic close
  if (slotStartMinutes < clinicOpenMinutes || slotEndMinutes > clinicCloseMinutes) {
    return false;
  }

  // If appointment is today in Halifax, filter out slots that have already started/passed
  if (isTodayInHalifax(dateStr)) {
    const currentHalifax = getHalifaxCurrentTime();
    const currentMinutes = currentHalifax.hours * 60 + currentHalifax.minutes;
    if (slotStartMinutes <= currentMinutes) {
      return false; // Expired same-day slot
    }
  }

  return true;
}

/**
 * Generates the list of time slot options for a given date, checking clinic operating hours
 * and expired same-day times.
 */
export function getAvailableSlotsForDate(dateStr: string, durationMinutes = 60): TimeSlotOption[] {
  if (!dateStr) return [];

  const clinicHours = getClinicHoursForDate(dateStr);
  if (!clinicHours.isOpen) return [];

  const clinicOpenMinutes = clinicHours.openHour * 60 + clinicHours.openMinute;
  const clinicCloseMinutes = clinicHours.closeHour * 60 + clinicHours.closeMinute;

  const isToday = isTodayInHalifax(dateStr);
  const currentHalifax = isToday ? getHalifaxCurrentTime() : { hours: 0, minutes: 0 };
  const currentMinutes = currentHalifax.hours * 60 + currentHalifax.minutes;

  return CANDIDATE_TIME_SLOTS.map(time => {
    const parsed = parseTimeTo24Hour(time);
    if (!parsed) {
      return { time, available: false, reason: 'Invalid format' };
    }

    const startMinutes = parsed.hours * 60 + parsed.minutes;
    const endMinutes = startMinutes + durationMinutes;

    if (startMinutes < clinicOpenMinutes) {
      return { time, available: false, reason: 'Before clinic opens' };
    }

    if (endMinutes > clinicCloseMinutes) {
      return { time, available: false, reason: 'Exceeds clinic closing time' };
    }

    if (isToday && startMinutes <= currentMinutes) {
      return { time, available: false, reason: 'Slot has already passed today' };
    }

    return { time, available: true };
  });
}

/**
 * Computes calendar days and dynamic leading empty cells for any month
 * Heading: Sunday (0) through Saturday (6)
 * Handles leap years and month navigation reliably.
 */
export function getCalendarMonthData(dateInput: Date | { year: number; monthIndex: number }): MonthCalendarData {
  let year: number;
  let monthIndex: number; // 0-11

  if (dateInput instanceof Date) {
    year = dateInput.getFullYear();
    monthIndex = dateInput.getMonth();
  } else {
    year = dateInput.year;
    monthIndex = dateInput.monthIndex;
  }

  // Days in month (handles leap years correctly e.g. Feb 2028 = 29)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // First day weekday (0 = Sunday, 1 = Monday, 2 = Tuesday, etc.)
  const firstDayOfMonthDate = new Date(year, monthIndex, 1);
  const leadingEmptyDays = firstDayOfMonthDate.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthLabel = `${monthNames[monthIndex]} ${year}`;

  const todayHalifax = getHalifaxTodayDateStr();

  const days: CalendarDayInfo[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(monthIndex + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;

    const isPast = dateStr < todayHalifax;
    const isToday = dateStr === todayHalifax;

    const weekday = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0)).getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;

    const closure = isClinicClosure(dateStr);

    days.push({
      dayNumber: day,
      dateStr,
      isPast,
      isToday,
      isWeekend,
      isClosed: closure.isClosed,
      closureReason: closure.reason
    });
  }

  return {
    year,
    monthIndex,
    monthLabel,
    daysInMonth,
    leadingEmptyDays,
    days
  };
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

  // Check 1970-01-01 or 1970/1969 formats
  if (str.startsWith('1970') || str.startsWith('1969') || str.startsWith('0000')) return true;

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

  // Local Halifax ISO representation without timezone offset: e.g. "2026-09-28T16:00:00"
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
    `UID:appointment-${details.startDate.getTime()}@bellaliant.com`,
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
