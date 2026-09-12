import { ServiceTemplate } from '@/components/ServiceTemplate';

export default function FamilyDentistry() {
  return (
    <ServiceTemplate 
      title="Family Dentistry in Porters Lake"
      description="Every person, at every age, should be caring for their whole health—including teeth and gums—and taking the appropriate steps to ensure good health. When it comes to oral health, we want our patients to consider us partners in their pursuit of healthy living."
      moto="Gentle, comprehensive care for all ages."
      subServices={[
        {
          title: "Children’s dentistry",
          description: "Of course it’s important to us that we offer the services kids need to enjoy a lifetime of healthy teeth—and that includes helping them establish good oral health habits at a young age. But we also deliver all of our children’s dental services in a way that helps them feel at ease. Our friendly, fun, and thoughtful team engages with kids on their level—so parents and caregivers can be confident that their kids will enjoy their dentist visit!",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/children.jpg.webp?itok=KQepzZpx"
        },
        {
          title: "Sealants",
          description: "Based on a child’s needs and discussions with their parents or caregiver, we may recommend a dental sealant to help prevent future tooth decay. A dental sealant is a clear or tooth-coloured liquid resin that we apply to a child’s molars using a small brush, and dry using a blue LED light. The entire process is easy, quick, and completely painless. Research shows that this protective layer can help reduce the risk of cavities by about 80%.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/sealants.jpg.webp?itok=QV3QUPBN"
        },
        {
          title: "X-rays",
          description: "Periodic dental X-rays are a critical tool to help us identify problems, like cavities and impacted teeth, that would otherwise not be visible. X-rays use a low level of radiation to take pictures of teeth, gums, and bone. Typically children need to have X-rays more often than adults because we need to monitor the growth of their adult teeth.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/x-rays.jpg.webp?itok=4q28bOAe"
        },
        {
          title: "Wisdom teeth removal",
          description: "About 85% of people need to have their wisdom teeth removed because their jaw isn’t big enough for a third set of molars. The easiest way to prevent problems is to remove wisdom teeth before they grow through the gums. With minor surgery—performed in our office under local anesthetic and a sedative—we remove the problem teeth, and close the incision with sutures.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/wisdom-teeth.jpg.webp?itok=v9HMgDXf"
        }
      ]}
    />
  );
}
