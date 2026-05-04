# Deep Reinforcement Learning based TCP Congestion Control

This project demonstrates a Deep Q-Network (DQN) agent controlling TCP congestion window behavior inside NS-3 via an OpenGym bridge. The goal is to reduce latency and packet loss compared to traditional TCP algorithms such as Cubic and NewReno.

## Highlights

- C++ NS-3 simulation hooks for RL-based congestion control
- Python DQN agent connected through `ns3-gym`
- Comparison of `TcpRl`, `TcpRlTimeBased`, `TcpCubic`, and `TcpNewReno`
- Metrics output to CSV for throughput, RTT, packet loss, NEP, and WBI

## Project Files

The project is split into two modules:

`backend/` (NS-3 C++ and Python Agent)
- `sim.cc` — NS-3 dumbbell topology simulation
- `tcp-rl.h` / `tcp-rl.cc` — RL-aware TCP binding
- `tcp-rl-env.h` / `tcp-rl-env.cc` — OpenGym environment wrappers
- `TCP-RL-Agent.py` — Python DQN agent
- `parse_metrics.py` — Metrics parsing and comparison
- `api/server.py` — FastAPI server serving data to the UI

`frontend/` (Next.js Animated UI Dashboard)
- `app/` — Dashboard pages (Overview, Comparison, Training, Config, Commits)
- `components/` — UI components (HeroAnimation, DQNBrainViz, etc.)

## Usage

1. Configure NS-3 with OpenGym support.
2. Build the simulation:
   ```bash
   ./waf configure --enable-examples --enable-tests
   ./waf build
   ```
3. Run baseline or RL simulations:
   ```bash
   ./waf --run "scratch/sim --transport_prot=TcpNewReno --duration=10"
   ./waf --run "scratch/sim --transport_prot=TcpCubic --duration=10"
   ./waf --run "scratch/sim --transport_prot=TcpRlTimeBased --duration=10"
   ```
4. Train the agent with Python:
   ```bash
   python TCP-RL-Agent.py --mode train --iterations 100 --steps 1000
   ```
5. Analyze results:
   ```bash
   python parse_metrics.py
   ```

## Notes

- `openGymPort` defaults to `5555`.
- The DQN agent uses reward parameters: `1.0` and penalty `-0.5` for time-based RL.
- The TCP ADU size is derived from `mtu=400` bytes minus IPv4 and TCP header overhead.

## Running the Dashboard

### 1. Backend API
```bash
cd backend/api
pip install fastapi uvicorn pandas
uvicorn server:app --reload
```

### 2. Frontend UI
```bash
cd frontend
npm install
npm run dev
```

## UI Screenshots
[Hero Animation Placeholder]
[DQN Brain Visualization Placeholder]
[Cwnd Race Chart Placeholder]

## Contributors

- **Dyfinitie** (<v08pandey@gmail.com>)
- **tusharsaharan** (<tusharsaharan18@gmail.com>)
- **tushar**
