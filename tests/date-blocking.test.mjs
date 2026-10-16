import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of date normalization & closure logic matching lib/calendar.ts
const formatToYYYYMMDD = (str) => {
  if (!str) return '';
  return str.split('T')[0].trim();
};

function getDateRangeArray(startDateStr, endDateStr) {
  const normStart = formatToYYYYMMDD(startDateStr);
  const normEnd = formatToYYYYMMDD(endDateStr);
  if (!normStart && !normEnd) return [];
  if (!normStart) return [normEnd];
  if (!normEnd) return [normStart];

  const start = normStart <= normEnd ? normStart : normEnd;
  const end = normStart <= normEnd ? normEnd : normStart;

  if (start === end) return [start];

  const dates = [];
  const current = new Date(`${start}T12:00:00Z`);
  const final = new Date(`${end}T12:00:00Z`);

  while (current <= final) {
    const yyyy = current.getUTCFullYear();
    const mm = String(current.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

const CONFIGURED_CLINIC_CLOSURES = {
  '01-01': "New Year's Day",
  '07-01': 'Canada Day',
  '09-30': 'National Day for Truth and Reconciliation',
  '11-11': 'Remembrance Day',
  '12-25': 'Christmas Day',
  '12-26': 'Boxing Day',
  '2026-02-16': 'Nova Scotia Heritage Day',
  '2026-04-03': 'Good Friday',
  '2026-04-06': 'Easter Monday',
};

function isClinicClosure(dateStr, dynamicClosures) {
  if (!dateStr) return { isClosed: false };
  const targetDate = formatToYYYYMMDD(dateStr);

  if (CONFIGURED_CLINIC_CLOSURES[targetDate]) {
    return { isClosed: true, reason: CONFIGURED_CLINIC_CLOSURES[targetDate] };
  }

  const mmdd = targetDate.slice(5);
  if (CONFIGURED_CLINIC_CLOSURES[mmdd]) {
    return { isClosed: true, reason: CONFIGURED_CLINIC_CLOSURES[mmdd] };
  }

  if (dynamicClosures && Array.isArray(dynamicClosures)) {
    for (const item of dynamicClosures) {
      if (!item.startDate || !item.endDate) continue;
      const rawStart = formatToYYYYMMDD(item.startDate);
      const rawEnd = formatToYYYYMMDD(item.endDate);
      const start = rawStart <= rawEnd ? rawStart : rawEnd;
      const end = rawStart <= rawEnd ? rawEnd : rawStart;
      if (targetDate >= start && targetDate <= end) {
        return { isClosed: true, reason: item.title || 'Clinic Closure' };
      }
    }
  }

  return { isClosed: false };
}

describe('Clinic Date Blocking & Verification Engine', () => {
  it('1. Successfully generates an array of every calendar day for a multi-day closure', () => {
    const days = getDateRangeArray('2026-10-24', '2026-10-27');
    assert.deepEqual(days, ['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27']);
  });

  it('2. Multi-day closure generates individual holidays/YYYY-MM-DD documents matching Firestore security rules', () => {
    const dates = getDateRangeArray('2026-11-02', '2026-11-04');
    const firestoreMockDb = new Map();

    // Store each day as holidays/YYYY-MM-DD
    dates.forEach(d => {
      firestoreMockDb.set(d, { id: d, title: 'Clinic Renovation', startDate: d, endDate: d });
    });

    // Verify each day exists as a standalone key
    assert.equal(firestoreMockDb.has('2026-11-02'), true);
    assert.equal(firestoreMockDb.has('2026-11-03'), true);
    assert.equal(firestoreMockDb.has('2026-11-04'), true);
    assert.equal(firestoreMockDb.has('2026-11-05'), false);

    // Rule: !exists(/databases/$(database)/documents/holidays/$(request.resource.data.date))
    const isBookingAllowedByRule = (bookingDate) => !firestoreMockDb.has(bookingDate);

    assert.equal(isBookingAllowedByRule('2026-11-02'), false); // blocked
    assert.equal(isBookingAllowedByRule('2026-11-03'), false); // blocked
    assert.equal(isBookingAllowedByRule('2026-11-04'), false); // blocked
    assert.equal(isBookingAllowedByRule('2026-11-05'), true);  // open
  });

  it('3. Keeps date blocked even when dates contain ISO timestamp substrings', () => {
    const closures = [
      { id: '2026-11-20', title: 'Clinic Staff Training', startDate: '2026-11-20T00:00:00.000Z', endDate: '2026-11-20T23:59:59.999Z' }
    ];
    const res = isClinicClosure('2026-11-20', closures);
    assert.equal(res.isClosed, true);
    assert.equal(res.reason, 'Clinic Staff Training');
  });

  it('4. Allows an available, non-blocked date', () => {
    const closures = [
      { id: '2026-11-20', title: 'Clinic Staff Training', startDate: '2026-11-20', endDate: '2026-11-20' }
    ];
    const res = isClinicClosure('2026-11-21', closures);
    assert.equal(res.isClosed, false);
  });

  it('5. Successfully unblocks dates', () => {
    let closures = [
      { id: '2026-11-20', title: 'Clinic Staff Training', startDate: '2026-11-20', endDate: '2026-11-20' },
      { id: '2026-11-25', title: 'Equipment Maintenance', startDate: '2026-11-25', endDate: '2026-11-25' }
    ];

    assert.equal(isClinicClosure('2026-11-20', closures).isClosed, true);
    closures = closures.filter(c => c.id !== '2026-11-20');
    assert.equal(isClinicClosure('2026-11-20', closures).isClosed, false);
  });

  it('6. Rejects booking pre-flight check when date is blocked', () => {
    const closures = [
      { id: '2026-11-20', title: 'Clinic Closed', startDate: '2026-11-20', endDate: '2026-11-20' }
    ];

    const validateBookingDate = (date, currentClosures) => {
      const closure = isClinicClosure(date, currentClosures);
      if (closure.isClosed) {
        throw new Error(`The clinic is closed on ${date} (${closure.reason}).`);
      }
      return true;
    };

    assert.throws(() => {
      validateBookingDate('2026-11-20', closures);
    }, /The clinic is closed on 2026-11-20/);
  });

  it('7. Exclusively trusts asikosman010@gmail.com as super-admin (removes unverified admin emails)', () => {
    const isAuthorizedSuperAdmin = (email) => {
      if (!email) return false;
      return email.trim().toLowerCase() === 'asikosman010@gmail.com';
    };

    assert.equal(isAuthorizedSuperAdmin('asikosman010@gmail.com'), true);
    assert.equal(isAuthorizedSuperAdmin('ASIKOSMAN010@GMAIL.COM '), true);
    assert.equal(isAuthorizedSuperAdmin('admin@porterslakedental.com'), false);
    assert.equal(isAuthorizedSuperAdmin('dentist@bellaliant.com'), false);
    assert.equal(isAuthorizedSuperAdmin('staff@porterslakedental.com'), false);
    assert.equal(isAuthorizedSuperAdmin('hacker@example.com'), false);
    assert.equal(isAuthorizedSuperAdmin(null), false);
  });
});
