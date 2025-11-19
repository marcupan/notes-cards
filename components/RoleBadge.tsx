"use client";
import { useUser } from "@clerk/nextjs";

export function RoleBadge() {
  const { user } = useUser();
  const role = (user?.publicMetadata as any)?.role || "user";
  return (
    <span className="ml-2 inline-flex items-center rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-700">
      {String(role)}
    </span>
  );
}

