'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LogOut, LayoutDashboard, Facebook, Instagram, MapPin, Phone, Calendar } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth-context';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  return (
    <>
      <div className="bg-blue-600 text-white py-1.5 sm:py-3 px-3 sm:px-4 text-center text-[11px] sm:text-xs md:text-sm font-medium relative z-[60] leading-snug sm:leading-relaxed">
        <div className="max-w-7xl mx-auto">
          Friendly reminder: We would like to advise patients that we are not affiliated with or expanding into a hygiene only practice. We are proud to continue to provide full hygiene and dental care at 5141 Nova Scotia Trunk 7. Thank you!
        </div>
      </div>
      <nav className="sticky top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center">
          <Link href="/" className="flex items-center space-x-2 shrink-0 py-1" aria-label="Porters Lake Dental Home">
            <Logo className="h-8 sm:h-10 w-auto" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8">
            <div className="flex items-center gap-4 lg:gap-6">
              <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Home</Link>
              <Link href="/become-a-patient" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">Become a Patient</Link>
              <div className="relative group">
                <Link href="/services" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Services</Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all grid grid-cols-2 gap-4 z-50">
                  {[
                    { id: 'cosmetic-dentistry', title: 'Cosmetic Dentistry', img: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/cosmetic.jpg' },
                    { id: 'dental-appliances', title: 'Dental Appliances', img: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/appliances.jpg' },
                    { id: 'dental-hygiene', title: 'Dental Hygiene', img: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/hygiene.jpg' },
                    { id: 'dental-implants', title: 'Dental Implants', img: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/dental-implants.jpg' },
                    { id: 'family-dentistry', title: 'Family Dentistry', img: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/family.jpg' },
                    { id: 'restorative-dentistry', title: 'Restorative Dentistry', img: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/restorations.jpg' },
                    { id: 'sedation-dentistry', title: 'Sedation Dentistry', img: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/sedation.jpg' },
                  ].map((service) => (
                    <Link 
                      key={service.id}
                      href={`/services/${service.id}`} 
                      className="flex items-center space-x-4 p-2 rounded-2xl hover:bg-blue-50 transition-colors group/item"
                    >
                      <div className="relative w-16 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <Image 
                          src={service.img} 
                          alt={service.title}
                          fill
                          className="object-cover group-hover/item:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-600 group-hover/item:text-blue-600 transition-colors">{service.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="relative group">
                <Link href="/cdcp" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">CDCP</Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[280px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col gap-2 z-50">
                  <Link href="/cdcp" className="p-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">CDCP Overview</Link>
                </div>
              </div>
              <div className="relative group">
                <Link href="/team" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Team</Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[280px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col gap-2 z-50">
                  {[
                    { id: 'jessica-sanford', name: 'Dr. Jessica Sanford', photo: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-sanford_0.jpg.webp?itok=fEHqj_V6' },
                    { id: 'erhan-tatlidil', name: 'Dr. Erhan Tatlidil', photo: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-erhan-tatlidil.jpg.webp?itok=1MfMueYL' },
                    { id: 'sam-flynn', name: 'Dr. Sam Flynn', photo: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-sam-flynn.webp?itok=V-MMFOI5' },
                  ].map((dentist) => (
                    <Link 
                      key={dentist.name}
                      href={`/team/${dentist.id}`} 
                      className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-blue-50 transition-colors group/item"
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-slate-100">
                        <Image 
                          src={dentist.photo} 
                          alt={dentist.name}
                          fill
                          className="object-cover group-hover/item:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 group-hover/item:text-blue-600 transition-colors">{dentist.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">About</Link>
              <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Contact</Link>
            </div>
            
            <div className="flex items-center gap-4 lg:gap-6 border-l border-slate-200 pl-4 lg:pl-6">
              <a 
                href="tel:9028274746" 
                className="flex items-center space-x-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden xl:inline">(902) 827-4746</span>
              </a>
              
              <div className="hidden lg:flex items-center space-x-3">
                <a 
                  href="https://www.facebook.com/porterslakedental" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.instagram.com/porterslakedental/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-pink-600 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://maps.app.goo.gl/XRey61KqKj6c4SEw6" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-red-600 transition-colors"
                  aria-label="Google Maps"
                >
                  <MapPin className="w-5 h-5" />
                </a>
              </div>
              
              {currentUser && currentUser.role === 'admin' ? (
                <div className="flex items-center space-x-2">
                  <Link 
                    href="/admin" 
                    className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden lg:inline">Admin Panel</span>
                  </Link>
                  <button 
                    onClick={logout}
                    className="p-2 text-slate-500 hover:text-red-500 transition-colors focus:ring-2 focus:ring-red-500 rounded-lg outline-none"
                    aria-label="Logout"
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/booking" 
                    className="flex items-center space-x-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs lg:text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Now</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Toggle & Actions */}
          <div className="md:hidden flex items-center space-x-2">
            {!currentUser || currentUser.role !== 'admin' ? (
              <Link 
                href="/booking" 
                className="flex items-center space-x-1.5 px-3.5 py-2.5 min-h-[44px] rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold shadow-md shadow-blue-200 active:scale-95 transition-all shrink-0"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book</span>
              </Link>
            ) : null}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 hover:text-blue-600 focus:ring-2 focus:ring-blue-500 rounded-xl outline-none active:bg-slate-100 transition-colors shrink-0"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/20 overflow-y-auto max-h-[80vh]"
          >
            <div className="px-4 pt-3 pb-6 space-y-1">
              <Link href="/" onClick={() => setIsOpen(false)} className="block px-3 py-3 min-h-[44px] flex items-center text-base font-semibold text-slate-700 hover:text-blue-600 rounded-xl active:bg-blue-50">Home</Link>
              <Link href="/become-a-patient" onClick={() => setIsOpen(false)} className="block px-3 py-3 min-h-[44px] flex items-center text-base font-semibold text-slate-700 hover:text-blue-600 rounded-xl active:bg-blue-50">Become a Patient</Link>
              <div className="space-y-0.5">
                <p className="px-3 pt-3 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Services</p>
                <Link href="/services/cosmetic-dentistry" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">Cosmetic Dentistry</Link>
                <Link href="/services/dental-appliances" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">Dental Appliances</Link>
                <Link href="/services/dental-hygiene" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">Dental Hygiene</Link>
                <Link href="/services/dental-implants" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">Dental Implants</Link>
                <Link href="/services/family-dentistry" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">Family Dentistry</Link>
                <Link href="/services/restorative-dentistry" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">Restorative Dentistry</Link>
                <Link href="/services/sedation-dentistry" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">Sedation Dentistry</Link>
              </div>
              <div className="space-y-0.5">
                <p className="px-3 pt-3 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">CDCP</p>
                <Link href="/cdcp" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">CDCP Overview</Link>
              </div>
              <div className="space-y-0.5">
                <Link href="/team" onClick={() => setIsOpen(false)} className="block px-3 py-3 min-h-[44px] flex items-center text-base font-bold text-slate-900">Team</Link>
                <Link href="/team/jessica-sanford" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">Dr. Jessica Sanford</Link>
                <Link href="/team/erhan-tatlidil" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">Dr. Erhan Tatlidil</Link>
                <Link href="/team/sam-flynn" onClick={() => setIsOpen(false)} className="block px-6 py-2.5 min-h-[40px] flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">Dr. Sam Flynn</Link>
              </div>
              <Link href="/about" onClick={() => setIsOpen(false)} className="block px-3 py-3 min-h-[44px] flex items-center text-base font-semibold text-slate-700 hover:text-blue-600 rounded-xl active:bg-blue-50">About</Link>
              <Link href="/contact" onClick={() => setIsOpen(false)} className="block px-3 py-3 min-h-[44px] flex items-center text-base font-semibold text-slate-700 hover:text-blue-600 rounded-xl active:bg-blue-50">Contact</Link>
              
              <a 
                href="tel:9028274746" 
                className="flex items-center space-x-3 px-3 py-3.5 min-h-[48px] border-t border-slate-100 mt-4 text-blue-600 font-bold"
              >
                <Phone className="w-5 h-5 shrink-0" />
                <span>(902) 827-4746</span>
              </a>
              
              <div className="flex items-center space-x-4 px-3 py-3 border-t border-slate-100">
                <a 
                  href="https://www.facebook.com/porterslakedental" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a 
                  href="https://www.instagram.com/porterslakedental/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-pink-600 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Instagram"
                >
                  <Instagram className="w-6 h-6" />
                </a>
                <a 
                  href="https://maps.app.goo.gl/XRey61KqKj6c4SEw6" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-red-600 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Google Maps"
                >
                  <MapPin className="w-6 h-6" />
                </a>
              </div>

              {currentUser && currentUser.role === 'admin' ? (
                <Link href="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-3 min-h-[44px] flex items-center text-base font-medium text-blue-600">Admin Panel</Link>
              ) : (
                <Link 
                  href="/booking" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center space-x-2 w-full mt-4 min-h-[48px] px-6 py-3.5 rounded-2xl bg-blue-600 text-white text-base font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Book Appointment</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
};
