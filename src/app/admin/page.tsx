import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="grid max-w-2xl gap-4">
      <h1 className="font-display text-3xl">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/posts"
          className="rounded-lg border border-white/10 p-6 hover:border-accent"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Content</p>
          <p className="font-display mt-2 text-xl">Blog posts</p>
        </Link>
        <Link
          href="/admin/submissions"
          className="rounded-lg border border-white/10 p-6 hover:border-accent"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Contact form</p>
          <p className="font-display mt-2 text-xl">Submissions</p>
        </Link>
      </div>
    </div>
  );
}
