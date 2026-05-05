'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Info } from 'lucide-react';

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
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-4">
        <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2 cursor-pointer" onClick={() => setShowExplanation(!showExplanation)}>
          {label}
          <Info className="w-4 h-4 text-zinc-500 hover:text-zinc-50 transition-colors" />
        </label>
        <span className="text-xs font-mono text-zinc-100">{value} {unit}</span>
      </div>
      
      <div className="py-2">
        <Slider 
          value={[value]} 
          min={min} 
          max={max} 
          step={step} 
          onValueChange={(vals) => onChange(vals[0])} 
        />
      </div>
      
      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-zinc-400 mt-3 bg-zinc-900 p-3 rounded-md border border-zinc-800">{explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
