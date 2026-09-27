import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DentistProfileClient } from './DentistProfileClient';
import { buildMetadata, DENTIST_PROFILES } from '@/lib/seo';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return Object.keys(DENTIST_PROFILES).map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dentist = DENTIST_PROFILES[id];

  if (!dentist) {
    return buildMetadata({
      title: 'Dentist Profile | Porters Lake Dental',
      description: 'Meet our dental team at Porters Lake Dental Centre.',
      pathname: `/team/${id}`,
      noindex: true,
    });
  }

  const roleText = dentist.role ? `, ${dentist.role}` : '';
  return buildMetadata({
    title: `${dentist.name}${roleText} | Porters Lake Dental`,
    description: `Meet ${dentist.name} at Porters Lake Dental Centre. ${dentist.specialty ? `Specializing in ${dentist.specialty}. ` : ''}${dentist.bio.slice(0, 140)}...`,
    pathname: `/team/${id}`,
    image: dentist.photo,
  });
}

export default async function DentistProfilePage({ params }: Props) {
  const { id } = await params;
  if (!DENTIST_PROFILES[id]) {
    notFound();
  }
  return <DentistProfileClient id={id} />;
}
