export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded p-4 bg-white text-center">
        <h1 className="text-lg font-semibold mb-2">Page not found</h1>
        <p className="text-sm text-neutral-700 mb-3">The page you’re looking for doesn’t exist.</p>
        <a className="text-blue-600 underline" href="/">Go home</a>
      </div>
    </main>
  );
}

