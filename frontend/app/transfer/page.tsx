'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { runTransfer, getAllMetrics, getTransferHistory } from '@/lib/api';
import { ComparisonResult, MetricPoint } from '@/lib/types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { Zap, Package, Rocket, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

const FILE_SIZES = [
  { label: '1 MB', value: 1 },
  { label: '5 MB', value: 5 },
  { label: '10 MB', value: 10 },
];

function SpeedupBadge({ value }: { value: number }) {
  const spring = useSpring({ val: value, from: { val: 1 }, config: { duration: 1200 } });
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-6xl font-black text-zinc-100 tracking-tighter">
        <animated.span>{spring.val.to(v => v.toFixed(1))}</animated.span>×
      </div>
      <span className="text-sm text-zinc-500 font-mono mt-1">Speedup Factor</span>
    </div>
  );
}

function LatencyBadge({ value }: { value: number }) {
  const spring = useSpring({ val: value, from: { val: 0 }, config: { duration: 1200 } });
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-6xl font-black text-zinc-100 tracking-tighter">
        <animated.span>{spring.val.to(v => v.toFixed(1))}</animated.span>%
      </div>
      <span className="text-sm text-zinc-500 font-mono mt-1">Latency Reduction</span>
    </div>
  );
}

function StatCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-4 flex flex-col gap-1 bg-black">
        <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
          <span className="text-xs text-zinc-500">{unit}</span>
        </div>
      </Card>
    </motion.div>
  );
}

