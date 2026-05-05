from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from api.routes import metrics, training, simulation, transfer
import asyncio
import zmq
import zmq.asyncio

app = FastAPI(title="DRL-TCP Simulation API")

ctx = zmq.asyncio.Context()
sub_socket = ctx.socket(zmq.SUB)
sub_socket.connect("tcp://host.docker.internal:5555")
sub_socket.setsockopt_string(zmq.SUBSCRIBE, "")

active_connections = []

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(zmq_listener())

async def zmq_listener():
    while True:
        try:
            msg = await sub_socket.recv_json()
            for connection in list(active_connections):
                try:
                    await connection.send_json(msg)
                except Exception:
                    active_connections.remove(connection)
        except Exception:
            await asyncio.sleep(0.1)

@app.websocket("/api/live")
async def live_telemetry(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/api/metrics", tags=["Metrics"])
app.include_router(training.router, prefix="/api/training", tags=["Training"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["Simulation"])
app.include_router(transfer.router, prefix="/api/transfer", tags=["Transfer"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
