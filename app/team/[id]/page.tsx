'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ChevronLeft, Mail, Phone, Calendar, ArrowRight, Award, GraduationCap, Heart } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const DENTISTS_DATA: Record<string, any> = {
  'jessica-sanford': {
    name: 'Dr. Jessica Sanford',
    role: 'Principal Dentist',
    specialty: 'Cosmetic & Restorative Dentistry',
    photo: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-sanford_0.jpg.webp?itok=fEHqj_V6',
    bio: 'Dr. Jessica Sanford is dedicated to providing her patients with the highest level of dental care. With a focus on cosmetic and restorative dentistry, she combines artistry with clinical excellence to create beautiful, healthy smiles.',
    education: ['Doctor of Dental Surgery (DDS)', 'Advanced Training in Cosmetic Dentistry'],
    memberships: ['Canadian Dental Association', 'Nova Scotia Dental Association'],
    interests: ['Smile Makeovers', 'Invisalign', 'Patient Comfort']
  },
  'erhan-tatlidil': {
    name: 'Dr. Erhan Tatlidil',
    role: 'Associate Dentist',
    specialty: 'Oral Surgery & Implants',
    photo: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-erhan-tatlidil.jpg.webp?itok=1MfMueYL',
    bio: 'Dr. Tatlidil was born and raised in Cole Harbour/Dartmouth, NS. He has a special interest in endodontics, surgical extractions, implant placement, as well as bone grafting and CEREC crownwork. He completed his Doctor of Dental Surgery degree at Dalhousie University in 2009 after completing his undergraduate degree there.\n\nDr. Tatlidil is dedicated to providing excellent service to his patients, and continues to immerse himself in leading edge continuing education. This includes studying at Seattle’s Kois Center for Aesthetic, Occlusion, and Restorative Dentistry, and study of implant dentistry at the gIDE Implant Institute in Los Angeles.\n\nDr. Tatlidil is an active member of numerous dental societies and associations, and loves spending time with his family and friends. He golfs every chance he gets and is active in basketball leagues and enjoys biking as well as weight training.',
    education: ['Doctor of Dental Surgery (DDS) - Dalhousie University (2009)', 'Undergraduate Degree - Dalhousie University', 'Kois Center for Aesthetic, Occlusion, and Restorative Dentistry', 'gIDE Implant Institute - Los Angeles'],
    memberships: ['Nova Scotia Dental Association', 'Canadian Dental Association'],
    interests: ['Endodontics', 'Surgical Extractions', 'Implant Placement', 'Bone Grafting', 'CEREC Crownwork', 'Golfing', 'Basketball', 'Biking', 'Weight Training']
  },
  'sam-flynn': {
    name: 'Dr. Sam Flynn',
    role: 'Associate Dentist',
    specialty: 'General & Family Dentistry',
    photo: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-sam-flynn.webp?itok=V-MMFOI5',
    bio: "Dr Flynn was born and raised in Yarmouth, NS. He earned his Doctor of Dental Medicine degree at the Université de Montréal in 2019, after completing a Bachelor’s of Science degree at the Université de Moncton. He then completed a one-year General Practice Residency at Saint Francis Hospital and Medical Center in Hartford, Connecticut, USA. Dr. Flynn has spent most of his career in Northern Canada (Yukon and Northwest Territories) but is excited to be back in the province he's always called home.\n\nDr Flynn enjoys performing all areas of general dentistry, with a special interest in root canal therapy and oral surgery. He is passionate about reducing the stigma around dental anxiety. With qualifications in mild-moderate dental sedation, he hopes to create a safe and inviting environment for his patients.\n\nDr Flynn is an enthusiastic lifelong learner. Aside from taking numerous continuing education courses in clinical dentistry, he also has a passion for learning languages. He is fluent in English, French, and Spanish, which allows him to effectively communicate with a wide range of patients. Additionally, he is currently learning Brazilian Portuguese and Arabic. Outside of work, he enjoys spending time with his partner, his 1 year old daughter, and their two Doodles. You can find them at the beach, hiking, or road-tripping together in their free time.",
    education: ['Doctor of Dental Medicine (DMD) - Université de Montréal (2019)', 'General Practice Residency - Saint Francis Hospital (Connecticut)', 'Bachelor of Science - Université de Moncton'],
    memberships: ['Nova Scotia Dental Association', 'Canadian Dental Association'],
    interests: ['Root Canal Therapy', 'Oral Surgery', 'Dental Sedation', 'Dental Anxiety Management', 'Languages (English, French, Spanish, Portuguese, Arabic)', 'Hiking', 'Road-tripping']
  }
};

export default function DentistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const dentist = DENTISTS_DATA[id];

  if (!dentist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-bold mb-4">Dentist not found</h1>
        <Link href="/team" className="text-blue-600 hover:underline">Back to Team</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Navbar />
      
      <main className="pt-20 sm:pt-28 lg:pt-32 pb-12 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 sm:mb-12"
          >
            <Link href="/team" className="inline-flex items-center space-x-2 text-slate-400 hover:text-blue-600 font-medium transition-colors group" aria-label="Back to Team">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs uppercase tracking-widest">Back to Team</span>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 items-start">
            {/* Left Column: Image & Quick Info */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[60px] sm:rounded-[120px] shadow-2xl shadow-slate-200/50 mb-6 sm:mb-8 max-w-sm sm:max-w-none mx-auto">
                <Image 
                  src={dentist.photo} 
                  alt={dentist.name} 
                  fill 
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-[40px] border border-white/40 space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Email</p>
                    <p className="text-slate-900 font-medium text-xs sm:text-base truncate">info@porterslakedental.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                    <p className="text-slate-900 font-medium text-xs sm:text-base">(902) 827-4746</p>
                  </div>
                </div>
                <Link 
                  href="/booking"
                  className="flex items-center justify-center space-x-2 w-full min-h-[48px] py-3.5 sm:py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all text-sm sm:text-base"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Book Appointment</span>
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Bio & Details */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-7 space-y-8 sm:space-y-12"
            >
              <div>
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em] mb-2 sm:mb-4 block"
                >
                  {dentist.role}
                </motion.span>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-slate-900 mb-2 sm:mb-4 tracking-tight">
                  {dentist.name}
                </h1>
                <p className="text-base sm:text-xl text-blue-600 font-medium italic mb-4 sm:mb-8">
                  {dentist.specialty}
                </p>
                <div className="h-px w-24 bg-blue-200 mb-6 sm:mb-8" />
                <div className="text-sm sm:text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                  {dentist.bio}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 flex items-center space-x-3">
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                    <span>Education</span>
                  </h3>
                  <ul className="space-y-2.5 sm:space-y-3">
                    {dentist.education.map((item: string) => (
                      <li key={item} className="flex items-start space-x-3 text-xs sm:text-base text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-200 mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 flex items-center space-x-3">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                    <span>Memberships</span>
                  </h3>
                  <ul className="space-y-2.5 sm:space-y-3">
                    {dentist.memberships.map((item: string) => (
                      <li key={item} className="flex items-start space-x-3 text-xs sm:text-base text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-200 mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 flex items-center space-x-3">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                  <span>Areas of Interest</span>
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {dentist.interests.map((item: string) => (
                    <span key={item} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 text-slate-600 text-xs sm:text-sm font-medium rounded-full border border-slate-100">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
