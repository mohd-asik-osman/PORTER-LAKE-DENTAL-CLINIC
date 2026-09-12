import { ServiceTemplate } from '@/components/ServiceTemplate';

export default function DentalHygiene() {
  return (
    <ServiceTemplate 
      title="Dental Hygiene in Porters Lake"
      description="You probably already know that it’s a good idea to visit your dentist every six months. These regular hygiene appointments are our opportunity to examine your teeth and gums. We will customize a hygiene plan and schedule based on your individual needs."
      moto="Preventative care for a lifetime of healthy smiles."
      subServices={[
        {
          title: "Scaling",
          description: "Removing plaque is one of the important treatments we’ll perform for you at a hygiene appointment. Scaling is a “deep cleaning” that involves reaching below the gumline to remove plaque and tartar buildup that could otherwise lead to inflammation, infection, or decay",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/scaling.jpg.webp?itok=JkdDimQx"
        },
        {
          title: "Polishing",
          description: "In a polishing treatment, we use a slightly abrasive paste to buff and polish your teeth after your scaling procedure. This helps remove stains on your teeth, but more importantly, helps remove plaque from cracks and crevices in your teeth. In other words, in another way we help prevent future decay.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/polishing.jpg.webp?itok=kWfJcqmF"
        },
        {
          title: "Fluoride",
          description: "Fluoride is a natural mineral that has been shown in countless scientific studies to safely build strong teeth and help prevent cavities. At your hygiene appointment, we’ll offer you a professional fluoride treatment—a quick, simple, and routine procedure that strengthens your teeth.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/flouride.jpg.webp?itok=gDOio06_"
        },
        {
          title: "Why regular appointments?",
          description: "Though your at-home dental regimen is probably very thorough, it can still be extremely difficult to remove all plaque and tartar buildup, especially from the gumline and tight spots. The bacteria that thrives in this plaque can cause gum disease and tooth decay. We use special tools and procedures—like the ones above—that remove this stubborn plaque. Regular visits will help you avoid future problems that stem from allowing bacteria to flourish and damage your teeth and gums.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/appointments.jpg.webp?itok=j4VJNbG-"
        }
      ]}
    />
  );
}
