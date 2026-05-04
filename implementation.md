# DRL-TCP Project — Implementation Plan

## Overview

This document outlines how we divided the project work across 6 team members. Each person is responsible for a specific module and makes 4 commits over a 2-week sprint (Apr 21 – May 3).

**Project:** Deep Reinforcement Learning based TCP Congestion Control  
**Stack:** C++ (NS-3 simulator), Python (TensorFlow DQN agent), ns3-gym bridge  
**Goal:** Train a DQN agent to dynamically adjust TCP congestion window to reduce latency and packet loss vs traditional algorithms (Cubic, NewReno).

---

## Commit Schedule

| Date | Commits |
|------|---------|
| Apr 21 | P1-C1, P2-C1 |
| Apr 22 | P1-C2, P3-C1 |
| Apr 23 | P2-C2, P1-C3 |
| Apr 24 | P3-C2, P2-C3 |
| Apr 25 | P1-C4, P4-C1 |
| Apr 26 | P3-C3, P2-C4 |
| Apr 27 | P4-C2, P5-C1 |
| Apr 28 | P3-C4, P4-C3 |
| Apr 29 | P5-C2, P6-C1 |
| Apr 30 | P4-C4, P5-C3 |
| May 1  | P6-C2, P5-C4 |
| May 2  | P6-C3 |
| May 3  | P6-C4 |

> **Note:** Every person works on completely separate files, so all 6 can work independently on different devices. No one depends on another person's commit. The only exception: Person 6's last commit (graph generation) needs Person 5's `parse_metrics.py` and data files — just share those files directly.

---

## Person 1 — OpenGym Environment Bridge (C++)

**Files:** `tcp-rl-env.h`, `tcp-rl-env.cc`

This is the core C++ bridge that exposes NS-3 TCP socket internals (cWnd, RTT, bytesInFlight, etc.) as an OpenAI Gym environment so the Python agent can observe state and send actions.

**Commit 1 — Base environment class**  
Create the `TcpGymEnv` base class (extends `OpenGymEnv`). Declare all the interface methods: action space definition (2-param box space for ssThresh and cWnd), game-over check, reward getter, and an ExecuteActions method that reads the agent's chosen values. Add helper functions that convert TCP congestion state/event enums to readable strings for logging. Protected members: node ID, socket UUID, reward value, new ssThresh/cWnd.

**Commit 2 — Event-driven subclass**  
Add `TcpEventGymEnv` (extends TcpGymEnv). This fires observations on every TCP event (ACK received, loss detected). Observation space: 10 parameters (uuid, time, node, ssThresh, cWnd, segmentSize, segmentsAcked, bytesInFlight, rtt). When `GetSsThresh` is called (loss event) → assign penalty reward. When `IncreaseWindow` is called (ACK) → assign positive reward and apply the agent's chosen cWnd.

**Commit 3 — Timestep-based subclass (observation collection)**  
Add `TcpTimeStepGymEnv` (extends TcpGymEnv). Instead of firing per-event, this collects stats over a fixed time window and notifies the agent periodically. Observation space: 16 parameters (adds aggregated stats like sum/avg of bytesInFlight, sum/avg segmentsAcked, avg RTT, min RTT, avg inter-packet Tx/Rx times, throughput). Implement `ScheduleNextStateRead()` to schedule periodic Notify calls.

**Commit 4 — Reward logic and congestion callbacks**  
Complete the timestep class: implement the reward function (if agent increased cWnd and avg RTT dropped → reward; if RTT increased → penalty; if cWnd unchanged → zero reward). Track running average RTT across steps. Implement GetSsThresh/IncreaseWindow (push to vectors, trigger initial Notify on first call). Implement PktsAcked (accumulate RTT samples), CongestionStateSet, CwndEvent. Clear all accumulators after each observation.

---

## Person 2 — TCP Congestion Control Algorithm (C++)

**Files:** `tcp-rl.h`, `tcp-rl.cc`

These files integrate the OpenGym environment into NS-3's TCP congestion control API so the RL agent replaces the traditional algorithm.

