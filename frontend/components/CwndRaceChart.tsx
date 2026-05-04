'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RaceChartProps {
  data: { name: string; throughput: number; color: string }[];
}

export default function CwndRaceChart({ data }: RaceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
        <XAxis type="number" stroke="rgba(255,255,255,0.4)" />
        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" width={80} />
        <Tooltip contentStyle={{ backgroundColor: '#111118', borderColor: 'rgba(255,255,255,0.1)' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
        <Bar dataKey="throughput" isAnimationActive={true} animationDuration={1500} radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
