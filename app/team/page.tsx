'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const DENTISTS = [
  { 
    id: 'jessica-sanford',
    name: 'Dr. Jessica Sanford', 
    role: 'Principal Dentist',
    specialty: 'Cosmetic & Restorative Dentistry',
    photo: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-sanford_0.jpg.webp?itok=fEHqj_V6' 
  },
  { 
    id: 'erhan-tatlidil',
    name: 'Dr. Erhan Tatlidil', 
    role: 'Associate Dentist',
    specialty: 'Oral Surgery & Implants',
    photo: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-erhan-tatlidil.jpg.webp?itok=1MfMueYL' 
  },
  { 
    id: 'sam-flynn',
    name: 'Dr. Sam Flynn', 
    role: 'Associate Dentist',
    specialty: 'General & Family Dentistry',
    photo: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-sam-flynn.webp?itok=V-MMFOI5' 
  },
  { 
    id: 'dalia-nasser',
    name: 'Dr. Dalia Nasser', 
    role: '',
    specialty: 'Bio coming soon.',
    photo: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/placeholder.png.webp?itok=hF4Kmd0Z' 
  },
];

const STAFF = {
  'Hygiene Staff': ['Bob', 'Lisa', 'Becky', 'Ruth', 'Theresa'],
  'Assistants': ['Kelsie', 'Angela', 'Jenah', 'Melissa'],
  'Admin': ['Melissa', 'Ingrid', 'Jessica M.'],
};

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Navbar />
      
      <header className="pt-6 sm:pt-10 lg:pt-12 pb-4 sm:pb-6 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-200 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-100 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 sm:mb-4"
          >
            <Link href="/" className="inline-flex items-center space-x-2 text-slate-400 hover:text-blue-600 font-medium transition-colors group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs uppercase tracking-widest">Back to Home</span>
            </Link>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight"
          >
            The Hands Behind <br />
            <span className="text-gradient">Your Smile</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Our team is defined by a shared passion for excellence and a commitment to compassionate, patient-centered care.
          </motion.p>
        </div>
      </header>

      <section className="py-6 sm:py-10 lg:py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-[11px] sm:text-xs font-bold text-blue-600 uppercase tracking-[0.3em] mb-1.5 sm:mb-2"
            >
              Expertise & Care
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-slate-900 text-center"
            >
              Our Dentists
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-8 mb-10 sm:mb-16">
            {DENTISTS.map((dentist, index) => (
              <Link 
                key={dentist.name}
                href={`/team/${dentist.id}`}
                className="block"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="relative mb-6 sm:mb-8 max-w-xs sm:max-w-none mx-auto">
                    {/* Decorative background element */}
                    <div className="absolute -inset-4 bg-slate-50 rounded-[40px] scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 -z-10" />
                    
                    {/* Image with Oval Mask */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[80px] sm:rounded-[120px] shadow-2xl shadow-slate-200/50 transform group-hover:-translate-y-2 transition-transform duration-500">
                      <Image 
                        src={dentist.photo} 
                        alt={dentist.name} 
                        fill 
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {dentist.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                      {dentist.role}
                    </p>
                    <div className="h-px w-8 bg-blue-200 mx-auto mb-4 group-hover:w-16 transition-all duration-500" />
                    <p className="text-slate-500 text-xs sm:text-sm italic">
                      {dentist.specialty}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          <div className="pt-12 sm:pt-24 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-16 lg:gap-24">
              {Object.entries(STAFF).map(([category, members], idx) => (
                <motion.div 
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 mb-4 sm:mb-8 flex items-center space-x-3">
                    <span className="w-8 h-px bg-blue-600" />
                    <span>{category}</span>
                  </h3>
                  <ul className="space-y-3 sm:space-y-4">
                    {members.map(member => (
                      <li key={member} className="flex items-center space-x-3 group py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-200 group-hover:bg-blue-600 transition-colors shrink-0" />
                        <span className="text-slate-600 text-sm sm:text-base font-medium group-hover:text-slate-900 transition-colors">{member}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-24 px-4 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 blur-[120px] -skew-x-12 translate-x-1/4" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4 sm:mb-6">Ready to meet us in person?</h2>
          <p className="text-slate-400 mb-8 sm:mb-10 text-sm sm:text-lg">We&apos;re currently accepting new patients and would love to welcome you to our dental family.</p>
          <Link 
            href="/booking"
            className="inline-flex items-center justify-center space-x-3 bg-white text-slate-900 min-h-[48px] px-8 py-3.5 sm:py-4 rounded-full font-bold hover:bg-blue-50 active:scale-95 transition-all w-full sm:w-auto"
          >
            <span>Book Your Consultation</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
