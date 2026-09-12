import { ServiceTemplate } from '@/components/ServiceTemplate';

export default function DentalAppliances() {
  return (
    <ServiceTemplate 
      title="Dental Appliances in Porters Lake"
      description="Dental health and your overall health are very much connected. It’s why we offer a number of important treatments and products that can prevent problems or contribute to healthy living—whether directly related to your teeth or not."
      moto="Custom solutions for your unique dental challenges."
      subServices={[
        {
          title: "Snoring",
          description: "By disrupting the quality of your sleep, snoring can have a seriously negative impact on your health. Research has shown that stroke, depression, high blood pressure, and diabetes are all linked to sleep disorders. To help alleviate the problem of snoring, we offer treatments that include orthodontic treatment, bite appliances, or sleep counselling.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/snoring.jpg.webp?itok=CAVWbQBi"
        },
        {
          title: "Temporomandibular joint (TMJ) disorder",
          description: "TMJ disorder is a jaw problem that causes inflammation in your jaw bone, often leading to pain, headaches, and difficulty opening your mouth. A diagnosis of TMJ disorder begins with a thorough examination of your teeth and jaw, and treatments include medication, physiotherapy, orthodontic treatment of bite issues or grinding, and massage or stretches.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/tmj.jpg.webp?itok=ywpoxZb-"
        },
        {
          title: "Guards and bite correction",
          description: "Custom-made guards can help prevent your teeth from being injured by impacts and by nighttime grinding and clenching. If you play contact sports, a guard will help absorb the impact of a hit. And if you clench your jaw while you sleep, a bite appliance will prevent grinding by holding your teeth in place.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/guards.jpg.webp?itok=cmVndCpy"
        }
      ]}
    />
  );
}
