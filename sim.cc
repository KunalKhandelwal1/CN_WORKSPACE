/* -*-  Mode: C++; c-file-style: "gnu"; indent-tabs-mode:nil; -*- */
/*
 * Deep Reinforcement Learning based TCP Congestion Control
 * NS-3 Network Simulation Script
 *
 * This simulation builds a dumbbell topology, configures TCP with
 * either traditional (NewReno, Cubic) or RL-based congestion control,
 * runs bulk data transfers, and collects performance metrics via
 * FlowMonitor for comparative analysis.
 *
 * Topology:
 *
 *   Left Leafs (Senders)                        Right Leafs (Receivers)
 *           |            \                      /        |
 *           |             \    bottleneck      /         |
 *           |              R0--------------R1            |
 *           |             /                  \           |
 *           |   access   /                    \  access  |
 *           N -----------                      ----------N
 */

// NS-3 core module includes
#include "ns3/core-module.h"
#include "ns3/network-module.h"
#include "ns3/internet-module.h"
#include "ns3/point-to-point-module.h"
#include "ns3/point-to-point-layout-module.h"
#include "ns3/applications-module.h"
#include "ns3/error-model.h"
#include "ns3/tcp-header.h"
#include "ns3/flow-monitor-module.h"
#include "ns3/traffic-control-module.h"
#include "ns3/opengym-module.h"
#include "tcp-rl.h"

#include <fstream>
#include <string>
#include <map>
#include <vector>
#include <iomanip>

using namespace ns3;

NS_LOG_COMPONENT_DEFINE ("DrlTcpSimulation");

// Global packet counter vector for tracking received packets per sink
static std::vector<uint32_t> rxPkts;

/**
 * Callback to count received packets at each sink node
 * @param sinkId  Index of the sink node
 * @param packet  Pointer to the received packet
 * @param srcAddr Source address of the packet
 */
static void
CountRxPkts (uint32_t sinkId, Ptr<const Packet> packet, const Address & srcAddr)
{
  rxPkts[sinkId]++;
}

/**
 * Performance metrics structure for tracking simulation statistics
 * over each measurement interval
 */
struct PerformanceMetrics
{
  double time;        // Simulation time at measurement point (seconds)
  double throughput;  // Throughput in bits per second
  double avgRtt;      // Average round-trip time in seconds
  double packetLoss;  // Number of lost packets in this interval
  double nep;         // Network Efficiency Parameter (tx/rx ratio)
  double wbi;         // Waste Bandwidth Index (waste ratio)
};

// Global storage for collected metrics
static std::vector<PerformanceMetrics> g_metricsHistory;

// ============================================================================
// Main simulation function
// ============================================================================

