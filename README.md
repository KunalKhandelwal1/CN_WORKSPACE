# Deep Reinforcement Learning based TCP Congestion Control

This project demonstrates a Deep Q-Network (DQN) agent controlling TCP congestion window behavior inside NS-3 via an OpenGym bridge. The goal is to reduce latency and packet loss compared to traditional TCP algorithms such as Cubic and NewReno.

## Highlights

- C++ NS-3 simulation hooks for RL-based congestion control
- Python DQN agent connected through `ns3-gym`
- Comparison of `TcpRl`, `TcpRlTimeBased`, `TcpCubic`, and `TcpNewReno`
- Metrics output to CSV for throughput, RTT, packet loss, NEP, and WBI

## Project Files

- `sim.cc` — NS-3 dumbbell topology simulation and metric collection
- `tcp-rl.h` / `tcp-rl.cc` — RL-aware TCP congestion control algorithm binding
- `tcp-rl-env.h` / `tcp-rl-env.cc` — OpenGym environment wrappers for TCP events and time-step observations
- `TCP-RL-Agent.py` — Python DQN training and testing agent
- `parse_metrics.py` — Post-processing and comparison of simulation outputs
- `tcp_base.py` — Python base classes for TCP agent wrappers
- `code.txt` — Build and run commands

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

## Contributors

- **Dyfinitie** (<v08pandey@gmail.com>)
- **tusharsaharan** (<tusharsaharan18@gmail.com>)
- **tushar**
