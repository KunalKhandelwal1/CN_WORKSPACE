#!/usr/bin/env python3
"""Parse NS-3 TCP simulation metrics and generate comparison plots."""

import os
import pandas as pd
from scipy import stats

BASE_PATH = os.path.abspath('.')
RESULT_FILES = {
    'DRL': os.path.join(BASE_PATH, 'results_rl.txt'),
    'Cubic': os.path.join(BASE_PATH, 'results_cubic.txt'),
    'NewReno': os.path.join(BASE_PATH, 'results_newreno.txt'),
}

def parse_metrics(filename):
    if not os.path.exists(filename):
        print(f'Warning: missing file {filename}')
        return None

    df = pd.read_csv(filename)
    if 'Throughput' in df.columns:
        df['Throughput_Mbps'] = df['Throughput'] / 1e6
    if 'AvgRTT' in df.columns:
        df['AvgRTT_ms'] = df['AvgRTT'] * 1000.0
    return df

def compare_baseline(baseline, target, label):
    baseline_mean_throughput = baseline['Throughput_Mbps'].mean()
    target_mean_throughput = target['Throughput_Mbps'].mean()
    throughput_diff = 100.0 * (target_mean_throughput - baseline_mean_throughput) / baseline_mean_throughput

    baseline_mean_rtt = baseline['AvgRTT_ms'].mean()
    target_mean_rtt = target['AvgRTT_ms'].mean()
    rtt_diff = 100.0 * (target_mean_rtt - baseline_mean_rtt) / baseline_mean_rtt

    t_stat, p_val = stats.ttest_ind(target['Throughput_Mbps'], baseline['Throughput_Mbps'], equal_var=False)
    print(f'Comparison against {label}:')
    print(f'  Throughput change: {throughput_diff:.2f}% (p={p_val:.4f})')
    print(f'  RTT change: {rtt_diff:.2f}%')
    print('')

def main():
    metrics = {}
    for label, filename in RESULT_FILES.items():
        metrics[label] = parse_metrics(filename)

    if metrics['DRL'] is None:
        print('No DRL result file found; cannot compare.')
        return

    if metrics['Cubic'] is not None:
        compare_baseline(metrics['Cubic'], metrics['DRL'], 'Cubic')
    if metrics['NewReno'] is not None:
        compare_baseline(metrics['NewReno'], metrics['DRL'], 'NewReno')

if __name__ == '__main__':
    main()
