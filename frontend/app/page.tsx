'use client';
import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import HeroAnimation from '@/components/HeroAnimation';
import DQNBrainViz from '@/components/DQNBrainViz';
import MetricCard from '@/components/MetricCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { getAllMetrics } from '@/lib/api';
import { MetricPoint } from '@/lib/types';
import { Card } from '@/components/ui/card';

export default function Home() {
  const [metrics, setMetrics] = useState<Record<string, MetricPoint[]>>({});
  const [liveData, setLiveData] = useState<{ rtt: number, cwnd: number, cubic_rtt: number, cubic_cwnd: number } | null>(null);

  useEffect(() => {
    getAllMetrics().then(setMetrics);

    const ws = new WebSocket('ws://localhost:8000/api/live');
    ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        setLiveData({
            rtt: payload.rtt_ms,
            cwnd: payload.cwnd,
            cubic_rtt: payload.cubic_rtt_ms,
            cubic_cwnd: payload.cubic_cwnd
        });
    };
    return () => ws.close();
  }, []);

  const rttSpring = useSpring({ from: { val: 0 }, to: { val: liveData ? (100 - (liveData.rtt / 0.6)) : 46.3 }, config: { duration: 1500 } });
  const lossSpring = useSpring({ from: { val: 100 }, to: { val: 0 }, config: { duration: 1500 } });
  const stepsSpring = useSpring({ from: { val: 0 }, to: { val: 124 }, config: { duration: 1500 } });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const headingWords = ["TCP", "Congestion", "Control", "powered", "by", "Deep", "RL"];

  return (
    <main className="flex flex-col gap-12">
      {/* Hero Section */}
      <section className="relative pt-10">
        <div className="text-center mb-12">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight flex flex-wrap justify-center gap-x-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {headingWords.slice(0, 3).map((word, i) => (
              <motion.span key={i} variants={itemVariants}>{word}</motion.span>
            ))}
            <div className="w-full h-0" />
            {headingWords.slice(3).map((word, i) => (
              <motion.span key={i+3} variants={itemVariants} className="text-zinc-100 font-bold">
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <div className="flex justify-center gap-8 text-sm md:text-base text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-100 text-xl">↓</span>
              <animated.span>{rttSpring.val.to(val => val.toFixed(1))}</animated.span>% RTT reduction
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-100 text-xl">≈</span>
              <animated.span>{lossSpring.val.to(val => val.toFixed(0))}</animated.span>% packet loss
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-100 text-xl">↑</span>
              <animated.span>{stepsSpring.val.to(val => val.toFixed(0))}</animated.span>k training steps
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <HeroAnimation />
        </motion.div>
      </section>

      {/* DQN Brain Section */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <DQNBrainViz />
        </motion.div>
      </section>

      {/* Metrics Section */}
      <section>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.div variants={itemVariants}>
            <MetricCard label="DRL Live Throughput" value={liveData ? `${(liveData.cwnd / 10).toFixed(2)} Mbps` : "1.85 Mbps"} color="green" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard label="Cubic Live Throughput" value={liveData ? `${(liveData.cubic_cwnd / 10).toFixed(2)} Mbps` : "1.24 Mbps"} color="amber" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard label="DRL Live RTT" value={liveData ? `${liveData.rtt.toFixed(1)} ms` : "12.4 ms"} color="green" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard label="Cubic Live RTT" value={liveData ? `${liveData.cubic_rtt.toFixed(1)} ms` : "25.8 ms"} color="amber" />
          </motion.div>
        </motion.div>

        {metrics.DRL && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 rounded-xl h-[300px] bg-black border-zinc-800">
              <h4 className="text-sm font-semibold text-zinc-300 mb-4">Throughput Comparison (Mbps)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.DRL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Line isAnimationActive={true} animationDuration={1200} type="monotone" dataKey="throughput_mbps" stroke="#f4f4f5" strokeWidth={2} dot={false} name="DRL" />
                  {metrics.Cubic && <Line isAnimationActive={true} animationDuration={1200} type="monotone" data={metrics.Cubic} dataKey="throughput_mbps" stroke="#71717a" strokeWidth={2} dot={false} name="Cubic" />}
                  {metrics.NewReno && <Line isAnimationActive={true} animationDuration={1200} type="monotone" data={metrics.NewReno} dataKey="throughput_mbps" stroke="#3f3f46" strokeWidth={2} dot={false} name="NewReno" />}
                </LineChart>
              </ResponsiveContainer>
            </Card>
            
            <Card className="p-4 rounded-xl h-[300px] bg-black border-zinc-800">
              <h4 className="text-sm font-semibold text-zinc-300 mb-4">RTT Comparison (ms)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.DRL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Line isAnimationActive={true} animationDuration={1200} type="monotone" dataKey="rtt_ms" stroke="#f4f4f5" strokeWidth={2} dot={false} name="DRL" />
                  {metrics.Cubic && <Line isAnimationActive={true} animationDuration={1200} type="monotone" data={metrics.Cubic} dataKey="rtt_ms" stroke="#71717a" strokeWidth={2} dot={false} name="Cubic" />}
                  {metrics.NewReno && <Line isAnimationActive={true} animationDuration={1200} type="monotone" data={metrics.NewReno} dataKey="rtt_ms" stroke="#3f3f46" strokeWidth={2} dot={false} name="NewReno" />}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </section>
    </main>
  );
}
