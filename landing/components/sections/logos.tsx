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

const half = Math.ceil(compagnies.length / 2);
const rowOne = compagnies.slice(0, half);
const rowTwo = compagnies.slice(half);

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
      <div className="grid w-full max-w-6xl grid-cols-2 md:grid-cols-4 overflow-hidden border-y border-border items-center justify-center z-20">
        {compagnies.slice(0, 8).map((c) => (
          <Link
            href="#"
            className="group w-full h-32 flex items-center justify-center relative p-4 before:absolute before:-left-1 before:top-0 before:z-10 before:h-screen before:w-px before:bg-border before:content-[''] after:absolute after:-top-1 after:left-0 after:z-10 after:h-px after:w-screen after:bg-border after:content-[''] opacity-90 hover:opacity-100 transition-opacity duration-300"
            key={c.name}
          >
            <Image src={c.logo} alt={c.name} width={200} height={200} className="flex items-center justify-center w-full h-full transition-all duration-300" />
          </Link>
        ))}
      </div>
    </section>
  );
}