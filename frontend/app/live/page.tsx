'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PathOccupancyGauge from '@/components/PathOccupancyGauge';
import { Activity, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function LivePage() {
  const [data, setData] = useState<any[]>([]);
  const [status, setStatus] = useState<'Active' | 'Standby' | 'Fallback'>('Standby');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/live');
    
    ws.onopen = () => {
        setStatus('Active');
    };
    
    ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        const point = {
            time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit', fractionalSecondDigits: 1 }),
            cwnd: payload.cwnd,
            rtt: payload.rtt_ms,
            cubic_cwnd: payload.cubic_cwnd,
            cubic_rtt: payload.cubic_rtt_ms,
            occupancy: payload.path_occupancy
        };
        
        setData(prev => {
            const next = [...prev, point];
            if (next.length > 50) return next.slice(next.length - 50);
            return next;
        });
    };

    ws.onclose = () => {
        setStatus('Fallback');
    };

    return () => ws.close();
  }, []);

  const latest = data.length > 0 ? data[data.length - 1] : { cwnd: 0, rtt: 0, cubic_cwnd: 0, cubic_rtt: 0, occupancy: 0 };

  return (
    <main className="flex flex-col gap-6 max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Live Kernel Controller</h1>
          <p className="text-zinc-400 text-sm">Real-time DRL-TCP Inference Telemetry</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-black border border-zinc-800 rounded-md">
            {status === 'Active' ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : 
             status === 'Standby' ? <Activity className="w-4 h-4 text-zinc-500" /> :
             <ShieldAlert className="w-4 h-4 text-red-500" />}
            <span className={`text-sm font-mono ${status === 'Active' ? 'text-emerald-400' : status === 'Standby' ? 'text-zinc-500' : 'text-red-500'}`}>
                {status}
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-black border-zinc-800">
            <h4 className="text-zinc-400 text-sm mb-1">Current RTT</h4>
            <div className="text-2xl font-mono text-zinc-100">{latest.rtt.toFixed(2)} ms</div>
        </Card>
        <Card className="p-4 bg-black border-zinc-800">
            <h4 className="text-zinc-400 text-sm mb-1">Congestion Window</h4>
            <div className="text-2xl font-mono text-zinc-100">{latest.cwnd.toFixed(0)}</div>
        </Card>
        <PathOccupancyGauge value={latest.occupancy} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <Card className="p-4 rounded-xl h-[350px] flex flex-col bg-black border-zinc-800">
          <div className="flex justify-between items-center mb-4 flex-none">
            <h3 className="text-sm font-semibold text-zinc-300">Live RTT (ms)</h3>
            <div className="flex gap-3 text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> DRL-TCP</span>
                <span className="text-blue-500 flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> TCP Cubic</span>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCubicRtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="cubic_rtt" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCubicRtt)" isAnimationActive={false} />
                <Area type="monotone" dataKey="rtt" stroke="#10b981" fillOpacity={1} fill="url(#colorRtt)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 rounded-xl h-[350px] flex flex-col bg-black border-zinc-800">
          <div className="flex justify-between items-center mb-4 flex-none">
            <h3 className="text-sm font-semibold text-zinc-300">Live Congestion Window</h3>
            <div className="flex gap-3 text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> DRL-TCP</span>
                <span className="text-blue-500 flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> TCP Cubic</span>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)' }} />
                <Line type="stepAfter" dataKey="cubic_cwnd" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="stepAfter" dataKey="cwnd" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </main>
  );
}