**Commit 1 — Socket helper and base RL class**  
Create `TcpSocketDerived` (extends TcpSocketBase) that exposes `GetCongestionControlAlgorithm()`. Create `TcpRlBase` (extends TcpCongestionOps) with a static UUID generator, pointers to the TCP socket and Gym environment, and a `ConnectSocketCallbacks()` method that iterates all nodes/sockets to find the one using this CA instance and connects Tx/Rx packet traces.

**Commit 2 — Congestion ops delegation**  
Implement all 5 TcpCongestionOps methods in TcpRlBase (GetSsThresh, IncreaseWindow, PktsAcked, CongestionStateSet, CwndEvent). Each one does lazy initialization — if the Gym env doesn't exist yet, call CreateGymEnv() first, then delegate the call to the environment. Implement Fork() for NS-3's copy semantics.

**Commit 3 — Event-based RL variant**  
Add `TcpRl` class (extends TcpRlBase). Override CreateGymEnv to instantiate `TcpEventGymEnv`, set its UUID/reward/penalty, and connect socket callbacks. Register NS-3 attributes for Reward (default 1.0) and Penalty (default -10.0) so they can be configured from the simulation script.

**Commit 4 — Timestep-based RL variant**  
Add `TcpRlTimeBased` class (extends TcpRlBase). Override CreateGymEnv to instantiate `TcpTimeStepGymEnv` with configurable Duration (default 10s), StepTime (default 100ms), Reward, and Penalty. Register all 4 as NS-3 attributes.

---

## Person 3 — NS-3 Network Simulation (C++)

**Files:** `sim.cc`

The main simulation script that builds the network topology, configures TCP, runs the simulation, and collects performance metrics.

**Commit 1 — Simulation skeleton with CLI**  
Set up includes for all NS-3 modules (core, network, internet, point-to-point, applications, error-model, flow-monitor, traffic-control, opengym, tcp-rl). Define a packet counter callback. Define `PerformanceMetrics` struct (time, throughput, avgRtt, packetLoss, NEP, WBI). In main(): declare all simulation parameters (port 5555, bottleneck 2Mbps/10ms, access 10Mbps/20ms, duration 10s, MTU 400 bytes, reward 1.0, penalty -0.5). Set up CommandLine parser for transport_prot and duration.

**Commit 2 — OpenGym interface and TCP configuration**  
If the selected protocol is TcpRlTimeBased, create the OpenGym interface and set step time/duration/reward/penalty via Config::SetDefault. Calculate TCP ADU size from MTU minus IP and TCP headers. Configure TCP socket: 4MB send/receive buffers, SACK enabled, delayed ACK count 2, classic recovery. Select the TCP variant (NewReno, Cubic, or RL) based on the CLI argument.

**Commit 3 — Dumbbell topology and applications**  
Build the network: error model (rate-based, packet unit), point-to-point bottleneck and access links, dumbbell helper. Install internet stack. Configure PfifoFast queue disc with BDP-based max size. Assign IP addresses (10.1.1.0, 10.2.1.0, 10.3.1.0). Set up global routing. Install PacketSink on receiver nodes and BulkSendHelper on sender nodes.

**Commit 4 — FlowMonitor metrics and file output**  
Implement `CollectMetrics()` function: use a static map of previous flow stats to compute per-interval deltas for bytes, packets, delay, and loss. Calculate throughput (bps), avg RTT, NEP (tx/rx ratio), WBI (waste ratio). Schedule periodic collection every 0.1s. `SaveMetricsToFiles()` writes results to CSV files. In main(): install FlowMonitor, schedule collection, run simulator, save metrics, notify OpenGym of simulation end, cleanup.

---

## Person 4 — DQN Training Agent (Python)

**Files:** `TCP-RL-Agent.py`

The Python-side DQN agent that connects to NS-3 via ns3-gym, trains a neural network to select congestion control actions, and visualizes results.

