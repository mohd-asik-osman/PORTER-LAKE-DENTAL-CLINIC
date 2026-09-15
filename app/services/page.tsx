'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { 
  Heart, Shield, Users, Activity, Zap, 
  ShieldCheck, ChevronLeft, ArrowRight,
  Star, Clock, CheckCircle2
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const SERVICES = [
  { 
    id: 'cosmetic-dentistry', 
    title: 'Cosmetic Dentistry', 
    description: 'Thanks to modern cosmetic dentistry treatments, any patient can improve the appearance of imperfect teeth. Veneers, crowns, teeth whitening, and Invisalign can really help boost confidence.',
    icon: Heart,
    image: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/cosmetic.jpg'
  },
  { 
    id: 'dental-appliances', 
    title: 'Dental Appliances', 
    description: 'If you have unique challenges like snoring, a misaligned bite, or TMJ, we have a number of services, including custom-made appliances, that can help make a real difference.',
    icon: Shield,
    image: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/appliances.jpg'
  },
  { 
    id: 'dental-hygiene', 
    title: 'Dental Hygiene', 
    description: 'Also referred to as preventative dentistry, oral hygiene appointments—including examinations, fluoride, and cleanings—are a critical way to protect yourself from tooth decay and other issues.',
    icon: Activity,
    image: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/hygiene.jpg'
  },
  { 
    id: 'dental-implants', 
    title: 'Dental Implants', 
    description: 'It’s never been easier to replace missing teeth. Dental implant procedures are a strong, long-lasting, and reliable way to restore the appearance and function of the teeth you’ve lost.',
    icon: ShieldCheck,
    image: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/dental-implants.jpg'
  },
  { 
    id: 'family-dentistry', 
    title: 'Family Dentistry', 
    description: 'Healthy teeth are important, no matter your age. Our family-friendly approach includes children’s dentistry services—like sealants and wisdom teeth removal—delivered with care and compassion.',
    icon: Users,
    image: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/family.jpg'
  },
  { 
    id: 'restorative-dentistry', 
    title: 'Restorative Dentistry', 
    description: 'By repairing damaged teeth and gums, we can improve the appearance, function, and overall health of your mouth. Fillings, crowns, periodontics and endodontics are a few of the treatments available.',
    icon: Zap,
    image: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/restorations.jpg'
  },
  { 
    id: 'sedation-dentistry', 
    title: 'Sedation Dentistry', 
    description: 'Our team is friendly and our clinic welcoming, but it’s still not unusual for some patients to feel anxiety about their visit. Sedation options are a safe and reliable way to feel more relaxed.',
    icon: Clock,
    image: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/sedation.jpg'
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {/* Header */}
      <header className="pt-6 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-blue-600 font-bold mb-3 sm:mb-4 hover:-translate-x-1 transition-transform" aria-label="Back to Home">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">Our Specialized <span className="text-gradient">Services</span></h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto mb-5 sm:mb-6 leading-relaxed">
            We offer a comprehensive list of services to meet the dental needs of you and your family. Using state-of-the-art technologies, our goal is to treat every patient with compassion and professionalism, which will have you leaving our office with a smile. Learn more about the services we offer at Porter&apos;s Lake Dental.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/services" className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all text-center flex items-center justify-center text-sm sm:text-base">Learn more</Link>
            <Link href="/booking" className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 sm:py-4 rounded-2xl bg-white text-slate-900 font-bold border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all text-center flex items-center justify-center text-sm sm:text-base">Book now</Link>
          </div>
        </div>
      </header>

      {/* Services Grid */}
      <section className="py-8 sm:py-12 lg:py-14 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {SERVICES.map((service, i) => (
            <motion.div 
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[40px] border border-white/40 shadow-xl hover:shadow-2xl hover:shadow-blue-100/50 transition-all group flex flex-col"
            >
              <div className="relative h-44 sm:h-48 w-full overflow-hidden">
                <Image 
                  src={service.image} 
                  alt={service.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 sm:left-6 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                  <service.icon className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <div className="p-5 sm:p-8 flex-grow flex flex-col">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mb-3 sm:mb-4">{service.title}</h3>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-6 sm:mb-8 flex-grow">{service.description}</p>
                
                <Link href={`/services/${service.id}`} className="inline-flex items-center space-x-2 text-blue-600 font-bold hover:space-x-3 transition-all mt-auto py-1.5 min-h-[44px]">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
