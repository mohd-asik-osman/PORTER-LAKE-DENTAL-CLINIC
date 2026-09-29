'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, 
  ChevronRight, Heart, CheckCircle2, Loader2,
  Stethoscope, Sparkles, X, User
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AddToCalendar } from '@/components/AddToCalendar';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  parseClinicDateTime, 
  CLINIC_TIME_ZONE, 
  formatClinicDateTime,
  getCalendarMonthData,
  getAvailableSlotsForDate,
  getClinicHoursForDate,
  isSlotCompatibleWithDate,
  getHalifaxTodayDateStr,
  isPastDateInHalifax
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

  // Dynamic calendar calculation with leading empty cells and leap year support
  const calendarData = useMemo(() => {
    return getCalendarMonthData({ year: currentYear, monthIndex: currentMonthIndex });
  }, [currentYear, currentMonthIndex]);

  // Slots for the selected date
  const availableSlots = useMemo(() => {
    if (!selectedDateStr) return [];
    return getAvailableSlotsForDate(selectedDateStr);
  }, [selectedDateStr]);

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

  // Date selection with automatic slot compatibility check
  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setSubmitError(null);

    // Clear incompatible selected time when the date changes
    if (selectedTime && !isSlotCompatibleWithDate(dateStr, selectedTime)) {
      setSelectedTime('');
    }
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
                      const isDisabled = day.isPast || day.isWeekend || day.isClosed;
                      
                      let statusNote = '';
                      if (day.isClosed) statusNote = `Closed (${day.closureReason || 'Holiday'})`;
                      else if (day.isWeekend) statusNote = 'Closed (Weekend)';
                      else if (day.isPast) statusNote = 'Past date';

                      return (
                        <button
                          key={day.dateStr}
                          disabled={isDisabled}
                          onClick={() => handleSelectDate(day.dateStr)}
                          title={statusNote || undefined}
                          aria-label={`${day.dateStr}${statusNote ? ` - ${statusNote}` : ''}`}
                          aria-pressed={isSelected}
                          className={`min-h-[40px] sm:min-h-[44px] aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-xs sm:text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500 outline-none relative ${
                            isDisabled 
                              ? 'text-slate-300 bg-slate-50/40 cursor-not-allowed' 
                              : isSelected 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold scale-105 z-10' 
                                : day.isToday 
                                  ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold hover:bg-blue-100/70' 
                                  : 'hover:bg-slate-100 text-slate-700 font-semibold'
                          }`}
                        >
                          <span>{day.dayNumber}</span>
                          {day.isToday && !isSelected && (
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
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <span>Closed / Past</span>
                    </span>
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 sm:mb-6">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Available Slots</span>
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
      </>
      </div>
      <Footer />
    </div>
  );
}
