'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimConfig } from '@/lib/types';
import ConfigSlider from '@/components/ConfigSlider';
import { Check, Copy } from 'lucide-react';
import { generateCommand } from '@/lib/api';
import { Card } from '@/components/ui/card';

export default function ConfigPage() {
  const [config, setConfig] = useState<SimConfig>({
    bandwidth: 2,
    delay: 10,
    duration: 10,
    mtu: 400,
    reward: 1.0,
    penalty: -0.5,
    variant: 'DRL-TCP (Time-based)'
  });

  const [copied, setCopied] = useState(false);
  const [apiCommand, setApiCommand] = useState('');

  // Optimistic command string generation for UI display
  const command = `./waf --run "scratch/sim --transport_prot=${
    config.variant === 'Cubic' ? 'TcpCubic' : 
    config.variant === 'NewReno' ? 'TcpNewReno' : 
    config.variant === 'DRL-TCP (Event-based)' ? 'TcpRl' : 'TcpRlTimeBased'
  } --duration=${config.duration} --bottleneck_bandwidth=${config.bandwidth}Mbps --bottleneck_delay=${config.delay}ms --mtu=${config.mtu} --reward=${config.reward.toFixed(1)} --penalty=${config.penalty.toFixed(1)}"`;

  // Fetch the real command from the backend API when config changes to validate
  useEffect(() => {
    generateCommand(config).then(setApiCommand);
  }, [config]);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="max-w-4xl mx-auto flex flex-col gap-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-b border-white/10 pb-4">
        <h1 className="text-3xl font-bold text-white mb-2">Simulation Configuration</h1>
        <p className="text-gray-400 text-sm">Tune the network bottleneck and agent parameters, then copy the run command.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 rounded-xl flex flex-col gap-2 bg-black border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Network Topology</h3>
          <ConfigSlider 
            label="Bottleneck Bandwidth" value={config.bandwidth} min={1} max={10} step={1} unit="Mbps"
            onChange={v => setConfig({...config, bandwidth: v})}
            explanation="Controls the maximum throughput of the central link. A lower value simulates a congested pipe."
          />
          <ConfigSlider 
            label="Bottleneck Delay" value={config.delay} min={1} max={50} step={1} unit="ms"
            onChange={v => setConfig({...config, delay: v})}
            explanation="One-way propagation delay of the bottleneck. Higher delay increases the RTT."
          />
          <ConfigSlider 
            label="MTU (Max Transmission Unit)" value={config.mtu} min={200} max={1500} step={100} unit="bytes"
            onChange={v => setConfig({...config, mtu: v})}
            explanation="Size of packets sent. Smaller MTUs increase header overhead and cause more discrete events."
          />
        </Card>

        <Card className="p-6 rounded-xl flex flex-col gap-2 bg-black border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Simulation & Agent</h3>
          
          <div className="mb-6">
            <label className="text-sm font-semibold text-zinc-300 block mb-2">TCP Variant</label>
            <select 
              value={config.variant}
              onChange={e => setConfig({...config, variant: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-100 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option>DRL-TCP (Time-based)</option>
              <option>DRL-TCP (Event-based)</option>
              <option>Cubic</option>
              <option>NewReno</option>
            </select>
            <p className="text-xs text-zinc-500 mt-2">Select the congestion control algorithm to run.</p>
          </div>

          <ConfigSlider 
            label="Simulation Duration" value={config.duration} min={5} max={60} step={1} unit="s"
            onChange={v => setConfig({...config, duration: v})}
            explanation="How long the NS-3 simulation runs in simulated seconds."
          />
          
          {(config.variant.includes('DRL')) && (
            <>
              <ConfigSlider 
                label="Reward Multiplier" value={config.reward} min={0.1} max={5.0} step={0.1} unit="x"
                onChange={v => setConfig({...config, reward: v})}
                explanation="Positive reward scale for high throughput. Promotes aggressive transmission."
              />
              <ConfigSlider 
                label="Penalty Multiplier" value={config.penalty} min={-20} max={-0.1} step={0.1} unit="x"
                onChange={v => setConfig({...config, penalty: v})}
                explanation="Negative reward scale for high RTT and packet loss. Promotes caution."
              />
            </>
          )}
        </Card>
      </div>

      <Card className="p-6 rounded-xl bg-black border-zinc-800">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-semibold text-zinc-100">Generated Run Command</h3>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-colors text-sm text-zinc-300 border border-zinc-800"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check className="w-4 h-4 text-zinc-100" />
                </motion.div>
              ) : (
                <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Copy className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
          <code className="text-sm font-mono whitespace-nowrap">
            <span className="text-zinc-500">./waf --run </span>
            <span className="text-zinc-300">"scratch/sim </span>
            
            <span className="text-zinc-500">--transport_prot=</span>
            <span className="text-zinc-100">{config.variant === 'Cubic' ? 'TcpCubic' : config.variant === 'NewReno' ? 'TcpNewReno' : config.variant === 'DRL-TCP (Event-based)' ? 'TcpRl' : 'TcpRlTimeBased'} </span>
            
            <span className="text-zinc-500">--duration=</span>
            <span className="text-zinc-100">{config.duration} </span>
            
            <span className="text-zinc-500">--bottleneck_bandwidth=</span>
            <span className="text-zinc-100">{config.bandwidth}Mbps </span>
            
            <span className="text-zinc-500">--bottleneck_delay=</span>
            <span className="text-zinc-100">{config.delay}ms </span>
            
            <span className="text-zinc-500">--mtu=</span>
            <span className="text-zinc-100">{config.mtu} </span>
            
            {(config.variant.includes('DRL')) && (
              <>
                <span className="text-zinc-500">--reward=</span>
                <span className="text-zinc-100">{config.reward.toFixed(1)} </span>
                
                <span className="text-zinc-500">--penalty=</span>
                <span className="text-zinc-100">{config.penalty.toFixed(1)}</span>
              </>
            )}
            <span className="text-zinc-300">"</span>
          </code>
        </div>
      </Card>
    </main>
  );
}
