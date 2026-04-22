/**
 * @file tcp-rl-env.cc
 * @brief Implementation of the TcpGymEnv base class.
 *
 * Provides the core OpenGym environment logic shared by all TCP RL
 * environment variants. This includes action space definition (2-param
 * box for ssThresh and cWnd), game-over checking, reward retrieval,
 * action execution, and utility methods for converting NS-3 TCP
 * congestion state/event enums to human-readable strings.
 */

#include "tcp-rl-env.h"
#include "ns3/tcp-header.h"
#include "ns3/object.h"
#include "ns3/core-module.h"
#include "ns3/log.h"
#include "ns3/simulator.h"
#include "ns3/tcp-socket-base.h"
#include <vector>
#include <numeric>


namespace ns3 {

NS_LOG_COMPONENT_DEFINE ("ns3::TcpGymEnv");
NS_OBJECT_ENSURE_REGISTERED (TcpGymEnv);

/*
 * ============================================================
 *  TcpGymEnv — Constructor / Destructor / TypeId
 * ============================================================
 */

TcpGymEnv::TcpGymEnv ()
{
  NS_LOG_FUNCTION (this);
  SetOpenGymInterface(OpenGymInterface::Get());
}

TcpGymEnv::~TcpGymEnv ()
{
  NS_LOG_FUNCTION (this);
}

TypeId
TcpGymEnv::GetTypeId (void)
{
  static TypeId tid = TypeId ("ns3::TcpGymEnv")
    .SetParent<OpenGymEnv> ()
    .SetGroupName ("OpenGym")
  ;

  return tid;
}

void
TcpGymEnv::DoDispose ()
{
  NS_LOG_FUNCTION (this);
}

/*
 * ============================================================
 *  Node / Socket Identification
 * ============================================================
 */

void
TcpGymEnv::SetNodeId(uint32_t id)
{
  NS_LOG_FUNCTION (this);
  m_nodeId = id;
}

void
TcpGymEnv::SetSocketUuid(uint32_t id)
{
  NS_LOG_FUNCTION (this);
  m_socketUuid = id;
}

/*
 * ============================================================
 *  Helper: Convert TCP congestion state enum to readable string
 * ============================================================
 */

std::string
TcpGymEnv::GetTcpCongStateName(const TcpSocketState::TcpCongState_t state)
{
  std::string stateName = "UNKNOWN";
  switch(state) {
    case TcpSocketState::CA_OPEN:
      stateName = "CA_OPEN";
      break;
    case TcpSocketState::CA_DISORDER:
      stateName = "CA_DISORDER";
      break;
    case TcpSocketState::CA_CWR:
      stateName = "CA_CWR";
      break;
    case TcpSocketState::CA_RECOVERY:
      stateName = "CA_RECOVERY";
      break;
    case TcpSocketState::CA_LOSS:
      stateName = "CA_LOSS";
      break;
    case TcpSocketState::CA_LAST_STATE:
      stateName = "CA_LAST_STATE";
      break;
    default:
       stateName = "UNKNOWN";
       break;
  }
  return stateName;
}

/*
 * ============================================================
 *  Helper: Convert TCP CA event enum to readable string
 * ============================================================
 */

std::string
TcpGymEnv::GetTcpCAEventName(const TcpSocketState::TcpCAEvent_t event)
{
  std::string eventName = "UNKNOWN";
  switch(event) {
    case TcpSocketState::CA_EVENT_TX_START:
      eventName = "CA_EVENT_TX_START";
      break;
    case TcpSocketState::CA_EVENT_CWND_RESTART:
      eventName = "CA_EVENT_CWND_RESTART";
      break;
    case TcpSocketState::CA_EVENT_COMPLETE_CWR:
      eventName = "CA_EVENT_COMPLETE_CWR";
      break;
    case TcpSocketState::CA_EVENT_LOSS:
      eventName = "CA_EVENT_LOSS";
      break;
    case TcpSocketState::CA_EVENT_ECN_NO_CE:
      eventName = "CA_EVENT_ECN_NO_CE";
      break;
    case TcpSocketState::CA_EVENT_ECN_IS_CE:
      eventName = "CA_EVENT_ECN_IS_CE";
      break;
    case TcpSocketState::CA_EVENT_DELAYED_ACK:
      eventName = "CA_EVENT_DELAYED_ACK";
      break;
    case TcpSocketState::CA_EVENT_NON_DELAYED_ACK:
      eventName = "CA_EVENT_NON_DELAYED_ACK";
      break;
    default:
       eventName = "UNKNOWN";
       break;
  }
  return eventName;
}

/*
 * ============================================================
 *  OpenGym Interface: Action Space
 *
 *  The action space is a Box with 2 uint32 parameters:
 *    [0] = new ssThresh value
 *    [1] = new cWnd value
 *  Range: [0, 65535]
 * ============================================================
 */

Ptr<OpenGymSpace>
TcpGymEnv::GetActionSpace()
{
  uint32_t parameterNum = 2;
  float low = 0.0;
  float high = 65535;
  std::vector<uint32_t> shape = {parameterNum,};
  std::string dtype = TypeNameGet<uint32_t> ();

  Ptr<OpenGymBoxSpace> box = CreateObject<OpenGymBoxSpace> (low, high, shape, dtype);
  NS_LOG_INFO ("MyGetActionSpace: " << box);
  return box;
}

/*
 * ============================================================
 *  OpenGym Interface: Game Over
 *
 *  Returns false under normal operation. Contains a debug
 *  counter that can be toggled for testing (terminates after
 *  10 steps if the test flag is enabled).
 * ============================================================
 */

bool
TcpGymEnv::GetGameOver()
{
  m_isGameOver = false;
  bool test = false;
  static float stepCounter = 0.0;
  stepCounter += 1;
  if (stepCounter == 10 && test) {
      m_isGameOver = true;
  }
  NS_LOG_INFO ("MyGetGameOver: " << m_isGameOver);
  return m_isGameOver;
}

/*
 * ============================================================
 *  OpenGym Interface: Reward
 *
 *  Returns the reward value computed by the active subclass.
 *  The subclass sets m_envReward based on its own reward logic
 *  (e.g., positive for ACK, negative for loss).
 * ============================================================
 */

float
TcpGymEnv::GetReward()
{
  NS_LOG_INFO("MyGetReward: " << m_envReward);
  return m_envReward;
}

/*
 * ============================================================
 *  OpenGym Interface: Extra Info
 *
 *  Returns a descriptive string about the most recent callback
 *  (e.g., "GetSsThresh", "IncreaseWindow"). Useful for the
 *  Python agent to know which TCP event triggered this step.
 * ============================================================
 */

std::string
TcpGymEnv::GetExtraInfo()
{
  NS_LOG_INFO("MyGetExtraInfo: " << m_info);
  return m_info;
}

/*
 * ============================================================
 *  OpenGym Interface: Execute Actions
 *
 *  Reads the 2-parameter action from the agent:
 *    action[0] → new slow start threshold (ssThresh)
 *    action[1] → new congestion window size (cWnd)
 *  These values are stored and applied in the subclass's
 *  GetSsThresh / IncreaseWindow callbacks.
 * ============================================================
 */

bool
TcpGymEnv::ExecuteActions(Ptr<OpenGymDataContainer> action)
{
  Ptr<OpenGymBoxContainer<uint32_t> > box = DynamicCast<OpenGymBoxContainer<uint32_t> >(action);
  m_new_ssThresh = box->GetValue(0);
  m_new_cWnd = box->GetValue(1);

  NS_LOG_INFO ("MyExecuteActions: " << action);
  return true;
}

/*
 * ============================================================
 *  TcpEventGymEnv — Event-Driven RL Environment
 *
 *  Notifies the Python agent on every TCP congestion event.
 *  Each notification carries a 10-parameter observation of the
 *  instantaneous TCP state at the moment of the event.
 * ============================================================
 */

NS_OBJECT_ENSURE_REGISTERED (TcpEventGymEnv);

TcpEventGymEnv::TcpEventGymEnv () : TcpGymEnv()
{
  NS_LOG_FUNCTION (this);
}

TcpEventGymEnv::~TcpEventGymEnv ()
{
  NS_LOG_FUNCTION (this);
}

TypeId
TcpEventGymEnv::GetTypeId (void)
{
  static TypeId tid = TypeId ("ns3::TcpEventGymEnv")
    .SetParent<TcpGymEnv> ()
    .SetGroupName ("OpenGym")
    .AddConstructor<TcpEventGymEnv> ()
  ;

  return tid;
}

void
TcpEventGymEnv::DoDispose ()
{
  NS_LOG_FUNCTION (this);
}

void
TcpEventGymEnv::SetReward(float value)
{
  NS_LOG_FUNCTION (this);
  m_reward = value;
}

void
TcpEventGymEnv::SetPenalty(float value)
{
  NS_LOG_FUNCTION (this);
  m_penalty = value;
}

/*
 * Observation space: 10-parameter box of uint64 values.
 * Parameters: socketUuid, envType, simTime, nodeId, ssThresh,
 *             cWnd, segmentSize, segmentsAcked, bytesInFlight, rtt
 */
Ptr<OpenGymSpace>
TcpEventGymEnv::GetObservationSpace()
{
  uint32_t parameterNum = 10;
  float low = 0.0;
  float high = 1000000000.0;
  std::vector<uint32_t> shape = {parameterNum,};
  std::string dtype = TypeNameGet<uint64_t> ();

  Ptr<OpenGymBoxSpace> box = CreateObject<OpenGymBoxSpace> (low, high, shape, dtype);
  NS_LOG_INFO ("MyGetObservationSpace: " << box);
  return box;
}

/*
 * Collect the current TCP state snapshot as a 10-element observation.
 * Values are packed as uint64 for compatibility with the Gym interface.
 */
Ptr<OpenGymDataContainer>
TcpEventGymEnv::GetObservation()
{
  uint32_t parameterNum = 10;
  std::vector<uint32_t> shape = {parameterNum,};

  Ptr<OpenGymBoxContainer<uint64_t> > box = CreateObject<OpenGymBoxContainer<uint64_t> >(shape);

  box->AddValue(m_socketUuid);
  box->AddValue(0);                                     // envType = 0 (event-based)
  box->AddValue(Simulator::Now().GetMicroSeconds ());    // current simulation time
  box->AddValue(m_nodeId);
  box->AddValue(m_tcb->m_ssThresh);
  box->AddValue(m_tcb->m_cWnd);
  box->AddValue(m_tcb->m_segmentSize);
  box->AddValue(m_segmentsAcked);
  box->AddValue(m_bytesInFlight);
  box->AddValue(m_rtt.GetMicroSeconds ());
  NS_LOG_INFO ("MyGetObservation: " << box);
  return box;
}

/*
 * Packet trace callbacks — no-op for the event-based variant since
 * observations are triggered by congestion events, not individual packets.
 */
void
TcpEventGymEnv::TxPktTrace(Ptr<const Packet>, const TcpHeader&, Ptr<const TcpSocketBase>)
{
  NS_LOG_FUNCTION (this);
}

void
TcpEventGymEnv::RxPktTrace(Ptr<const Packet>, const TcpHeader&, Ptr<const TcpSocketBase>)
{
  NS_LOG_FUNCTION (this);
}

/*
 * GetSsThresh — called when packet loss is detected.
 * Assigns the penalty reward and notifies the agent immediately.
 * Returns the agent's chosen ssThresh value.
 */
uint32_t
TcpEventGymEnv::GetSsThresh (Ptr<const TcpSocketState> tcb, uint32_t bytesInFlight)
{
  NS_LOG_FUNCTION (this);
  // Loss detected — assign penalty reward
  m_envReward = m_penalty;

  NS_LOG_INFO(Simulator::Now() << " Node: " << m_nodeId << " GetSsThresh, BytesInFlight: " << bytesInFlight);
  m_calledFunc = CalledFunc_t::GET_SS_THRESH;
  m_info = "GetSsThresh";
  m_tcb = tcb;
  m_bytesInFlight = bytesInFlight;
  Notify();
  return m_new_ssThresh;
}

/*
 * IncreaseWindow — called when an ACK is received successfully.
 * Assigns the positive reward, notifies the agent, and applies the
 * agent's chosen cWnd value to the TCP socket.
 */
void
TcpEventGymEnv::IncreaseWindow (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked)
{
  NS_LOG_FUNCTION (this);
  // ACK received — assign positive reward
  m_envReward = m_reward;

  NS_LOG_INFO(Simulator::Now() << " Node: " << m_nodeId << " IncreaseWindow, SegmentsAcked: " << segmentsAcked);
  m_calledFunc = CalledFunc_t::INCREASE_WINDOW;
  m_info = "IncreaseWindow";
  m_tcb = tcb;
  m_segmentsAcked = segmentsAcked;
  Notify();
  tcb->m_cWnd = m_new_cWnd;
}

/*
 * PktsAcked — record RTT sample from acknowledged packets.
 * Does not trigger a Notify; state is stored for the next observation.
 */
void
TcpEventGymEnv::PktsAcked (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked, const Time& rtt)
{
  NS_LOG_FUNCTION (this);
  NS_LOG_INFO(Simulator::Now() << " Node: " << m_nodeId << " PktsAcked, SegmentsAcked: " << segmentsAcked << " Rtt: " << rtt);
  m_calledFunc = CalledFunc_t::PKTS_ACKED;
  m_info = "PktsAcked";
  m_tcb = tcb;
  m_segmentsAcked = segmentsAcked;
  m_rtt = rtt;
}

/*
 * CongestionStateSet — log the new congestion state.
 * Does not trigger a Notify; used for observation context.
 */
void
TcpEventGymEnv::CongestionStateSet (Ptr<TcpSocketState> tcb, const TcpSocketState::TcpCongState_t newState)
{
  NS_LOG_FUNCTION (this);
  std::string stateName = GetTcpCongStateName(newState);
  NS_LOG_INFO(Simulator::Now() << " Node: " << m_nodeId << " CongestionStateSet: " << newState << " " << stateName);

  m_calledFunc = CalledFunc_t::CONGESTION_STATE_SET;
  m_info = "CongestionStateSet";
  m_tcb = tcb;
  m_newState = newState;
}

/*
 * CwndEvent — log the congestion window event.
 * Does not trigger a Notify; used for observation context.
 */
void
TcpEventGymEnv::CwndEvent (Ptr<TcpSocketState> tcb, const TcpSocketState::TcpCAEvent_t event)
{
  NS_LOG_FUNCTION (this);
  std::string eventName = GetTcpCAEventName(event);
  NS_LOG_INFO(Simulator::Now() << " Node: " << m_nodeId << " CwndEvent: " << event << " " << eventName);

  m_calledFunc = CalledFunc_t::CWND_EVENT;
  m_info = "CwndEvent";
  m_tcb = tcb;
  m_event = event;
}


} // namespace ns3
