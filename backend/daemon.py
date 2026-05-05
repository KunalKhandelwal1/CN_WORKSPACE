import time
import struct
import zmq
import numpy as np
import tensorflow as tf
try:
    from pyroute2 import NetlinkSocket
except ImportError:
    print("Warning: pyroute2 not available (likely on Windows). Running in Simulation Mode exclusively.")
    NetlinkSocket = None

# Constants matching the Kernel Module
NETLINK_DRLTCP = 31
DRLTCP_MCGRP = 1

# ZeroMQ Publisher config
ZMQ_PUB_ADDR = "tcp://127.0.0.1:5555"

# Load the DRL model
try:
    model = tf.keras.models.load_model('tcp_rl_model.h5')
    print("Model loaded successfully.")
except Exception as e:
    print(f"Warning: Failed to load model ({e}). Inference will output fallback cwnd.")
    model = None

# Initialize ZeroMQ
context = zmq.Context()
zmq_socket = context.socket(zmq.PUB)
zmq_socket.bind(ZMQ_PUB_ADDR)

# Initialize Netlink Socket
try:
    nl_sock = NetlinkSocket(family=NETLINK_DRLTCP)
    nl_sock.bind(groups=(1 << (DRLTCP_MCGRP - 1)))
    print("Netlink socket bound to DRLTCP_MCGRP.")
except Exception as e:
    print(f"Error binding Netlink socket: {e}. Are you on Linux running as root?")
    # We continue anyway to allow syntax checking on Windows, but the loop will fail if sock is None
    nl_sock = None

def normalize_state(snd_cwnd, srtt_us, bytes_acked):
    """
    Normalizes the u32 kernel variables into floats between 0 and 1
    for the neural network. Adjust constants based on network profile.
    """
    norm_cwnd = min(snd_cwnd / 50000.0, 1.0)
    norm_srtt = min((srtt_us / 1000.0) / 200.0, 1.0) # convert to ms, scale to 200ms max
    norm_acked = min(bytes_acked / 1e6, 1.0)
    
    # The DRL model expects a state space of 12 features.
    # We provide the 3 core metrics and pad the remaining 9 features with 0.0
    state = [norm_cwnd, norm_srtt, norm_acked] + [0.0] * 9
    return np.array([state])

def main():
    print("DRL-TCP AI Daemon started.")
    
    last_ui_update = time.time()
    # Batch aggregation buffers
    batch_rtt = []
    batch_cwnd = []
    batch_acked = []
    
    # TCP Cubic Baseline Simulation State
    cubic_cwnd_val = 500.0
    cubic_rtt_val = 20.0
    
    while True:
        if nl_sock is None:
            # WSL Simulation Mode: Fake kernel telemetry to drive the UI
            snd_cwnd = int(1000 + 300 * np.sin(time.time() * 2))
            srtt_us = int(45000 + 15000 * np.cos(time.time() * 1.5))
            bytes_acked = 1460
            time.sleep(0.01) # Simulate 100Hz packet rate
            sock_id = 0
        else:
            try:
                # 1. Receive from Kernel
                msg = nl_sock.recv()
                if not msg: continue
                
                raw_data = msg[0]['header']['length']
                payload = msg[0].get_attr('NLMSG_DATA') 
                
            except Exception as e:
                print(f"Netlink read error: {e}")
                time.sleep(1)
                continue

            # MOCK DATA for the sake of the implementation plan demonstrating logic:
            snd_cwnd, srtt_us, bytes_acked, sock_id = 1000, 45000, 1460, 12345
        
        # 2. Run Inference
        state = normalize_state(snd_cwnd, srtt_us, bytes_acked)
        if model:
            # action is a discrete or continuous delta, e.g. +10, -5, etc.
            action = model.predict(state, verbose=0)[0][0] 
            target_cwnd = int(snd_cwnd + action)
        else:
            target_cwnd = snd_cwnd + 1 # default fallback
            
        target_cwnd = max(10, target_cwnd) # Prevent window collapse
        
        # 3. Send Action back to Kernel
        # payload = struct.pack("II", sock_id, target_cwnd)
        # nl_sock.send(payload)
        
        # 4. Aggregation for UI (10Hz / 100ms)
        batch_cwnd.append(snd_cwnd)
        batch_rtt.append(srtt_us / 1000.0)
        batch_acked.append(bytes_acked)
        
        # TCP Cubic Sawtooth Math (Baseline)
        cubic_cwnd_val += 5
        if cubic_cwnd_val > 1400:
            cubic_cwnd_val = cubic_cwnd_val * 0.7
            cubic_rtt_val = 80.0
        else:
            cubic_rtt_val = max(20.0, cubic_rtt_val - 1.5)
        
        now = time.time()
        if now - last_ui_update >= 0.1:
            avg_cwnd = sum(batch_cwnd) / len(batch_cwnd)
            avg_rtt = sum(batch_rtt) / len(batch_rtt)
            
            # Pub/Sub payload
            telemetry = {
                "cwnd": round(avg_cwnd, 2),
                "rtt_ms": round(avg_rtt, 2),
                "cubic_cwnd": round(cubic_cwnd_val, 2),
                "cubic_rtt_ms": round(cubic_rtt_val, 2),
                "path_occupancy": min(round(avg_rtt / 100.0, 2), 1.0) # Mock occupancy based on RTT spike
            }
            zmq_socket.send_json(telemetry)
            
            batch_cwnd.clear()
            batch_rtt.clear()
            batch_acked.clear()
            last_ui_update = now

if __name__ == "__main__":
    main()
