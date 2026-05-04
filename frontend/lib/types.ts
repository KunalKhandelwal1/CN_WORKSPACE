export interface MetricPoint {
  time: number;
  throughput_mbps?: number;
  rtt_ms?: number;
  packet_loss?: number;
}

export interface TrainingPoint {
  step: number;
  time: number;
  throughput_mbps: number;
  rtt_ms: number;
  reward: number;
  cwnd: number;
}

export interface SimConfig {
  bandwidth: number;
  delay: number;
  duration: number;
  mtu: number;
  reward: number;
  penalty: number;
  variant: string;
}

export type AlgoToggleState = {
  DRL: boolean;
  Cubic: boolean;
  NewReno: boolean;
};
