from fastapi import APIRouter, HTTPException
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RESULT_FILES = {
    'DRL': os.path.join(BASE_DIR, 'results_rl.txt'),
    'Cubic': os.path.join(BASE_DIR, 'results_cubic.txt'),
    'NewReno': os.path.join(BASE_DIR, 'results_newreno.txt'),
}

def parse_metrics_file(filepath):
    """Parse the NS-3 simulation result CSV files.
    
    The actual file format has a header line:
        Time (s), Throughput (bps), Average RTT (s), Packet Loss (packets)
    Values can be in scientific notation (e.g. 2.14016e+06).
    """
    if not os.path.exists(filepath):
        return None
    try:
        data = []
        with open(filepath, 'r') as f:
            lines = f.readlines()
            if not lines:
                return None

            # Skip header line
            start_idx = 0
            if "Time" in lines[0] or not lines[0].strip()[0].isdigit():
                start_idx = 1

            for line in lines[start_idx:]:
                line = line.strip()
                if not line:
                    continue
                parts = [p.strip() for p in line.split(',')]
                if len(parts) >= 3:
                    try:
                        time_val = float(parts[0])
                        throughput_bps = float(parts[1])
                        rtt_sec = float(parts[2])
                        loss = int(parts[3]) if len(parts) > 3 else 0

                        data.append({
                            "time": round(time_val, 2),
                            "throughput_mbps": round(throughput_bps / 1e6, 4),
                            "rtt_ms": round(rtt_sec * 1000, 4),
                            "packet_loss": loss,
                        })
                    except ValueError:
                        continue
        return data if data else None
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

@router.get("/summary")
def get_summary_stats():
    """Returns summary statistics for all algorithms."""
    all_metrics = {}
    for algo, path in RESULT_FILES.items():
        data = parse_metrics_file(path)
        if data is not None:
            all_metrics[algo] = data

    summaries = {}
    for algo, points in all_metrics.items():
        if not points:
            continue
        throughputs = [p["throughput_mbps"] for p in points]
        rtts = [p["rtt_ms"] for p in points]
        losses = [p["packet_loss"] for p in points]
        summaries[algo] = {
            "avg_throughput_mbps": round(sum(throughputs) / len(throughputs), 4),
            "avg_rtt_ms": round(sum(rtts) / len(rtts), 4),
            "max_rtt_ms": round(max(rtts), 4),
            "min_rtt_ms": round(min(rtts), 4),
            "total_packet_loss": sum(losses),
            "data_points": len(points),
        }
    
    # Compute improvement percentages
    if "DRL" in summaries and "Cubic" in summaries:
        drl = summaries["DRL"]
        cubic = summaries["Cubic"]
        summaries["drl_vs_cubic"] = {
            "rtt_reduction_pct": round(
                ((cubic["avg_rtt_ms"] - drl["avg_rtt_ms"]) / cubic["avg_rtt_ms"]) * 100, 2
            ),
            "loss_reduction_pct": round(
                ((cubic["total_packet_loss"] - drl["total_packet_loss"]) / max(cubic["total_packet_loss"], 1)) * 100, 2
            ),
        }
    if "DRL" in summaries and "NewReno" in summaries:
        drl = summaries["DRL"]
        newreno = summaries["NewReno"]
        summaries["drl_vs_newreno"] = {
            "rtt_reduction_pct": round(
                ((newreno["avg_rtt_ms"] - drl["avg_rtt_ms"]) / newreno["avg_rtt_ms"]) * 100, 2
            ),
            "loss_reduction_pct": round(
                ((newreno["total_packet_loss"] - drl["total_packet_loss"]) / max(newreno["total_packet_loss"], 1)) * 100, 2
            ),
        }

    return summaries

@router.get("/{algo}")
def get_metrics_for_algo(algo: str):
    """Returns parsed metrics for a specific algorithm (DRL, Cubic, NewReno)."""
    if algo not in RESULT_FILES:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    data = parse_metrics_file(RESULT_FILES[algo])
    if data is None:
        raise HTTPException(status_code=404, detail="Data file not found")
        
    return data
