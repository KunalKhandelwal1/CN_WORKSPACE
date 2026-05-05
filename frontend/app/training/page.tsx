'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTrainingHistory } from '@/lib/api';
import { TrainingPoint } from '@/lib/types';
import LivePacketFlow from '@/components/LivePacketFlow';
import DQNBrainViz from '@/components/DQNBrainViz';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

export default function TrainingPage() {
  const [history, setHistory] = useState<TrainingPoint[]>([]);
  const [stepLimit, setStepLimit] = useState(10);

  useEffect(() => {
    getTrainingHistory().then(data => {
      if (data && data.length > 0) {
        setHistory(data);
        setStepLimit(data.length);
      }
    });
  }, []);

  const currentData = history.slice(0, stepLimit);
  const currentPoint = currentData[currentData.length - 1] || { throughput_mbps: 0 };
  const epsilon = Math.max(0.01, 1.0 - (stepLimit / (history.length || 100)) * 0.99);

  return (
    <main className="flex flex-col gap-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-b border-white/10 pb-4">
        <h1 className="text-3xl font-bold text-white mb-2">Training Dashboard</h1>
        <p className="text-gray-400 text-sm">Monitor the DQN agent's learning progress.</p>
      </motion.div>

      <LivePacketFlow throughput={currentPoint.throughput_mbps} />

      <Card className="p-6 bg-black border-zinc-800 rounded-xl">
        <div className="flex justify-between items-end mb-4">
          <label className="text-sm font-semibold text-zinc-300">Step Scrubber (Replay Training)</label>
          <span className="text-xs font-mono text-zinc-100">Step {stepLimit} / {history.length}</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max={history.length || 100} 
          value={stepLimit} 
          onChange={(e) => setStepLimit(Number(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100"
        />
        
        <div className="mt-6">
          <div className="flex justify-between text-xs text-zinc-400 font-mono mb-2">
            <span>Exploration (ε: {epsilon.toFixed(2)})</span>
            <span>Exploitation</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <motion.div 
              className="h-full bg-zinc-100" 
              animate={{ width: `${epsilon * 100}%` }} 
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 rounded-xl h-[300px] bg-black border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">cWnd Over Steps</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="step" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)' }} />
              <Line isAnimationActive={false} type="stepAfter" dataKey="cwnd" stroke="#71717a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        
        <Card className="p-4 rounded-xl h-[300px] bg-black border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Cumulative Reward</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="step" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)' }} />
              <Line isAnimationActive={false} type="monotone" dataKey="reward" stroke="#f4f4f5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      <div className="mt-8 scale-90 origin-top">
        <DQNBrainViz />
      </div>
    </main>
  );
}
