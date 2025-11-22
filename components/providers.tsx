"use client";
import {ReactNode} from "react";
import {ClerkProvider, useAuth} from "@clerk/nextjs";
import {ConvexReactClient} from "convex/react";
import {ConvexProviderWithClerk} from "convex/react-clerk";
import {NuqsAdapter} from "nuqs/adapters/next/app";
import {ToastProvider} from "@/components/ToastProvider";

// Use placeholder URLs during build if environment variables are not set
// These will be replaced with actual values at runtime in production
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_placeholder";

const convex = new ConvexReactClient(convexUrl);

export function Providers({children}: { children: ReactNode }) {
    return (
        <ClerkProvider publishableKey={clerkPublishableKey}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <NuqsAdapter>
                    <ToastProvider>{children}</ToastProvider>
                </NuqsAdapter>
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
