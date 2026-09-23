import About from "@/components/About";
import Contact from "@/components/Contact";
import FieldBreak from "@/components/FieldBreak";
import FieldNotesPreview from "@/components/FieldNotesPreview";
import Footer from "@/components/Footer";
import FourWorlds from "@/components/FourWorlds";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Numbers from "@/components/Numbers";
import Work from "@/components/Work";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Numbers />
        <Work />
        <FieldBreak />
        <FourWorlds />
        <FieldNotesPreview />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
