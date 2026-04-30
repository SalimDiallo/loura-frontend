import Marquee from "@/landing/components/magicui/marquee";
import Image from "next/image";
import Link from "next/link";

type Compagnie = {
  name: string;
  logo: string;
};

const compagnies: Compagnie[] = [
  { name: "EasyTrip", logo: "/images/landing/compagnies/easytrip.svg" },
  { name: "Diora", logo: "/images/landing/compagnies/diora.svg" },
  { name: "Nimba Miel", logo: "/images/landing/compagnies/nimbamiel.svg" },
  { name: "Avitech Guinée", logo: "/images/landing/compagnies/avitech.svg" },
  { name: "It Solutions", logo: "/images/landing/compagnies/itsolutions.svg" },
  { name: "Faabeh", logo: "/images/landing/compagnies/faabeh.svg" },
  { name: "Broderix", logo: "/images/landing/compagnies/broderix.svg" },
  { name: "Time Informatique", logo: "/images/landing/compagnies/timeinformatique.svg" },
];

export default function Logos() {
  return (
    <section
      id="company"
      className="flex flex-col items-center justify-center gap-8 py-16 pt-24 w-full relative px-6"
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tight text-center text-balance pb-2">
        <span className="font-display font-bold">Ils</span>
        <span className="text-muted-foreground font-normal"> nous font </span>
        <span className="font-display font-bold italic">confiance</span>
      </h2>
      <div className="relative w-full max-w-6xl overflow-hidden border-y border-border z-20 py-4 bg-background/70">
        {/* Left shadow */}
        <div
          aria-hidden
          className="pointer-events-noned absolute left-0 top-0 h-full w-14 bg-gradient-to-r from-background/80 via-background/40 to-transparent z-30"
          style={{}}
        />
        {/* Right shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-full w-14 bg-gradient-to-l from-background/80 via-background/40 to-transparent z-30"
          style={{}}
        />
        <Marquee className="[--gap:2.5rem]" pauseOnHover repeat={4}>
          {compagnies.map((c) => (
            <Link
              href="#"
              key={c.name}
              className="group flex items-center justify-center h-24 px-8 py-2 relative opacity-90 hover:opacity-100 transition-opacity duration-300"
              tabIndex={-1}
              aria-label={c.name}
            >
              <Image
                src={c.logo}
                alt={c.name}
                width={160}
                height={80}
                className="max-h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          ))}
        </Marquee>
      </div>
    </section>
  );
}