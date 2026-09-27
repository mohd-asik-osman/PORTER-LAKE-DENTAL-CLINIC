import type { Metadata } from 'next';
import { ContactClient } from './ContactClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Contact Porters Lake Dental Centre | Dentist in Porters Lake, NS',
  description:
    'Contact Porters Lake Dental Centre at 5141 Nova Scotia Trunk 7, Porters Lake, NS B3E 1M1. Call +1-902-827-4746 or email dentist@bellaliant.com. Easy clinic parking.',
  pathname: '/contact',
});

export default function ContactPage() {
  return <ContactClient />;
}
