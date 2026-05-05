'use client';
import { motion } from 'framer-motion';
import BufferbloatSimulator from '@/components/BufferbloatSimulator';
import CdfGraph from '@/components/CdfGraph';
import MetricsPanel from '@/components/MetricsPanel';

export default function AnalyticsPage() {
  return (
    <main className="max-w-6xl mx-auto flex flex-col gap-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="border-b border-zinc-800 pb-6 mt-4"
      >
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Performance Evaluation Analytics</h1>
        <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
          Network Operations Center (NOC) dashboard demonstrating the technical superiority of DRL-TCP. 
          Observe how the deep reinforcement learning agent mitigates bufferbloat and achieves near-zero jitter compared to traditional TCP implementations.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MetricsPanel />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2">
          <BufferbloatSimulator />
        </div>
        <div className="lg:col-span-1">
          <CdfGraph />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-black border border-zinc-800 rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-white mb-3">Architectural Advantages</h3>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex gap-2">
            <span className="text-zinc-600">—</span> 
            <span><strong>Proactive vs Reactive:</strong> TCP Cubic relies on packet loss to detect congestion, filling buffers until they overflow. DRL-TCP observes RTT and BytesInFlight to throttle early.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-600">—</span> 
            <span><strong>Queue Management:</strong> By maintaining a minimal standing queue length, DRL-TCP prevents bufferbloat without sacrificing bottleneck bandwidth utilization.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-600">—</span> 
            <span><strong>Stable RTT:</strong> The flat-line response of the AI agent ensures predictable latency, crucial for real-time applications, bypassing the high-variance sawtooth.</span>
          </li>
        </ul>
      </motion.div>
    </main>
  );
}
