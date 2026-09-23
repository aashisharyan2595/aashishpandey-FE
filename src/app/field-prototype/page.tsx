import OperatingField from "@/components/OperatingField";

// Temporary standalone review route for the Operating Field prototype —
// not linked from nav, not in sitemap. Remove once the Field is wired into
// the homepage rebuild (Sprint 02 phase 3).
export default function FieldPrototypePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-24 md:px-12">
      <p className="eyebrow">Prototype — not linked in nav</p>
      <h1 className="h1 mt-4">The Operating Field</h1>
      <p className="body-l mt-4 max-w-xl text-muted">
        Select a capability to see where it actually shows up. Every connection here comes from real project tags —
        nothing is invented.
      </p>
      <div className="mt-16">
        <OperatingField />
      </div>
    </main>
  );
}
