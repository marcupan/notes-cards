"use client";
import {ReactNode} from "react";
import {ClerkProvider, useAuth} from "@clerk/nextjs";
import {ConvexReactClient} from "convex/react";
import {ConvexProviderWithClerk} from "convex/react-clerk";
import {NuqsAdapter} from "nuqs/adapters/next/app";
import {ToastProvider} from "@/components/ToastProvider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL is not set. Convex client will fail.");
}

const convex = new ConvexReactClient(convexUrl || "");

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
