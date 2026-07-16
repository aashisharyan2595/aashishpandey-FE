import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col items-start justify-center px-6 md:px-12">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">404</p>
        <h1 className="font-display mt-4 text-4xl leading-tight md:text-6xl">
          Nothing built here <span className="text-accent">yet.</span>
        </h1>
        <Link
          href="/"
          data-cursor-hover
          className="mt-8 font-mono text-sm uppercase tracking-widest text-muted hover:text-accent"
        >
          ← Back home
        </Link>
      </main>
      <Footer />
    </>
  );
}