int
main (int argc, char *argv[])
{
  // ========================================================================
  // Simulation parameters
  // ========================================================================

  // OpenGym interface parameters
  uint32_t openGymPort = 5555;
  double tcpEnvTimeStep = 0.1;

  // Topology parameters
  uint32_t nLeaf = 1;
  std::string transport_prot = "TcpRlTimeBased";

  // Link parameters
  std::string bottleneck_bandwidth = "2Mbps";
  std::string bottleneck_delay = "10ms";
  std::string access_bandwidth = "10Mbps";
  std::string access_delay = "20ms";

  // Simulation parameters
  double duration = 10.0;
  uint32_t mtu_bytes = 400;
  uint64_t data_mbytes = 0;
  uint32_t run = 0;
  bool sack = true;
  std::string recovery = "ns3::TcpClassicRecovery";
  std::string queue_disc_type = "ns3::PfifoFastQueueDisc";

  // RL agent reward and penalty parameters
  double rew = 1.0;
  double pen = -0.5;

  // Result file configuration
  std::string resultFilePath = "/home/aglamazlarefe/ns-allinone-3.35/ns-3.35/contrib/opengym/examples/TCP-RL";

  // ========================================================================
  // Command-line argument parsing
  // ========================================================================

  CommandLine cmd;
  // OpenGym interface parameters
  cmd.AddValue ("openGymPort", "Port number for OpenGym env. Default: 5555", openGymPort);
  cmd.AddValue ("simSeed", "Seed for random generator. Default: 0", run);
  cmd.AddValue ("envTimeStep", "Time step interval for time-based TCP env [s]. Default: 0.1s", tcpEnvTimeStep);
  // Topology and protocol parameters
  cmd.AddValue ("nLeaf", "Number of left and right side leaf nodes", nLeaf);
  cmd.AddValue ("transport_prot", "Transport protocol to use: TcpNewReno, "
                "TcpCubic, TcpRl, TcpRlTimeBased", transport_prot);
  cmd.AddValue ("duration", "Time to allow flows to run in seconds", duration);
  // Link parameters
  cmd.AddValue ("bottleneck_bandwidth", "Bottleneck link bandwidth", bottleneck_bandwidth);
  cmd.AddValue ("bottleneck_delay", "Bottleneck link delay", bottleneck_delay);
  cmd.AddValue ("access_bandwidth", "Access link bandwidth", access_bandwidth);
  cmd.AddValue ("access_delay", "Access link delay", access_delay);
  cmd.AddValue ("mtu", "Size of IP packets to send in bytes", mtu_bytes);
  cmd.AddValue ("data", "Number of Megabytes of data to transmit (0 = unlimited)", data_mbytes);
  // TCP parameters
  cmd.AddValue ("sack", "Enable or disable SACK option", sack);
  cmd.AddValue ("recovery", "Recovery algorithm type", recovery);
  cmd.AddValue ("queue_disc_type", "Queue disc type for gateway", queue_disc_type);
  // RL parameters
  cmd.AddValue ("reward", "Agent reward value", rew);
  cmd.AddValue ("penalty", "Agent penalty value", pen);
  cmd.Parse (argc, argv);

  // Prepend ns3:: namespace to transport protocol name
  transport_prot = std::string ("ns3::") + transport_prot;

  // Set random seed for reproducibility
  SeedManager::SetSeed (1);
  SeedManager::SetRun (run);

  // Log simulation parameters
  NS_LOG_UNCOND ("=== DRL-TCP Simulation Parameters ===");
  NS_LOG_UNCOND ("--transport_prot: " << transport_prot);
  NS_LOG_UNCOND ("--duration: " << duration << "s");
  NS_LOG_UNCOND ("--bottleneck: " << bottleneck_bandwidth << " / " << bottleneck_delay);
  NS_LOG_UNCOND ("--access: " << access_bandwidth << " / " << access_delay);
  NS_LOG_UNCOND ("--mtu: " << mtu_bytes << " bytes");
  NS_LOG_UNCOND ("--reward: " << rew << " / penalty: " << pen);

  if (transport_prot.compare ("ns3::TcpRl") == 0 ||
      transport_prot.compare ("ns3::TcpRlTimeBased") == 0)
    {
      NS_LOG_UNCOND ("--openGymPort: " << openGymPort);
    }
  else
    {
      NS_LOG_UNCOND ("--openGymPort: No OpenGym (baseline algorithm)");
    }

  // ========================================================================
  // OpenGym interface and TCP configuration
  // ========================================================================

  // Create the OpenGym interface (must be created before anything else)
  Ptr<OpenGymInterface> openGymInterface;

  if (transport_prot.compare ("ns3::TcpRl") == 0)
    {
      openGymInterface = OpenGymInterface::Get (openGymPort);
      // Configure event-based RL agent parameters
      Config::SetDefault ("ns3::TcpRl::Reward", DoubleValue (2.0));
      Config::SetDefault ("ns3::TcpRl::Penalty", DoubleValue (-30.0));
    }

  if (transport_prot.compare ("ns3::TcpRlTimeBased") == 0)
    {
      openGymInterface = OpenGymInterface::Get (openGymPort);
      // Configure timestep-based RL agent parameters
      Config::SetDefault ("ns3::TcpRlTimeBased::StepTime", TimeValue (Seconds (tcpEnvTimeStep)));
      Config::SetDefault ("ns3::TcpRlTimeBased::Duration", TimeValue (Seconds (duration)));
      Config::SetDefault ("ns3::TcpRlTimeBased::Reward", DoubleValue (rew));
      Config::SetDefault ("ns3::TcpRlTimeBased::Penalty", DoubleValue (pen));
    }

  // Calculate the Application Data Unit (ADU) size
  // ADU = MTU - 20 bytes (extra) - IP header - TCP header
  Header* temp_header = new Ipv4Header ();
  uint32_t ip_header = temp_header->GetSerializedSize ();
  NS_LOG_LOGIC ("IP Header size is: " << ip_header);
  delete temp_header;

  temp_header = new TcpHeader ();
  uint32_t tcp_header = temp_header->GetSerializedSize ();
  NS_LOG_LOGIC ("TCP Header size is: " << tcp_header);
  delete temp_header;

  uint32_t tcp_adu_size = mtu_bytes - 20 - (ip_header + tcp_header);
  NS_LOG_LOGIC ("TCP ADU size is: " << tcp_adu_size);

  // Set simulation start and stop times
  double start_time = 0.1;
  double stop_time = start_time + duration;

  // Configure TCP socket parameters
  // 4 MB send and receive buffers (1 << 22 = 4194304 bytes)
  Config::SetDefault ("ns3::TcpSocket::RcvBufSize", UintegerValue (1 << 22));
  Config::SetDefault ("ns3::TcpSocket::SndBufSize", UintegerValue (1 << 22));

  // Enable SACK (Selective Acknowledgment)
  Config::SetDefault ("ns3::TcpSocketBase::Sack", BooleanValue (sack));

  // Delayed ACK count: send ACK after every 2 packets
  Config::SetDefault ("ns3::TcpSocket::DelAckCount", UintegerValue (2));

  // Set TCP recovery algorithm to classic recovery
  Config::SetDefault ("ns3::TcpL4Protocol::RecoveryType",
                      TypeIdValue (TypeId::LookupByName (recovery)));

  // Select the TCP congestion control variant
  if (transport_prot.compare ("ns3::TcpWestwoodPlus") == 0)
    {
      Config::SetDefault ("ns3::TcpL4Protocol::SocketType",
                          TypeIdValue (TcpWestwood::GetTypeId ()));
      Config::SetDefault ("ns3::TcpWestwood::ProtocolType",
                          EnumValue (TcpWestwood::WESTWOODPLUS));
    }
  else
    {
      TypeId tcpTid;
      NS_ABORT_MSG_UNLESS (TypeId::LookupByNameFailSafe (transport_prot, &tcpTid),
                           "TypeId " << transport_prot << " not found");
      Config::SetDefault ("ns3::TcpL4Protocol::SocketType",
                          TypeIdValue (TypeId::LookupByName (transport_prot)));
    }

  // TODO: Build topology, install applications, add FlowMonitor

  // Notify OpenGym interface that simulation has ended
  if (transport_prot.compare ("ns3::TcpRl") == 0 ||
      transport_prot.compare ("ns3::TcpRlTimeBased") == 0)
    {
      openGymInterface->NotifySimulationEnd ();
    }

  Simulator::Destroy ();
  return 0;
}
