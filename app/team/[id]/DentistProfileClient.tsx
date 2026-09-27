'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ChevronLeft, Mail, Phone, Calendar, Award, GraduationCap, Heart } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DENTIST_PROFILES } from '@/lib/seo';

export function DentistProfileClient({ id }: { id: string }) {
  const dentist = DENTIST_PROFILES[id];

  if (!dentist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-bold mb-4">Dentist not found</h1>
        <Link href="/team" className="text-blue-600 hover:underline">Back to Team</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Navbar />
      
      <main className="pt-6 sm:pt-10 lg:pt-12 pb-8 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 sm:mb-6"
          >
            <Link href="/team" className="inline-flex items-center space-x-2 text-slate-400 hover:text-blue-600 font-medium transition-colors group" aria-label="Back to Team">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs uppercase tracking-widest">Back to Team</span>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 items-start">
            {/* Left Column: Image & Quick Info */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[60px] sm:rounded-[120px] shadow-2xl shadow-slate-200/50 mb-6 sm:mb-8 max-w-sm sm:max-w-none mx-auto">
                <Image 
                  src={dentist.photo} 
                  alt={`${dentist.name} - ${dentist.role || 'Dentist'} at Porters Lake Dental Centre`} 
                  fill 
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-[40px] border border-white/40 space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Email</p>
                    <a href="mailto:dentist@bellaliant.com" className="text-slate-900 font-medium text-xs sm:text-base truncate hover:text-blue-600 transition-colors block">dentist@bellaliant.com</a>
                  </div>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                    <a href="tel:+19028274746" className="text-slate-900 font-medium text-xs sm:text-base hover:text-blue-600 transition-colors block">+1-902-827-4746</a>
                  </div>
                </div>
                <Link 
                  href="/booking"
                  className="flex items-center justify-center space-x-2 w-full min-h-[48px] py-3.5 sm:py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all text-sm sm:text-base"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Book Appointment</span>
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Bio & Details */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-7 space-y-8 sm:space-y-12"
            >
              <div>
                {dentist.role && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em] mb-2 sm:mb-4 block"
                  >
                    {dentist.role}
                  </motion.span>
                )}
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-slate-900 mb-2 sm:mb-4 tracking-tight">
                  {dentist.name}
                </h1>
                {dentist.specialty && (
                  <p className="text-base sm:text-xl text-blue-600 font-medium italic mb-4 sm:mb-8">
                    {dentist.specialty}
                  </p>
                )}
                <div className="h-px w-24 bg-blue-200 mb-6 sm:mb-8" />
                <div className="text-sm sm:text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                  {dentist.bio}
                </div>
              </div>

              {((dentist.education && dentist.education.length > 0) || (dentist.memberships && dentist.memberships.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {dentist.education && dentist.education.length > 0 && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 flex items-center space-x-3">
                        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                        <span>Education</span>
                      </h3>
                      <ul className="space-y-2.5 sm:space-y-3">
                        {dentist.education.map((item: string) => (
                          <li key={item} className="flex items-start space-x-3 text-xs sm:text-base text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-200 mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {dentist.memberships && dentist.memberships.length > 0 && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 flex items-center space-x-3">
                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                        <span>Memberships</span>
                      </h3>
                      <ul className="space-y-2.5 sm:space-y-3">
                        {dentist.memberships.map((item: string) => (
                          <li key={item} className="flex items-start space-x-3 text-xs sm:text-base text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-200 mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {dentist.interests && dentist.interests.length > 0 && (
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 flex items-center space-x-3">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                    <span>Areas of Interest</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {dentist.interests.map((item: string) => (
                      <span key={item} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 text-slate-600 text-xs sm:text-sm font-medium rounded-full border border-slate-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
