'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, 
  ChevronRight, Heart, CheckCircle2, Loader2,
  Stethoscope, Sparkles, X, User
} from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isBefore } from 'date-fns';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AddToCalendar } from '@/components/AddToCalendar';
import { db, auth } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { parseClinicDateTime, CLINIC_TIME_ZONE, formatClinicDateTime } from '@/lib/calendar';

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

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (stepHeadingRef.current) {
      stepHeadingRef.current.focus();
    }
  }, [step]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

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
    
    try {
      if (!selectedDate || !selectedTime) {
        throw new Error('Please select a valid date and time.');
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const parsed = parseClinicDateTime(dateStr, selectedTime);

      if (!parsed.isValid) {
        alert(parsed.errorMessage || 'Invalid date or time selected.');
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

      setShowModal(true);
    } catch (error) {
      console.error('Error saving booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedService('');
    setSelectedDate(null);
    setSelectedTime('');
    setPatientDetails({ name: '', email: '', phone: '' });
    setShowModal(false);
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
                    <span className="font-bold text-slate-900 text-sm sm:text-base">{format(currentMonth, 'MMMM yyyy')}</span>
                    <div className="flex space-x-1 sm:space-x-2">
                      <button 
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                        className="p-2 hover:bg-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <button 
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                        className="p-2 hover:bg-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {days.map((day, i) => {
                      const isPast = isBefore(day, startOfToday());
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      return (
                        <button
                          key={i}
                          disabled={isPast}
                          onClick={() => setSelectedDate(day)}
                          aria-label={`Select ${format(day, 'MMMM do, yyyy')}`}
                          aria-pressed={!!isSelected}
                          className={`min-h-[40px] sm:min-h-[44px] aspect-square rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500 outline-none ${
                            isPast ? 'text-slate-200 cursor-not-allowed' :
                            isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' :
                            isToday(day) ? 'bg-blue-50 text-blue-600 border border-blue-100 font-bold' :
                            'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 sm:mb-6">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Available Slots</span>
                    </h3>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg inline-block w-fit">
                      All appointment times are in Halifax time
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {TIME_SLOTS.map(time => (
                      <button
                        key={time}
                        onClick={() => {
                          setSelectedTime(time);
                          setStep(3);
                        }}
                        aria-label={`Select time ${time}`}
                        aria-pressed={selectedTime === time}
                        className={`min-h-[44px] py-3 px-3 sm:px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all focus:ring-2 focus:ring-blue-500 outline-none flex items-center justify-center ${
                          selectedTime === time 
                            ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' 
                            : 'bg-white border-slate-100 hover:border-blue-200 text-slate-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
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

              <dl className="bg-slate-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-8 sm:mb-10 space-y-4 sm:space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 sm:pb-4 gap-2 text-sm sm:text-base">
                  <dt className="text-slate-500 font-medium shrink-0">Patient</dt>
                  <dd className="font-bold text-slate-900 text-right truncate">{patientDetails.name}</dd>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 sm:pb-4 gap-2 text-sm sm:text-base">
                  <dt className="text-slate-500 font-medium shrink-0">Service</dt>
                  <dd className="font-bold text-slate-900 text-right truncate">{selectedService}</dd>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 sm:pb-4 gap-2 text-sm sm:text-base">
                  <dt className="text-slate-500 font-medium shrink-0">Date</dt>
                  <dd className="font-bold text-slate-900 text-right">{selectedDate ? format(selectedDate, 'MMMM do, yyyy') : ''}</dd>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <dt className="text-slate-500 font-medium shrink-0">Time</dt>
                  <dd className="font-bold text-slate-900 text-right">{selectedTime}</dd>
                </div>
              </dl>

              <button 
                onClick={handleBooking}
                disabled={isLoading}
                aria-busy={isLoading}
                className="w-full min-h-[48px] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 focus:ring-4 focus:ring-blue-500/20 outline-none text-sm sm:text-base"
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
        {showModal && (
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
                  <span className="font-bold text-slate-900">{selectedService}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-900">{selectedDate ? format(selectedDate, 'MMMM do, yyyy') : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time:</span>
                  <span className="font-bold text-slate-900">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-900">{patientDetails.name}</span>
                </div>
              </div>

              {/* Calendar Integration */}
              <AddToCalendar 
                appointment={{
                  service: selectedService,
                  date: selectedDate || new Date(),
                  time: selectedTime,
                  patientName: patientDetails.name
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
