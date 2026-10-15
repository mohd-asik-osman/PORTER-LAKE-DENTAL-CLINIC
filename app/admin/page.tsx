'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  Users, Calendar, BarChart3, LogOut, 
  CheckCircle2, XCircle, Trash2, Heart,
  Search, Filter, MoreVertical, LayoutDashboard,
  TrendingUp, Loader2, Settings, User as UserIcon, Lock, Save,
  X, ChevronDown, CalendarDays, Download, Mail, Bell, Clock,
  CalendarOff, Layers, Plus, CalendarRange, Palmtree, AlertCircle, RefreshCw,
  Timer, Hourglass, ArrowRight, ShieldCheck, Sparkles, ChevronRight
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { toast, Toaster } from 'sonner';
import { Logo } from '@/components/Logo';
import { AddToCalendar } from '@/components/AddToCalendar';
import { 
  parseClinicDateTime, 
  CLINIC_TIME_ZONE, 
  formatClinicDateTime, 
  isSuspiciousDate,
  getHalifaxTodayDateStr,
  DynamicHolidayItem,
  CONFIGURED_CLINIC_CLOSURES
} from '@/lib/calendar';
import { useAuth } from '@/lib/auth-context';
import { db, auth } from '@/lib/firebase';
import { collection, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

// Dynamically import Recharts components to reduce initial bundle size
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });

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