**Commit 1 — Environment setup and agent factory**  
Import dependencies (math, sys, argparse, os, numpy, matplotlib, tensorflow). Add ns3gym to Python path. Set up argument parser with options: --start (default 1), --iterations (default 100), --steps (default 1000), --mode (train/test). Create ns3env.Ns3Env with port 5555 and calculated sim time. Build an agent factory function that creates the right TCP agent type (event or time-based) keyed by socket UUID.

**Commit 2 — DQN model and action space**  
Define the neural network: Sequential model with one hidden layer (size = average of input and output, ReLU activation) and softmax output. State size = observation space minus 4 metadata fields. 4 discrete actions: keep constant (0), normal increase (+1500), conservative decrease (-150), rocket start (+4000). Handle train vs test mode: test loads saved model with epsilon=0; train creates new model with epsilon=1.0. Compile with Adam optimizer (lr=1e-3) and categorical crossentropy loss. Set up epsilon decay and discount factor (0.95).

**Commit 3 — Training loop with Q-learning**  
Main loop over iterations and steps. Reset environment, strip metadata from state. Epsilon-greedy action selection (random if exploring, else argmax of Q-values). Apply action to cWnd with heuristic: if throughput variance over recent window is very small, cap the window to prevent overshooting. Clamp cWnd between initial value and ssThresh. Send action to environment. In train mode: compute Q-learning target (reward + discount * max future Q), update model with single-step fit. Decay epsilon. Record cWnd/RTT/throughput/reward histories on last iteration.

**Commit 4 — Model persistence and visualization**  
After training loop: save model to .h5 file. Write RTT and throughput history to a TSV file. Generate 4 matplotlib subplots (2×2): congestion window over time, throughput over time, RTT over time, cumulative reward. Save as PNG.

---

## Person 5 — Statistical Analysis & Results (Python)

**Files:** `parse_metrics.py`, result data files

Parses NS-3 simulation output files and generates comparative analysis with statistical tests.

**Commit 1 — CSV parser**  
Create parse_metrics.py. Define file paths for the 3 result files (Cubic, NewReno, DRL-TCP). Implement `parse_metrics(filename)`: read CSV, skip header, extract Time (float), Throughput (convert bps to Mbps), RTT (convert seconds to ms), Packet Loss (int, default 0 if missing). Return as pandas DataFrame. Handle missing files gracefully.

**Commit 2 — Statistical comparison**  
Implement `run_analysis_and_plot()`: load all 3 DataFrames. For Cubic vs DRL: compute percentage difference in mean throughput and RTT, run Welch's t-test (scipy.stats.ttest_ind, equal_var=False). Same for NewReno vs DRL. Print formatted results with p-values.

**Commit 3 — Comparison plots**  
Generate 3 publication-quality matplotlib figures (12×6): throughput comparison (Mbps vs time), RTT comparison (ms vs time), cumulative packet loss (using cumsum). All with legends, dashed grid lines, proper axis labels. Save to graphs/ directory.

**Commit 4 — Simulation result data**  
Add the 4 data files from simulation runs: results_rl.txt, results_cubic.txt, results_newreno.txt (100 rows each, CSV format with header), and rtt_tp_history.txt (99 rows, TSV format).

---

## Person 6 — Base Agent Classes + Documentation

**Files:** `tcp_base.py`, `README.md`, `code.txt`, graph generation

**Commit 1 — TCP base agent classes**  
Create `tcp_base.py` with 3 classes. `Tcp` base class: stores observation and action spaces, has a get_action stub. `TcpEventBased(Tcp)`: get_action parses 15 observation fields from the event-based environment (socket UUID, env type, sim time, node ID, ssThresh, cWnd, segment size, segments acked, bytes in flight, last RTT, min RTT, called function, CA state, CA event, ECN state). Returns default [5×segmentSize, 10×segmentSize]. Add comments explaining each observation field and the CA state/event enums. `TcpTimeBased(Tcp)`: get_action parses 16 fields from the timestep environment (adds aggregated stats and throughput). Same default return.

