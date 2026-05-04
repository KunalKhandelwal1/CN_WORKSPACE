from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SimConfig(BaseModel):
    bandwidth: int
    delay: int
    duration: int
    mtu: int
    reward: float
    penalty: float
    variant: str

@router.post("/")
def generate_simulation_command(config: SimConfig):
    """Generates the waf run command for the given configuration."""
    
    # Map variant names to exact ns-3 class names if needed
    variant_map = {
        "DRL-TCP (Time-based)": "TcpRlTimeBased",
        "DRL-TCP (Event-based)": "TcpRl",
        "Cubic": "TcpCubic",
        "NewReno": "TcpNewReno"
    }
    
    # Default to passing the string directly if not in map
    ns3_variant = variant_map.get(config.variant, config.variant)
    
    command = (
        f'./waf --run "scratch/sim '
        f'--transport_prot={ns3_variant} '
        f'--duration={config.duration} '
        f'--bottleneck_bandwidth={config.bandwidth}Mbps '
        f'--bottleneck_delay={config.delay}ms '
        f'--mtu={config.mtu} '
        f'--reward={config.reward} '
        f'--penalty={config.penalty}"'
    )
    
    return {"command": command}
