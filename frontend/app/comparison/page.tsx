'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllMetrics } from '@/lib/api';
import { MetricPoint, AlgoToggleState } from '@/lib/types';
import CwndRaceChart from '@/components/CwndRaceChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';

export default function ComparisonPage() {
  const [metrics, setMetrics] = useState<Record<string, MetricPoint[]>>({});
  const [toggles, setToggles] = useState<AlgoToggleState>({ DRL: true, Cubic: true, NewReno: true });
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  useEffect(() => {
    getAllMetrics().then(setMetrics);
  }, []);

  const getAvgThroughput = (algo: string) => {
    const data = metrics[algo];
    if (!data || data.length === 0) return 0;
    return Number((data.reduce((acc, p) => acc + (p.throughput_mbps || 0), 0) / data.length).toFixed(2));
  };

  const raceData = [
    ...(toggles.DRL ? [{ name: 'DRL-TCP', throughput: getAvgThroughput('DRL'), color: '#22c55e' }] : []),
    ...(toggles.Cubic ? [{ name: 'Cubic', throughput: getAvgThroughput('Cubic'), color: '#f59e0b' }] : []),
    ...(toggles.NewReno ? [{ name: 'NewReno', throughput: getAvgThroughput('NewReno'), color: '#a855f7' }] : []),
  ];

  return (
    <main className="flex flex-col gap-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Algorithm Comparison</h1>
          <p className="text-gray-400 text-sm">Compare TCP variants against the DRL agent.</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(toggles).map(([algo, active]) => (
            <motion.button
              key={algo}
              whileTap={{ scale: 0.95 }}
              onClick={() => setToggles(t => ({ ...t, [algo]: !t[algo as keyof AlgoToggleState] }))}
              className={clsx(
                "px-3 py-1 rounded-md text-sm font-medium transition-colors border",
                active 
                  ? algo === 'DRL' ? "bg-success/20 border-success text-success" 
                  : algo === 'Cubic' ? "bg-cubic/20 border-cubic text-cubic"
                  : "bg-newreno/20 border-newreno text-newreno"
                  : "bg-transparent border-white/20 text-gray-400"
              )}
            >
              {algo}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="glass p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Average Throughput (Mbps)</h3>
        <CwndRaceChart data={raceData.sort((a, b) => b.throughput - a.throughput)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-4 rounded-xl h-[400px]">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Throughput Over Time</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.DRL || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip contentStyle={{ backgroundColor: '#111118', borderColor: 'rgba(255,255,255,0.1)' }} />
              {toggles.DRL && <Line type="monotone" dataKey="throughput_mbps" stroke="#22c55e" strokeWidth={hoveredLine === 'DRL' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'DRL' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('DRL')} onMouseLeave={() => setHoveredLine(null)} />}
              {toggles.Cubic && <Line type="monotone" data={metrics.Cubic} dataKey="throughput_mbps" stroke="#f59e0b" strokeWidth={hoveredLine === 'Cubic' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'Cubic' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('Cubic')} onMouseLeave={() => setHoveredLine(null)} />}
              {toggles.NewReno && <Line type="monotone" data={metrics.NewReno} dataKey="throughput_mbps" stroke="#a855f7" strokeWidth={hoveredLine === 'NewReno' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'NewReno' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('NewReno')} onMouseLeave={() => setHoveredLine(null)} />}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-4 rounded-xl h-[400px]">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">RTT Over Time (ms)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.DRL || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip contentStyle={{ backgroundColor: '#111118', borderColor: 'rgba(255,255,255,0.1)' }} />
              {toggles.DRL && <Line type="monotone" dataKey="rtt_ms" stroke="#22c55e" strokeWidth={hoveredLine === 'DRL' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'DRL' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('DRL')} onMouseLeave={() => setHoveredLine(null)} />}
              {toggles.Cubic && <Line type="monotone" data={metrics.Cubic} dataKey="rtt_ms" stroke="#f59e0b" strokeWidth={hoveredLine === 'Cubic' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'Cubic' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('Cubic')} onMouseLeave={() => setHoveredLine(null)} />}
              {toggles.NewReno && <Line type="monotone" data={metrics.NewReno} dataKey="rtt_ms" stroke="#a855f7" strokeWidth={hoveredLine === 'NewReno' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'NewReno' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('NewReno')} onMouseLeave={() => setHoveredLine(null)} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500 font-mono mt-4">
        * data sourced from results_rl.txt, results_cubic.txt, results_newreno.txt via FastAPI backend
      </div>
    </main>
  );
}
