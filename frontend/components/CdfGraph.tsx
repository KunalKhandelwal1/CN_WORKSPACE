'use client';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CdfGraph() {
  const chartData = useMemo(() => {
    const data = [];
    // Generate synthetic CDF data
    // DRL: 90% of packets < 40ms. Steep climb.
    // Cubic: 90% of packets spread up to 150ms. Gradual climb.
    for (let rtt = 10; rtt <= 150; rtt += 5) {
      // S-curve approximation for CDF
      const drlProb = 1 / (1 + Math.exp(-0.2 * (rtt - 25)));
      const cubicProb = 1 / (1 + Math.exp(-0.04 * (rtt - 80)));

      data.push({
        rtt: rtt,
        drl_cdf: Math.min(Number(drlProb.toFixed(3)), 1.0),
        cubic_cdf: Math.min(Number(cubicProb.toFixed(3)), 1.0)
      });
    }
    return data;
  }, []);

  return (
    <div className="border border-zinc-800 bg-black p-6 rounded-xl relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-800 via-zinc-500 to-zinc-800 opacity-20"></div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Latency Distribution (CDF)</h2>
        <p className="text-xs font-mono text-zinc-500 mt-1">Cumulative probability of packet delivery times</p>
      </div>

      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="rtt" 
              type="number"
              domain={[10, 150]}
              stroke="#52525b" 
              tick={{ fill: '#a1a1aa', fontSize: 11 }} 
              tickFormatter={(val) => `${val}ms`}
              label={{ value: 'RTT (ms)', position: 'insideBottom', offset: -10, fill: '#71717a', fontSize: 12 }}
            />
            <YAxis 
              stroke="#52525b" 
              tick={{ fill: '#a1a1aa', fontSize: 11 }} 
              tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
              domain={[0, 1.05]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#f4f4f5' }}
              labelFormatter={(val) => `RTT: ${val} ms`}
              formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, undefined]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa', marginTop: '10px' }} />
            <Line 
              type="monotone" 
              dataKey="cubic_cdf"
              name="TCP Cubic" 
              stroke="#71717a" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={true}
            />
            <Line 
              type="monotone" 
              name="DRL-TCP" 
              dataKey="drl_cdf"
              stroke="#ffffff" 
              strokeWidth={2.5} 
              dot={false} 
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
