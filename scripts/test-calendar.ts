import { 
  parseClinicDateTime, 
  buildAppointmentDetails, 
  getGoogleCalendarUrl, 
  getOutlookWebUrl, 
  formatClinicDateTime,
  isSuspiciousDate 
} from '../lib/calendar';

console.log('--- Testing Calendar & Timezone Handling ---');

// Test 1: September 24, 2026 at 4:00 PM Halifax (ADT = UTC-3)
// 16:00 + 3 hours = 19:00 UTC
const septBooking = parseClinicDateTime('2026-09-24', '04:00 PM');
console.log('Sept 24 Start UTC:', septBooking.appointmentStartAt);
const septStart = new Date(septBooking.appointmentStartAt!);
console.log('Sept 24 UTC Hours:', septStart.getUTCHours(), '(Expected 19)');
if (septStart.getUTCHours() !== 19) {
  console.error('FAIL: Sept 24 UTC hour is not 19');
  process.exit(1);
}

// Test 2: January 15, 2027 at 4:00 PM Halifax (AST = UTC-4)
// 16:00 + 4 hours = 20:00 UTC
const janBooking = parseClinicDateTime('2027-01-15', '04:00 PM');
console.log('Jan 15 Start UTC:', janBooking.appointmentStartAt);
const janStart = new Date(janBooking.appointmentStartAt!);
console.log('Jan 15 UTC Hours:', janStart.getUTCHours(), '(Expected 20)');
if (janStart.getUTCHours() !== 20) {
  console.error('FAIL: Jan 15 UTC hour is not 20');
  process.exit(1);
}

// Test 3: Epoch / Suspicious dates
console.log('1970-01-01 suspicious?', isSuspiciousDate('1970-01-01'));
if (!isSuspiciousDate('1970-01-01')) {
  console.error('FAIL: 1970-01-01 was not detected as suspicious');
  process.exit(1);
}

console.log('✅ Calendar & Timezone validation passed perfectly!');
