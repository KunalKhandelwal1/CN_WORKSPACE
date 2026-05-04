#!/usr/bin/env python3
"""DQN agent for NS-3 TCP congestion control via ns3-gym."""

import argparse
import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers

sys.path.insert(0, os.path.abspath('.'))
try:
    import ns3gym
except ImportError:
    raise ImportError('ns3gym is required to run the DQN agent. Install ns3-gym and verify the Python path.')


def build_model(input_shape, output_size):
    model = models.Sequential([
        layers.Input(shape=(input_shape,)),
        layers.Dense(128, activation='relu'),
        layers.Dense(64, activation='relu'),
        layers.Dense(output_size, activation='linear')
    ])
    model.compile(optimizer=optimizers.Adam(learning_rate=1e-3), loss='mse')
    return model


def parse_arguments():
    parser = argparse.ArgumentParser(description='Train or test the TCP RL agent.')
    parser.add_argument('--mode', choices=['train', 'test'], default='train')
    parser.add_argument('--iterations', type=int, default=100)
    parser.add_argument('--steps', type=int, default=1000)
    parser.add_argument('--epsilon-start', type=float, default=1.0)
    parser.add_argument('--epsilon-end', type=float, default=0.01)
    parser.add_argument('--save-model', default='tcp_rl_model.h5')
    parser.add_argument('--load-model', default='tcp_rl_model.h5')
    parser.add_argument('--port', type=int, default=5555)
    return parser.parse_args()


def make_action(action_id, ss_thresh, cWnd):
    if action_id == 0:
        return np.array([ss_thresh, cWnd], dtype=np.float32)
    if action_id == 1:
        return np.array([ss_thresh, min(cWnd + 1500, 100000)], dtype=np.float32)
    if action_id == 2:
        return np.array([max(ss_thresh - 150, 0), max(cWnd - 150, 1)], dtype=np.float32)
    if action_id == 3:
        return np.array([ss_thresh, min(cWnd + 4000, 100000)], dtype=np.float32)
    return np.array([ss_thresh, cWnd], dtype=np.float32)


def run_agent(args):
    env = ns3gym.Ns3Env(port=args.port, debug=False)
    state_shape = env.observation_space.shape[0]
    action_size = env.action_space.n if hasattr(env.action_space, 'n') else 4
    model = build_model(state_shape, action_size)

    if args.mode == 'test':
        model.load_weights(args.load_model)
        epsilon = 0.0
    else:
        epsilon = args.epsilon_start

    gamma = 0.95
    epsilon_decay = (args.epsilon_start - args.epsilon_end) / max(args.iterations * args.steps, 1)

    for episode in range(args.iterations):
        obs = env.reset()
        state = np.array(obs, dtype=np.float32).reshape(1, -1)
        total_reward = 0.0

        for step in range(args.steps):
            if np.random.rand() < epsilon:
                action_id = np.random.randint(action_size)
            else:
                q_values = model.predict(state, verbose=0)
                action_id = np.argmax(q_values[0])

            action = make_action(action_id, state[0][0], state[0][1])
            next_obs, reward, done, info = env.step(action)
            next_state = np.array(next_obs, dtype=np.float32).reshape(1, -1)

            if args.mode == 'train':
                target = reward
                if not done:
                    future_q = model.predict(next_state, verbose=0)[0]
                    target = reward + gamma * np.max(future_q)
                target_f = model.predict(state, verbose=0)
                target_f[0][action_id] = target
                model.fit(state, target_f, epochs=1, verbose=0)

            state = next_state
            total_reward += reward
            if done:
                break

        if args.mode == 'train':
            epsilon = max(args.epsilon_end, epsilon - epsilon_decay)
            print(f'Episode {episode+1}/{args.iterations}: reward={total_reward:.2f}, epsilon={epsilon:.4f}')

    if args.mode == 'train':
        model.save(args.save_model)
        print(f'Model saved to {args.save_model}')

    env.close()


if __name__ == '__main__':
    args = parse_arguments()
    run_agent(args)
