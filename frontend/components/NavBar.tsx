'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import clsx from 'clsx';

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/comparison', label: 'Comparison' },
  { href: '/training', label: 'Training' },
  { href: '/config', label: 'Config' },
  { href: '/commits', label: 'Commits' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-accent tracking-tighter">
          DRL-TCP
        </Link>
        <div className="flex gap-1">
          {LINKS.map(link => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "relative px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  active ? "text-white" : "text-gray-400 hover:text-white"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-white/10 rounded-md -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </div>
        <a href="https://github.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
          <Github className="w-5 h-5" />
        </a>
      </div>
    </nav>
  );
}
