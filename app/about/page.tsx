'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, FileText, CreditCard, Calendar, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Header */}
      <header className="pt-6 sm:pt-10 lg:pt-12 pb-4 sm:pb-6 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-blue-600 font-bold mb-3 sm:mb-4 hover:-translate-x-1 transition-transform" aria-label="Back to Home">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-3 sm:mb-4 leading-tight tracking-tight">
            Excellent oral health <span className="text-gradient">made easy for you.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
            One of the best ways to ensure a lifetime of healthy teeth is to nurture a trusting, lifelong, and effortless relationship with your oral health professional. It’s why we’ve worked so hard to make your visits at our clinic not just enjoyable, but easy to maintain. Here’s how.
          </p>
        </div>
      </header>

      {/* Main Image */}
      <section className="pb-8 sm:pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-2xl sm:rounded-[32px] shadow-xl sm:shadow-2xl">
            <Image 
              src="https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/reflection.jpg.webp?itok=I2uM1Noq" 
              alt="Clinic Reflection" 
              fill
              sizes="100vw"
              className="object-cover"
              referrerPolicy="no-referrer"
              priority
            />
          </div>
        </div>
      </section>

      {/* Detailed Description Section */}
      <section className="py-8 sm:py-12 lg:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-8 sm:space-y-12 text-slate-700">
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
              <div className="flex-1">
                <p className="text-base sm:text-lg leading-relaxed">
                  Our office is a joy to visit. With beautiful mature trees around us, and an interior aesthetic designed to put you at ease, our patients always feel relaxed and calm when they visit for an appointment or treatment.
                </p>
              </div>
              <div className="flex-1">
                <p className="text-base sm:text-lg leading-relaxed">
                  It’s everything you need under one roof. From routine hygiene appointments to restorations and cosmetic treatments to dental implants, you can bet that everyone in your family will be able to receive exactly the care they need, all from our Porters Lake clinic.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-blue-50 border border-blue-100">
              <p className="text-base sm:text-lg leading-relaxed">
                Digital dental technology makes imaging simple and accurate. Our digital X-rays, panoramic X-rays, and intraoral cameras allow us to capture remarkably detailed images quickly and easily.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">
              <p className="text-base sm:text-lg leading-relaxed">
                We offer the little extras that mean a lot. With TVs in the waiting area and the operatories, lots of free parking in our private lot, and a casual, family-oriented approach to care, your visit is always enjoyable.
              </p>
              <p className="text-base sm:text-lg leading-relaxed">
                With direct billing to your private dental insurance company, you never have to worry about submitting receipts or completing any paper work. We take care of it, so it’s one less thing for you to worry about.
              </p>
            </div>

            {/* Payment Options */}
            <div className="pt-6 sm:pt-8 border-t border-slate-100">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
                <CreditCard className="text-blue-600 shrink-0 w-5 h-5" />
                <span>We accept the following payment options:</span>
              </h3>
              <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
                {[
                  { src: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/visa.png.webp?itok=4JzrFw-0", alt: "Visa" },
                  { src: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/e-transfer.png.webp?itok=c-7pWuTH", alt: "E-transfer" },
                  { src: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/debit.png.webp?itok=r5HQ7rUR", alt: "Debit" },
                  { src: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/mastercard.png.webp?itok=TiRfyTeZ", alt: "Mastercard" }
                ].map((payment, idx) => (
                  <div key={idx} className="relative h-8 sm:h-10 w-14 sm:w-16 grayscale hover:grayscale-0 transition-all">
                    <Image 
                      src={payment.src} 
                      alt={payment.alt} 
                      fill 
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forms Section */}
      <section className="py-12 sm:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="glass p-5 sm:p-10 rounded-2xl sm:rounded-[40px] border border-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-3">
              <FileText className="text-blue-600 shrink-0 w-6 h-6" />
              <span>New Patient Forms</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <a 
                href="https://www.porterslakedental.com/files/2023-06/NP%20Chart%20Medical%20History%202023.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all flex items-center justify-between min-h-[48px]"
              >
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base">Medical History Form</p>
                  <p className="text-xs sm:text-sm text-slate-500">Download PDF</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </a>
              <a 
                href="https://www.porterslakedental.com/files/2023-06/NP%20Chart%202023.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all flex items-center justify-between min-h-[48px]"
              >
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base">Patient Information Form</p>
                  <p className="text-xs sm:text-sm text-slate-500">Download PDF</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </a>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 sm:mt-20 text-center">
            <Link 
              href="/booking" 
              className="inline-flex items-center justify-center space-x-3 min-h-[48px] px-8 sm:px-10 py-3.5 sm:py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              <Calendar className="w-5 h-5" />
              <span>Book an appointment</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
