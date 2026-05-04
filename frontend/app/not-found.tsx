import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 mb-4 tracking-tighter relative">
        404
        <span className="absolute inset-0 text-accent opacity-50 blur-[10px] animate-pulse">404</span>
      </h1>
      <h2 className="text-xl font-mono text-gray-400 mb-8">Page Not Found</h2>
      <Link href="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-lg font-medium text-sm">
        Return to Dashboard
      </Link>
    </div>
  );
}
