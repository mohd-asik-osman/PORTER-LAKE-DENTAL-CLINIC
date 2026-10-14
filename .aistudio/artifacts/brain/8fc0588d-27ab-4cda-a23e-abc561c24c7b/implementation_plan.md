# Implementation Plan: Fix Holiday Deletion & Real-Time Sync in Admin Panel

The root cause of the deletion failure is that `handleDeleteHoliday` in `app/admin/page.tsx` was calling `window.confirm(...)`. In sandboxed iframe environments (such as AI Studio preview), `window.confirm()` is blocked or returns `false` by default, which silently aborted the deletion before sending any network request.

## Proposed Changes

### 1. Remove `window.confirm` Blocking & Add Resilient Deletion Flow
- In `app/admin/page.tsx`:
  - Update `handleDeleteHoliday(id: string)`:
    - Eliminate `window.confirm()`.
    - Provide immediate execution or an inline confirmation banner/instant delete with an interactive toast.
    - Add a loading state (`deletingHolidayId`) so the delete trash button shows a spinning loader during deletion and prevents duplicate clicks.
    - Immediately execute `DELETE /api/holidays?id=${id}`.
    - Optimistically or instantly update the local state `setHolidays(prev => prev.filter(h => h.id !== id))` so the UI removes the card instantly without waiting for extra delay.
    - Broadcast a local `storage` / custom event (`clinic-holiday-updated`) so any open booking tabs or components update instantaneously.
    - Display a success toast: *"Clinic closure removed successfully"*.

### 2. Verify and Optimize Overview Tab & Closures Tab Actions
- Ensure both the **Clinic Closures tab** and the **Overview tab's Upcoming Clinic Closures section** share the exact same reliable deletion handler with loading spinner feedback.
- Update the countdown & closure cards in the Overview tab so that deleting a closure immediately recalculates the closest upcoming closure and live countdown.

### 3. Verify Patient Booking Availability Instant Refresh
- Verify that deleting a holiday immediately unblocks that date range in `/booking`:
  - The booking page queries `/api/holidays` on mount and listens for storage / window focus events.
  - Test deleting a test holiday and verifying the date immediately becomes selectable for patients.

## Verification Plan

### Automated Build & Lint Check
- Run `lint_applet` and `compile_applet` to guarantee type safety and zero build failures.

### Functional Verification
1. Open Admin Panel -> Clinic Closures tab.
2. Click the Delete icon on an existing holiday (e.g., the "technical error" entry).
3. Verify that deletion occurs immediately without being blocked by browser dialogs.
4. Verify the entry is removed from both the Clinic Closures tab and the Admin Overview tab.
5. Check `/api/holidays` to confirm it is deleted from `data/holidays.json`.
6. Visit the patient booking page to confirm the previously blocked date is available for appointments.
