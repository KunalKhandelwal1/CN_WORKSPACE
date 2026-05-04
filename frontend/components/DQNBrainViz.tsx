'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MarkerType,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';

const initialNodes = [
  // Input Layer
  { id: 'i1', position: { x: 50, y: 50 }, data: { label: 'cWnd' }, type: 'input', className: 'glass text-white' },
  { id: 'i2', position: { x: 50, y: 100 }, data: { label: 'RTT' }, type: 'input', className: 'glass text-white' },
  { id: 'i3', position: { x: 50, y: 150 }, data: { label: 'Throughput' }, type: 'input', className: 'glass text-white' },
  { id: 'i4', position: { x: 50, y: 200 }, data: { label: 'InFlight' }, type: 'input', className: 'glass text-white' },
  { id: 'i5', position: { x: 50, y: 250 }, data: { label: 'ssThresh' }, type: 'input', className: 'glass text-white' },
  
  // Hidden Layer
  { id: 'h1', position: { x: 250, y: 100 }, data: { label: 'ReLU' }, className: 'glass text-white' },
  { id: 'h2', position: { x: 250, y: 150 }, data: { label: 'ReLU' }, className: 'glass text-white' },
  { id: 'h3', position: { x: 250, y: 200 }, data: { label: 'ReLU' }, className: 'glass text-white' },

  // Output Layer
  { id: 'o0', position: { x: 450, y: 75 }, data: { label: '0: Keep' }, type: 'output', className: 'glass text-white' },
  { id: 'o1', position: { x: 450, y: 125 }, data: { label: '1: +1500' }, type: 'output', className: 'glass text-white' },
  { id: 'o2', position: { x: 450, y: 175 }, data: { label: '2: -150' }, type: 'output', className: 'glass text-white' },
  { id: 'o3', position: { x: 450, y: 225 }, data: { label: '3: +4000' }, type: 'output', className: 'glass text-white' },
];

const createEdges = () => {
  const edges = [];
  const inputs = ['i1', 'i2', 'i3', 'i4', 'i5'];
  const hiddens = ['h1', 'h2', 'h3'];
  const outputs = ['o0', 'o1', 'o2', 'o3'];

  inputs.forEach(i => {
    hiddens.forEach(h => {
      edges.push({
        id: `${i}-${h}`,
        source: i,
        target: h,
        animated: true,
        style: { stroke: 'rgba(255,255,255,0.2)' }
      });
    });
  });

  hiddens.forEach(h => {
    outputs.forEach(o => {
      edges.push({
        id: `${h}-${o}`,
        source: h,
        target: o,
        animated: true,
        style: { stroke: 'rgba(255,255,255,0.2)' }
      });
    });
  });

  return edges;
};

const initialEdges = createEdges();

export default function DQNBrainViz() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeAction, setActiveAction] = useState('o1');

  useEffect(() => {
    const interval = setInterval(() => {
      const actions = ['o0', 'o1', 'o2', 'o3'];
      const next = actions[Math.floor(Math.random() * actions.length)];
      setActiveAction(next);
      
      setNodes((nds) => nds.map(n => {
        if (n.id.startsWith('o')) {
          if (n.id === next) {
            n.className = 'glass text-white ring-2 ring-success bg-success/20';
          } else {
            n.className = 'glass text-white';
          }
        }
        return n;
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [setNodes]);

  return (
    <div className="w-full h-[400px] glass rounded-xl overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-sm font-semibold text-gray-300">How the DQN Agent Decides</h3>
      </div>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#ffffff" gap={16} size={1} opacity={0.05} />
      </ReactFlow>
    </div>
  );
}