**Commit 2 — README: overview, badges, and findings**  
Create README.md with project title, shield badges (arXiv, PwC, language, platform, framework, status), paper link. Write project description, key research findings (46.29% RTT reduction, near-zero packet loss, stability vs sawtooth pattern), technical approach (DQN with experience replay, 4 actions, 5-feature state space, reward function description).

**Commit 3 — README: results, prerequisites, usage guide**  
Add visual results section with embedded graph images. Prerequisites: Linux, NS-3 v3.35, ns3-gym, Python dependencies. Usage guide: two-terminal workflow. Create `code.txt` with waf configure and run commands for all 3 TCP variants.

**Commit 4 — Citation, contributors, and graph generation**  
Add BibTeX citation block and contributors section to README. Run `parse_metrics.py` to generate the 3 comparison graph PNGs in graphs/ and commit them.

---

## System Prompt Template

To generate each phase, use this prompt and fill in the phase-specific section:

```
You are building a CN project from scratch: "Deep Reinforcement Learning based TCP Congestion Control".
It uses a DQN agent (Python/TensorFlow) to control TCP cWnd inside NS-3 via ns3-gym.

KEY CONSTANTS:
- openGymPort=5555, tcpEnvTimeStep=0.1, nLeaf=1
- Bottleneck: 2Mbps/10ms, Access: 10Mbps/20ms, duration=10.0s, mtu=400 bytes
- Rewards/penalties: sim.cc (1.0/-0.5), TcpRl (-10.0), TcpRlTimeBased (-1.0)
- DQN actions: {0: keep, 1: +1500, 2: -150, 3: +4000}
- Adam lr=1e-3, discount=0.95, epsilon 1.0→0.01
- TCP buffers: 4MB, SACK=true, DelAckCount=2
- ns3gym path: '/home/aglamazlarefe/ns-allinone-3.35/ns-3.35/contrib/opengym/model'
- Result file path: '/home/aglamazlarefe/ns-allinone-3.35/ns-3.35/contrib/opengym/examples/TCP-RL'
- Model file: tcp_rl_model.h5

RULES:
1. Use proper NS-3 conventions (NS_OBJECT_ENSURE_REGISTERED, NS_LOG_COMPONENT_DEFINE, TypeId registration)
2. All comments should be in English
3. Variable/function names should follow the NS-3 naming style (camelCase for functions, m_ prefix for members)
4. README badges link to arXiv:2508.01047
5. Preserve the exact numerical constants listed above
6. Write clean, well-commented code

YOUR TASK — PHASE [X]:
[Paste the relevant phase description from above]
```

---

## Phase 7: Frontend UI Demo Dashboard

This phase introduces a massive architectural restructuring to provide a highly interactive, animated Next.js dashboard that visualizes the DRL-TCP simulation.

### Commit 1 — FastAPI backend + scaffold + animation setup
- Move all simulation and agent files into `backend/`.
- Set up `backend/api/server.py` with FastAPI to serve metrics and training history.
- Initialize Next.js 14 App Router in `frontend/` with Tailwind CSS, `framer-motion`, `react-spring`, `@xyflow/react`, and `recharts`.
- Create `lib/api.ts` and `layout.tsx` for global page transitions.

### Commit 2 — Hero section + animated network demo
- Implement `NavBar` with sliding indicators.
- Implement `HeroAnimation` using React Spring to simulate physics-based packet flows across the dumbbell topology.
- Implement `DQNBrainViz` using ReactFlow to visualize the active states of the DQN layers.
- Implement `MetricCard` components on the overview page.

### Commit 3 — Comparison, Training, Config pages
- Create the comparison dashboard with `CwndRaceChart` and interactive recharts.
- Create the training dashboard with a `LivePacketFlow` progress bar and step scrubber replay slider.
- Create the configuration page with `ConfigSlider` components and optimistic `waf` command string generation.

### Commit 4 — Commit tracker + README + polish
- Create the `CommitTimeline` page mapping all project contributions.
- Add global polish including a 404 page and loading skeletons.
- Update `code.txt` and `README.md` with startup instructions for the UI dashboard.
