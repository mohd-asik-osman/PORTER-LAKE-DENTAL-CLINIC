import type { Metadata } from 'next';
import BookingClient from './BookingClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Book an Appointment | Porters Lake Dental Centre',
  description:
    'Book your dental appointment online at Porters Lake Dental Centre in Porters Lake, Nova Scotia. Easy scheduling for cleanings, exams, and family dental care.',
  pathname: '/booking',
});

export default function BookingPage() {
  return <BookingClient />;
}
