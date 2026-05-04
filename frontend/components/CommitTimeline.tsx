'use client';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import clsx from 'clsx';

const COMMITS = [
  { id: 'P1-C1', person: 'P1', date: 'Apr 21', title: 'OpenGym Base Env', status: 'done', desc: 'Added TcpGymEnv base class with OpenGym interface' },
  { id: 'P2-C1', person: 'P2', date: 'Apr 21', title: 'Socket Helper & Base RL', status: 'done', desc: 'Created TcpSocketDerived and TcpRlBase classes' },
  { id: 'P1-C2', person: 'P1', date: 'Apr 22', title: 'Event-driven Env', status: 'done', desc: 'Added TcpEventGymEnv subclass with per-event observations' },
  { id: 'P3-C1', person: 'P3', date: 'Apr 22', title: 'Sim Skeleton', status: 'done', desc: 'Base sim.cc simulation skeleton with CLI parser' },
  { id: 'P2-C2', person: 'P2', date: 'Apr 23', title: 'Congestion Ops', status: 'done', desc: 'Delegated congestion ops to RL callbacks' },
  { id: 'P1-C3', person: 'P1', date: 'Apr 23', title: 'Time-step Env', status: 'done', desc: 'Added TcpTimeStepGymEnv with periodic collection' },
  { id: 'P3-C2', person: 'P3', date: 'Apr 24', title: 'Sim Topology', status: 'done', desc: 'Added OpenGym interface and TCP configuration' },
  { id: 'P2-C3', person: 'P2', date: 'Apr 24', title: 'Event RL Variant', status: 'done', desc: 'Implemented event-based RL algorithm' },
  { id: 'P1-C4', person: 'P1', date: 'Apr 25', title: 'Reward Logic', status: 'done', desc: 'Implemented reward calculation for timestep env' },
  { id: 'P4-C1', person: 'P4', date: 'Apr 25', title: 'DQN Agent Init', status: 'done', desc: 'Python script with TensorFlow DQN setup' },
  { id: 'P3-C3', person: 'P3', date: 'Apr 26', title: 'Sim FlowMonitor', status: 'done', desc: 'Build dumbbell topology and app installation' },
  { id: 'P2-C4', person: 'P2', date: 'Apr 26', title: 'Time-step RL Variant', status: 'done', desc: 'Implemented timestep-based RL algorithm' },
  { id: 'P7-C4', person: 'P7', date: 'May 04', title: 'UI Dashboard', status: 'in-progress', desc: 'Build full UI dashboard for data visualization' },
];

const PERSON_COLORS: Record<string, string> = {
  P1: 'bg-blue-500 text-blue-100',
  P2: 'bg-purple-500 text-purple-100',
  P3: 'bg-emerald-500 text-emerald-100',
  P4: 'bg-amber-500 text-amber-100',
  P5: 'bg-pink-500 text-pink-100',
  P6: 'bg-cyan-500 text-cyan-100',
  P7: 'bg-indigo-500 text-indigo-100',
};

export default function CommitTimeline() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null);

  const doneCount = COMMITS.filter(c => c.status === 'done').length;

  return (
    <div className="w-full max-w-4xl mx-auto" ref={containerRef}>
      <div className="mb-8 glass p-6 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Project Timeline</h2>
          <div className="flex gap-2">
            {Object.keys(PERSON_COLORS).map(p => (
              <span 
                key={p} 
                onMouseEnter={() => setHoveredPerson(p)}
                onMouseLeave={() => setHoveredPerson(null)}
                className={clsx("text-xs px-2 py-1 rounded cursor-pointer transition-opacity", PERSON_COLORS[p], hoveredPerson && hoveredPerson !== p ? "opacity-30" : "opacity-100")}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-gray-400 mb-1">{doneCount} / {COMMITS.length} Commits Complete</div>
          <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-success"
              initial={{ width: 0 }}
              animate={isInView ? { width: `${(doneCount/COMMITS.length)*100}%` } : { width: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="relative pl-8 pb-12">
        <motion.div 
          className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-white/10 origin-top"
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {COMMITS.map((commit, i) => {
          const isExpanded = expandedId === commit.id;
          const isHighlighted = hoveredPerson === commit.person || !hoveredPerson;
          
          return (
            <motion.div 
              key={commit.id}
              className={clsx("mb-8 relative transition-opacity duration-300", !isHighlighted && "opacity-30")}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: i * 0.1 + 0.5 }}
            >
              <div 
                className={clsx(
                  "absolute -left-[37px] top-1 w-6 h-6 rounded-full border-4 border-background z-10",
                  commit.status === 'done' ? "bg-success" : "bg-amber-500"
                )}
              />
              
              <div 
                className="glass p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : commit.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 w-12">{commit.date}</span>
                    <span className={clsx("text-xs px-2 py-0.5 rounded font-bold", PERSON_COLORS[commit.person])}>{commit.person}</span>
                    <span className="font-semibold text-gray-200">{commit.title}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-500">{commit.id}</span>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-gray-400 bg-black/20 p-3 rounded">{commit.desc}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
