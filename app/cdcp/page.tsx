import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function CDCPPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 lg:pt-12 pb-8 sm:pb-16">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-3 sm:mb-4 font-sans leading-tight">
          Canadian Dental Care Plan (CDCP) — Accepted at Our Dental Office
        </h1>
        
        <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 leading-relaxed">
          We proudly accept the Canadian Dental Care Plan (CDCP). Learn who qualifies, what&apos;s covered, and how to apply for this federal dental benefit program.
        </p>

        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl font-semibold text-slate-900 mb-3 sm:mb-4">We Accept the Canadian Dental Care Plan (CDCP)</h2>
          <p className="text-sm sm:text-lg text-slate-700 leading-relaxed mb-4">
            Our dental office is proud to accept the Canadian Dental Care Plan (CDCP), a federal government benefit program administered by Health Canada. The CDCP is designed to help cover a portion of dental treatment costs for eligible Canadians — making oral care more accessible for those who qualify.
          </p>
          <p className="text-sm sm:text-lg text-slate-700 leading-relaxed font-semibold italic bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
            Please note: The CDCP is a cost-sharing benefit, not a free dental plan. Coverage varies by service, and not all treatments may be included under your plan.
          </p>
        </section>

        <section className="mb-8 sm:mb-12 bg-blue-50 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-blue-100">
          <h3 className="text-base sm:text-2xl font-semibold text-slate-900 mb-3 sm:mb-4">For complete details on covered and non-covered services, visit the official Government of Canada page:</h3>
          <a 
              href="https://www.canada.ca/en/services/benefits/dental/dental-care-plan.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-[44px] text-sm sm:text-lg font-bold text-blue-700 hover:text-blue-900 underline underline-offset-4"
          >
            🔗 Canadian Dental Care Plan – canada.ca
          </a>
        </section>

        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl font-semibold text-slate-900 mb-4 sm:mb-6">Do You Qualify for the CDCP?</h2>
          <p className="text-sm sm:text-lg text-slate-700 mb-4 sm:mb-6">
            To be eligible for the Canadian Dental Care Plan, you must meet all four of the following requirements:
          </p>
          <ul className="space-y-3 sm:space-y-4 text-sm sm:text-lg text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-xl sm:text-2xl shrink-0">✅</span>
              <span>You do not have access to private dental insurance</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl sm:text-2xl shrink-0">✅</span>
              <span>You (and your spouse or common-law partner, if applicable) have filed your Canadian tax return so your family income can be assessed</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl sm:text-2xl shrink-0">✅</span>
              <span>Your adjusted family net income is less than $90,000</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl sm:text-2xl shrink-0">✅</span>
              <span>You are a Canadian resident for tax purposes</span>
            </li>
          </ul>
        </section>

        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl font-semibold text-slate-900 mb-3 sm:mb-4">Who Can Apply?</h2>
          <p className="text-sm sm:text-lg text-slate-700 leading-relaxed">
            Eligible Canadians of all ages can now apply for the CDCP. There is no age restriction — children, adults, and seniors may all qualify if they meet the eligibility criteria above.
          </p>
          <a
            href="https://www.canada.ca/en/services/benefits/dental/dental-care-plan/apply.html#apply-online"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center mt-6 min-h-[48px] px-8 py-3.5 bg-blue-600 text-white font-semibold text-sm sm:text-base rounded-full hover:bg-blue-700 active:scale-95 transition-all w-full sm:w-auto"
          >
            Apply Now
          </a>
        </section>

        <section className="bg-amber-50 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-amber-100">
          <h3 className="text-lg sm:text-2xl font-semibold text-amber-950 mb-2 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <span className="shrink-0">⚠️</span>
              <span>Important: Annual Renewal Required</span>
          </h3>
          <p className="text-sm sm:text-lg text-amber-900 leading-relaxed">
            The CDCP is not a one-time enrollment. You must reapply each year to continue receiving this benefit. Our team is happy to assist you with any questions about your coverage at your next visit.
          </p>
        </section>
      </div>
      <Footer />
    </div>
  );
}
