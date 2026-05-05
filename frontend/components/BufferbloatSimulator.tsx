'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function BufferbloatSimulator() {
  const [queueSize, setQueueSize] = useState(100);

  // Generate synthetic data based on the queue size slider
  const chartData = useMemo(() => {
    const data = [];
    const peakDelay = 20 + queueSize * 0.2; // Cubic's max delay scales with buffer

    for (let i = 0; i <= 100; i++) {
      const t = i / 10; // 0 to 10 seconds
      
      // DRL-TCP: Learns in 1st second, then stabilizes at ~25-30ms
      let drl = 0;
      if (t < 1.0) {
        drl = 20 + Math.random() * 30; // High variance during exploration
      } else {
        drl = 25 + Math.random() * 3;  // Near zero jitter, flatline
      }

      // Cubic: Sawtooth pattern dependent on buffer size
      const period = 2.0;
      const progress = (t % period) / period;
      let cubic = 20 + (peakDelay - 20) * progress + (Math.random() * 5);
      
      // Simulate sharp drop on packet loss (buffer full)
      if (progress > 0.95) {
        cubic = 20; 
      }

      data.push({
        time: t.toFixed(1),
        drl_rtt: Number(drl.toFixed(1)),
        cubic_rtt: Number(cubic.toFixed(1))
      });
    }
    return data;
  }, [queueSize]);

  return (
    <div className="border border-zinc-800 bg-black p-6 rounded-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-800 via-zinc-400 to-zinc-800 opacity-20"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Bufferbloat Simulator</h2>
          <p className="text-xs font-mono text-zinc-500 mt-1">Interactive RTT analysis modeling standing queue delay</p>
        </div>
        
        <div className="w-full md:w-64">
          <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>Router Queue Size</span>
            <span className="text-white font-bold">{queueSize} pkts</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="1000" 
            step="10" 
            value={queueSize} 
            onChange={(e) => setQueueSize(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
            <span>Shallow</span>
            <span>Deep Buffer</span>
          </div>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#52525b" 
              tick={{ fill: '#a1a1aa', fontSize: 11 }} 
              tickFormatter={(val) => `${val}s`}
              minTickGap={20}
            />
            <YAxis 
              stroke="#52525b" 
              tick={{ fill: '#a1a1aa', fontSize: 11 }} 
              label={{ value: 'RTT (ms)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#f4f4f5' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
            <Line 
              type="monotone" 
              dataKey="cubic_rtt" 
              name="TCP Cubic" 
              stroke="#71717a" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="drl_rtt" 
              name="DRL-TCP" 
              stroke="#ffffff" 
              strokeWidth={2.5} 
              dot={false} 
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
        <p className="text-xs text-zinc-400 leading-relaxed font-mono">
          <span className="text-white font-bold">Analysis:</span> As the queue size increases, Cubic blindly fills the buffer, causing latency to spike drastically before experiencing packet loss. DRL-TCP anticipates the bottleneck capacity, throttling just enough to maintain a near-zero standing queue, isolating its RTT from buffer bloat.
        </p>
      </div>
    </div>
  );
}
