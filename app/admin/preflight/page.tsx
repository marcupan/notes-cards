"use client";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

type Check = { label: string; ok: boolean; details?: string };

export default function PreflightPage() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const env = useQuery(api.system.envStatus);
  const folders = useQuery(api.folders.listFolders);

  const checks: Check[] = [
    { label: "Convex URL configured (client)", ok: Boolean(convexUrl) },
    { label: "Clerk publishable key configured (client)", ok: Boolean(clerkKey) },
    { label: "Convex reachable (envStatus)", ok: Boolean(env) },
    { label: "OpenAI key configured (server)", ok: Boolean(env?.openaiConfigured) },
    { label: "Convex query works (listFolders)", ok: Array.isArray(folders) },
  ];

  const okCount = checks.filter((c) => c.ok).length;

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Preflight Checks</h1>
      <SignedOut>
        <div className="p-4 border rounded bg-white">Sign in to run checks.
          <div className="mt-3">
            <SignInButton>
              <Button>Sign in</Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="p-4 border rounded bg-white">
          <div className="mb-3 text-sm text-neutral-700">Pass: {okCount}/{checks.length}</div>
          <ul className="space-y-2">
            {checks.map((c, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-sm">{c.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${c.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {c.ok ? "ok" : "fail"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </SignedIn>
    </main>
  );
}

