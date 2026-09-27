import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { BackToTop } from '@/components/BackToTop';
import { SITE_URL, isIndexable, dentistJsonLd } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const indexable = isIndexable();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Porters Lake Dental Centre | Dentist in Porters Lake & Family Dentistry',
    template: '%s | Porters Lake Dental Centre',
  },
  description:
    'Compassionate, comprehensive family dentistry in Porters Lake, Nova Scotia. Accepting new patients, Canadian Dental Care Plan (CDCP), emergency dental care, hygiene, and cosmetic dental treatments.',
  keywords: [
    'Dentist in Porters Lake',
    'Porters Lake Dental Centre',
    'Family Dentistry Porters Lake',
    'Dentist Nova Scotia',
    'Emergency Dentist Porters Lake',
    'Canadian Dental Care Plan Porters Lake',
    'CDCP Dentist Nova Scotia',
    'Teeth Cleaning Porters Lake',
    'Dental Clinic Eastern Shore NS',
    'Dentist Lake Echo',
  ],
  authors: [{ name: 'Porters Lake Dental Centre' }],
  creator: 'Porters Lake Dental Centre',
  publisher: 'Porters Lake Dental Centre',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  openGraph: {
    title: 'Porters Lake Dental Centre | Dentist in Porters Lake & Family Dentistry',
    description:
      'Compassionate, comprehensive family dentistry in Porters Lake, Nova Scotia. Accepting new patients, CDCP, emergency dental care, and preventive oral health.',
    url: SITE_URL,
    siteName: 'Porters Lake Dental Centre',
    locale: 'en_CA',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Porters Lake Dental Centre - Modern Family Dental Care in Porters Lake, NS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Porters Lake Dental Centre | Dentist in Porters Lake, NS',
    description:
      'Compassionate family dentistry in Porters Lake, Nova Scotia. Accepting new patients, CDCP, and emergency dental care.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  robots: indexable
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      }
    : {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dentistJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased bg-slate-50 text-slate-900">
        <AuthProvider>
          {children}
          <BackToTop />
        </AuthProvider>
      </body>
    </html>
  );
}
