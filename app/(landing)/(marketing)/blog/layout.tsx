import { FooterSection } from "@/landing/components/sections/footer";
import Header from "@/landing/components/sections/header";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: MarketingLayoutProps) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <FooterSection />
    </>
  );
}
