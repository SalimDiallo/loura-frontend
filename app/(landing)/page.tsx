import { LandingAuthRedirect } from "@/landing/components/landing-auth-redirect";
import { CTASection } from "@/landing/components/sections/cta";
import FAQ from "@/landing/components/sections/faq";
import Features from "@/landing/components/sections/features";
import { FooterSection } from "@/landing/components/sections/footer";
import Header from "@/landing/components/sections/header";
import Hero from "@/landing/components/sections/hero";
import HowItWorks from "@/landing/components/sections/how-it-works";
import Logos from "@/landing/components/sections/logos";
import { PricingSection } from "@/landing/components/sections/pricing";
import Problem from "@/landing/components/sections/problem";
import Solution from "@/landing/components/sections/solution";
import TestimonialsCarousel from "@/landing/components/sections/testimonials-carousel";

export default function Home() {
  return (
    <main>
      <LandingAuthRedirect >
     <>
     <Header />
      <Hero />
      <Logos />
      <Problem />
      <Solution />
      <HowItWorks />
      <TestimonialsCarousel />
      <Features />
      {/* <Testimonials /> */}
      <PricingSection />
      <FAQ />
      {/* <Blog /> */}
      <CTASection />
      <FooterSection />
     </>
      </LandingAuthRedirect>
    </main>
  );
}
