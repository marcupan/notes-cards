"use client";
import {ReactNode} from "react";
import {ClerkProvider, useAuth} from "@clerk/nextjs";
import {ConvexReactClient} from "convex/react";
import {ConvexProviderWithClerk} from "convex/react-clerk";
import {NuqsAdapter} from "nuqs/adapters/next/app";
import {ToastProvider} from "@/components/ToastProvider";

// Use a placeholder URL during build if NEXT_PUBLIC_CONVEX_URL is not set
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

export function Providers({children}: { children: ReactNode }) {
    return (
        <ClerkProvider>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <NuqsAdapter>
                    <ToastProvider>{children}</ToastProvider>
                </NuqsAdapter>
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
