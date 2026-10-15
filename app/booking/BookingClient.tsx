'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, 
  ChevronRight, Heart, CheckCircle2, Loader2,
  Stethoscope, Sparkles, X, User, Palmtree,
  Shield, Lock, Unlock, Plus, AlertCircle
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AddToCalendar } from '@/components/AddToCalendar';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useMounted } from '@/hooks/use-mounted';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  parseClinicDateTime, 
  CLINIC_TIME_ZONE, 
  formatClinicDateTime,
  getCalendarMonthData,
  getAvailableSlotsForDate,
  getClinicHoursForDate,
  isSlotCompatibleWithDate,
  isClinicClosure,
  getHalifaxTodayDateStr,
  isPastDateInHalifax,
  DynamicHolidayItem
} from '@/lib/calendar';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const SERVICES = [
  { id: 'cosmetic-dentistry', title: 'Cosmetic Dentistry', price: '$150' },
  { id: 'dental-appliances', title: 'Dental Appliances', price: '$300' },
  { id: 'dental-hygiene', title: 'Dental Hygiene', price: '$60' },
  { id: 'dental-implants', title: 'Dental Implants', price: '$1200' },
  { id: 'family-dentistry', title: 'Family Dentistry', price: '$80' },
  { id: 'restorative-dentistry', title: 'Restorative Dentistry', price: '$250' },
  { id: 'sedation-dentistry', title: 'Sedation Dentistry', price: '$100' },
];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [patientDetails, setPatientDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Month navigation: default to current month in Halifax
  const todayHalifax = useMemo(() => getHalifaxTodayDateStr(), []);
  const initialYear = parseInt(todayHalifax.slice(0, 4), 10);
  const initialMonth = parseInt(todayHalifax.slice(5, 7), 10) - 1; // 0-indexed

  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(initialMonth);

  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    service: string;
    date: string;
    time: string;
    appointmentStartAt: string;
    appointmentEndAt: string;
    patientName: string;
    dateFormatted: string;
    timeFormatted: string;
  } | null>(null);

  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (stepHeadingRef.current) {
      stepHeadingRef.current.focus();
    }
  }, [step]);

  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isMounted = useMounted();
  const showAdminControls = isMounted && isAdmin;

  // Admin fast date block/unblock controls
  const [isAdminBlockModalOpen, setIsAdminBlockModalOpen] = useState(false);
  const [adminBlockData, setAdminBlockData] = useState({
    title: 'Clinic Closure',
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [isSubmittingAdminBlock, setIsSubmittingAdminBlock] = useState(false);

  // Real-time clinic holidays and closures
  const [holidays, setHolidays] = useState<DynamicHolidayItem[]>([]);

  useEffect(() => {
    // 1. Initial immediate load from localStorage for zero latency
    try {
      const cached = localStorage.getItem('dentacare_holidays');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setHolidays(parsed);
        }
      }
    } catch (_) {}

    // 2. Fetch from server API endpoint to guarantee latest closures across all devices
    const fetchHolidays = () => {
      fetch('/api/holidays')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.holidays)) {
            setHolidays(data.holidays);
            try {
              localStorage.setItem('dentacare_holidays', JSON.stringify(data.holidays));
            } catch (_) {}
          }
        })
        .catch(err => console.warn('Could not fetch /api/holidays:', err));
    };

    fetchHolidays();

    // 3. Real-time BroadcastChannel: instant (1ms) sync when admin deletes or adds closures
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('dentacare_clinic_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'HOLIDAYS_UPDATED' && Array.isArray(event.data.holidays)) {
          setHolidays(event.data.holidays);
          try {
            localStorage.setItem('dentacare_holidays', JSON.stringify(event.data.holidays));
          } catch (_) {}
        }
      };
    } catch (_) {}

    // 4. Window storage event listener for cross-tab local storage sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dentacare_holidays') {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : [];
          if (Array.isArray(updated)) {
            setHolidays(updated);
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 5. Custom in-app event listener
    const handleCustomSync = (e: any) => {
      if (Array.isArray(e.detail)) {
        setHolidays(e.detail);
        try {
          localStorage.setItem('dentacare_holidays', JSON.stringify(e.detail));
        } catch (_) {}
      }
    };
    window.addEventListener('dentacare_holidays_updated', handleCustomSync);

    // 6. Window focus refresh (when user switches back to this tab)
    const handleFocus = () => {
      fetchHolidays();
    };
    window.addEventListener('focus', handleFocus);

    // 7. Background heartbeat polling (every 3s) for seamless multi-device/multi-window synchronization
    const pollInterval = setInterval(() => {
      fetchHolidays();
    }, 3000);

    // 8. Attach Firestore real-time listener
    let unsubscribeFirestore: (() => void) | null = null;
    try {
      const q = query(collection(db, 'holidays'), orderBy('startDate', 'asc'));
      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DynamicHolidayItem));
        setHolidays(list);
        try {
          localStorage.setItem('dentacare_holidays', JSON.stringify(list));
        } catch (_) {}
      }, (err) => {
        console.warn('Real-time holidays listener note:', err);
      });
    } catch (_) {}

    return () => {
      if (channel) channel.close();
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('dentacare_holidays_updated', handleCustomSync);
      window.removeEventListener('focus', handleFocus);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Dynamic calendar calculation with leading empty cells, leap year, and clinic closures support
  const calendarData = useMemo(() => {
    return getCalendarMonthData({ year: currentYear, monthIndex: currentMonthIndex }, holidays);
  }, [currentYear, currentMonthIndex, holidays]);

  // Closures that affect the currently viewed month
  const currentMonthClosures = useMemo(() => {
    const currentMonthStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
    return holidays.filter(h => {
      return h.startDate.startsWith(currentMonthStr) || h.endDate.startsWith(currentMonthStr) ||
             (h.startDate <= `${currentMonthStr}-01` && h.endDate >= `${currentMonthStr}-28`);
    });
  }, [currentYear, currentMonthIndex, holidays]);

  // Slots for the selected date
  const availableSlots = useMemo(() => {
    if (!selectedDateStr) return [];
    return getAvailableSlotsForDate(selectedDateStr, 60, holidays);
  }, [selectedDateStr, holidays]);

  // Safely derive displayed date/time using parseClinicDateTime(selectedDateStr, selectedTime)
  const reviewParsed = useMemo(() => {
    if (!selectedDateStr || !selectedTime) return null;
    return parseClinicDateTime(selectedDateStr, selectedTime);
  }, [selectedDateStr, selectedTime]);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonthIndex(11);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonthIndex(0);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  // Determine if previous month is before today's Halifax month
  const canGoPrevMonth = useMemo(() => {
    if (currentYear > initialYear) return true;
    if (currentYear === initialYear) return currentMonthIndex > initialMonth;
    return false;
  }, [currentYear, currentMonthIndex, initialYear, initialMonth]);

  // Selected date closure details helper
  const selectedDateClosure = useMemo(() => {
    if (!selectedDateStr) return null;
    return holidays.find(h => {
      const s = h.startDate <= h.endDate ? h.startDate : h.endDate;
      const e = h.startDate <= h.endDate ? h.endDate : h.startDate;
      return selectedDateStr >= s && selectedDateStr <= e;
    }) || null;
  }, [selectedDateStr, holidays]);

  const isSelectedDateClosed = useMemo(() => {
    if (!selectedDateStr) return false;
    return isClinicClosure(selectedDateStr, holidays).isClosed;
  }, [selectedDateStr, holidays]);

  // Date selection with automatic slot compatibility check
  const handleSelectDate = (dateStr: string) => {
    const closure = isClinicClosure(dateStr, holidays);
    
    // For regular patients, strictly prevent selection of closed days
    if (closure.isClosed && !isAdmin) {
      toast.error(`Clinic is closed on this date (${closure.reason || 'Scheduled Closure'}). Please choose another date.`);
      return;
    }

    setSelectedDateStr(dateStr);
    setSubmitError(null);

    // Clear selected time if the newly selected date is closed
    if (closure.isClosed) {
      setSelectedTime('');
      return;
    }

    // Clear incompatible selected time when the date changes
    if (selectedTime && !isSlotCompatibleWithDate(dateStr, selectedTime, 60, holidays)) {
      setSelectedTime('');
    }
  };

  const handleOpenAdminBlockModal = (initialDate?: string) => {
    const targetDate = initialDate || selectedDateStr || todayHalifax;
    setAdminBlockData({
      title: 'Scheduled Clinic Closure',
      startDate: targetDate,
      endDate: targetDate,
      notes: ''
    });
    setIsAdminBlockModalOpen(true);
  };

  const handleAdminQuickBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminBlockData.startDate || !adminBlockData.endDate) {
      toast.error('Please specify start and end dates');
      return;
    }

    setIsSubmittingAdminBlock(true);
    const holidayId = `closure-${Date.now()}`;
    const start = adminBlockData.startDate <= adminBlockData.endDate ? adminBlockData.startDate : adminBlockData.endDate;
    const end = adminBlockData.startDate <= adminBlockData.endDate ? adminBlockData.endDate : adminBlockData.startDate;

    const newClosure: DynamicHolidayItem = {
      id: holidayId,
      title: adminBlockData.title.trim() || 'Clinic Closure',
      startDate: start,
      endDate: end,
      type: 'closure',
      notes: adminBlockData.notes.trim() || 'Blocked by Admin from Booking Calendar'
    };

    // 1. Optimistic local update
    const currentList = Array.isArray(holidays) ? holidays : [];
    const updated = [...currentList.filter(h => h.id !== holidayId), newClosure].sort((a, b) => a.startDate.localeCompare(b.startDate));
    setHolidays(updated);
    try {
      localStorage.setItem('dentacare_holidays', JSON.stringify(updated));
    } catch (_) {}

    // 2. BroadcastChannel
    try {
      const channel = new BroadcastChannel('dentacare_clinic_sync');
      channel.postMessage({ type: 'HOLIDAYS_UPDATED', holidays: updated });
      channel.close();
    } catch (_) {}

    try {
      window.dispatchEvent(new CustomEvent('dentacare_holidays_updated', { detail: updated }));
    } catch (_) {}

    // 3. Save to server API
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newClosure,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.email || 'admin'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.holidays)) {
          setHolidays(data.holidays);
          try {
            localStorage.setItem('dentacare_holidays', JSON.stringify(data.holidays));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('API save note:', err);
    }

    // 4. Save to Firestore if admin has cloud connection
    try {
      await setDoc(doc(db, 'holidays', holidayId), {
        ...newClosure,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.email || 'admin'
      });
    } catch (err: any) {
      console.warn('Firestore setDoc note:', err);
      if (err?.code === 'permission-denied') {
        toast.info('Date blocked in clinic schedule! Note: Add this website domain to Firebase Console for cloud sync.');
      }
    }

    // If the blocked date was currently selected, reset slot selection
    if (selectedDateStr && selectedDateStr >= start && selectedDateStr <= end) {
      setSelectedDateStr('');
      setSelectedTime('');
    }

    toast.success(`Date ${start === end ? start : `${start} to ${end}`} is now blocked from public booking!`);
    setIsAdminBlockModalOpen(false);
    setIsSubmittingAdminBlock(false);
  };

  const handleAdminQuickUnblock = async (dateStr: string) => {
    // Find matching closure
    const matching = holidays.find(h => {
      const s = h.startDate <= h.endDate ? h.startDate : h.endDate;
      const e = h.startDate <= h.endDate ? h.endDate : h.startDate;
      return dateStr >= s && dateStr <= e;
    });

    const closureId = matching?.id;

    // Optimistically update
    const updated = matching ? holidays.filter(h => h.id !== matching.id) : holidays;
    setHolidays(updated);
    try {
      localStorage.setItem('dentacare_holidays', JSON.stringify(updated));
    } catch (_) {}

    try {
      const channel = new BroadcastChannel('dentacare_clinic_sync');
      channel.postMessage({ type: 'HOLIDAYS_UPDATED', holidays: updated });
      channel.close();
    } catch (_) {}

    try {
      window.dispatchEvent(new CustomEvent('dentacare_holidays_updated', { detail: updated }));
    } catch (_) {}

    if (closureId) {
      // 1. Server API delete
      try {
        const res = await fetch(`/api/holidays?id=${encodeURIComponent(closureId)}`, { method: 'DELETE' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.holidays)) {
            setHolidays(data.holidays);
            try {
              localStorage.setItem('dentacare_holidays', JSON.stringify(data.holidays));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('API delete note:', err);
      }

      // 2. Firestore delete
      try {
        await deleteDoc(doc(db, 'holidays', closureId));
      } catch (err) {
        console.warn('Firestore delete note:', err);
      }
    }

    toast.success(`Date ${dateStr} has been unblocked! Appointment booking is now open.`);
  };

  const validateStep3 = () => {
    const newErrors = { name: '', email: '', phone: '' };
    let isValid = true;

    if (!patientDetails.name.trim()) {
      newErrors.name = 'Full name is required';
      isValid = false;
    }

    if (!patientDetails.email.trim()) {
      newErrors.email = 'Email address is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(patientDetails.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!patientDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\+?[\d\s-()]{7,}$/.test(patientDetails.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleBooking = async () => {
    setIsLoading(true);
    setSubmitError(null);
    
    try {
      if (!selectedDateStr || !selectedTime) {
        throw new Error('Please select both a date and an available time slot.');
      }

      // Revalidate the selected date and slot immediately before saving, including past-date and expired-slot checks.
      if (isPastDateInHalifax(selectedDateStr)) {
        throw new Error('The selected appointment date is in the past. Please select a future date.');
      }

      if (!isSlotCompatibleWithDate(selectedDateStr, selectedTime)) {
        throw new Error('The selected time slot is outside clinic operating hours or has already passed. Please select another time slot.');
      }

      const parsed = parseClinicDateTime(selectedDateStr, selectedTime);

      if (!parsed.isValid) {
        setSubmitError(parsed.errorMessage || 'Invalid date or time selected.');
        setIsLoading(false);
        return;
      }

      const bookingId = crypto.randomUUID();
      const newBooking = {
        id: bookingId,
        patientName: patientDetails.name,
        patientEmail: patientDetails.email,
        patientPhone: patientDetails.phone,
        service: selectedService,
        date: parsed.dateStr,
        time: parsed.timeStr,
        appointmentStartAt: parsed.appointmentStartAt,
        appointmentEndAt: parsed.appointmentEndAt,
        reminderDueAt: parsed.reminderDueAt,
        timeZone: CLINIC_TIME_ZONE,
        isSuspiciousDate: false,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, 'bookings', bookingId), newBooking);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
      }

      // Save to localStorage as backup
      const bookings = JSON.parse(localStorage.getItem('dentacare_bookings') || '[]');
      bookings.push(newBooking);
      localStorage.setItem('dentacare_bookings', JSON.stringify(bookings));
      
      // Send confirmation email
      fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: patientDetails.email,
          userName: patientDetails.name,
          service: selectedService,
          date: parsed.dateFormatted,
          time: parsed.timeFormatted,
          appointmentStartAt: parsed.appointmentStartAt
        })
      }).catch(err => console.error('Failed to send confirmation email:', err));

      setConfirmedBooking({
        id: bookingId,
        service: selectedService,
        date: parsed.dateStr,
        time: parsed.timeStr,
        appointmentStartAt: parsed.appointmentStartAt,
        appointmentEndAt: parsed.appointmentEndAt,
        patientName: patientDetails.name,
        dateFormatted: parsed.dateFormatted,
        timeFormatted: parsed.timeFormatted
      });

      setShowModal(true);
    } catch (error) {
      console.error('Error saving booking:', error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred while booking.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedService('');
    setSelectedDateStr(null);
    setSelectedTime('');
    setPatientDetails({ name: '', email: '', phone: '' });
    setSubmitError(null);
    setShowModal(false);
    setConfirmedBooking(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-6 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <div className="mb-4 sm:mb-6 flex flex-col items-center text-center">
            <Link href="/" className="inline-flex items-center space-x-2 text-blue-600 font-bold mb-3 sm:mb-4 hover:-translate-x-1 transition-transform" aria-label="Back to Home">
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="inline-block border-2 border-blue-100 rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-3 sm:py-4 bg-white shadow-sm max-w-full">
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-slate-900 mb-1 sm:mb-2 tracking-tight">Book Your Visit</h1>
              <p className="text-xs sm:text-base text-slate-500">Simple, fast, and secure dental appointment booking.</p>
            </div>
          </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center space-x-1.5 sm:space-x-4 mb-4 sm:mb-6 px-2" role="navigation" aria-label="Booking progress">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center">
              <div 
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-base font-bold transition-all ${
                  step >= i ? 'bg-blue-600 text-white shadow-md sm:shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200'
                }`}
                aria-current={step === i ? 'step' : undefined}
                aria-label={`Step ${i}`}
              >
                {i}
              </div>
              {i < 4 && <div className={`w-4 sm:w-12 h-0.5 mx-1 sm:mx-2 ${step > i ? 'bg-blue-600' : 'bg-slate-200'}`} aria-hidden="true" />}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl sm:rounded-3xl md:rounded-[40px] p-4 sm:p-8 md:p-10 shadow-xl sm:shadow-2xl border border-white/40">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 
                ref={stepHeadingRef}
                tabIndex={-1}
                className="text-xl sm:text-2xl font-display font-bold text-slate-900 mb-4 sm:mb-6 flex items-center space-x-3 outline-none"
              >
                <Stethoscope className="text-blue-600 shrink-0 w-6 h-6" />
                <span>Select a Service</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {SERVICES.map(service => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service.title);
                      setStep(2);
                    }}
                    aria-label={`Select ${service.title} - ${service.price}`}
                    className={`p-4 sm:p-5 min-h-[96px] rounded-2xl border text-left flex flex-col justify-between transition-all focus:ring-4 focus:ring-blue-500/20 outline-none active:scale-[0.99] ${
                      selectedService === service.title 
                        ? 'bg-blue-50 border-blue-600 ring-4 ring-blue-500/10' 
                        : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2 gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">{service.title}</span>
                      <span className="text-blue-600 font-bold text-xs sm:text-sm shrink-0">{service.price}</span>
                    </div>
                    <p className="text-xs text-slate-500">Professional care by our experts</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
                <h2 
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-lg sm:text-2xl font-display font-bold text-slate-900 flex items-center space-x-2 sm:space-x-3 outline-none"
                >
                  <CalendarIcon className="text-blue-600 shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Choose Date & Time</span>
                </h2>
                <button onClick={() => setStep(1)} className="text-xs sm:text-sm font-bold text-slate-400 hover:text-blue-600 shrink-0">Change Service</button>
              </div>

              {/* Admin Quick Control Banner */}
              {showAdminControls && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className="p-2 bg-purple-600 text-white rounded-xl shrink-0 shadow-md shadow-purple-200">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-purple-950 text-sm">Administrator Live Controls</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-[10px] font-bold">Admin Active</span>
                      </div>
                      <p className="text-purple-700 mt-0.5">
                        Logged in as <strong>{currentUser?.email}</strong>. You can block or unblock any date directly on this calendar.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenAdminBlockModal()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md shadow-purple-200 flex items-center space-x-1.5 transition-all text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Block a Date</span>
                    </button>
                    <Link
                      href="/admin"
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-purple-700 border border-purple-200 rounded-xl font-bold transition-all text-xs"
                    >
                      Admin Dashboard
                    </Link>
                  </div>
                </div>
              )}

              {/* Clinic Closures Banner if any in this month */}
              {currentMonthClosures.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
                  <Palmtree className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Clinic Closure Notice for {calendarData.monthLabel}: </span>
                    <span className="text-amber-800">
                      Closed on{' '}
                      {currentMonthClosures.map((c, idx) => (
                        <span key={c.id || idx}>
                          <strong className="font-bold">{c.title}</strong> ({c.startDate === c.endDate ? c.startDate : `${c.startDate} to ${c.endDate}`})
                          {idx < currentMonthClosures.length - 1 ? ', ' : ''}
                        </span>
                      ))}. These dates are visually blocked from booking below.
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Calendar */}
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">{calendarData.monthLabel}</span>
                    <div className="flex space-x-1 sm:space-x-2">
                      <button 
                        onClick={handlePrevMonth}
                        disabled={!canGoPrevMonth}
                        className={`p-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                          canGoPrevMonth ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'
                        }`}
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <button 
                        onClick={handleNextMonth} 
                        className="p-2 hover:bg-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors text-slate-700"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Sunday - Saturday weekday headings */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, idx) => (
                      <span 
                        key={d} 
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          idx === 0 || idx === 6 ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Calendar Days with dynamic leading empty cells */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {/* Leading empty cells for month start weekday alignment */}
                    {Array.from({ length: calendarData.leadingEmptyDays }).map((_, i) => (
                      <div key={`empty-${i}`} aria-hidden="true" className="min-h-[40px] sm:min-h-[44px] aspect-square" />
                    ))}

                    {calendarData.days.map((day) => {
                      const isSelected = selectedDateStr === day.dateStr;
                      const isDisabled = showAdminControls ? (day.isPast || day.isWeekend) : (day.isPast || day.isWeekend || day.isClosed);
                      
                      let statusNote = '';
                      if (day.isClosed) statusNote = `Clinic Closed: ${day.closureReason || 'Scheduled Closure'}${showAdminControls ? ' (Click to manage/unblock)' : ''}`;
                      else if (day.isWeekend) statusNote = 'Closed (Weekend)';
                      else if (day.isPast) statusNote = 'Past date';

                      return (
                        <button
                          key={day.dateStr}
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) return;
                            handleSelectDate(day.dateStr);
                          }}
                          title={statusNote || undefined}
                          aria-label={`${day.dateStr}${statusNote ? ` - ${statusNote}` : ''}`}
                          aria-pressed={isSelected}
                          className={`min-h-[40px] sm:min-h-[44px] aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-xs sm:text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500 outline-none relative ${
                            day.isClosed
                              ? isSelected
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 font-bold scale-105 z-10'
                                : showAdminControls
                                  ? 'bg-rose-50 text-rose-600 border border-rose-300 hover:bg-rose-100/90 cursor-pointer font-bold'
                                  : 'bg-rose-50/90 text-rose-500 border border-rose-200 cursor-not-allowed hover:bg-rose-50'
                              : isDisabled 
                                ? 'text-slate-300 bg-slate-50/40 cursor-not-allowed' 
                                : isSelected 
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold scale-105 z-10' 
                                  : day.isToday 
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold hover:bg-blue-100/70' 
                                    : 'hover:bg-slate-100 text-slate-700 font-semibold'
                          }`}
                        >
                          <span className={day.isClosed ? (isSelected ? 'font-black' : 'line-through text-rose-500 font-bold') : ''}>
                            {day.dayNumber}
                          </span>
                          {day.isClosed && (
                            <span className={`text-[8px] font-black uppercase tracking-tighter leading-none mt-0.5 ${isSelected ? 'text-white' : 'text-rose-600'}`}>
                              Closed
                            </span>
                          )}
                          {day.isToday && !isSelected && !day.isClosed && (
                            <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>Selected</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-300" />
                      <span>Today</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-rose-600 font-semibold">Clinic Closed</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <span>Weekend / Past</span>
                    </span>
                  </div>

                  {!showAdminControls && (
                    <div className="mt-4 text-center">
                      <Link href="/auth" className="text-[11px] text-slate-400 hover:text-blue-600 font-medium transition-colors">
                        Clinic staff or administrator? Sign in to manage dates and closures.
                      </Link>
                    </div>
                  )}
                </div>

                {/* Time Slots & Closure Details */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 sm:mb-6">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{isSelectedDateClosed ? 'Closure Details' : 'Available Slots'}</span>
                    </h3>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg inline-block w-fit">
                      All times in Halifax time (AST/ADT)
                    </span>
                  </div>

                  {!selectedDateStr ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/60 flex flex-col items-center justify-center">
                      <CalendarIcon className="w-10 h-10 text-slate-300 mb-3" />
                      <h4 className="font-bold text-slate-700 text-sm sm:text-base mb-1">Select an Appointment Date</h4>
                      <p className="text-xs text-slate-500 max-w-xs">
                        Please choose an open weekday on the calendar to view available clinic hours and time slots.
                      </p>
                    </div>
                  ) : isSelectedDateClosed ? (
                    <div className="rounded-2xl border-2 border-rose-200 p-6 bg-rose-50/80 text-rose-950 space-y-4">
                      <div className="flex items-start space-x-3.5">
                        <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-200 shrink-0">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                            Clinic Closed
                          </span>
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                            {selectedDateClosure?.title || isClinicClosure(selectedDateStr, holidays).reason || 'Clinic Closure'}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Date: <strong className="text-slate-900">{formatClinicDateTime(`${selectedDateStr}T12:00:00`, 'EEEE, MMMM d, yyyy')}</strong>
                          </p>
                          {selectedDateClosure?.notes && (
                            <p className="text-xs text-slate-500 mt-2 bg-white/70 p-2.5 rounded-lg border border-rose-100 italic">
                              &ldquo;{selectedDateClosure.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {showAdminControls ? (
                        <div className="pt-3 border-t border-rose-200 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdminQuickUnblock(selectedDateStr)}
                            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
                          >
                            <Unlock className="w-4 h-4" />
                            <span>Unblock This Date (Open Booking)</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-rose-700 font-medium">
                          The clinic is unavailable on this date. Please select another date on the calendar.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="px-3.5 py-2.5 bg-blue-50/90 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="text-slate-600 font-medium">
                          Selected: <strong className="text-slate-900">{formatClinicDateTime(`${selectedDateStr}T12:00:00`, 'EEEE, MMMM d, yyyy')}</strong>
                        </span>
                        <span className="text-blue-700 font-semibold bg-white/70 px-2 py-0.5 rounded-md border border-blue-200/50 w-fit">
                          Hours: {getClinicHoursForDate(selectedDateStr).hoursDisplay}
                        </span>
                      </div>

                      {showAdminControls && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 text-xs text-purple-900">
                            <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>Need to close this clinic day?</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenAdminBlockModal(selectedDateStr)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-purple-200 transition-all shrink-0"
                          >
                            Block This Day
                          </button>
                        </div>
                      )}

                      {availableSlots.filter(s => s.available).length === 0 ? (
                        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-800">
                          <p className="font-bold mb-1">No remaining appointment slots on this date</p>
                          <p>All clinic slots for this day have ended or are booked. Please select another date.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                          {availableSlots.map(slot => (
                            <button
                              key={slot.time}
                              disabled={!slot.available}
                              onClick={() => {
                                if (slot.available) {
                                  setSelectedTime(slot.time);
                                  setStep(3);
                                }
                              }}
                              title={slot.reason || undefined}
                              aria-label={`Select time ${slot.time}${!slot.available ? ` (${slot.reason})` : ''}`}
                              aria-pressed={selectedTime === slot.time}
                              className={`min-h-[44px] py-3 px-3 sm:px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all focus:ring-2 focus:ring-blue-500 outline-none flex items-center justify-center ${
                                !slot.available
                                  ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                  : selectedTime === slot.time 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Patient Details */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
                <h2 
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-lg sm:text-2xl font-display font-bold text-slate-900 flex items-center space-x-2 sm:space-x-3 outline-none"
                >
                  <User className="text-blue-600 shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Patient Information</span>
                </h2>
                <button onClick={() => setStep(2)} className="text-xs sm:text-sm font-bold text-slate-400 hover:text-blue-600 shrink-0">Change Time</button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="patient-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                  <input 
                    id="patient-name"
                    type="text" 
                    required
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    value={patientDetails.name}
                    onChange={(e) => {
                      setPatientDetails({...patientDetails, name: e.target.value});
                      if (errors.name) setErrors({...errors, name: ''});
                    }}
                    placeholder="John Doe"
                    className={`w-full min-h-[48px] px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base ${
                      errors.name ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
                    }`}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-xs text-red-500 font-bold ml-1 flex items-center space-x-1" role="alert">
                      <X className="w-3 h-3" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="patient-email" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                    <input 
                      id="patient-email"
                      type="email" 
                      required
                      aria-required="true"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      value={patientDetails.email}
                      onChange={(e) => {
                        setPatientDetails({...patientDetails, email: e.target.value});
                        if (errors.email) setErrors({...errors, email: ''});
                      }}
                      placeholder="john@example.com"
                      className={`w-full min-h-[48px] px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base ${
                        errors.email ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
                      }`}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-xs text-red-500 font-bold ml-1 flex items-center space-x-1" role="alert">
                        <X className="w-3 h-3" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="patient-phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <input 
                      id="patient-phone"
                      type="tel" 
                      required
                      aria-required="true"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? "phone-error" : undefined}
                      value={patientDetails.phone}
                      onChange={(e) => {
                        setPatientDetails({...patientDetails, phone: e.target.value});
                        if (errors.phone) setErrors({...errors, phone: ''});
                      }}
                      placeholder="+1 (555) 000-0000"
                      className={`w-full min-h-[48px] px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base ${
                        errors.phone ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
                      }`}
                    />
                    {errors.phone && (
                      <p id="phone-error" className="text-xs text-red-500 font-bold ml-1 flex items-center space-x-1" role="alert">
                        <X className="w-3 h-3" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if (validateStep3()) {
                      setStep(4);
                    }
                  }}
                  className="w-full min-h-[48px] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] transition-all text-sm sm:text-base mt-2"
                >
                  Continue to Review
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
                <h2 
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-lg sm:text-2xl font-display font-bold text-slate-900 flex items-center space-x-2 sm:space-x-3 outline-none"
                >
                  <Sparkles className="text-blue-600 shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Review & Confirm</span>
                </h2>
                <button onClick={() => setStep(3)} className="text-xs sm:text-sm font-bold text-slate-400 hover:text-blue-600 shrink-0">Change Details</button>
              </div>

              {(!reviewParsed || !reviewParsed.isValid) && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="block font-semibold">Appointment Selection Incomplete</strong>
                    <span>Please choose a valid clinic date and time before confirming.</span>
                  </div>
                  <button 
                    onClick={() => setStep(2)} 
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 w-fit"
                  >
                    Select Date & Time
                  </button>
                </div>
              )}

              {submitError && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm" role="alert">
                  <strong className="block font-semibold">Unable to process appointment</strong>
                  <span>{submitError}</span>
                </div>
              )}

              <dl className="bg-slate-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-8 sm:mb-10 space-y-4 sm:space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 sm:pb-4 gap-2 text-sm sm:text-base">
                  <dt className="text-slate-500 font-medium shrink-0">Patient</dt>
                  <dd className="font-bold text-slate-900 text-right truncate">{patientDetails.name || 'Not provided'}</dd>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 sm:pb-4 gap-2 text-sm sm:text-base">
                  <dt className="text-slate-500 font-medium shrink-0">Service</dt>
                  <dd className="font-bold text-slate-900 text-right truncate">{selectedService || 'Not selected'}</dd>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 sm:pb-4 gap-2 text-sm sm:text-base">
                  <dt className="text-slate-500 font-medium shrink-0">Date</dt>
                  <dd className="font-bold text-slate-900 text-right">
                    {reviewParsed && reviewParsed.isValid ? (
                      reviewParsed.dateFormatted
                    ) : (
                      <span className="text-amber-600 font-semibold">No date selected</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <dt className="text-slate-500 font-medium shrink-0">Time</dt>
                  <dd className="font-bold text-slate-900 text-right">
                    {reviewParsed && reviewParsed.isValid ? (
                      `${reviewParsed.timeFormatted} (Halifax Time)`
                    ) : (
                      <span className="text-amber-600 font-semibold">No time selected</span>
                    )}
                  </dd>
                </div>
              </dl>

              <button 
                onClick={handleBooking}
                disabled={isLoading || !reviewParsed || !reviewParsed.isValid}
                aria-busy={isLoading}
                className={`w-full min-h-[48px] py-4 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 focus:ring-4 focus:ring-blue-500/20 outline-none text-sm sm:text-base ${
                  isLoading || !reviewParsed || !reviewParsed.isValid
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span>Book an appointment</span>
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <>
        {showModal && confirmedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              onClick={resetForm}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
              aria-hidden="true"
            />
            <div 
              className="relative w-full max-w-lg glass p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[40px] shadow-2xl border border-white/40 text-center animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <button 
                onClick={resetForm}
                className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              
              <h2 id="modal-title" className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-3">Booking Confirmed!</h2>
              
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 mb-5 text-left space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.dateFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.timeFormatted} (Halifax Time)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.patientName}</span>
                </div>
              </div>

              {/* Calendar Integration */}
              <AddToCalendar 
                appointment={{
                  service: confirmedBooking.service,
                  date: confirmedBooking.date,
                  time: confirmedBooking.time,
                  appointmentStartAt: confirmedBooking.appointmentStartAt,
                  appointmentEndAt: confirmedBooking.appointmentEndAt,
                  patientName: confirmedBooking.patientName
                }}
                className="mb-6"
              />

              <div className="space-y-3">
                <Link 
                  href="/" 
                  className="block w-full py-3.5 sm:py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all focus:ring-4 focus:ring-blue-500/20 outline-none text-sm sm:text-base"
                >
                  Return to Home
                </Link>
                <button 
                  onClick={resetForm}
                  className="block w-full py-3.5 sm:py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all focus:ring-4 focus:ring-slate-500/10 outline-none text-sm sm:text-base"
                >
                  Book Another Appointment
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Admin Quick Block Modal */}
        {showAdminControls && isAdminBlockModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div 
              onClick={() => setIsAdminBlockModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
              aria-hidden="true"
            />
            <div 
              className="relative w-full max-w-lg glass p-6 sm:p-8 rounded-3xl sm:rounded-[36px] shadow-2xl border border-white/40 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="block-modal-title"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-md shadow-purple-200">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="block-modal-title" className="text-lg font-bold text-slate-900">Block Clinic Date</h3>
                    <p className="text-xs text-slate-500">Close dates so patients cannot book appointments.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminBlockModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminQuickBlock} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
                    Closure Reason / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminBlockData.title}
                    onChange={(e) => setAdminBlockData({ ...adminBlockData, title: e.target.value })}
                    placeholder="e.g. Clinic Closed, Staff Training, Emergency"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={adminBlockData.startDate}
                      onChange={(e) => setAdminBlockData({ ...adminBlockData, startDate: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={adminBlockData.endDate}
                      onChange={(e) => setAdminBlockData({ ...adminBlockData, endDate: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
                    Internal Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={adminBlockData.notes}
                    onChange={(e) => setAdminBlockData({ ...adminBlockData, notes: e.target.value })}
                    placeholder="Add any specific instructions for staff or patients..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminBlockModalOpen(false)}
                    className="px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdminBlock}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-200 flex items-center space-x-1.5 transition-all disabled:opacity-50"
                  >
                    {isSubmittingAdminBlock ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Confirm & Block Date</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
      </div>
      <Footer />
    </div>
  );
}
