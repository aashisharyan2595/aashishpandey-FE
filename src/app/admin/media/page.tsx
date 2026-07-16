import MediaGrid from "@/components/admin/MediaGrid";

export default function AdminMediaPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl">Media library</h1>
      <div className="mt-8">
        <MediaGrid />
      </div>
    </div>
  );
}
