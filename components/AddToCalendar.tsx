'use client';

import React, { useState } from 'react';
import { CalendarPlus, Download, Check, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
import { 
  AppointmentCalendarData, 
  buildAppointmentDetails,
  formatClinicDateTime,
  isSuspiciousDate,
  getGoogleCalendarUrl, 
  getOutlookWebUrl, 
  downloadIcsFile 
} from '@/lib/calendar';

interface AddToCalendarProps {
  appointment: AppointmentCalendarData;
  className?: string;
  variant?: 'compact' | 'full';
}

function getCalendarOptions(appointment: AppointmentCalendarData) {
  // A malformed legacy booking must not prevent the rest of the admin list rendering.
  // Prefer canonical timestamps, just as the calendar exporters do.
  try {
    const details = buildAppointmentDetails(appointment);
    if (
      isSuspiciousDate(details.startDate) ||
      isSuspiciousDate(details.endDate) ||
      details.endDate.getTime() <= details.startDate.getTime()
    ) {
      return null;
    }

    return {
      googleUrl: getGoogleCalendarUrl(appointment),
      outlook365Url: getOutlookWebUrl(appointment, true),
      outlookLiveUrl: getOutlookWebUrl(appointment, false),
      textToCopy: `Dental Appointment: ${appointment.service}\nDate: ${formatClinicDateTime(details.startDate, 'MMMM d, yyyy')}\nTime: ${formatClinicDateTime(details.startDate, 'h:mm a zzz')} (Halifax Time)\nLocation: ${details.location}\nClinic: Porters Lake Dental (902-827-4746)`,
    };
  } catch {
    return null;
  }
}

export function AddToCalendar({ appointment, className = '', variant = 'full' }: AddToCalendarProps) {
  const [copied, setCopied] = useState(false);
  const [showOutlookMenu, setShowOutlookMenu] = useState(false);

  const calendarOptions = getCalendarOptions(appointment);

  if (!calendarOptions) {
    return (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 ${className}`}>
        <p className="font-semibold">Calendar unavailable</p>
        <p className="mt-1">Check the appointment date and time before exporting.</p>
      </div>
    );
  }

  const { googleUrl, outlook365Url, outlookLiveUrl, textToCopy } = calendarOptions;

  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.preventDefault();
    downloadIcsFile(appointment);
  };

  const handleCopyDetails = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-bold transition-all shadow-sm"
          title="Add to Google Calendar"
        >
          <CalendarPlus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Google Calendar</span>
          <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
        </a>

        <a
          href={outlook365Url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-bold transition-all shadow-sm"
          title="Add to Outlook"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>Outlook</span>
          <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
        </a>

        <button
          onClick={handleDownloadIcs}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
          title="Download iCal (.ics) file"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>.ICS File</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 bg-blue-50/70 border border-blue-100 p-4 sm:p-5 rounded-2xl text-left ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarPlus className="w-5 h-5 text-blue-600 shrink-0" />
          <h4 className="font-bold text-slate-900 text-sm sm:text-base">Add to Your Calendar</h4>
        </div>
        <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 uppercase tracking-wider">
          Reminder
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Easily save your appointment time and location to your personal calendar:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {/* Google Calendar Link */}
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm group min-h-[44px]"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span className="truncate">Google Calendar</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
        </a>

        {/* Outlook Dropdown or Link */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowOutlookMenu(!showOutlookMenu)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-slate-800 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm group min-h-[44px]"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <svg className="w-4 h-4 shrink-0 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 17.5L9.5 20V4L1 6.5v11zm10-13.2L23 2v20l-12-2.3V4.3z"/>
              </svg>
              <span className="truncate">Outlook</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
          </button>

          {showOutlookMenu && (
            <div className="absolute right-0 left-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <a
                href={outlook365Url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowOutlookMenu(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 rounded-lg transition-colors"
              >
                Outlook for Web (Office 365)
              </a>
              <a
                href={outlookLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowOutlookMenu(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 rounded-lg transition-colors"
              >
                Outlook.com / Live
              </a>
            </div>
          )}
        </div>

        {/* iCal / Apple / Desktop File Download */}
        <button
          type="button"
          onClick={handleDownloadIcs}
          className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-800 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm group min-h-[44px]"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <Download className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">Apple / iCal / Outlook (.ics)</span>
          </div>
          <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
        </button>

        {/* Copy Details Button */}
        <button
          type="button"
          onClick={handleCopyDetails}
          className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-800 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm group min-h-[44px]"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            {copied ? (
              <Check className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <CalendarIcon className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span className="truncate">{copied ? 'Copied to Clipboard!' : 'Copy Appointment Info'}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
