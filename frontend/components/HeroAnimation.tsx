'use client';
import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { useState, useEffect } from 'react';

export default function HeroAnimation() {
  const [isPlaying, setIsPlaying] = useState(true);

  // Animated cwnd bars simulating packet density
  const cwndDrl = useSpring({ height: isPlaying ? 80 : 20, loop: { reverse: true }, config: { duration: 500 } });
  const cwndCubic = useSpring({ height: isPlaying ? 60 : 10, loop: { reverse: true }, config: { duration: 1500 } });
  const cwndNewReno = useSpring({ height: isPlaying ? 40 : 15, loop: { reverse: true }, config: { duration: 2500 } });

  const PacketStream = ({ color, duration, label, cwndStyle, yOffset }: any) => (
    <div className="relative h-12 flex items-center border-b border-white/5 last:border-0" style={{ transform: `translateY(${yOffset}px)` }}>
      <div className="w-24 text-xs font-mono text-gray-400 shrink-0">{label}</div>
      <div className="flex-1 relative h-full overflow-hidden">
        {isPlaying && Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-3 h-3 rounded-full ${color}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 400, opacity: [0, 1, 1, 0] }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: i * (duration / 5),
              ease: "linear"
            }}
          />
        ))}
      </div>
      <div className="w-10 h-full flex items-end justify-center pb-2 shrink-0">
        <animated.div className={`w-3 rounded-t-sm ${color}`} style={cwndStyle} />
      </div>
    </div>
  );

  return (
    <div className="glass rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md transition-colors"
        >
          {isPlaying ? 'Pause Demo' : 'Play Demo'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center bg-surface shrink-0 z-10">
          <span className="text-xs font-bold text-gray-400">Sender</span>
        </div>
        
        <div className="flex-1 relative mx-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-white/20 border-dashed border-t" />
          </div>
          
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute left-1/2 -top-12 -translate-x-1/2 glass px-4 py-2 rounded-lg border-accent/50 text-accent text-xs font-mono z-20 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            DQN Agent
            <div className="absolute -bottom-4 left-1/2 w-px h-4 bg-accent/50" />
          </motion.div>
          
          <div className="text-center mt-6">
            <span className="bg-background px-2 text-xs text-gray-500 font-mono">2 Mbps / 10ms</span>
          </div>
        </div>

        <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center bg-surface shrink-0 z-10">
          <span className="text-xs font-bold text-gray-400">Receiver</span>
        </div>
      </div>

      <div className="space-y-2 bg-black/20 rounded-lg p-4">
        <PacketStream color="bg-success" duration={1.5} label="DRL-TCP" cwndStyle={cwndDrl} yOffset={0} />
        <PacketStream color="bg-cubic" duration={2.5} label="Cubic" cwndStyle={cwndCubic} yOffset={0} />
        <PacketStream color="bg-newreno" duration={3.5} label="NewReno" cwndStyle={cwndNewReno} yOffset={0} />
      </div>
    </div>
  );
}
