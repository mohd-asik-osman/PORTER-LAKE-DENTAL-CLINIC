import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { BackToTop } from '@/components/BackToTop';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_URL ||
  'https://porterslakedental.com';

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
  alternates: {
    canonical: '/',
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
        url: '/dental_pattern_v2.png',
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
    images: ['/dental_pattern_v2.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': ['Dentist', 'LocalBusiness', 'MedicalOrganization'],
  '@id': `${SITE_URL}/#dentist`,
  name: 'Porters Lake Dental Centre',
  alternateName: 'Porters Lake Dental',
  url: SITE_URL,
  telephone: '+1-902-827-4746',
  email: 'info@porterslakedental.com',
  priceRange: '$$',
  currenciesAccepted: 'CAD',
  paymentAccepted: 'Cash, Credit Card, Debit, Direct Insurance Billing, CDCP',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '5220 Highway 7, Unit 4',
    addressLocality: 'Porters Lake',
    addressRegion: 'NS',
    postalCode: 'B3E 1J8',
    addressCountry: 'CA',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 44.7397,
    longitude: -63.3005,
  },
  areaServed: [
    { '@type': 'City', name: 'Porters Lake' },
    { '@type': 'City', name: 'Lake Echo' },
    { '@type': 'City', name: 'Chezzetcook' },
    { '@type': 'City', name: 'Musquodoboit Harbour' },
    { '@type': 'City', name: 'Eastern Shore' },
    { '@type': 'AdministrativeArea', name: 'Halifax Regional Municipality' },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '08:00',
      closes: '17:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Friday'],
      opens: '08:00',
      closes: '14:00',
    },
  ],
  medicalSpecialty: 'Dentistry',
  isAcceptingNewPatients: true,
  hasMap: 'https://maps.google.com/?q=Porters+Lake+Dental+Centre',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
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

