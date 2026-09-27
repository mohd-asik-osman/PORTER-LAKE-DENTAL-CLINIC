import type { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Porters Lake Dental Centre | Dentist in Porters Lake & Family Dentistry',
  description:
    'Compassionate, comprehensive family dentistry in Porters Lake, Nova Scotia. Accepting new patients, CDCP, emergency dental care, and preventive oral health.',
  pathname: '',
});

export default function Home() {
  return <LandingPage />;
}
