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


} // namespace ns3
