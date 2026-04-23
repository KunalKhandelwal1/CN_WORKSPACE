#include "tcp-rl.h"
#include "ns3/log.h"
#include "ns3/node-list.h"
#include "ns3/tcp-l4-protocol.h"
#include "ns3/simulator.h"

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

} // namespace ns3
