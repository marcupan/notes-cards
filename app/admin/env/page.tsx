"use client";
import {SignedIn, SignedOut, SignInButton} from "@clerk/nextjs";
import {useQuery} from "convex/react";
import {api} from "@/convex/_generated/api";
import {Button} from "@/components/ui/button";

export default function EnvStatusPage() {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const status = useQuery(api.system.envStatus);

    return (
        <main className="p-6 max-w-2xl mx-auto space-y-4">
            <h1 className="text-xl font-semibold">Environment Status</h1>
            <SignedOut>
                <div className="p-4 border rounded bg-white">Sign in to view environment status.
                    <div className="mt-3">
                        <SignInButton>
                            <Button>Sign in</Button>
                        </SignInButton>
                    </div>
                </div>
            </SignedOut>
            <SignedIn>
                <div className="grid gap-3">
                    <div className="p-4 border rounded bg-white">
                        <div className="font-medium mb-2">Client</div>
                        <div className="text-sm">NEXT_PUBLIC_CONVEX_URL: <code>{convexUrl ? "set" : "missing"}</code>
                        </div>
                        <div
                            className="text-sm">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: <code>{clerkKey ? "set" : "missing"}</code>
                        </div>
                    </div>
                    <div className="p-4 border rounded bg-white">
                        <div className="font-medium mb-2">Server</div>
                        {status ? (
                            <div className="space-y-1 text-sm">
                                <div>OPENAI_API_KEY: <code>{status.openaiConfigured ? "set" : "missing"}</code></div>
                                <div>Current userId: <code>{status.userId}</code></div>
                                <div>Is Admin: <code>{status.isAdmin ? "yes" : "no"}</code></div>
                            </div>
                        ) : (
                            <div className="text-sm text-neutral-500">Loading...</div>
                        )}
                    </div>
                </div>
            </SignedIn>
        </main>
    );
}
