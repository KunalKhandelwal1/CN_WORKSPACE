/**
 * @file tcp-rl-env.h
 * @brief OpenAI Gym environment interface for TCP congestion control via NS-3.
 *
 * This header defines the base TcpGymEnv class that bridges NS-3's TCP
 * socket internals (cWnd, RTT, bytesInFlight, etc.) with the OpenAI Gym
 * interface provided by ns3-gym. The Python-side DQN agent observes TCP
 * state and sends actions (new ssThresh / cWnd values) through this bridge.
 */

#ifndef TCP_RL_ENV_H
#define TCP_RL_ENV_H

#include "ns3/opengym-module.h"
#include "ns3/tcp-socket-base.h"
#include <vector>

namespace ns3 {

// Forward declarations
class Packet;
class TcpHeader;
class TcpSocketBase;
class Time;


/**
 * @class TcpGymEnv
 * @brief Abstract base class for the TCP reinforcement learning environment.
 *
 * Extends OpenGymEnv to expose TCP congestion control decisions as an
 * RL problem. The action space is a 2-parameter box (ssThresh and cWnd),
 * and subclasses must implement the observation space, observation
 * collection, and TCP callback methods.
 */
class TcpGymEnv : public OpenGymEnv
{
public:
  TcpGymEnv ();
  virtual ~TcpGymEnv ();
  static TypeId GetTypeId (void);
  virtual void DoDispose ();

  // Node and socket identification
  void SetNodeId(uint32_t id);
  void SetSocketUuid(uint32_t id);

  // Utility functions for converting TCP state/event enums to strings
  std::string GetTcpCongStateName(const TcpSocketState::TcpCongState_t state);
  std::string GetTcpCAEventName(const TcpSocketState::TcpCAEvent_t event);

  // --- OpenGym interface methods ---
  virtual Ptr<OpenGymSpace> GetActionSpace();
  virtual bool GetGameOver();
  virtual float GetReward();
  virtual std::string GetExtraInfo();
  virtual bool ExecuteActions(Ptr<OpenGymDataContainer> action);

  // Pure virtual: subclasses must define their own observation format
  virtual Ptr<OpenGymSpace> GetObservationSpace() = 0;
  virtual Ptr<OpenGymDataContainer> GetObservation() = 0;

  // Pure virtual: packet trace callbacks for inter-packet timing
  virtual void TxPktTrace(Ptr<const Packet>, const TcpHeader&, Ptr<const TcpSocketBase>) = 0;
  virtual void RxPktTrace(Ptr<const Packet>, const TcpHeader&, Ptr<const TcpSocketBase>) = 0;

  // Pure virtual: TCP congestion control callbacks
  virtual uint32_t GetSsThresh (Ptr<const TcpSocketState> tcb, uint32_t bytesInFlight) = 0;
  virtual void IncreaseWindow (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked) = 0;
  virtual void PktsAcked (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked, const Time& rtt) = 0;
  virtual void CongestionStateSet (Ptr<TcpSocketState> tcb, const TcpSocketState::TcpCongState_t newState) = 0;
  virtual void CwndEvent (Ptr<TcpSocketState> tcb, const TcpSocketState::TcpCAEvent_t event) = 0;

  /**
   * @brief Enumeration of TCP congestion control functions that can trigger
   *        an observation. Used to track which callback initiated the current
   *        Gym interaction cycle.
   */
  typedef enum
  {
    GET_SS_THRESH = 0,
    INCREASE_WINDOW,
    PKTS_ACKED,
    CONGESTION_STATE_SET,
    CWND_EVENT,
  } CalledFunc_t;

protected:
  uint32_t m_nodeId;        ///< NS-3 node identifier
  uint32_t m_socketUuid;    ///< Unique socket identifier for multi-flow support

  // Game-over flag
  bool m_isGameOver;

  // Reward value computed by subclass logic
  float m_envReward;

  // Extra info string passed to the Gym agent
  std::string m_info;

  // Actions received from the agent
  uint32_t m_new_ssThresh;  ///< Agent-selected slow start threshold
  uint32_t m_new_cWnd;      ///< Agent-selected congestion window size
};


/**
 * @class TcpEventGymEnv
 * @brief Event-driven TCP environment that notifies the agent on each TCP event.
 *
 * Fires an observation every time a TCP congestion event occurs (ACK received,
 * packet loss detected, etc.). The observation space contains 10 parameters
 * capturing the instantaneous TCP state at the moment of the event.
 *
 * Reward logic:
 *   - GetSsThresh (loss detected) → penalty reward
 *   - IncreaseWindow (ACK received) → positive reward, apply agent's cWnd
 */
class TcpEventGymEnv : public TcpGymEnv
{
public:
  TcpEventGymEnv ();
  virtual ~TcpEventGymEnv ();
  static TypeId GetTypeId (void);
  virtual void DoDispose ();

