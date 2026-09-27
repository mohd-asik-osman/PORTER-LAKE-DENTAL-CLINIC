import type { Metadata } from 'next';
import { TeamClient } from './TeamClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Our Dental Team in Porters Lake | Porters Lake Dental',
  description:
    'Meet the dedicated dentists, registered hygienists, and caring staff at Porters Lake Dental Centre providing personalized family dental care in Nova Scotia.',
  pathname: '/team',
});

export default function TeamPage() {
  return <TeamClient />;
}
