from fastapi import APIRouter, HTTPException
import os
import pandas as pd

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HISTORY_FILE = os.path.join(BASE_DIR, 'rtt_tp_history.txt')

@router.get("/")
def get_training_history():
    """Returns parsed training history."""
    if not os.path.exists(HISTORY_FILE):
        raise HTTPException(status_code=404, detail="Training history file not found")
        
    try:
        # Assuming TSV format based on the generation script
        df = pd.read_csv(HISTORY_FILE, sep='\t')
        data = []
        for index, row in df.iterrows():
            point = {
                "step": index + 1,
                "time": float(row.get("Time", 0)),
            }
            if "Throughput" in df.columns:
                point["throughput_mbps"] = float(row["Throughput"]) / 1e6
            if "RTT" in df.columns:
                point["rtt_ms"] = float(row["RTT"]) * 1000.0
                
            # Synthetic fields for visualization since they might not be in the dummy data
            point["reward"] = point.get("throughput_mbps", 0) * 10 - point.get("rtt_ms", 0)
            point["cwnd"] = int(10000 + (index * 50))
            
            data.append(point)
        return data
    except Exception as e:
        print(f"Error parsing {HISTORY_FILE}: {e}")
        raise HTTPException(status_code=500, detail="Error parsing data")
