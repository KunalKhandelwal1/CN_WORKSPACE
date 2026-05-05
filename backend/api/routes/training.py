from fastapi import APIRouter, HTTPException
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HISTORY_FILE = os.path.join(BASE_DIR, 'rtt_tp_history.txt')

@router.get("/")
def get_training_history():
    """Returns parsed training history from the DRL agent's last training run.
    
    File format (TSV):
        Adım	RTT (μs)	Throughput (bits)
        1	0	0
        2	102806	27200
        ...
    """
    if not os.path.exists(HISTORY_FILE):
        raise HTTPException(status_code=404, detail="Training history file not found")
        
    try:
        data = []
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            if not lines:
                raise HTTPException(status_code=404, detail="Empty file")

            # Skip header
            for line in lines[1:]:
                line = line.strip()
                if not line:
                    continue
                parts = line.split('\t')
                if len(parts) >= 3:
                    try:
                        step = int(parts[0])
                        rtt_us = float(parts[1])
                        throughput_bits = float(parts[2])

                        # Convert units
                        rtt_ms = rtt_us / 1000.0
                        throughput_mbps = throughput_bits / 1e6

                        # Compute synthetic reward: throughput - latency penalty
                        reward = throughput_mbps * 10 - rtt_ms * 0.1

                        # Estimate cWnd from throughput and RTT
                        if rtt_us > 0:
                            cwnd = int(throughput_bits * (rtt_us / 1e6) / 8)
                        else:
                            cwnd = 0

                        data.append({
                            "step": step,
                            "time": round(step * 0.1, 1),
                            "throughput_mbps": round(throughput_mbps, 4),
                            "rtt_ms": round(rtt_ms, 4),
                            "reward": round(reward, 4),
                            "cwnd": cwnd,
                        })
                    except ValueError:
                        continue
        return data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error parsing {HISTORY_FILE}: {e}")
        raise HTTPException(status_code=500, detail="Error parsing data")
