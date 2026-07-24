import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="space-y-6">
        <div className="text-8xl font-bold text-neutral-800 select-none">404</div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
          This page doesn&apos;t exist or has been moved. Check the URL or head
          back to the cookbook.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex px-5 py-2.5 rounded-xl amber-gradient-bg text-white font-medium text-sm shadow-md hover:opacity-90 transition-opacity"
          >
            Back to Cookbook
          </Link>
        </div>
      </div>
    </div>
  );
}
