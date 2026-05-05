import { Card } from "@/components/ui/card"
import clsx from 'clsx';

export default function PathOccupancyGauge({ value }: { value: number }) {
    const pct = Math.min(Math.max(value * 100, 0), 100);
    return (
        <Card className="p-4 bg-black border-zinc-800 flex flex-col items-center justify-center">
            <h4 className="text-zinc-400 text-sm mb-2">Path Occupancy</h4>
            <div className="w-full h-4 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                    className={clsx(
                        "h-full transition-all duration-300",
                        pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-zinc-100"
                    )} 
                    style={{ width: `${pct}%` }} 
                />
            </div>
            <span className="text-zinc-300 mt-2 font-mono text-xs">{pct.toFixed(1)}%</span>
        </Card>
    );
}
