#ifndef TCP_RL_H
#define TCP_RL_H

#include "ns3/tcp-congestion-ops.h"
#include "ns3/tcp-socket-base.h"
#include "ns3/opengym-module.h"
#include "tcp-rl-env.h"

namespace ns3 {

class TcpSocketDerived : public TcpSocketBase {
public:
  static TypeId GetTypeId (void);
  Ptr<TcpCongestionOps> GetCongestionControlAlgorithm ();
};

class TcpRlBase : public TcpCongestionOps {
public:
  static TypeId GetTypeId (void);
  TcpRlBase ();
  virtual ~TcpRlBase ();

  void ConnectSocketCallbacks ();

protected:
  static uint32_t m_uuidGenerator;
  uint32_t m_uuid;
  Ptr<TcpSocketBase> m_socket;
  Ptr<TcpGymEnv> m_env;

  void TxTrace (Ptr<const Packet> p, const TcpHeader& h, Ptr<const TcpSocketBase> socket);
  void RxTrace (Ptr<const Packet> p, const TcpHeader& h, Ptr<const TcpSocketBase> socket);
};

} // namespace ns3

#endif // TCP_RL_H
