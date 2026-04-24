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

  // TcpCongestionOps methods
  virtual uint32_t GetSsThresh (Ptr<const TcpSocketState> tcb, uint32_t bytesInFlight) override;
  virtual void IncreaseWindow (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked) override;
  virtual void PktsAcked (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked, const Time& rtt) override;
  virtual void CongestionStateSet (Ptr<TcpSocketState> tcb, TcpSocketState::TcpCongState_t newState) override;
  virtual void CwndEvent (Ptr<TcpSocketState> tcb, TcpSocketState::TcpCAEvent_t event) override;
  
  virtual Ptr<TcpCongestionOps> Fork () override;

protected:
  static uint32_t m_uuidGenerator;
  uint32_t m_uuid;
  Ptr<TcpSocketBase> m_socket;
  Ptr<TcpGymEnv> m_env;

  virtual void CreateGymEnv () = 0;

  void TxTrace (Ptr<const Packet> p, const TcpHeader& h, Ptr<const TcpSocketBase> socket);
  void RxTrace (Ptr<const Packet> p, const TcpHeader& h, Ptr<const TcpSocketBase> socket);
};

class TcpRl : public TcpRlBase {
public:
  static TypeId GetTypeId (void);
  TcpRl ();
  virtual ~TcpRl ();

  virtual std::string GetName () const override;
  virtual Ptr<TcpCongestionOps> Fork () override;

protected:
  virtual void CreateGymEnv () override;

private:
  double m_reward;
  double m_penalty;
};

} // namespace ns3

#endif // TCP_RL_H
