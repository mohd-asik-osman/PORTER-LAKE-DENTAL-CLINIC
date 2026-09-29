import { 
  parseClinicDateTime, 
  buildAppointmentDetails, 
  getGoogleCalendarUrl, 
  getOutlookWebUrl, 
  formatClinicDateTime,
  isSuspiciousDate,
  getCalendarMonthData,
  getClinicHoursForDate,
  getAvailableSlotsForDate,
  isSlotCompatibleWithDate,
  CLINIC_TIME_ZONE
} from '../lib/calendar';
import { formatInTimeZone } from 'date-fns-tz';

console.log('====================================================');
console.log('RUNNING ISOLATED BOOKING & TIMEZONE REGRESSION TESTS');
console.log('Current process.env.TZ:', process.env.TZ || '(default)');
console.log('====================================================\n');

let failed = false;
function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    failed = true;
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

// -----------------------------------------------------------
// 1. Booking Calendar Alignment: September 1, 2026
// -----------------------------------------------------------
console.log('\n--- Test 1: September 2026 Calendar Grid Alignment ---');
const sept2026 = getCalendarMonthData({ year: 2026, monthIndex: 8 }); // 8 = September (0-indexed)
assert(sept2026.leadingEmptyDays === 2, `Leading empty cells for September 2026 must be 2 (Tuesday), got: ${sept2026.leadingEmptyDays}`);
assert(sept2026.daysInMonth === 30, `Days in September 2026 must be 30, got: ${sept2026.daysInMonth}`);
const sept1 = sept2026.days.find(d => d.dayNumber === 1);
assert(!!sept1 && sept1.dateStr === '2026-09-01', 'Sept 1, 2026 day record exists');
// Weekday of 2026-09-01: 2026-09-01 was a Tuesday (weekday 2 in 0=Sun..6=Sat)
const sept1Date = new Date(Date.UTC(2026, 8, 1, 12, 0, 0));
assert(sept1Date.getUTCDay() === 2, `Sept 1, 2026 is Tuesday (day 2), got: ${sept1Date.getUTCDay()}`);

// -----------------------------------------------------------
// 2. Weekend Restrictions: October 3-4, 2026
// -----------------------------------------------------------
console.log('\n--- Test 2: Weekend Restrictions (October 3-4, 2026) ---');
const oct2026 = getCalendarMonthData({ year: 2026, monthIndex: 9 }); // 9 = October
const oct3 = oct2026.days.find(d => d.dateStr === '2026-10-03');
const oct4 = oct2026.days.find(d => d.dateStr === '2026-10-04');
assert(!!oct3 && oct3.isWeekend === true, 'October 3, 2026 is marked as weekend');
assert(!!oct4 && oct4.isWeekend === true, 'October 4, 2026 is marked as weekend');

const oct3Hours = getClinicHoursForDate('2026-10-03');
const oct4Hours = getClinicHoursForDate('2026-10-04');
assert(!oct3Hours.isOpen, 'Clinic is closed on Saturday Oct 3, 2026');
assert(!oct4Hours.isOpen, 'Clinic is closed on Sunday Oct 4, 2026');

const oct3Slots = getAvailableSlotsForDate('2026-10-03');
const oct4Slots = getAvailableSlotsForDate('2026-10-04');
assert(oct3Slots.length === 0, 'Zero available slots on Saturday Oct 3');
assert(oct4Slots.length === 0, 'Zero available slots on Sunday Oct 4');

assert(!isSlotCompatibleWithDate('2026-10-03', '10:00 AM'), 'Saturday slots are rejected as incompatible');
assert(!isSlotCompatibleWithDate('2026-10-04', '10:00 AM'), 'Sunday slots are rejected as incompatible');

// -----------------------------------------------------------
// 3. Exact Halifax-to-UTC Conversions
// Example A: September 28, 2026, 4:00 PM Halifax = 19:00 UTC = Sept 29, 1:00 AM Dhaka
// Example B: January 15, 2027, 2:00 PM Halifax = 18:00 UTC = Jan 16, 12:00 AM Dhaka
// -----------------------------------------------------------
console.log('\n--- Test 3: Exact Halifax-to-UTC Conversions and Global Interpretations ---');

// Example A: Sept 28, 2026, 4:00 PM Halifax (ADT = UTC-3)
const bookingA = parseClinicDateTime('2026-09-28', '04:00 PM');
assert(bookingA.isValid, 'Booking A is valid');
assert(bookingA.appointmentStartAt === '2026-09-28T19:00:00.000Z', `Booking A start UTC must be 2026-09-28T19:00:00.000Z, got: ${bookingA.appointmentStartAt}`);

// Display in Halifax
const bookingAHalifax = formatInTimeZone(bookingA.startDate, CLINIC_TIME_ZONE, 'yyyy-MM-dd h:mm a zzz');
assert(bookingAHalifax === '2026-09-28 4:00 PM ADT', `Booking A in Halifax must be '2026-09-28 4:00 PM ADT', got: '${bookingAHalifax}'`);

// Display in Dhaka (UTC+6)
const bookingADhaka = formatInTimeZone(bookingA.startDate, 'Asia/Dhaka', 'yyyy-MM-dd h:mm a');
assert(bookingADhaka === '2026-09-29 1:00 AM', `Booking A in Dhaka must be '2026-09-29 1:00 AM', got: '${bookingADhaka}'`);

// Display in UTC
const bookingAUtc = formatInTimeZone(bookingA.startDate, 'UTC', 'yyyy-MM-dd HH:mm');
assert(bookingAUtc === '2026-09-28 19:00', `Booking A in UTC must be '2026-09-28 19:00', got: '${bookingAUtc}'`);

