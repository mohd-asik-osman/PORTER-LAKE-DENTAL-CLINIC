'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Phone, 
  ChevronRight, Star, Shield, Zap, Heart,
  CheckCircle2,
  ShieldCheck, Users, Activity
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

// --- Components ---

export default function LandingPage() {
  return (
    <div className="min-h-screen selection:bg-blue-100 selection:text-blue-600">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-28 lg:pt-32 pb-12 sm:pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3 sm:mb-6">
                <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Top Rated Dental Clinic</span>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-bold text-slate-900 leading-[1.15] sm:leading-[1.1] mb-3 sm:mb-8 tracking-tight">
                We make excellent <br className="hidden sm:inline" />
                <span className="text-gradient">oral health easy</span>
              </h1>
              <p className="text-sm sm:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-10 max-w-lg">
                Experience world-class dentistry in a comfortable environment. We use advanced technology to provide affordable, trusted care for your entire family.
              </p>
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Link 
                  href="/booking" 
                  className="group w-full sm:w-auto min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-center flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Book Appointment</span>
                </Link>
                <Link 
                  href="/services" 
                  className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all text-center flex items-center justify-center text-sm sm:text-base"
                >
                  View Services
                </Link>
              </div>

              <div className="mt-8 sm:mt-12 flex items-center space-x-4 sm:space-x-8">
                <div className="flex -space-x-3 shrink-0">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <Image 
                        src={`https://picsum.photos/seed/user${i}/100/100`} 
                        alt="User" 
                        fill
                        sizes="40px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Trusted by 2,000+ happy patients</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mt-4 lg:mt-0"
            >
              <div className="relative z-10 rounded-2xl sm:rounded-[40px] overflow-hidden shadow-2xl shadow-blue-200/50 aspect-[4/3] sm:aspect-square">
                <Image 
                  src="https://www.porterslakedental.com/files/images/hero.jpg?v=4"
                  alt="Porters Lake Dental Hero"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
              </div>
              
              {/* Floating Stats */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 glass p-4 rounded-2xl shadow-xl z-20 hidden md:block"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Success Rate</p>
                    <p className="text-lg font-bold text-slate-900">99.8%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 glass p-4 rounded-2xl shadow-xl z-20 hidden md:block"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Patients</p>
                    <p className="text-lg font-bold text-slate-900">15,000+</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* All the effort is ours Section */}
      <section className="py-12 sm:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4 sm:mb-8">
            All the effort is ours.
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-10">
            For over 25 years, our locally owned and operated practice has been proudly serving the Porters Lake community and surrounding areas. We are committed to providing high-quality, personalized dental care in a welcoming environment. Our experienced team offers a full range of treatments—from routine dental hygiene and emergencies to advanced, high-tech procedures—ensuring that every member of your family receives the care they need. At Porters Lake Dental Centre, you’re not just a patient—you’re part of our community.
          </p>
          <Link 
            href="/become-a-patient" 
            className="inline-flex items-center justify-center space-x-2 min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm sm:text-base w-full sm:w-auto"
          >
            <span>Learn More</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>
      </section>

      {/* Every dental service a family could need Section */}
      <section className="py-12 sm:py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="relative aspect-[4/3] sm:aspect-square rounded-2xl sm:rounded-[40px] overflow-hidden shadow-xl sm:shadow-2xl">
              <Image 
                src="https://www.porterslakedental.com/files/images/dental-chair.webp"
                alt="Dental Chair"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4 sm:mb-8 leading-tight">
                Every dental service a family could need.
              </h2>
              <Link 
                href="/services" 
                className="inline-flex items-center justify-center space-x-2 min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 active:scale-95 transition-all text-sm sm:text-base w-full sm:w-auto"
              >
                <span>See Services</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* No wonder Porters Lake families keep coming back Section */}
      <section className="py-12 sm:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 mb-8 sm:mb-16 text-center">
            No wonder Porters Lake families keep coming back.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12 mb-8 sm:mb-16">
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-4">Beautiful, calming office</h3>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
                Nestled amongst mature trees and designed with calming colours, our clinic is warm and welcoming.
              </p>
            </div>
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-4">Easy insurance and payment</h3>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
                Our dental insurance process is hassle-free, and we offer every payment option you could need.
              </p>
            </div>
          </div>
          <div className="text-center">
            <Link 
              href="/about" 
              className="inline-flex items-center justify-center space-x-2 min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              <span>More</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comprehensive family dentistry Section */}
      <section className="py-12 sm:py-24 px-4 bg-blue-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4 sm:mb-6">
            Comprehensive family dentistry
          </h3>
          <p className="text-blue-100 text-sm sm:text-lg mb-6 sm:mb-10 leading-relaxed">
            Everyone in the family will feel welcome, and receive exactly the care they need, delivered with kindness.
          </p>
          <Link 
            href="/services/family-dentistry" 
            className="inline-flex items-center justify-center space-x-2 min-h-[48px] px-8 sm:px-10 py-3.5 sm:py-5 rounded-2xl bg-white text-blue-600 font-bold shadow-xl hover:bg-slate-50 active:scale-95 transition-all text-sm sm:text-base w-full sm:w-auto"
          >
            <span>More</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>
      </section>

      {/* A dental clinic that cares Section */}
      <section className="py-12 sm:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4 sm:mb-8">
            A dental clinic that cares.
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-10">
            At Porters Lake Dental Centre, we believe that everyone deserves a healthy, beautiful smile. Our team is dedicated to providing compassionate, high-quality dental care to patients of all ages. Whether you&apos;re due for a routine check-up or need more complex treatment, we&apos;re here to help you achieve your oral health goals. We take the time to listen to your concerns and develop personalized treatment plans that meet your unique needs. Our goal is to make every visit to our office a positive and comfortable experience.
          </p>
          <Link 
            href="/about" 
            className="inline-flex items-center justify-center space-x-2 min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm sm:text-base w-full sm:w-auto"
          >
            <span>Meet Our Team</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>
      </section>

      {/* Your comfort is our priority Section */}
      <section className="py-12 sm:py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4 sm:mb-8 leading-tight">
                Your comfort is our priority.
              </h2>
              <p className="text-sm sm:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-10">
                From the moment you walk through our doors, you&apos;ll feel at home in our warm and welcoming office. Our friendly staff is here to assist you with any questions you may have and ensure that your visit is as stress-free as possible. We offer a range of amenities to help you relax, including comfortable seating, refreshments, and entertainment options. Our treatment rooms are equipped with the latest technology to provide you with the most efficient and effective care. We&apos;re committed to creating a calming environment where you can feel confident in the care you receive.
              </p>
              <Link 
                href="/booking" 
                className="inline-flex items-center justify-center space-x-2 min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 active:scale-95 transition-all text-sm sm:text-base w-full sm:w-auto"
              >
                <span>Book an Appointment</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </Link>
            </div>
            <div className="order-1 lg:order-2 relative aspect-[4/3] sm:aspect-square rounded-2xl sm:rounded-[40px] overflow-hidden shadow-xl sm:shadow-2xl">
              <Image 
                src="https://www.porterslakedental.com/files/images/block-background-3.jpg"
                alt="Comfortable Dental Office"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 mb-8 sm:mb-16 text-center">
            What our patients are saying.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "Sarah M.",
                text: "I've been coming here for years and the service is always exceptional. The staff is friendly and professional.",
                rating: 5
              },
              {
                name: "John D.",
                text: "The best dental experience I've ever had. They really care about your comfort and explain everything clearly.",
                rating: 5
              },
              {
                name: "Emily R.",
                text: "Highly recommend Porters Lake Dental Centre! They are great with kids and make every visit stress-free.",
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 flex flex-col h-full">
                <div className="flex items-center space-x-1 mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-base text-slate-600 italic mb-4 sm:mb-6 flex-grow">&quot;{testimonial.text}&quot;</p>
                <p className="font-bold text-slate-900 text-sm sm:text-base">— {testimonial.name}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-12">
            <Link 
              href="https://www.google.com/search?q=porters+lake+dental+centre+reviews" 
              target="_blank"
              className="inline-flex items-center justify-center space-x-2 min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              <span>Read More Reviews</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-12 sm:py-24 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold mb-4 sm:mb-8">
            Ready to schedule your visit?
          </h2>
          <p className="text-slate-400 text-sm sm:text-lg mb-6 sm:mb-10 leading-relaxed">
            Contact us today to book your appointment or learn more about our services. We look forward to welcoming you to our practice!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
            <Link 
              href="/booking" 
              className="w-full sm:w-auto min-h-[48px] px-8 sm:px-10 py-3.5 sm:py-5 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-900/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Calendar className="w-5 h-5 shrink-0" />
              <span>Book Appointment</span>
            </Link>
            <a 
              href="tel:9028274746" 
              className="w-full sm:w-auto min-h-[48px] px-8 sm:px-10 py-3.5 sm:py-5 rounded-2xl border-2 border-slate-700 text-white font-bold hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Phone className="w-5 h-5 shrink-0" />
              <span>(902) 827-4746</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
