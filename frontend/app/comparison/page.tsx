'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllMetrics } from '@/lib/api';
import { MetricPoint, AlgoToggleState } from '@/lib/types';
import CwndRaceChart from '@/components/CwndRaceChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import clsx from 'clsx';

export default function ComparisonPage() {
  const [metrics, setMetrics] = useState<Record<string, MetricPoint[]>>({ DRL: [], Cubic: [], NewReno: [] });
  const [toggles, setToggles] = useState<AlgoToggleState>({ DRL: true, Cubic: true, NewReno: true });
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Initial fetch for historical context
    getAllMetrics().then(setMetrics);

    // Subscribe to live telemetry
    const ws = new WebSocket('ws://localhost:8000/api/live');
    ws.onopen = () => setIsLive(true);
    ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        const timeStr = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
        
        setMetrics(prev => {
            const newDrlPoint = { time: timeStr, throughput_mbps: (payload.cwnd / 10), rtt_ms: payload.rtt_ms };
            const newCubicPoint = { time: timeStr, throughput_mbps: (payload.cubic_cwnd / 10), rtt_ms: payload.cubic_rtt_ms };
            
            const updateList = (list: MetricPoint[] | undefined, point: MetricPoint) => {
                const newList = [...(list || []), point];
                return newList.length > 30 ? newList.slice(newList.length - 30) : newList;
            };

            return {
                ...prev,
                DRL: updateList(prev.DRL, newDrlPoint),
                Cubic: updateList(prev.Cubic, newCubicPoint)
            };
        });
    };
    ws.onclose = () => setIsLive(false);

    return () => ws.close();
  }, []);

  const getAvgThroughput = (algo: string) => {
    const data = metrics[algo];
    if (!data || data.length === 0) return 0;
    return Number((data.reduce((acc, p) => acc + (p.throughput_mbps || 0), 0) / data.length).toFixed(2));
  };

  const raceData = [
    ...(toggles.DRL ? [{ name: 'DRL-TCP', throughput: getAvgThroughput('DRL'), color: '#10b981' }] : []),
    ...(toggles.Cubic ? [{ name: 'Cubic', throughput: getAvgThroughput('Cubic'), color: '#60a5fa' }] : []),
    ...(toggles.NewReno ? [{ name: 'NewReno', throughput: getAvgThroughput('NewReno'), color: '#fbbf24' }] : []),
  ];

  const drlRtt = metrics.DRL?.[metrics.DRL.length - 1]?.rtt_ms || 0;
  const cubicRtt = metrics.Cubic?.[metrics.Cubic.length - 1]?.rtt_ms || 0;
  const latencyAdvantage = cubicRtt > 0 ? ((cubicRtt - drlRtt) / cubicRtt * 100).toFixed(1) : 0;

  return (
    <main className="flex flex-col gap-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-white">Algorithm Comparison</h1>
            {isLive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider animate-pulse">
                    Live Stream
                </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm">Real-time performance benchmark across TCP variants.</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(toggles).map(([algo, active]) => (
            <motion.button
              key={algo}
              whileTap={{ scale: 0.95 }}
              onClick={() => setToggles(t => ({ ...t, [algo]: !t[algo as keyof AlgoToggleState] }))}
              className={clsx(
                "px-3 py-1 rounded-md text-sm font-medium transition-all border shadow-sm",
                active 
                  ? algo === 'DRL' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                  : algo === 'Cubic' ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                  : "bg-amber-500/10 border-amber-500/50 text-amber-400"
                  : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400"
              )}
            >
              {algo}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6 rounded-xl bg-black border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-widest">Average Throughput (Mbps)</h3>
          <CwndRaceChart data={raceData.sort((a, b) => b.throughput - a.throughput)} />
        </Card>
        <Card className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border-zinc-800 flex flex-col justify-center items-center text-center">
            <h3 className="text-sm font-semibold text-emerald-500/80 mb-2 uppercase tracking-widest">Latency Advantage</h3>
            <div className="text-5xl font-bold text-white mb-1">{latencyAdvantage}%</div>
            <p className="text-zinc-500 text-xs">lower RTT compared to Cubic</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 rounded-xl h-[400px] flex flex-col bg-black border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex-none">Throughput Stability</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.DRL || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)' }} />
              {toggles.DRL && <Line type="monotone" dataKey="throughput_mbps" stroke="#10b981" strokeWidth={hoveredLine === 'DRL' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'DRL' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('DRL')} onMouseLeave={() => setHoveredLine(null)} />}
              {toggles.Cubic && <Line type="monotone" data={metrics.Cubic} dataKey="throughput_mbps" stroke="#3b82f6" strokeWidth={hoveredLine === 'Cubic' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'Cubic' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('Cubic')} onMouseLeave={() => setHoveredLine(null)} />}
              {toggles.NewReno && <Line type="monotone" data={metrics.NewReno} dataKey="throughput_mbps" stroke="#fbbf24" strokeWidth={hoveredLine === 'NewReno' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'NewReno' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('NewReno')} onMouseLeave={() => setHoveredLine(null)} />}
            </LineChart>
          </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 rounded-xl h-[400px] flex flex-col bg-black border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex-none">Latency Response (ms)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.DRL || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)' }} />
              {toggles.DRL && <Line type="monotone" dataKey="rtt_ms" stroke="#10b981" strokeWidth={hoveredLine === 'DRL' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'DRL' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('DRL')} onMouseLeave={() => setHoveredLine(null)} />}
              {toggles.Cubic && <Line type="monotone" data={metrics.Cubic} dataKey="rtt_ms" stroke="#3b82f6" strokeWidth={hoveredLine === 'Cubic' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'Cubic' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('Cubic')} onMouseLeave={() => setHoveredLine(null)} />}
              {toggles.NewReno && <Line type="monotone" data={metrics.NewReno} dataKey="rtt_ms" stroke="#fbbf24" strokeWidth={hoveredLine === 'NewReno' ? 4 : 2} opacity={hoveredLine && hoveredLine !== 'NewReno' ? 0.3 : 1} dot={false} onMouseEnter={() => setHoveredLine('NewReno')} onMouseLeave={() => setHoveredLine(null)} />}
            </LineChart>
          </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </main>
  );
}