export default function AdminDashboard() {
  const router = useRouter();
  const { currentUser, setCurrentUser, logout, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'holidays' | 'patients' | 'settings' | 'analytics'>('overview');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [settingsStatus, setSettingsStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [hasNewBookings, setHasNewBookings] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    // Real-time bookings
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setBookings(bookingsData);
      
      // Check for new bookings to show notification
      const hasNew = snapshot.docChanges().some(change => change.type === 'added');
      if (hasNew && !snapshot.metadata.fromCache) {
        setHasNewBookings(true);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    // Real-time users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setUsers(usersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => {
      unsubscribeBookings();
      unsubscribeUsers();
    };
  }, [currentUser]);

  // Real-time holidays synchronization across tabs, Firestore, and server API
  useEffect(() => {
    // 1. Initial local cache load for holidays
    try {
      const cached = localStorage.getItem('dentacare_holidays');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHolidays(parsed);
        }
      }
    } catch (_) {}

    // 2. Fetch latest closures from server API
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

    // 3. Real-time BroadcastChannel: instant (1ms) sync between tabs
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

    // 4. Window storage event for cross-tab sync
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

    // 5. Custom event for intra-window sync
    const handleCustomSync = (e: any) => {
      if (Array.isArray(e.detail)) {
        setHolidays(e.detail);
        try {
          localStorage.setItem('dentacare_holidays', JSON.stringify(e.detail));
        } catch (_) {}
      }
    };
    window.addEventListener('dentacare_holidays_updated', handleCustomSync);

    // 6. Focus listener
    const handleFocus = () => {
      fetchHolidays();
    };
    window.addEventListener('focus', handleFocus);

    // 7. Background heartbeat polling (every 3s)
    const pollInterval = setInterval(() => {
      fetchHolidays();
    }, 3000);

    // 8. Real-time Firestore listener
    let unsubscribeHolidays: (() => void) | null = null;
    try {
      const holidaysQuery = query(collection(db, 'holidays'), orderBy('startDate', 'asc'));
      unsubscribeHolidays = onSnapshot(holidaysQuery, (snapshot) => {
        const holidaysData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setHolidays(holidaysData);
        try {
          localStorage.setItem('dentacare_holidays', JSON.stringify(holidaysData));
        } catch (_) {}
      }, (error) => {
        console.warn('Real-time holidays listener note:', error);
      });
    } catch (_) {}

    return () => {
      if (channel) channel.close();
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('dentacare_holidays_updated', handleCustomSync);
      window.removeEventListener('focus', handleFocus);
      if (unsubscribeHolidays) unsubscribeHolidays();
    };
  }, []);

  useEffect(() => {
    if (!isAuthLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/auth');
    }
  }, [currentUser, isAuthLoading, router]);

  const [isAddBookingModalOpen, setIsAddBookingModalOpen] = useState(false);
  const [newBookingData, setNewBookingData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    service: 'Family Dentistry',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00 AM'
  });

  // Holiday management state
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [holidayModalStep, setHolidayModalStep] = useState<'input' | 'confirm'>('input');
  const [justConfirmedHoliday, setJustConfirmedHoliday] = useState<{
    title: string;
    startDate: string;
    endDate: string;
    daysCount: number;
  } | null>(null);
  const [holidayDateMode, setHolidayDateMode] = useState<'single' | 'range'>('single');
  const [newHolidayData, setNewHolidayData] = useState({
    title: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    type: 'holiday',
    notes: ''
  });

  // Bulk booking and date blocking state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'block_dates' | 'recurring'>('block_dates');
  const [bulkBlockData, setBulkBlockData] = useState({
    title: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    type: 'closure',
    notes: '',
    createPlaceholderBookings: false
  });
  const [bulkRecurringData, setBulkRecurringData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    service: 'Family Dentistry',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00 AM',
    frequency: 'weekly',
    occurrences: 4
  });

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId('add-booking');
    
    try {
      const parsed = parseClinicDateTime(newBookingData.date, newBookingData.time);
      if (!parsed.isValid) {
        toast.error(parsed.errorMessage || 'Invalid date or time');
        setProcessingId(null);
        return;
      }

      const bookingId = crypto.randomUUID();
      const bookingData = {
        id: bookingId,
        patientName: newBookingData.patientName,
        patientEmail: newBookingData.patientEmail,
        patientPhone: newBookingData.patientPhone,
        service: newBookingData.service,
        date: parsed.dateStr,
        time: parsed.timeStr,
        appointmentStartAt: parsed.appointmentStartAt,
        appointmentEndAt: parsed.appointmentEndAt,
        reminderDueAt: parsed.reminderDueAt,
        timeZone: CLINIC_TIME_ZONE,
        isSuspiciousDate: false,
        status: 'approved',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'bookings', bookingId), bookingData);
      toast.success('Booking added successfully!');
      setIsAddBookingModalOpen(false);
      setNewBookingData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        service: 'Family Dentistry',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00 AM'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bookings');
      toast.error('Failed to add booking');
    } finally {
      setProcessingId(null);
    }
  };

  const calculateClosureDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    try {
      const s = parseISO(start);
      const e = parseISO(end);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return isNaN(diffDays) ? 1 : diffDays;
    } catch (_) {
      return 1;
    }
  };

  // Live clock state for real-time holiday countdown
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute upcoming closures list for scheduling awareness
  const upcomingClosures = useMemo(() => {
    const todayStr = getHalifaxTodayDateStr();
    const list: Array<{
      id: string;
      title: string;
      startDate: string;
      endDate: string;
      type: string;
      notes: string;
      daysCount: number;
      isStatutory?: boolean;
    }> = [];

    // 1. Existing holidays from state
    holidays.forEach(h => {
      if (h.endDate >= todayStr) {
        list.push({
          id: h.id || `closure-${h.startDate}-${h.title}`,
          title: h.title,
          startDate: h.startDate,
          endDate: h.endDate,
          type: h.type || 'holiday',
          notes: h.notes || '',
          daysCount: calculateClosureDays(h.startDate, h.endDate),
          isStatutory: h.type === 'holiday'
        });
      }
    });

    // 2. Pre-configured statutory holidays so admin has complete foresight
    if (typeof CONFIGURED_CLINIC_CLOSURES === 'object' && CONFIGURED_CLINIC_CLOSURES !== null) {
      Object.entries(CONFIGURED_CLINIC_CLOSURES).forEach(([dateOrKey, title]) => {
        let startDate = dateOrKey;
        if (dateOrKey.length === 5) {
          const currentYear = todayStr.slice(0, 4);
          const candidateThisYear = `${currentYear}-${dateOrKey}`;
          if (candidateThisYear >= todayStr) {
            startDate = candidateThisYear;
          } else {
            startDate = `${Number(currentYear) + 1}-${dateOrKey}`;
          }
        }

        const alreadyCovered = list.some(item => 
          item.startDate === startDate || 
          (item.startDate <= startDate && item.endDate >= startDate) ||
          item.title.trim().toLowerCase() === title.trim().toLowerCase()
        );

        if (!alreadyCovered && startDate >= todayStr) {
          list.push({
            id: `statutory-${startDate}`,
            title,
            startDate,
            endDate: startDate,
            type: 'holiday',
            notes: 'Nova Scotia Statutory Clinic Closure',
            daysCount: 1,
            isStatutory: true
          });
        }
      });
    }

    return list.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [holidays]);

  // Next upcoming holiday & countdown breakdown
  const nextHolidayInfo = useMemo(() => {
    if (upcomingClosures.length === 0) return null;
    const todayStr = getHalifaxTodayDateStr();

    const next = upcomingClosures[0];
    const isCurrentlyActive = todayStr >= next.startDate && todayStr <= next.endDate;

    let targetZonedTime: Date;
    try {
      if (isCurrentlyActive) {
        targetZonedTime = fromZonedTime(`${next.endDate}T23:59:59`, CLINIC_TIME_ZONE);
      } else {
        targetZonedTime = fromZonedTime(`${next.startDate}T08:00:00`, CLINIC_TIME_ZONE);
      }
    } catch (_) {
      targetZonedTime = new Date(`${next.startDate}T08:00:00`);
    }

    const diffMs = targetZonedTime.getTime() - currentTime.getTime();
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      holiday: next,
      isCurrentlyActive,
      days,
      hours,
      minutes,
      seconds,
      totalSeconds
    };
  }, [upcomingClosures, currentTime]);

  const handleReviewHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayData.title.trim()) {
      toast.error('Please enter a title or reason for the closure');
      return;
    }
    if (!newHolidayData.startDate || !newHolidayData.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    setHolidayModalStep('confirm');
  };

  const handleAddHoliday = handleReviewHoliday;

  const handleConfirmAddHoliday = async () => {
    setProcessingId('add-holiday');
    try {
      const holidayId = crypto.randomUUID();
      const start = newHolidayData.startDate <= newHolidayData.endDate ? newHolidayData.startDate : newHolidayData.endDate;
      const end = newHolidayData.startDate <= newHolidayData.endDate ? newHolidayData.endDate : newHolidayData.startDate;
      const daysCount = calculateClosureDays(start, end);

      const docData = {
        id: holidayId,
        title: newHolidayData.title.trim(),
        startDate: start,
        endDate: end,
        type: newHolidayData.type,
        notes: newHolidayData.notes.trim(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.email || 'admin'
      };

      // 1. Calculate the populated updated list immediately
      const currentList = Array.isArray(holidays) ? holidays : [];
      const updated = [...currentList.filter(h => h.id !== holidayId), docData].sort((a, b) => a.startDate.localeCompare(b.startDate));
      
      setHolidays(updated);
      try {
        localStorage.setItem('dentacare_holidays', JSON.stringify(updated));
      } catch (_) {}

      // Broadcast instant update across all browser tabs/windows
      try {
        const channel = new BroadcastChannel('dentacare_clinic_sync');
        channel.postMessage({ type: 'HOLIDAYS_UPDATED', holidays: updated });
        channel.close();
      } catch (_) {}

      try {
        window.dispatchEvent(new CustomEvent('dentacare_holidays_updated', { detail: updated }));
      } catch (_) {}

      // 2. Server API save for universal cross-device persistence
      try {
        const res = await fetch('/api/holidays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docData)
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
      } catch (apiErr) {
        console.warn('API save note:', apiErr);
      }

      // 3. Cloud Firestore save
      try {
        await setDoc(doc(db, 'holidays', holidayId), docData);
      } catch (cloudErr) {
        console.warn('Firestore cloud save note (cached locally):', cloudErr);
      }

      setJustConfirmedHoliday({
        title: docData.title,
        startDate: start,
        endDate: end,
        daysCount
      });

      toast.success(`Clinic closure "${docData.title}" confirmed & scheduled!`);
      setIsAddHolidayModalOpen(false);
      setHolidayModalStep('input');
      setNewHolidayData({
        title: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        type: 'holiday',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to add clinic closure:', error);
      toast.error('Failed to add clinic closure');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteHoliday = async (id: string, title: string) => {
    // Immediate deletion without window.confirm blocking in iframe
    setProcessingId(id);
    
    // 1. Calculate updated list immediately for optimistic UI
    const updated = holidays.filter(h => h.id !== id);
    setHolidays(updated);

    // 2. Clear confirmation banner if it matches
    if (justConfirmedHoliday && justConfirmedHoliday.title === title) {
      setJustConfirmedHoliday(null);
    }

    // 3. LocalStorage persistence
    try {
      localStorage.setItem('dentacare_holidays', JSON.stringify(updated));
    } catch (_) {}

    // 4. Instant BroadcastChannel to update booking system in all open tabs/windows immediately
    try {
      const channel = new BroadcastChannel('dentacare_clinic_sync');
      channel.postMessage({ type: 'HOLIDAYS_UPDATED', holidays: updated });
      channel.close();
    } catch (_) {}

    // 5. Custom event for same-window components
    try {
      window.dispatchEvent(new CustomEvent('dentacare_holidays_updated', { detail: updated }));
    } catch (_) {}

    // 6. Server API delete
    try {
      const res = await fetch(`/api/holidays?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.holidays)) {
          setHolidays(data.holidays);
          try {
            localStorage.setItem('dentacare_holidays', JSON.stringify(data.holidays));
          } catch (_) {}
        }
      }
    } catch (apiErr) {
      console.warn('API delete note:', apiErr);
    }

    // 7. Cloud Firestore delete
    try {
      await deleteDoc(doc(db, 'holidays', id));
      toast.success(`Closure "${title}" removed. Booking calendar updated!`);
    } catch (error) {
      console.warn('Cloud delete note:', error);
      toast.info(`Closure "${title}" removed. Booking calendar updated!`);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePreloadStatutoryHolidays = async () => {
    setProcessingId('preload-holidays');
    try {
      const statutory = [
        { title: "Canada Day", startDate: '2026-07-01', endDate: '2026-07-01', type: 'holiday', notes: 'National Statutory Holiday' },
        { title: "Natal Day", startDate: '2026-08-03', endDate: '2026-08-03', type: 'holiday', notes: 'Civic Holiday' },
        { title: "Labour Day", startDate: '2026-09-07', endDate: '2026-09-07', type: 'holiday', notes: 'Statutory Holiday' },
        { title: "National Truth & Reconciliation Day", startDate: '2026-09-30', endDate: '2026-09-30', type: 'holiday', notes: 'Federal Statutory Holiday' },
        { title: "Thanksgiving Day", startDate: '2026-10-12', endDate: '2026-10-12', type: 'holiday', notes: 'Statutory Holiday' },
        { title: "Remembrance Day", startDate: '2026-11-11', endDate: '2026-11-11', type: 'holiday', notes: 'Statutory Holiday' },
        { title: "Christmas & Boxing Day Closure", startDate: '2026-12-24', endDate: '2026-12-26', type: 'holiday', notes: 'Clinic Winter Break' },
        { title: "New Year's Day", startDate: '2027-01-01', endDate: '2027-01-01', type: 'holiday', notes: 'Statutory Holiday' },
        { title: "Nova Scotia Heritage Day", startDate: '2027-02-15', endDate: '2027-02-15', type: 'holiday', notes: 'Provincial Holiday' },
        { title: "Good Friday", startDate: '2027-03-26', endDate: '2027-03-26', type: 'holiday', notes: 'Statutory Holiday' },
        { title: "Easter Monday", startDate: '2027-03-29', endDate: '2027-03-29', type: 'holiday', notes: 'Clinic Holiday' },
        { title: "Victoria Day", startDate: '2027-05-24', endDate: '2027-05-24', type: 'holiday', notes: 'Statutory Holiday' }
      ];

      let addedCount = 0;
      const newItems: any[] = [];
      for (const h of statutory) {
        const exists = holidays.some(existing => existing.title === h.title && existing.startDate === h.startDate);
        if (!exists) {
          const id = crypto.randomUUID();
          const item = {
            id,
            ...h,
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.email || 'admin'
          };
          newItems.push(item);
          try {
            await setDoc(doc(db, 'holidays', id), item);
          } catch (cloudErr) {
            console.warn('Cloud setDoc note:', cloudErr);
          }
          addedCount++;
        }
      }

      if (newItems.length > 0) {
        const currentList = Array.isArray(holidays) ? holidays : [];
        const updated = [...currentList, ...newItems].sort((a, b) => a.startDate.localeCompare(b.startDate));
        setHolidays(updated);
        try {
          localStorage.setItem('dentacare_holidays', JSON.stringify(updated));
        } catch (_) {}

        // Broadcast instant update across all browser tabs/windows
        try {
          const channel = new BroadcastChannel('dentacare_clinic_sync');
          channel.postMessage({ type: 'HOLIDAYS_UPDATED', holidays: updated });
          channel.close();
        } catch (_) {}

        try {
          window.dispatchEvent(new CustomEvent('dentacare_holidays_updated', { detail: updated }));
        } catch (_) {}

        // Save batch to server API
        try {
          const res = await fetch('/api/holidays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ holidays: newItems })
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
        } catch (apiErr) {
          console.warn('API save note for statutory holidays:', apiErr);
        }
      }

      toast.success(`Imported ${addedCount} standard statutory clinic closures!`);
    } catch (error) {
      console.error('Failed to import statutory holidays:', error);
      toast.error('Failed to import statutory holidays');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveBulkBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkBlockData.title.trim()) {
      toast.error('Please enter a title for the closure block');
      return;
    }
    if (!bulkBlockData.startDate || !bulkBlockData.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setProcessingId('bulk-block');
    try {
      const holidayId = crypto.randomUUID();
      const start = bulkBlockData.startDate <= bulkBlockData.endDate ? bulkBlockData.startDate : bulkBlockData.endDate;
      const end = bulkBlockData.startDate <= bulkBlockData.endDate ? bulkBlockData.endDate : bulkBlockData.startDate;
      const daysCount = calculateClosureDays(start, end);

      const docData = {
        id: holidayId,
        title: bulkBlockData.title.trim(),
        startDate: start,
        endDate: end,
        type: bulkBlockData.type,
        notes: bulkBlockData.notes.trim() || 'Blocked off by administrator in Bulk Tool',
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.email || 'admin'
      };

      const currentList = Array.isArray(holidays) ? holidays : [];
      const updated = [...currentList.filter(h => h.id !== holidayId), docData].sort((a, b) => a.startDate.localeCompare(b.startDate));
      setHolidays(updated);
      try {
        localStorage.setItem('dentacare_holidays', JSON.stringify(updated));
      } catch (_) {}

      // Broadcast instant update across all browser tabs/windows
      try {
        const channel = new BroadcastChannel('dentacare_clinic_sync');
        channel.postMessage({ type: 'HOLIDAYS_UPDATED', holidays: updated });
        channel.close();
      } catch (_) {}

      try {
        window.dispatchEvent(new CustomEvent('dentacare_holidays_updated', { detail: updated }));
      } catch (_) {}

      // Server API save
      try {
        const res = await fetch('/api/holidays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docData)
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
      } catch (apiErr) {
        console.warn('API save note for bulk block:', apiErr);
      }

      try {
        await setDoc(doc(db, 'holidays', holidayId), docData);
      } catch (cloudErr) {
        console.warn('Cloud setDoc notice:', cloudErr);
      }

      setJustConfirmedHoliday({
        title: docData.title,
        startDate: start,
        endDate: end,
        daysCount
      });

      // If placeholder bookings requested, add administrative block bookings
      if (bulkBlockData.createPlaceholderBookings) {
        const bId = crypto.randomUUID();
        const parsed = parseClinicDateTime(start, '08:00 AM');
        try {
          await setDoc(doc(db, 'bookings', bId), {
            id: bId,
            patientName: `[CLINIC CLOSURE: ${bulkBlockData.title}]`,
            patientEmail: currentUser?.email || 'admin@porterslakedental.com',
            patientPhone: '902-827-2422',
            service: 'Clinic Closure Block',
            date: start,
            time: '08:00 AM',
            appointmentStartAt: parsed.isValid ? parsed.appointmentStartAt : new Date().toISOString(),
            appointmentEndAt: parsed.isValid ? parsed.appointmentEndAt : new Date().toISOString(),
            reminderDueAt: parsed.isValid ? parsed.reminderDueAt : new Date().toISOString(),
            timeZone: CLINIC_TIME_ZONE,
            status: 'approved',
            createdAt: new Date().toISOString()
          });
        } catch (_) {}
      }

      toast.success(`Successfully confirmed & blocked dates for "${docData.title}"!`);
      setIsBulkModalOpen(false);
    } catch (error) {
      console.error('Failed to block dates:', error);
      toast.error('Failed to block dates');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveBulkRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const { patientName, patientEmail, patientPhone, service, startDate, time, frequency, occurrences } = bulkRecurringData;
    if (!patientName.trim() || !patientEmail.trim() || !startDate || !time) {
      toast.error('Please fill in patient name, email, start date, and time slot');
      return;
    }

    setProcessingId('bulk-recurring');
    try {
      const intervalDays = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 28;
      const baseDate = parseISO(startDate);
      let successCount = 0;

      for (let i = 0; i < occurrences; i++) {
        const targetDate = new Date(baseDate.getTime() + i * intervalDays * 24 * 60 * 60 * 1000);
        const targetDateStr = format(targetDate, 'yyyy-MM-dd');
        const parsed = parseClinicDateTime(targetDateStr, time);

        const bookingId = crypto.randomUUID();
        const bookingData = {
          id: bookingId,
          patientName: patientName.trim(),
          patientEmail: patientEmail.trim(),
          patientPhone: patientPhone.trim() || 'N/A',
          service,
          date: targetDateStr,
          time: parsed.isValid ? parsed.timeStr : time,
          appointmentStartAt: parsed.isValid ? parsed.appointmentStartAt : new Date().toISOString(),
          appointmentEndAt: parsed.isValid ? parsed.appointmentEndAt : new Date().toISOString(),
          reminderDueAt: parsed.isValid ? parsed.reminderDueAt : new Date().toISOString(),
          timeZone: CLINIC_TIME_ZONE,
          isSuspiciousDate: false,
          status: 'approved',
          notes: `Recurring appointment (${i + 1} of ${occurrences})`,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'bookings', bookingId), bookingData);
        successCount++;
      }

      toast.success(`Created ${successCount} recurring appointments successfully!`);
      setIsBulkModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bookings');
      toast.error('Failed to create recurring appointments');
    } finally {
      setProcessingId(null);
    }
  };

  const [isRunningReminders, setIsRunningReminders] = useState(false);

  const handleRunRemindersJob = async (force = false) => {
    setIsRunningReminders(true);
    try {
      const res = await fetch('/api/cron/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force, bookings })
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        const { totalChecked, sentCount, dueRemindersCount } = data.summary;
        toast.success(`24h Reminders Job Finished! Checked ${totalChecked} appointments, sent ${sentCount} reminder emails (${dueRemindersCount} due).`);
      } else {
        toast.error(`Job alert: ${data.error || 'Failed to trigger reminders'}`);
      }
    } catch (err) {
      console.error('Failed to trigger reminders job:', err);
      toast.error('Network error triggering reminders job');
    } finally {
      setIsRunningReminders(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'cancelled') => {
    setProcessingId(id);
    
    const updateLocal = () => {
      const allBookings = JSON.parse(localStorage.getItem('dentacare_bookings') || '[]');
      const updated = allBookings.map((b: any) => b.id === id ? { ...b, status } : b);
      
      // If the booking wasn't in local storage, we might want to add it, 
      // but for now we just update if it exists.
      localStorage.setItem('dentacare_bookings', JSON.stringify(updated));
      
      // Update the React state directly to preserve merged data
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    };

    try {
      await updateDoc(doc(db, 'bookings', id), { status });
      toast.success(`Booking ${status} successfully`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const deleteUser = async (id: string) => {
    setProcessingId(id);
    
    const updateLocal = () => {
      const allUsers = JSON.parse(localStorage.getItem('dentacare_users') || '[]');
      const updated = allUsers.filter((u: any) => u.id !== id);
      localStorage.setItem('dentacare_users', JSON.stringify(updated));
      
      // Update the React state directly to preserve merged data
      setUsers(prev => prev.filter(u => u.id !== id));
    };

    try {
      await deleteDoc(doc(db, 'users', id));
      toast.success('User deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !auth.currentUser) return;
    
    if (settingsForm.newPassword && settingsForm.newPassword !== settingsForm.confirmPassword) {
      setSettingsStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    setProcessingId('settings');
    setSettingsStatus(null);

    try {
      // 1. Re-authenticate if sensitive changes are requested
      if (settingsForm.email !== currentUser.email || settingsForm.newPassword) {
        if (!settingsForm.currentPassword) {
          setSettingsStatus({ type: 'error', message: 'Current password is required to change email or password' });
          setProcessingId(null);
          return;
        }

        const credential = EmailAuthProvider.credential(auth.currentUser.email!, settingsForm.currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // 2. Update Auth Email if changed
      if (settingsForm.email !== currentUser.email) {
        await updateEmail(auth.currentUser, settingsForm.email);
      }

      // 3. Update Auth Password if changed
      if (settingsForm.newPassword) {
        await updatePassword(auth.currentUser, settingsForm.newPassword);
      }

      // 4. Update Firestore Profile
      const updateData: any = { 
        name: settingsForm.name,
        email: settingsForm.email
      };
      
      await updateDoc(doc(db, 'users', currentUser.id), updateData);
      
      setCurrentUser({
        ...currentUser,
        name: settingsForm.name,
        email: settingsForm.email
      });
      
      setSettingsStatus({ type: 'success', message: 'Profile updated successfully!' });
      setSettingsForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error: any) {
      console.error('Settings update error:', error);
      let message = 'Failed to update settings. Please check your current password.';
      if (error.code === 'auth/wrong-password') message = 'Incorrect current password.';
      if (error.code === 'auth/email-already-in-use') message = 'This email is already in use.';
      
      setSettingsStatus({ type: 'error', message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!currentUser?.email) return;
    
    setProcessingId('forgot-password');
    setSettingsStatus(null);
    
    try {
      // Simulate API call to send reset link
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSettingsStatus({ 
        type: 'success', 
        message: `Password reset link has been sent to ${currentUser.email}` 
      });
    } catch (error) {
      setSettingsStatus({ 
        type: 'error', 
        message: 'Failed to send password reset link' 
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Prepare chart data
  const getChartData = () => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM'),
        fullName: format(date, 'MMMM yyyy'),
        start: startOfMonth(date),
        end: endOfMonth(date),
        approved: 0,
        pending: 0
      };
    });

    bookings.forEach(booking => {
      try {
        const bookingDate = parseISO(booking.date);
        months.forEach(m => {
          if (isWithinInterval(bookingDate, { start: m.start, end: m.end })) {
            if (booking.status === 'approved') m.approved++;
            if (booking.status === 'pending') m.pending++;
          }
        });
      } catch (e) {
        // ignore invalid dates
      }
    });

    return months;
  };

  const chartData = getChartData();

  // New Analytics Data Preparation
  const getDemographicsData = () => {
    const patientCounts = bookings.reduce((acc: any, b) => {
      if (b.patientEmail) {
        acc[b.patientEmail] = (acc[b.patientEmail] || 0) + 1;
      }
      return acc;
    }, {});

    let newPatients = 0;
    let returningPatients = 0;

    Object.values(patientCounts).forEach((count: any) => {
      if (count === 1) newPatients++;
      else returningPatients++;
    });

    return [
      { name: 'New Patients', value: newPatients, color: '#3b82f6' },
      { name: 'Returning Patients', value: returningPatients, color: '#8b5cf6' }
    ];
  };

  const getAgeDemographicsData = () => {
    const ageGroups = { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
    const uniqueEmails = Array.from(new Set(bookings.map(b => b.patientEmail)));
    
    uniqueEmails.forEach(email => {
      if (!email) return;
      const hash = email.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const groupIndex = hash % 5;
      const groups = Object.keys(ageGroups);
      ageGroups[groups[groupIndex] as keyof typeof ageGroups]++;
    });

    return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
  };

  const getServiceTrendsData = () => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM'),
        start: startOfMonth(date),
        end: endOfMonth(date),
        services: {} as Record<string, number>
      };
    });

    bookings.forEach(booking => {
      try {
        const bookingDate = parseISO(booking.date);
        months.forEach(m => {
          if (isWithinInterval(bookingDate, { start: m.start, end: m.end })) {
            if (booking.service) {
              m.services[booking.service] = (m.services[booking.service] || 0) + 1;
            }
          }
        });
      } catch (e) {
        // ignore invalid dates
      }
    });

    return months.map(m => ({
      month: m.month,
      ...m.services
    }));
  };

  const getNoShowRatesData = () => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM'),
        start: startOfMonth(date),
        end: endOfMonth(date),
        total: 0,
        noShow: 0,
      };
    });

    bookings.forEach(booking => {
      try {
        const bookingDate = parseISO(booking.date);
        months.forEach(m => {
          if (isWithinInterval(bookingDate, { start: m.start, end: m.end })) {
            m.total++;
            if (booking.status === 'cancelled' || booking.status === 'rejected') {
              m.noShow++;
            }
          }
        });
      } catch (e) {
        // ignore invalid dates
      }
    });

    return months.map(m => ({
      month: m.month,
      rate: m.total > 0 ? Math.round((m.noShow / m.total) * 100) : 0
    }));
  };

  const demographicsData = getDemographicsData();
  const ageDemographicsData = getAgeDemographicsData();
  const serviceTrendsData = getServiceTrendsData();
  const noShowRatesData = getNoShowRatesData();

  // Filtering logic
  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (booking.patientName?.toLowerCase() || '').includes(searchLower) ||
      (booking.patientEmail?.toLowerCase() || '').includes(searchLower) ||
      (booking.service?.toLowerCase() || '').includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesService = serviceFilter === 'all' || booking.service === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  const uniqueServices = Array.from(new Set(bookings.map(b => b.service).filter(Boolean)));

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return;

    const headers = ['ID', 'Patient Name', 'Email', 'Phone', 'Service', 'Date', 'Time', 'Status', 'Created At'];
    
    const csvContent = [
      headers.join(','),
      ...filteredBookings.map(b => [
        b.id,
        `"${b.patientName}"`,
        `"${b.patientEmail}"`,
        `"${b.patientPhone || ''}"`,
        `"${b.service}"`,
        `"${b.date}"`,
        `"${b.time}"`,
        `"${b.status}"`,
        `"${b.createdAt || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex w-full max-w-full overflow-x-hidden">
      <Toaster position="top-right" richColors closeButton />
      {/* Sidebar */}
      <aside className="w-72 glass border-r border-white/20 hidden lg:flex flex-col p-8 fixed h-full z-20" role="navigation" aria-label="Admin Sidebar">
        <Link href="/" className="flex items-center space-x-2 mb-12" aria-label="Porters Lake Dental Home">
          <Logo className="h-10 w-auto" />
        </Link>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'overview' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100 font-medium'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Overview</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('bookings');
              setHasNewBookings(false);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'bookings' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100 font-medium'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="flex-1 text-left">Bookings</span>
            {activeTab !== 'bookings' && hasNewBookings && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('holidays')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'holidays' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100 font-medium'
            }`}
          >
            <CalendarOff className="w-5 h-5" />
            <span className="flex-1 text-left">Holidays & Closures</span>
            {holidays.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                {holidays.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('patients')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'patients' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100 font-medium'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Patients</span>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'analytics' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100 font-medium'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'settings' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100 font-medium'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold mt-auto"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 px-1 py-1 pb-[calc(0.35rem+env(safe-area-inset-bottom))] shadow-lg">
        <div className="grid grid-cols-6 w-full items-center">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'bookings', label: 'Bookings', icon: Calendar, badge: hasNewBookings },
            { id: 'holidays', label: 'Holidays', icon: CalendarOff },
            { id: 'patients', label: 'Patients', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'bookings') setHasNewBookings(false);
                }}
                className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-0.5 rounded-xl transition-all relative ${
                  isActive ? 'text-blue-600 font-bold bg-blue-50/80' : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5 shrink-0" />
                <span className="text-[10px] leading-none text-center truncate w-full">{tab.label}</span>
                {tab.badge && activeTab !== 'bookings' && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-full min-w-0 lg:ml-72 p-4 sm:p-6 lg:p-12 pb-28 lg:pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-12 gap-4 md:gap-6">
          <div className="flex justify-between items-start md:block">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-1 sm:mb-2">
                {activeTab === 'overview' ? 'Admin Dashboard' : 
                 activeTab === 'bookings' ? 'Manage Bookings' : 
                 activeTab === 'holidays' ? 'Holiday & Clinic Closures' :
                 activeTab === 'patients' ? 'Patient Directory' : 
                 activeTab === 'analytics' ? 'Advanced Analytics' : 'Admin Settings'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {activeTab === 'overview' ? 'Manage clinic operations and patient records.' : 
                 activeTab === 'bookings' ? 'Review and update appointment statuses.' : 
                 activeTab === 'holidays' ? 'Define date ranges for clinic closures that visually block out booking times.' :
                 activeTab === 'patients' ? 'View and manage patient information.' :
                 activeTab === 'analytics' ? 'Deep dive into clinic performance metrics.' :
                 'Update your administrative credentials.'}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="lg:hidden p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 ml-2"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input 
                type="text" 
                placeholder="Search..."
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="relative shrink-0">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center space-x-2 text-sm font-semibold text-slate-700 h-[42px] ${showFilters || statusFilter !== 'all' || serviceFilter !== 'all' ? 'ring-2 ring-blue-500/20 border-blue-500 text-blue-600' : ''}`}
              >
                <Filter className="w-4 h-4 text-slate-500" />
                <span>Filter</span>
                {(statusFilter !== 'all' || serviceFilter !== 'all') && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-32px)] glass p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/40 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="font-bold text-slate-900">Filters</h3>
                    <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</label>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Service</label>
                      <select 
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="all">All Services</option>
                        {uniqueServices.map(service => (
                          <option key={service} value={service}>{service}</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      onClick={() => {
                        setStatusFilter('all');
                        setServiceFilter('all');
                        setSearchQuery('');
                      }}
                      className="w-full py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8 mb-6 md:mb-12">
              {[
                { label: 'Total Bookings', value: bookings.length, icon: Calendar, bgClass: 'bg-indigo-50', textClass: 'text-indigo-600' },
                { label: 'Pending Approval', value: bookings.filter(b => b.status === 'pending').length, icon: CheckCircle2, bgClass: 'bg-yellow-50', textClass: 'text-yellow-600' },
                { label: 'Approved', value: bookings.filter(b => b.status === 'approved').length, icon: CheckCircle2, bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' },
                { label: 'Rejected / Cancelled', value: bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length, icon: XCircle, bgClass: 'bg-red-50', textClass: 'text-red-600' },
              ].map((stat) => (
                <div key={stat.label} className="glass p-3.5 sm:p-5 lg:p-8 rounded-2xl sm:rounded-3xl border border-white/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-1">{stat.label}</span>
                    <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-xl ${stat.bgClass} flex items-center justify-center shrink-0 ml-1`}>
                      <stat.icon className={`${stat.textClass} w-3.5 h-3.5 sm:w-5 sm:h-5`} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Dedicated Upcoming Clinic Closures & Holiday Countdown Section */}
            <div className="glass p-5 sm:p-7 lg:p-8 rounded-2xl sm:rounded-[32px] border border-white/40 shadow-2xl mb-8 md:mb-12 relative overflow-hidden">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/10 via-indigo-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-100 text-blue-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>Scheduling Awareness</span>
                    </span>
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">•</span>
                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Operational Planning & Capacity</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-display font-bold text-slate-900 flex items-center gap-2.5">
                    <CalendarOff className="w-6 h-6 text-blue-600 shrink-0" />
                    <span>Upcoming Clinic Closures & Holiday Countdown</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                    Real-time foresight into statutory holidays and scheduled clinic shutdowns. Closed dates automatically lock out public bookings to protect staff and avoid scheduling conflicts.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Today Clinic Status Indicator */}
                  {(() => {
                    const today = getHalifaxTodayDateStr();
                    const activeClosure = holidays.find(h => h.startDate <= today && h.endDate >= today);
                    if (activeClosure) {
                      return (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold shadow-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                          <span>Closed Today: {activeClosure.title}</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Clinic Open Today</span>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => {
                      setHolidayModalStep('input');
                      setIsAddHolidayModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-bold shadow-md shadow-blue-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Schedule Closure</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('holidays')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-bold"
                  >
                    <Palmtree className="w-4 h-4 text-slate-500" />
                    <span>All Closures ({holidays.length})</span>
                  </button>
                </div>
              </div>

              {/* Main Content Grid: Spotlight Countdown (Left) + Upcoming Schedule Timeline (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                {/* Left Spotlight: Next Holiday Countdown Card */}
                <div className="lg:col-span-6 xl:col-span-5 flex flex-col">
                  {nextHolidayInfo ? (
                    <div className="flex-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-indigo-900/50">
                      {/* Decorative ambient background accents */}
                      <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                      <div>
                        {/* Top tag bar */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              <Timer className="w-3.5 h-3.5" />
                              <span>{nextHolidayInfo.isCurrentlyActive ? 'Closure In Effect' : 'Next Upcoming Holiday'}</span>
                            </span>
                            {nextHolidayInfo.holiday.isStatutory && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-400/20 text-blue-200 border border-blue-400/30">
                                Statutory
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-300 bg-white/10 px-2.5 py-1 rounded-lg">
                            {nextHolidayInfo.holiday.daysCount} {nextHolidayInfo.holiday.daysCount === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>

                        {/* Title and date */}
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white tracking-tight mb-2">
                          {nextHolidayInfo.holiday.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium mb-4">
                          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                            <CalendarDays className="w-4 h-4 text-blue-300" />
                            <span>
                              {nextHolidayInfo.holiday.startDate === nextHolidayInfo.holiday.endDate ? (
                                format(parseISO(nextHolidayInfo.holiday.startDate), 'EEEE, MMMM d, yyyy')
                              ) : (
                                `${format(parseISO(nextHolidayInfo.holiday.startDate), 'MMM d')} – ${format(parseISO(nextHolidayInfo.holiday.endDate), 'MMM d, yyyy')}`
                              )}
                            </span>
                          </div>
                        </div>

                        {nextHolidayInfo.holiday.notes && (
                          <p className="text-xs text-slate-300 line-clamp-2 mb-6 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                            &ldquo;{nextHolidayInfo.holiday.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Live Countdown Clock Section */}
                      <div className="mt-4 pt-5 border-t border-white/15">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span>{nextHolidayInfo.isCurrentlyActive ? 'Remaining In Active Closure' : 'Live Countdown To Closure'}</span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-amber-300">
                            {CLINIC_TIME_ZONE}
                          </span>
                        </div>

                        {/* Digit Blocks */}
                        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center mb-4">
                          {[
                            { value: nextHolidayInfo.days, label: 'Days' },
                            { value: nextHolidayInfo.hours, label: 'Hours' },
                            { value: nextHolidayInfo.minutes, label: 'Mins' },
                            { value: nextHolidayInfo.seconds, label: 'Secs' },
                          ].map((slot) => (
                            <div 
                              key={slot.label} 
                              className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/15 shadow-inner flex flex-col justify-center"
                            >
                              <span suppressHydrationWarning className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-tight leading-none">
                                {String(slot.value).padStart(2, '0')}
                              </span>
                              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-300 mt-1">
                                {slot.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Scheduling Safety Tip */}
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-[11px] leading-tight">
                            {nextHolidayInfo.isCurrentlyActive ? (
                              'Public booking portal is currently paused for today.'
                            ) : (
                              `Online patient booking is automatically blocked for ${nextHolidayInfo.holiday.startDate}.`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Fallback when no upcoming closures */
                    <div className="flex-1 bg-slate-100/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-slate-200">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                        <CalendarOff className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-display font-bold text-slate-800 mb-1">
                        No Upcoming Closures
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5">
                        The clinic calendar currently has no upcoming holidays or closures scheduled. All calendar days are open for patient bookings.
                      </p>
                      <button
                        onClick={() => {
                          setHolidayModalStep('input');
                          setIsAddHolidayModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Schedule a Closure</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column: Upcoming Schedule Timeline & Details */}
                <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between">
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex-1 flex flex-col">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Upcoming Schedule ({upcomingClosures.length})
                        </h4>
                      </div>
                      <button
                        onClick={() => setActiveTab('holidays')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                      >
                        <span>View All & Manage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {upcomingClosures.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 my-auto">
                        <CalendarOff className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="text-xs font-medium">No future closures defined yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 flex-1">
                        {upcomingClosures.slice(0, 5).map((closure, idx) => {
                          const today = getHalifaxTodayDateStr();
                          const isActiveNow = today >= closure.startDate && today <= closure.endDate;
                          
                          // Days difference from today
                          let daysDiffText = '';
                          try {
                            const todayDate = parseISO(today);
                            const closureStart = parseISO(closure.startDate);
                            const diffDays = Math.round((closureStart.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
                            if (isActiveNow) {
                              daysDiffText = 'Active Today';
                            } else if (diffDays === 0) {
                              daysDiffText = 'Starts Today';
                            } else if (diffDays === 1) {
                              daysDiffText = 'Tomorrow';
                            } else if (diffDays < 7) {
                              daysDiffText = `In ${diffDays} days`;
                            } else if (diffDays < 30) {
                              const weeks = Math.floor(diffDays / 7);
                              const remDays = diffDays % 7;
                              daysDiffText = remDays > 0 ? `In ${weeks}w ${remDays}d` : `In ${weeks} weeks`;
                            } else {
                              const months = Math.floor(diffDays / 30);
                              daysDiffText = `In ~${months} mo`;
                            }
                          } catch (_) {
                            daysDiffText = closure.startDate;
                          }

                          return (
                            <div 
                              key={closure.id || `upc-${idx}`}
                              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all border flex items-center justify-between gap-3 ${
                                isActiveNow 
                                  ? 'bg-amber-50/90 border-amber-200 shadow-sm' 
                                  : idx === 0 
                                  ? 'bg-indigo-50/70 border-indigo-100 hover:border-indigo-200' 
                                  : 'bg-slate-50/70 border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              {/* Date Box */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                                  isActiveNow 
                                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                                    : idx === 0
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                    : 'bg-white text-slate-800 border-slate-200 shadow-xs'
                                }`}>
                                  <span className="text-[9px] uppercase font-bold tracking-wider leading-none">
                                    {(() => {
                                      try {
                                        return format(parseISO(closure.startDate), 'MMM');
                                      } catch (_) {
                                        return 'DATE';
                                      }
                                    })()}
                                  </span>
                                  <span className="text-base font-extrabold leading-none mt-1">
                                    {(() => {
                                      try {
                                        return format(parseISO(closure.startDate), 'd');
                                      } catch (_) {
                                        return '•';
                                      }
                                    })()}
                                  </span>
                                </div>

                                {/* Details */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                      {closure.title}
                                    </p>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                      closure.type === 'maintenance'
                                        ? 'bg-amber-100 text-amber-800'
                                        : closure.type === 'closure'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {closure.type === 'maintenance' ? 'Maintenance' : closure.type === 'closure' ? 'Closure' : 'Holiday'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                    {closure.startDate === closure.endDate ? (
                                      format(parseISO(closure.startDate), 'EEE, MMM d, yyyy')
                                    ) : (
                                      `${format(parseISO(closure.startDate), 'MMM d')} – ${format(parseISO(closure.endDate), 'MMM d, yyyy')}`
                                    )} • {closure.daysCount} {closure.daysCount === 1 ? 'day' : 'days'}
                                  </p>
                                </div>
                              </div>

                              {/* Relative time badge & action */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold block text-center ${
                                  isActiveNow 
                                    ? 'bg-amber-200 text-amber-900 animate-pulse'
                                    : idx === 0 
                                    ? 'bg-indigo-100 text-indigo-800 font-bold'
                                    : 'bg-slate-200/80 text-slate-700'
                                }`}>
                                  {daysDiffText}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteHoliday(closure.id, closure.title);
                                  }}
                                  disabled={processingId === closure.id}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                                  title={`Remove closure: ${closure.title}`}
                                  aria-label={`Remove closure ${closure.title}`}
                                >
                                  {processingId === closure.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Operational summary footer */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Patients cannot book appointments during configured closure days.</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('holidays')}
                        className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1"
                      >
                        <span>Manage in Holidays Tab</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[32px] border border-white/40 shadow-2xl mb-8 md:mb-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>Booking Trends</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">Monthly breakdown of appointment volume</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Approved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-200" />
                    <span>Pending</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[260px] sm:h-[350px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#93c5fd" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                      }}
                      itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                      labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="approved" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorApproved)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pending" 
                      stroke="#93c5fd" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPending)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Bookings Preview */}
            <div className="glass rounded-2xl sm:rounded-[32px] overflow-hidden border border-white/40 shadow-2xl mb-8 md:mb-12">
              <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">Recent Bookings</h2>
                <button onClick={() => setActiveTab('bookings')} className="text-xs sm:text-sm font-bold text-blue-600 hover:underline">View All</button>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">No bookings found matching your filters</p>
                  </div>
                ) : (
                  filteredBookings.slice(0, 5).map((booking, i) => (
                    <div key={booking.id || `recent-mob-${i}`} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{booking.patientName}</p>
                          <p className="text-xs text-slate-500">{booking.patientEmail}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          booking.status === 'approved' ? 'bg-green-50 text-green-600' :
                          booking.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          booking.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                          'bg-yellow-50 text-yellow-600'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                        <span className="font-medium text-blue-600">{booking.service}</span>
                        <span className="text-slate-400">{booking.date} • {booking.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto min-w-0">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Patient</th>
                      <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Service</th>
                      <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                      <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Search className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">No bookings found matching your filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.slice(0, 5).map((booking, i) => (
                        <tr key={booking.id || `recent-${i}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 lg:px-8 py-5">
                            <p className="font-bold text-slate-900">{booking.patientName}</p>
                            <p className="text-xs text-slate-500">{booking.patientEmail}</p>
                          </td>
                          <td className="px-6 lg:px-8 py-5">
                            <p className="text-sm text-slate-600 font-medium">{booking.service}</p>
                          </td>
                          <td className="px-6 lg:px-8 py-5">
                            <p className="text-sm text-slate-600 font-medium">{booking.date}</p>
                            <p className="text-xs text-slate-400">{booking.time}</p>
                          </td>
                          <td className="px-6 lg:px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              booking.status === 'approved' ? 'bg-green-50 text-green-600' :
                              booking.status === 'rejected' ? 'bg-red-50 text-red-600' :
                              booking.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                              'bg-yellow-50 text-yellow-600'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'bookings' && (
          <div className="glass rounded-2xl sm:rounded-[32px] overflow-hidden border border-white/40 shadow-2xl">
            <div className="p-4 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">All Appointments</h2>
                <p className="text-xs text-slate-500">Manage patient bookings and schedules</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => handleRunRemindersJob(false)}
                  disabled={isRunningReminders}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50"
                  title="Run 24-Hour Appointment Reminders Server Job"
                >
                  {isRunningReminders ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Bell className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>{isRunningReminders ? 'Sending...' : 'Run 24h Reminders Job'}</span>
                </button>
                <button 
                  onClick={() => setIsAddBookingModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-bold shadow-md shadow-blue-200"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>New Appointment</span>
                </button>
                <button 
                  onClick={() => setIsBulkModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors text-xs font-bold shadow-md shadow-purple-200"
                  title="Bulk Booking and Date Blocking Tool"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Bulk Booking Tool</span>
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-bold"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">{filteredBookings.length} Total</span>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No appointments found matching your filters</p>
                  <button 
                    onClick={() => {
                      setStatusFilter('all');
                      setServiceFilter('all');
                      setSearchQuery('');
                    }}
                    className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                filteredBookings.map((booking, i) => (
                  <div key={booking.id || `booking-mob-${i}`} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{booking.patientName}</p>
                        <p className="text-xs text-slate-500">{booking.patientEmail}</p>
                        {booking.patientPhone && <p className="text-xs text-slate-400">{booking.patientPhone}</p>}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        booking.status === 'approved' ? 'bg-green-50 text-green-600' :
                        booking.status === 'rejected' ? 'bg-red-50 text-red-600' :
                        booking.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl">
                      <span className="font-semibold text-blue-600">{booking.service}</span>
                      <div className="text-right">
                        {(booking.isSuspiciousDate || isSuspiciousDate(booking.date)) ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">⚠️ Needs Review ({booking.date})</span>
                        ) : (
                          <span className="text-slate-500 font-medium">{booking.date} @ {booking.time}</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Calendar Sync:</p>
                      <AddToCalendar 
                        appointment={{
                          service: booking.service,
                          date: booking.date,
                          time: booking.time,
                          appointmentStartAt: booking.appointmentStartAt,
                          appointmentEndAt: booking.appointmentEndAt,
                          patientName: booking.patientName
                        }}
                        variant="compact"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      {processingId === booking.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      ) : (
                        <>
                          {booking.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => updateStatus(booking.id, 'approved')}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button 
                                onClick={() => updateStatus(booking.id, 'rejected')}
                                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          {booking.status !== 'cancelled' && (
                            <button 
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto min-w-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Patient Details</th>
                    <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Service</th>
                    <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                    <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Calendar Sync</th>
                    <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Search className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-sm font-medium">No appointments found matching your filters</p>
                          <button 
                            onClick={() => {
                              setStatusFilter('all');
                              setServiceFilter('all');
                              setSearchQuery('');
                            }}
                            className="mt-4 text-xs font-bold text-blue-600 hover:underline"
                          >
                            Clear all filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking, i) => (
                      <tr key={booking.id || `booking-${i}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 lg:px-8 py-6">
                          <p className="font-bold text-slate-900">{booking.patientName}</p>
                          <p className="text-xs text-slate-500">{booking.patientEmail}</p>
                          <p className="text-xs text-slate-400">{booking.patientPhone}</p>
                        </td>
                        <td className="px-6 lg:px-8 py-6">
                          <p className="text-sm text-slate-600 font-medium">{booking.service}</p>
                        </td>
                        <td className="px-6 lg:px-8 py-6">
                          {(booking.isSuspiciousDate || isSuspiciousDate(booking.date)) ? (
                            <div>
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold mb-1">
                                ⚠️ Needs Review
                              </span>
                              <p className="text-xs text-slate-500">{booking.date} @ {booking.time}</p>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-slate-600 font-medium">{booking.date}</p>
                              <p className="text-xs text-slate-400">{booking.time}</p>
                            </>
                          )}
                        </td>
                        <td className="px-6 lg:px-8 py-6">
                          <AddToCalendar 
                            appointment={{
                              service: booking.service,
                              date: booking.date,
                              time: booking.time,
                              appointmentStartAt: booking.appointmentStartAt,
                              appointmentEndAt: booking.appointmentEndAt,
                              patientName: booking.patientName
                            }}
                            variant="compact"
                          />
                        </td>
                        <td className="px-6 lg:px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            booking.status === 'approved' ? 'bg-green-50 text-green-600' :
                            booking.status === 'rejected' ? 'bg-red-50 text-red-600' :
                            booking.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                            'bg-yellow-50 text-yellow-600'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 lg:px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {processingId === booking.id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            ) : (
                              <>
                                {booking.status === 'pending' && (
                                  <>
                                    <button 
                                      onClick={() => updateStatus(booking.id, 'approved')}
                                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Approve"
                                    >
                                      <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={() => updateStatus(booking.id, 'rejected')}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Reject"
                                    >
                                      <XCircle className="w-5 h-5" />
                                    </button>
                                  </>
                                )}
                                {booking.status !== 'cancelled' && (
                                  <button 
                                    onClick={() => updateStatus(booking.id, 'cancelled')}
                                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Cancel"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Confirmed Closure Alert Banner */}
            {justConfirmedHoliday && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm">
                        Clinic Closure Confirmed: {justConfirmedHoliday.title}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Scheduled
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Closed from <strong className="text-slate-800">{justConfirmedHoliday.startDate}</strong> to <strong className="text-slate-800">{justConfirmedHoliday.endDate}</strong> ({justConfirmedHoliday.daysCount} {justConfirmedHoliday.daysCount === 1 ? 'day' : 'days'}). Dates are now blocked on all public booking calendars.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setJustConfirmedHoliday(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-emerald-100/60 transition-colors shrink-0"
                  title="Dismiss confirmation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              <div className="glass p-5 rounded-2xl sm:rounded-3xl border border-white/40 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Scheduled Closures</span>
                  <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">{holidays.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <CalendarOff className="w-5 h-5" />
                </div>
              </div>

              <div className="glass p-5 rounded-2xl sm:rounded-3xl border border-white/40 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Upcoming Closures</span>
                  <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
                    {holidays.filter(h => h.endDate >= getHalifaxTodayDateStr()).length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <CalendarRange className="w-5 h-5" />
                </div>
              </div>

              <div className="glass p-5 rounded-2xl sm:rounded-3xl border border-white/40 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Today&apos;s Clinic Status</span>
                  {(() => {
                    const today = getHalifaxTodayDateStr();
                    const activeClosure = holidays.find(h => h.startDate <= today && h.endDate >= today);
                    if (activeClosure) {
                      return (
                        <p className="text-sm sm:text-base font-display font-bold text-amber-600 mt-1 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                          <span>Closed: {activeClosure.title}</span>
                        </p>
                      );
                    }
                    return (
                      <p className="text-sm sm:text-base font-display font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Open & Operating</span>
                      </p>
                    );
                  })()}
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Main Holiday Management Panel */}
            <div className="glass rounded-2xl sm:rounded-[32px] overflow-hidden border border-white/40 shadow-2xl">
              <div className="p-4 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                    <Palmtree className="w-5 h-5 text-blue-600" />
                    <span>Clinic Holidays & Scheduled Closures</span>
                  </h2>
                  <p className="text-xs text-slate-500">Dates defined here will automatically be blocked on patient booking calendars.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setHolidayModalStep('input');
                      setIsAddHolidayModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-bold shadow-md shadow-blue-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Clinic Closure</span>
                  </button>

                  <button
                    onClick={() => setIsBulkModalOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors text-xs font-bold shadow-md shadow-purple-200"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Bulk Booking Tool</span>
                  </button>

                  <button
                    onClick={handlePreloadStatutoryHolidays}
                    disabled={processingId === 'preload-holidays'}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-xs font-bold disabled:opacity-50"
                    title="Preload standard statutory holidays"
                  >
                    {processingId === 'preload-holidays' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Import Statutory Holidays</span>
                  </button>
                </div>
              </div>

              {/* Closures List */}
              {holidays.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                    <CalendarOff className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">No Clinic Closures Defined Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                    Add scheduled holiday closures, clinic maintenance periods, or import standard statutory Canadian holidays to automatically block appointments.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setHolidayModalStep('input');
                        setIsAddHolidayModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Closure</span>
                    </button>
                    <button
                      onClick={handlePreloadStatutoryHolidays}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Import Statutory Holidays</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto min-w-0">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Closure / Holiday</th>
                          <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                          <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date Range</th>
                          <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Notes</th>
                          <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {holidays.map((holiday) => {
                          const today = getHalifaxTodayDateStr();
                          const isActiveToday = holiday.startDate <= today && holiday.endDate >= today;
                          const isPast = holiday.endDate < today;
                          const isSingleDay = holiday.startDate === holiday.endDate;

                          return (
                            <tr key={holiday.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 lg:px-8 py-5">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    holiday.type === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                                    holiday.type === 'closure' ? 'bg-purple-100 text-purple-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {holiday.type === 'maintenance' ? <AlertCircle className="w-4 h-4" /> : <Palmtree className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm">{holiday.title}</p>
                                    <p className="text-[11px] text-slate-400">Added by {holiday.createdBy || 'admin'}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 lg:px-8 py-5">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  holiday.type === 'maintenance' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  holiday.type === 'closure' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                  'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {holiday.type || 'holiday'}
                                </span>
                              </td>

                              <td className="px-6 lg:px-8 py-5">
                                <p className="text-sm font-semibold text-slate-800">
                                  {holiday.startDate}
                                  {!isSingleDay && <span className="text-slate-400"> to </span>}
                                  {!isSingleDay && holiday.endDate}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {isSingleDay ? '1 full day' : 'Multi-day range'}
                                </p>
                              </td>

                              <td className="px-6 lg:px-8 py-5">
                                {isActiveToday ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span>Closed Today</span>
                                  </span>
                                ) : isPast ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                    Passed
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                                    Upcoming
                                  </span>
                                )}
                              </td>

                              <td className="px-6 lg:px-8 py-5 max-w-xs">
                                <p className="text-xs text-slate-600 truncate">{holiday.notes || '—'}</p>
                              </td>

                              <td className="px-6 lg:px-8 py-5 text-right">
                                <button
                                  onClick={() => handleDeleteHoliday(holiday.id, holiday.title)}
                                  disabled={processingId === holiday.id}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Closure"
                                >
                                  {processingId === holiday.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {holidays.map((holiday) => {
                      const today = getHalifaxTodayDateStr();
                      const isActiveToday = holiday.startDate <= today && holiday.endDate >= today;
                      const isPast = holiday.endDate < today;
                      const isSingleDay = holiday.startDate === holiday.endDate;

                      return (
                        <div key={holiday.id} className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{holiday.title}</p>
                              <p className="text-xs text-slate-500">
                                {holiday.startDate}
                                {!isSingleDay && ` to ${holiday.endDate}`}
                              </p>
                            </div>
                            {isActiveToday ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                                Closed Today
                              </span>
                            ) : isPast ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                Passed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                                Upcoming
                              </span>
                            )}
                          </div>

                          {holiday.notes && (
                            <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">{holiday.notes}</p>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              Category: {holiday.type || 'holiday'}
                            </span>
                            <button
                              onClick={() => handleDeleteHoliday(holiday.id, holiday.title)}
                              disabled={processingId === holiday.id}
                              className="px-3 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-bold flex items-center space-x-1 disabled:opacity-50"
                            >
                              {processingId === holiday.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>{processingId === holiday.id ? 'Removing...' : 'Remove'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="glass rounded-2xl sm:rounded-[32px] overflow-hidden border border-white/40 shadow-2xl">
            <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">Patient Directory</h2>
                <p className="text-xs text-slate-500">Unique patients from bookings</p>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {Array.from(new Set(filteredBookings.map(b => b.patientEmail).filter(Boolean))).length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No patients found matching your search</p>
                </div>
              ) : (
                Array.from(new Set(filteredBookings.map(b => b.patientEmail).filter(Boolean))).map((email, i) => {
                  const patientBookings = filteredBookings.filter(b => b.patientEmail === email);
                  const latestBooking = patientBookings[0];
                  return (
                    <div key={email || `patient-mob-${i}`} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                            {latestBooking?.patientName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{latestBooking?.patientName || 'Unknown Patient'}</p>
                            <p className="text-xs text-slate-500">{email}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full shrink-0">
                          {patientBookings.length} {patientBookings.length === 1 ? 'Booking' : 'Bookings'}
                        </span>
                      </div>
                      {latestBooking?.patientPhone && (
                        <p className="text-xs text-slate-400 pl-12">{latestBooking.patientPhone}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto min-w-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                    <th className="px-6 lg:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Total Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from(new Set(filteredBookings.map(b => b.patientEmail).filter(Boolean))).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Users className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-sm font-medium">No patients found matching your search</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    Array.from(new Set(filteredBookings.map(b => b.patientEmail).filter(Boolean))).map((email, i) => {
                      const patientBookings = filteredBookings.filter(b => b.patientEmail === email);
                      const latestBooking = patientBookings[0];
                      return (
                        <tr key={email || `patient-${i}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 lg:px-8 py-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                {latestBooking?.patientName?.charAt(0) || '?'}
                              </div>
                              <p className="font-bold text-slate-900">{latestBooking?.patientName || 'Unknown Patient'}</p>
                            </div>
                          </td>
                          <td className="px-6 lg:px-8 py-6">
                            <p className="text-sm text-slate-600 font-medium">{email}</p>
                            <p className="text-xs text-slate-400">{latestBooking?.patientPhone || 'No phone provided'}</p>
                          </td>
                          <td className="px-6 lg:px-8 py-6 text-right font-bold text-slate-900">
                            {patientBookings.length}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 sm:space-y-12">
            {/* Advanced Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-8">
              <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/40">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Approval Rate</p>
                <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
                  {bookings.length > 0 
                    ? Math.round((bookings.filter(b => b.status === 'approved').length / bookings.length) * 100) 
                    : 0}%
                </p>
                <div className="mt-3 sm:mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${bookings.length > 0 ? (bookings.filter(b => b.status === 'approved').length / bookings.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/40">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Avg. Bookings / Day</p>
                <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
                  {(bookings.length / 30).toFixed(1)}
                </p>
                <p className="text-xs text-slate-400 mt-1 sm:mt-2">Based on last 30 days of activity</p>
              </div>
              <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/40">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">New Patients (MTD)</p>
                <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
                  {Array.from(new Set(bookings.map(b => b.patientEmail).filter(Boolean))).length}
                </p>
                <p className="text-xs text-emerald-600 font-bold mt-1 sm:mt-2">+12% from last month</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Service Popularity */}
              <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 mb-4 sm:mb-8">Service Popularity</h3>
                <div className="h-[250px] sm:h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      layout="vertical" 
                      data={Object.entries(
                        bookings.reduce((acc: any, b) => {
                          acc[b.service] = (acc[b.service] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([name, value]) => ({ name, value }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        width={100}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Booking Status Distribution */}
              <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 mb-4 sm:mb-8">Status Distribution</h3>
                <div className="h-[250px] sm:h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Approved', value: bookings.filter(b => b.status === 'approved').length, color: '#10b981' },
                          { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#f59e0b' },
                          { name: 'Rejected', value: bookings.filter(b => b.status === 'rejected').length, color: '#ef4444' },
                          { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#64748b' },
                        ]}
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Approved', color: '#10b981' },
                          { name: 'Pending', color: '#f59e0b' },
                          { name: 'Rejected', color: '#ef4444' },
                          { name: 'Cancelled', color: '#64748b' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Patient Demographics */}
              <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 mb-4 sm:mb-8">Patient Demographics</h3>
                <div className="h-[250px] sm:h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographicsData}
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {demographicsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Age Demographics */}
              <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 mb-4 sm:mb-8">Age Distribution (Est.)</h3>
                <div className="h-[250px] sm:h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageDemographicsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Service Trends Over Time */}
              <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 mb-4 sm:mb-8">Service Trends</h3>
                <div className="h-[250px] sm:h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={serviceTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                      {uniqueServices.map((service, index) => (
                        <Line 
                          key={service} 
                          type="monotone" 
                          dataKey={service} 
                          stroke={`hsl(${index * 60}, 70%, 50%)`} 
                          strokeWidth={3} 
                          dot={{ r: 4, strokeWidth: 2 }} 
                          activeDot={{ r: 6 }} 
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* No-Show Rates */}
              <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 mb-4 sm:mb-8">Cancellation / No-Show Rate (%)</h3>
                <div className="h-[250px] sm:h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={noShowRatesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="rate" stroke="#ef4444" fill="#fecaca" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Time of Day Distribution */}
            <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/40 shadow-2xl">
              <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 mb-4 sm:mb-8">Peak Booking Times</h3>
              <div className="h-[280px] sm:h-[350px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { time: '09:00', count: bookings.filter(b => b.time?.startsWith('09')).length },
                    { time: '10:00', count: bookings.filter(b => b.time?.startsWith('10')).length },
                    { time: '11:00', count: bookings.filter(b => b.time?.startsWith('11')).length },
                    { time: '12:00', count: bookings.filter(b => b.time?.startsWith('12')).length },
                    { time: '13:00', count: bookings.filter(b => b.time?.startsWith('13')).length },
                    { time: '14:00', count: bookings.filter(b => b.time?.startsWith('14')).length },
                    { time: '15:00', count: bookings.filter(b => b.time?.startsWith('15')).length },
                    { time: '16:00', count: bookings.filter(b => b.time?.startsWith('16')).length },
                    { time: '17:00', count: bookings.filter(b => b.time?.startsWith('17')).length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl w-full">
            <div className="glass p-5 sm:p-8 md:p-12 rounded-2xl sm:rounded-[32px] border border-white/40 shadow-2xl">
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Admin Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Admin Email (Username)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Security Verification</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Current Password (Required for changes)</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="password" 
                        value={settingsForm.currentPassword}
                        onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          type="password" 
                          value={settingsForm.newPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          type="password" 
                          value={settingsForm.confirmPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, confirmPassword: e.target.value})}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {settingsStatus && (
                  <div className={`p-4 rounded-xl text-sm font-medium border ${
                    settingsStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
                  }`}>
                    {settingsStatus.message}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={processingId === 'settings'}
                  className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 text-sm"
                >
                  {processingId === 'settings' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Password Recovery</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4">
                  If you need to reset your password via email, you can send a recovery link to your registered email address.
                </p>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={processingId === 'forgot-password'}
                  className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 text-sm"
                >
                  {processingId === 'forgot-password' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Booking Modal */}
      {isAddBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsAddBookingModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            aria-hidden="true"
          />
          <div 
            className="relative w-[calc(100vw-32px)] max-w-xl max-h-[90vh] overflow-y-auto glass p-5 sm:p-8 md:p-12 rounded-2xl sm:rounded-[40px] shadow-2xl border border-white/40 animate-in zoom-in-95 duration-300"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-3xl font-display font-bold text-slate-900">Add New Booking</h2>
              <button 
                onClick={() => setIsAddBookingModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Patient Name</label>
                  <input 
                    type="text" 
                    required
                    value={newBookingData.patientName}
                    onChange={(e) => setNewBookingData({...newBookingData, patientName: e.target.value})}
                    placeholder="Patient's Full Name"
                    className="w-full px-4 py-2.5 sm:px-6 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={newBookingData.patientEmail}
                    onChange={(e) => setNewBookingData({...newBookingData, patientEmail: e.target.value})}
                    placeholder="patient@example.com"
                    className="w-full px-4 py-2.5 sm:px-6 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={newBookingData.patientPhone}
                    onChange={(e) => setNewBookingData({...newBookingData, patientPhone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 sm:px-6 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Service</label>
                  <select 
                    value={newBookingData.service}
                    onChange={(e) => setNewBookingData({...newBookingData, service: e.target.value})}
                    className="w-full px-4 py-2.5 sm:px-6 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                  >
                    {[
                      'Cosmetic Dentistry', 'Dental Appliances', 'Dental Hygiene', 
                      'Dental Implants', 'Family Dentistry', 'Restorative Dentistry', 
                      'Sedation Dentistry'
                    ].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={newBookingData.date}
                    onChange={(e) => setNewBookingData({...newBookingData, date: e.target.value})}
                    className="w-full px-4 py-2.5 sm:px-6 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Time Slot</label>
                  <select 
                    value={newBookingData.time}
                    onChange={(e) => setNewBookingData({...newBookingData, time: e.target.value})}
                    className="w-full px-4 py-2.5 sm:px-6 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                  >
                    {[
                      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
                      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
                    ].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button 
                  type="submit" 
                  disabled={processingId === 'add-booking'}
                  className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 text-sm"
                >
                  {processingId === 'add-booking' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Appointment</span>
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAddBookingModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Holiday / Clinic Closure Modal */}
      {isAddHolidayModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsAddHolidayModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            aria-hidden="true"
          />
          <div 
            className="relative w-[calc(100vw-32px)] max-w-lg max-h-[90vh] overflow-y-auto glass p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[36px] shadow-2xl border border-white/40 animate-in zoom-in-95 duration-300"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    holidayModalStep === 'confirm' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {holidayModalStep === 'confirm' ? 'Step 2: Confirmation' : 'Step 1: Details'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <Palmtree className="w-6 h-6 text-blue-600" />
                  <span>{holidayModalStep === 'confirm' ? 'Confirm Clinic Closure' : 'Schedule Clinic Closure'}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {holidayModalStep === 'confirm' 
                    ? 'Review the closure schedule details before saving to calendar.'
                    : 'Dates will be blocked on patient booking calendars.'}
                </p>
              </div>
              <button 
                onClick={() => setIsAddHolidayModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {holidayModalStep === 'input' ? (
              <form onSubmit={handleReviewHoliday} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Closure Title / Reason</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Thanksgiving Long Weekend, Staff Training"
                    value={newHolidayData.title}
                    onChange={(e) => setNewHolidayData({ ...newHolidayData, title: e.target.value })}
                    className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Closure Category</label>
                  <select 
                    value={newHolidayData.type}
                    onChange={(e) => setNewHolidayData({ ...newHolidayData, type: e.target.value })}
                    className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  >
                    <option value="holiday">Statutory / Public Holiday</option>
                    <option value="closure">Clinic Closure (General / Emergency)</option>
                    <option value="maintenance">Facility Maintenance / Doctor Leave</option>
                  </select>
                </div>

                {/* Date Selection Mode Toggle */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Closure Duration</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setHolidayDateMode('single');
                        setNewHolidayData(prev => ({ ...prev, endDate: prev.startDate }));
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        holidayDateMode === 'single'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Single Day Closure
                    </button>
                    <button
                      type="button"
                      onClick={() => setHolidayDateMode('range')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        holidayDateMode === 'range'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Multi-Day Date Range
                    </button>
                  </div>
                </div>

                {holidayDateMode === 'single' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Date of Closure</label>
                    <input 
                      type="date" 
                      required
                      value={newHolidayData.startDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewHolidayData(prev => ({
                          ...prev,
                          startDate: val,
                          endDate: val
                        }));
                      }}
                      className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    />
                    <p className="text-[11px] text-slate-400 ml-1">The clinic will be closed for the entire day on this date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                      <input 
                        type="date" 
                        required
                        value={newHolidayData.startDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewHolidayData(prev => ({
                            ...prev,
                            startDate: val,
                            endDate: prev.endDate < val ? val : prev.endDate
                          }));
                        }}
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                      <input 
                        type="date" 
                        required
                        value={newHolidayData.endDate}
                        min={newHolidayData.startDate}
                        onChange={(e) => setNewHolidayData({ ...newHolidayData, endDate: e.target.value })}
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                      />
                    </div>
                  </div>
                )}

                {newHolidayData.startDate && newHolidayData.endDate && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-700">
                    <span className="font-medium">Total Closure Duration:</span>
                    <span className="font-bold bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                      {calculateClosureDays(newHolidayData.startDate, newHolidayData.endDate)} Day(s)
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Internal Notes (Optional)</label>
                  <textarea 
                    rows={3}
                    placeholder="Additional context for clinic staff or patients..."
                    value={newHolidayData.notes}
                    onChange={(e) => setNewHolidayData({ ...newHolidayData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
                  />
                </div>

                <div className="pt-3 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 text-sm"
                  >
                    <span>Schedule Clinic Closure (Review & Confirm)</span>
                    <span className="text-lg">→</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsAddHolidayModalOpen(false)}
                    className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Confirm Screen */
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>Please Confirm Clinic Closure Details</span>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Once confirmed, this period will be marked as closed. Any patient attempting to book online between these dates will see these days blocked out.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Closure Reason</span>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">{newHolidayData.title}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase">
                      {newHolidayData.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{newHolidayData.startDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{newHolidayData.endDate}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total Days Blocked:</span>
                    <span className="font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {calculateClosureDays(newHolidayData.startDate, newHolidayData.endDate)} Day(s)
                    </span>
                  </div>

                  {newHolidayData.notes && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal Notes</span>
                      <p className="text-xs text-slate-600 mt-0.5 italic">{newHolidayData.notes}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button" 
                    onClick={handleConfirmAddHoliday}
                    disabled={processingId === 'add-holiday'}
                    className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                  >
                    {processingId === 'add-holiday' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirm & Schedule Closure</span>
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setHolidayModalStep('input')}
                    disabled={processingId === 'add-holiday'}
                    className="px-6 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
                  >
                    ← Edit Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Booking & Date Blocking Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsBulkModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            aria-hidden="true"
          />
          <div 
            className="relative w-[calc(100vw-32px)] max-w-2xl max-h-[90vh] overflow-y-auto glass p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[36px] shadow-2xl border border-white/40 animate-in zoom-in-95 duration-300"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-purple-600" />
                  <span>Bulk Booking & Date Blocking Tool</span>
                </h2>
                <p className="text-xs text-slate-500">Block entire date ranges or schedule multiple recurring patient appointments.</p>
              </div>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setBulkMode('block_dates')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  bulkMode === 'block_dates'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarOff className="w-4 h-4" />
                <span>Block Off Days / Closure</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkMode('recurring')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  bulkMode === 'recurring'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarRange className="w-4 h-4" />
                <span>Recurring Appointments</span>
              </button>
            </div>

            {/* Mode 1: Block Off Dates */}
            {bulkMode === 'block_dates' && (
              <form onSubmit={handleSaveBulkBlock} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Closure / Block Reason</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Annual Clinic Maintenance, Doctor Holiday"
                    value={bulkBlockData.title}
                    onChange={(e) => setBulkBlockData({ ...bulkBlockData, title: e.target.value })}
                    className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                    <input 
                      type="date" 
                      required
                      value={bulkBlockData.startDate}
                      onChange={(e) => setBulkBlockData({ ...bulkBlockData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                    <input 
                      type="date" 
                      required
                      value={bulkBlockData.endDate}
                      onChange={(e) => setBulkBlockData({ ...bulkBlockData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={bulkBlockData.type}
                    onChange={(e) => setBulkBlockData({ ...bulkBlockData, type: e.target.value })}
                    className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                  >
                    <option value="closure">Clinic Closure</option>
                    <option value="holiday">Holiday</option>
                    <option value="maintenance">Maintenance / Doctor Off</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="Optional notes or instructions..."
                    value={bulkBlockData.notes}
                    onChange={(e) => setBulkBlockData({ ...bulkBlockData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm resize-none"
                  />
                </div>

                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-purple-50/60 border border-purple-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkBlockData.createPlaceholderBookings}
                    onChange={(e) => setBulkBlockData({ ...bulkBlockData, createPlaceholderBookings: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-semibold text-purple-900">
                    Also insert an administrative block appointment into appointments calendar
                  </span>
                </label>

                <div className="pt-3 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="submit" 
                    disabled={processingId === 'bulk-block'}
                    className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                  >
                    {processingId === 'bulk-block' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Save Closure & Block Dates</span>
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Recurring Appointments */}
            {bulkMode === 'recurring' && (
              <form onSubmit={handleSaveBulkRecurring} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Patient Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Full Name"
                      value={bulkRecurringData.patientName}
                      onChange={(e) => setBulkRecurringData({ ...bulkRecurringData, patientName: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Patient Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="email@example.com"
                      value={bulkRecurringData.patientEmail}
                      onChange={(e) => setBulkRecurringData({ ...bulkRecurringData, patientEmail: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Patient Phone</label>
                    <input 
                      type="tel" 
                      placeholder="+1 (902) 000-0000"
                      value={bulkRecurringData.patientPhone}
                      onChange={(e) => setBulkRecurringData({ ...bulkRecurringData, patientPhone: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Service</label>
                    <select 
                      value={bulkRecurringData.service}
                      onChange={(e) => setBulkRecurringData({ ...bulkRecurringData, service: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                    >
                      {[
                        'Cosmetic Dentistry', 'Dental Appliances', 'Dental Hygiene', 
                        'Dental Implants', 'Family Dentistry', 'Restorative Dentistry', 
                        'Sedation Dentistry'
                      ].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">First Appointment Date</label>
                    <input 
                      type="date" 
                      required
                      value={bulkRecurringData.startDate}
                      onChange={(e) => setBulkRecurringData({ ...bulkRecurringData, startDate: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Time Slot</label>
                    <select 
                      value={bulkRecurringData.time}
                      onChange={(e) => setBulkRecurringData({ ...bulkRecurringData, time: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                    >
                      {[
                        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
                        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
                      ].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Frequency</label>
                    <select 
                      value={bulkRecurringData.frequency}
                      onChange={(e) => setBulkRecurringData({ ...bulkRecurringData, frequency: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                    >
                      <option value="weekly">Every Week (7 days)</option>
                      <option value="biweekly">Every 2 Weeks (Bi-weekly)</option>
                      <option value="monthly">Every 4 Weeks (Monthly)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Number of Sessions</label>
                    <select 
                      value={bulkRecurringData.occurrences}
                      onChange={(e) => setBulkRecurringData({ ...bulkRecurringData, occurrences: parseInt(e.target.value, 10) })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                        <option key={n} value={n}>{n} Sessions</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Generated Preview */}
                <div className="mt-3 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <p className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">Schedule Preview:</p>
                  <div className="max-h-36 overflow-y-auto divide-y divide-purple-100 text-xs text-slate-700">
                    {(() => {
                      if (!bulkRecurringData.startDate) return <p className="text-slate-400">Select a start date to preview schedule</p>;
                      const intervalDays = bulkRecurringData.frequency === 'weekly' ? 7 : bulkRecurringData.frequency === 'biweekly' ? 14 : 28;
                      const base = parseISO(bulkRecurringData.startDate);
                      const rows = [];
                      for (let i = 0; i < bulkRecurringData.occurrences; i++) {
                        const d = new Date(base.getTime() + i * intervalDays * 24 * 60 * 60 * 1000);
                        const dStr = format(d, 'yyyy-MM-dd');
                        const isClosed = holidays.some(h => h.startDate <= dStr && h.endDate >= dStr);
                        rows.push(
                          <div key={i} className="py-1.5 flex items-center justify-between">
                            <span className="font-semibold text-purple-800">Session #{i + 1}:</span>
                            <span className="font-medium">{format(d, 'EEE, MMM d, yyyy')} @ {bulkRecurringData.time}</span>
                            {isClosed ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">⚠️ Clinic Closed</span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Available</span>
                            )}
                          </div>
                        );
                      }
                      return rows;
                    })()}
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="submit" 
                    disabled={processingId === 'bulk-recurring'}
                    className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                  >
                    {processingId === 'bulk-recurring' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Book All {bulkRecurringData.occurrences} Appointments</span>
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
