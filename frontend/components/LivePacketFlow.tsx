'use client';
import { motion } from 'framer-motion';

export default function LivePacketFlow({ throughput }: { throughput: number }) {
  // Map throughput (0-5) to animation duration (inverse: higher throughput = faster/lower duration)
  const duration = Math.max(0.2, 2.0 - (throughput * 0.3));
  
  return (
    <div className="w-full h-16 glass rounded-full overflow-hidden relative flex items-center px-4">
      <div className="absolute inset-0 bg-accent/5" />
      <div className="text-xs font-mono text-gray-400 z-10 w-24">Live Pipe</div>
      
      <div className="flex-1 relative h-full flex items-center overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-6 h-4 bg-accent/80 rounded-sm shadow-[0_0_10px_rgba(59,130,246,0.8)]"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 1000, opacity: [0, 1, 1, 0] }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: i * (duration / 8),
              ease: "linear"
            }}
          />
        ))}
      </div>
      
      <div className="text-xs font-mono text-accent font-bold z-10 w-24 text-right">
        {throughput.toFixed(2)} Mbps
      </div>
    </div>
  );
}