  void SetReward(float value);
  void SetPenalty(float value);

  // OpenGym interface
  virtual Ptr<OpenGymSpace> GetObservationSpace();
  Ptr<OpenGymDataContainer> GetObservation();

  // Packet trace callbacks (no-op for event-based variant)
  virtual void TxPktTrace(Ptr<const Packet>, const TcpHeader&, Ptr<const TcpSocketBase>);
  virtual void RxPktTrace(Ptr<const Packet>, const TcpHeader&, Ptr<const TcpSocketBase>);

  // TCP congestion control callbacks
  virtual uint32_t GetSsThresh (Ptr<const TcpSocketState> tcb, uint32_t bytesInFlight);
  virtual void IncreaseWindow (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked);
  virtual void PktsAcked (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked, const Time& rtt);
  virtual void CongestionStateSet (Ptr<TcpSocketState> tcb, const TcpSocketState::TcpCongState_t newState);
  virtual void CwndEvent (Ptr<TcpSocketState> tcb, const TcpSocketState::TcpCAEvent_t event);

private:
  // Observation state captured at each event
  CalledFunc_t m_calledFunc;
  Ptr<const TcpSocketState> m_tcb;
  uint32_t m_bytesInFlight;
  uint32_t m_segmentsAcked;
  Time m_rtt;
  TcpSocketState::TcpCongState_t m_newState;
  TcpSocketState::TcpCAEvent_t m_event;

  // Per-event reward and penalty values
  float m_reward;
  float m_penalty;
};


/**
 * @class TcpTimeStepGymEnv
 * @brief Timestep-based TCP environment with periodic observations.
 *
 * Instead of firing per-event, this subclass collects TCP statistics
 * over a fixed time window and notifies the agent periodically.
 * The observation space has 16 parameters that include aggregated
 * metrics (sum/avg bytesInFlight, sum/avg segmentsAcked, avg RTT,
 * min RTT, avg inter-packet Tx/Rx times, and throughput).
 */
class TcpTimeStepGymEnv : public TcpGymEnv
{
public:
  TcpTimeStepGymEnv ();

  virtual ~TcpTimeStepGymEnv ();
  static TypeId GetTypeId (void);
  virtual void DoDispose ();

  void SetDuration(Time value);
  void SetTimeStep(Time value);
  void SetReward(float value);
  void SetPenalty(float value);

  // OpenGym interface
  virtual Ptr<OpenGymSpace> GetObservationSpace();
  Ptr<OpenGymDataContainer> GetObservation();

  // Packet trace callbacks for computing inter-packet timing
  virtual void TxPktTrace(Ptr<const Packet>, const TcpHeader&, Ptr<const TcpSocketBase>);
  virtual void RxPktTrace(Ptr<const Packet>, const TcpHeader&, Ptr<const TcpSocketBase>);

  // TCP congestion control callbacks
  virtual uint32_t GetSsThresh (Ptr<const TcpSocketState> tcb, uint32_t bytesInFlight);
  virtual void IncreaseWindow (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked);
  virtual void PktsAcked (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked, const Time& rtt);
  virtual void CongestionStateSet (Ptr<TcpSocketState> tcb, const TcpSocketState::TcpCongState_t newState);
  virtual void CwndEvent (Ptr<TcpSocketState> tcb, const TcpSocketState::TcpCAEvent_t event);

private:
  void ScheduleNextStateRead();   ///< Schedule periodic Notify calls
  bool m_started {false};         ///< Whether the first observation has been sent
  Time m_duration;                ///< Total simulation duration
  Time m_timeStep;                ///< Interval between observations

  // Instantaneous TCP state
  Ptr<const TcpSocketState> m_tcb;
  std::vector<uint32_t> m_bytesInFlight;    ///< Accumulated bytesInFlight samples
  std::vector<uint32_t> m_segmentsAcked;    ///< Accumulated segmentsAcked samples

  // RTT accumulator
  uint64_t m_rttSampleNum {0};
  Time m_rttSum {MicroSeconds (0.0)};

  // Inter-packet timing accumulators
  Time m_lastPktTxTime {MicroSeconds(0.0)};
  Time m_lastPktRxTime {MicroSeconds(0.0)};
  uint64_t m_interTxTimeNum {0};
  Time m_interTxTimeSum {MicroSeconds (0.0)};
  uint64_t m_interRxTimeNum {0};
  Time m_interRxTimeSum {MicroSeconds (0.0)};

  // Running average RTT tracking (for reward computation)
  Time m_prevAvgRtt {MicroSeconds (0.0)};
  Time m_totalAvgRttSum {MicroSeconds (0.0)};
  uint64_t m_totalAvgRttNum {0};
  uint32_t m_old_cWnd {0};      ///< Previous cWnd for detecting changes

  // Reward and penalty values
  float m_reward;
  float m_penalty;
};



} // namespace ns3

#endif /* TCP_RL_ENV_H */
