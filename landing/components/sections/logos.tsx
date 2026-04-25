import Marquee from "@/landing/components/magicui/marquee";
import Image from "next/image";

const compagnies = [
  {
    name: "EasyTrip",
    logo: "/images/landing/compagnies/easytrip.svg"
  },
  {
    name: "Diora",
    logo: "/images/landing/compagnies/diora.svg"
  },
  {
    name: "Nimba Miel",
    logo: "/images/landing/compagnies/nimbamiel.svg"
  },
  {
    name: "It Solutions",
    logo: "/images/landing/compagnies/itsolutions.svg"
  },
  {
    name: "Avitech Guinée",
    logo: "/images/landing/compagnies/avitech.svg"
  },
  {
    name: "Faabeh",
    logo: "/images/landing/compagnies/faabeh.svg"
  },
  {
    name: "Broderix",
    logo: "/images/landing/compagnies/broderix.svg"
  }
];

export default function Logos() {
  return (
    <section id="logos">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <h3 className="text-center text-sm font-semibold text-gray-500">
          PARTENAIRES DE CONFIANCE
        </h3>
        <div className="relative mt-6">
          <style>
            {`
              .logo-img {
                filter: grayscale(1) brightness(0.8) opacity(0.3);
                transition: filter 0.3s, opacity 0.3s;
              }
              .logo-hover:hover .logo-img {
                filter: none;
                opacity: 1;
              }
              @media (prefers-color-scheme: dark) {
                .logo-img {
                  filter: grayscale(1) invert(1) brightness(0.7) opacity(0.3);
                }
                .logo-hover:hover .logo-img {
                  filter: invert(0) brightness(1);
                  opacity: 1;
                }
              }
            `}
          </style>
          <Marquee className="max-w-full [--duration:40s]">
            {compagnies.map((c, idx) => (
              <div
                key={idx}
                className="logo-hover flex items-center justify-center h-20 w-48 transition"
              >
                <Image
                  width={112}
                  height={40}
                  src={c.logo}
                  className="logo-img h-20 w-48"
                  alt={c.name}
                  draggable={false}
                />
              </div>
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 h-full w-1/3 bg-gradient-to-r from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/3 bg-gradient-to-l from-background"></div>
        </div>
      </div>
    </section>
  );
}
