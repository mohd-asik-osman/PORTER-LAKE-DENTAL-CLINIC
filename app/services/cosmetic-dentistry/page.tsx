import { ServiceTemplate } from '@/components/ServiceTemplate';

export default function CosmeticDentistry() {
  const subServices = [
    { 
      title: 'Veneers', 
      description: 'Thin shells made from a strong, tooth-coloured resin, veneers are permanently bonded to a tooth’s front surface. Veneers can correct a range of cosmetic imperfections, including teeth that are discoloured, chipped, or smaller-than-average.',
      imageUrl: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/veneers.jpg.webp?itok=FlWVqHpr'
    },
    { 
      title: 'Crowns', 
      description: 'Dental crowns are porcelain or ceramic caps that are permanently bonded to the top of damaged teeth. We typically use crowns to restore the shape of teeth that are too badly damaged to be corrected using fillings.',
      imageUrl: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/crowns.jpg.webp?itok=OF0HYPto'
    },
    { 
      title: 'Bonding', 
      description: 'Dental bonding, also called composite bonding, is a procedure that involves using a tooth-coloured composite resin material to reshape teeth, remove the appearance of stains or chips, or correct spacing between teeth.',
      imageUrl: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/bonding.jpg.webp?itok=LtuEYuZB'
    },
    { 
      title: 'Teeth whitening', 
      description: 'We offer at-home and in-office options to help you get a whiter, brighter smile. Our at-home kit includes a whitening gel and specially-designed trays that you put on your teeth once a day for two weeks. Our in-office whitening treatment usually takes just one appointment, and involves a chair-side whitening lamp and light-activated gel.',
      imageUrl: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/whitening.jpg.webp?itok=2GWQnypm'
    },
    { 
      title: 'Invisalign®', 
      description: 'Invisalign is one of the easiest ways to straighten your teeth. Rather than metal wires, as is the case with braces, Invisalign uses clear plastic aligners that you slip over your teeth and can remove to brush and eat. Patients typically need to visit the office every few weeks to get a new set of aligners.',
      imageUrl: 'https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/invisalign_0.jpg.webp?itok=DZ7-JGsf'
    },
  ];

  return (
    <ServiceTemplate 
      title="Cosmetic Dentistry"
      description="Thanks to modern cosmetic dentistry treatments, any patient can improve the appearance of imperfect teeth. Veneers, crowns, teeth whitening, and Invisalign can really help boost confidence."
      moto="Enhance your smile, boost your confidence."
      subServices={subServices}
    />
  );
}
