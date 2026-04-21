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
          // Implementation is simplified for this project
        }
    }
}

} // namespace ns3
