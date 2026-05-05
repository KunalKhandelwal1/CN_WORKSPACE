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

// ---- Transfer Types ----

export interface ChunkMetric {
  chunk_index: number;
  bytes_sent: number;
  latency_ms: number;
}

export interface TransferResult {
  method: string;
  file_size_bytes: number;
  total_time_ms: number;
  throughput_mbps: number;
  avg_chunk_latency_ms: number;
  min_chunk_latency_ms: number;
  max_chunk_latency_ms: number;
  chunk_count: number;
  chunk_metrics: ChunkMetric[];
}

export interface ComparisonResult {
  traditional: TransferResult;
  drl_optimized: TransferResult;
  speedup_factor: number;
  latency_reduction_pct: number;
  timestamp: string;
}

export interface SummaryStats {
  [algo: string]: {
    avg_throughput_mbps: number;
    avg_rtt_ms: number;
    max_rtt_ms: number;
    min_rtt_ms: number;
    total_packet_loss: number;
    data_points: number;
  } | {
    rtt_reduction_pct: number;
    loss_reduction_pct: number;
  };
}