// Example B: January 15, 2027, 2:00 PM Halifax (AST = UTC-4)
const bookingB = parseClinicDateTime('2027-01-15', '02:00 PM');
assert(bookingB.isValid, 'Booking B is valid');
assert(bookingB.appointmentStartAt === '2027-01-15T18:00:00.000Z', `Booking B start UTC must be 2027-01-15T18:00:00.000Z, got: ${bookingB.appointmentStartAt}`);

// Display in Halifax
const bookingBHalifax = formatInTimeZone(bookingB.startDate, CLINIC_TIME_ZONE, 'yyyy-MM-dd h:mm a zzz');
assert(bookingBHalifax === '2027-01-15 2:00 PM AST', `Booking B in Halifax must be '2027-01-15 2:00 PM AST', got: '${bookingBHalifax}'`);

// Display in Dhaka (UTC+6)
const bookingBDhaka = formatInTimeZone(bookingB.startDate, 'Asia/Dhaka', 'yyyy-MM-dd h:mm a');
assert(bookingBDhaka === '2027-01-16 12:00 AM', `Booking B in Dhaka must be '2027-01-16 12:00 AM', got: '${bookingBDhaka}'`);

// Display in UTC
const bookingBUtc = formatInTimeZone(bookingB.startDate, 'UTC', 'yyyy-MM-dd HH:mm');
assert(bookingBUtc === '2027-01-15 18:00', `Booking B in UTC must be '2027-01-15 18:00', got: '${bookingBUtc}'`);

// -----------------------------------------------------------
// 4. Calendar URLs Verification (No Double Conversion)
// -----------------------------------------------------------
console.log('\n--- Test 4: Calendar Exports Match Canonical UTC ---');
const gCalUrlA = getGoogleCalendarUrl({
  service: 'Dental Hygiene',
  date: '2026-09-28',
  time: '04:00 PM',
  appointmentStartAt: bookingA.appointmentStartAt,
  appointmentEndAt: bookingA.appointmentEndAt,
  patientName: 'Jane Doe'
});
assert(gCalUrlA.includes('20260928T190000Z'), `Google Calendar URL contains exact UTC start timestamp (20260928T190000Z): ${gCalUrlA}`);
assert(gCalUrlA.includes('20260928T200000Z'), 'Google Calendar URL contains exact UTC end timestamp (20260928T200000Z)');
assert(gCalUrlA.includes('ctz=America%2FHalifax'), 'Google Calendar specifies ctz=America/Halifax');

const outlookUrlA = getOutlookWebUrl({
  service: 'Dental Hygiene',
  date: '2026-09-28',
  time: '04:00 PM',
  appointmentStartAt: bookingA.appointmentStartAt,
  appointmentEndAt: bookingA.appointmentEndAt,
  patientName: 'Jane Doe'
}, true);
assert(outlookUrlA.includes('startdt=2026-09-28T19%3A00%3A00.000Z'), 'Outlook 365 URL uses canonical UTC ISO start');

// -----------------------------------------------------------
// 5. Clinic Hours by Weekday
// Mon-Wed: 08:00-18:00
// Thu: 08:00-17:00
// Fri: 08:00-15:00
// Sat-Sun: Closed
// -----------------------------------------------------------
console.log('\n--- Test 5: Clinic Hours by Weekday ---');
// Monday: 2026-09-28
const monHours = getClinicHoursForDate('2026-09-28');
assert(monHours.openHour === 8 && monHours.closeHour === 18, `Mon hours 8-18: ${monHours.hoursDisplay}`);
// Thursday: 2026-10-01
const thuHours = getClinicHoursForDate('2026-10-01');
assert(thuHours.openHour === 8 && thuHours.closeHour === 17, `Thu hours 8-17: ${thuHours.hoursDisplay}`);
// 5:00 PM on Thursday: 60-min slot ends at 18:00, which exceeds 17:00 close!
assert(!isSlotCompatibleWithDate('2026-10-01', '05:00 PM'), '5:00 PM slot on Thursday is incompatible (exceeds 17:00 close)');
assert(isSlotCompatibleWithDate('2026-10-01', '04:00 PM'), '4:00 PM slot on Thursday is compatible (ends at 17:00)');

// Friday: 2026-10-02
const friHours = getClinicHoursForDate('2026-10-02');
assert(friHours.openHour === 8 && friHours.closeHour === 15, `Fri hours 8-15: ${friHours.hoursDisplay}`);
// 3:00 PM on Friday: ends at 16:00, exceeds 15:00 close!
assert(!isSlotCompatibleWithDate('2026-10-02', '03:00 PM'), '3:00 PM slot on Friday is incompatible');
assert(isSlotCompatibleWithDate('2026-10-02', '02:00 PM'), '2:00 PM slot on Friday is compatible (ends at 15:00)');

// -----------------------------------------------------------
// 6. Suspicious / 1970 Dates Handling
// -----------------------------------------------------------
console.log('\n--- Test 6: Epoch & Suspicious Dates Flagging ---');
assert(isSuspiciousDate('1970-01-01'), '1970-01-01 is flagged as suspicious');
assert(isSuspiciousDate('1969-12-31'), '1969-12-31 is flagged as suspicious');
assert(isSuspiciousDate(new Date(0)), 'Date(0) is flagged as suspicious');
assert(isSuspiciousDate(null), 'null date is suspicious');
assert(!isSuspiciousDate('2026-09-28'), '2026-09-28 is NOT suspicious');

if (failed) {
  console.error('\n❌ SOME REGRESSION TESTS FAILED!');
  process.exit(1);
} else {
  console.log('\n====================================================');
  console.log('🎉 ALL ISOLATED REGRESSION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');
}
