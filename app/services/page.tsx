import type { Metadata } from 'next';
import { ServicesClient } from './ServicesClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Dental Services in Porters Lake | Porters Lake Dental',
  description:
    'Explore comprehensive family dental services at Porters Lake Dental Centre. Preventative hygiene, cosmetic dentistry, implants, appliances, and sedation in Nova Scotia.',
  pathname: '/services',
});

export default function ServicesPage() {
  return <ServicesClient />;
}
