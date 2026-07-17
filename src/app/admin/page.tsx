"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";

type DashboardStats = {
  posts: { published: number; drafts: number; total: number };
  submissions: number;
  media: number;
  recentPosts: { _id: string; title: string; slug: string; published: boolean; updatedAt: string }[];
  recentSubmissions: { _id: string; name: string; email: string; createdAt: string }[];
};

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/dashboard-stats")
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats);
  }, []);

  const greeting = greetingForHour(new Date().getHours());

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl space-y-12">
      {/* Header Greeting */}
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between border-b border-[#0B0B0C]/10 pb-6">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#0B0B0C]">
            {greeting}, Admin
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-[#8A8A86] mt-1">
            {formattedDate}
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-2 rounded-full bg-[#0B0B0C] px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-[#F5F3EE] hover:bg-[#FF5A36] hover:text-[#F5F3EE] transition-all"
          >
            <span>+ New Post</span>
          </Link>
          <Link
            href="/admin/case-studies/new"
            className="flex items-center gap-2 rounded-full border border-[#0B0B0C]/20 bg-transparent px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-[#0B0B0C] hover:border-[#FF5A36] hover:text-[#FF5A36] transition-all"
          >
            <span>+ New Case Study</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Published Posts"
          value={stats?.posts.published}
          subtext="Live on website"
          href="/admin/posts"
          icon={
            <svg className="h-6 w-6 text-[#FF5A36]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          }
        />
        <StatCard
          label="Drafts"
          value={stats?.posts.drafts}
          subtext="In progress writing"
          href="/admin/posts"
          icon={
            <svg className="h-6 w-6 text-[#FF5A36]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          }
        />
        <StatCard
          label="Media Assets"
          value={stats?.media}
          subtext="Images and uploads"
          href="/admin/media"
          icon={
            <svg className="h-6 w-6 text-[#FF5A36]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Submissions"
          value={stats?.submissions}
          subtext="Contact form inquiries"
          href="/admin/submissions"
          icon={
            <svg className="h-6 w-6 text-[#FF5A36]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          }
        />
      </div>

      {/* Main Content Lists Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Posts Panel */}
        <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#0B0B0C]/10 pb-4 mb-4">
              <h2 className="font-display text-lg font-bold text-[#0B0B0C]">
                Recently Updated Posts
              </h2>
              <Link
                href="/admin/posts"
                className="font-mono text-xs uppercase tracking-widest text-[#8A8A86] hover:text-[#FF5A36] transition-all"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {stats === null ? (
                <p className="text-sm text-[#8A8A86]">Loading posts...</p>
              ) : stats.recentPosts.length === 0 ? (
                <p className="text-sm text-[#8A8A86]">No posts created yet.</p>
              ) : (
                stats.recentPosts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/admin/posts/${post._id}`}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-[#0B0B0C]/5 bg-[#F5F3EE]/40 px-4 py-3.5 transition-all hover:border-[#FF5A36]/30 hover:bg-[#F5F3EE]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[#0B0B0C] group-hover:text-[#FF5A36] transition-colors">
                        {post.title || "Untitled"}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#8A8A86] mt-0.5">
                        Updated {new Date(post.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-mono text-[9px] uppercase tracking-widest rounded-full px-2.5 py-1 ${
                        post.published
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Submissions Panel */}
        <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#0B0B0C]/10 pb-4 mb-4">
              <h2 className="font-display text-lg font-bold text-[#0B0B0C]">
                Recent Inquiries
              </h2>
              <Link
                href="/admin/submissions"
                className="font-mono text-xs uppercase tracking-widest text-[#8A8A86] hover:text-[#FF5A36] transition-all"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {stats === null ? (
                <p className="text-sm text-[#8A8A86]">Loading submissions...</p>
              ) : stats.recentSubmissions.length === 0 ? (
                <p className="text-sm text-[#8A8A86]">No submissions yet.</p>
              ) : (
                stats.recentSubmissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="flex flex-col gap-1 rounded-xl border border-[#0B0B0C]/5 bg-[#F5F3EE]/40 px-4 py-3.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium text-[#0B0B0C] truncate">{sub.name}</p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#8A8A86] shrink-0">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-[#8A8A86] truncate lowercase">{sub.email}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value?: number;
  subtext: string;
  href: string;
  icon: React.ReactNode;
};

function StatCard({ label, value, subtext, href, icon }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm transition-all hover:border-[#FF5A36]/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#8A8A86] font-semibold">
            {label}
          </p>
          <p className="font-display text-4xl font-bold tracking-tight text-[#0B0B0C] mt-2.5">
            {value !== undefined ? value : "—"}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#8A8A86] mt-2.5">
            {subtext}
          </p>
        </div>
        <div className="rounded-xl bg-[#F5F3EE] p-3 group-hover:bg-[#FF5A36]/10 transition-colors shrink-0">
          {icon}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#FF5A36] transition-all group-hover:w-full" />
    </Link>
  );
}
