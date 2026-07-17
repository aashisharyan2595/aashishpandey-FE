"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  status: "approved" | "pending" | "rejected";
  lastLoginAt?: string;
  createdAt?: string;
  hasGoogle: boolean;
  hasPassword: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);

  const load = () => {
    adminFetch("/api/admin/users")
      .then((res) => (res.ok ? res.json() : []))
      .then(setUsers);
  };

  useEffect(load, []);

  const approve = async (id: string) => {
    await adminFetch(`/api/admin/users/${id}/approve`, { method: "POST" });
    load();
  };

  const reject = async (id: string) => {
    if (!confirm("Reject this account? They'll lose any current access immediately.")) return;
    await adminFetch(`/api/admin/users/${id}/reject`, { method: "POST" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this account entirely? This can't be undone.")) return;
    const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) load();
  };

  const pending = users?.filter((u) => u.status === "pending") ?? [];
  const others = users?.filter((u) => u.status !== "pending") ?? [];

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">Users</h1>

      {users === null ? (
        <p className="mt-8 text-muted">Loading…</p>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mt-10">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Pending approval
              </p>
              <div className="mt-4 divide-y divide-ink/10 border-t border-ink/10">
                {pending.map((u) => (
                  <UserRow key={u.id} user={u} onApprove={approve} onReject={reject} onRemove={remove} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-10">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              All accounts
            </p>
            <div className="mt-4 divide-y divide-ink/10 border-t border-ink/10">
              {others.length === 0 ? (
                <p className="py-4 text-muted">No other accounts yet.</p>
              ) : (
                others.map((u) => (
                  <UserRow key={u.id} user={u} onApprove={approve} onReject={reject} onRemove={remove} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserRow({
  user,
  onApprove,
  onReject,
  onRemove,
}: {
  user: AdminUser;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="font-medium">
          {user.name} <span className="text-muted">— {user.email}</span>
        </p>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {user.status}
          {user.hasGoogle && " · Google"}
          {user.hasPassword && " · Password"}
          {user.lastLoginAt &&
            ` · Last login ${new Date(user.lastLoginAt).toLocaleDateString()}`}
        </p>
      </div>
      <div className="flex shrink-0 gap-4 font-mono text-sm uppercase tracking-widest">
        {user.status === "pending" && (
          <button type="button" onClick={() => onApprove(user.id)} className="hover:text-accent">
            Approve
          </button>
        )}
        {user.status !== "rejected" && (
          <button
            type="button"
            onClick={() => onReject(user.id)}
            className="text-muted hover:text-accent"
          >
            Reject
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(user.id)}
          className="text-muted hover:text-accent"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
