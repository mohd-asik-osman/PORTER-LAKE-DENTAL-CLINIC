# Implementation Plan - Fix Date Blocking After GitHub Deployment

Enable date blocking and holiday deletion to work seamlessly in production deployments (Vercel, Netlify, Cloud Run, Docker) after uploading to GitHub.

## User Review Required

> [!IMPORTANT]
> When deploying Next.js apps from GitHub to serverless platforms like Vercel or Netlify, the server filesystem is strictly read-only (`EROFS`), causing standard `fs.writeFileSync` calls in `/api/holidays` to throw 500 errors. Additionally, Firebase Authentication requires adding your deployed production domain to Firebase Console > Authentication > Settings > Authorized Domains.

- **Primary Cloud Storage**: Date closures will be saved directly into Google Cloud Firestore (`/holidays` collection), ensuring instant global synchronization across all public visitors.
- **Serverless-Safe Server Route**: `/api/holidays` will be wrapped with read-only filesystem guards (in-memory & `/tmp` fallbacks) so it never returns 500 errors on Vercel or Netlify.

---

## Proposed Changes

### 1. Server Route Hardening (`/app/api/holidays/route.ts`)
- Add resilient fallback in `saveStoredFileHolidays`:
  - Detect read-only filesystem (`EROFS`) and gracefully fall back to in-memory state or `/tmp/holidays.json`.
  - Ensure `GET`, `POST`, and `DELETE` endpoints always respond with HTTP 200 and return the latest closures without crashing serverless Lambdas.

### 2. Client-Side Date Blocking (`/app/booking/BookingClient.tsx` & `/app/admin/page.tsx`)
- Enhance `handleAdminQuickBlock` and `handleAdminQuickUnblock` in `BookingClient.tsx`:
  - Ensure cloud Firestore `setDoc` and `deleteDoc` execute robustly with the logged-in admin credentials.
  - Make `/api/holidays` call non-blocking so that even if the external hosting environment has network/disk limitations, the date block persists to Firestore and local storage.
  - Update optimistic state and broadcast immediately so the public calendar reflects closed dates in real time.
- Enhance `handleConfirmAddHoliday` and `handleDeleteHoliday` in `app/admin/page.tsx`:
  - Apply the same resilient Firestore-first and serverless-safe dual persistence.
  - Ensure closure deletions reliably update Firestore and client state.

### 3. Production Deployment Diagnostics
- Add a helpful admin diagnostic notice if Firebase Auth encounters an `auth/unauthorized-domain` error on a newly deployed GitHub domain (e.g. `*.vercel.app`), with clear guidance to add the domain to Firebase Console.

---

## Verification Plan

### Automated Tests
- Test `/api/holidays` GET, POST, and DELETE endpoints with simulated read-only filesystem conditions.
- Run `npm run lint` to verify zero linting errors.
- Run `compile_applet` / build check to verify TypeScript compilation.

### Manual Verification
1. Block a date from the Public Booking page using the Admin Quick Bar.
2. Confirm the date turns unavailable and the slot selection disables.
3. Open Admin Panel, verify the closure appears in the list, and click Delete.
4. Verify the closure is deleted immediately and stays deleted across tab refreshes.
