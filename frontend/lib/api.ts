import { MetricPoint, TrainingPoint, SimConfig, ComparisonResult } from './types';

const API_BASE = 'http://localhost:8000/api';

export async function getAllMetrics(): Promise<Record<string, MetricPoint[]>> {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch all metrics", e);
    return {};
  }
}

export async function getMetrics(algo: string): Promise<MetricPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics/${algo}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error(`Failed to fetch metrics for ${algo}`, e);
    return [];
  }
}

export async function getSummaryStats(): Promise<Record<string, any>> {
  try {
    const res = await fetch(`${API_BASE}/metrics/summary`);
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch summary stats", e);
    return {};
  }
}

export async function getTrainingHistory(): Promise<TrainingPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/training`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch training history", e);
    return [];
  }
}

export async function generateCommand(config: SimConfig): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.command;
  } catch (e) {
    console.error("Failed to generate command", e);
    return '';
  }
}

export async function runTransfer(fileSizeMb: number): Promise<ComparisonResult | null> {
  try {
    const res = await fetch(`${API_BASE}/transfer/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file_size_mb: fileSizeMb })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Failed to run transfer", e);
    return null;
  }
}

export async function getTransferHistory(): Promise<ComparisonResult[]> {
  try {
    const res = await fetch(`${API_BASE}/transfer/history`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch transfer history", e);
    return [];
  }
}
