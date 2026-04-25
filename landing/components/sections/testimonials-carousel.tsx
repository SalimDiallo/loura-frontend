import BlurFade from "@/landing/components/magicui/blur-fade";
import Section from "@/landing/components/section";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/landing/components/ui/carousel";
import Image from "next/image";
import { MdOutlineFormatQuote } from "react-icons/md";

const testimonials = [
  {
    quote:
      "Grâce à la solution Loura, nous avons pu simplifier la gestion de nos activités au quotidien, améliorer la communication interne et augmenter notre productivité. Un outil précieux pour notre entreprise en pleine croissance.",
    logo: "/images/landing/compagnies/easytrip.svg",
    logoAlt: "EasyTrip Logo",
    company: "EasyTrip",
    author: "Directeur Général",
    companyLabel: "EasyTrip l'entreprise",
  },
  {
    quote:
      "Loura a transformé la manière dont notre équipe collabore et organise les projets. L’interface est intuitive et le support client très réactif. Nous avons gagné un temps précieux depuis sa mise en place.",
    logo: "/images/landing/compagnies/diora.svg",
    logoAlt: "Diora Logo",
    company: "Diora",
    author: "Responsable Opérations",
    companyLabel: "Diora",
  },
];

export default function Component() {
  return (
    <Section
      title="Témoignages en vedette"
      subtitle="Ce que nos clients en disent"
    >
      <Carousel>
        <div className="max-w-2xl mx-auto relative">
          <CarouselContent>
            {testimonials.map((item, idx) => (
              <CarouselItem key={idx}>
                <div className="p-2 pb-5">
                  <div className="text-center">
                    <MdOutlineFormatQuote className="text-4xl text-themeDarkGray my-4 mx-auto" />
                    <BlurFade delay={0.25} inView>
                      <h4 className="text-1xl font-semibold max-w-lg mx-auto px-10">
                        {item.quote}
                      </h4>
                    </BlurFade>
                    <BlurFade delay={0.5} inView>
                      <div className="mt-8">
                        <Image
                          width={96}
                          height={40}
                          src={item.logo}
                          alt={item.logoAlt}
                          className="mx-auto w-auto h-[40px] grayscale opacity-30"
                        />
                      </div>
                    </BlurFade>
                    <div>
                      <BlurFade delay={0.75} inView>
                        <h4 className="text-1xl font-semibold my-2">
                          {item.author}
                        </h4>
                      </BlurFade>
                    </div>
                    <BlurFade delay={1.0} inView>
                      <div className="mb-3">
                        <span className="text-sm text-themeDarkGray">
                          {item.companyLabel}
                        </span>
                      </div>
                    </BlurFade>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="pointer-events-none absolute inset-y-0 left-0 h-full w-2/12 bg-gradient-to-r from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 h-full w-2/12 bg-gradient-to-l from-background"></div>
        </div>
        <div className="md:block hidden absolute bottom-0 left-1/2 -translate-x-1/2">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>
    </Section>
  );
}
