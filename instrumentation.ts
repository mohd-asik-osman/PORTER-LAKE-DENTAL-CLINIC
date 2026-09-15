export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { processAppointmentReminders } = await import('@/lib/reminders');
    
    console.log('[Server Startup] Initializing 24-hour appointment reminder server job...');

    // Run initial check after 10 seconds of server startup
    setTimeout(async () => {
      try {
        console.log('[Server Job] Running scheduled 24h appointment reminders check...');
        const summary = await processAppointmentReminders();
        console.log(`[Server Job Completed] Checked ${summary.totalChecked} bookings, sent ${summary.sentCount} reminders.`);
      } catch (err) {
        console.error('[Server Job Error] Failed to run automated reminder check:', err);
      }
    }, 10000);

    // Schedule background job to run every 30 minutes (1800,000 ms)
    setInterval(async () => {
      try {
        console.log('[Server Job] Periodic check for 24h appointment reminders...');
        const summary = await processAppointmentReminders();
        if (summary.sentCount > 0) {
          console.log(`[Server Job] Sent ${summary.sentCount} 24h appointment reminder emails.`);
        }
      } catch (err) {
        console.error('[Server Job Error] Periodic reminder check failed:', err);
      }
    }, 30 * 60 * 1000);
  }
}
