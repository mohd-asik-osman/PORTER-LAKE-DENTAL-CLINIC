'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const ServiceTemplate = ({ 
  title, 
  description, 
  moto,
  subServices
}: { 
  title: string, 
  description: string, 
  moto: string,
  subServices?: { title: string, description: string, imageUrl?: string }[]
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <header className="pt-6 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/services" className="inline-flex items-center space-x-2 text-blue-600 font-bold mb-3 sm:mb-4 hover:-translate-x-1 transition-transform" aria-label="Back to Services">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Services</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-2 sm:mb-3 tracking-tight">{title}</h1>
          <p className="text-base sm:text-lg font-medium text-slate-600 mb-3 sm:mb-4">{moto}</p>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">{description}</p>
          <div className="mt-5 sm:mt-6">
            <Link href="/booking" className="inline-flex items-center justify-center min-h-[48px] w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all text-sm sm:text-base">Book an appointment</Link>
          </div>
        </div>
      </header>
      
      {subServices && (
        <section className="py-8 sm:py-12 lg:py-14 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-6 sm:mb-8 text-center">Our {title} Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {subServices.map((sub, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all overflow-hidden"
                >
                  {sub.imageUrl && (
                    <div className="relative aspect-video mb-5 sm:mb-6 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8">
                      <Image 
                        src={sub.imageUrl} 
                        alt={sub.title} 
                        fill 
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-4">{sub.title}</h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{sub.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      <Footer />
    </div>
  );
};
