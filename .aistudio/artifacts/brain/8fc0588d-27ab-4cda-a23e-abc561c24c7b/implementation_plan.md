# Implementation Plan: End-to-End Firestore Date-Blocking & Appointment Security

Fix the clinic date-blocking and appointment-booking system end-to-end so that authorized administrators can reliably block and unblock dates with 100% persistence across reloads, browser restarts, and Netlify redeployments, while patients are strictly prevented from booking blocked dates.

---

## Root Causes Identified

1. **Stateless Serverless Storage vs. Firestore**:
   - The application previously relied on a hybrid dual-write model with `/api/holidays` writing to local disk or memory. On Netlify (`porter-lake-dental-clinic.netlify.app`), Next.js API routes run in ephemeral, read-only AWS Lambda containers. In-memory data vanishes on every cold start or new request.
2. **Local Admin Bypass vs. Real Security Rules**:
   - The "Direct Admin Access" fallback previously stored a simulated admin object in `localStorage` without authenticating with Firebase Auth. Consequently, `request.auth` was `null` on Firestore requests, causing Firestore security rules (`isAdmin()`) to reject writes with `permission-denied`.
   - The client caught this error and showed an informative toast, but left optimistic local state in place, giving the false illusion that the date was blocked until the page reloaded.
3. **ID & Date Key Inconsistency**:
   - Holidays were previously saved with arbitrary IDs (`closure-1792...`) and mixed ISO timestamps (`T00:00:00.000Z`). This caused lexical date range comparison bugs (`'2026-10-25' >= '2026-10-25T...'` evaluating to false) and duplicate entries.
4. **Client-Side Booking Race Condition**:
   - Validation was performed primarily in the UI before form submission, without an atomic pre-flight check against the latest Firestore closure documents at the moment of booking submission.

---

## User Review Required

> [!IMPORTANT]
> **Firebase Console Action Required for Netlify Live Domain**:
> For real Firebase Authentication to work on `https://porter-lake-dental-clinic.netlify.app`:
> 1. Go to [Firebase Console](https://console.firebase.google.com/) -> Select your project -> **Authentication** -> **Settings** -> **Authorized domains**.
> 2. Click **Add domain** and enter `porter-lake-dental-clinic.netlify.app`.
> 3. Ensure the user `asikosman010@gmail.com` is created under **Authentication > Users** with a known password.

---

## Proposed Changes

### 1. Firestore as Single Source of Truth (`/holidays/{YYYY-MM-DD}`)
- **Consistent Date-Only Document IDs**:
  - Single-day closures will be keyed directly by date: `holidays/{YYYY-MM-DD}` (e.g., `holidays/2026-10-25`).
  - Multi-day closures will either create individual day documents or standard `startDate`/`endDate` normalized strictly to `YYYY-MM-DD`.
  - Guarantees $O(1)$ lookups, prevents duplicate entries for the same date, and enables clean, atomic unblocking with `deleteDoc(doc(db, 'holidays', dateStr))`.
- **Remove Serverless File/Memory Dependency**:
  - Deprecate reliance on local file writes in `/api/holidays`.
  - Client components (`BookingClient.tsx` and `admin/page.tsx`) will subscribe directly to Firestore `onSnapshot(collection(db, 'holidays'))` for real-time, live synchronization across all devices and visitors.

### 2. Admin Date-Blocking Flow (`app/booking/BookingClient.tsx` & `app/admin/page.tsx`)
- **Strict Real Auth Enforcement**:
  - Remove all client-side fake admin bypass buttons and mock permissions.
  - Require verified Firebase Auth user (`auth.currentUser`) matching `asikosman010@gmail.com` or `role === 'admin'` in `users/{uid}`.
- **Accurate Feedback**:
  - If a Firestore write or delete operation fails, the error will be explicitly displayed via `toast.error(err.message)`.
  - The UI will never claim success if a Firestore write is rejected.
- **Immediate Selection Cleanup**:
  - When an admin blocks a date that is currently selected in the booking UI, automatically deselect it and reset time slots.

### 3. Patient Booking Validation & Anti-Bypass (`app/booking/BookingClient.tsx` & `lib/calendar.ts`)
- **Strict Pre-Submission Validation**:
  - Inside `handleBooking()`, before saving any appointment to `bookings/{id}`, fetch the latest `doc(db, 'holidays', selectedDateStr)` from Firestore.
  - If the date is closed, abort immediately with an error toast: `"This date has been closed by clinic administration. Please select another date."`
- **Disable Calendar Interaction**:
  - Closed dates will render strictly disabled (`disabled={true}`, cursor not-allowed, visually marked `Closed`) for regular patients.

### 4. Firestore Security Rules Hardening (`firestore.rules`)
- Update `firestore.rules` for `/holidays/{holidayId}`:
  - Public read access (`allow read: if true;`) so all patients can view clinic closures.
  - Write access restricted strictly to verified admins (`isAdmin()`), enforcing valid `startDate`, `endDate`, and `title`.
  - Deploy updated rules to the Firebase project.

### 5. Automated Tests
- Create automated test scripts in `__tests__/date-blocking.test.ts` to verify:
  1. Date normalization (`formatToYYYYMMDD`).
  2. Closure matching and boundary checks (`isClinicClosure`).
  3. Rejection of bookings on closed dates.
  4. Preservation of Halifax timezone boundaries (`CLINIC_TIME_ZONE`).

---

## Verification Plan

### Automated Tests
- Run `npm test` or custom test runner to verify date logic, timezone calculations, and closure detection.
- Run `npm run lint` to ensure zero ESLint errors.
- Run `compile_applet` (`next build`) to ensure TypeScript compilation passes.

### Manual Verification
1. Log in via `/auth` with `asikosman010@gmail.com`.
2. Navigate to `/booking`, select an open future date (e.g. `2026-11-24`), and click **Block Date**.
3. Confirm the date turns red and is labeled "Closed".
4. Refresh the page in an incognito window as a regular visitor: confirm `2026-11-24` is disabled and unclickable.
5. In the Admin panel or Booking Quick Bar, click **Unblock This Date**: confirm it reopens immediately.
