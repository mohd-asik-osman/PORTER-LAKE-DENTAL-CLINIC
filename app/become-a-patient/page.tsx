import type { Metadata } from 'next';
import { BecomeAPatientClient } from './BecomeAPatientClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Become a Patient in Porters Lake | Porters Lake Dental',
  description:
    'Join Porters Lake Dental Centre as a new patient. Accepting Canadian Dental Care Plan (CDCP) and private insurance. Download forms and book your first visit today.',
  pathname: '/become-a-patient',
});

export default function BecomeAPatientPage() {
  return <BecomeAPatientClient />;
}
