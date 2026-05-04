"""Base TCP agent wrapper classes for RL and analysis."""

class Tcp:
    """Base TCP agent that stores observation and action spaces."""

    def __init__(self, observation_space=None, action_space=None):
        self.observation_space = observation_space
        self.action_space = action_space

    def get_action(self, observation):
        raise NotImplementedError('get_action must be implemented by subclasses')


class TcpEventBased (Tcp):
    """Event-based TCP agent for per-packet TCP state observations."""

    def get_action(self, observation):
        # Observation fields:
        # [uuid, envType, simTime, nodeId, ssThresh, cWnd,
        #  segmentSize, segmentsAcked, bytesInFlight, lastRtt,
        #  minRtt, calledFunction, caState, caEvent, ecnState]
        ss_thresh = observation[4]
        c_wnd = observation[5]
        return [ss_thresh + 1500, c_wnd + 1500]


class TcpTimeBased (Tcp):
    """Time-step based TCP agent for aggregated interval observations."""

    def get_action(self, observation):
        # Observation fields:
        # [uuid, envType, simTime, nodeId, ssThresh, cWnd,
        #  segmentSize, segmentsAcked, bytesInFlight, lastRtt,
        #  minRtt, avgRtt, avgBytesInFlight, avgSegmentsAcked,
        #  throughput, eventCount]
        ss_thresh = observation[4]
        c_wnd = observation[5]
        return [ss_thresh, c_wnd + 1500]
