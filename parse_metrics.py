#!/usr/bin/env python3
"""Parse NS-3 TCP simulation metrics and generate comparison plots."""

import os
import pandas as pd

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

def main():
    metrics = {}
    for label, filename in RESULT_FILES.items():
        metrics[label] = parse_metrics(filename)

if __name__ == '__main__':
    main()
