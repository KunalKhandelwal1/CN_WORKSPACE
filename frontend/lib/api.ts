import { MetricPoint, TrainingPoint, SimConfig } from './types';

const API_BASE = 'http://localhost:8001/api';

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
