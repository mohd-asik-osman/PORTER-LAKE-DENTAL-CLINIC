import type { Metadata } from 'next';

/**
 * Porters Lake Dental Centre - SEO & Canonical URL Configuration
 * Single source of truth for site URLs, indexing rules, metadata generation, and Dentist schema.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  process.env.APP_URL ||
  'https://porterslakedental.com'
).replace(/\/$/, '');

/**
 * Determine whether search engines should index the website.
 * Keeps demo/preview/staging sites safely noindex until the approved production launch.
 */
export function isIndexable(): boolean {
  if (process.env.NEXT_PUBLIC_INDEXABLE === 'true') return true;
  if (process.env.NEXT_PUBLIC_INDEXABLE === 'false') return false;
  if (process.env.NEXT_PUBLIC_IS_DEMO === 'true') return false;
  if (
    process.env.SITE_ENV === 'preview' ||
    process.env.SITE_ENV === 'staging' ||
    process.env.SITE_ENV === 'demo'
  ) {
    return false;
  }

  // Safety check: prevent demo/preview domains from being indexed
  const lowerUrl = SITE_URL.toLowerCase();
  if (
    lowerUrl.includes('netlify.app') ||
    lowerUrl.includes('run.app') ||
    lowerUrl.includes('localhost') ||
    lowerUrl.includes('127.0.0.1')
  ) {
    return false;
  }

  return true;
}

export interface PageSeoOptions {
  title: string;
  description: string;
  pathname?: string;
  image?: string;
  noindex?: boolean;
}

/**
 * Generates consistent, page-specific metadata with absolute canonical URL,
 * OpenGraph, Twitter cards, and environment-aware robots directives.
 */
export function buildMetadata({
  title,
  description,
  pathname = '',
  image = '/og-image.jpg',
  noindex = false,
}: PageSeoOptions): Metadata {
  const canonicalUrl = `${SITE_URL}${pathname}`;
  const imageUrl = image.startsWith('http')
    ? image
    : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
  const shouldIndex = !noindex && isIndexable();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Porters Lake Dental Centre',
      locale: 'en_CA',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} | Porters Lake Dental Centre`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: shouldIndex
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
}

/**
 * Verified Dentist JSON-LD schema with exact clinic information.
 * Does not invent coordinates, ratings, reviews, or medical success statistics.
 */
export const dentistJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dentist',
  '@id': `${SITE_URL}/#dentist`,
  name: 'Porters Lake Dental Centre',
  alternateName: 'Porters Lake Dental',
  url: SITE_URL,
  telephone: '+1-902-827-4746',
  email: 'dentist@bellaliant.com',
  priceRange: '$$',
  currenciesAccepted: 'CAD',
  paymentAccepted: 'Cash, Credit Card, Debit Card, Direct Insurance Billing, CDCP',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '5141 Nova Scotia Trunk 7',
    addressLocality: 'Porters Lake',
    addressRegion: 'NS',
    postalCode: 'B3E 1M1',
    addressCountry: 'CA',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday'],
      opens: '08:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Thursday'],
      opens: '08:00',
      closes: '17:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Friday'],
      opens: '08:00',
      closes: '15:00',
    },
  ],
  medicalSpecialty: 'Dentistry',
  isAcceptingNewPatients: true,
};

/**
 * Public Dentist Profiles Data
 */
export const DENTIST_PROFILES: Record<
  string,
  {
    name: string;
    role: string;
    specialty: string;
    photo: string;
    bio: string;
    education?: string[];
    memberships?: string[];
    interests?: string[];
  }
