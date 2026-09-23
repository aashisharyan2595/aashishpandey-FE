import About from "@/components/About";
import Contact from "@/components/Contact";
import FieldBreak from "@/components/FieldBreak";
import FieldNotesPreview from "@/components/FieldNotesPreview";
import FieldSection from "@/components/FieldSection";
import Footer from "@/components/Footer";
import FourWorlds from "@/components/FourWorlds";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Numbers from "@/components/Numbers";
import WhatAreYouMoving from "@/components/WhatAreYouMoving";
import Work from "@/components/Work";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FieldSection />
        <FourWorlds />
        <Numbers />
        <Work />
        <FieldBreak />
        <WhatAreYouMoving />
        <FieldNotesPreview />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
