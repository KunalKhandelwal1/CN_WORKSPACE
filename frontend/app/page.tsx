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

export default function Home() {
  const [metrics, setMetrics] = useState<Record<string, MetricPoint[]>>({});

  useEffect(() => {
    getAllMetrics().then(setMetrics);
  }, []);

  const rttSpring = useSpring({ from: { val: 0 }, to: { val: 46.3 }, config: { duration: 1500 } });
  const lossSpring = useSpring({ from: { val: 100 }, to: { val: 0 }, config: { duration: 1500 } });
  const stepsSpring = useSpring({ from: { val: 0 }, to: { val: 100 }, config: { duration: 1500 } });

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
              <motion.span key={i+3} variants={itemVariants} className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-500">
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <div className="flex justify-center gap-8 text-sm md:text-base text-gray-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-success text-xl">↓</span>
              <animated.span>{rttSpring.val.to(val => val.toFixed(1))}</animated.span>% RTT reduction
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success text-xl">≈</span>
              <animated.span>{lossSpring.val.to(val => val.toFixed(0))}</animated.span>% packet loss
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent text-xl">↑</span>
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
            <MetricCard label="DRL Avg Throughput" value="1.85 Mbps" color="green" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard label="Cubic Avg Throughput" value="1.24 Mbps" color="amber" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard label="DRL Avg RTT" value="12.4 ms" color="green" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard label="Cubic Avg RTT" value="25.8 ms" color="amber" />
          </motion.div>
        </motion.div>

        {metrics.DRL && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-4 rounded-xl h-[300px]">
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Throughput Comparison (Mbps)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.DRL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip contentStyle={{ backgroundColor: '#111118', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Line isAnimationActive={true} animationDuration={1200} type="monotone" dataKey="throughput_mbps" stroke="#22c55e" strokeWidth={2} dot={false} name="DRL" />
                  {metrics.Cubic && <Line isAnimationActive={true} animationDuration={1200} type="monotone" data={metrics.Cubic} dataKey="throughput_mbps" stroke="#f59e0b" strokeWidth={2} dot={false} name="Cubic" />}
                  {metrics.NewReno && <Line isAnimationActive={true} animationDuration={1200} type="monotone" data={metrics.NewReno} dataKey="throughput_mbps" stroke="#a855f7" strokeWidth={2} dot={false} name="NewReno" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="glass p-4 rounded-xl h-[300px]">
              <h4 className="text-sm font-semibold text-gray-300 mb-4">RTT Comparison (ms)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.DRL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip contentStyle={{ backgroundColor: '#111118', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Line isAnimationActive={true} animationDuration={1200} type="monotone" dataKey="rtt_ms" stroke="#22c55e" strokeWidth={2} dot={false} name="DRL" />
                  {metrics.Cubic && <Line isAnimationActive={true} animationDuration={1200} type="monotone" data={metrics.Cubic} dataKey="rtt_ms" stroke="#f59e0b" strokeWidth={2} dot={false} name="Cubic" />}
                  {metrics.NewReno && <Line isAnimationActive={true} animationDuration={1200} type="monotone" data={metrics.NewReno} dataKey="rtt_ms" stroke="#a855f7" strokeWidth={2} dot={false} name="NewReno" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
