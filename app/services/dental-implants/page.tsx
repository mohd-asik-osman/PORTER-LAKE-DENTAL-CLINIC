import { ServiceTemplate } from '@/components/ServiceTemplate';

export default function DentalImplants() {
  return (
    <ServiceTemplate 
      title="Dental Implants in Porters Lake"
      description="If you’re missing one or more teeth, implants are usually the best way to give you back what you’ve lost. Made from titanium, and placed into living bone—just like a natural tooth’s root—dental implants are a strong, long-lasting solution."
      moto="Restore your smile with confidence."
      subServices={[
        {
          title: "Single implants",
          description: "A single dental implant is a great way to restore your ability to chew and talk, protect the health of adjacent teeth, and of course fill that gap in your smile. With a single implant we surgically place a titanium implant in your jaw, attach a piece called an abutment, and then attach a prosthetic tooth to the abutment. You can expect your new implant to last decades, if not a lifetime",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/single-implant.jpg.webp?itok=Vq_qXoJP"
        },
        {
          title: "Multiple implants",
          description: "For patients who have several missing teeth in a row, we typically don’t replace them all with individual implants. Rather, we’ll place an implant at both ends of the gap, and then use a dental bridge between the implants. It’s a great way to secure a bridge without have to rely on the natural teeth as anchor points.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/multiple-implants.jpg.webp?itok=6Le8BgN8"
        },
        {
          title: "Implant-supported dentures",
          description: "Regular dentures tend to shift and slip in your mouth. With implant-supported dentures though, a number of implants—typically two—act as anchor points for a denture to be attached to. Since the denture is firmly attached to immovable implants, your chewing power—and appearance—is completely restored. With this solution, your dentures remain removable.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/dental-implants_0.jpg.webp?itok=DuwVYGjd"
        },
        {
          title: "Fixed-implant dentures",
          description: "This solution to multiple missing teeth is a lot like implant-supported dentures in that they use implants to securely anchor your dentures in place. The difference is that with this solution, your denture arch is permanently attached to four or more dental implants—only your dentist can remove them. They feel exactly like the natural teeth you miss.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/fixed-implant-dentures.jpg.webp?itok=bs7t7bWn"
        }
      ]}
    />
  );
}
