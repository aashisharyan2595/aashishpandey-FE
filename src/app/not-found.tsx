import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col items-start justify-center px-6 md:px-12">
        <p className="eyebrow">404</p>
        <h1 className="display-l mt-4">
          Nothing built here <span style={{ color: "var(--gold)" }}>yet.</span>
        </h1>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/work" className="btn">
            Back to work
          </Link>
          <Link href="/" className="btn btn-primary">
            Back home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
