"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);
  return (
    <html>
      <body>
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full border rounded p-4 bg-white">
            <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-neutral-700 mb-3">{error.message}</p>
            <button className="px-3 py-1 border rounded" onClick={() => reset()}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}

