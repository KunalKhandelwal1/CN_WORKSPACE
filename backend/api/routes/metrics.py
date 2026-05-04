from fastapi import APIRouter, HTTPException
import os
import pandas as pd

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RESULT_FILES = {
    'DRL': os.path.join(BASE_DIR, 'results_rl.txt'),
    'Cubic': os.path.join(BASE_DIR, 'results_cubic.txt'),
    'NewReno': os.path.join(BASE_DIR, 'results_newreno.txt'),
}

def parse_metrics_file(filepath):
    if not os.path.exists(filepath):
        return None
    try:
        df = pd.read_csv(filepath)
        data = []
        for _, row in df.iterrows():
            point = {
                "time": float(row.get("Time", 0)),
            }
            if "Throughput" in df.columns:
                point["throughput_mbps"] = float(row["Throughput"]) / 1e6
            if "AvgRTT" in df.columns:
                point["rtt_ms"] = float(row["AvgRTT"]) * 1000.0
            if "PacketLoss" in df.columns:
                point["packet_loss"] = int(row["PacketLoss"])
            data.append(point)
        return data
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return None

@router.get("/")
def get_all_metrics():
    """Returns parsed metrics for all algorithms."""
    results = {}
    for algo, path in RESULT_FILES.items():
        data = parse_metrics_file(path)
        if data is not None:
            results[algo] = data
    return results

@router.get("/{algo}")
def get_metrics_for_algo(algo: str):
    """Returns parsed metrics for a specific algorithm (DRL, Cubic, NewReno)."""
    if algo not in RESULT_FILES:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    data = parse_metrics_file(RESULT_FILES[algo])
    if data is None:
        raise HTTPException(status_code=404, detail="Data file not found")
        
    return data
