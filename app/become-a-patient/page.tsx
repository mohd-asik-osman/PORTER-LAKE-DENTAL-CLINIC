'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { 
  ClipboardCheck, 
  FileText, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  Stethoscope,
  Smile,
  CheckCircle2,
  Phone,
  Loader2
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function BecomeAPatientPage() {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    // Simulate download preparation
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsDownloading(false);
    // In a real app, you'd trigger the actual download here
    alert('Forms download started!');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <header className="pt-6 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4"
          >
            <Smile className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>Welcome to Porters Lake Dental</span>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">
            Become a <span className="text-gradient">Patient</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto mb-5 sm:mb-6 leading-relaxed">
            We&apos;re always accepting new patients, and would be proud to show you and your family how uncomplicated professional dental care can be. Whether you&apos;re from Porters Lake or farther away, you&apos;ll appreciate our relaxing clinic, warm approach, and experienced people.
          </p>
        </div>
      </header>

      {/* Hero Image Section */}
      <section className="pb-12 sm:pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl sm:rounded-[40px] overflow-hidden shadow-xl sm:shadow-2xl border border-white/40"
          >
            <Image 
              src="https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/lake.jpg.webp?itok=hUPIbwmD"
              alt="Porters Lake View"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Checklist */}
      <section className="py-12 sm:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-slate-900 mb-6 sm:mb-8">
                Discover why patients choose Porters Lake Dental Centre
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {[
                  'Comprehensive family dental care',
                  'A charming clinic in a beautiful setting',
                  'Friendly, warm, experienced team',
                  'Easy insurance and payment options',
                  'Service in both English and French',
                  'Sedation options to help you relax',
                  'Unique services like implants and restorations'
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center space-x-3 sm:space-x-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all"
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <span className="text-slate-700 font-medium text-sm sm:text-base">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square lg:aspect-auto lg:h-full min-h-[280px] sm:min-h-[400px]">
              <div className="absolute inset-0 bg-blue-600 rounded-2xl sm:rounded-[40px] rotate-3 opacity-10" />
              <Image 
                src="https://picsum.photos/seed/dentist-team/800/800"
                alt="Our Team"
                fill
                className="rounded-2xl sm:rounded-[40px] object-cover shadow-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-12 sm:py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-20">
            <h2 className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-2 sm:mb-4">Your First Visit</h2>
            <p className="text-2xl sm:text-4xl font-display font-bold text-slate-900 mb-3 sm:mb-6">What to Expect</p>
            <p className="text-xs sm:text-base text-slate-500">We want your first visit to be as smooth and comfortable as possible. Here&apos;s a quick overview of what will happen during your initial appointment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12">
            {[
              {
                title: 'Comprehensive Exam',
                desc: 'Our dentists will perform a thorough examination of your teeth, gums, and overall oral health.',
                icon: Stethoscope,
                step: '01'
              },
              {
                title: 'Digital X-Rays',
                desc: 'We use advanced digital imaging to get a clear picture of your dental structure and identify any hidden issues.',
                icon: FileText,
                step: '02'
              },
              {
                title: 'Personalized Plan',
                desc: 'We&apos;ll discuss our findings and create a customized treatment plan tailored to your specific needs and goals.',
                icon: ClipboardCheck,
                step: '03'
              }
            ].map((item, i) => (
              <div key={i} className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 group hover:shadow-xl transition-all">
                <span className="absolute top-4 right-6 sm:right-8 text-3xl sm:text-4xl font-display font-bold text-slate-100 group-hover:text-blue-50 transition-colors">{item.step}</span>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-blue-100">
                  <item.icon className="text-white w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-4">{item.title}</h3>
                <p className="text-xs sm:text-base text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Patient Forms */}
      <section className="py-12 sm:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="glass p-6 sm:p-12 md:p-20 rounded-2xl sm:rounded-[40px] border border-white/40 shadow-xl flex flex-col lg:flex-row items-center gap-8 sm:gap-16">
            <div className="flex-1 w-full">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4 sm:mb-6">Save Time with New Patient Forms</h2>
              <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 leading-relaxed">
                To make your first visit more efficient, we recommend filling out our new patient forms in advance. You can download them here and bring them with you to your appointment.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3 text-xs sm:text-base text-slate-700">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                  <span>Medical History Form</span>
                </div>
                <div className="flex items-center space-x-3 text-xs sm:text-base text-slate-700">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                  <span>Patient Registration Form</span>
                </div>
                <div className="flex items-center space-x-3 text-xs sm:text-base text-slate-700">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                  <span>Privacy Policy (HIPAA)</span>
                </div>
              </div>
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="mt-8 sm:mt-10 min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <span>Download Forms</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 relative w-full aspect-square max-w-md">
              <div className="absolute inset-0 bg-blue-600 rounded-2xl sm:rounded-3xl rotate-3" />
              <div className="absolute inset-0 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4 sm:mb-6">
                  <Clock className="text-blue-600 w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Arrive Early</h3>
                <p className="text-xs sm:text-base text-slate-500">Please arrive 15 minutes before your scheduled appointment time to complete any remaining paperwork.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insurance & Payment */}
      <section className="py-12 sm:py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6 sm:mb-8">
            <ShieldCheck className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4 sm:mb-6">Insurance & Payment Options</h2>
          <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            We believe high-quality dental care should be accessible. We accept most major insurance plans and offer flexible payment options to fit your budget. Our team will work with you to maximize your benefits and explain any out-of-pocket costs upfront.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 grayscale opacity-50 text-xs sm:text-xl font-bold text-slate-400">
            <div>INSURANCE PARTNER 1</div>
            <div>INSURANCE PARTNER 2</div>
            <div>INSURANCE PARTNER 3</div>
          </div>
        </div>
      </section>

      {/* Clinic Hours */}
      <section className="py-12 sm:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="relative aspect-video rounded-2xl sm:rounded-[40px] overflow-hidden shadow-xl sm:shadow-2xl border border-white/40 order-2 lg:order-1">
              <Image 
                src="https://picsum.photos/seed/clinic-front/800/450"
                alt="Clinic Entrance"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 sm:mb-8">
                <Clock className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4 sm:mb-6">Clinic Operating Hours</h2>
              <p className="text-xs sm:text-base text-slate-600 mb-6 sm:mb-10 leading-relaxed">
                We understand that our patients have busy schedules. That&apos;s why we offer convenient operating hours throughout the week to ensure you can get the care you need when it works for you.
              </p>
              <div className="space-y-2.5 sm:space-y-4">
                {[
                  { day: 'Monday', hours: '8:00 AM - 6:00 PM' },
                  { day: 'Tuesday', hours: '8:00 AM - 6:00 PM' },
                  { day: 'Wednesday', hours: '8:00 AM - 6:00 PM' },
                  { day: 'Thursday', hours: '8:00 AM - 5:00 PM' },
                  { day: 'Friday', hours: '8:00 AM - 3:00 PM' },
                  { day: 'Saturday', hours: 'Closed' },
                  { day: 'Sunday', hours: 'Closed' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-base">
                    <span className="font-bold text-slate-900">{item.day}</span>
                    <span className={`font-medium ${item.hours === 'Closed' ? 'text-slate-400' : 'text-blue-600'}`}>{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-600 rounded-2xl sm:rounded-[40px] p-6 sm:p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
              <div className="text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2 sm:mb-4">Here&apos;s how to get started!</h2>
                <p className="text-blue-100 text-sm sm:text-lg flex items-center justify-center md:justify-start space-x-2">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>To make an appointment simply call us at (902) 827-4746.</span>
                </p>
              </div>
              <Link 
                href="/booking" 
                className="min-h-[48px] px-8 sm:px-10 py-3.5 sm:py-5 rounded-2xl bg-white text-blue-600 font-bold shadow-xl hover:bg-slate-50 active:scale-95 transition-all text-sm sm:text-base flex items-center justify-center shrink-0 w-full md:w-auto"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
