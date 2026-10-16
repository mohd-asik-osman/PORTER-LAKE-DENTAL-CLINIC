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
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SUPER_ADMIN_EMAILS = [
  'asikosman010@gmail.com'
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === 'asikosman010@gmail.com';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          const isSuperAdmin = isSuperAdminEmail(user.email);

          // Fetch additional profile data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (isSuperAdmin && data.role !== 'admin') {
              const updatedProfile: UserProfile = { ...data, role: 'admin' };
              try {
                await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
              } catch (_) {}
              setCurrentUser(updatedProfile);
            } else {
              setCurrentUser(data);
            }
          } else {
            // Create profile for authenticated user
            const newProfile: UserProfile = {
              id: user.uid,
              name: user.displayName || (isSuperAdmin ? 'Administrator' : 'Patient User'),
              email: user.email || '',
              role: isSuperAdmin ? 'admin' : 'user'
            };
            try {
              await setDoc(doc(db, 'users', user.uid), newProfile);
            } catch (_) {}
            setCurrentUser(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          if (isSuperAdminEmail(user.email)) {
            setCurrentUser({
              id: user.uid,
              name: user.displayName || 'Administrator',
              email: user.email || '',
              role: 'admin'
            });
          }
        }
      } else {
        setCurrentUser(null);
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

  const isAdmin = !!firebaseUser && (currentUser?.role === 'admin' || isSuperAdminEmail(firebaseUser.email));

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, logout, isLoading, firebaseUser, isAdmin }}>
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