export default function TransferPage() {
  const [selectedSize, setSelectedSize] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [history, setHistory] = useState<ComparisonResult[]>([]);
  const [metrics, setMetrics] = useState<Record<string, MetricPoint[]>>({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    getAllMetrics().then(setMetrics);
    getTransferHistory().then(setHistory);
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    setProgress(0);

    // Simulate progress animation while transfer runs
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 8, 92));
    }, 200);

    const res = await runTransfer(selectedSize);

    clearInterval(interval);
    setProgress(100);

    setTimeout(() => {
      setResult(res);
      setIsRunning(false);
      if (res) setHistory(prev => [...prev, res]);
    }, 400);
  };

  // Prepare chart data from results
  const latencyBarData = result ? [
    { name: 'Traditional TCP', value: result.traditional.total_time_ms, fill: '#71717a' },
    { name: 'DRL-TCP Optimized', value: result.drl_optimized.total_time_ms, fill: '#f4f4f5' },
  ] : [];

  const throughputBarData = result ? [
    { name: 'Traditional TCP', value: result.traditional.throughput_mbps, fill: '#71717a' },
    { name: 'DRL-TCP Optimized', value: result.drl_optimized.throughput_mbps, fill: '#f4f4f5' },
  ] : [];

  // Chunk latency timeline (sample every Nth chunk for readability)
  const chunkTimelineData = result ? (() => {
    const trad = result.traditional.chunk_metrics;
    const drl = result.drl_optimized.chunk_metrics;
    const maxLen = Math.max(trad.length, drl.length);
    const step = Math.max(1, Math.floor(maxLen / 80));
    const data = [];
    for (let i = 0; i < maxLen; i += step) {
      data.push({
        chunk: i,
        traditional: trad[Math.min(i, trad.length - 1)]?.latency_ms || 0,
        drl: drl[Math.min(i, drl.length - 1)]?.latency_ms || 0,
      });
    }
    return data;
  })() : [];

  const containerV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemV = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <main className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-b border-white/10 pb-4">
        <h1 className="text-3xl font-bold text-white mb-2">File Transfer Comparison</h1>
        <p className="text-gray-400 text-sm">Real TCP socket transfers comparing Traditional TCP vs DRL-TCP optimized settings.</p>
      </motion.div>

      {/* Control Panel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6 bg-black border-zinc-800">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <label className="text-sm font-semibold text-gray-300 mb-3 block">Select File Size</label>
            <div className="flex gap-3">
              {FILE_SIZES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSelectedSize(s.value)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                    selectedSize === s.value
                      ? 'bg-accent/20 border-accent text-accent shadow-lg shadow-accent/20'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRun}
              disabled={isRunning}
              className={`px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-300 ${
                isRunning
                  ? 'bg-zinc-800 text-zinc-500 cursor-wait'
                  : 'bg-zinc-100 text-black shadow-lg shadow-zinc-100/20 hover:shadow-zinc-100/40'
              }`}
            >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Transferring…
              </span>
            ) : '🚀 Run Transfer'}
          </motion.button>
        </div>

        {/* Progress Bars */}
        <AnimatePresence>
          {isRunning && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 font-mono mb-1">
                  <span>Traditional TCP</span><span>{Math.min(progress * 0.7, 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <motion.div className="h-full bg-zinc-600 rounded-full" animate={{ width: `${Math.min(progress * 0.7, 100)}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-zinc-400 font-mono mb-1">
                  <span>DRL-TCP Optimized</span><span>{Math.min(progress, 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <motion.div className="h-full bg-zinc-200 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </Card>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Speedup Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl p-8 flex items-center justify-center bg-black border-zinc-800">
                <SpeedupBadge value={result.speedup_factor} />
              </Card>
              <Card className="rounded-2xl p-8 flex items-center justify-center bg-black border-zinc-800">
                <LatencyBadge value={result.latency_reduction_pct} />
              </Card>
            </div>

            {/* Stat Cards */}
            <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={containerV} initial="hidden" animate="show">
              <motion.div variants={itemV}>
                <StatCard label="Traditional Time" value={result.traditional.total_time_ms.toFixed(1)} unit="ms" color="text-zinc-400" />
              </motion.div>
              <motion.div variants={itemV}>
                <StatCard label="DRL-TCP Time" value={result.drl_optimized.total_time_ms.toFixed(1)} unit="ms" color="text-zinc-100" />
              </motion.div>
              <motion.div variants={itemV}>
                <StatCard label="Traditional Throughput" value={result.traditional.throughput_mbps.toFixed(1)} unit="Mbps" color="text-zinc-400" />
              </motion.div>
              <motion.div variants={itemV}>
                <StatCard label="DRL-TCP Throughput" value={result.drl_optimized.throughput_mbps.toFixed(1)} unit="Mbps" color="text-zinc-100" />
              </motion.div>
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="p-5 rounded-xl h-[340px] flex flex-col bg-black border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex-none">Transfer Time (ms)</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={latencyBarData} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} width={130} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                          {latencyBarData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="p-5 rounded-xl h-[340px] flex flex-col bg-black border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex-none">Throughput (Mbps)</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={throughputBarData} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} width={130} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                          {throughputBarData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Chunk Latency Timeline */}
            {chunkTimelineData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-5 rounded-xl h-[340px] flex flex-col bg-black border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex-none">Per-Chunk Latency Timeline (ms)</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chunkTimelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis dataKey="chunk" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} label={{ value: 'Chunk Index', position: 'insideBottom', offset: -5, style: { fill: 'rgba(255,255,255,0.4)', fontSize: 11 } }} />
                        <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="traditional" stroke="#71717a" strokeWidth={2} dot={false} name="Traditional TCP" />
                        <Line type="monotone" dataKey="drl" stroke="#f4f4f5" strokeWidth={2} dot={false} name="DRL-TCP Optimized" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* NS-3 Simulation Data Section */}
      {metrics.DRL && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4 mt-4">
          <div className="border-b border-white/10 pb-3">
            <h2 className="text-xl font-bold text-white">NS-3 Simulation Validation</h2>
            <p className="text-gray-500 text-xs font-mono mt-1">Real data from NS-3 network simulator — 100 data points over 10s simulation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 rounded-xl h-[320px] flex flex-col bg-black border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex-none">RTT Comparison — NS-3 (ms)</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.DRL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="rtt_ms" stroke="#f4f4f5" strokeWidth={2} dot={false} name="DRL-TCP" />
                    {metrics.Cubic && <Line type="monotone" data={metrics.Cubic} dataKey="rtt_ms" stroke="#71717a" strokeWidth={2} dot={false} name="Cubic" />}
                    {metrics.NewReno && <Line type="monotone" data={metrics.NewReno} dataKey="rtt_ms" stroke="#3f3f46" strokeWidth={2} dot={false} name="NewReno" />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 rounded-xl h-[320px] flex flex-col bg-black border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex-none">Throughput Comparison — NS-3 (Mbps)</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.DRL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="throughput_mbps" stroke="#f4f4f5" strokeWidth={2} dot={false} name="DRL-TCP" />
                    {metrics.Cubic && <Line type="monotone" data={metrics.Cubic} dataKey="throughput_mbps" stroke="#71717a" strokeWidth={2} dot={false} name="Cubic" />}
                    {metrics.NewReno && <Line type="monotone" data={metrics.NewReno} dataKey="throughput_mbps" stroke="#3f3f46" strokeWidth={2} dot={false} name="NewReno" />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Explanation Cards */}
      <motion.div variants={containerV} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {[
          { icon: <Zap className="w-6 h-6 text-zinc-300" />, title: "Nagle's Algorithm Disabled", desc: 'DRL agent learned that packet coalescing adds unnecessary delay. TCP_NODELAY eliminates this.' },
          { icon: <Package className="w-6 h-6 text-zinc-300" />, title: 'Optimized Buffer Sizes', desc: 'DRL agent discovered the optimal congestion window. 256KB buffers match the learned capacity limit.' },
          { icon: <Rocket className="w-6 h-6 text-zinc-300" />, title: 'Rocket Start', desc: "DRL agent's custom +4000 action enables rapid bandwidth acquisition, bypassing slow-start." },
          { icon: <ShieldCheck className="w-6 h-6 text-zinc-300" />, title: 'Near-Zero Packet Loss', desc: 'DRL agent maintains buffer occupancy below overflow threshold, preventing retransmissions.' },
        ].map((card, i) => (
          <motion.div key={i} variants={itemV} className="group">
            <Card className="p-5 hover:bg-zinc-900 transition-colors duration-300 border-zinc-800 bg-black">
              <div className="flex items-start gap-3">
                <span className="group-hover:scale-110 transition-transform">{card.icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100 mb-1">{card.title}</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="text-center text-xs text-zinc-600 font-mono pb-8 mt-4">
        * Live transfer uses real TCP sockets · NS-3 data from published simulation traces
      </div>
    </main>
  );
}
