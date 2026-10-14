# Implementation Plan: Fix Date Blocking & Clinic Closures Synchronization on Public Site

## Problem Summary & Root Cause Analysis
When the website is made public (deployed to production on Google Cloud Run):
1. **Serverless Ephemeral File Storage vs. Cloud Firestore**:
   - The `/api/holidays` route was relying on writing to `data/holidays.json` via Node.js filesystem `fs.writeFileSync`.
   - On Cloud Run containers, local filesystem writes are ephemeral, in-memory, and isolated per container instance. Multiple public visitors or new container instances do not share local filesystem writes, causing blocked days to vanish or fail to persist after public deployment.
2. **Silent Catch Blocks & Missing Firestore Admin Sync**:
   - In `app/admin/page.tsx`, both `handleConfirmAddHoliday` and `handleSaveBulkBlock` caught Firestore save errors with `console.warn` without bubbling them up or verifying that the Firestore write succeeded. If the admin session on the public domain encountered a permission check issue or token refresh latency, the UI showed a false success while the cloud database was never updated.
3. **Desynchronization Between Client Polling & Firestore**:
   - In `app/booking/BookingClient.tsx`, a 3-second polling interval continually fetched `/api/holidays` (the stale server JSON file), which could overwrite real-time Firestore updates with stale data.
   - When the Firestore holiday collection had empty or updated docs, the fallback logic did not cleanly reconcile with dynamic records.

---

## Proposed Changes

### 1. Unified Cloud Firestore Integration in `/api/holidays`
- Update `app/api/holidays/route.ts`:
  - Connect directly to Cloud Firestore as the single source of truth for all holiday closures and date blocks.
  - In `GET`: Fetch all holiday documents from Firestore `holidays` collection, merged with default statutory holidays, with graceful fallback to disk/memory if offline.
  - In `POST`: Save new holiday closure records directly into Firestore `holidays` collection and cache locally.
  - In `DELETE`: Delete records from Firestore `holidays` collection and sync cache.
  - Set cache headers to `no-store, no-cache, must-revalidate` to prevent CDN or browser caching of stale closures.

### 2. Strengthen Admin Date Blocking in `app/admin/page.tsx`
- In `handleConfirmAddHoliday` and `handleSaveBulkBlock`:
  - Ensure the user's admin authentication is validated before initiating the write.
  - Await Firestore `setDoc(doc(db, 'holidays', holidayId), docData)` directly with clear error handling. If Firestore write fails, display a clear actionable error toast rather than a silent failure.
  - Concurrently update `/api/holidays` so all routes stay 100% in sync.
  - When creating placeholder block bookings (`bulkBlockData.createPlaceholderBookings`), ensure the booking document is written with validated schema compliant with `firestore.rules`.
  - Dispatch real-time BroadcastChannel and custom window events so open public tabs and admin tabs reflect the blocked day in under 1 second.

### 3. Real-Time Instant Calendar Blocking in `app/booking/BookingClient.tsx`
- Ensure the public booking calendar subscribes directly to the Firestore `holidays` collection with `onSnapshot`.
- When any day is blocked (via Single Closure or Bulk Block Tool), the public calendar:
  - Immediately highlights the date with `line-through` and `Closed` badge.
  - Disables time slot selection for that day.
  - Shows clear tooltip: *"Clinic Closed: [Reason]"*.
  - Displays a toast message if a user attempts to select a blocked day: *"Clinic is closed on this date ([Reason]). Please choose another date."*
- Ensure background polling of `/api/holidays` does NOT overwrite real-time Firestore state with stale data.

### 4. Direct Quick-Block Capability for Admins on Booking Calendar
- Add an admin indicator/action on the booking calendar if an authenticated admin is viewing `/booking`:
  - Quick button: *"Block Selected Date"* or a direct link to the Admin Closures manager.
  - Enables instant blocking verification directly from the public booking interface.

---

## Verification Plan

### Automated Build Check
- Run `lint_applet` and `compile_applet` to ensure zero TypeScript errors or compilation regressions.

### Functional Testing
1. **Admin Bulk Block**:
   - Open Admin Panel -> Bulk Booking & Date Blocking Tool.
   - Select a date range (e.g., upcoming Monday or Friday), specify reason (e.g. "Staff Training / Maintenance").
   - Click "Save Closure & Block Dates".
   - Verify success toast and instant addition to the Closures list and countdown banner.
2. **Public Booking Verification**:
   - Open `/booking` in a separate window/tab.
   - Navigate to the blocked month.
   - Verify that the blocked date displays in red with `Closed` label and strike-through number.
   - Attempt to click the date; verify time slots cannot be booked and an alert notification is displayed.
3. **Unblocking / Deleting**:
   - Delete the closure from Admin Panel.
   - Verify the date immediately becomes selectable for patients on the public booking page.
