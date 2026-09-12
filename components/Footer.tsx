'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer id="contact" className="bg-slate-900 text-slate-300 pt-12 sm:pt-24 pb-8 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12 sm:mb-16">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 sm:mb-8">
              <Logo className="h-8 sm:h-10 w-auto" light />
            </Link>
            <p className="text-slate-400 text-sm mb-6 sm:mb-8 leading-relaxed">
              For over 25 years, our locally owned and operated practice has been proudly serving the Porters Lake community.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <a 
                href="https://www.facebook.com/porterslakedental" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/porterslakedental/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://maps.app.goo.gl/XRey61KqKj6c4SEw6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                aria-label="Google Maps"
              >
                <MapPin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-8 tracking-tight">Quick Links</h4>
            <ul className="space-y-2.5 sm:space-y-4">
              {[
                { name: 'Home', href: '/' },
                { name: 'Services', href: '/services' },
                { name: 'Our Team', href: '/team' },
                { name: 'About Us', href: '/about' },
                { name: 'Contact', href: '/contact' },
                { name: 'Admin Login', href: '/auth' },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-blue-500 transition-colors flex items-center gap-2 group min-h-[36px] text-sm">
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-8 tracking-tight">Contact Info</h4>
            <ul className="space-y-4 sm:space-y-6">
              <li className="flex gap-3 sm:gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs sm:text-sm mb-0.5 sm:mb-1">Our Location</p>
                  <p className="text-slate-400 text-xs sm:text-sm">5141 Nova Scotia Trunk 7, Porters Lake, NS B3E 1M1</p>
                </div>
              </li>
              <li className="flex gap-3 sm:gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs sm:text-sm mb-0.5 sm:mb-1">Phone Number</p>
                  <p className="text-slate-400 text-xs sm:text-sm">(902) 827-4746</p>
                </div>
              </li>
              <li className="flex gap-3 sm:gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs sm:text-sm mb-0.5 sm:mb-1">Email Address</p>
                  <p className="text-slate-400 text-xs sm:text-sm">hello@porterslakedental.com</p>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-8 tracking-tight">Opening Hours</h4>
            <ul className="space-y-2.5 sm:space-y-4">
              <li className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-400">Mon - Wed</span>
                <span className="text-white font-bold">8:00 AM - 6:00 PM</span>
              </li>
              <li className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-400">Thursday</span>
                <span className="text-white font-bold">8:00 AM - 5:00 PM</span>
              </li>
              <li className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-400">Friday</span>
                <span className="text-white font-bold">8:00 AM - 3:00 PM</span>
              </li>
              <li className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-400">Sat - Sun</span>
                <span className="text-red-400 font-bold uppercase tracking-wider text-[10px]">Closed</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 sm:pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-center md:text-left">
          <p className="text-slate-500 text-xs sm:text-sm">
            © 2026 Porters Lake Dental Centre. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-slate-500">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/auth" className="hover:text-white transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Removed default export
