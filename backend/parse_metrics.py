#!/usr/bin/env python3
"""Parse NS-3 TCP simulation metrics and generate comparison plots."""

import os
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
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


def plot_metrics(metrics, output_dir='graphs'):
    os.makedirs(output_dir, exist_ok=True)

    plt.figure(figsize=(10, 5))
    for label, df in metrics.items():
        if df is not None:
            plt.plot(df['Time'], df['Throughput_Mbps'], label=label)
    plt.title('Throughput Comparison')
    plt.xlabel('Time (s)')
    plt.ylabel('Throughput (Mbps)')
    plt.legend()
    plt.grid(True)
    plt.savefig(os.path.join(output_dir, 'throughput_comparison.png'))
    plt.close()

    plt.figure(figsize=(10, 5))
    for label, df in metrics.items():
        if df is not None:
            plt.plot(df['Time'], df['AvgRTT_ms'], label=label)
    plt.title('RTT Comparison')
    plt.xlabel('Time (s)')
    plt.ylabel('RTT (ms)')
    plt.legend()
    plt.grid(True)
    plt.savefig(os.path.join(output_dir, 'rtt_comparison.png'))
    plt.close()

    plt.figure(figsize=(10, 5))
    for label, df in metrics.items():
        if df is not None and 'PacketLoss' in df.columns:
            plt.plot(df['Time'], df['PacketLoss'].cumsum(), label=label)
    plt.title('Cumulative Packet Loss')
    plt.xlabel('Time (s)')
    plt.ylabel('Cumulative Packet Loss')
    plt.legend()
    plt.grid(True)
    plt.savefig(os.path.join(output_dir, 'packet_loss_comparison.png'))
    plt.close()


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

    plot_metrics(metrics)
    print('Graphs written to graphs/')


if __name__ == '__main__':
    main()
