'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { 
  Phone, Mail, MapPin, Clock, 
  Send, ChevronLeft, CheckCircle2,
  MessageSquare, Globe, Heart, ArrowRight,
  Loader2
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {/* Header */}
      <header className="pt-20 sm:pt-28 lg:pt-32 pb-12 sm:pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-blue-600 font-bold mb-6 sm:mb-8 hover:-translate-x-1 transition-transform"
            aria-label="Back to Home Page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-slate-900 mb-4 sm:mb-6">Get in <span className="text-gradient">Touch</span></h1>
          <p className="text-sm sm:text-lg text-slate-500 max-w-2xl mx-auto">
            Have questions? We&apos;re here to help. Contact us via phone, email, or visit our clinic.
          </p>
        </div>
      </header>

      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
          {/* Contact Info */}
          <div className="space-y-8 sm:space-y-12">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mb-6 sm:mb-8">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/40">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 sm:mb-6">
                    <Phone className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Phone</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">(902) 827-4746</p>
                </div>
                <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/40">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 sm:mb-6">
                    <Mail className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Email</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base break-all">dentist@bellaliant.com</p>
                </div>
                <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/40">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-4 sm:mb-6">
                    <MapPin className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Location</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">5141 Nova Scotia Trunk 7, Porters Lake, NS B3E 1M1</p>
                </div>
                <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/40">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4 sm:mb-6">
                    <Clock className="text-yellow-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Hours</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">Mon-Fri: 9am - 6pm</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl sm:rounded-[40px] overflow-hidden h-[280px] sm:h-[400px] border border-white/40 shadow-xl sm:shadow-2xl relative">
              {/* Mock Map */}
              <div className="absolute inset-0 bg-slate-200 flex items-center justify-center p-4">
                <div className="text-center">
                  <MapPin className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-2 sm:mb-4 animate-bounce" />
                  <p className="font-bold text-slate-900 text-sm sm:text-base">Google Maps Embed Placeholder</p>
                  <p className="text-xs sm:text-sm text-slate-500">5141 Nova Scotia Trunk 7, Porters Lake, NS B3E 1M1</p>
                </div>
              </div>
              <a 
                href="https://maps.app.goo.gl/XRey61KqKj6c4SEw6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute bottom-4 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-6 glass p-3 sm:p-4 rounded-2xl flex items-center justify-between hover:bg-white/60 transition-all min-h-[44px]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                    <Globe className="text-white w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">Get Directions</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass p-5 sm:p-10 md:p-12 rounded-2xl sm:rounded-[40px] border border-white/40 shadow-xl sm:shadow-2xl h-fit">
            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 sm:py-12"
                role="status"
                aria-live="polite"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" aria-hidden="true" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-3 sm:mb-4">Message Sent!</h2>
                <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all text-sm sm:text-base min-h-[48px]"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mb-6 sm:mb-8 flex items-center space-x-3">
                  <MessageSquare className="text-blue-600 shrink-0 w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                  <span>Send a Message</span>
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="firstName" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">First Name</label>
                      <input 
                        id="firstName"
                        type="text" 
                        required
                        aria-required="true"
                        className="w-full min-h-[48px] px-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="lastName" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Last Name</label>
                      <input 
                        id="lastName"
                        type="text" 
                        required
                        aria-required="true"
                        className="w-full min-h-[48px] px-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                    <input 
                      id="email"
                      type="email" 
                      required
                      aria-required="true"
                      className="w-full min-h-[48px] px-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="subject" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Subject</label>
                    <select 
                      id="subject"
                      className="w-full min-h-[48px] px-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-600 text-sm sm:text-base"
                    >
                      <option>General Inquiry</option>
                      <option>Booking Help</option>
                      <option>Pricing Question</option>
                      <option>Feedback</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="message" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Message</label>
                    <textarea 
                      id="message"
                      required
                      aria-required="true"
                      rows={4}
                      className="w-full px-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm sm:text-base"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                    className="w-full min-h-[48px] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-5 h-5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
