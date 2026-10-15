'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export type Role = 'user' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  logout: () => void;
  isLoading: boolean;
  firebaseUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dentacare_admin_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.role === 'admin') return parsed;
        }
      } catch (_) {}
    }
    return null;
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAndCacheUser = (user: UserProfile | null) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      try {
        if (user && user.role === 'admin') {
          localStorage.setItem('dentacare_admin_profile', JSON.stringify(user));
        } else if (!user) {
          localStorage.removeItem('dentacare_admin_profile');
        }
      } catch (_) {}
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          const emailLower = (user.email || '').trim().toLowerCase();
          const isSuperAdmin = emailLower === 'asikosman010@gmail.com' ||
                               emailLower === 'admin@porterslakedental.com' ||
                               emailLower === 'dentist@bellaliant.com' ||
                               emailLower.endsWith('@porterslakedental.com');

          // Fetch additional profile data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (isSuperAdmin && data.role !== 'admin') {
              const updatedProfile = { ...data, role: 'admin' as Role };
              try {
                await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
              } catch (_) {}
              setAndCacheUser(updatedProfile);
            } else {
              setAndCacheUser(data);
            }
          } else {
            // Create a default profile if it doesn't exist
            const newProfile: UserProfile = {
              id: user.uid,
              name: user.displayName || (isSuperAdmin ? 'Administrator' : 'User'),
              email: user.email || '',
              role: isSuperAdmin ? 'admin' : 'user'
            };
            try {
              await setDoc(doc(db, 'users', user.uid), newProfile);
            } catch (_) {}
            setAndCacheUser(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        // If Firebase Auth has no user, keep cached admin if explicitly active, or reset
        const cached = typeof window !== 'undefined' ? localStorage.getItem('dentacare_admin_profile') : null;
        if (!cached) {
          setCurrentUser(null);
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dentacare_admin_profile');
      }
      await signOut(auth);
      setCurrentUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser: setAndCacheUser, logout, isLoading, firebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
