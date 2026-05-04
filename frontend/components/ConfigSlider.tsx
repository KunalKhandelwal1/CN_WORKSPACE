'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ConfigSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  explanation: string;
  unit: string;
}

export default function ConfigSlider({ label, value, min, max, step, onChange, explanation, unit }: ConfigSliderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 cursor-pointer" onClick={() => setShowExplanation(!showExplanation)}>
          {label}
          <span className="text-xs text-gray-500 hover:text-white transition-colors">ⓘ</span>
        </label>
        <span className="text-xs font-mono text-accent">{value} {unit}</span>
      </div>
      
      <div 
        className="relative py-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-6 bg-accent text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none transform -translate-x-1/2"
              style={{ left: `calc(${pct}% + ${8 - pct * 0.16}px)` }}
            >
              {value} {unit}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-accent pointer-events-none" style={{ width: `${pct}%` }} />
          <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
      
      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-gray-400 mt-2 bg-black/20 p-2 rounded border border-white/5">{explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
