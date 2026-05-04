#include "tcp-rl.h"
#include "ns3/log.h"
#include "ns3/node-list.h"
#include "ns3/tcp-l4-protocol.h"
#include "ns3/simulator.h"
#include "ns3/double.h"
#include "ns3/time.h"

namespace ns3 {

NS_LOG_COMPONENT_DEFINE ("TcpRl");

NS_OBJECT_ENSURE_REGISTERED (TcpSocketDerived);

TypeId
TcpSocketDerived::GetTypeId (void)
{
  static TypeId tid = TypeId ("ns3::TcpSocketDerived")
    .SetParent<TcpSocketBase> ()
    .SetGroupName ("Internet");
  return tid;
}

Ptr<TcpCongestionOps>
TcpSocketDerived::GetCongestionControlAlgorithm ()
{
  return m_congestionControl;
}

NS_OBJECT_ENSURE_REGISTERED (TcpRlBase);

uint32_t TcpRlBase::m_uuidGenerator = 0;

TypeId
TcpRlBase::GetTypeId (void)
{
  static TypeId tid = TypeId ("ns3::TcpRlBase")
    .SetParent<TcpCongestionOps> ()
    .SetGroupName ("Internet");
  return tid;
}

TcpRlBase::TcpRlBase ()
  : m_uuid (++m_uuidGenerator),
    m_socket (nullptr),
    m_env (nullptr)
{
}

TcpRlBase::~TcpRlBase ()
{
}

uint32_t
TcpRlBase::GetSsThresh (Ptr<const TcpSocketState> tcb, uint32_t bytesInFlight)
{
  if (!m_env)
    {
      CreateGymEnv ();
    }
  return m_env->GetSsThresh (tcb, bytesInFlight);
}

void
TcpRlBase::IncreaseWindow (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked)
{
  if (!m_env)
    {
      CreateGymEnv ();
    }
  m_env->IncreaseWindow (tcb, segmentsAcked);
}

void
TcpRlBase::PktsAcked (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked, const Time& rtt)
{
  if (!m_env)
    {
      CreateGymEnv ();
    }
  m_env->PktsAcked (tcb, segmentsAcked, rtt);
}

void
TcpRlBase::CongestionStateSet (Ptr<TcpSocketState> tcb, TcpSocketState::TcpCongState_t newState)
{
  if (!m_env)
    {
      CreateGymEnv ();
    }
  m_env->CongestionStateSet (tcb, newState);
}

void
TcpRlBase::CwndEvent (Ptr<TcpSocketState> tcb, TcpSocketState::TcpCAEvent_t event)
{
  if (!m_env)
    {
      CreateGymEnv ();
    }
  m_env->CwndEvent (tcb, event);
}

Ptr<TcpCongestionOps>
TcpRlBase::Fork ()
{
  return CopyObject<TcpRlBase> (this);
}

void
TcpRlBase::TxTrace (Ptr<const Packet> p, const TcpHeader& h, Ptr<const TcpSocketBase> socket)
{
  // TX trace implementation
}

void
TcpRlBase::RxTrace (Ptr<const Packet> p, const TcpHeader& h, Ptr<const TcpSocketBase> socket)
{
  // RX trace implementation
}

void
TcpRlBase::ConnectSocketCallbacks ()
{
  for (NodeList::Iterator i = NodeList::Begin (); i != NodeList::End (); ++i)
    {
      Ptr<Node> node = *i;
      Ptr<TcpL4Protocol> tcp = node->GetObject<TcpL4Protocol> ();
      if (tcp != nullptr)
        {
          // Iterates all nodes/sockets to find the one using this CA instance
        }
    }
}

// --------------------------------------------------------------------------
// TcpRl (Event-based)
// --------------------------------------------------------------------------

NS_OBJECT_ENSURE_REGISTERED (TcpRl);

TypeId
TcpRl::GetTypeId (void)
{
  static TypeId tid = TypeId ("ns3::TcpRl")
    .SetParent<TcpRlBase> ()
    .SetGroupName ("Internet")
    .AddConstructor<TcpRl> ()
    .AddAttribute ("Reward",
                   "Reward value",
                   DoubleValue (1.0),
                   MakeDoubleAccessor (&TcpRl::m_reward),
                   MakeDoubleChecker<double> ())
    .AddAttribute ("Penalty",
                   "Penalty value",
                   DoubleValue (-10.0),
                   MakeDoubleAccessor (&TcpRl::m_penalty),
                   MakeDoubleChecker<double> ());
  return tid;
}

TcpRl::TcpRl ()
{
}

TcpRl::~TcpRl ()
{
}

std::string
TcpRl::GetName () const
{
  return "TcpRl";
}

void
TcpRl::CreateGymEnv ()
{
  Ptr<TcpEventGymEnv> env = CreateObject<TcpEventGymEnv> ();
  env->SetUuid (m_uuid);
  env->SetReward (m_reward);
  env->SetPenalty (m_penalty);
  m_env = env;
  ConnectSocketCallbacks ();
}

Ptr<TcpCongestionOps>
TcpRl::Fork ()
{
  return CopyObject<TcpRl> (this);
}

// --------------------------------------------------------------------------
// TcpRlTimeBased (Timestep-based)
// --------------------------------------------------------------------------

NS_OBJECT_ENSURE_REGISTERED (TcpRlTimeBased);

TypeId
TcpRlTimeBased::GetTypeId (void)
{
  static TypeId tid = TypeId ("ns3::TcpRlTimeBased")
    .SetParent<TcpRlBase> ()
    .SetGroupName ("Internet")
    .AddConstructor<TcpRlTimeBased> ()
    .AddAttribute ("Duration",
                   "Duration of the environment",
                   TimeValue (Seconds (10.0)),
                   MakeTimeAccessor (&TcpRlTimeBased::m_duration),
                   MakeTimeChecker ())
    .AddAttribute ("StepTime",
                   "Step time of the environment",
                   TimeValue (MilliSeconds (100.0)),
                   MakeTimeAccessor (&TcpRlTimeBased::m_stepTime),
                   MakeTimeChecker ())
    .AddAttribute ("Reward",
                   "Reward value",
                   DoubleValue (1.0),
                   MakeDoubleAccessor (&TcpRlTimeBased::m_reward),
                   MakeDoubleChecker<double> ())
    .AddAttribute ("Penalty",
                   "Penalty value",
                   DoubleValue (-1.0),
                   MakeDoubleAccessor (&TcpRlTimeBased::m_penalty),
                   MakeDoubleChecker<double> ());
  return tid;
}

TcpRlTimeBased::TcpRlTimeBased ()
{
}

TcpRlTimeBased::~TcpRlTimeBased ()
{
}

std::string
TcpRlTimeBased::GetName () const
{
  return "TcpRlTimeBased";
}

void
TcpRlTimeBased::CreateGymEnv ()
{
  Ptr<TcpTimeStepGymEnv> env = CreateObject<TcpTimeStepGymEnv> ();
  env->SetUuid (m_uuid);
  env->SetDuration (m_duration);
  env->SetStepTime (m_stepTime);
  env->SetReward (m_reward);
  env->SetPenalty (m_penalty);
  m_env = env;
  ConnectSocketCallbacks ();
}

Ptr<TcpCongestionOps>
TcpRlTimeBased::Fork ()
{
  return CopyObject<TcpRlTimeBased> (this);
}

} // namespace ns3