> = {
  'jessica-sanford': {
    name: 'Dr. Jessica Sanford',
    role: 'Principal Dentist',
    specialty: 'Cosmetic & Restorative Dentistry',
    photo:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-sanford_0.jpg.webp?itok=fEHqj_V6',
    bio: 'Dr. Jessica Sanford is dedicated to providing her patients with the highest level of dental care. With a focus on cosmetic and restorative dentistry, she combines artistry with clinical excellence to create beautiful, healthy smiles.',
    education: [
      'Doctor of Dental Surgery (DDS)',
      'Advanced Training in Cosmetic Dentistry',
    ],
    memberships: [
      'Canadian Dental Association',
      'Nova Scotia Dental Association',
    ],
    interests: ['Smile Makeovers', 'Invisalign', 'Patient Comfort'],
  },
  'erhan-tatlidil': {
    name: 'Dr. Erhan Tatlidil',
    role: 'Associate Dentist',
    specialty: 'Oral Surgery & Implants',
    photo:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-erhan-tatlidil.jpg.webp?itok=1MfMueYL',
    bio: 'Dr. Tatlidil was born and raised in Cole Harbour/Dartmouth, NS. He has a special interest in endodontics, surgical extractions, implant placement, as well as bone grafting and CEREC crownwork. He completed his Doctor of Dental Surgery degree at Dalhousie University in 2009 after completing his undergraduate degree there.',
    education: [
      'Doctor of Dental Surgery (DDS) - Dalhousie University (2009)',
      'Undergraduate Degree - Dalhousie University',
      'Kois Center for Aesthetic, Occlusion, and Restorative Dentistry',
      'gIDE Implant Institute - Los Angeles',
    ],
    memberships: [
      'Nova Scotia Dental Association',
      'Canadian Dental Association',
    ],
    interests: [
      'Endodontics',
      'Surgical Extractions',
      'Implant Placement',
      'Bone Grafting',
      'CEREC Crownwork',
    ],
  },
  'sam-flynn': {
    name: 'Dr. Sam Flynn',
    role: 'Associate Dentist',
    specialty: 'General & Family Dentistry',
    photo:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dr-sam-flynn.webp?itok=V-MMFOI5',
    bio: 'Dr. Flynn was born and raised in Yarmouth, NS. He earned his Doctor of Dental Medicine degree at the Université de Montréal in 2019, after completing a Bachelor of Science degree at the Université de Moncton. He then completed a one-year General Practice Residency at Saint Francis Hospital and Medical Center in Hartford, Connecticut, USA. Dr. Flynn performs all areas of general dentistry, with special interests in root canal therapy, oral surgery, and dental sedation.',
    education: [
      'Doctor of Dental Medicine (DMD) - Université de Montréal (2019)',
      'General Practice Residency - Saint Francis Hospital (Connecticut)',
      'Bachelor of Science - Université de Moncton',
    ],
    memberships: [
      'Nova Scotia Dental Association',
      'Canadian Dental Association',
    ],
    interests: [
      'Root Canal Therapy',
      'Oral Surgery',
      'Dental Sedation',
      'Dental Anxiety Management',
    ],
  },
  'dalia-nasser': {
    name: 'Dr. Dalia Nasser',
    role: 'Associate Dentist',
    specialty: 'Family Dentistry',
    photo:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/placeholder.png.webp?itok=hF4Kmd0Z',
    bio: 'Dr. Dalia Nasser provides comprehensive, compassionate dental care for families and patients of all ages at Porters Lake Dental Centre.',
  },
};

/**
 * Public Service Pages Metadata
 */
export const SERVICES_META: Record<
  string,
  {
    title: string;
    description: string;
    image: string;
  }
> = {
  'cosmetic-dentistry': {
    title: 'Cosmetic Dentistry in Porters Lake | Porters Lake Dental',
    description:
      'Transform your smile with cosmetic dental care in Porters Lake, NS. Professional teeth whitening, porcelain veneers, dental crowns, bonding, and Invisalign.',
    image:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/cosmetic.jpg',
  },
  'dental-appliances': {
    title: 'Dental Appliances & Night Guards | Porters Lake Dental',
    description:
      'Custom-made dental appliances for TMJ pain relief, teeth grinding (bruxism), snoring, sleep apnea, and sports mouthguards in Porters Lake, Nova Scotia.',
    image:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/appliances.jpg',
  },
  'dental-hygiene': {
    title: 'Dental Hygiene in Porters Lake | Porters Lake Dental',
    description:
      'Preventative dental hygiene care in Porters Lake, NS. Comprehensive oral examinations, gentle scaling, stain-removing polishing, and fluoride treatments.',
    image:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/hygiene.jpg',
  },
  'dental-implants': {
    title: 'Dental Implants in Porters Lake | Porters Lake Dental',
    description:
      'Permanent, natural-looking tooth replacement with dental implants and implant-supported crowns in Porters Lake, Nova Scotia.',
    image:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/dental-implants.jpg',
  },
  'family-dentistry': {
    title: 'Family Dentistry in Porters Lake | Porters Lake Dental',
    description:
      'Compassionate family dental care for toddlers, children, teens, adults, and seniors in Porters Lake, NS. Gentle checkups, sealants, fillings, and cleanings.',
    image:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/family.jpg',
  },
  'restorative-dentistry': {
    title: 'Restorative Dentistry in Porters Lake | Porters Lake Dental',
    description:
      'Restore dental strength, bite function, and appearance with tooth-coloured composite fillings, crowns, bridges, and root canal therapy in Porters Lake.',
    image:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/restorations.jpg',
  },
  'sedation-dentistry': {
    title: 'Sedation Dentistry in Porters Lake | Porters Lake Dental',
    description:
      'Comfortable, anxiety-free dental appointments with safe dental sedation options in Porters Lake, Nova Scotia. Relax while receiving quality dental care.',
    image:
      'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/images/sedation.jpg',
  },
};
