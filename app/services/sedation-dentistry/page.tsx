import { ServiceTemplate } from '@/components/ServiceTemplate';

export default function SedationDentistry() {
  return (
    <ServiceTemplate 
      title="Sedation Dentistry in Porters Lake"
      description="For our patients who find it difficult to relax at their appointment, we have a number of ways we can help them stay calm. Sedation is a safe, controlled, and effective way to relieve anxiety and help you have a more enjoyable treatment."
      moto="Relax and feel at ease during your visit."
      subServices={[
        {
          title: "Nitrous oxide",
          description: "Also called “laughing gas”, nitrous oxide has been safely and widely used in dentistry for decades. With this sedation option, patients inhale gas through a mask placed over their nose, and will feel the calming effects of the gas within a few minutes. The sedation effect fades quickly once the flow of gas stops, so you’ll be able to safely drive yourself home once the procedure is done.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/nitrous-oxide.jpg.webp?itok=stYNrK4q"
        }
      ]}
    />
  );
}
