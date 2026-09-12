'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Heart, Mail, Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Logo } from '@/components/Logo';
import { useAuth, UserProfile } from '@/lib/auth-context';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AuthPage() {
  const router = useRouter();
  const { setCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResetPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email above to reset your password.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setSuccess('A password reset link has been sent to your email.');
    } catch (err: any) {
      console.error('Reset Error:', err);
      setError('Failed to send reset email. Make sure the email is registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const isAdminEmail = formData.email === 'admin@porterslakedental.com' || formData.email === 'asikosman010@gmail.com';

    try {
      // 1. Attempt Sign In
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Fetch or Create Profile
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        if (userDoc.data()?.role === 'admin') {
          console.log('Admin login successful');
          router.push('/admin');
        } else {
          setError('Access denied. This area is reserved for administrators.');
        }
      } else if (isAdminEmail) {
        // Create profile if it doesn't exist but user is in Auth
        const newProfile: UserProfile = {
          id: userCredential.user.uid,
          name: userCredential.user.displayName || 'Administrator',
          email: formData.email,
          role: 'admin'
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
        setCurrentUser(newProfile);
        router.push('/admin');
      } else {
        setError('Unauthorized user format.');
      }
    } catch (err: any) {
      console.error('Auth Attempt Error:', err);
      
      // Handle the generic invalid-credential or user-not-found
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        
        // If it's a known admin email and it might be a first-time login
        if (isAdminEmail && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
          try {
            // Attempt silent creation ONLY once per attempt to see if user exists
            const newUserCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await updateProfile(newUserCred.user, { displayName: 'Admin' });
            
            const newProfile: UserProfile = {
              id: newUserCred.user.uid,
              name: 'Admin',
              email: formData.email,
              role: 'admin'
            };
            await setDoc(doc(db, 'users', newUserCred.user.uid), newProfile);
            setCurrentUser(newProfile);
            
            setSuccess('Initial admin account created successfully! Redirecting...');
            setTimeout(() => router.push('/admin'), 1500);
            return;
          } catch (createErr: any) {
            // If creation fails with email-already-in-use, it means the password provided is definitely wrong
            if (createErr.code === 'auth/email-already-in-use') {
              setError('Incorrect password for this administrator account. Please try again or use "Forgot Password".');
              return;
            }
            console.error('Silent Init Error:', createErr);
          }
        }
        
        setError('Incorrect email or password. Please verify your admin credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Login has been temporarily disabled.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6" aria-label="Porters Lake Dental Home">
            <Logo className="h-12 w-auto" />
          </Link>
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em] mb-3">Portal Access</h2>
          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
            Administrator Login
          </h1>
          <p className="text-slate-500 text-sm">
            Enter your credentials to manage the portal
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl sm:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden relative">
          {/* Background pattern inside login panel */}
          <div className="absolute inset-0 bg-[url('/dental_pattern_v2.png')] bg-repeat opacity-[0.08] pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 relative z-10">
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input 
                  id="email"
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Only for admin"
                  className="w-full min-h-[48px] pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                <button 
                  type="button"
                  onClick={handleResetPassword}
                  className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider transition-colors min-h-[32px] flex items-center"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full min-h-[48px] pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-start space-x-2 animate-pulse">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div role="status" className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium flex items-start space-x-2">
                <RefreshCw className="w-5 h-5 shrink-0 animate-spin mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full min-h-[48px] py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:from-blue-700 hover:to-blue-600 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 outline-none group text-sm sm:text-base"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mb-1">
              Authorized Account Only
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-2 text-slate-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Administrative Entry</span>
        </div>
      </motion.div>
    </div>
  );
}
