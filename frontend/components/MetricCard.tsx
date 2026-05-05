'use client';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color: 'green' | 'blue' | 'amber' | 'purple';
}

// Since we are enforcing monochrome NOC aesthetic, map colors to subtle zinc shades
const colorMap = {
  green: 'border-zinc-500',
  blue: 'border-zinc-600',
  amber: 'border-zinc-700',
  purple: 'border-zinc-800',
};

export default function MetricCard({ label, value, subtitle, color }: MetricCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className={`border-t-2 ${colorMap[color]} shadow-md bg-black`}>
        <CardContent className="p-4 flex flex-col justify-center">
          <h4 className="text-zinc-400 text-xs uppercase tracking-wider font-semibold mb-2">{label}</h4>
          <div className="text-3xl font-mono text-zinc-50 mb-1">{value}</div>
          {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
