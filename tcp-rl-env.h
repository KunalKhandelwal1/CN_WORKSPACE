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


} // namespace ns3

#endif /* TCP_RL_ENV_H */
