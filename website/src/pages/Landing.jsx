import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import HeroSection from "../sections/HeroSection";
import BenefitSection from "../sections/BenefitSection";
import FooterSection from "../sections/FooterSection";

export default function Landing() {
  return (
    <main>
      <NavBar />
      <HeroSection />
      <BenefitSection />
      <FooterSection />
    </main>
  );
}
