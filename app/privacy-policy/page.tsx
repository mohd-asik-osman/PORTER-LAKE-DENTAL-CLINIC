'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'motion/react';

export default function PrivacyPolicyPage() {
  const lastUpdated = "April 5, 2026";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <header className="pt-6 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-blue-600 font-bold mb-3 sm:mb-4 hover:-translate-x-1 transition-transform">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm">Last Updated: {lastUpdated}</p>
          </motion.div>
        </div>
      </header>

      <section className="pb-12 sm:pb-16 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-[40px] p-8 md:p-16 shadow-xl border border-slate-100">
          <div className="prose prose-slate max-w-none">
            <div className="flex items-center gap-4 mb-8 p-6 bg-blue-50 rounded-3xl border border-blue-100">
              <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
              <p className="text-blue-900 font-medium m-0">
                We respect the privacy of our customers. This statement explains how your information is collected and used.
              </p>
            </div>

            <p className="text-slate-600 leading-relaxed mb-8">
              Personal information will not be used or disclosed for purposes other than those for which it was collected, except with the consent of the customer or as required by law.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
              <FileText className="text-blue-600 w-6 h-6" />
              What We Collect
            </h2>
            <p className="text-slate-600 leading-relaxed mb-8">
              Personal information is collected for processing Appointment Requests. This information is viewable by us and the third-parties contracted to manage our website.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
              <Eye className="text-blue-600 w-6 h-6" />
              Web Statistics and Cookies
            </h2>
            <p className="text-slate-600 leading-relaxed mb-8">
              Information on website traffic is collected including IP address, referring domains, page requests, number and length of visits. This information is used solely to monitor marketing and usability goals and is not personally identifiable. Cookies are used in collecting website statistics.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
              <Lock className="text-blue-600 w-6 h-6" />
              Questions and Concerns
            </h2>
            <p className="text-slate-600 leading-relaxed mb-8">
              If you have any questions or concerns regarding the privacy of your information, please contact our office.
            </p>

            <div className="mt-16 pt-8 border-t border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Contact Us</h3>
              <div className="space-y-2">
                <p className="text-slate-900 font-bold">Porters Lake Dental Centre</p>
                <p className="text-slate-600">5141 Nova Scotia Trunk 7, Porters Lake, NS B3E 1M1</p>
                <p className="text-blue-600 font-bold">(902) 827-4746</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
