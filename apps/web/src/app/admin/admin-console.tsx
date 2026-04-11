"use client";

/**
 * Interactive admin console. Lists every user, lets the caller create new
 * ones with email+password, delete regular users, and run the "ensure
 * owner password" bootstrap. All mutations go through /api/admin/* so the
 * service-role key stays on the server.
 */

import { useCallback, useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  subscription_status: string;
  experience_level: string | null;
  skills: string[];
  is_admin: boolean;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AdminConsole({
  currentUserEmail,
}: {
  currentUserEmail: string;
}) {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  // Create form state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Per-row action state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "failed to load users");
        setUsers([]);
      } else {
        setUsers(json.users as UserRow[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setCreating(true);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          full_name: newName,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "create failed");
      } else {
        setBanner(`Created ${newEmail}.`);
        setNewEmail("");
        setNewPassword("");
        setNewName("");
        load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(u: UserRow) {
    if (u.is_admin) {
      setError("cannot delete a hardcoded admin");
      return;
    }
    if (
      !confirm(
        `Delete ${u.email ?? u.id}? This permanently removes their auth record and profile.`
      )
    ) {
      return;
    }
    setDeletingId(u.id);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "delete failed");
      } else {
        setBanner(`Deleted ${u.email ?? u.id}.`);
        setUsers((prev) => prev?.filter((x) => x.id !== u.id) ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBootstrap() {
    setBootstrapping(true);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/bootstrap", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "bootstrap failed");
      } else {
        setBanner(
          json.created
            ? "Owner account created with the hardcoded password."
            : "Owner account password reset to the hardcoded value."
        );
        load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "bootstrap failed");
    } finally {
      setBootstrapping(false);
    }
  }

  const stats = users
    ? {
        total: users.length,
        admins: users.filter((u) => u.is_admin).length,
        paid: users.filter(
          (u) =>
            u.subscription_status === "active" ||
            u.subscription_status === "trialing"
        ).length,
      }
    : { total: 0, admins: 0, paid: 0 };

  return (
    <div className="mt-16 flex flex-col gap-16">
      {/* Stats */}
      <section className="flex gap-16 flex-wrap">
        <div>
          <p className="font-heading font-light text-5xl text-foreground">
            {stats.total}
          </p>
          <p className="mt-1 font-body text-[11px] uppercase tracking-[0.2em] text-muted">
            Total users
          </p>
        </div>
        <div>
          <p className="font-heading font-light text-5xl text-foreground">
            {stats.admins}
          </p>
          <p className="mt-1 font-body text-[11px] uppercase tracking-[0.2em] text-muted">
            Admins
          </p>
        </div>
        <div>
          <p className="font-heading font-light text-5xl text-foreground">
            {stats.paid}
          </p>
          <p className="mt-1 font-body text-[11px] uppercase tracking-[0.2em] text-muted">
            Paid / trialing
          </p>
        </div>
      </section>

      {/* Feedback */}
      {(banner || error) && (
        <div
          className={`border px-4 py-3 font-body text-[13px] ${
            error
              ? "border-red-500/40 text-red-300"
              : "border-border text-foreground"
          }`}
        >
          {error ?? banner}
        </div>
      )}

      {/* Create user */}
      <section>
        <h2 className="font-heading font-light text-2xl text-foreground mb-6">
          Add a user
        </h2>
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1fr,auto] gap-6 items-end"
        >
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
              Email
            </p>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none font-body text-[15px] text-foreground pb-2 transition-colors"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
              Password
            </p>
            <input
              type="text"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none font-body text-[15px] text-foreground pb-2 transition-colors"
              placeholder="min 6 chars"
            />
          </div>
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
              Name (optional)
            </p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none font-body text-[15px] text-foreground pb-2 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-foreground text-background py-3 px-6 font-body text-[12px] uppercase tracking-[0.15em] hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>
      </section>

      {/* User list */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-heading font-light text-2xl text-foreground">
            All users
          </h2>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={load}
              className="font-body text-[12px] uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleBootstrap}
              disabled={bootstrapping}
              className="font-body text-[12px] uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors disabled:opacity-50"
              title="Ensure jonakfir@gmail.com exists with the hardcoded password"
            >
              {bootstrapping ? "Bootstrapping…" : "Reset owner password"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="font-body text-small text-muted">Loading users…</p>
        ) : users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-body text-[11px] uppercase tracking-[0.15em] text-muted pb-3 font-normal">
                    Email
                  </th>
                  <th className="text-left font-body text-[11px] uppercase tracking-[0.15em] text-muted pb-3 font-normal">
                    Name
                  </th>
                  <th className="text-left font-body text-[11px] uppercase tracking-[0.15em] text-muted pb-3 font-normal">
                    Role
                  </th>
                  <th className="text-left font-body text-[11px] uppercase tracking-[0.15em] text-muted pb-3 font-normal">
                    Plan
                  </th>
                  <th className="text-left font-body text-[11px] uppercase tracking-[0.15em] text-muted pb-3 font-normal">
                    Joined
                  </th>
                  <th className="text-left font-body text-[11px] uppercase tracking-[0.15em] text-muted pb-3 font-normal">
                    Last sign-in
                  </th>
                  <th className="text-right font-body text-[11px] uppercase tracking-[0.15em] text-muted pb-3 font-normal">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf =
                    (u.email ?? "").toLowerCase() ===
                    currentUserEmail.toLowerCase();
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 pr-4 font-body text-[14px] text-foreground">
                        {u.email ?? "—"}
                        {isSelf && (
                          <span className="ml-2 font-body text-[10px] uppercase tracking-wide text-muted">
                            (you)
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4 font-body text-[14px] text-muted">
                        {u.full_name ?? "—"}
                      </td>
                      <td className="py-4 pr-4">
                        {u.is_admin ? (
                          <span className="inline-block border border-accent/50 text-accent px-2 py-0.5 text-[10px] uppercase tracking-wide font-body">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-block border border-border text-muted px-2 py-0.5 text-[10px] uppercase tracking-wide font-body">
                            Member
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4 font-body text-[13px] text-muted">
                        {u.subscription_status}
                      </td>
                      <td className="py-4 pr-4 font-body text-[13px] text-muted">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-4 pr-4 font-body text-[13px] text-muted">
                        {formatDate(u.last_sign_in_at)}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          type="button"
                          disabled={
                            deletingId === u.id || u.is_admin || isSelf
                          }
                          onClick={() => handleDelete(u)}
                          className="font-body text-[12px] uppercase tracking-[0.15em] text-muted hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            u.is_admin
                              ? "Hardcoded admins can't be deleted"
                              : isSelf
                                ? "You can't delete yourself"
                                : "Delete user"
                          }
                        >
                          {deletingId === u.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="font-body text-small text-muted">
            No users found. Supabase env vars may be missing or the
            service-role key isn&apos;t set.
          </p>
        )}
      </section>
    </div>
  );
}
