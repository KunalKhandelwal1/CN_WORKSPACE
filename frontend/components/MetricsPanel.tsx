'use client';
import { Activity, Zap, BarChart2 } from 'lucide-react';

export default function MetricsPanel() {
  const metrics = [
    {
      label: "Average RTT Reduction",
      value: "46.29%",
      description: "Compared to TCP Cubic baseline",
      icon: <Activity className="w-4 h-4 text-zinc-400" />,
      color: "text-white"
    },
    {
      label: "Jitter (Delay Var.)",
      value: "Near-Zero",
      description: "Stable queue length vs high-variance saw-tooth",
      icon: <Zap className="w-4 h-4 text-zinc-400" />,
      color: "text-white"
    },
    {
      label: "Bandwidth Efficiency",
      value: "1.92 Mbps",
      description: "Optimal utilization of 2.0 Mbps bottleneck",
      icon: <BarChart2 className="w-4 h-4 text-zinc-400" />,
      color: "text-white"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric, i) => (
        <div key={i} className="bg-black border border-zinc-800 rounded-xl p-5 hover:bg-zinc-900/30 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{metric.label}</span>
            {metric.icon}
          </div>
          <div className={`text-3xl font-bold tracking-tight mb-1 ${metric.color}`}>
            {metric.value}
          </div>
          <div className="text-xs text-zinc-500">
            {metric.description}
          </div>
        </div>
      ))}
    </div>
  );
}
