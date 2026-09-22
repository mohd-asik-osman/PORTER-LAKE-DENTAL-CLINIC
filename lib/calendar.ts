export interface AppointmentCalendarData {
  service: string;
  date: Date | string;
  time: string;
  patientName?: string;
  location?: string;
  notes?: string;
}

const DEFAULT_LOCATION = '5141 Nova Scotia Trunk 7, Porters Lake, NS B3E 1M1';
const DEFAULT_CLINIC = 'Porters Lake Dental';

export function parseAppointmentDateTime(dateInput: Date | string, timeInput: string): { startDate: Date; endDate: Date } {
  let baseDate: Date;
  if (dateInput instanceof Date) {
    baseDate = new Date(dateInput);
  } else {
    baseDate = new Date(dateInput);
    if (isNaN(baseDate.getTime())) {
      baseDate = new Date();
    }
  }

  let hours = 9;
  let minutes = 0;

  if (timeInput) {
    const timeMatch = timeInput.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      const period = timeMatch[3];
      if (period) {
        if (period.toUpperCase() === 'PM' && hours < 12) {
          hours += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
      }
    }
  }

  const startDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    0
  );
  
  // Default appointment duration: 60 minutes
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  return { startDate, endDate };
}

export function buildAppointmentDetails(data: AppointmentCalendarData) {
  const { startDate, endDate } = parseAppointmentDateTime(data.date, data.time);
  const location = data.location || DEFAULT_LOCATION;
  const title = `Dental Appointment: ${data.service} - ${DEFAULT_CLINIC}`;
  const description = `Appointment for ${data.service} at ${DEFAULT_CLINIC}.\n\nPatient Name: ${data.patientName || 'Patient'}\nTime: ${data.time}\nLocation: ${location}\nClinic Phone: (902) 827-4746\nEmail: dentist@bellaliant.com\n${data.notes ? `\nNotes: ${data.notes}` : ''}`;

  return {
    title,
    description,
    location,
    startDate,
    endDate
  };
}

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
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

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
    `UID:appointment-${Date.now()}@porterslakedental.com`,
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
