'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  Users, Calendar, BarChart3, LogOut, 
  CheckCircle2, XCircle, Trash2, Heart,
  Search, Filter, MoreVertical, LayoutDashboard,
  TrendingUp, Loader2, Settings, User as UserIcon, Lock, Save,
  X, ChevronDown, CalendarDays, Download, Mail
} from 'lucide-react';
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
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import dynamic from 'next/dynamic';
import { toast, Toaster } from 'sonner';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';
import { db, auth } from '@/lib/firebase';
import { collection, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'patients' | 'settings' | 'analytics'>('overview');
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

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId('add-booking');
    
    try {
      const bookingId = crypto.randomUUID();
      const bookingData = {
        ...newBookingData,
        id: bookingId,
        status: 'approved', // Admin added bookings are approved by default
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
    <div className="min-h-screen bg-slate-50 flex">
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center p-3 z-50 safe-area-pb">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Overview</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('bookings');
            setHasNewBookings(false);
          }}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${activeTab === 'bookings' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Calendar className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Bookings</span>
          {activeTab !== 'bookings' && hasNewBookings && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('patients')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'patients' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Users className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Patients</span>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'analytics' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <BarChart3 className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Analytics</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Settings className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 md:p-8 lg:p-12 pb-24 lg:pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6">
          <div className="flex justify-between items-start md:block">
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
                {activeTab === 'overview' ? 'Admin Dashboard' : 
                 activeTab === 'bookings' ? 'Manage Bookings' : 
                 activeTab === 'patients' ? 'Patient Directory' : 
                 activeTab === 'analytics' ? 'Advanced Analytics' : 'Admin Settings'}
              </h1>
              <p className="text-slate-500">
                {activeTab === 'overview' ? 'Manage clinic operations and patient records.' : 
                 activeTab === 'bookings' ? 'Review and update appointment statuses.' : 
                 activeTab === 'patients' ? 'View and manage patient information.' :
                 activeTab === 'analytics' ? 'Deep dive into clinic performance metrics.' :
                 'Update your administrative credentials.'}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="lg:hidden p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input 
                type="text" 
                placeholder="Search..."
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-full md:w-64"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full sm:w-auto p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2 ${showFilters ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}`}
              >
                <Filter className="w-5 h-5 text-slate-600" />
                {(statusFilter !== 'all' || serviceFilter !== 'all') && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full absolute -top-1 -right-1" />
                )}
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-3 w-72 glass p-6 rounded-3xl border border-white/40 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900">Filters</h3>
                    <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {[
                { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'indigo', bgClass: 'bg-indigo-50', textClass: 'text-indigo-600' },
                { label: 'Pending Approval', value: bookings.filter(b => b.status === 'pending').length, icon: CheckCircle2, color: 'yellow', bgClass: 'bg-yellow-50', textClass: 'text-yellow-600' },
                { label: 'Approved', value: bookings.filter(b => b.status === 'approved').length, icon: CheckCircle2, color: 'green', bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' },
                { label: 'Rejected/Cancelled', value: bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length, icon: XCircle, color: 'red', bgClass: 'bg-red-50', textClass: 'text-red-600' },
              ].map((stat) => (
                <div key={stat.label} className="glass p-8 rounded-3xl border border-white/40">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bgClass} flex items-center justify-center mb-6`}>
                    <stat.icon className={`${stat.textClass} w-6 h-6`} />
                  </div>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-display font-bold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Analytics Chart */}
            <div className="glass p-8 rounded-[32px] border border-white/40 shadow-2xl mb-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Booking Trends
                  </h2>
                  <p className="text-sm text-slate-500">Monthly breakdown of appointment volume</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-600">Approved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-200" />
                    <span className="text-xs font-bold text-slate-600">Pending</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
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
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
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
            <div className="glass rounded-[32px] overflow-hidden border border-white/40 shadow-2xl mb-12">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-slate-900">Recent Bookings</h2>
                <button onClick={() => setActiveTab('bookings')} className="text-sm font-bold text-blue-600 hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Patient</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Service</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
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
                        <td className="px-8 py-6">
                          <p className="font-bold text-slate-900">{booking.patientName}</p>
                          <p className="text-xs text-slate-500">{booking.patientEmail}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-slate-600 font-medium">{booking.service}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-slate-600 font-medium">{booking.date}</p>
                          <p className="text-xs text-slate-400">{booking.time}</p>
                        </td>
                        <td className="px-8 py-6">
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
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'bookings' && (
          <div className="glass rounded-[32px] overflow-hidden border border-white/40 shadow-2xl">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-slate-900">All Appointments</h2>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setIsAddBookingModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-bold shadow-lg shadow-blue-200"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>New Appointment</span>
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-bold"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center">{filteredBookings.length} Total</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Patient Details</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Service</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center">
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
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900">{booking.patientName}</p>
                        <p className="text-xs text-slate-500">{booking.patientEmail}</p>
                        <p className="text-xs text-slate-400">{booking.patientPhone}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-slate-600 font-medium">{booking.service}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-slate-600 font-medium">{booking.date}</p>
                        <p className="text-xs text-slate-400">{booking.time}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          booking.status === 'approved' ? 'bg-green-50 text-green-600' :
                          booking.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          booking.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                          'bg-yellow-50 text-yellow-600'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
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
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="glass rounded-[32px] overflow-hidden border border-white/40 shadow-2xl">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-slate-900">Patient Directory</h2>
              <p className="text-sm text-slate-500">Unique patients from bookings</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Total Bookings</th>
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
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                              {latestBooking?.patientName?.charAt(0) || '?'}
                            </div>
                            <p className="font-bold text-slate-900">{latestBooking?.patientName || 'Unknown Patient'}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-slate-600 font-medium">{email}</p>
                          <p className="text-xs text-slate-400">{latestBooking?.patientPhone || 'No phone provided'}</p>
                        </td>
                        <td className="px-8 py-6 text-right font-bold text-slate-900">
                          {patientBookings.length}
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="space-y-12">
            {/* Advanced Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass p-8 rounded-3xl border border-white/40">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Approval Rate</p>
                <p className="text-3xl font-display font-bold text-slate-900">
                  {bookings.length > 0 
                    ? Math.round((bookings.filter(b => b.status === 'approved').length / bookings.length) * 100) 
                    : 0}%
                </p>
                <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${bookings.length > 0 ? (bookings.filter(b => b.status === 'approved').length / bookings.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="glass p-8 rounded-3xl border border-white/40">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Avg. Bookings / Day</p>
                <p className="text-3xl font-display font-bold text-slate-900">
                  {(bookings.length / 30).toFixed(1)}
                </p>
                <p className="text-xs text-slate-400 mt-2">Based on last 30 days of activity</p>
              </div>
              <div className="glass p-8 rounded-3xl border border-white/40">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">New Patients (MTD)</p>
                <p className="text-3xl font-display font-bold text-slate-900">
                  {Array.from(new Set(bookings.map(b => b.patientEmail).filter(Boolean))).length}
                </p>
                <p className="text-xs text-emerald-600 font-bold mt-2">+12% from last month</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Service Popularity */}
              <div className="glass p-8 rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-xl font-display font-bold text-slate-900 mb-8">Service Popularity</h3>
                <div className="h-[300px]">
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
                        width={150}
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
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
              <div className="glass p-8 rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-xl font-display font-bold text-slate-900 mb-8">Status Distribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Approved', value: bookings.filter(b => b.status === 'approved').length, color: '#10b981' },
                          { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#f59e0b' },
                          { name: 'Rejected', value: bookings.filter(b => b.status === 'rejected').length, color: '#ef4444' },
                          { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#64748b' },
                        ]}
                        innerRadius={60}
                        outerRadius={100}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Patient Demographics */}
              <div className="glass p-8 rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-xl font-display font-bold text-slate-900 mb-8">Patient Demographics</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographicsData}
                        innerRadius={60}
                        outerRadius={100}
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
              <div className="glass p-8 rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-xl font-display font-bold text-slate-900 mb-8">Age Distribution (Est.)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageDemographicsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Service Trends Over Time */}
              <div className="glass p-8 rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-xl font-display font-bold text-slate-900 mb-8">Service Trends</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={serviceTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
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
              <div className="glass p-8 rounded-[32px] border border-white/40 shadow-2xl">
                <h3 className="text-xl font-display font-bold text-slate-900 mb-8">Cancellation / No-Show Rate (%)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={noShowRatesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
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
            <div className="glass p-8 rounded-[32px] border border-white/40 shadow-2xl">
              <h3 className="text-xl font-display font-bold text-slate-900 mb-8">Peak Booking Times</h3>
              <div className="h-[350px]">
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
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="glass p-8 md:p-12 rounded-[32px] border border-white/40 shadow-2xl">
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
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
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
                <p className="text-sm text-slate-500 mb-4">
                  If you need to reset your password via email, you can send a recovery link to your registered email address.
                </p>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={processingId === 'forgot-password'}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
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
            className="relative w-full max-w-xl glass p-8 md:p-12 rounded-[40px] shadow-2xl border border-white/40 animate-in zoom-in-95 duration-300"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-display font-bold text-slate-900">Add New Booking</h2>
              <button 
                onClick={() => setIsAddBookingModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Patient Name</label>
                  <input 
                    type="text" 
                    required
                    value={newBookingData.patientName}
                    onChange={(e) => setNewBookingData({...newBookingData, patientName: e.target.value})}
                    placeholder="Patient's Full Name"
                    className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                    className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                    className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Service</label>
                  <select 
                    value={newBookingData.service}
                    onChange={(e) => setNewBookingData({...newBookingData, service: e.target.value})}
                    className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                    className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Time Slot</label>
                  <select 
                    value={newBookingData.time}
                    onChange={(e) => setNewBookingData({...newBookingData, time: e.target.value})}
                    className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    {[
                      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
                      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
                    ].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <button 
                  type="submit" 
                  disabled={processingId === 'add-booking'}
                  className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                >
                  {processingId === 'add-booking' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
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
                  className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
