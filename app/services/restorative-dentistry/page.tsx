import { ServiceTemplate } from '@/components/ServiceTemplate';

export default function RestorativeDentistry() {
  return (
    <ServiceTemplate 
      title="Restorative Dentistry in Porters Lake"
      description="If you have a damaged tooth—whether from decay, injury, or some other cause—restoring the appearance and function of the tooth is something we should consider. We use various tools and techniques to repair teeth that need a little work."
      moto="Restore your oral health and function."
      subServices={[
        {
          title: "Endodontics",
          description: "More commonly known as a root canal, endodontics is a treatment that can repair and save a badly damaged or infected tooth. By removing the inner pulp of an infected tooth, we can save the tooth and prevent a future infection. Many people expect a root canal to be an unpleasant experience, but thanks to local anesthetic you shouldn’t feel a thing.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/endodontics.jpg.webp?itok=SpADPZcs"
        },
        {
          title: "Fillings",
          description: "One of the most common restorations we perform, a filling is used to treat a cavity in a tooth. In most cases, we fill cavities using composite resin, a strong, durable tooth-coloured material. Fillings help prevent further damage and decay, and restore the appearance and function of the tooth.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/filling.jpg.webp?itok=vaPd7LS7"
        },
        {
          title: "Crowns",
          description: "A crown is a dental prosthetic—made from a composite material that matches the colour of your natural tooth—that’s like a cap for the tooth that needs to be restored. We typically use crowns when a cavity is too large for a filling to be effective. Crowns are bonded to the natural tooth using a strong dental cement.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/crowns.jpg.webp?itok=OF0HYPto"
        },
        {
          title: "Periodontics",
          description: "Periodontics is all about the health of the tissues that support your teeth—your gums and your jawbone. We offer a number of periodontal services, some that can help prevent problems and some that treat existing problems. These include tooth extraction, scaling, root planing, gum grafting, and more.",
          imageUrl: "https://www.porterslakedental.com/sites/www.porterslakedental.com/files/styles/webp/public/images/periodontics.jpg.webp?itok=MxGOjlfy"
        }
      ]}
    />
  );
}
