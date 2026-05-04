'use client';
import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color: 'green' | 'blue' | 'amber' | 'purple';
}

const colorMap = {
  green: 'border-t-success',
  blue: 'border-t-accent',
  amber: 'border-t-cubic',
  purple: 'border-t-newreno',
};

export default function MetricCard({ label, value, subtitle, color }: MetricCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`glass p-4 rounded-xl border-t-2 ${colorMap[color]} shadow-lg`}
    >
      <h4 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">{label}</h4>
      <div className="text-3xl font-mono text-white mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </motion.div>
  );
}
