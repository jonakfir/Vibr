"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyRole } from "@/lib/dashboard/types";

const ROLES: CompanyRole[] = ["owner", "admin", "manager", "member", "viewer"];

interface Props {
  userId: string;
  role: CompanyRole;
  invitedAt: string;
  acceptedAt: string | null;
  canManage: boolean;
}

export function MemberRow({ userId, role, invitedAt, acceptedAt, canManage }: Props) {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<CompanyRole>(role);
  const [busy, setBusy] = useState(false);

  const updateRole = async (newRole: CompanyRole) => {
    setBusy(true);
    try {
      await fetch("/api/company/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      setCurrentRole(newRole);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Remove this member?")) return;
    setBusy(true);
    await fetch(`/api/company/members?user_id=${userId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <li className="px-5 py-3 flex items-center justify-between">
      <div>
        <p className="font-mono text-xs text-foreground">{userId.slice(0, 8)}…</p>
        <p className="font-body text-[10px] text-muted mt-0.5">
          {acceptedAt
            ? `Joined ${new Date(acceptedAt).toLocaleDateString()}`
            : `Invited ${new Date(invitedAt).toLocaleDateString()} · pending`}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {canManage && currentRole !== "owner" ? (
          <select
            value={currentRole}
            onChange={(e) => updateRole(e.target.value as CompanyRole)}
            disabled={busy}
            className="bg-background font-body text-xs text-foreground border border-border rounded-[4px] px-2 py-1"
          >
            {ROLES.filter((r) => r !== "owner").map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-body text-[10px] uppercase tracking-wide text-muted">
            {currentRole}
          </span>
        )}
        {canManage && currentRole !== "owner" && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="font-body text-xs text-muted hover:text-red-400 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </li>
  );
}
